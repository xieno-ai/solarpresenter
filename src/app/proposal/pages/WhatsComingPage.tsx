function AiChipIcon() {
  const c = '#b89a10';
  return (
    <svg viewBox="0 0 52 52" width="54" height="54" aria-hidden="true">
      {/* Chip body — dashed outer */}
      <rect x="11" y="11" width="30" height="30" rx="3" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="2.5 1.5" />
      {/* Inner border */}
      <rect x="16" y="16" width="20" height="20" rx="2" fill="none" stroke={c} strokeWidth="1" />
      {/* AI text */}
      <text x="26" y="29" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={c} fontFamily="sans-serif">AI</text>
      {/* Top pins */}
      <line x1="19" y1="11" x2="19" y2="7"  stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="11" x2="26" y2="7"  stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="11" x2="33" y2="7"  stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Bottom pins */}
      <line x1="19" y1="41" x2="19" y2="45" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="41" x2="26" y2="45" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="41" x2="33" y2="45" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left pins */}
      <line x1="11" y1="19" x2="7"  y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="26" x2="7"  y2="26" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="33" x2="7"  y2="33" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right pins */}
      <line x1="41" y1="19" x2="45" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="41" y1="26" x2="45" y2="26" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="41" y1="33" x2="45" y2="33" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PassportIcon() {
  const c = '#8a9bb5';
  return (
    <svg viewBox="0 0 68 68" width="76" height="76" aria-hidden="true">
      {/* Back cover */}
      <rect x="6" y="14" width="40" height="50" rx="4" fill="#dde4ef" stroke={c} strokeWidth="1.5" />
      {/* Front cover */}
      <rect x="14" y="8" width="40" height="50" rx="4" fill="#cdd8ea" stroke={c} strokeWidth="1.5" />
      {/* Globe circle */}
      <circle cx="34" cy="28" r="11" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Globe meridians */}
      <ellipse cx="34" cy="28" rx="5.5" ry="11" fill="none" stroke={c} strokeWidth="1" />
      <line x1="23" y1="28" x2="45" y2="28" stroke={c} strokeWidth="1" />
      <line x1="25" y1="21" x2="43" y2="21" stroke={c} strokeWidth="0.8" />
      <line x1="25" y1="35" x2="43" y2="35" stroke={c} strokeWidth="0.8" />
      {/* Lines below globe */}
      <line x1="22" y1="46" x2="46" y2="46" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="50" x2="38" y2="50" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const BODY_COLOR = '#3d5060';
const BOLD_RED   = '#df584d';

export function WhatsComingPage() {
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
            marginBottom: '0.45rem',
          }}
        >
          What&#39;s Coming
        </p>

        {/* H1 */}
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.75rem',
            fontWeight: 800,
            color: 'var(--nrg-text-heading)',
            lineHeight: 1.1,
            marginBottom: '1rem',
          }}
        >
          Two Big Reasons Alberta Electricity Will Cost More
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            color: 'var(--nrg-text-secondary)',
            lineHeight: 1.6,
            maxWidth: '80ch',
            marginBottom: '1.75rem',
          }}
        >
          The temporary price relief of 2024–2025 is a lull before a storm. Five massive structural
          forces are about to collide on Alberta&#39;s grid — and every single one pushes rates higher.
        </p>

        {/* Two cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* LEFT CARD — AI Data Centre */}
          <div
            style={{
              background: '#fffdf2',
              border: '1.5px solid #e0b84a',
              borderRadius: '16px',
              padding: '2rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--nrg-text-heading)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Force #1: The AI Data Centre Tsunami
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#c4880a',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    margin: '0.3rem 0 0',
                  }}
                >
                  Highest Impact — Already Happening
                </p>
              </div>
              <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                <AiChipIcon />
              </div>
            </div>

            {/* Body text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                Alberta&#39;s grid currently handles{' '}
                <strong style={{ color: 'var(--nrg-text-heading)' }}>~12,000 MW</strong> of peak demand.
                As of late 2025, companies have proposed{' '}
                <strong style={{ color: BOLD_RED }}>33 data centre projects requesting over 20,000 MW</strong>
                {' '}— nearly doubling Alberta&#39;s entire grid.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                Pembina Pipeline and Meta are already building a massive AI data centre near Edmonton with
                970MW allocated. A single large AI facility draws as much electricity as a city of 350,000
                people. Global data centre electricity demand is set to{' '}
                <strong style={{ color: 'var(--nrg-text-heading)' }}>double by 2030</strong> (Gartner).
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                Alberta&#39;s government has declared it wants to be &ldquo;North America&apos;s destination
                of choice for AI data centres.&rdquo; Premier Smith has pitched $100 billion in data centre
                investment. This demand surge will drive infrastructure upgrades — paid for by ratepayers.
              </p>
            </div>
          </div>

          {/* RIGHT CARD — Population Explosion */}
          <div
            style={{
              background: '#fff8f7',
              border: '1.5px solid rgba(223,88,77,0.32)',
              borderRadius: '16px',
              padding: '2rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
            }}
          >
            {/* Title row */}
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Force #2: Alberta&#39;s Population Explosion
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#5a6a7a',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  margin: '0.3rem 0 0',
                }}
              >
                Fastest Growing Province in Canada
              </p>
            </div>

            {/* Body text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                Alberta just surpassed{' '}
                <strong style={{ color: 'var(--nrg-text-heading)' }}>5 million people</strong> and is{' '}
                <strong style={{ color: 'var(--nrg-text-heading)' }}>the only province still</strong>{' '}
                growing as of Q3 2025, while every other province shrank. Alberta has led interprovincial
                migration for{' '}
                <strong style={{ color: 'var(--nrg-text-heading)' }}>13 consecutive quarters</strong>.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                Statistics Canada projects Alberta&#39;s population will hit{' '}
                <strong style={{ color: BOLD_RED }}>7.2 million by 2050</strong> — a 44% increase from
                today — and may surpass British Columbia as early as 2038.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.93rem', color: BODY_COLOR, lineHeight: 1.72, margin: 0 }}>
                More people means more homes, more air conditioners, more EVs, and more electricity demand
                competing for the same constrained grid. Every new Albertan arriving from Ontario or B.C.
                is bringing their electrical appliances — and their appetite for power.
              </p>
            </div>

            {/* Passport icon — bottom right */}
            <div
              style={{
                position: 'absolute',
                bottom: '1.25rem',
                right: '1.25rem',
              }}
            >
              <PassportIcon />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
