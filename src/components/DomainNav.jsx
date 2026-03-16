import React from 'react';
import { DOMAINS } from '../data/sources.js';

const ALL_DOMAINS = Object.keys(DOMAINS);

export default function DomainNav({ active, onSelect }) {
  return (
    <nav style={{
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap',
      marginBottom: 'var(--space-xl)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'var(--bg-primary)',
      paddingTop: 'var(--space-md)',
      paddingBottom: 'var(--space-md)',
      borderBottom: '1px solid var(--border)',
    }}>
      <TabButton
        active={active === 'all'}
        onClick={() => onSelect('all')}
        color="var(--accent-glow)"
        label="All Domains"
      />
      {ALL_DOMAINS.map(key => {
        const d = DOMAINS[key];
        return (
          <TabButton
            key={key}
            active={active === key}
            onClick={() => onSelect(key)}
            color={d.colorHex}
            label={`${d.icon} ${d.label}`}
          />
        );
      })}
    </nav>
  );
}

function TabButton({ active, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        background: active ? `${color}15` : 'transparent',
        color: active ? color : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.target.style.borderColor = color;
          e.target.style.color = color;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {label}
    </button>
  );
}
