import type { SerializedMonthlyNetMetering } from '@/app/actions/calculate';

interface NetMeteringPageProps {
  monthlyNetMetering: SerializedMonthlyNetMetering[];
  annualGridPurchaseCost: string;
  annualSellRevenue: string;
  /** Customer's current all-in electricity rate in $/kWh — shown as "Your Rate" (red) */
  allInRate: string;
  gridBuyRate: string;
  sellRate: string;
  /** ENMAX Solar Ready™ program rate in $/kWh — fixed regulatory rate while waiting for install */
  preSolarRate: string;
}

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function toCents(rate: string): string {
  return (parseFloat(rate) * 100).toFixed(2);
}

function roundKwh(v: string): string {
  return Math.round(parseFloat(v)).toLocaleString('en-CA');
}

function fmtCAD(v: string): string {
  return parseFloat(v).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function NetMeteringPage({
  monthlyNetMetering,
  annualGridPurchaseCost,
  annualSellRevenue,
  allInRate,
  gridBuyRate,
  sellRate,
  preSolarRate,
}: NetMeteringPageProps) {
  const totalConsume = monthlyNetMetering.reduce((s, r) => s + parseFloat(r.consumptionKwh), 0);
  const totalProduce = monthlyNetMetering.reduce((s, r) => s + parseFloat(r.productionKwh), 0);
  const totalGridBuy = monthlyNetMetering.reduce((s, r) => s + parseFloat(r.gridBuyKwh), 0);
  const totalSurplus = monthlyNetMetering.reduce((s, r) => s + parseFloat(r.surplusSoldKwh), 0);

  const rateCards = [
    { value: toCents(allInRate), label: 'Your Rate', color: 'var(--nrg-red-badge)' },
    { value: toCents(preSolarRate), label: 'Pre-Solar Rate', color: 'var(--nrg-green)' },
    { value: toCents(gridBuyRate), label: 'LO Rate (Winter Purchase)', color: 'var(--nrg-green)' },
    { value: toCents(sellRate), label: 'HI Rate (Summer Surplus)', color: 'var(--nrg-gold)' },
  ];

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--nrg-text-secondary)',
    letterSpacing: '0.09em',
    textTransform: 'uppercase' as const,
    padding: '0 0.875rem 0.75rem',
    borderBottom: '1px solid #dde8ee',
    whiteSpace: 'nowrap' as const,
  };

  const tdBase: React.CSSProperties = {
    padding: '0.55rem 0.875rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
    borderBottom: '1px solid #f0f4f7',
  };

  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      {/* height:auto — content centres on page like Page 2 */}
      <div className="proposal-inner" style={{ height: 'auto' }}>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

          {/* ── Left column — percentage width so heading never overflows ── */}
          <div style={{ width: '30%', flexShrink: 0 }}>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--nrg-green)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: '0 0 0.15rem',
            }}>Month by Month</p>

            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.75rem, 4.5vw, 4rem)',
              fontWeight: 900,
              color: 'var(--nrg-text-heading)',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              margin: '0 0 1.75rem',
              wordBreak: 'break-word',
            }}>Net Metering</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rateCards.map((card) => (
                <div key={card.label} style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1.5px solid var(--nrg-green)',
                  padding: '1.1rem 1.75rem',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                    fontWeight: 700,
                    color: card.color,
                    margin: 0,
                    lineHeight: 1,
                  }}>{card.value}¢/kWh</p>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.82rem',
                    color: 'var(--nrg-text-secondary)',
                    margin: '0.35rem 0 0',
                  }}>{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
              padding: '1.5rem 1.75rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
                margin: '0 0 0.2rem',
              }}>Annual Net Metering Breakdown</p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                color: 'var(--nrg-text-secondary)',
                margin: '0 0 1.25rem',
                lineHeight: 1.55,
              }}>Green rows = months your panels produce surplus. Summer credits roll forward and eliminate your winter grid purchases.</p>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Month</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Consume</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Produce</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Grid Buy</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Surplus Sold</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Cost to Buy</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Revenue Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyNetMetering.map((row, i) => {
                    const isSurplus = parseFloat(row.surplusSoldKwh) > 0;
                    const gridBuyKwh = parseFloat(row.gridBuyKwh);
                    const surplusKwh = parseFloat(row.surplusSoldKwh);
                    const costVal = parseFloat(row.costToBuy);
                    const revVal = parseFloat(row.revenueEarned);
                    return (
                      <tr key={row.month} style={{ background: isSurplus ? '#f0fbf5' : 'transparent' }}>
                        {/* Month chip */}
                        <td style={{ ...tdBase }}>
                          <span style={{
                            display: 'inline-block',
                            width: '2.5rem',
                            textAlign: 'center',
                            background: '#e8edf2',
                            borderRadius: '4px',
                            padding: '0.15rem 0',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#5a7080',
                            letterSpacing: '0.06em',
                          }}>{MONTH_ABBR[i]}</span>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', color: 'var(--nrg-text-heading)' }}>
                          {roundKwh(row.consumptionKwh)}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', color: 'var(--nrg-text-heading)' }}>
                          {roundKwh(row.productionKwh)}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', color: gridBuyKwh > 0 ? 'var(--nrg-text-heading)' : 'var(--nrg-text-secondary)' }}>
                          {gridBuyKwh > 0 ? roundKwh(row.gridBuyKwh) + ' kWh' : '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', fontWeight: isSurplus ? 600 : 400, color: isSurplus ? 'var(--nrg-surplus-green)' : 'var(--nrg-text-secondary)' }}>
                          {surplusKwh > 0 ? '+' + roundKwh(row.surplusSoldKwh) + ' kWh' : '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', color: costVal > 0 ? 'var(--nrg-red-badge)' : 'var(--nrg-text-secondary)' }}>
                          {costVal > 0 ? '$' + costVal.toFixed(2) : '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right', fontWeight: revVal > 0 ? 600 : 400, color: revVal > 0 ? 'var(--nrg-surplus-green)' : 'var(--nrg-text-secondary)' }}>
                          {revVal > 0 ? '+$' + revVal.toFixed(2) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--nrg-text-heading)' }}>
                    <td style={{ padding: '0.65rem 0.875rem', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--nrg-text-heading)', letterSpacing: '0.06em' }}>TOTALS</td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-text-heading)' }}>
                      {Math.round(totalConsume).toLocaleString('en-CA')}
                    </td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-text-heading)' }}>
                      {Math.round(totalProduce).toLocaleString('en-CA')}
                    </td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-text-heading)' }}>
                      {Math.round(totalGridBuy).toLocaleString('en-CA')} kWh
                    </td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-surplus-green)' }}>
                      {Math.round(totalSurplus).toLocaleString('en-CA')} kWh
                    </td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-red-badge)' }}>
                      {fmtCAD(annualGridPurchaseCost)}
                    </td>
                    <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--nrg-surplus-green)' }}>
                      +{fmtCAD(annualSellRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
