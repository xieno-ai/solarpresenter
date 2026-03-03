import Image from 'next/image';

const ICON_BG = '#f5a623';

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: ICON_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// Icon 1: gauge / performance trending up
function GaugeIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
      <path d="M5 22 A12 12 0 0 1 27 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="22" x2="23" y2="13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2.5" fill="white" />
    </svg>
  );
}

// Icon 2: lightning bolt
function BoltIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
      <path
        d="M19 4L8 18h9l-4 10 15-16h-10z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon 3: crossed wrenches
function WrenchIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
      <path
        d="M20 4 a6 6 0 0 1 0 10 L10 24 a3 3 0 0 1-4-4 L16 10 a6 6 0 0 1 4-6z"
        stroke="white" strokeWidth="2" strokeLinejoin="round"
      />
      <path
        d="M12 4 a6 6 0 0 0 0 10 L22 24 a3 3 0 0 0 4-4 L16 10 a6 6 0 0 0-4-6z"
        stroke="white" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon 4: circle with checkmark
function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="white" strokeWidth="2.5" />
      <path d="M10 16 l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const WARRANTY_CARDS = [
  {
    term: '25 YEARS',
    title: 'Performance Warranty',
    desc: 'Your panels are guaranteed to produce at rated capacity',
    icon: <GaugeIcon />,
  },
  {
    term: '25 YEARS',
    title: 'Inverter Warranty',
    desc: 'Industry-leading coverage on your inverter hardware',
    icon: <BoltIcon />,
  },
  {
    term: 'LIFETIME',
    title: 'Workmanship Warranty',
    desc: 'Any issue with our installation — we fix it, no questions asked',
    icon: <WrenchIcon />,
  },
  {
    term: 'ALWAYS ON',
    title: '24/7 Production Monitoring',
    desc: 'Live system app tracking — verify your warranties in real time',
    icon: <CheckCircleIcon />,
  },
];

export function WarrantyPage() {
  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* Header row: text left + phone image right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
          }}
        >
          {/* Left: eyebrow + H1 + subtitle */}
          <div style={{ flex: 1, paddingRight: '2rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--nrg-green)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              Protection That Lasts
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '2.75rem',
                fontWeight: 800,
                color: 'var(--nrg-text-heading)',
                lineHeight: 1.1,
                marginBottom: '0.9rem',
              }}
            >
              Industry-Leading Warranty Coverage
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                color: 'var(--nrg-text-secondary)',
                lineHeight: 1.65,
                maxWidth: '58ch',
              }}
            >
              Solar is a long-term investment. Our warranty package is designed to give you complete
              peace of mind for the life of your system — and beyond.
            </p>
          </div>

          {/* Right: phone image */}
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/northernnrg-phone.png"
              alt="NRG monitoring app"
              width={364}
              height={338}
              style={{ display: 'block', objectFit: 'contain', marginTop: '-78px' }}
            />
          </div>
        </div>

        {/* 2×2 warranty card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.1rem',
            marginBottom: '1.25rem',
          }}
        >
          {WARRANTY_CARDS.map((card) => (
            <div
              key={card.title}
              style={{
                background: '#ffffff',
                border: '1.5px solid rgba(0,121,63,0.2)',
                borderRadius: '16px',
                padding: '1.4rem 1.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
              }}
            >
              <IconCircle>{card.icon}</IconCircle>

              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--nrg-text-heading)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {card.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--nrg-text-secondary)',
                    margin: '0.25rem 0 0.4rem',
                    lineHeight: 1.4,
                  }}
                >
                  {card.desc}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.7rem',
                    color: 'var(--nrg-green)',
                    lineHeight: 1,
                    margin: 0,
                    letterSpacing: '0.03em',
                  }}
                >
                  {card.term}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(0,121,63,0.2)',
            borderRadius: '14px',
            padding: '1.25rem 1.6rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.93rem',
              color: '#2a3a2a',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            <strong style={{ color: 'var(--nrg-gold)' }}>
              A warranty is only as good as the company standing behind it.
            </strong>{' '}
            If the company that installed your system goes out of business in 8 years, your
            &ldquo;25-year warranty&rdquo; is worthless. We&#39;ve been operating since 2011 with
            16,000+ completed installs. We plan to be here when your system turns 25 — and so does
            your warranty.
          </p>
        </div>

      </div>
    </div>
  );
}
