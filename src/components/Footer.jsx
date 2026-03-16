import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 'var(--space-2xl)',
      paddingTop: 'var(--space-lg)',
      paddingBottom: 'var(--space-xl)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 'var(--space-md)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
    }}>
      <div>
        Data from{' '}
        <FooterLink href="https://ourworldindata.org">Our World in Data</FooterLink>,{' '}
        <FooterLink href="https://data.worldbank.org">World Bank</FooterLink>,{' '}
        <FooterLink href="https://www.who.int/data/gho">WHO</FooterLink>,{' '}
        <FooterLink href="https://data.giss.nasa.gov/gistemp/">NASA GISTEMP</FooterLink>,{' '}
        <FooterLink href="https://gml.noaa.gov/ccgg/trends/">NOAA</FooterLink>,{' '}
        <FooterLink href="https://www.unhcr.org/refugee-statistics/">UNHCR</FooterLink>,{' '}
        <FooterLink href="https://www.iucnredlist.org/">IUCN</FooterLink>
      </div>
      <div>
        <FooterLink href="https://github.com/your-username/earth-pulse">
          GitHub ↗
        </FooterLink>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        borderBottom: '1px solid var(--border)',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        e.target.style.color = 'var(--accent-glow)';
        e.target.style.borderColor = 'var(--accent-glow)';
      }}
      onMouseLeave={e => {
        e.target.style.color = 'var(--text-secondary)';
        e.target.style.borderColor = 'var(--border)';
      }}
    >
      {children}
    </a>
  );
}
