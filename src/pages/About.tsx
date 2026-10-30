import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../hooks';
import { useLang } from '../i18n';
import { clearRecent } from '../storage';

const AUDIT: { id: number; to: string; label: string }[] = [
  { id: 1, to: '/services/learner-licence', label: '/services/learner-licence' },
  { id: 2, to: '/#all-services', label: '/ #all-services' },
  { id: 3, to: '/services/learner-licence', label: '/apply/:id' },
  { id: 4, to: '/status', label: '/status/:reference' },
  { id: 5, to: '/', label: '/' },
  { id: 6, to: '/help#accessibility', label: '/help#accessibility' },
  { id: 7, to: '/help#accessibility', label: 'EN / हिंदी' },
  { id: 8, to: '/about#backend', label: '/about#backend' },
  { id: 9, to: '/services/learner-licence', label: 'document upload' },
  { id: 10, to: '/resume', label: '/resume' },
];

const BACKEND = [1, 2, 3, 4, 5, 6, 7, 8];

export function About() {
  const { t } = useLang();
  useDocumentTitle(t('about.title'));
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function reset() {
    if (!window.confirm(t('about.resetConfirm'))) return;
    setResetting(true);
    setMessage(null);
    try {
      await api.resetDemo();
      clearRecent();
      setMessage({ tone: 'ok', text: t('about.resetDone') });
    } catch {
      setMessage({ tone: 'error', text: t('about.resetError') });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label={t('common.home')}>
        <Link to="/">{t('common.home')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{t('about.title')}</span>
      </nav>

      <div className="page-hero">
        <p className="eyebrow">{t('footer.about')}</p>
        <h1>{t('about.title')}</h1>
        <p className="lede">{t('about.lede')}</p>
      </div>

      <div className="callout callout--warning">
        <Icon name="warning" size={22} />
        <div>
          <p><strong>{t('about.disclaimerTitle')}</strong></p>
          <p>{t('about.disclaimer')}</p>
        </div>
      </div>

      <section className="card" aria-labelledby="audit-title">
        <h2 id="audit-title">{t('about.auditTitle')}</h2>
        <p className="muted">{t('about.auditDesc')}</p>
        <div className="audit-table" role="table" aria-label={t('about.auditTitle')}>
          <div className="audit-table__head" role="row">
            <span role="columnheader">{t('about.issue')}</span>
            <span role="columnheader">{t('about.fix')}</span>
            <span role="columnheader">{t('about.where')}</span>
          </div>
          {AUDIT.map((row) => (
            <div className="audit-table__row" role="row" key={row.id}>
              <span role="cell"><Icon name="close" size={14} /> {t(`about.i${row.id}`)}</span>
              <span role="cell"><Icon name="check" size={14} /> {t(`about.f${row.id}`)}</span>
              <span role="cell">
                <Link to={row.to} className="link-button">{row.label}</Link>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" id="backend" aria-labelledby="backend-title">
        <h2 id="backend-title">{t('about.backendTitle')}</h2>
        <ul className="check-list">
          {BACKEND.map((number) => (
            <li key={number}>
              <span className="check-list__mark" aria-hidden="true"><Icon name="shield" size={15} /></span>
              <span>{t(`about.backend.${number}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="about-grid">
        <section className="card" aria-labelledby="data-title">
          <h2 id="data-title">{t('about.dataTitle')}</h2>
          <p>{t('about.dataBody')}</p>
          <button type="button" className="btn btn--ghost" onClick={() => void reset()} disabled={resetting}>
            <Icon name="refresh" size={16} /> {resetting ? t('common.loading') : t('about.reset')}
          </button>
          {message ? (
            <p className={message.tone === 'ok' ? 'form-message form-message--ok' : 'form-message form-message--error'} role="status">
              {message.text}
            </p>
          ) : null}
        </section>

        <section className="card" aria-labelledby="stack-title">
          <h2 id="stack-title">{t('about.stackTitle')}</h2>
          <p>{t('about.stack')}</p>
          <ul className="plain-list">
            <li><a href="https://parivahan.gov.in" target="_blank" rel="noreferrer">parivahan.gov.in <Icon name="external" size={14} /></a></li>
            <li><a href="https://morth.nic.in" target="_blank" rel="noreferrer">morth.nic.in <Icon name="external" size={14} /></a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
