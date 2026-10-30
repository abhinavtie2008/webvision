import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from '../i18n';
import { Icon } from './Icon';

function LogoMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <rect width="44" height="44" rx="12" fill="#0A2342" />
      <path d="M22 33c-6.2 0-11-4.3-11-9.8 0-5.7 4.9-10.2 11-10.2s11 4.5 11 10.2C33 28.7 28.2 33 22 33z" fill="none" stroke="#fff" strokeWidth="2.2" />
      <path d="M22 13v6M11.6 27.5l8.4-4.6M32.4 27.5L24 22.9" stroke="#E07A1F" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="22" cy="23" r="2.6" fill="#fff" />
    </svg>
  );
}

function LanguageSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t('nav.language')}>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        EN
      </button>
      <button type="button" aria-pressed={lang === 'hi'} onClick={() => setLang('hi')} lang="hi">
        हिं
      </button>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang } = useLang();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('a11y.skip')}
      </a>
      <div className="tricolor" aria-hidden="true" />
      <div className="topbar">
        <div className="container topbar__inner">
          <span className="topbar__ministry">{t('topbar.ministry')}</span>
          <span className="concept-tag">{t('topbar.demo')}</span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header__inner">
          <Link to="/" className="brand" aria-label="Sarathi home">
            <LogoMark />
            <span className="brand__text">
              <strong>Sarathi</strong>
              <span>{t('brand.sub')}</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link to="/#all-services">{t('nav.services')}</Link>
            <NavLink to="/status">{t('nav.track')}</NavLink>
            <Link to="/services/learner-licence-test">{t('nav.appointments')}</Link>
            <NavLink to="/help">{t('nav.help')}</NavLink>
          </nav>

          <div className="header__actions">
            <span className="state-chip" title={t('header.delhiTitle')}>
              <Icon name="mapPin" size={16} />
              {t('header.delhi')}
            </span>
            <LanguageSwitch />
            <Link to="/resume" className="btn btn--primary btn--sm header__resume">
              {t('nav.resume')}
            </Link>
            <details className="mobile-menu">
              <summary aria-label={t('nav.menu')}>
                <Icon name="menu" size={22} />
              </summary>
              <div className="mobile-menu__panel">
                <Link to="/#all-services">{t('nav.services')}</Link>
                <Link to="/status">{t('nav.track')}</Link>
                <Link to="/services/learner-licence-test">{t('nav.appointments')}</Link>
                <Link to="/help">{t('nav.help')}</Link>
                <Link to="/resume">{t('nav.resume')}</Link>
                <Link to="/about">{t('footer.about')}</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="site-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="container footer__top">
          <div className="footer__brand">
            <div className="brand brand--footer">
              <LogoMark />
              <span className="brand__text">
                <strong>Sarathi</strong>
                <span>{t('brand.sub')}</span>
              </span>
            </div>
            <p>{t('footer.desc')}</p>
            <span className="footer__tag">{t('footer.conceptTag')}</span>
          </div>
          <div className="footer__cols">
            <div>
              <h2>{t('footer.colServices')}</h2>
              <ul>
                <li><Link to="/services/learner-licence">{t('footer.learner')}</Link></li>
                <li><Link to="/services/dl-renewal">{t('footer.renew')}</Link></li>
                <li><Link to="/services/duplicate-dl">{t('footer.duplicate')}</Link></li>
                <li><Link to="/status">{t('footer.track')}</Link></li>
              </ul>
            </div>
            <div>
              <h2>{t('footer.colHelp')}</h2>
              <ul>
                <li><Link to="/help#accessibility">{t('footer.a11y')}</Link></li>
                <li><Link to="/help#faq">{t('footer.faq')}</Link></li>
                <li><Link to="/about">{t('footer.about')}</Link></li>
                <li><Link to="/resume">{t('nav.resume')}</Link></li>
              </ul>
            </div>
            <div>
              <h2>{t('footer.colOfficial')}</h2>
              <ul>
                <li>
                  <a href="https://parivahan.gov.in" target="_blank" rel="noreferrer">
                    {t('footer.parivahan')} <Icon name="external" size={14} />
                  </a>
                </li>
                <li>
                  <a href="https://morth.nic.in" target="_blank" rel="noreferrer">
                    {t('footer.morth')} <Icon name="external" size={14} />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container footer__bottom">
          <p>{t('footer.disclaimer')}</p>
          <p className="footer__meta">© {new Date().getFullYear()} Sarathi concept · {lang === 'hi' ? 'भाषा: हिन्दी' : 'Language: English'}</p>
        </div>
      </footer>
    </>
  );
}
