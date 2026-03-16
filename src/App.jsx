import React, { useState } from 'react';
import Header from './components/Header.jsx';
import DomainNav from './components/DomainNav.jsx';
import DomainSection from './components/DomainSection.jsx';
import Footer from './components/Footer.jsx';
import { DOMAINS } from './data/sources.js';

const ALL_DOMAINS = Object.keys(DOMAINS);

export default function App() {
  const [activeDomain, setActiveDomain] = useState('all');

  const visibleDomains = activeDomain === 'all'
    ? ALL_DOMAINS
    : [activeDomain];

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 var(--space-lg)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header />
      <DomainNav active={activeDomain} onSelect={setActiveDomain} />

      <main style={{ flex: 1 }}>
        {visibleDomains.map(domain => (
          <DomainSection key={domain} domain={domain} />
        ))}
      </main>

      <Footer />

      {/* Background grain texture */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}
