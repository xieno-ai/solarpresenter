const sections = [
  {
    number: 1,
    title: 'Net Metering',
    description: 'Month-by-month solar production vs. consumption analysis',
  },
  {
    number: 2,
    title: 'Carbon Credits',
    description: 'Annual CO\u2082 offset and Alberta carbon credit estimates',
  },
  {
    number: 3,
    title: 'True All-In Costs',
    description: 'Cash purchase and finance option cost breakdown',
  },
  {
    number: 4,
    title: 'Electricity Price History',
    description: '30-year trend showing rate increases',
  },
  {
    number: 5,
    title: "What's Coming",
    description: 'Forces driving electricity prices higher',
  },
  {
    number: 6,
    title: 'Why Northern NRG',
    description: 'Our commitment to quality and service',
  },
  {
    number: 7,
    title: 'Warranty & Protection',
    description: 'Comprehensive coverage for your investment',
  },
  {
    number: 8,
    title: 'Frequently Asked Questions',
    description: 'Common questions from solar customers',
  },
  {
    number: 9,
    title: 'Your Next Steps',
    description: 'How we get your solar system installed',
  },
];

export function TableOfContentsPage() {
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
          padding: '2rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Page heading area */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.75rem' }}>
          {/* Left accent strip */}
          <div
            style={{
              width: '4px',
              alignSelf: 'stretch',
              background: 'var(--nrg-green)',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                color: 'var(--nrg-green)',
                letterSpacing: '0.2em',
                marginBottom: '0.2rem',
              }}
            >
              TABLE OF CONTENTS
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
                lineHeight: 1.1,
              }}
            >
              Your Proposal
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                color: 'var(--nrg-text-secondary)',
                marginTop: '0.4rem',
              }}
            >
              Everything you need to make an informed solar decision — all in one place.
            </p>
          </div>
        </div>

        {/* 9-section grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.85rem',
            flex: 1,
          }}
        >
          {sections.map((section) => (
            <div
              key={section.number}
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 1px 8px rgba(0,121,63,0.06)',
              }}
            >
              {/* Red number badge */}
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '50%',
                  background: 'var(--nrg-red-badge)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {section.number}
                </span>
              </div>

              {/* Section text */}
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--nrg-text-heading)',
                    lineHeight: 1.2,
                    marginBottom: '0.2rem',
                  }}
                >
                  {section.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    color: 'var(--nrg-text-secondary)',
                    lineHeight: 1.3,
                  }}
                >
                  {section.description}
                </p>
              </div>
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
