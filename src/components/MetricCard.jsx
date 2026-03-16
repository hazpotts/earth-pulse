import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { SOURCES, DOMAINS } from '../data/sources.js';
import { useSourceData } from '../hooks/useSourceData.js';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      padding: '8px 12px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
        {payload[0].value} {unit}
      </div>
    </div>
  );
};

export default function MetricCard({ sourceKey, delay = 0 }) {
  const source = SOURCES[sourceKey];
  const domain = DOMAINS[source.domain];
  const { data, loading, error } = useSourceData(sourceKey);

  const latest = data?.length ? data[data.length - 1] : null;
  const previous = data?.length > 1 ? data[data.length - 2] : null;
  const trend = latest && previous ? latest.value - previous.value : null;
  const trendPct = trend !== null && previous?.value
    ? ((trend / Math.abs(previous.value)) * 100).toFixed(1)
    : null;

  // Determine if trend is good or bad
  const isBadTrend = trend !== null && (
    (source.direction === 'up-bad' && trend > 0) ||
    (source.direction === 'down-good' && trend > 0) ||
    (source.direction === 'down-bad' && trend < 0) ||
    (source.direction === 'up-good' && trend < 0)
  );

  return (
    <div
      className={`fade-up fade-up-${delay}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        transition: 'border-color 0.2s, background 0.2s',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = domain.colorHex;
        e.currentTarget.style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      {/* Domain tag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: domain.colorHex,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {domain.icon} {domain.label}
        </span>
        {latest && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            {latest.year}
          </span>
        )}
      </div>

      {/* Metric name */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-lg)',
        color: 'var(--text-primary)',
        lineHeight: 1.2,
      }}>
        {source.label}
      </div>

      {/* Value + trend */}
      {loading ? (
        <div style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: domain.colorHex,
            animation: 'pulse-dot 1.5s infinite',
          }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Loading…
          </span>
        </div>
      ) : error ? (
        <div style={{
          color: 'var(--accent-conflict)',
          fontSize: 'var(--text-xs)',
          padding: 'var(--space-sm)',
          background: 'rgba(239,68,68,0.08)',
          borderRadius: 'var(--radius-sm)',
        }}>
          Failed to load: {error}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 300,
              color: 'var(--text-primary)',
            }}>
              {typeof latest?.value === 'number'
                ? latest.value.toLocaleString()
                : '—'}
            </span>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}>
              {source.unit}
            </span>
          </div>

          {trendPct !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              fontSize: 'var(--text-xs)',
              color: isBadTrend ? 'var(--accent-conflict)' : 'var(--accent-biodiversity)',
            }}>
              <span>{trend > 0 ? '▲' : '▼'}</span>
              <span>{Math.abs(trendPct)}% from {previous.year}</span>
            </div>
          )}

          {/* Chart */}
          {data && data.length > 1 && (
            <div style={{ marginTop: 'var(--space-sm)', height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`grad-${sourceKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={domain.colorHex} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={domain.colorHex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip unit={source.unit} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={domain.colorHex}
                    strokeWidth={2}
                    fill={`url(#grad-${sourceKey})`}
                    dot={false}
                    activeDot={{ r: 4, fill: domain.colorHex, stroke: 'var(--bg-card)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Source attribution */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 'var(--space-sm)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          maxWidth: '70%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {source.source}
        </span>
        <a
          href={source.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'var(--text-xs)',
            color: domain.colorHex,
            textDecoration: 'none',
            opacity: 0.7,
          }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0.7}
        >
          Source ↗
        </a>
      </div>
    </div>
  );
}
