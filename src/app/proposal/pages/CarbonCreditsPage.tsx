import type { SerializedProposalOutputs } from '@/app/actions/calculate';

interface CarbonCreditsPageProps {
  carbonCredits: SerializedProposalOutputs['carbonCredits'];
  annualProductionKwh: string;
}

export function CarbonCreditsPage({ carbonCredits, annualProductionKwh }: CarbonCreditsPageProps) {
  const { annualCo2Avoided, tenYearPayoutLow, tenYearPayoutHigh, benchmarkSchedule } =
    carbonCredits;

  const co2Float = parseFloat(annualCo2Avoided);
  const co2Display = co2Float.toFixed(2);
  const productionDisplay = Math.round(parseFloat(annualProductionKwh)).toLocaleString('en-CA');

  function fmtCAD(v: number): string {
    return v.toLocaleString('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    });
  }

  const tenYrLow = fmtCAD(Math.round(parseFloat(tenYearPayoutLow)));
  const tenYrHigh = fmtCAD(Math.round(parseFloat(tenYearPayoutHigh)));

  function rowLabel(index: number, year: number): string {
    const yrNum = index + 1;
    const isLast = index === benchmarkSchedule.length - 1 && benchmarkSchedule.length < 10;
    if (isLast) return `Yr ${yrNum}–10 (${year}+)`;
    return `Yr ${yrNum} (${year})`;
  }

  function priceLabel(price: string, index: number): string {
    const label = `$${Math.round(parseFloat(price))}/t`;
    const isLast = index === benchmarkSchedule.length - 1 && benchmarkSchedule.length < 10;
    return isLast ? `${label} (cap)` : label;
  }

  function payoutRange(low: string, high: string, index: number): string {
    const isLast = index === benchmarkSchedule.length - 1 && benchmarkSchedule.length < 10;
    const lo = fmtCAD(Math.round(parseFloat(low) * co2Float));
    const hi = fmtCAD(Math.round(parseFloat(high) * co2Float));
    return isLast ? `${lo} – ${hi}/yr` : `${lo} – ${hi}`;
  }

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--nrg-text-secondary)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '0 0 0.6rem',
    borderBottom: '1px solid #e0eeea',
  };

  const tdBase: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    color: 'var(--nrg-text-heading)',
    padding: '0.6rem 0',
  };

  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-card-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* ── Eyebrow + H1 + Subtitle ── */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--nrg-green)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '0 0 0.45rem',
        }}>
          Additional Income Stream
        </p>

        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
          fontWeight: 800,
          color: 'var(--nrg-text-heading)',
          lineHeight: 1.1,
          margin: '0 0 0.75rem',
        }}>
          Carbon Credits via Solar Offset
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          color: 'var(--nrg-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 1.25rem',
          maxWidth: '660px',
        }}>
          Your system qualifies for Alberta&#8217;s carbon offset credit program &#8212; an annual passive income stream for up to 10 years, with zero effort on your part.
        </p>

        {/* ── Callout box ── */}
        <div style={{
          background: 'var(--nrg-light-green-bg)',
          borderLeft: '4px solid var(--nrg-green)',
          borderRadius: '0 8px 8px 0',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          color: 'var(--nrg-text-heading)',
          lineHeight: 1.65,
        }}>
          <strong style={{ color: 'var(--nrg-green)' }}>What is Solar Offset?</strong>{' '}
          SolarOffset.ca aggregates residential solar owners and sells their clean energy production
          as verified carbon offset credits into Alberta&#8217;s regulated carbon market. You never
          pay them &#8212; they take a commission only when they sell credits on your behalf. Fully
          stackable with net metering, works alongside any utility arrangement.
        </div>

        {/* ── Two-panel section ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}>

          {/* Left — dark green panel */}
          <div style={{
            background: 'var(--nrg-carbon-dark)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              margin: '0 0 0.35rem',
            }}>
              Annual CO&#x2082; Avoided
            </p>

            <p style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: 'clamp(3rem, 5vw, 4.5rem)',
              fontWeight: 800,
              color: 'var(--nrg-carbon-mint)',
              lineHeight: 1,
              margin: '0 0 0.5rem',
            }}>
              {co2Display}
            </p>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 1.5rem',
              lineHeight: 1.5,
            }}>
              tonnes per year &middot; {productionDisplay} kWh production &middot; SolarOffset.ca GDF schedule (2026&#8211;2035)
            </p>

            <div style={{
              height: '1px',
              background: 'rgba(126,255,212,0.22)',
              marginBottom: '1.5rem',
            }} />

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.03em',
              margin: '0 0 0.4rem',
            }}>
              10 Year Carbon Revenue
            </p>

            <p style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--nrg-carbon-mint)',
              lineHeight: 1.1,
              margin: '0 0 0.9rem',
            }}>
              {tenYrLow} &#8211; {tenYrHigh}
            </p>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              margin: 0,
            }}>
              no effort required &#8209; paid annually
            </p>
          </div>

          {/* Right — white panel with green border and table */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #b8dece',
            borderRadius: '16px',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--nrg-green)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              margin: '0 0 0.6rem',
            }}>
              Alberta Carbon Price Schedule
            </p>

            <div style={{
              height: '1.5px',
              background: 'var(--nrg-green)',
              marginBottom: '0.875rem',
            }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Year</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>AB Benchmark</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Est. Your Payout</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkSchedule.map((entry, i) => {
                  const isLastRow = i === benchmarkSchedule.length - 1;
                  return (
                    <tr key={entry.year}>
                      <td style={{
                        ...tdBase,
                        borderBottom: isLastRow ? 'none' : '1px solid #f0f5f2',
                      }}>
                        {rowLabel(i, entry.year)}
                      </td>
                      <td style={{
                        ...tdBase,
                        borderBottom: isLastRow ? 'none' : '1px solid #f0f5f2',
                      }}>
                        {priceLabel(entry.pricePerTonne, i)}
                      </td>
                      <td style={{
                        ...tdBase,
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--nrg-surplus-green)',
                        borderBottom: isLastRow ? 'none' : '1px solid #f0f5f2',
                      }}>
                        {payoutRange(entry.payoutLow, entry.payoutHigh, i)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{
              height: '1px',
              background: '#e0eeea',
              margin: '0.75rem 0',
            }} />

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              color: 'var(--nrg-text-secondary)',
              margin: 0,
              lineHeight: 1.55,
            }}>
              Payouts estimated at 45&#8211;65% of Alberta benchmark after Solar Offset commission.
              Not a guarantee.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
