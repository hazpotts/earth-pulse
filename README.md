# 🌍 Earth Pulse

A live global issues tracker pulling from regularly-updated open data sources. Tracks climate, poverty, health, conflict, and biodiversity metrics with interactive time-series charts.

## Architecture

```
earth-pulse/
├── src/                  # React app (Cloudflare Pages)
│   ├── components/       # Dashboard UI components
│   ├── hooks/            # Data fetching hooks
│   ├── data/             # Source configs & transforms
│   └── styles/           # Global styles
├── worker/               # Cloudflare Worker (CORS proxy for .gov APIs)
└── .github/workflows/    # CI/CD — auto-deploy on push to main
```

## Data Sources

| Domain | Source | Update Freq |
|--------|--------|------------|
| Climate | OWID CO₂, NASA GISTEMP (via proxy), NOAA CO₂ (via proxy) | Monthly |
| Poverty | World Bank API, OWID poverty data | Quarterly |
| Health | WHO GHO OData API, OWID health CSVs | Annual+ |
| Conflict | GDELT (15-min), UNHCR API, OWID conflict data | Real-time to annual |
| Biodiversity | OWID Red List/LPI/forest data, GBIF | Annual |

## Deployment

**Automatic**: Push to `main` → GitHub Actions deploys both:
- **Pages** (dashboard) → `earth-pulse.pages.dev`
- **Worker** (CORS proxy) → `earth-pulse-proxy.workers.dev`

### Manual Setup

1. Clone this repo
2. `npm install`
3. `npm run dev` — local dev server on `:5173`
4. Set Cloudflare secrets in GitHub repo settings:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` (with Pages + Workers edit permissions)

## Local Development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run deploy:worker # Deploy worker manually
```

## License

MIT
