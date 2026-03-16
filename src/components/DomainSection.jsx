import React from 'react';
import { SOURCES, DOMAINS } from '../data/sources.js';
import MetricCard from './MetricCard.jsx';

export default function DomainSection({ domain }) {
  const info = DOMAINS[domain];
  const sourceKeys = Object.entries(SOURCES)
    .filter(([, s]) => s.domain === domain)
    .map(([key]) => key);

  return (
    <section style={{
      marginBottom: 'var(--space-2xl)',
    }}>
      {/* Domain header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        paddingBottom: 'var(--space-sm)',
        borderBottom: `1px solid ${info.colorHex}22`,
      }}>
        <span style={{ fontSize: 'var(--text-xl)' }}>{info.icon}</span>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--text-xl)',
          fontWeight: 400,
          color: info.colorHex,
          fontStyle: 'italic',
        }}>
          {info.label}
        </h2>
        <div style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${info.colorHex}33, transparent)`,
        }} />
      </div>

      {/* Metric cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 'var(--space-md)',
      }}>
        {sourceKeys.map((key, i) => (
          <MetricCard key={key} sourceKey={key} delay={(i % 5) + 1} />
        ))}
      </div>
    </section>
  );
}
