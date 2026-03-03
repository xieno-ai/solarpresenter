const stats = [
  { number: '500+', label: 'Installations', sub: 'across Alberta' },
  { number: '25yr', label: 'Panel Warranty', sub: 'product & performance' },
  { number: '100%', label: 'Alberta-Based', sub: 'local team, local service' },
  { number: '10yr', label: 'Workmanship', sub: 'installation guarantee' },
];

export function WhyUsPage() {
  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-page-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Green banner header */}
      <div
        style={{
          background: 'var(--nrg-green)',
          padding: '2rem 2.5rem',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.22em',
            marginBottom: '0.4rem',
          }}
        >
          OUR COMMITMENT TO QUALITY
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.25rem',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}
        >
          Why Northern NRG
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: '580px',
            lineHeight: 1.55,
          }}
        >
          Alberta-born, Alberta-focused. We&apos;ve been designing and installing solar systems for northern
          homeowners since 2015 — with unmatched local expertise and a long-term service commitment.
        </p>
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
        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            flexShrink: 0,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'center',
                boxShadow: '0 1px 8px rgba(0,121,63,0.07)',
                borderBottom: '3px solid var(--nrg-green)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                }}
              >
                {stat.number}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  marginBottom: '0.2rem',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  color: 'var(--nrg-text-secondary)',
                }}
              >
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Body + testimonial row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left — body text with feature bullets */}
          <div
            style={{
              background: 'var(--nrg-card-bg)',
              borderRadius: '12px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
              }}
            >
              What Sets Us Apart
            </h3>
            {[
              {
                icon: '✓',
                title: 'Canadian-Made Quality',
                body: 'We specify Tier-1 panels and premium string inverters — no low-cost substitutions.',
              },
              {
                icon: '✓',
                title: 'Full In-House Installation',
                body: "No subcontractors. Our certified crew installs every system start to finish.",
              },
              {
                icon: '✓',
                title: 'Post-Install Monitoring',
                body: 'Real-time production monitoring with annual system health reviews included.',
              },
              {
                icon: '✓',
                title: 'Permitting & Utility Liaison',
                body: 'We handle all municipal permits and ENMAX / ATCO interconnection paperwork for you.',
              },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--nrg-green)',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--nrg-text-heading)',
                      marginBottom: '0.15rem',
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.82rem',
                      color: 'var(--nrg-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — testimonial callout */}
          <div
            style={{
              background: 'var(--nrg-light-green-bg)',
              borderRadius: '12px',
              padding: '1.75rem',
              borderLeft: '4px solid var(--nrg-green)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}
          >
            {/* Quote mark */}
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
              <path
                d="M0 28V16C0 7.163 6.04 1.493 14 0l2 3.5C10.88 4.97 8.5 8.1 8 12h8v16H0zm20 0V16C20 7.163 26.04 1.493 34 0l2 3.5C30.88 4.97 28.5 8.1 28 12h8v16H20z"
                fill="var(--nrg-green)"
                opacity="0.25"
              />
            </svg>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                color: 'var(--nrg-dark-green)',
                lineHeight: 1.7,
                fontStyle: 'italic',
                flex: 1,
              }}
            >
              &ldquo;Northern NRG handled everything — from the permit to the utility connection. The install took
              three days and my bill dropped by over 80% in the first month. I wish I&apos;d done it sooner.&rdquo;
            </p>

            <div
              style={{
                borderTop: '1px solid rgba(0,121,63,0.2)',
                paddingTop: '0.75rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                }}
              >
                M. Kowalski
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  color: 'var(--nrg-text-secondary)',
                }}
              >
                8.4 kW System — St. Albert, AB — 2024
              </p>
            </div>

            {/* Star rating */}
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1l1.9 4.1 4.5.5-3.3 3 .9 4.5L8 11 3.9 13.1l.9-4.5L1.6 5.6l4.5-.5L8 1z"
                    fill="var(--nrg-gold)"
                  />
                </svg>
              ))}
            </div>
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
