import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../hooks';
import { useLang } from '../i18n';

const FAQ = [1, 2, 3, 4, 5, 6];
const A11Y = ['1', '2', '3', '4', '5', '6'];

export function Help() {
  const { t } = useLang();
  useDocumentTitle(t('help.title'));

  return (
    <div className="container page narrow">
      <nav className="breadcrumb" aria-label={t('common.home')}>
        <Link to="/">{t('common.home')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{t('help.title')}</span>
      </nav>

      <div className="page-hero">
        <p className="eyebrow">{t('nav.help')}</p>
        <h1>{t('help.title')}</h1>
        <p className="lede">{t('help.desc')}</p>
      </div>

      <section className="card" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">{t('help.faqTitle')}</h2>
        <div className="faq">
          {FAQ.map((number) => (
            <details key={number} className="faq__item">
              <summary>
                <span>{t(`help.q${number}`)}</span>
                <Icon name="chevronDown" size={18} />
              </summary>
              <p>{t(`help.a${number}`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card" id="accessibility" aria-labelledby="a11y-title">
        <h2 id="a11y-title">{t('help.a11yTitle')}</h2>
        <p>{t('help.a11yIntro')}</p>
        <ul className="check-list">
          {A11Y.map((number) => (
            <li key={number}>
              <span className="check-list__mark" aria-hidden="true"><Icon name="check" size={15} /></span>
              <span>{t(`help.a11y.${number}`)}</span>
            </li>
          ))}
        </ul>
        <p className="field__hint">
          <Link to="/about" className="link-button">{t('footer.about')}</Link>
        </p>
      </section>

      <section className="card" aria-labelledby="contact-title">
        <h2 id="contact-title">{t('help.contactTitle')}</h2>
        <p>{t('help.contactBody')}</p>
        <a className="btn btn--quiet" href="https://parivahan.gov.in" target="_blank" rel="noreferrer">
          {t('help.officialLink')} <Icon name="external" size={16} />
        </a>
      </section>
    </div>
  );
}
