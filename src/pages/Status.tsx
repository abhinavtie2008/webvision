import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { Icon } from '../components/Icon';
import { Badge, ErrorBlock, LoadingBlock, StatusPill } from '../components/ui';
import { formatCurrency, formatDate, formatDateTime, formatTimeAgo } from '../format';
import { useDocumentTitle } from '../hooks';
import { useLang } from '../i18n';
import { forgetApplication, loadRecent, type RecentApplication } from '../storage';
import type { Application } from '../types';

const STAGES = [
  'status.journey.start',
  'status.journey.details',
  'status.journey.submit',
  'status.journey.pay',
  'status.journey.slot',
  'status.journey.test',
];

const CURRENT_STAGE: Record<Application['status'], number> = {
  DRAFT: 1,
  AWAITING_PAYMENT: 3,
  PAID: 4,
  SLOT_BOOKED: 5,
};

function nextAction(application: Application): { to: string; key: string } | null {
  if (application.status === 'DRAFT') return { to: `/apply/${application.id}`, key: 'status.continue' };
  if (application.status === 'AWAITING_PAYMENT') return { to: `/apply/${application.id}?step=5`, key: 'status.continue' };
  if (application.status === 'PAID') return { to: `/apply/${application.id}?step=6`, key: 'status.bookSlot' };
  return null;
}

function ReferenceForm({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  const { t } = useLang();
  return (
    <form className="track-form" onSubmit={onSubmit}>
      <label className="field__label" htmlFor="status-reference">
        {t('status.reference')}
      </label>
      <div className="track-form__row">
        <input
          id="status-reference"
          className="input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="DL-2026-AB12CD"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button type="submit" className="btn btn--primary" disabled={busy || value.trim().length === 0}>
          {busy ? t('status.loading') : t('status.check')}
          {!busy ? <Icon name="arrowRight" size={17} /> : null}
        </button>
      </div>
    </form>
  );
}

function RecentList({ onForget }: { onForget: (id: string) => void }) {
  const { t, lang } = useLang();
  const [recent, setRecent] = useState<RecentApplication[]>(loadRecent);
  if (recent.length === 0) return null;
  return (
    <div className="recent-list">
      <h2>{t('home.recent.title')}</h2>
      <ul>
        {recent.map((item) => (
          <li key={item.id} className="recent-row">
            <div>
              <Link to={`/status/${item.reference}`} className="recent-row__ref">{item.reference}</Link>
              <p className="recent-row__meta">
                {item.serviceSlug.replaceAll('-', ' ')} · {t('home.recent.saved', { time: formatTimeAgo(item.updatedAt, lang) })}
              </p>
            </div>
            <button
              type="button"
              className="link-button link-button--danger"
              onClick={() => {
                onForget(item.id);
                setRecent(loadRecent());
              }}
            >
              {t('home.recent.forget')}
            </button>
          </li>
        ))}
      </ul>
      <p className="field__hint">{t('status.recentHint')}</p>
    </div>
  );
}

export function Status() {
  const { reference } = useParams<{ reference?: string }>();
  const navigate = useNavigate();
  const { t, L, lang, errorText } = useLang();

  const [input, setInput] = useState(reference ?? '');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(Boolean(reference));
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(application ? `${application.reference} · ${L(application.service.title)}` : t('status.title'));

  const load = useCallback(
    async (ref: string) => {
      setLoading(true);
      setError(null);
      setApplication(null);
      try {
        setApplication(await api.applicationByReference(ref));
      } catch (cause) {
        setError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
      } finally {
        setLoading(false);
      }
    },
    [errorText],
  );

  useEffect(() => {
    setInput(reference ?? '');
    if (reference) {
      void load(reference);
    } else {
      setApplication(null);
      setError(null);
      setLoading(false);
    }
  }, [reference, load]);

  useEffect(() => {
    if (application) resultRef.current?.focus();
  }, [application]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = input.trim().toUpperCase();
    if (value) navigate(`/status/${encodeURIComponent(value)}`);
  }

  function forget(id: string) {
    forgetApplication(id);
  }

  const currentStage = application ? CURRENT_STAGE[application.status] : 0;
  const action = application ? nextAction(application) : null;
  const masked = Boolean(application?.draft.mobile?.includes('•'));

  if (!reference) {
    return (
      <div className="container page narrow">
        <div className="page-hero">
          <p className="eyebrow">{t('nav.track')}</p>
          <h1>{t('status.title')}</h1>
          <p className="lede">{t('status.desc')}</p>
        </div>

        <section className="card lookup-card" aria-labelledby="lookup-title">
          <h2 id="lookup-title">{t('status.reference')}</h2>
          <p className="muted">{t('status.noRef')}</p>
          <ReferenceForm value={input} onChange={setInput} onSubmit={submit} busy={false} />
          <p className="field__hint">{t('home.track.example')}</p>
        </section>

        <RecentList onForget={forget} />

        <div className="callout callout--quiet">
          <Icon name="help" size={20} />
          <div>
            <p><strong>{t('status.find')}</strong></p>
            <p>{t('status.findDesc')}</p>
            <Link to="/resume" className="link-button link-button--arrow">
              {t('status.resume')} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container page narrow">
        <LoadingBlock label={t('status.loading')} />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container page narrow">
        <ErrorBlock message={error ?? t('status.notFound')} onRetry={() => void load(reference)} />
        <section className="card lookup-card" aria-labelledby="lookup-retry">
          <h2 id="lookup-retry">{t('status.reference')}</h2>
          <ReferenceForm value={input} onChange={setInput} onSubmit={submit} busy={false} />
        </section>
        <RecentList onForget={forget} />
      </div>
    );
  }

  const { service, draft, payment, booking, documents, events } = application;

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label={t('common.home')}>
        <Link to="/">{t('common.home')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{t('status.title')}</span>
      </nav>

      <div ref={resultRef} tabIndex={-1} className="status-hero">
        <div className="status-hero__main">
          <p className="eyebrow">{L(service.title)}</p>
          <h1>{application.reference}</h1>
          <div className="status-hero__meta">
            <StatusPill status={application.status} />
            <span>{t('status.lastUpdated', { time: formatTimeAgo(application.updatedAt, lang) })}</span>
            {draft.fullName ? <span>{t('status.applicant')}: <strong>{draft.fullName}</strong></span> : null}
            {draft.mobile ? <span>{draft.mobile}</span> : null}
          </div>
          {masked ? (
            <p className="demo-note">
              <Icon name="lock" size={15} /> {t('status.maskedNote')}
            </p>
          ) : null}
        </div>
        <div className="status-actions">
          {action ? (
            <Link to={action.to} className="btn btn--primary">
              {t(action.key)} <Icon name="arrowRight" size={17} />
            </Link>
          ) : null}
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => window.print()}>
            <Icon name="print" size={16} /> {t('status.print')}
          </button>
          <Link to="/resume" className="btn btn--ghost btn--sm">
            <Icon name="lock" size={16} /> {t('status.resume')}
          </Link>
        </div>
      </div>

      <section className="card journey-card" aria-labelledby="journey-title">
        <h2 id="journey-title">{t('status.journey')}</h2>
        <ol className="journey-rail">
          {STAGES.map((key, index) => {
            const state = index < currentStage ? 'done' : index === currentStage ? 'current' : 'upcoming';
            return (
              <li key={key} className={`journey-step journey-step--${state}`}>
                <span className="journey-step__dot" aria-hidden="true">
                  {state === 'done' ? <Icon name="check" size={14} /> : index + 1}
                </span>
                <span className="journey-step__label">{t(key)}</span>
                <span className="journey-step__state">
                  {state === 'done' ? t('status.done') : state === 'current' ? t('status.current') : t('status.upcoming')}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="status-grid">
        <div className="status-main">
          <section className="card" aria-labelledby="timeline-title">
            <h2 id="timeline-title">{t('status.timeline')}</h2>
            {events.length === 0 ? (
              <p className="muted">{t('common.loading')}</p>
            ) : (
              <ol className="timeline">
                {[...events].reverse().map((event) => (
                  <li key={event.id} className="timeline__item">
                    <span className="timeline__dot" aria-hidden="true" />
                    <div className="timeline__body">
                      <p>{L(event.message)}</p>
                      <p className="timeline__time">{formatDateTime(event.at, lang)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card" aria-labelledby="status-docs-title">
            <h2 id="status-docs-title">{t('status.documents')}</h2>
            {documents.length === 0 ? (
              <p className="muted">{t('status.noDocs')}</p>
            ) : (
              <ul className="doc-list">
                {documents.map((doc) => {
                  const config = service.documents.find((item) => item.key === doc.kind);
                  return (
                    <li key={doc.id}>
                      <span className="doc-list__icon" aria-hidden="true"><Icon name="file" size={18} /></span>
                      <div>
                        <p className="doc-list__label">{config ? L(config.label) : doc.kind}</p>
                        <p className="doc-list__hint">{doc.filename} · {formatDate(doc.uploadedAt, lang)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="status-side">
          <section className="card" aria-labelledby="status-payment-title">
            <h2 id="status-payment-title">{t('status.payment')}</h2>
            {payment ? (
              <div className="info-stack">
                <p className="info-stack__amount">{formatCurrency(payment.amount, lang)}</p>
                <p>
                  <Badge tone={payment.status === 'SUCCESS' ? 'success' : 'danger'}>
                    {payment.status === 'SUCCESS' ? t('status.paid') : t('status.failed')}
                  </Badge>
                </p>
                <dl className="info-list">
                  {payment.receiptNo ? (
                    <div><dt>{t('status.receipt')}</dt><dd>{payment.receiptNo}</dd></div>
                  ) : null}
                  {payment.cardLast4 ? (
                    <div><dt>{t('pay.card')}</dt><dd>•••• {payment.cardLast4}</dd></div>
                  ) : null}
                  <div><dt>{t('status.when')}</dt><dd>{formatDateTime(payment.createdAt, lang)}</dd></div>
                </dl>
                {payment.status === 'SUCCESS' ? (
                  <ul className="fee-breakdown">
                    {payment.breakdown.map((row, index) => (
                      <li key={index} className="fee-line">
                        <span>{L(row.label)}</span>
                        <span>{formatCurrency(row.amount, lang)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="muted">{t('status.noPayment')}</p>
                {application.status === 'AWAITING_PAYMENT' ? (
                  <Link to={`/apply/${application.id}?step=5`} className="link-button link-button--arrow">
                    {t('status.continue')} <Icon name="arrowRight" size={16} />
                  </Link>
                ) : null}
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="status-booking-title">
            <h2 id="status-booking-title">{t('status.booking')}</h2>
            {booking ? (
              <div className="booking-card">
                <span className="booking-card__icon" aria-hidden="true"><Icon name="calendar" size={22} /></span>
                <p className="booking-card__date">{formatDate(booking.date, lang)} · {booking.time}</p>
                <p className="booking-card__centre">{L(booking.centre.name)}</p>
                <p className="muted">{L(booking.centre.address)}</p>
              </div>
            ) : (
              <div>
                <p className="muted">{t('status.noBooking')}</p>
                {application.status === 'PAID' ? (
                  <Link to={`/apply/${application.id}?step=6`} className="link-button link-button--arrow">
                    {t('status.bookSlot')} <Icon name="arrowRight" size={16} />
                  </Link>
                ) : null}
              </div>
            )}
          </section>

          <section className="card side-help" aria-labelledby="status-help-title">
            <h2 id="status-help-title">{t('status.help')}</h2>
            <p className="muted">{t('status.demoNote')}</p>
            <Link to="/help" className="link-button link-button--arrow">
              {t('status.helpLink')} <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
