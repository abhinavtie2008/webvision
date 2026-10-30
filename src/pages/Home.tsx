import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useDocumentTitle } from '../hooks';
import { formatTimeAgo } from '../format';
import { forgetApplication, latestApplication, type RecentApplication } from '../storage';
import type { Service } from '../types';
import { Icon } from '../components/Icon';
import { Badge, ErrorBlock, SectionHead, ServiceCard } from '../components/ui';
import { useServices } from '../useServices';

export function Home() {
  const { t, L, lang } = useLang();
  const navigate = useNavigate();
  const { services, categories, error, reload } = useServices();
  useDocumentTitle(t('home.h1'));

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [reference, setReference] = useState('');
  const [recent, setRecent] = useState<RecentApplication | null>(() => latestApplication());

  const serviceBySlug = useMemo(() => {
    const map = new Map<string, Service>();
    for (const service of services ?? []) map.set(service.slug, service);
    return map;
  }, [services]);

  const popular = useMemo(() => (services ?? []).filter((s) => s.popular).slice(0, 3), [services]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (services ?? []).filter((service) => {
      if (category !== 'all' && service.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        service.title.en,
        service.title.hi,
        service.summary.en,
        service.summary.hi,
        service.slug,
        ...service.tags,
        ...(categories.find((c) => c.id === service.category)?.label ? [categories.find((c) => c.id === service.category)!.label.en, categories.find((c) => c.id === service.category)!.label.hi] : []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [services, category, query, categories]);

  function scrollToCatalog() {
    document.getElementById('all-services')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    scrollToCatalog();
  }

  function submitTrack(event: FormEvent) {
    event.preventDefault();
    const value = reference.trim().toUpperCase();
    if (value) navigate(`/status/${encodeURIComponent(value)}`);
  }

  function removeRecent() {
    if (!recent) return;
    forgetApplication(recent.id);
    setRecent(latestApplication());
  }

  const recentService = recent ? serviceBySlug.get(recent.serviceSlug) : undefined;

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--light">{t('home.eyebrow')}</p>
            <h1>{t('home.h1')}</h1>
            <p className="hero__lede">{t('home.lede')}</p>

            <form className="searchbar" role="search" onSubmit={submitSearch}>
              <Icon name="search" size={21} className="searchbar__icon" />
              <label htmlFor="service-search" className="sr-only">
                {t('home.searchLabel')}
              </label>
              <input
                id="service-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('home.searchPlaceholder')}
                autoComplete="off"
                aria-controls="all-services"
              />
              <button type="submit" className="btn btn--accent">
                {t('home.searchButton')}
              </button>
            </form>

            <div className="quick-links" aria-label={t('home.popular.title')}>
              <Link to="/services/learner-licence" className="quick-link">
                <Icon name="car" size={17} /> {t('home.quick.learner')}
              </Link>
              <Link to="/services/dl-renewal" className="quick-link">
                <Icon name="refresh" size={17} /> {t('home.quick.renew')}
              </Link>
              <Link to="/services/duplicate-dl" className="quick-link">
                <Icon name="copy" size={17} /> {t('home.quick.duplicate')}
              </Link>
              <Link to="/status" className="quick-link">
                <Icon name="route" size={17} /> {t('home.quick.track')}
              </Link>
            </div>

            <p className="hero__trust">{t('home.trust')}</p>
          </div>

          <div className="hero__panel">
            {recent ? (
              <div className="hero-card hero-card--recent">
                <div className="hero-card__head">
                  <Badge tone="accent">{t('common.demo')}</Badge>
                  <button type="button" className="link-button" onClick={removeRecent}>
                    {t('home.recent.forget')}
                  </button>
                </div>
                <h2>{t('home.recent.title')}</h2>
                <p className="hero-card__service">
                  {recentService ? L(recentService.title) : recent.reference}
                </p>
                <p className="hero-card__ref">{recent.reference}</p>
                <p className="hero-card__meta">{t('home.recent.saved', { time: formatTimeAgo(recent.updatedAt, lang) })}</p>
                <div className="hero-card__actions">
                  <Link to={`/apply/${recent.id}`} className="btn btn--primary btn--block">
                    {t('home.recent.continue')} <Icon name="arrowRight" size={18} />
                  </Link>
                  <Link to={`/status/${recent.reference}`} className="btn btn--quiet btn--block">
                    {t('home.recent.track')}
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="hero-card">
              <div className="hero-card__head">
                <span className="hero-card__icon">
                  <Icon name="route" size={20} />
                </span>
                <span className="eyebrow eyebrow--tight">{t('status.title')}</span>
              </div>
              <h2>{t('home.track.title')}</h2>
              <p>{t('home.track.desc')}</p>
              <form className="track-form" onSubmit={submitTrack}>
                <label htmlFor="track-reference">{t('home.track.label')}</label>
                <div className="track-form__row">
                  <input
                    id="track-reference"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="DL-2026-AB12CD"
                    autoComplete="off"
                    inputMode="text"
                  />
                  <button type="submit" className="btn btn--primary">
                    {t('home.track.button')}
                  </button>
                </div>
                <p className="field__hint">{t('home.track.example')}</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section" aria-labelledby="popular-title">
          <SectionHead
            eyebrow={t('home.popular.title')}
            title={t('home.popular.title')}
            desc={t('home.popular.desc')}
            id="popular-title"
          />
          {error ? <ErrorBlock message={error} onRetry={reload} /> : null}
          <div className="service-grid">
            {popular.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </section>

        <section className="section section--catalog" id="all-services" aria-labelledby="all-title">
          <SectionHead
            eyebrow={t('home.all.title')}
            title={t('home.all.title')}
            desc={t('home.all.desc')}
            id="all-title"
          />

          <div className="catalog-toolbar">
            <div className="category-filter" role="group" aria-label={t('home.all.filterLabel')}>
              <button
                type="button"
                className={`chip ${category === 'all' ? 'chip--active' : ''}`}
                aria-pressed={category === 'all'}
                onClick={() => setCategory('all')}
              >
                {t('common.all')}
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip ${category === item.id ? 'chip--active' : ''}`}
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                >
                  {L(item.label)}
                </button>
              ))}
            </div>
            <p className="results-count" aria-live="polite">
              {filtered.length === 1 ? t('home.all.countOne') : t('home.all.count', { count: filtered.length })}
            </p>
          </div>

          {query.trim() && filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">
                <Icon name="search" size={26} />
              </span>
              <h3>{t('home.all.empty', { query: query.trim() })}</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
              >
                {t('home.all.clear')}
              </button>
            </div>
          ) : null}

          <div className="service-grid">
            {filtered.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="how-title">
          <SectionHead eyebrow="Why this works" title={t('home.how.title')} desc={t('home.how.desc')} id="how-title" />
          <div className="how-grid">
            {[1, 2, 3, 4].map((n) => (
              <div className="how-card" key={n}>
                <span className="how-card__num" aria-hidden="true">
                  {n}
                </span>
                <h3>{t(`home.how.${n}.title`)}</h3>
                <p>{t(`home.how.${n}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="help-title">
          <SectionHead title={t('home.help.title')} desc={t('home.help.desc')} id="help-title" />
          <div className="help-grid">
            <Link className="help-card" to="/help#accessibility">
              <span className="help-card__icon"><Icon name="shield" size={22} /></span>
              <div>
                <h3>{t('home.help.a11y.title')}</h3>
                <p>{t('home.help.a11y.desc')}</p>
              </div>
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link className="help-card" to="/help#faq">
              <span className="help-card__icon"><Icon name="help" size={22} /></span>
              <div>
                <h3>{t('home.help.faq.title')}</h3>
                <p>{t('home.help.faq.desc')}</p>
              </div>
              <Icon name="arrowRight" size={18} />
            </Link>
            <a className="help-card" href="https://parivahan.gov.in" target="_blank" rel="noreferrer">
              <span className="help-card__icon"><Icon name="external" size={22} /></span>
              <div>
                <h3>{t('home.help.official.title')}</h3>
                <p>{t('home.help.official.desc')}</p>
              </div>
              <Icon name="external" size={18} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
