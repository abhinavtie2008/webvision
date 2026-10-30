import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useLang } from '../i18n';
import { useDocumentTitle } from '../hooks';
import { formatCurrency } from '../format';
import { rememberApplication } from '../storage';
import { Icon } from '../components/Icon';
import { Badge, ErrorBlock, LoadingBlock, ServiceCard } from '../components/ui';
import { useServices } from '../useServices';

export function ServiceDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { t, L, lang, errorText } = useLang();
  const { services, categories, loading, error, reload } = useServices();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const service = services?.find((item) => item.slug === slug);
  useDocumentTitle(service ? L(service.title) : t('service.notFound'));

  async function start() {
    if (!service || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const application = await api.createApplication(service.slug, 'DL');
      rememberApplication({
        id: application.id,
        reference: application.reference,
        serviceSlug: application.service.slug,
        updatedAt: application.updatedAt,
      });
      navigate(`/apply/${application.id}`);
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'NETWORK';
      setStartError(errorText(code));
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <LoadingBlock label={t('service.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorBlock message={error} onRetry={reload} />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container page">
        <div className="empty-state">
          <span className="empty-state__icon"><Icon name="search" size={26} /></span>
          <h1>{t('service.notFound')}</h1>
          <Link to="/" className="btn btn--primary">{t('common.backHome')}</Link>
        </div>
      </div>
    );
  }

  const category = categories.find((item) => item.id === service.category);
  const related = (services ?? []).filter((item) => item.category === service.category && item.slug !== service.slug).slice(0, 3);
  const requiredDocs = service.documents.filter((doc) => doc.required).length;

  return (
    <div className="container page detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">{t('common.home')}</Link>
        <Icon name="chevronRight" size={14} />
        <Link to="/#all-services">{t('service.breadcrumbAll')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{L(service.title)}</span>
      </nav>

      <header className="detail-head">
        <div className="detail-head__badges">
          <Badge tone="info">{t('common.online')}</Badge>
          {service.applyFlow ? <Badge tone="accent">{t('common.fullFlow')}</Badge> : <Badge tone="neutral">{t('common.guideOnly')}</Badge>}
          {category ? <span className="detail-head__category">{L(category.label)}</span> : null}
        </div>
        <h1>{L(service.title)}</h1>
        <p className="detail-head__summary">{L(service.summary)}</p>
        <div className="detail-head__meta">
          <span><Icon name="clock" size={18} /> {t('service.time', { n: service.minutes })}</span>
          <span><Icon name="card" size={18} /> {service.fee ? formatCurrency(service.fee, lang) : t('common.free')}</span>
          <span><Icon name="file" size={18} /> {service.documents.length} {t('step4.documents').toLowerCase()}</span>
        </div>
      </header>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card prose" aria-labelledby="about-title">
            <h2 id="about-title">{t('service.about')}</h2>
            <p>{L(service.description)}</p>
          </section>

          {service.eligibility.length > 0 ? (
            <section className="card" aria-labelledby="eligibility-title">
              <h2 id="eligibility-title">{t('service.eligibility')}</h2>
              <ul className="check-list">
                {service.eligibility.map((item, index) => (
                  <li key={index}>
                    <span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span>
                    <span>{L(item)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card" aria-labelledby="documents-title">
            <h2 id="documents-title">{t('service.documents')}</h2>
            {service.documents.length === 0 ? (
              <p className="muted">{t('service.noAccount')} — {L(service.feeNote)}</p>
            ) : (
              <ul className="doc-list">
                {service.documents.map((doc) => (
                  <li key={doc.key}>
                    <span className="doc-list__icon" aria-hidden="true"><Icon name="file" size={18} /></span>
                    <div>
                      <p className="doc-list__label">
                        {L(doc.label)}
                        {doc.required ? <Badge tone="neutral">{t('service.required')}</Badge> : <Badge tone="neutral">{t('service.optional')}</Badge>}
                      </p>
                      <p className="doc-list__hint">{L(doc.hint)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="steps-title">
            <h2 id="steps-title">{t('service.steps')}</h2>
            <ol className="step-list">
              {service.steps.map((step, index) => (
                <li key={index}>
                  <span className="step-list__num" aria-hidden="true">{index + 1}</span>
                  <span>{L(step)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card" aria-labelledby="fee-title">
            <h2 id="fee-title">{t('service.fees')}</h2>
            <p className="fee-line">
              <span>{service.fee ? formatCurrency(service.fee, lang) : t('common.free')}</span>
              <span className="muted">{L(service.feeNote)}</span>
            </p>
            <p className="field__hint">{t('service.sidebarNote')}</p>
          </section>
        </div>

        <aside className="detail-side" aria-labelledby="glance-title">
          <div className="card glance">
            <h2 id="glance-title">{t('service.sidebarTitle')}</h2>
            <dl className="glance__list">
              <div>
                <dt>{t('common.fee')}</dt>
                <dd>{service.fee ? formatCurrency(service.fee, lang) : t('common.free')}</dd>
              </div>
              <div>
                <dt>{t('common.duration')}</dt>
                <dd>{t('service.time', { n: service.minutes })}</dd>
              </div>
              <div>
                <dt>{t('service.documents')}</dt>
                <dd>{requiredDocs} {t('service.required').toLowerCase()}</dd>
              </div>
            </dl>

            {service.applyFlow ? (
              <>
                <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => void start()} disabled={starting}>
                  {starting ? t('common.loading') : t('service.start')}
                  {!starting ? <Icon name="arrowRight" size={18} /> : null}
                </button>
                {startError ? <ErrorBlock message={startError} /> : null}
              </>
            ) : (
              <div className="glance__note">
                <p><strong>{t('service.guideOnly')}</strong></p>
                <p>{t('service.guideNote')}</p>
                <Link to="/services/learner-licence" className="btn btn--primary btn--block">
                  {t('service.startDemo')} <Icon name="arrowRight" size={18} />
                </Link>
              </div>
            )}

            <Link to="/resume" className="btn btn--quiet btn--block">{t('service.resume')}</Link>

            <ul className="glance__promises">
              <li><Icon name="lock" size={16} /> {t('service.noAccount')}</li>
              <li><Icon name="refresh" size={16} /> {t('service.autosave')}</li>
              <li><Icon name="shield" size={16} /> {t('common.useDemoData')}</li>
            </ul>
          </div>

          <div className="card side-help">
            <h2>{t('service.helpTitle')}</h2>
            <p>{t('service.helpText')}</p>
            <Link to="/help" className="link-button link-button--arrow">
              {t('service.helpLink')} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="section related" aria-labelledby="related-title">
          <div className="section-head">
            <h2 id="related-title">{t('service.related')}</h2>
          </div>
          <div className="service-grid">
            {related.map((item) => <ServiceCard key={item.slug} service={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
