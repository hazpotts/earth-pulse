/**
 * Earth Pulse CORS Proxy — Cloudflare Worker
 * 
 * Proxies requests to .gov data APIs (NOAA, NASA, NSIDC, WHO)
 * that don't set CORS headers. Aggressive caching since most
 * data updates daily or monthly at most.
 */

const ALLOWED_ORIGINS = [
  'https://earth-pulse.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
];

// Allowlisted upstream hosts — only proxy known data sources
const ALLOWED_HOSTS = [
  'gml.noaa.gov',
  'data.giss.nasa.gov',
  'noaadata.apps.nsidc.org',
  'ghoapi.azureedge.net',
  'www.who.int',
  'api.reliefweb.int',
  'api.worldbank.org',
];

// Cache durations by host (seconds)
const CACHE_TTL = {
  'gml.noaa.gov': 3600,           // 1 hour (daily data)
  'data.giss.nasa.gov': 86400,    // 24 hours (monthly updates)
  'noaadata.apps.nsidc.org': 3600, // 1 hour (daily data)
  'ghoapi.azureedge.net': 86400,  // 24 hours (annual data)
  'www.who.int': 86400,
  'api.reliefweb.int': 1800,      // 30 min
  'api.worldbank.org': 86400,
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    if (!target) {
      return handleCORS(request, new Response(
        JSON.stringify({ error: 'Missing ?url= parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return handleCORS(request, new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    // Security: only proxy allowed hosts
    if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
      return handleCORS(request, new Response(
        JSON.stringify({ error: `Host not allowed: ${targetUrl.hostname}` }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(target, request);
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch from upstream
      try {
        response = await fetch(target, {
          headers: {
            'User-Agent': 'EarthPulse/1.0 (https://earth-pulse.pages.dev)',
            'Accept': '*/*',
          },
        });
      } catch (err) {
        return handleCORS(request, new Response(
          JSON.stringify({ error: `Upstream fetch failed: ${err.message}` }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        ));
      }

      // Clone and cache
      const ttl = CACHE_TTL[targetUrl.hostname] || 3600;
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', `public, max-age=${ttl}`);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return handleCORS(request, response);
  },
};

function handleCORS(request, response) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
