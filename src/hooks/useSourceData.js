import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { SOURCES, proxyUrl } from '../data/sources.js';

const cache = new Map();

export function useSourceData(sourceKey) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const source = SOURCES[sourceKey];
    if (!source) {
      setError(`Unknown source: ${sourceKey}`);
      setLoading(false);
      return;
    }

    // Check memory cache
    if (cache.has(sourceKey)) {
      setData(cache.get(sourceKey));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      try {
        const url = source.proxy ? proxyUrl(source.url) : source.url;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        let parsed;
        if (source.isJson) {
          parsed = await res.json();
        } else {
          const text = await res.text();
          // Strip comment lines (NOAA files have # headers)
          const cleaned = text
            .split('\n')
            .filter(line => !line.startsWith('#'))
            .join('\n');
          const result = Papa.parse(cleaned, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
          });
          parsed = result.data;
        }

        const transformed = source.transform(parsed);
        if (!cancelled) {
          cache.set(sourceKey, transformed);
          setData(transformed);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn(`Failed to load ${sourceKey}:`, err);
          setError(err.message);
          setLoading(false);
          // Forward error to worker log endpoint
          const logBase = import.meta.env.PROD
            ? 'https://earth-pulse-proxy.workers.dev'
            : 'http://localhost:8787';
          fetch(`${logBase}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: sourceKey, error: err.message, url: source.url }),
          }).catch(() => {});
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [sourceKey]);

  return { data, loading, error };
}

/**
 * Load all sources for a domain at once.
 */
export function useDomainData(domain) {
  const sourceKeys = Object.entries(SOURCES)
    .filter(([, s]) => s.domain === domain)
    .map(([key]) => key);

  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const entries = await Promise.all(
        sourceKeys.map(async (key) => {
          const source = SOURCES[key];
          if (cache.has(key)) return [key, { data: cache.get(key), error: null }];

          try {
            const url = source.proxy ? proxyUrl(source.url) : source.url;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            let parsed;
            if (source.isJson) {
              parsed = await res.json();
            } else {
              const text = await res.text();
              const cleaned = text.split('\n').filter(l => !l.startsWith('#')).join('\n');
              parsed = Papa.parse(cleaned, { header: true, skipEmptyLines: true }).data;
            }

            const data = source.transform(parsed);
            cache.set(key, data);
            return [key, { data, error: null }];
          } catch (err) {
            console.warn(`Failed: ${key}`, err);
            return [key, { data: null, error: err.message }];
          }
        })
      );

      if (!cancelled) {
        setResults(Object.fromEntries(entries));
        setLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [domain]);

  return { results, loading, sourceKeys };
}
