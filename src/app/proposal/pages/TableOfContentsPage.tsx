const sections = [
  {
    number: '01',
    title: 'Design',
    description: 'Initial review of what can be achieved for your property.',
    accent: 'green' as const,
  },
  {
    number: '02',
    title: 'Net Metering',
    description: 'Month by month breakdown. You sell at 33.5¢ back to grid.',
    accent: 'green' as const,
  },
  {
    number: '03',
    title: 'Carbon Credits',
    description: "Earn $1,000 over 10 years via Alberta's Solar Offset program.",
    accent: 'green' as const,
  },
  {
    number: '04',
    title: 'Costs',
    description: 'What investing in Solar looks like 20 years from now.',
    accent: 'green' as const,
  },
  {
    number: '05',
    title: 'Price History',
    description: '20 years of Alberta rates. From 4¢ to 23¢ — a 170% increase.',
    accent: 'red' as const,
  },
  {
    number: '06',
    title: "What's Coming",
    description: 'AI data centres, population growth, and more. 2 big forces driving rates to 40¢.',
    accent: 'red' as const,
  },
  {
    number: '07',
    title: 'Why Us',
    description: '100+ solar companies in Alberta. Why the cheapest will cost you the most.',
    accent: 'green' as const,
  },
  {
    number: '08',
    title: 'Warranty',
    description: '25-year performance, 25-year inverter, lifetime workmanship.',
    accent: 'green' as const,
  },
  {
    number: '09',
    title: 'Next Steps',
    description: 'Site survey — PTO. Your 6-step turn-key timeline from sign to live.',
    accent: 'green' as const,
  },
];

export function TableOfContentsPage() {
  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
          marginBottom: '2rem',
        }}
      >
        {/* Left: labels + H1 + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Level 2 label */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--nrg-green)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: '0 0 0.5rem',
            }}
          >
            What We'll Cover
          </p>
          {/* Level 1 H1 */}
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--nrg-text-heading)',
              lineHeight: 1.05,
              margin: '0 0 0.5rem',
            }}
          >
            Your Complete Solar Roadmap
          </h2>
          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.15rem',
              color: 'var(--nrg-text-secondary)',
              margin: 0,
            }}
          >
            The Last Electricity Bill You'll Ever{' '}
            <span style={{ color: 'var(--nrg-gold)', fontWeight: 600 }}>Dread.</span>
          </p>
        </div>

        {/* Right: logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/northernnrg-logo.png"
          alt="Northern NRG"
          style={{ height: '140px', width: 'auto', flexShrink: 0, display: 'block', alignSelf: 'flex-start' }}
        />
      </div>

      {/* 3×3 card grid — natural height */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
        }}
      >
        {sections.map((section) => {
          const isRed = section.accent === 'red';
          const accentColor = isRed ? 'var(--nrg-red-badge)' : 'var(--nrg-green)';
          return (
            <div
              key={section.number}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: `1px solid ${accentColor}`,
                borderLeft: `4px solid ${accentColor}`,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              }}
            >
              {/* Card title row: number + title */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: accentColor,
                    flexShrink: 0,
                  }}
                >
                  {section.number}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--nrg-text-heading)',
                    lineHeight: 1.2,
                  }}
                >
                  {section.title}
                </span>
              </div>
              {/* Description — Level 4 */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.05rem',
                  color: 'var(--nrg-text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {section.description}
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
