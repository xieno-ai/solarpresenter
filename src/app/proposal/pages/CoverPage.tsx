import type { SerializedProposalOutputs } from '@/app/actions/calculate';

interface CoverPageProps {
  customerName: string;
  address: string;
  systemSizeKw: string;
  outputs: SerializedProposalOutputs;
  satelliteUrl: string | null;
}

function formatCAD(value: string): string {
  return parseFloat(value).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  });
}

export function CoverPage({
  customerName,
  address,
  systemSizeKw,
  outputs,
  satelliteUrl,
}: CoverPageProps) {
  const offsetPct = Math.round(parseFloat(outputs.solarOffsetPercent));
  const utilityCost = formatCAD(outputs.twentyYearUtilityCost);
  const savings = formatCAD(outputs.twentyYearSavings);
  const systemKw = parseFloat(systemSizeKw).toFixed(2);

  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-page-bg)',
        display: 'flex',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* House photo panel — oversized circle bleeds off top/bottom for immersive feel */}
      <div
        style={{
          position: 'absolute',
          right: '-30vh',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '110vh',
          height: '110vh',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/house-solar.jpg"
          alt="House with solar panels"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 50%' }}
        />
      </div>

      {/* Main content — left 56% to stay clear of right panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '56%',
          padding: '3.5rem 2rem 3rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2rem',
        }}
      >
        {/* Top: Headline + customer pill */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Label + headline */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--nrg-green)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: '0.3rem',
              }}
            >
              Energy Savings Report
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2.2rem, 4vw, 3.25rem)',
                fontWeight: 900,
                color: 'var(--nrg-text-heading)',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              STOP RENTING YOUR{' '}
              <span style={{ color: 'var(--nrg-gold)' }}>POWER</span>
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                color: 'var(--nrg-text-secondary)',
                lineHeight: 1.6,
                marginTop: '0.9rem',
              }}
            >
              A complete financial analysis and proposal for transitioning to solar energy — built on
              real numbers, full transparency, and a company that will be here for the long haul.
            </p>
          </div>

          {/* Customer info pill — content width, green border */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1.5px solid var(--nrg-green)',
              padding: '1rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: '1.25rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '1.05rem',
                color: 'var(--nrg-text-heading)',
                whiteSpace: 'nowrap',
              }}
            >
              {customerName}
            </span>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: 'var(--nrg-green)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'var(--nrg-text-heading)',
              }}
            >
              {address}
            </span>
          </div>
        </div>

        {/* Bottom: satellite image + stats grid */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'stretch', height: '290px' }}>
          {/* Satellite / property image */}
          <div
            style={{
              width: '290px',
              flexShrink: 0,
              borderRadius: '14px',
              overflow: 'hidden',
              background: 'var(--nrg-light-green-bg)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          >
            {satelliteUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={satelliteUrl}
                alt="Property aerial view"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                }}
              >
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="48" height="48" rx="4" fill="var(--nrg-green)" opacity="0.12" />
                  <rect x="7" y="7" width="18" height="18" rx="2" fill="var(--nrg-green)" opacity="0.3" />
                  <rect x="31" y="7" width="18" height="18" rx="2" fill="var(--nrg-green)" opacity="0.3" />
                  <rect x="7" y="31" width="18" height="18" rx="2" fill="var(--nrg-green)" opacity="0.3" />
                  <rect x="31" y="31" width="18" height="18" rx="2" fill="var(--nrg-green)" opacity="0.3" />
                  <line x1="26" y1="4" x2="26" y2="52" stroke="var(--nrg-green)" strokeWidth="1" opacity="0.4" />
                  <line x1="4" y1="26" x2="52" y2="26" stroke="var(--nrg-green)" strokeWidth="1" opacity="0.4" />
                </svg>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    color: 'var(--nrg-text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  {address}
                </p>
              </div>
            )}
          </div>

          {/* 2×2 stats grid */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid var(--nrg-green)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              overflow: 'hidden',
            }}
          >
            {/* System Size */}
            <div style={{ padding: '1.75rem 1.75rem 0.5rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                  fontWeight: 700,
                  color: 'var(--nrg-gold)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {systemKw} kW
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                System Size
              </p>
            </div>

            {/* 20-Year Utility Cost */}
            <div style={{ padding: '1.75rem 1.75rem 0.5rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                  fontWeight: 700,
                  color: 'var(--nrg-red-badge)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {utilityCost}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                20-Year Utility Cost
              </p>
            </div>

            {/* Solar Offset */}
            <div style={{ padding: '0.5rem 1.75rem 1.75rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                  fontWeight: 700,
                  color: 'var(--nrg-gold)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {offsetPct}%
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                Solar Offset
              </p>
            </div>

            {/* 20-Year Savings */}
            <div style={{ padding: '0.5rem 1.75rem 1.75rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {savings}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                20-Year Savings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
