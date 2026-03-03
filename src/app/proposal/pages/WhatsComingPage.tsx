export function WhatsComingPage() {
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
              color: 'var(--nrg-gold)',
              letterSpacing: '0.22em',
              marginBottom: '0.35rem',
            }}
          >
            WHAT&apos;S COMING
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
            Why Electricity Prices Will Keep Rising
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'var(--nrg-text-secondary)',
              marginTop: '0.4rem',
              maxWidth: '600px',
              margin: '0.5rem auto 0',
            }}
          >
            Multiple converging forces are pushing electricity costs higher — and there&apos;s no sign of reversal.
          </p>
        </div>

        {/* Two large side-by-side cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left card — Rising Demand */}
          <div
            style={{
              background: 'var(--nrg-gold-banner-inner)',
              borderRadius: '14px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              borderTop: '4px solid var(--nrg-gold)',
              overflow: 'hidden',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(245,166,35,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path
                  d="M16 3L4 17h10l-2 10 14-14H16L18 3z"
                  fill="none"
                  stroke="#f5a623"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  marginBottom: '0.75rem',
                }}
              >
                Surging Energy Demand
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--nrg-text-primary)',
                  lineHeight: 1.65,
                  marginBottom: '1rem',
                }}
              >
                Electric vehicles, heat pumps, and electrified industry are driving unprecedented demand onto the
                Alberta grid. EV adoption alone is projected to double residential electricity consumption by 2035.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--nrg-text-primary)',
                  lineHeight: 1.65,
                }}
              >
                As demand outpaces generation, utilities raise rates to fund new capacity — costs that are passed
                directly to consumers.
              </p>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: 'auto' }}>
              {['EV Adoption +300%', 'Grid Demand ↑ 2035', 'New Capacity Needed'].map((chip) => (
                <span
                  key={chip}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#a06d08',
                    background: 'rgba(245,166,35,0.2)',
                    borderRadius: '20px',
                    padding: '0.2rem 0.65rem',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right card — Aging Infrastructure & Carbon Pricing */}
          <div
            style={{
              background: '#efecf0',
              borderRadius: '14px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              borderTop: '4px solid #8b7aab',
              overflow: 'hidden',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(139,122,171,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect x="3" y="18" width="24" height="9" rx="2" stroke="#8b7aab" strokeWidth="2" />
                <rect x="8" y="12" width="14" height="6" rx="1" stroke="#8b7aab" strokeWidth="2" />
                <rect x="12" y="6" width="6" height="6" rx="1" stroke="#8b7aab" strokeWidth="2" />
                <line x1="7" y1="18" x2="7" y2="27" stroke="#8b7aab" strokeWidth="1.5" />
                <line x1="23" y1="18" x2="23" y2="27" stroke="#8b7aab" strokeWidth="1.5" />
              </svg>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  marginBottom: '0.75rem',
                }}
              >
                Aging Grid & Carbon Costs
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--nrg-text-primary)',
                  lineHeight: 1.65,
                  marginBottom: '1rem',
                }}
              >
                Much of Alberta&apos;s transmission and distribution infrastructure was built in the 1960s–80s and
                requires massive capital reinvestment. Utilities recover these upgrade costs through rate increases.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--nrg-text-primary)',
                  lineHeight: 1.65,
                }}
              >
                Canada&apos;s carbon price is legislated to rise to $170/tonne by 2030 — adding cost to every
                fossil-fuel generated kilowatt-hour on the Alberta grid.
              </p>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: 'auto' }}>
              {['Grid Age: 40–60 Yrs', 'Carbon Tax ↑ $170/t', 'Rate Increases Ahead'].map((chip) => (
                <span
                  key={chip}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#5a4a7a',
                    background: 'rgba(139,122,171,0.18)',
                    borderRadius: '20px',
                    padding: '0.2rem 0.65rem',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div
          style={{
            background: 'var(--nrg-light-green-bg)',
            borderRadius: '10px',
            padding: '1rem 1.5rem',
            borderLeft: '4px solid var(--nrg-green)',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--nrg-dark-green)',
              lineHeight: 1.5,
            }}
          >
            Solar locks in your energy cost today — every kilowatt-hour you produce is a kilowatt-hour you never
            have to buy at tomorrow&apos;s higher rates.
          </p>
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
