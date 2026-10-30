import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { formatCurrency } from '../format';
import type { AppStatus, Service } from '../types';
import { Icon, type IconName } from './Icon';

const CATEGORY_ICON: Record<string, IconName> = {
  learn: 'car',
  licence: 'file',
  appointments: 'calendar',
  documents: 'upload',
  support: 'help',
};

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function ServiceCard({ service }: { service: Service }) {
  const { t, L, lang } = useLang();
  const icon = CATEGORY_ICON[service.category] ?? 'file';
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <span className={`service-card__icon service-card__icon--${service.category}`}>
        <Icon name={icon} size={24} />
      </span>
      <h3>{L(service.title)}</h3>
      <p>{L(service.summary)}</p>
      <div className="service-card__meta">
        <span className="service-card__meta-item">
          <Icon name="clock" size={16} /> {t('common.minutes', { n: service.minutes })}
        </span>
        <span className="service-card__meta-item">
          <Icon name="card" size={16} /> {service.fee ? formatCurrency(service.fee, lang) : t('common.free')}
        </span>
        {service.applyFlow ? <Badge tone="accent">{t('common.fullFlow')}</Badge> : null}
      </div>
      <span className="service-card__cta" aria-hidden="true">
        {t('common.viewService')} <Icon name="arrowRight" size={18} />
      </span>
    </Link>
  );
}

export function SectionHead({
  eyebrow,
  title,
  desc,
  actions,
  id,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
        {desc ? <p className="section-head__desc">{desc}</p> : null}
      </div>
      {actions ? <div className="section-head__actions">{actions}</div> : null}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner">
      <span className="spinner__ring" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="spinner__ring spinner__ring--lg" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLang();
  return (
    <div className="error-block" role="alert">
      <Icon name="alertCircle" size={22} />
      <div>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
            <Icon name="refresh" size={16} /> {t('common.tryAgain')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const STATUS_KEY: Record<AppStatus, string> = {
  DRAFT: 'status.st.DRAFT',
  AWAITING_PAYMENT: 'status.st.AWAITING_PAYMENT',
  PAID: 'status.st.PAID',
  SLOT_BOOKED: 'status.st.SLOT_BOOKED',
};

const STATUS_TONE: Record<AppStatus, 'neutral' | 'warning' | 'info' | 'success'> = {
  DRAFT: 'neutral',
  AWAITING_PAYMENT: 'warning',
  PAID: 'info',
  SLOT_BOOKED: 'success',
};

export function StatusPill({ status }: { status: AppStatus }) {
  const { t } = useLang();
  return <Badge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</Badge>;
}

export function EmptyState({ icon = 'info', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
