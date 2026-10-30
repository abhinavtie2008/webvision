import { useEffect } from 'react';

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · Sarathi concept` : 'Sarathi — Driving licence services (concept)';
  }, [title]);
}
