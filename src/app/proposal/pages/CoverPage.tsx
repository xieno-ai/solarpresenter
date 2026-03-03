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
  const offsetPct = parseFloat(outputs.solarOffsetPercent).toFixed(1);
  const utilityCost = formatCAD(outputs.twentyYearUtilityCost);
  const savings = formatCAD(outputs.twentyYearSavings);

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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          padding: '2rem 2.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Left column — key stats card */}
        <div
          style={{
            background: 'var(--nrg-card-bg)',
            borderRadius: '12px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 2px 16px rgba(0,121,63,0.08)',
          }}
        >
          {/* Customer name */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--nrg-text-secondary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              Prepared For
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
                lineHeight: 1.15,
              }}
            >
              {customerName}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                color: 'var(--nrg-text-secondary)',
                marginTop: '0.25rem',
              }}
            >
              {address}
            </p>
          </div>

          {/* System size */}
          <div
            style={{
              borderLeft: '3px solid var(--nrg-green)',
              paddingLeft: '1rem',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                color: 'var(--nrg-green)',
                letterSpacing: '0.05em',
              }}
            >
              {parseFloat(systemSizeKw).toFixed(2)} kW SYSTEM
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {/* Solar offset */}
            <div
              style={{
                background: 'var(--nrg-light-green-bg)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--nrg-text-primary)',
                }}
              >
                Solar Offset
              </p>
              <span
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                }}
              >
                {offsetPct}%
              </span>
            </div>

            {/* 20-yr utility cost */}
            <div
              style={{
                background: '#fff5f5',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#df584d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Without Solar
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--nrg-text-secondary)',
                  }}
                >
                  20-Year Utility Cost
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#df584d',
                }}
              >
                {utilityCost}
              </span>
            </div>

            {/* 20-yr savings */}
            <div
              style={{
                background: 'var(--nrg-light-green-bg)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--nrg-green)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  With Solar Savings
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--nrg-text-secondary)',
                  }}
                >
                  20-Year Net Savings
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                }}
              >
                {savings}
              </span>
            </div>
          </div>
        </div>

        {/* Right column — satellite image or placeholder */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,121,63,0.08)',
          }}
        >
          {satelliteUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={satelliteUrl}
              alt="Property satellite view"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--nrg-light-green-bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              {/* Solar panel SVG placeholder */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                aria-hidden="true"
              >
                <rect x="5" y="5" width="70" height="70" rx="6" fill="var(--nrg-green)" opacity="0.12" />
                <rect x="10" y="10" width="26" height="26" rx="3" fill="var(--nrg-green)" opacity="0.3" />
                <rect x="44" y="10" width="26" height="26" rx="3" fill="var(--nrg-green)" opacity="0.3" />
                <rect x="10" y="44" width="26" height="26" rx="3" fill="var(--nrg-green)" opacity="0.3" />
                <rect x="44" y="44" width="26" height="26" rx="3" fill="var(--nrg-green)" opacity="0.3" />
                <line x1="38" y1="5" x2="38" y2="75" stroke="var(--nrg-green)" strokeWidth="1.5" opacity="0.4" />
                <line x1="5" y1="38" x2="75" y2="38" stroke="var(--nrg-green)" strokeWidth="1.5" opacity="0.4" />
              </svg>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--nrg-text-secondary)',
                  textAlign: 'center',
                  maxWidth: '200px',
                }}
              >
                {address}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  color: 'var(--nrg-green)',
                  letterSpacing: '0.1em',
                  opacity: 0.7,
                }}
              >
                SOLAR INSTALLATION SITE
              </p>
            </div>
          )}
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
