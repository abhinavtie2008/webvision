import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../hooks';
import { useLang } from '../i18n';

export function NotFound() {
  const { t } = useLang();
  useDocumentTitle(t('common.notFound'));

  return (
    <div className="container page narrow">
      <div className="empty-state empty-state--page">
        <span className="empty-state__icon"><Icon name="route" size={30} /></span>
        <h1>{t('common.notFound')}</h1>
        <p className="muted">{t('common.notFoundDesc')}</p>
        <div className="empty-state__actions">
          <Link to="/" className="btn btn--primary">{t('common.backHome')}</Link>
          <Link to="/status" className="btn btn--quiet">{t('nav.track')}</Link>
        </div>
      </div>
    </div>
  );
}
