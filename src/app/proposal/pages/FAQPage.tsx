const faqs = [
  {
    question: 'How does net metering work in Alberta?',
    answer:
      'When your solar panels produce more electricity than you consume, the surplus flows back to the grid and your utility credits your account at the wholesale or regulated buy-back rate. These credits offset future bills when your consumption exceeds production — typically in winter months. Credits are calculated monthly and can carry forward for up to 12 months.',
  },
  {
    question: 'What happens on cloudy or winter days?',
    answer:
      'Your solar system remains connected to the provincial grid at all times. On overcast or low-production days, your home draws power from the grid seamlessly — you will never experience an outage due to weather. Solar panels still produce power in diffuse light; production is reduced, not eliminated. Your annual production estimate already accounts for seasonal variation.',
  },
  {
    question: 'How long does installation take?',
    answer:
      "A typical residential installation takes 2 to 5 days from crew arrival to electrical sign-off. Site complexity, roof type, and panel count affect the timeline. Permitting and utility interconnection applications — handled entirely by Northern NRG — typically take 2 to 6 weeks prior to installation and are the longest part of the overall process.",
  },
  {
    question: 'Will solar affect my home insurance?',
    answer:
      "In most cases, your existing home insurance policy covers the solar system as a permanent attached fixture at no additional premium. You should notify your insurer once the system is operational — some providers require a brief rider or endorsement. Northern NRG provides a system valuation letter to support any insurance documentation.",
  },
  {
    question: 'What maintenance does solar require?',
    answer:
      "Solar systems are very low maintenance. In Alberta, seasonal snowfall typically clears naturally from tilted panel surfaces. An annual gentle rinse in spring removes dust and pollen that can slightly reduce output. Northern NRG includes annual production monitoring reviews; if output drops unexpectedly, our team investigates at no charge during the workmanship warranty period.",
  },
  {
    question: 'How is system size determined?',
    answer:
      "System size is calculated from three inputs: your annual electricity consumption (from utility bills), your roof's available south- or west-facing area and its tilt, and your budget. Northern NRG engineers your system to offset the maximum percentage of your consumption given your roof constraints — typically between 70% and 110% of annual use.",
  },
];

export function FAQPage() {
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
        <div style={{ flexShrink: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              color: 'var(--nrg-green)',
              letterSpacing: '0.22em',
              marginBottom: '0.25rem',
            }}
          >
            FREQUENTLY ASKED QUESTIONS
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--nrg-text-heading)',
              lineHeight: 1.15,
            }}
          >
            Common Questions from Solar Customers
          </h2>
        </div>

        {/* FAQ items */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.85rem',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {faqs.map((faq) => (
            <div
              key={faq.question}
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '10px',
                padding: '1.1rem 1.25rem',
                borderLeft: '4px solid var(--nrg-green)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: '0 1px 6px rgba(0,121,63,0.06)',
                overflow: 'hidden',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  lineHeight: 1.35,
                }}
              >
                {faq.question}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  color: 'var(--nrg-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {faq.answer}
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
