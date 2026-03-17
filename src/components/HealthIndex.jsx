import React from 'react';
import { useSourceData } from '../hooks/useSourceData.js';
import { DOMAINS } from '../data/sources.js';

/**
 * Normalizes a raw metric value to a 0–100 score where 100 = best possible.
 * Each metric has a "bad" and "good" reference point based on recent historical ranges.
 */
const SCORING = {
  climate: {
    key: 'temperature_anomaly',
    label: 'Temperature Anomaly',
    bad: 1.8,    // 1.8°C anomaly → score 0
    good: 0.5,   // 0.5°C anomaly → score 100
    invert: true, // lower raw value = better
  },
  poverty: {
    key: 'extreme_poverty',
    label: 'Extreme Poverty',
    bad: 15,     // 15% → score 0
    good: 0,     // 0% → score 100
    invert: true,
  },
  health: {
    key: 'life_expectancy',
    label: 'Life Expectancy',
    bad: 60,     // 60 years → score 0
    good: 80,    // 80 years → score 100
    invert: false, // higher raw value = better
  },
  conflict: {
    key: 'refugees',
    label: 'Displaced People',
    bad: 120,    // 120 million → score 0
    good: 20,    // 20 million → score 100
    invert: true,
  },
  biodiversity: {
    key: 'red_list_index',
    label: 'Red List Index',
    bad: 0.6,    // 0.6 → score 0
    good: 1.0,   // 1.0 → score 100
    invert: false,
  },
};

function normalize(value, { bad, good }) {
  if (value === null || value === undefined) return null;
  const score = ((value - bad) / (good - bad)) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreColor(score) {
  if (score === null) return 'var(--text-muted)';
  if (score >= 70) return 'var(--accent-biodiversity)';
  if (score >= 45) return 'var(--accent-poverty)';
  return 'var(--accent-conflict)';
}

function getScoreLabel(score) {
  if (score === null) return '—';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Concerning';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

function DomainScore({ domain, scoring }) {
  const { data, loading } = useSourceData(scoring.key);
  const domainInfo = DOMAINS[domain];

  const latest = data?.length ? data[data.length - 1] : null;
  const score = latest ? normalize(latest.value, scoring) : null;
  const color = domainInfo.colorHex;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      flex: '1 1 0',
      minWidth: 120,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-xs)',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>
          {domainInfo.icon} {domainInfo.label}
        </span>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '…' : (score !== null ? score : '—')}
        </span>
      </div>
      {/* Bar */}
      <div style={{
        height: 4,
        borderRadius: 2,
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div
          className="health-bar-fill"
          style={{
            height: '100%',
            borderRadius: 2,
            background: color,
            width: loading ? '0%' : `${score ?? 0}%`,
            transition: 'width 1s ease-out',
          }}
        />
      </div>
    </div>
  );
}

export default function HealthIndex() {
  const domains = Object.keys(SCORING);

  // Collect scores from each domain
  const scores = domains.map(domain => {
    const scoring = SCORING[domain];
    return { domain, scoring };
  });

  return (
    <HealthIndexInner scores={scores} domains={domains} />
  );
}

function HealthIndexInner({ scores, domains }) {
  // We need to use hooks at top level for each domain source
  return <HealthIndexWithData domains={domains} />;
}

function HealthIndexWithData({ domains }) {
  // Fetch all domain metrics
  const climate = useSourceData(SCORING.climate.key);
  const poverty = useSourceData(SCORING.poverty.key);
  const health = useSourceData(SCORING.health.key);
  const conflict = useSourceData(SCORING.conflict.key);
  const biodiversity = useSourceData(SCORING.biodiversity.key);

  const allData = { climate, poverty, health, conflict, biodiversity };

  const domainScores = domains.map(domain => {
    const { data } = allData[domain];
    const latest = data?.length ? data[data.length - 1] : null;
    return latest ? normalize(latest.value, SCORING[domain]) : null;
  });

  const validScores = domainScores.filter(s => s !== null);
  const overallScore = validScores.length
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  const allLoading = Object.values(allData).every(d => d.loading);
  const anyLoading = Object.values(allData).some(d => d.loading);

  return (
    <div className="fade-up" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-xl)',
    }}>
      {/* Top row: overall score + label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
      }}>
        {/* Score circle */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `3px solid ${getScoreColor(overallScore)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          background: 'var(--bg-primary)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xl)',
            fontWeight: 300,
            color: getScoreColor(overallScore),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {allLoading ? '…' : (overallScore !== null ? overallScore : '—')}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--space-sm)',
            marginBottom: 2,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              fontWeight: 400,
            }}>
              World Health Index
            </span>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}>
              / 100
            </span>
          </div>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: getScoreColor(overallScore),
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
            marginBottom: 'var(--space-xs)',
          }}>
            {allLoading ? 'Calculating…' : getScoreLabel(overallScore)}
          </div>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Composite score across {domains.length} domains based on latest available data.
            {anyLoading && !allLoading ? ' Some metrics still loading.' : ''}
          </p>
        </div>
      </div>

      {/* Domain breakdown bars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 'var(--space-md)',
      }}>
        {domains.map(domain => (
          <DomainScore
            key={domain}
            domain={domain}
            scoring={SCORING[domain]}
          />
        ))}
      </div>
    </div>
  );
}
