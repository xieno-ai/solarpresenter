const steps = [
  {
    number: 1,
    title: 'Sign Agreement',
    week: 'Week 1',
    description:
      'Review your proposal, ask any final questions, and sign your solar installation agreement. A deposit is collected at this stage to reserve your installation slot.',
  },
  {
    number: 2,
    title: 'Site Survey',
    week: 'Week 1–2',
    description:
      'Our technical team visits your property to take precise roof measurements, confirm structural suitability, inspect your electrical panel, and finalize the system design.',
  },
  {
    number: 3,
    title: 'Permitting',
    week: 'Week 2–4',
    description:
      'We prepare and submit all municipal building permits and utility interconnection applications (ENMAX, ATCO, or your local provider) on your behalf. You sign nothing.',
  },
  {
    number: 4,
    title: 'Equipment Order',
    week: 'Week 3–4',
    description:
      'Once permits are approved, your panels, inverter, mounting hardware, and electrical components are ordered from our Canadian-stocking distributors.',
  },
  {
    number: 5,
    title: 'Installation',
    week: 'Week 5–7',
    description:
      'Our certified crew installs your system over 2 to 5 days depending on system size. This covers mounting, panel installation, inverter wiring, and connection to your breaker panel.',
  },
  {
    number: 6,
    title: 'Grid Connection',
    week: 'Week 6–8',
    description:
      'Your utility inspector visits to verify the interconnection, approves permission to operate (PTO), and your meter is upgraded to bidirectional. You are now generating solar power.',
  },
];

export function NextStepsPage() {
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
          padding: '1.5rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
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
              marginBottom: '0.3rem',
            }}
          >
            FROM PROPOSAL TO POWER
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
            Your Next Steps
          </h2>
        </div>

        {/* Timeline — 6 steps in 2 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem 1.5rem',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {steps.map((step, idx) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'var(--nrg-card-bg)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                boxShadow: '0 1px 6px rgba(0,121,63,0.06)',
                position: 'relative',
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: idx < 3 ? 'var(--nrg-green)' : 'var(--nrg-dark-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* Step content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title + week badge row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '0.35rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: 'var(--nrg-text-heading)',
                    }}
                  >
                    {step.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'var(--nrg-green)',
                      background: 'var(--nrg-light-green-bg)',
                      borderRadius: '20px',
                      padding: '0.15rem 0.55rem',
                    }}
                  >
                    {step.week}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--nrg-text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA bottom box */}
        <div
          style={{
            background: 'var(--nrg-green)',
            borderRadius: '10px',
            padding: '1.1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '0.2rem',
              }}
            >
              Ready to Get Started?
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Contact your Northern NRG advisor to sign your agreement and reserve your installation date.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.08em',
              }}
            >
              NORTHERNNRG.CA
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '0.1rem',
              }}
            >
              info@northernnrg.ca
            </p>
          </div>
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
