import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { SOURCES, proxyUrl } from '../data/sources.js';

const cache = new Map();
const pending = new Map(); // deduplicates in-flight requests for the same key

async function loadSource(sourceKey) {
  if (cache.has(sourceKey)) return cache.get(sourceKey);
  if (pending.has(sourceKey)) return pending.get(sourceKey);

  const source = SOURCES[sourceKey];
  const url = source.proxy ? proxyUrl(source.url) : source.url;

  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    let parsed;
    if (source.isJson) {
      parsed = await res.json();
    } else {
      const text = await res.text();
      const cleaned = text.split('\n').filter(line => !line.startsWith('#')).join('\n');
      const result = Papa.parse(cleaned, { header: true, skipEmptyLines: true, dynamicTyping: false });
      parsed = result.data;
    }

    const transformed = source.transform(parsed);
    cache.set(sourceKey, transformed);
    pending.delete(sourceKey);
    return transformed;
  })().catch(err => {
    pending.delete(sourceKey);
    throw err;
  });

  pending.set(sourceKey, promise);
  return promise;
}

export function useSourceData(sourceKey) {
  const [data, setData] = useState(() => cache.get(sourceKey) || null);
  const [loading, setLoading] = useState(!cache.has(sourceKey));
  const [error, setError] = useState(null);

  useEffect(() => {
    const source = SOURCES[sourceKey];
    if (!source) {
      setError(`Unknown source: ${sourceKey}`);
      setLoading(false);
      return;
    }

    if (cache.has(sourceKey)) {
      setData(cache.get(sourceKey));
      setLoading(false);
      return;
    }

    let cancelled = false;
    loadSource(sourceKey)
      .then(d => {
        if (!cancelled) { setData(d); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) {
          console.warn(`Failed to load ${sourceKey}:`, err);
          setError(err.message);
          setLoading(false);
          const logBase = import.meta.env.PROD
            ? 'https://earth-pulse-proxy.hazpotts.workers.dev'
            : 'http://localhost:8787';
          fetch(`${logBase}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: sourceKey, error: err.message, url: source.url }),
          }).catch(() => {});
        }
      });

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

    Promise.all(
      sourceKeys.map(key =>
        loadSource(key)
          .then(data => [key, { data, error: null }])
          .catch(err => {
            console.warn(`Failed: ${key}`, err);
            return [key, { data: null, error: err.message }];
          })
      )
    ).then(entries => {
      if (!cancelled) {
        setResults(Object.fromEntries(entries));
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [domain]);

  return { results, loading, sourceKeys };
}
