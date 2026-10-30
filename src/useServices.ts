import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useLang } from './i18n';
import type { Category, Service } from './types';

export function useServices() {
  const { t } = useLang();
  const [services, setServices] = useState<Service[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [catalog, meta] = await Promise.all([api.services(), api.meta()]);
      setServices(catalog.services);
      setCategories(meta.categories);
    } catch {
      setError(t('errors.NETWORK'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { services, categories, error, reload: load, loading: !services && !error };
}
