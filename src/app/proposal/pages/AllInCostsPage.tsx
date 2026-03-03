import dynamic from 'next/dynamic';
import type { SerializedProposalOutputs } from '@/app/actions/calculate';

const UtilityTrendChart = dynamic(
  () => import('../charts/UtilityTrendChart').then((m) => m.UtilityTrendChart),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 200, background: '#f0f0f0', borderRadius: 8 }} />
    ),
  },
);

interface AllInCostsPageProps {
  cashPurchase: SerializedProposalOutputs['cashPurchase'];
  financeOption: SerializedProposalOutputs['financeOption'];
  utilityProjection20Year: string[];
  systemCost: string;
}

function formatCAD(value: string, decimals = 0): string {
  return parseFloat(value).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function LineItem({
  label,
  value,
  color = 'var(--nrg-green)',
  prefix = '+',
  bold = false,
}: {
  label: string;
  value: string;
  color?: string;
  prefix?: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          color: 'var(--nrg-text-secondary)',
          fontWeight: bold ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          color,
          fontWeight: bold ? 700 : 500,
        }}
      >
        {prefix}{value}
      </span>
    </div>
  );
}

export function AllInCostsPage({
  cashPurchase,
  financeOption,
  utilityProjection20Year,
  systemCost,
}: AllInCostsPageProps) {
  const { twentyYear, thirtyYear } = cashPurchase;

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
      {/* Header */}
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
            TRUE ALL-IN COSTS
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
            CASH PURCHASE VS FINANCE OPTION
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

      {/* Two-column body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
          padding: '1.25rem 2.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Left column — Cash Purchase */}
        <div
          style={{
            background: 'var(--nrg-cash-col-bg)',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 12px rgba(65,148,216,0.1)',
          }}
        >
          {/* Blue badge header */}
          <div
            style={{
              background: 'var(--nrg-cash-header)',
              padding: '0.75rem 1.25rem',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                color: '#ffffff',
                letterSpacing: '0.1em',
                margin: 0,
              }}
            >
              CASH PURCHASE
            </p>
          </div>

          <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {/* 20-year line items */}
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                color: 'var(--nrg-text-secondary)',
                letterSpacing: '0.1em',
                marginBottom: '0.25rem',
              }}
            >
              20-YEAR SAVINGS
            </p>

            <LineItem
              label="Utility Avoided"
              value={formatCAD(twentyYear.utilityAvoided)}
              color="var(--nrg-green)"
              prefix="+ "
            />
            <LineItem
              label="Net Metering Revenue"
              value={formatCAD(twentyYear.netMeteringRevenue)}
              color="var(--nrg-green)"
              prefix="+ "
            />
            <LineItem
              label="Carbon Credits"
              value={formatCAD(twentyYear.carbonCredits)}
              color="var(--nrg-green)"
              prefix="+ "
            />
            <LineItem
              label="Cash Back (3%)"
              value={formatCAD(twentyYear.cashBack)}
              color="var(--nrg-green)"
              prefix="+ "
            />
            <LineItem
              label="System Cost"
              value={formatCAD(systemCost)}
              color="#df584d"
              prefix="- "
            />

            <div
              style={{
                background: 'var(--nrg-light-green-bg)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-primary)',
                }}
              >
                20-Year Net Savings
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--nrg-green)',
                }}
              >
                {formatCAD(twentyYear.netSavingsAfterCost)}
              </span>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                color: 'var(--nrg-text-secondary)',
                marginTop: '0.25rem',
              }}
            >
              30-Year: <strong style={{ color: 'var(--nrg-green)' }}>{formatCAD(thirtyYear.netSavingsAfterCost)}</strong>
            </p>

            {/* Utility trend chart */}
            <div style={{ flex: 1, minHeight: 0, marginTop: '0.5rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.68rem',
                  color: 'var(--nrg-text-secondary)',
                  letterSpacing: '0.08em',
                  marginBottom: '0.25rem',
                }}
              >
                20-YEAR UTILITY COST TREND
              </p>
              <UtilityTrendChart projection20Year={utilityProjection20Year} />
            </div>
          </div>
        </div>

        {/* Right column — Finance Option */}
        <div
          style={{
            background: 'var(--nrg-finance-col-bg)',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 12px rgba(17,131,75,0.1)',
          }}
        >
          {/* Green badge header */}
          <div
            style={{
              background: 'var(--nrg-finance-header)',
              padding: '0.75rem 1.25rem',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                color: '#ffffff',
                letterSpacing: '0.1em',
                margin: 0,
              }}
            >
              FINANCE OPTION
            </p>
          </div>

          <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Monthly all-in cost — big display */}
            <div
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                boxShadow: '0 1px 6px rgba(17,131,75,0.08)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  color: 'var(--nrg-text-secondary)',
                  letterSpacing: '0.12em',
                  marginBottom: '0.5rem',
                }}
              >
                MONTHLY ALL-IN COST
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--nrg-finance-header)',
                  lineHeight: 1,
                }}
              >
                {formatCAD(financeOption.monthlyAllInCost, 0)}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.25rem',
                }}
              >
                per month
              </p>
            </div>

            {/* Monthly breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.72rem',
                  color: 'var(--nrg-text-secondary)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                }}
              >
                MONTHLY BREAKDOWN
              </p>

              <LineItem
                label="Finance Payment"
                value={formatCAD(financeOption.totalMonthlyPayment, 2)}
                color="#df584d"
                prefix="- "
              />
              <LineItem
                label="Remaining Utility"
                value={formatCAD(financeOption.monthlyAllInCost, 2)}
                color="var(--nrg-text-secondary)"
                prefix=""
              />

              <div
                style={{
                  marginTop: '0.75rem',
                  background: 'var(--nrg-card-bg)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '3px solid var(--nrg-finance-header)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--nrg-text-primary)',
                  }}
                >
                  Total Monthly with Solar
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--nrg-finance-header)',
                  }}
                >
                  {formatCAD(financeOption.monthlyAllInCost)}
                </span>
              </div>
            </div>

            {/* Value props */}
            <div
              style={{
                background: 'var(--nrg-card-bg)',
                borderRadius: '8px',
                padding: '1rem',
                flex: 1,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.72rem',
                  color: 'var(--nrg-text-secondary)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                }}
              >
                INCLUDED BENEFITS
              </p>
              {[
                'Net Metering Credits Applied Monthly',
                'Carbon Credit Revenue (Alberta Program)',
                '3% Cash Back on System Purchase',
                'Transferable Solar Warranty',
                'Production Monitoring Included',
              ].map((benefit) => (
                <div
                  key={benefit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.3rem 0',
                    borderBottom: '1px solid rgba(0,121,63,0.08)',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="7" cy="7" r="7" fill="#00793f" opacity="0.15" />
                    <path
                      d="M4 7l2 2 4-4"
                      stroke="#00793f"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.75rem',
                      color: 'var(--nrg-text-primary)',
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gold banner */}
      <div
        style={{
          background: 'var(--nrg-gold-banner)',
          padding: '0.9rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: 'rgba(0,0,0,0.6)',
              letterSpacing: '0.12em',
              margin: 0,
            }}
          >
            YOUR 30-YEAR SAVINGS
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              color: 'rgba(0,0,0,0.5)',
              margin: 0,
            }}
          >
            Cash purchase, including all sources of value
          </p>
        </div>
        <div
          style={{
            background: 'var(--nrg-gold-banner-inner)',
            borderRadius: '8px',
            padding: '0.5rem 1.5rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#7a4e00',
            }}
          >
            {formatCAD(thirtyYear.netSavingsAfterCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
