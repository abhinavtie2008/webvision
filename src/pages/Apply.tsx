import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useLang } from '../i18n';
import { useDocumentTitle } from '../hooks';
import { ageFromDob, fileSize, formatCurrency, formatDate, formatDay, formatDayNumber, formatMonth, formatTimeAgo, formatWeekday, luhnValid } from '../format';
import { rememberApplication } from '../storage';
import type { Application, DocumentItem, Draft, Slot, SlotsResponse } from '../types';
import { Icon } from '../components/Icon';
import { Badge, ErrorBlock, LoadingBlock, Spinner, StatusPill } from '../components/ui';

const STEP_KEYS = ['wizard.step1', 'wizard.step2', 'wizard.step3', 'wizard.step4', 'wizard.step5', 'wizard.step6', 'wizard.step7'];
const TOTAL_STEPS = STEP_KEYS.length;

const CATEGORY_KEYS = ['general', 'diplomat', 'foreigner', 'oci', 'divyang', 'repatriate', 'refugee', 'exServicemen'];
const HISTORY_OPTIONS = [
  { value: 'none', label: 'history.none', desc: 'history.noneDesc' },
  { value: 'dl', label: 'history.dl', desc: 'history.dlDesc' },
  { value: 'll', label: 'history.ll', desc: 'history.llDesc' },
];
const CLASS_OPTIONS = [
  { value: 'LMV', label: 'class.LMV', desc: 'class.LMVDesc' },
  { value: 'MCWG', label: 'class.MCWG', desc: 'class.MCWGDesc' },
  { value: 'MCWOG', label: 'class.MCWOG', desc: 'class.MCWOGDesc' },
];

function newKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function stepForStatus(status: Application['status'], requested: number | null): number {
  if (status === 'DRAFT') return requested && requested >= 1 && requested <= 4 ? requested : 1;
  if (status === 'AWAITING_PAYMENT') return 5;
  if (status === 'PAID') return 6;
  return 7;
}

function validateDraftFields(step: number, draft: Draft, documents: DocumentItem[], service: Application['service']): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!draft.category || !CATEGORY_KEYS.includes(draft.category)) errors.category = 'CATEGORY_INVALID';
    if (!draft.licenceHistory || !['none', 'dl', 'll'].includes(draft.licenceHistory)) errors.licenceHistory = 'HISTORY_INVALID';
    if (!draft.vehicleClass || draft.vehicleClass.length === 0) errors.vehicleClass = 'VEHICLE_CLASS_REQUIRED';
  }
  if (step === 2) {
    if (!draft.fullName?.trim()) errors.fullName = 'FULL_NAME_REQUIRED';
    else if (!/^[\p{L} .'-]{2,80}$/u.test(draft.fullName.trim())) errors.fullName = 'FULL_NAME_INVALID';
    if (!draft.dob) errors.dob = 'DOB_REQUIRED';
    else {
      const age = ageFromDob(draft.dob);
      const needsAdult = (draft.vehicleClass ?? []).some((value) => value !== 'MCWOG');
      if (age < 0) errors.dob = 'DOB_INVALID';
      else if (age > 100 || age < 16 || (needsAdult && age < 18)) errors.dob = 'DOB_TOO_YOUNG';
    }
    if (!draft.gender) errors.gender = 'GENDER_REQUIRED';
    if (!draft.mobile?.trim()) errors.mobile = 'MOBILE_REQUIRED';
    else if (!/^[6-9]\d{9}$/.test(draft.mobile.trim())) errors.mobile = 'MOBILE_INVALID';
    if (draft.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) errors.email = 'EMAIL_INVALID';
    if (!draft.addressLine?.trim()) errors.addressLine = 'ADDRESS_REQUIRED';
    else if (draft.addressLine.trim().length < 5) errors.addressLine = 'ADDRESS_TOO_SHORT';
    if (!draft.city?.trim()) errors.city = 'CITY_REQUIRED';
    if (!draft.state) errors.state = 'STATE_REQUIRED';
    if (!draft.pincode?.trim()) errors.pincode = 'PINCODE_REQUIRED';
    else if (!/^\d{6}$/.test(draft.pincode.trim())) errors.pincode = 'PINCODE_INVALID';
  }
  if (step === 3) {
    const uploaded = new Set(documents.map((doc) => doc.kind));
    for (const doc of service.documents) {
      if (doc.required && !uploaded.has(doc.key)) errors[`document_${doc.key}`] = 'DOCUMENT_REQUIRED';
    }
  }
  if (step === 4) {
    if (draft.declaration !== true) errors.declaration = 'DECLARATION_REQUIRED';
  }
  return errors;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required ? <span className="field__req" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="field__hint" id={`${id}-hint`}>{hint}</p> : null}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          <Icon name="alertCircle" size={15} /> {error}
        </p>
      ) : null}
    </div>
  );
}

export function Apply() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, L, lang, errorText } = useLang();

  const [application, setApplication] = useState<Application | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const draftRef = useRef<Draft>({});
  const versionRef = useRef(1);
  const lastSavedRef = useRef('');
  const readyRef = useRef(false);
  const saveSignalRef = useRef(0);
  const [saveSignal, setSaveSignal] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(application ? L(application.service.title) : t('wizard.loading'));

  const applyApplication = useCallback(
    (next: Application) => {
      setApplication(next);
      setDraft(next.draft);
      draftRef.current = next.draft;
      versionRef.current = next.version;
      lastSavedRef.current = JSON.stringify(next.draft);
      readyRef.current = true;
      rememberApplication({
        id: next.id,
        reference: next.reference,
        serviceSlug: next.service.slug,
        updatedAt: next.updatedAt,
      });
    },
    [],
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [app, meta] = await Promise.all([api.application(id), api.meta()]);
      setStates(meta.states);
      applyApplication(app);
      const requested = Number(searchParams.get('step'));
      setStep(stepForStatus(app.status, Number.isInteger(requested) ? requested : null));
    } catch (cause) {
      setLoadError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
    } finally {
      setLoading(false);
    }
  }, [id, applyApplication, errorText, searchParams]);

  useEffect(() => {
    void load();
    // Load once per application id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep the latest draft available to the save queue without re-rendering.
  draftRef.current = draft;

  // Debounced autosave for drafts. Version numbers catch edits from another tab.
  useEffect(() => {
    if (!application || application.status !== 'DRAFT') return;
    const serialised = JSON.stringify(draft);
    if (!readyRef.current) {
      readyRef.current = true;
      lastSavedRef.current = serialised;
      return;
    }
    if (serialised === lastSavedRef.current) return;
    setSavingState('saving');
    const timer = setTimeout(async () => {
      try {
        const result = await api.saveDraft(id, draftRef.current, versionRef.current);
        versionRef.current = result.version;
        lastSavedRef.current = JSON.stringify(result.draft);
        setSavingState('saved');
        setSavedAt(new Date().toISOString());
        setConflict(false);
        if (JSON.stringify(draftRef.current) !== lastSavedRef.current) {
          saveSignalRef.current += 1;
          setSaveSignal(saveSignalRef.current);
        }
      } catch (cause) {
        if (cause instanceof ApiError && cause.code === 'VERSION_CONFLICT') setConflict(true);
        setSavingState('error');
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [draft, application, id, saveSignal]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) summaryRef.current?.focus();
  }, [fieldErrors]);

  const setField = useCallback((key: keyof Draft, value: unknown) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  function goToStep(next: number) {
    setFieldErrors({});
    setFormError(null);
    setStep(next);
    window.history.replaceState(null, '', `/apply/${id}?step=${next}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async function flushDraft() {
    if (!application || application.status !== 'DRAFT') return;
    const serialised = JSON.stringify(draftRef.current);
    if (serialised === lastSavedRef.current) return;
    const result = await api.saveDraft(id, draftRef.current, versionRef.current);
    versionRef.current = result.version;
    lastSavedRef.current = JSON.stringify(result.draft);
    setSavingState('saved');
    setSavedAt(new Date().toISOString());
  }

  async function saveAndExit() {
    try {
      await flushDraft();
    } catch {
      // Navigating away is still safe; the next save will retry.
    }
    if (application) navigate(`/status/${application.reference}`);
  }

  async function continueStep() {
    if (!application) return;
    setFormError(null);
    const errors = validateDraftFields(step, draft, application.documents, application.service);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (step < 4) {
      goToStep(step + 1);
      return;
    }
    if (step === 4) {
      await submitApplication();
    }
  }

  async function submitApplication() {
    if (!application || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await flushDraft();
      const next = await api.submit(id);
      applyApplication(next);
      setSavingState('saved');
      goToStep(5);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'VALIDATION_FAILED' && cause.fields) {
        const keys = Object.keys(cause.fields);
        let target = 2;
        if (keys.some((key) => key.startsWith('document_'))) target = 3;
        else if (keys.includes('category') || keys.includes('licenceHistory') || keys.includes('vehicleClass')) target = 1;
        else if (keys.includes('declaration')) target = 4;
        if (target !== step) goToStep(target);
        setFieldErrors(cause.fields);
      } else if (cause instanceof ApiError && cause.code === 'VERSION_CONFLICT') {
        setConflict(true);
      } else {
        setFormError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument(kind: string, file: File) {
    if (!application) return;
    const isPhoto = kind === 'photo' || kind === 'signature';
    const allowed = isPhoto ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'application/pdf'];
    const limit = isPhoto ? 1024 * 1024 : 2 * 1024 * 1024;
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[`document_${kind}`];
      return next;
    });
    if (!allowed.includes(file.type)) {
      setFieldErrors((previous) => ({ ...previous, [`document_${kind}`]: 'DOCUMENT_TYPE_INVALID' }));
      return;
    }
    if (file.size > limit) {
      setFieldErrors((previous) => ({ ...previous, [`document_${kind}`]: 'DOCUMENT_TOO_LARGE' }));
      return;
    }
    setUploadingKind(kind);
    try {
      const dataUrl = await readFile(file);
      const uploaded = await api.uploadDocument(id, kind, file.name, dataUrl);
      setApplication((previous) => {
        if (!previous) return previous;
        const exists = previous.documents.some((doc) => doc.kind === uploaded.kind);
        const documents = exists
          ? previous.documents.map((doc) => (doc.kind === uploaded.kind ? { ...doc, ...uploaded } : doc))
          : [...previous.documents, { ...uploaded }];
        return { ...previous, documents };
      });
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'NETWORK';
      setFieldErrors((previous) => ({ ...previous, [`document_${kind}`]: code }));
    } finally {
      setUploadingKind(null);
    }
  }

  async function removeDocument(doc: DocumentItem) {
    if (!application) return;
    try {
      await api.deleteDocument(id, doc.id);
      setApplication((previous) =>
        previous ? { ...previous, documents: previous.documents.filter((item) => item.id !== doc.id) } : previous,
      );
    } catch (cause) {
      setFormError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
    }
  }

  function copyReference() {
    if (!application) return;
    void navigator.clipboard?.writeText(application.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const docError = (kind: string) => (fieldErrors[`document_${kind}`] ? errorText(fieldErrors[`document_${kind}`]) : undefined);

  const summaryItems = useMemo(() => {
    if (!application) return [];
    return Object.entries(fieldErrors).map(([field, code]) => ({
      field,
      message: errorText(code),
    }));
  }, [fieldErrors, errorText, application]);

  if (loading) {
    return (
      <div className="container page narrow">
        <LoadingBlock label={t('wizard.loading')} />
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="container page narrow">
        <ErrorBlock message={loadError ?? t('wizard.notFound')} onRetry={() => void load()} />
        <Link to="/" className="btn btn--ghost">{t('common.backHome')}</Link>
      </div>
    );
  }

  const service = application.service;
  const isDraft = application.status === 'DRAFT';
  const isLocked = !isDraft;
  const stepTitle = t(STEP_KEYS[step - 1]);
  const saveLabel =
    savingState === 'saving'
      ? t('wizard.saving')
      : savingState === 'error'
        ? t('wizard.saveError')
        : savedAt
          ? t('wizard.savedAt', { time: formatTimeAgo(savedAt, lang) })
          : '';
  const completedThrough =
    application.status === 'DRAFT' ? step - 1 : application.status === 'AWAITING_PAYMENT' ? 4 : application.status === 'PAID' ? 5 : 6;

  return (
    <div className="container page wizard">
      <div className="wizard__topline">
        <Link to={`/status/${application.reference}`} className="link-button">
          <Icon name="arrowLeft" size={16} /> {t('wizard.backToStatus')}
        </Link>
        <span className="wizard__reference">
          {t('wizard.reference')}: <strong>{application.reference}</strong>
        </span>
      </div>

      <header className="wizard__head">
        <div>
          <p className="eyebrow">{L(service.title)}</p>
          <h1>{step === 7 ? t('step7.title') : stepTitle}</h1>
          <div className="wizard__meta">
            <StatusPill status={application.status} />
            <span className="wizard__save" aria-live="polite">
              {savingState === 'saving' ? <Spinner /> : null}
              {savingState === 'saved' && !saveLabel.includes('not saved') ? <Icon name="check" size={15} /> : null}
              {saveLabel}
            </span>
          </div>
        </div>
        <div className="wizard__head-actions">
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => void saveAndExit()}>
            {t('wizard.saveExit')} <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </header>

      <p className="demo-note">
        <Icon name="info" size={16} /> {t('wizard.demoNote')}
      </p>

      <nav className="stepper" aria-label={t('wizard.stepProgress', { n: step, total: TOTAL_STEPS })}>
        {STEP_KEYS.map((key, index) => {
          const number = index + 1;
          const done = number <= completedThrough;
          const current = number === step;
          const clickable = done && number <= 4 && isDraft;
          return (
            <button
              key={key}
              type="button"
              className={`stepper__item ${done ? 'stepper__item--done' : ''} ${current ? 'stepper__item--current' : ''}`}
              aria-current={current ? 'step' : undefined}
              onClick={clickable ? () => goToStep(number) : undefined}
              disabled={!clickable}
            >
              <span className="stepper__dot" aria-hidden="true">
                {done ? <Icon name="check" size={13} /> : number}
              </span>
              <span className="stepper__label">{t(key)}</span>
            </button>
          );
        })}
      </nav>

      {conflict ? (
        <div className="banner banner--warning" role="alert">
          <strong>{t('wizard.conflictTitle')}</strong> {t('wizard.conflictBody')}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void load()}>
            {t('wizard.reload')}
          </button>
        </div>
      ) : null}

      {formError ? <ErrorBlock message={formError} /> : null}

      {summaryItems.length > 0 ? (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <h2>{t('wizard.errorsTitle')}</h2>
          <p>{t(summaryItems.length === 1 ? 'wizard.errorsCountOne' : 'wizard.errorsCount', { n: summaryItems.length })}</p>
          <ul>
            {summaryItems.map((item) => (
              <li key={item.field}>
                <a href={`#field-${item.field.replace('document_', 'doc-')}`}>{item.message}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="wizard__panel">
        {step === 1 ? (
          <EligibilityStep
            draft={draft}
            setField={setField}
            errors={fieldErrors}
            errorText={errorText}
            eligibility={service.eligibility}
            t={t}
            L={L}
          />
        ) : null}

        {step === 2 ? (
          <DetailsStep draft={draft} setField={setField} errors={fieldErrors} errorText={errorText} states={states} t={t} />
        ) : null}

        {step === 3 ? (
          <DocumentsStep
            application={application}
            uploadingKind={uploadingKind}
            docError={docError}
            onUpload={uploadDocument}
            onRemove={removeDocument}
            t={t}
            L={L}
            lang={lang}
          />
        ) : null}

        {step === 4 ? (
          <ReviewStep
            application={application}
            draft={draft}
            setField={setField}
            errors={fieldErrors}
            errorText={errorText}
            onEdit={goToStep}
            t={t}
            L={L}
            lang={lang}
          />
        ) : null}

        {step === 5 ? (
          <PaymentStep
            application={application}
            draft={draft}
            lang={lang}
            t={t}
            errorText={errorText}
            onPaid={(next) => {
              applyApplication(next);
              goToStep(6);
            }}
          />
        ) : null}

        {step === 6 ? (
          <SlotStep
            application={application}
            lang={lang}
            t={t}
            L={L}
            errorText={errorText}
            onBooked={(next) => {
              applyApplication(next);
              goToStep(7);
            }}
            onSkip={() => goToStep(7)}
          />
        ) : null}

        {step === 7 ? (
          <DoneStep application={application} lang={lang} t={t} copied={copied} onCopy={copyReference} />
        ) : null}
      </div>

      {step < 4 && isDraft ? (
        <div className="wizard__actions">
          <button type="button" className="btn btn--quiet" onClick={() => (step === 1 ? void saveAndExit() : goToStep(step - 1))}>
            <Icon name="arrowLeft" size={17} /> {step === 1 ? t('wizard.backToStatus') : t('wizard.back')}
          </button>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => void continueStep()}>
            {t('wizard.continue')} <Icon name="arrowRight" size={18} />
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard__actions">
          <button type="button" className="btn btn--quiet" onClick={() => goToStep(3)} disabled={busy}>
            <Icon name="arrowLeft" size={17} /> {t('wizard.back')}
          </button>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => void continueStep()} disabled={busy}>
            {busy ? t('wizard.submitting') : t('step4.submit')} {!busy ? <Icon name="arrowRight" size={18} /> : null}
          </button>
        </div>
      ) : null}

      {isLocked && step < 5 ? (
        <div className="banner banner--info" role="status">
          {t('wizard.locked')} <Link to={`/status/${application.reference}`} className="link-button">{t('wizard.backToStatus')}</Link>
        </div>
      ) : null}
    </div>
  );
}

function EligibilityStep({
  draft,
  setField,
  errors,
  errorText,
  eligibility,
  t,
  L,
}: {
  draft: Draft;
  setField: (key: keyof Draft, value: unknown) => void;
  errors: Record<string, string>;
  errorText: (code: string) => string;
  eligibility: { en: string; hi: string }[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (value: { en: string; hi: string } | undefined) => string;
}) {
  function toggleClass(value: string) {
    const current = draft.vehicleClass ?? [];
    setField('vehicleClass', current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  return (
    <section aria-labelledby="step1-heading">
      <h2 id="step1-heading" className="wizard__panel-title">{t('step1.title')}</h2>
      <p className="wizard__panel-desc">{t('step1.desc')}</p>

      <div className="form-grid">
        <FieldShell
          id="field-category"
          label={t('step1.category')}
          hint={t('step1.categoryHint')}
          error={errors.category ? errorText(errors.category) : undefined}
          required
        >
          <select
            id="field-category"
            value={draft.category ?? 'general'}
            onChange={(event) => setField('category', event.target.value)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'field-category-error' : undefined}
          >
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>{t(`cat.${key}`)}</option>
            ))}
          </select>
        </FieldShell>
      </div>

      <fieldset className="field fieldset">
        <legend className="field__label">{t('step1.history')}</legend>
        <div className="choice-stack">
          {HISTORY_OPTIONS.map((option) => (
            <label key={option.value} className={`choice-card ${draft.licenceHistory === option.value ? 'choice-card--active' : ''}`}>
              <input
                type="radio"
                name="licenceHistory"
                value={option.value}
                checked={draft.licenceHistory === option.value}
                onChange={() => setField('licenceHistory', option.value)}
              />
              <span>
                <strong>{t(option.label)}</strong>
                <span className="choice-card__desc">{t(option.desc)}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.licenceHistory ? <p className="field__error"><Icon name="alertCircle" size={15} /> {errorText(errors.licenceHistory)}</p> : null}
      </fieldset>

      <fieldset className="field fieldset">
        <legend className="field__label">{t('step1.classes')}</legend>
        <p className="field__hint">{t('step1.classesHint')}</p>
        <div className="choice-stack">
          {CLASS_OPTIONS.map((option) => (
            <label key={option.value} className={`choice-card ${(draft.vehicleClass ?? []).includes(option.value) ? 'choice-card--active' : ''}`}>
              <input
                type="checkbox"
                name="vehicleClass"
                value={option.value}
                checked={(draft.vehicleClass ?? []).includes(option.value)}
                onChange={() => toggleClass(option.value)}
              />
              <span>
                <strong>{t(option.label)}</strong>
                <span className="choice-card__desc">{t(option.desc)}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.vehicleClass ? <p className="field__error"><Icon name="alertCircle" size={15} /> {errorText(errors.vehicleClass)}</p> : null}
      </fieldset>

      {eligibility.length > 0 ? (
        <div className="callout">
          <h3>{t('step1.eligibility')}</h3>
          <ul className="check-list">
            {eligibility.map((item, index) => (
              <li key={index}>
                <span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span>
                <span>{L(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="field__hint">{t('step1.note')}</p>
    </section>
  );
}

function DetailsStep({
  draft,
  setField,
  errors,
  errorText,
  states,
  t,
}: {
  draft: Draft;
  setField: (key: keyof Draft, value: unknown) => void;
  errors: Record<string, string>;
  errorText: (code: string) => string;
  states: { code: string; name: string }[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const inputProps = (name: keyof Draft) => ({
    id: `field-${name}`,
    value: String(draft[name] ?? ''),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setField(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `field-${name}-error` : undefined,
  });

  return (
    <section aria-labelledby="step2-heading">
      <h2 id="step2-heading" className="wizard__panel-title">{t('step2.title')}</h2>
      <p className="wizard__panel-desc">{t('step2.desc')}</p>

      <div className="form-grid">
        <FieldShell id="field-fullName" label={t('step2.fullName')} hint={t('step2.fullNameHint')} error={errors.fullName ? errorText(errors.fullName) : undefined} required>
          <input {...inputProps('fullName')} autoComplete="name" />
        </FieldShell>

        <FieldShell id="field-dob" label={t('step2.dob')} error={errors.dob ? errorText(errors.dob) : undefined} required>
          <input {...inputProps('dob')} type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} />
        </FieldShell>

        <FieldShell id="field-gender" label={t('step2.gender')} error={errors.gender ? errorText(errors.gender) : undefined} required>
          <select {...inputProps('gender')}>
            <option value="">{t('step2.genderSelect')}</option>
            <option value="female">{t('gender.female')}</option>
            <option value="male">{t('gender.male')}</option>
            <option value="other">{t('gender.other')}</option>
          </select>
        </FieldShell>

        <FieldShell id="field-mobile" label={t('step2.mobile')} hint={t('step2.mobileHint')} error={errors.mobile ? errorText(errors.mobile) : undefined} required>
          <input
            {...inputProps('mobile')}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            onChange={(event) => setField('mobile', event.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </FieldShell>

        <FieldShell id="field-email" label={t('step2.email')} error={errors.email ? errorText(errors.email) : undefined}>
          <input {...inputProps('email')} type="email" autoComplete="email" />
        </FieldShell>

        <FieldShell id="field-pincode" label={t('step2.pincode')} error={errors.pincode ? errorText(errors.pincode) : undefined} required>
          <input
            {...inputProps('pincode')}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </FieldShell>
      </div>

      <div className="form-grid form-grid--full">
        <FieldShell id="field-addressLine" label={t('step2.address')} hint={t('step2.addressHint')} error={errors.addressLine ? errorText(errors.addressLine) : undefined} required>
          <input {...inputProps('addressLine')} autoComplete="street-address" />
        </FieldShell>
      </div>

      <div className="form-grid">
        <FieldShell id="field-city" label={t('step2.city')} error={errors.city ? errorText(errors.city) : undefined} required>
          <input {...inputProps('city')} autoComplete="address-level2" />
        </FieldShell>
        <FieldShell id="field-state" label={t('step2.state')} error={errors.state ? errorText(errors.state) : undefined} required>
          <select {...inputProps('state')}>
            <option value="">{t('step2.state')}</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>{state.name}</option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div className="callout callout--quiet">
        <Icon name="lock" size={18} />
        <p>{t('step2.privacy')}</p>
      </div>
    </section>
  );
}

function DocumentsStep({
  application,
  uploadingKind,
  docError,
  onUpload,
  onRemove,
  t,
  L,
  lang,
}: {
  application: Application;
  uploadingKind: string | null;
  docError: (kind: string) => string | undefined;
  onUpload: (kind: string, file: File) => void;
  onRemove: (doc: DocumentItem) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (value: { en: string; hi: string } | undefined) => string;
  lang: 'en' | 'hi';
}) {
  return (
    <section aria-labelledby="step3-heading">
      <h2 id="step3-heading" className="wizard__panel-title">{t('step3.title')}</h2>
      <p className="wizard__panel-desc">{t('step3.desc')}</p>

      <div className="upload-grid">
        {application.service.documents.map((config) => {
          const uploaded = application.documents.find((doc) => doc.kind === config.key);
          const error = docError(config.key);
          const isPhoto = config.key === 'photo' || config.key === 'signature';
          const busy = uploadingKind === config.key;
          return (
            <div key={config.key} className={`upload-card ${uploaded ? 'upload-card--done' : ''} ${error ? 'upload-card--error' : ''}`} id={`doc-card-${config.key}`}>
              <div className="upload-card__head">
                <span className="upload-card__icon" aria-hidden="true">
                  <Icon name={uploaded ? 'check' : 'upload'} size={20} />
                </span>
                <div>
                  <h3>
                    {L(config.label)}
                    {config.required ? <Badge tone="neutral">{t('common.required')}</Badge> : null}
                  </h3>
                  <p className="upload-card__hint">{L(config.hint)}</p>
                </div>
              </div>

              {uploaded ? (
                <div className="upload-card__file">
                  <Icon name="file" size={18} />
                  <div>
                    <p className="upload-card__name">{uploaded.filename}</p>
                    <p className="upload-card__meta">
                      {fileSize(uploaded.size)} · {formatDate(uploaded.uploadedAt, lang)}
                    </p>
                  </div>
                  <div className="upload-card__actions">
                    <a href={uploaded.url} target="_blank" rel="noreferrer" className="link-button">
                      {t('step3.view')}
                    </a>
                    <button type="button" className="link-button link-button--danger" onClick={() => onRemove(uploaded)}>
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-card__pick">
                  {busy ? (
                    <Spinner label={t('step3.uploading')} />
                  ) : (
                    <>
                      <input
                        id={`doc-${config.key}`}
                        type="file"
                        accept={isPhoto ? 'image/jpeg,image/png' : 'image/jpeg,image/png,application/pdf'}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onUpload(config.key, file);
                          event.target.value = '';
                        }}
                      />
                      <label htmlFor={`doc-${config.key}`} className="btn btn--ghost btn--sm">
                        <Icon name="upload" size={16} /> {t('step3.upload')}
                      </label>
                      <span className="upload-card__limits">
                        {isPhoto ? t('step3.acceptedPhoto') : t('step3.accepted')} · {t('step3.maxSize', { size: isPhoto ? '1 MB' : '2 MB' })}
                      </span>
                    </>
                  )}
                </div>
              )}

              {error ? <p className="field__error"><Icon name="alertCircle" size={15} /> {error}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="callout callout--quiet">
        <Icon name="shield" size={18} />
        <p>{t('step3.privacy')}</p>
      </div>
    </section>
  );
}

function ReviewStep({
  application,
  draft,
  setField,
  errors,
  errorText,
  onEdit,
  t,
  L,
  lang,
}: {
  application: Application;
  draft: Draft;
  setField: (key: keyof Draft, value: unknown) => void;
  errors: Record<string, string>;
  errorText: (code: string) => string;
  onEdit: (step: number) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (value: { en: string; hi: string } | undefined) => string;
  lang: 'en' | 'hi';
}) {
  const classes = (draft.vehicleClass ?? []).map((value) => t(`class.${value}`)).join(', ');
  return (
    <section aria-labelledby="step4-heading">
      <h2 id="step4-heading" className="wizard__panel-title">{t('step4.title')}</h2>
      <p className="wizard__panel-desc">{t('step4.desc')}</p>

      <div className="review-block">
        <div className="review-block__head">
          <h3>{t('step4.eligibility')}</h3>
          <button type="button" className="link-button" onClick={() => onEdit(1)}>{t('common.edit')}</button>
        </div>
        <dl className="review-list">
          <div><dt>{t('step1.category')}</dt><dd>{t(`cat.${draft.category ?? 'general'}`)}</dd></div>
          <div><dt>{t('step1.history')}</dt><dd>{t(`history.${draft.licenceHistory ?? 'none'}`)}</dd></div>
          <div><dt>{t('step1.classes')}</dt><dd>{classes || '—'}</dd></div>
        </dl>
      </div>

      <div className="review-block">
        <div className="review-block__head">
          <h3>{t('step4.personal')}</h3>
          <button type="button" className="link-button" onClick={() => onEdit(2)}>{t('common.edit')}</button>
        </div>
        <dl className="review-list">
          <div><dt>{t('step2.fullName')}</dt><dd>{draft.fullName || '—'}</dd></div>
          <div><dt>{t('step2.dob')}</dt><dd>{draft.dob ? formatDate(draft.dob, lang) : '—'}</dd></div>
          <div><dt>{t('step2.gender')}</dt><dd>{draft.gender ? t(`gender.${draft.gender}`) : '—'}</dd></div>
          <div><dt>{t('step2.mobile')}</dt><dd>{draft.mobile || '—'}</dd></div>
          <div><dt>{t('step2.email')}</dt><dd>{draft.email || '—'}</dd></div>
        </dl>
      </div>

      <div className="review-block">
        <div className="review-block__head">
          <h3>{t('step4.address')}</h3>
          <button type="button" className="link-button" onClick={() => onEdit(2)}>{t('common.edit')}</button>
        </div>
        <p className="review-address">
          {[draft.addressLine, draft.city, draft.pincode].filter(Boolean).join(', ') || '—'}
        </p>
      </div>

      <div className="review-block">
        <div className="review-block__head">
          <h3>{t('step4.documents')}</h3>
          <button type="button" className="link-button" onClick={() => onEdit(3)}>{t('common.edit')}</button>
        </div>
        <ul className="review-docs">
          {application.service.documents.map((config) => {
            const uploaded = application.documents.find((doc) => doc.kind === config.key);
            return (
              <li key={config.key}>
                <span className={`review-docs__state ${uploaded ? 'review-docs__state--ok' : 'review-docs__state--missing'}`} aria-hidden="true">
                  <Icon name={uploaded ? 'check' : 'close'} size={13} />
                </span>
                <span>{L(config.label)}</span>
                <span className="muted">{uploaded ? uploaded.filename : t('errors.DOCUMENT_REQUIRED')}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="review-block review-block--declaration">
        <h3>{t('step4.declaration')}</h3>
        <label htmlFor="field-declaration" className={`checkbox ${errors.declaration ? 'checkbox--error' : ''}`}>
          <input
            id="field-declaration"
            type="checkbox"
            checked={draft.declaration === true}
            onChange={(event) => setField('declaration', event.target.checked)}
            aria-invalid={Boolean(errors.declaration)}
            aria-describedby={errors.declaration ? 'field-declaration-error' : undefined}
          />
          <span>{t('step4.declarationText')}</span>
        </label>
        {errors.declaration ? (
          <p className="field__error" id="field-declaration-error">
            <Icon name="alertCircle" size={15} /> {errorText(errors.declaration)}
          </p>
        ) : null}
        <p className="field__hint">{t('step4.note')}</p>
      </div>
    </section>
  );
}

function PaymentStep({
  application,
  draft,
  lang,
  t,
  errorText,
  onPaid,
}: {
  application: Application;
  draft: Draft;
  lang: 'en' | 'hi';
  t: (key: string, vars?: Record<string, string | number>) => string;
  errorText: (code: string, fallback?: string) => string;
  onPaid: (next: Application) => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [forceFailure, setForceFailure] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [declined, setDeclined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const keyRef = useRef(newKey());

  const amount = application.service.fee;

  function useDemoCard() {
    setCardNumber('4242 4242 4242 4242');
    setCardName((draft.fullName ?? 'Asha Verma').toUpperCase());
    setExpiry('12/30');
    setCvv('123');
    setErrors({});
    setDeclined(false);
  }

  async function pay() {
    if (submitting) return;
    const nextErrors: Record<string, string> = {};
    if (!luhnValid(cardNumber)) nextErrors.cardNumber = 'CARD_INVALID';
    if (!/^[A-Za-z .'-]{2,60}$/.test(cardName.trim())) nextErrors.cardName = 'CARD_NAME_INVALID';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) nextErrors.expiry = 'EXPIRY_INVALID';
    if (!/^\d{3,4}$/.test(cvv)) nextErrors.cvv = 'CVV_INVALID';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setPayError(null);
    setDeclined(false);
    try {
      await api.pay(application.id, keyRef.current, {
        cardNumber,
        cardName,
        expiry,
        cvv,
        forceFailure,
      });
      const next = await api.application(application.id);
      onPaid(next);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'PAYMENT_DECLINED') {
        setDeclined(true);
        keyRef.current = newKey();
        setPayError(errorText('PAYMENT_DECLINED'));
      } else if (cause instanceof ApiError && cause.code === 'VALIDATION_FAILED' && cause.fields) {
        setErrors(cause.fields);
      } else {
        setPayError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="step5-heading">
      <h2 id="step5-heading" className="wizard__panel-title">{t('step5.title')}</h2>
      <p className="wizard__panel-desc">{t('step5.desc')}</p>

      <div className="payment-layout">
        <div className="payment-form card">
          <h3>{t('pay.method')}</h3>

          <div className="form-grid">
            <FieldShell id="field-cardNumber" label={t('pay.cardNumber')} error={errors.cardNumber ? errorText(errors.cardNumber) : undefined} required>
              <input
                id="field-cardNumber"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                inputMode="numeric"
                autoComplete="cc-number"
                aria-invalid={Boolean(errors.cardNumber)}
              />
            </FieldShell>
            <FieldShell id="field-cardName" label={t('pay.cardName')} error={errors.cardName ? errorText(errors.cardName) : undefined} required>
              <input
                id="field-cardName"
                value={cardName}
                onChange={(event) => setCardName(event.target.value)}
                autoComplete="cc-name"
                aria-invalid={Boolean(errors.cardName)}
              />
            </FieldShell>
          </div>

          <div className="form-grid form-grid--compact">
            <FieldShell id="field-expiry" label={t('pay.expiry')} error={errors.expiry ? errorText(errors.expiry) : undefined} required>
              <input
                id="field-expiry"
                value={expiry}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                  setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                }}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                aria-invalid={Boolean(errors.expiry)}
              />
            </FieldShell>
            <FieldShell id="field-cvv" label={t('pay.cvv')} error={errors.cvv ? errorText(errors.cvv) : undefined} required>
              <input
                id="field-cvv"
                value={cvv}
                onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="cc-csc"
                aria-invalid={Boolean(errors.cvv)}
              />
            </FieldShell>
          </div>

          <div className="payment-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={useDemoCard}>
              <Icon name="card" size={16} /> {t('pay.useDemo')}
            </button>
            <label className="checkbox checkbox--inline">
              <input type="checkbox" checked={forceFailure} onChange={(event) => setForceFailure(event.target.checked)} />
              <span>{t('pay.forceFailure')}</span>
            </label>
          </div>

          {payError ? <ErrorBlock message={payError} /> : null}

          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => void pay()} disabled={submitting}>
            {submitting ? t('pay.processing') : t('pay.pay', { amount: formatCurrency(amount, lang) })}
            {!submitting ? <Icon name="lock" size={17} /> : null}
          </button>
          <p className="field__hint">{t('pay.gatewayNote')}</p>
          <p className="field__hint">{t('pay.secureNote')}</p>
          {declined ? <p className="field__hint">{t('pay.retry')}</p> : null}
        </div>

        <aside className="payment-summary card">
          <h3>{t('pay.amount')}</h3>
          <dl className="fee-breakdown">
            {(amount >= 200 ? [
              { label: { en: 'Licence fee', hi: 'लाइसेंस शुल्क' }, value: 200 },
              { label: { en: 'Learner test fee', hi: 'लर्नर टेस्ट शुल्क' }, value: amount - 200 },
            ] : [{ label: { en: 'Service fee', hi: 'सेवा शुल्क' }, value: amount }]).map((row, index) => (
              <div key={index}>
                <dt>{row.label[lang]}</dt>
                <dd>{formatCurrency(row.value, lang)}</dd>
              </div>
            ))}
            <div className="fee-breakdown__total">
              <dt>{t('pay.total')}</dt>
              <dd>{formatCurrency(amount, lang)}</dd>
            </div>
          </dl>
          <p className="field__hint">{t('service.sidebarNote')}</p>
          <div className="payment-summary__app">
            <span>{t('wizard.reference')}</span>
            <strong>{application.reference}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SlotStep({
  application,
  lang,
  t,
  L,
  errorText,
  onBooked,
  onSkip,
}: {
  application: Application;
  lang: 'en' | 'hi';
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (value: { en: string; hi: string } | undefined) => string;
  errorText: (code: string, message?: string) => string;
  onBooked: (next: Application) => void;
  onSkip: () => void;
}) {
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [centreId, setCentreId] = useState(application.booking?.centre.id ?? '');
  const [date, setDate] = useState(application.booking?.date ?? '');
  const [slotId, setSlotId] = useState(application.booking?.slotId ?? '');
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [changing, setChanging] = useState(!application.booking);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api.slots();
      setData(result);
      setCentreId((current) => current || result.centres[0]?.id || '');
    } catch {
      setLoadError(t('slot.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const slots = useMemo(() => data?.slots ?? [], [data]);
  const centres = data?.centres ?? [];
  const dates = useMemo(() => {
    const unique = new Set(slots.filter((slot) => slot.centreId === centreId).map((slot) => slot.date));
    return [...unique].sort();
  }, [slots, centreId]);

  const activeDate = date && dates.includes(date) ? date : dates[0] ?? '';
  const times = slots.filter((slot) => slot.centreId === centreId && slot.date === activeDate);

  async function book() {
    if (!slotId || booking) return;
    setBooking(true);
    setBookError(null);
    try {
      const next = await api.bookSlot(application.id, slotId);
      onBooked(next);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'SLOT_FULL') {
        setBookError(errorText('SLOT_FULL'));
        setSlotId('');
        await loadSlots();
      } else {
        setBookError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
      }
    } finally {
      setBooking(false);
    }
  }

  if (application.booking && !changing) {
    const bookingInfo = application.booking;
    return (
      <section aria-labelledby="step6-heading">
        <h2 id="step6-heading" className="wizard__panel-title">{t('slot.bookedTitle')}</h2>
        <div className="booking-card">
          <span className="booking-card__icon"><Icon name="calendar" size={26} /></span>
          <div>
            <p className="booking-card__date">{formatDay(bookingInfo.date, lang)} · {bookingInfo.time}</p>
            <p className="booking-card__centre">{L(bookingInfo.centre.name)}</p>
            <p className="muted">{L(bookingInfo.centre.address)}</p>
          </div>
        </div>
        <div className="wizard__actions wizard__actions--inline">
          <button type="button" className="btn btn--quiet" onClick={() => setChanging(true)}>{t('slot.change')}</button>
          <button type="button" className="btn btn--primary btn--lg" onClick={onSkip}>
            {t('wizard.continue')} <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="step6-heading">
      <h2 id="step6-heading" className="wizard__panel-title">{t('step6.title')}</h2>
      <p className="wizard__panel-desc">{t('step6.desc')}</p>

      {loading ? <LoadingBlock label={t('slot.loading')} /> : null}
      {loadError ? <ErrorBlock message={loadError} onRetry={() => void loadSlots()} /> : null}

      {!loading && !loadError ? (
        <>
          <div className="form-grid">
            <FieldShell id="slot-centre" label={t('slot.centre')} required>
              <select id="slot-centre" value={centreId} onChange={(event) => { setCentreId(event.target.value); setSlotId(''); }}>
                {centres.map((centre) => (
                  <option key={centre.id} value={centre.id}>{L(centre.name)} · {centre.district}</option>
                ))}
              </select>
            </FieldShell>
          </div>

          {dates.length === 0 ? <p className="muted">{t('slot.noSlots')}</p> : null}

          <fieldset className="fieldset">
            <legend className="field__label">{t('slot.date')}</legend>
            <div className="date-strip">
              {dates.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`date-chip ${value === activeDate ? 'date-chip--active' : ''}`}
                  aria-pressed={value === activeDate}
                  onClick={() => { setDate(value); setSlotId(''); }}
                >
                  <span>{formatWeekday(value, lang)}</span>
                  <strong>{formatDayNumber(value)}</strong>
                  <span>{formatMonth(value, lang)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="field__label">{t('slot.time')}</legend>
            <div className="slot-grid">
              {times.map((slot: Slot) => {
                const full = slot.available === 0;
                return (
                  <button
                    type="button"
                    key={slot.id}
                    className={`slot-chip ${slot.id === slotId ? 'slot-chip--active' : ''}`}
                    aria-pressed={slot.id === slotId}
                    disabled={full}
                    onClick={() => setSlotId(slot.id)}
                  >
                    <strong>{slot.time}</strong>
                    <span>{full ? t('slot.full') : t('slot.seats', { n: slot.available })}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {bookError ? <ErrorBlock message={bookError} /> : null}

          <div className="wizard__actions wizard__actions--inline">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => void book()} disabled={!slotId || booking}>
              {booking ? t('slot.booking') : slotId ? t('slot.confirm') : t('slot.choose')}
              {!booking ? <Icon name="calendar" size={18} /> : null}
            </button>
            <button type="button" className="btn btn--quiet" onClick={onSkip}>{t('slot.skip')}</button>
          </div>
          <p className="field__hint">{t('slot.demoNote')}</p>
        </>
      ) : null}
    </section>
  );
}

function DoneStep({
  application,
  lang,
  t,
  copied,
  onCopy,
}: {
  application: Application;
  lang: 'en' | 'hi';
  t: (key: string, vars?: Record<string, string | number>) => string;
  copied: boolean;
  onCopy: () => void;
}) {
  const booking = application.booking;
  return (
    <section aria-labelledby="step7-heading" className="done">
      <span className="done__mark" aria-hidden="true"><Icon name="check" size={28} /></span>
      <h2 id="step7-heading" className="wizard__panel-title">{t('done.title')}</h2>
      <p className="wizard__panel-desc">{t('done.desc')}</p>

      <div className="reference-box">
        <span>{t('done.reference')}</span>
        <strong>{application.reference}</strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCopy}>
          <Icon name="copy" size={16} /> {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>

      <div className="done__grid">
        <div className="card">
          <h3>{t('status.payment')}</h3>
          {application.payment?.status === 'SUCCESS' ? (
            <>
              <p className="done__amount">{formatCurrency(application.payment.amount, lang)}</p>
              <p className="muted">{t('status.receipt')}: {application.payment.receiptNo}</p>
              <p className="muted">•••• {application.payment.cardLast4}</p>
            </>
          ) : (
            <p className="muted">{t('status.noPayment')}</p>
          )}
        </div>
        <div className="card">
          <h3>{t('status.booking')}</h3>
          {booking ? (
            <>
              <p className="done__amount">{formatDay(booking.date, lang)} · {booking.time}</p>
              <p className="muted">{booking.centre.name[lang]}</p>
              <p className="muted">{booking.centre.address[lang]}</p>
            </>
          ) : (
            <p className="muted">{t('status.noBooking')}</p>
          )}
        </div>
      </div>

      <div className="callout">
        <h3>{t('done.next')}</h3>
        <ul className="check-list">
          <li><span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span><span>{t('done.next1')}</span></li>
          <li><span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span><span>{t('done.next2')}</span></li>
          <li><span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span><span>{t('done.next3')}</span></li>
        </ul>
      </div>

      <div className="done__actions">
        <Link to={`/status/${application.reference}`} className="btn btn--primary">
          {t('done.status')} <Icon name="arrowRight" size={18} />
        </Link>
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
          <Icon name="print" size={17} /> {t('done.print')}
        </button>
        <Link to="/services/learner-licence" className="btn btn--quiet">
          {t('done.newApp')}
        </Link>
      </div>
    </section>
  );
}
