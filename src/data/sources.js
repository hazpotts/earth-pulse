/**
 * Data source registry for Earth Pulse.
 * 
 * Each source defines:
 *  - url: the fetch endpoint
 *  - proxy: whether to route through the Cloudflare Worker CORS proxy
 *  - transform: function to normalize raw data into { year, value } series
 *  - unit: display unit
 *  - direction: 'up-bad' | 'down-bad' | 'neutral' for color coding trends
 */

const PROXY_BASE = import.meta.env.PROD
  ? 'https://earth-pulse-proxy.hazpotts.workers.dev'
  : 'http://localhost:8787';

export const proxyUrl = (url) => `${PROXY_BASE}?url=${encodeURIComponent(url)}`;

export const DOMAINS = {
  climate: {
    label: 'Climate',
    icon: '🌡️',
    color: 'var(--accent-climate)',
    colorHex: '#f97316',
  },
  poverty: {
    label: 'Poverty',
    icon: '📊',
    color: 'var(--accent-poverty)',
    colorHex: '#eab308',
  },
  health: {
    label: 'Health',
    icon: '🏥',
    color: 'var(--accent-health)',
    colorHex: '#22d3ee',
  },
  conflict: {
    label: 'Conflict',
    icon: '⚔️',
    color: 'var(--accent-conflict)',
    colorHex: '#ef4444',
  },
  biodiversity: {
    label: 'Biodiversity',
    icon: '🌿',
    color: 'var(--accent-biodiversity)',
    colorHex: '#22c55e',
  },
};

export const SOURCES = {
  // ─── CLIMATE ───────────────────────────────────────────
  co2_emissions: {
    domain: 'climate',
    label: 'Global CO₂ Emissions',
    unit: 'billion tonnes',
    direction: 'up-bad',
    source: 'Our World in Data / Global Carbon Project',
    sourceUrl: 'https://ourworldindata.org/co2-emissions',
    url: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv',
    proxy: false,
    transform: (csv) => {
      return csv
        .filter(r => r.country === 'World' && r.year && r.co2)
        .map(r => ({ year: +r.year, value: +(+r.co2 / 1000).toFixed(2) }))
        .filter(r => r.year >= 2015 && r.value > 0);
    },
  },

  temperature_anomaly: {
    domain: 'climate',
    label: 'Temperature Anomaly',
    unit: '°C vs 1951-80 avg',
    direction: 'up-bad',
    source: 'NASA GISTEMP v4',
    sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
    url: 'https://data.giss.nasa.gov/gistemp/graphs_v4/graph_data/Global_Mean_Estimates_based_on_Land_and_Ocean_Data/graph.csv',
    proxy: true,
    // GISTEMP CSVs have a title line before the actual CSV header — skip to the Year line
    preprocess: (text) => {
      const lines = text.split('\n');
      const idx = lines.findIndex(l => /^\s*Year\s*,/i.test(l));
      return idx >= 0 ? lines.slice(idx).join('\n') : text;
    },
    transform: (csv) => {
      return csv
        .filter(r => r.Year && r['No_Smoothing'])
        .map(r => ({ year: +r.Year, value: +parseFloat(r['No_Smoothing']).toFixed(2) }))
        .filter(r => r.year >= 2015 && !isNaN(r.value));
    },
  },

  co2_concentration: {
    domain: 'climate',
    label: 'Atmospheric CO₂',
    unit: 'ppm',
    direction: 'up-bad',
    source: 'NOAA Global Monitoring Lab',
    sourceUrl: 'https://gml.noaa.gov/ccgg/trends/',
    url: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv',
    proxy: true,
    transform: (csv) => {
      return csv
        .filter(r => r.year && r.mean)
        .map(r => ({ year: +r.year, value: +parseFloat(r.mean).toFixed(1) }))
        .filter(r => r.year >= 2015);
    },
  },

  // ─── POVERTY ───────────────────────────────────────────
  extreme_poverty: {
    domain: 'poverty',
    label: 'Extreme Poverty Rate',
    unit: '% under $2.15/day',
    direction: 'down-good',
    source: 'World Bank PIP',
    sourceUrl: 'https://pip.worldbank.org/',
    url: 'https://api.worldbank.org/v2/country/WLD/indicator/SI.POV.DDAY?format=json&per_page=500&date=2015:2025',
    proxy: false,
    isJson: true,
    transform: (json) => {
      const data = json[1] || [];
      return data
        .filter(r => r.value !== null)
        .map(r => ({ year: +r.date, value: +r.value.toFixed(1) }))
        .sort((a, b) => a.year - b.year);
    },
  },

  gdp_per_capita: {
    domain: 'poverty',
    label: 'World GDP per Capita',
    unit: 'USD (current)',
    direction: 'up-good',
    source: 'World Bank',
    sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD',
    url: 'https://api.worldbank.org/v2/country/WLD/indicator/NY.GDP.PCAP.CD?format=json&per_page=500&date=2015:2025',
    proxy: false,
    isJson: true,
    transform: (json) => {
      const data = json[1] || [];
      return data
        .filter(r => r.value !== null)
        .map(r => ({ year: +r.date, value: Math.round(r.value) }))
        .sort((a, b) => a.year - b.year);
    },
  },

  gini_index: {
    domain: 'poverty',
    label: 'Gini Index (Select Countries)',
    unit: 'index (0-100)',
    direction: 'down-good',
    source: 'World Bank',
    sourceUrl: 'https://data.worldbank.org/indicator/SI.POV.GINI',
    url: 'https://api.worldbank.org/v2/country/USA;CHN;IND;BRA;DEU/indicator/SI.POV.GINI?format=json&per_page=500&date=2010:2025',
    proxy: true,
    isJson: true,
    transform: (json) => {
      const data = json[1] || [];
      return data
        .filter(r => r.value !== null)
        .map(r => ({
          year: +r.date,
          value: +r.value.toFixed(1),
          country: r.country.value,
        }))
        .sort((a, b) => a.year - b.year);
    },
    isMultiSeries: true,
    seriesKey: 'country',
  },

  // ─── HEALTH ────────────────────────────────────────────
  life_expectancy: {
    domain: 'health',
    label: 'Global Life Expectancy',
    unit: 'years at birth',
    direction: 'up-good',
    source: 'WHO GHO',
    sourceUrl: 'https://www.who.int/data/gho',
    // Note: WHOSIS_000001 at GLOBAL only has SEX_MLE / SEX_FMLE — no BTSX combined row.
    // Fetch both sexes and average them per year.
    url: 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim%20eq%20%27GLOBAL%27',
    proxy: true,
    isJson: true,
    transform: (json) => {
      const data = json.value || [];
      // Average male + female life expectancy per year
      const byYear = {};
      data.filter(r => r.NumericValue && r.TimeDim).forEach(r => {
        const year = +r.TimeDim;
        if (!byYear[year]) byYear[year] = { sum: 0, count: 0 };
        byYear[year].sum += parseFloat(r.NumericValue);
        byYear[year].count += 1;
      });
      return Object.entries(byYear)
        .map(([y, { sum, count }]) => ({ year: +y, value: +(sum / count).toFixed(1) }))
        .filter(r => r.year >= 2015)
        .sort((a, b) => a.year - b.year);
    },
  },

  child_mortality: {
    domain: 'health',
    label: 'Under-5 Mortality',
    unit: 'per 1,000 live births',
    direction: 'down-good',
    source: 'World Bank',
    sourceUrl: 'https://data.worldbank.org/indicator/SH.DYN.MORT',
    url: 'https://api.worldbank.org/v2/country/WLD/indicator/SH.DYN.MORT?format=json&per_page=500&date=2015:2025',
    proxy: false,
    isJson: true,
    transform: (json) => {
      const data = json[1] || [];
      return data
        .filter(r => r.value !== null)
        .map(r => ({ year: +r.date, value: +r.value.toFixed(1) }))
        .sort((a, b) => a.year - b.year);
    },
  },

  vaccination_dtp3: {
    domain: 'health',
    label: 'DTP3 Vaccination (Global)',
    unit: '% of infants',
    direction: 'up-good',
    source: 'WHO GHO',
    sourceUrl: 'https://www.who.int/data/gho',
    url: 'https://ghoapi.azureedge.net/api/WHS4_100?$filter=SpatialDim%20eq%20%27GLOBAL%27',
    proxy: true,
    isJson: true,
    transform: (json) => {
      const data = json.value || [];
      return data
        .filter(r => r.NumericValue && r.TimeDim)
        .map(r => ({ year: +r.TimeDim, value: +parseFloat(r.NumericValue).toFixed(1) }))
        .filter(r => r.year >= 2015)
        .sort((a, b) => a.year - b.year);
    },
  },

  // ─── CONFLICT ──────────────────────────────────────────
  refugees: {
    domain: 'conflict',
    label: 'Forcibly Displaced People',
    unit: 'millions',
    direction: 'up-bad',
    source: 'UNHCR',
    sourceUrl: 'https://www.unhcr.org/refugee-statistics/',
    url: 'https://api.unhcr.org/population/v1/population/?yearFrom=2015&yearTo=2025&coa_all=true&limit=5000',
    proxy: false,
    isJson: true,
    transform: (json) => {
      const items = json.items || [];
      // Group by year, sum refugees + idps + stateless.
      // Use Number() to ensure numeric addition — API may return string values.
      const byYear = {};
      items.forEach(r => {
        const year = +r.year;
        if (!year) return;
        const total = (Number(r.refugees) || 0) + (Number(r.idps) || 0) + (Number(r.stateless) || 0);
        if (!isFinite(total)) return;
        byYear[year] = (byYear[year] || 0) + total;
      });
      return Object.entries(byYear)
        .map(([y, v]) => ({ year: +y, value: +(v / 1_000_000).toFixed(1) }))
        .sort((a, b) => a.year - b.year);
    },
  },

  conflict_deaths: {
    domain: 'conflict',
    label: 'Battle Deaths (State Conflicts)',
    unit: 'thousands',
    direction: 'down-good',
    source: 'OWID / UCDP',
    sourceUrl: 'https://ourworldindata.org/war-and-peace',
    url: 'https://ourworldindata.org/grapher/deaths-in-state-based-conflicts.csv?v=1&csvType=full&useColumnShortNames=true',
    proxy: true,
    transform: (csv) => {
      if (!csv.length) return [];
      const keys = Object.keys(csv[0]);
      const metaCols = ['entity', 'year', 'code', 'Entity', 'Year', 'Code'];
      const dataCol = keys.find(k => !metaCols.includes(k));
      if (!dataCol) return [];

      // Try World aggregate row first
      const worldRows = csv.filter(r => (r.entity === 'World' || r.Entity === 'World') && (r.year || r.Year));
      if (worldRows.length) {
        return worldRows
          .map(r => ({ year: +(r.year || r.Year), value: +(parseFloat(r[dataCol]) / 1000).toFixed(1) }))
          .filter(r => r.year >= 2015 && !isNaN(r.value) && r.value > 0);
      }

      // No World row — aggregate all entities per year
      const byYear = {};
      csv.forEach(r => {
        const year = +(r.year || r.Year);
        if (year >= 2015 && year <= 2030) {
          const v = parseFloat(r[dataCol]);
          if (!isNaN(v) && v > 0) byYear[year] = (byYear[year] || 0) + v;
        }
      });
      return Object.entries(byYear)
        .map(([y, v]) => ({ year: +y, value: +(v / 1000).toFixed(1) }))
        .filter(r => r.value > 0)
        .sort((a, b) => a.year - b.year);
    },
  },

  // ─── BIODIVERSITY ──────────────────────────────────────
  red_list_index: {
    domain: 'biodiversity',
    label: 'Red List Index',
    unit: 'index (1 = no threat)',
    direction: 'down-bad',
    source: 'OWID / IUCN',
    sourceUrl: 'https://ourworldindata.org/grapher/red-list-index',
    url: 'https://ourworldindata.org/grapher/red-list-index.csv?v=1&csvType=full&useColumnShortNames=true',
    proxy: false,
    transform: (csv) => {
      return csv
        .filter(r => (r.entity === 'World' || r.Entity === 'World') && (r.year || r.Year))
        .map(r => {
          const year = +(r.year || r.Year);
          const vals = Object.values(r).map(Number).filter(v => !isNaN(v) && v < 1 && v > 0);
          return { year, value: vals.length ? +vals[0].toFixed(3) : null };
        })
        .filter(r => r.year >= 2015 && r.value !== null);
    },
  },

  forest_area: {
    domain: 'biodiversity',
    label: 'Global Forest Area',
    unit: 'million km²',
    direction: 'down-bad',
    source: 'OWID / FAO',
    sourceUrl: 'https://ourworldindata.org/grapher/forest-area-km',
    url: 'https://ourworldindata.org/grapher/forest-area-km.csv?v=1&csvType=full&useColumnShortNames=true',
    proxy: false,
    transform: (csv) => {
      return csv
        .filter(r => (r.entity === 'World' || r.Entity === 'World') && (r.year || r.Year))
        .map(r => {
          const year = +(r.year || r.Year);
          const vals = Object.values(r).map(Number).filter(v => !isNaN(v) && v > 1000000);
          return { year, value: vals.length ? +(vals[0] / 1_000_000).toFixed(2) : null };
        })
        .filter(r => r.year >= 2010 && r.value !== null);
    },
  },

  threatened_species: {
    domain: 'biodiversity',
    label: 'Threatened Species',
    unit: 'total species',
    direction: 'up-bad',
    source: 'OWID / IUCN',
    sourceUrl: 'https://ourworldindata.org/grapher/number-species-threatened',
    url: 'https://ourworldindata.org/grapher/number-species-threatened.csv?v=1&csvType=full&useColumnShortNames=true',
    proxy: true,
    transform: (csv) => {
      if (!csv.length) return [];
      const keys = Object.keys(csv[0]);
      const metaCols = ['entity', 'year', 'code', 'Entity', 'Year', 'Code'];
      const dataCol = keys.find(k => !metaCols.includes(k));
      if (!dataCol) return [];

      // OWID threatened species dataset uses "All groups" as the global total entity
      return csv
        .filter(r => {
          const entity = r.entity || r.Entity || '';
          return (entity === 'All groups' || entity === 'World') && (r.year || r.Year);
        })
        .map(r => {
          const year = +(r.year || r.Year);
          const value = parseFloat(r[dataCol]);
          return { year, value: (!isNaN(value) && value > 0) ? Math.round(value) : null };
        })
        .filter(r => r.year >= 2000 && r.value !== null);
    },
  },
};
