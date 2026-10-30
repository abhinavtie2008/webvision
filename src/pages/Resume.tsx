import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { Icon } from '../components/Icon';
import { ErrorBlock } from '../components/ui';
import { useDocumentTitle } from '../hooks';
import { useLang } from '../i18n';
import { rememberApplication } from '../storage';

export function Resume() {
  const { t, errorText } = useLang();
  const navigate = useNavigate();

  const [reference, setReference] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useDocumentTitle(t('resume.title'));

  useEffect(() => {
    if (challengeId) otpRef.current?.focus();
  }, [challengeId]);

  async function sendCode() {
    const value = reference.trim().toUpperCase();
    if (!value) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.lookup(value);
      setChallengeId(result.challengeId);
      setMaskedMobile(result.maskedMobile);
      setDemoOtp(result.demoOtp);
      setOtp('');
    } catch (cause) {
      setError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
    } finally {
      setSending(false);
    }
  }

  function send(event: FormEvent) {
    event.preventDefault();
    void sendCode();
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!challengeId) return;
    setVerifying(true);
    setError(null);
    try {
      const { applicationId } = await api.verifyOtp(challengeId, otp.trim());
      const application = await api.application(applicationId);
      rememberApplication({
        id: application.id,
        reference: application.reference,
        serviceSlug: application.service.slug,
        updatedAt: application.updatedAt,
      });
      navigate(`/apply/${application.id}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? errorText(cause.code, cause.message) : errorText('NETWORK'));
      if (cause instanceof ApiError && (cause.code === 'TOO_MANY_ATTEMPTS' || cause.code === 'CHALLENGE_EXPIRED')) {
        setChallengeId(null);
        setOtp('');
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="container page narrow">
      <nav className="breadcrumb" aria-label={t('common.home')}>
        <Link to="/">{t('common.home')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{t('resume.title')}</span>
      </nav>

      <div className="page-hero">
        <p className="eyebrow">{t('nav.resume')}</p>
        <h1>{t('resume.title')}</h1>
        <p className="lede">{t('resume.desc')}</p>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      {!challengeId ? (
        <section className="card" aria-labelledby="resume-ref-title">
          <h2 id="resume-ref-title">{t('status.reference')}</h2>
          <form className="track-form" onSubmit={send}>
            <label className="field__label" htmlFor="resume-reference">
              {t('status.reference')}
            </label>
            <div className="track-form__row">
              <input
                id="resume-reference"
                className="input"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="DL-2026-AB12CD"
                autoComplete="off"
                spellCheck={false}
                required
                aria-describedby="resume-reference-hint"
              />
              <button type="submit" className="btn btn--primary" disabled={sending}>
                {sending ? t('resume.sending') : t('resume.send')}
                {!sending ? <Icon name="arrowRight" size={17} /> : null}
              </button>
            </div>
            <p className="field__hint" id="resume-reference-hint">{t('home.track.example')}</p>
          </form>
        </section>
      ) : (
        <section className="card" aria-labelledby="resume-otp-title">
          <h2 id="resume-otp-title">{t('resume.otp')}</h2>
          <p className="muted">{t('resume.sent', { mobile: maskedMobile })}</p>

          <div className="demo-note">
            <Icon name="info" size={16} />
            <span>{t('resume.demoOtp')}</span>
            <button type="button" className="link-button" onClick={() => setOtp(demoOtp)}>
              {t('resume.fill')}
            </button>
          </div>

          <form onSubmit={verify}>
            <label className="field__label" htmlFor="resume-otp">
              {t('resume.otp')}
            </label>
            <div className="track-form__row">
              <input
                id="resume-otp"
                ref={otpRef}
                className="input input--otp"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="••••••"
                required
              />
              <button type="submit" className="btn btn--primary" disabled={verifying || otp.length !== 6}>
                {verifying ? t('common.loading') : t('resume.verify')}
                {!verifying ? <Icon name="lock" size={16} /> : null}
              </button>
            </div>
          </form>

          <div className="otp-actions">
            <button type="button" className="link-button" onClick={() => { setChallengeId(null); setOtp(''); }}>
              {t('resume.change')}
            </button>
            <button type="button" className="link-button" onClick={() => void sendCode()} disabled={sending}>
              {t('resume.send')}
            </button>
          </div>

          <p className="field__hint">{t('resume.note')}</p>
        </section>
      )}

      <div className="callout callout--quiet">
        <Icon name="help" size={20} />
        <div>
          <p><strong>{t('resume.noRef')}</strong></p>
          <p>{t('resume.noRefDesc')}</p>
          <Link to="/services/learner-licence" className="link-button link-button--arrow">
            {t('resume.startNew')} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
