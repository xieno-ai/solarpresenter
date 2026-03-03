function GoogleLogo() {
  const style = (color: string) => ({
    fontFamily: 'var(--font-sans)',
    fontSize: '2rem',
    fontWeight: 700 as const,
    color,
    lineHeight: 1,
  });
  return (
    <span aria-label="Google" style={{ display: 'inline-flex', letterSpacing: '-0.02em' }}>
      <span style={style('#4285F4')}>G</span>
      <span style={style('#EA4335')}>o</span>
      <span style={style('#FBBC05')}>o</span>
      <span style={style('#4285F4')}>g</span>
      <span style={style('#34A853')}>l</span>
      <span style={style('#EA4335')}>e</span>
    </span>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1.5l2.4 5 5.5.6-4 3.9 1.1 5.5L10 14l-5 2.5 1.1-5.5-4-3.9 5.5-.6z"
        fill={filled ? '#FBBC05' : 'rgba(255,255,255,0.3)'}
      />
    </svg>
  );
}

export function WhyUsPage() {
  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* Eyebrow */}
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
          Who You&#39;re Working With
        </p>

        {/* H1 */}
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '3.1rem',
            fontWeight: 900,
            color: 'var(--nrg-text-heading)',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            marginBottom: '0.9rem',
          }}
        >
          Alberta&#39;s Most Installed Solar
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.92rem',
            color: 'var(--nrg-text-secondary)',
            lineHeight: 1.6,
            maxWidth: '60ch',
            marginBottom: '2rem',
          }}
        >
          Solar is a 25-year commitment. You deserve a company with the track record, the team, and
          the staying power to back it up.
        </p>

        {/* Stats row — 3 cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { number: '16,000+', label: 'Installs Completed' },
            { number: '13+',     label: 'Years in Business' },
            { number: '100%',    label: 'In-House Installation' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#ffffff',
                border: '1.5px solid rgba(0,121,63,0.28)',
                borderRadius: '16px',
                padding: '2.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {stat.number}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  color: 'var(--nrg-text-secondary)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Google reviews bar */}
        <div
          style={{
            background: '#4a90d9',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            marginBottom: '1.5rem',
          }}
        >
          {/* Left: Google logo + rating + stars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flex: '0 0 auto',
              paddingRight: '2rem',
            }}
          >
            {/* Logo + stars */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.3rem 0.7rem',
                  display: 'inline-flex',
                }}
              >
                <GoogleLogo />
              </div>
              <div style={{ display: 'flex', gap: '2px', paddingLeft: '0.25rem' }}>
                {[1,2,3,4,5].map((n) => (
                  <StarIcon key={n} filled={n <= 5} />
                ))}
              </div>
            </div>

            {/* Rating + label */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '2.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                4.7
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.85)',
                  margin: '0.3rem 0 0',
                }}
              >
                500+ Stars — Google Reviews
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              alignSelf: 'stretch',
              background: 'rgba(255,255,255,0.35)',
              marginRight: '2rem',
              flexShrink: 0,
            }}
          />

          {/* Right: quote */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              color: '#ffffff',
              fontStyle: 'italic',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            &ldquo;With 16,000+ installs and 13+ years in the industry, our reputation is built on
            real outcomes — not promises.&rdquo;
          </p>
        </div>

        {/* Bottom callout — Why in-house matters */}
        <div
          style={{
            background: 'var(--nrg-light-green-bg)',
            borderLeft: '4px solid var(--nrg-green)',
            borderRadius: '0 10px 10px 0',
            padding: '1.25rem 1.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              color: '#2a3a2a',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            <strong style={{ color: 'var(--nrg-green)' }}>Why in-house matters</strong>: Many solar
            companies use third-party subcontractors to install their systems. That means no
            accountability when something goes wrong, and no one to call if the installer company
            closes. Our team — the same people who designed your system — handle every install. Your
            warranty means something because we did the work.
          </p>
        </div>

      </div>
    </div>
  );
}
