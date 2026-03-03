import dynamic from 'next/dynamic';
import type { SerializedMonthlyNetMetering } from '@/app/actions/calculate';

const ProductionConsumptionChart = dynamic(
  () =>
    import('../charts/ProductionConsumptionChart').then(
      (m) => m.ProductionConsumptionChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 200, background: '#f0f0f0', borderRadius: 8 }} />
    ),
  },
);

interface NetMeteringPageProps {
  monthlyNetMetering: SerializedMonthlyNetMetering[];
  annualGridPurchaseCost: string;
  annualSellRevenue: string;
  gridBuyRate: string;
  sellRate: string;
}

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function formatCAD(value: string): string {
  return parseFloat(value).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatKwh(value: string): string {
  return parseFloat(value).toLocaleString('en-CA', { maximumFractionDigits: 1 });
}

export function NetMeteringPage({
  monthlyNetMetering,
  annualGridPurchaseCost,
  annualSellRevenue,
  gridBuyRate,
  sellRate,
}: NetMeteringPageProps) {
  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-page-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header band */}
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
            NET METERING
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
            MONTH BY MONTH ANALYSIS
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

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          padding: '1.25rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
        }}
      >
        {/* White card with table */}
        <div
          style={{
            background: 'var(--nrg-card-bg)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,121,63,0.07)',
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
              <tr
                style={{
                  background: 'var(--nrg-green)',
                  color: '#ffffff',
                }}
              >
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'left',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  MONTH
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  Consumption (kWh)
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  Production (kWh)
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  Grid Buy (kWh)
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#7effd4',
                  }}
                >
                  Surplus Sold (kWh)
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  Cost to Buy
                </th>
                <th
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#7effd4',
                  }}
                >
                  Revenue Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyNetMetering.map((row, i) => {
                const isSurplus = parseFloat(row.surplusSoldKwh) > 0;
                return (
                  <tr
                    key={row.month}
                    style={{
                      background: isSurplus ? 'var(--nrg-row-green)' : (i % 2 === 0 ? '#ffffff' : '#fafafa'),
                      borderBottom: '1px solid #eef5ee',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'var(--font-montserrat)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: 'var(--nrg-text-primary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {MONTH_ABBR[i]}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-text-primary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatKwh(row.consumptionKwh)}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-green)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatKwh(row.productionKwh)}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-text-secondary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatKwh(row.gridBuyKwh)}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: isSurplus ? 'var(--nrg-surplus-green)' : 'var(--nrg-text-secondary)',
                        fontWeight: isSurplus ? 700 : 400,
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatKwh(row.surplusSoldKwh)}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--nrg-text-primary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatCAD(row.costToBuy)}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: isSurplus ? 'var(--nrg-surplus-green)' : 'var(--nrg-text-secondary)',
                        fontWeight: isSurplus ? 700 : 400,
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatCAD(row.revenueEarned)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr
                style={{
                  background: 'var(--nrg-light-green-bg)',
                  borderTop: '2px solid var(--nrg-green)',
                }}
              >
                <td
                  colSpan={5}
                  style={{
                    padding: '0.6rem 0.75rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    color: 'var(--nrg-text-primary)',
                    fontSize: '0.82rem',
                  }}
                >
                  Annual Total
                </td>
                <td
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--nrg-text-primary)',
                    fontSize: '0.82rem',
                  }}
                >
                  {formatCAD(annualGridPurchaseCost)}
                </td>
                <td
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--nrg-surplus-green)',
                    fontSize: '0.82rem',
                  }}
                >
                  {formatCAD(annualSellRevenue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Rate cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--nrg-card-bg)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              borderLeft: '3px solid var(--nrg-green)',
              boxShadow: '0 1px 6px rgba(0,121,63,0.06)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--nrg-text-secondary)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Grid Buy Rate
            </p>
            <p
              style={{
                fontFamily: 'var(--font-montserrat)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--nrg-text-primary)',
              }}
            >
              ${parseFloat(gridBuyRate).toFixed(4)}/kWh
            </p>
          </div>
          <div
            style={{
              background: 'var(--nrg-card-bg)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              borderLeft: '3px solid var(--nrg-surplus-green)',
              boxShadow: '0 1px 6px rgba(0,121,63,0.06)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--nrg-text-secondary)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Surplus Sell Rate
            </p>
            <p
              style={{
                fontFamily: 'var(--font-montserrat)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--nrg-surplus-green)',
              }}
            >
              ${parseFloat(sellRate).toFixed(4)}/kWh
            </p>
          </div>
        </div>

        {/* Production vs Consumption chart */}
        <div
          style={{
            background: 'var(--nrg-card-bg)',
            borderRadius: '10px',
            padding: '1rem',
            boxShadow: '0 2px 12px rgba(0,121,63,0.07)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              color: 'var(--nrg-text-secondary)',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            MONTHLY PRODUCTION VS CONSUMPTION
          </p>
          <ProductionConsumptionChart monthlyNetMetering={monthlyNetMetering} />
        </div>
      </div>
    </div>
  );
}
