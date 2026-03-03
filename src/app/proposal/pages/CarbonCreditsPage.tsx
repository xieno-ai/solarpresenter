import type { SerializedProposalOutputs } from '@/app/actions/calculate';

interface CarbonCreditsPageProps {
  carbonCredits: SerializedProposalOutputs['carbonCredits'];
}

function formatCAD(value: string): string {
  return parseFloat(value).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  });
}

export function CarbonCreditsPage({ carbonCredits }: CarbonCreditsPageProps) {
  const { annualCo2Avoided, tenYearPayoutLow, tenYearPayoutHigh, benchmarkSchedule } =
    carbonCredits;

  const co2Tonnes = parseFloat(annualCo2Avoided).toFixed(2);
  const payoutLow = formatCAD(tenYearPayoutLow);
  const payoutHigh = formatCAD(tenYearPayoutHigh);

  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-card-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Full-width green header */}
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
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            CARBON CREDITS
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.8)',
              margin: 0,
              letterSpacing: '0.1em',
            }}
          >
            ANNUAL CO&#x2082; AVOIDED
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.08em',
          }}
        >
          NORTHERN NRG
        </span>
      </div>

      {/* Two-panel body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          overflow: 'hidden',
        }}
      >
        {/* Left dark panel */}
        <div
          style={{
            background: 'var(--nrg-carbon-dark)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 2rem',
            gap: '1.5rem',
          }}
        >
          {/* CO2 big number */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.15em',
                marginBottom: '0.5rem',
              }}
            >
              ANNUAL REDUCTION
            </p>
            <p
              style={{
                fontFamily: 'var(--font-montserrat)',
                fontSize: '4rem',
                fontWeight: 700,
                color: 'var(--nrg-carbon-mint)',
                lineHeight: 1,
              }}
            >
              {co2Tonnes}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: '0.1em',
                marginTop: '0.25rem',
              }}
            >
              TONNES CO&#x2082; / YEAR
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '60%',
              height: '1px',
              background: 'rgba(126,255,212,0.25)',
            }}
          />

          {/* 10-year payout estimate */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.12em',
                marginBottom: '0.5rem',
              }}
            >
              10-YEAR PAYOUT ESTIMATE
            </p>
            <p
              style={{
                fontFamily: 'var(--font-montserrat)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--nrg-carbon-mint)',
              }}
            >
              {payoutLow} &ndash; {payoutHigh}
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '60%',
              height: '1px',
              background: 'rgba(126,255,212,0.25)',
            }}
          />

          {/* Brand footer in panel */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.15em',
              }}
            >
              NORTHERN NRG
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.35)',
                marginTop: '0.2rem',
              }}
            >
              Alberta Carbon Credit Program
            </p>
          </div>
        </div>

        {/* Right light panel — benchmark schedule */}
        <div
          style={{
            background: 'var(--nrg-pale-green-bg)',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              color: 'var(--nrg-green)',
              letterSpacing: '0.12em',
              marginBottom: '1rem',
              flexShrink: 0,
            }}
          >
            ALBERTA BENCHMARK PRICE SCHEDULE
          </p>

          <div
            style={{
              background: 'var(--nrg-card-bg)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 8px rgba(0,121,63,0.08)',
              flex: 1,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--nrg-green)' }}>
                  <th
                    style={{
                      padding: '0.6rem 1rem',
                      textAlign: 'left',
                      fontFamily: 'var(--font-montserrat)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      color: '#ffffff',
                      letterSpacing: '0.05em',
                    }}
                  >
                    YEAR
                  </th>
                  <th
                    style={{
                      padding: '0.6rem 1rem',
                      textAlign: 'right',
                      fontFamily: 'var(--font-montserrat)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      color: '#ffffff',
                    }}
                  >
                    Price / Tonne
                  </th>
                  <th
                    style={{
                      padding: '0.6rem 1rem',
                      textAlign: 'right',
                      fontFamily: 'var(--font-montserrat)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      color: '#ffffff',
                    }}
                  >
                    Payout (Low)
                  </th>
                  <th
                    style={{
                      padding: '0.6rem 1rem',
                      textAlign: 'right',
                      fontFamily: 'var(--font-montserrat)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      color: '#7effd4',
                    }}
                  >
                    Payout (High)
                  </th>
                </tr>
              </thead>
              <tbody>
                {benchmarkSchedule.map((entry, i) => (
                  <tr
                    key={entry.year}
                    style={{
                      background: i % 2 === 0 ? '#ffffff' : 'var(--nrg-row-green)',
                      borderBottom: '1px solid #eef8ef',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.5rem 1rem',
                        fontFamily: 'var(--font-montserrat)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: 'var(--nrg-green)',
                      }}
                    >
                      {entry.year}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-text-primary)',
                        fontSize: '0.78rem',
                      }}
                    >
                      ${parseFloat(entry.pricePerTonne).toFixed(0)}/t
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-text-secondary)',
                        fontSize: '0.78rem',
                      }}
                    >
                      {parseFloat(entry.payoutLow).toLocaleString('en-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-surplus-green)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                      }}
                    >
                      {parseFloat(entry.payoutHigh).toLocaleString('en-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rate note */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              color: 'var(--nrg-text-secondary)',
              marginTop: '0.75rem',
              flexShrink: 0,
            }}
          >
            Carbon credits based on Alberta benchmark price schedule. Values are estimates.
          </p>
        </div>
      </div>
    </div>
  );
}
