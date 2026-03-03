const warrantyCards = [
  {
    title: 'Panel Warranty',
    term: '25 Years',
    termSub: 'Product + Performance',
    description:
      'Our Tier-1 solar panels carry a 25-year product warranty against manufacturing defects and a separate 25-year linear performance guarantee — output is guaranteed to remain above 80% of rated capacity.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="12" r="7" stroke="var(--nrg-green)" strokeWidth="2" />
        <path d="M9 20c-4 2-6 5-6 8h26c0-3-2-6-6-8" stroke="var(--nrg-green)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 12l3 3 5-5" stroke="var(--nrg-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Inverter Warranty',
    term: '12 Years',
    termSub: 'Manufacturer Coverage',
    description:
      "String inverters include a standard 12-year manufacturer's warranty with optional extension to 20 years available at time of purchase. Microinverters carry a 25-year warranty where specified.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="var(--nrg-green)" strokeWidth="2" />
        <path
          d="M16 5L18 8H14L16 5z M16 27l-2-3h4l-2 3z"
          fill="var(--nrg-green)"
          opacity="0.5"
        />
        <path d="M10 16l3-3 3 3 3-3 3 3" stroke="var(--nrg-green)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Workmanship Warranty',
    term: '10 Years',
    termSub: 'Installation by Northern NRG',
    description:
      'Every system Northern NRG installs is backed by a 10-year workmanship warranty covering all labour, wiring, mounting hardware, and structural attachment points against installation defects.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M8 26l4-4 10-10-4-4L8 18l-2 6 2 2z"
          stroke="var(--nrg-green)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M18 8l4-4 6 6-4 4" stroke="var(--nrg-green)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="10" cy="22" r="1.5" fill="var(--nrg-green)" />
      </svg>
    ),
  },
  {
    title: 'Roof Penetration Warranty',
    term: '10 Years',
    termSub: 'Waterproofing Guarantee',
    description:
      'All roof penetrations are flashed and sealed to IKO standards. Northern NRG warrants every penetration point against water ingress for 10 years — your roof integrity is fully protected.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M4 18L16 6l12 12H4z" stroke="var(--nrg-green)" strokeWidth="2" strokeLinejoin="round" />
        <rect x="10" y="18" width="12" height="10" stroke="var(--nrg-green)" strokeWidth="2" />
        <path d="M14 24v-4h4v4" stroke="var(--nrg-green)" strokeWidth="1.75" />
      </svg>
    ),
  },
];

export function WarrantyPage() {
  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-page-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: 'var(--nrg-green)',
          padding: '0 2.5rem',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: '#ffffff',
            letterSpacing: '0.08em',
          }}
        >
          NORTHERN NRG
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.12em',
          }}
        >
          ENERGY SAVINGS REPORT
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '1.75rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Page heading */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              color: 'var(--nrg-green)',
              letterSpacing: '0.22em',
              marginBottom: '0.35rem',
            }}
          >
            YOUR INVESTMENT IS PROTECTED
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.9rem',
              fontWeight: 700,
              color: 'var(--nrg-text-heading)',
              lineHeight: 1.15,
            }}
          >
            Warranty &amp; Protection
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'var(--nrg-text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Comprehensive coverage from panels to penetrations — every component of your system is backed.
          </p>
        </div>

        {/* 2×2 warranty card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '1.1rem',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {warrantyCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '12px',
                padding: '1.5rem',
                borderTop: '4px solid var(--nrg-green)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 1px 10px rgba(0,121,63,0.07)',
                overflow: 'hidden',
              }}
            >
              {/* Icon + term row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
                    background: 'var(--nrg-light-green-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-montserrat)',
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: 'var(--nrg-green)',
                      lineHeight: 1,
                    }}
                  >
                    {card.term}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.72rem',
                      color: 'var(--nrg-text-secondary)',
                      marginTop: '0.15rem',
                    }}
                  >
                    {card.termSub}
                  </p>
                </div>
              </div>

              {/* Card title */}
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                }}
              >
                {card.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.83rem',
                  color: 'var(--nrg-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          height: '36px',
          background: 'var(--nrg-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.15em',
          }}
        >
          NORTHERN NRG — ENERGY SAVINGS REPORT
        </span>
      </div>
    </div>
  );
}
