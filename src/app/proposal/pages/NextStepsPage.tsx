const steps = [
  { number: 1, emoji: '📋', title: 'Site Survey',      timing: 'Week 1' },
  { number: 2, emoji: '✏️',  title: 'Design Approval', timing: 'Week 2-3' },
  { number: 3, emoji: '📁', title: 'Permits',          timing: 'Week 3-6' },
  { number: 4, emoji: '🔧', title: 'Install',          timing: '1-2 Days' },
  { number: 5, emoji: '🔍', title: 'Inspection',       timing: 'Week 7-9' },
  { number: 6, emoji: '⚡', title: 'PTO',              timing: 'Live!' },
];

export function NextStepsPage() {
  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--nrg-green)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            FROM DECISION TO POWER-ON
          </p>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.6rem',
            fontWeight: 800,
            color: 'var(--nrg-text-heading)',
            lineHeight: 1.1,
            marginBottom: '0.75rem',
          }}>
            How It Works: Your Path to Solar
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--nrg-text-secondary)',
            maxWidth: '680px',
            lineHeight: 1.6,
          }}>
            We handle everything. From your first site visit to the day your system goes live,
            our in-house team manages every step of the process — no outsourcing, no dropped balls.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>

          {/* Connecting line */}
          <div style={{
            position: 'absolute',
            top: '55px',
            left: 'calc(100% / 12)',
            right: 'calc(100% / 12)',
            height: '2.5px',
            background: 'var(--nrg-green)',
            zIndex: 0,
          }} />

          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.9rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Circle */}
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                border: '2.5px solid var(--nrg-green)',
                background: '#eaf6ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.75rem',
                flexShrink: 0,
              }}>
                {step.emoji}
              </div>

              {/* Label */}
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem',
                }}>
                  STEP {step.number}
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  lineHeight: 1.2,
                  marginBottom: '0.2rem',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--nrg-text-secondary)',
                }}>
                  {step.timing}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
