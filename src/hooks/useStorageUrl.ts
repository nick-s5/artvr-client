import { useState, useEffect } from 'react';
import { getStorageUrl } from '../lib/firebase';

export function useStorageUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadUrl() {
      if (!path) {
        setUrl(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const downloadUrl = await getStorageUrl(path);
        setUrl(downloadUrl);
        setError(null);
      } catch (err) {
        console.error('Error loading storage URL:', err);
        setError(err as Error);
        setUrl(null);
      } finally {
        setLoading(false);
      }
    }

    loadUrl();
  }, [path]);

  return { url, loading, error };
}