import React, { useState, useEffect } from 'react';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      padding: 'var(--space-xl) 0 var(--space-lg)',
      borderBottom: '1px solid var(--border)',
      marginBottom: 'var(--space-xl)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div>
          {/* Live indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-sm)',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent-glow)',
              boxShadow: '0 0 8px var(--accent-glow)',
              animation: 'pulse-dot 2s infinite',
            }} />
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-glow)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 500,
            }}>
              Live data
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(2rem, 5vw, var(--text-3xl))',
            fontWeight: 300,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            Earth Pulse
          </h1>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-sm)',
            maxWidth: 520,
            lineHeight: 1.5,
          }}>
            Tracking the planet's critical metrics — climate, poverty, health,
            conflict, and biodiversity — from regularly updated open data sources.
          </p>
        </div>

        <div style={{
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}>
          <div>{time.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</div>
          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
            {time.toLocaleTimeString('en-GB')} UTC{time.getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(time.getTimezoneOffset() / 60)}
          </div>
        </div>
      </div>
    </header>
  );
}
