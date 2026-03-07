import type { SerializedProposalOutputs } from '@/app/actions/calculate';

interface AllInCostsPageProps {
  cashPurchase: SerializedProposalOutputs['cashPurchase'];
  financeOption: SerializedProposalOutputs['financeOption'];
  systemCost: string;
  annualGridPurchaseCost: string;
  annualSellRevenue: string;
  annualGridBuyKwh: string;
  annualSurplusKwh: string;
  gridBuyRate: string;        // $/kWh
  sellRate: string;           // $/kWh
  escalationRate: string;     // e.g. "0.05"
  financeTermMonths: string;  // e.g. "60"
  carbonCredits: SerializedProposalOutputs['carbonCredits'];
  annualElectricityCost: string;
}

function fmtCAD(v: number, decimals = 0): string {
  return v.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCents(rate: string): string {
  return (parseFloat(rate) * 100).toFixed(1);
}

export function AllInCostsPage({
  cashPurchase,
  financeOption,
  systemCost,
  annualGridPurchaseCost,
  annualSellRevenue,
  annualGridBuyKwh,
  annualSurplusKwh,
  gridBuyRate,
  sellRate,
  escalationRate,
  financeTermMonths,
  carbonCredits,
  annualElectricityCost,
}: AllInCostsPageProps) {
  const escalationPct = (parseFloat(escalationRate) * 100).toFixed(0);
  const financeYears = Math.round(parseInt(financeTermMonths, 10) / 12);
  const currentMonthlyBill = parseFloat(annualElectricityCost) / 12;
  const { twentyYear, thirtyYear } = cashPurchase;

  // ── Monthly finance breakdown (mirrors CALC-08 from savings.ts) ────────────
  const monthlyFinance = parseFloat(financeOption.totalMonthlyPayment);
  const monthlyGridCost = parseFloat(annualGridPurchaseCost) / 12;
  const monthlyNMRev = parseFloat(annualSellRevenue) / 12;
  const monthlyCarbonCredit = parseFloat(carbonCredits.tenYearPayoutHigh) / 120; // tenYrHigh / 10yr / 12mo (doc §8.2)
  const monthlyAllIn = parseFloat(financeOption.monthlyAllInCost);
  // Derive cash back exactly so numbers add up: finance + grid - nm - carbon - cashBack = allIn
  const monthlyCashBack = monthlyFinance + monthlyGridCost - monthlyNMRev - monthlyCarbonCredit - monthlyAllIn;

  // ── Formatted values ───────────────────────────────────────────────────────
  const systemCostFmt = fmtCAD(parseFloat(systemCost), 2);
  const gridBuyCents = fmtCents(gridBuyRate);
  const sellCents = fmtCents(sellRate);
  const gridBuyKwhRounded = Math.round(parseFloat(annualGridBuyKwh)).toLocaleString('en-CA');
  const surplusKwhRounded = Math.round(parseFloat(annualSurplusKwh)).toLocaleString('en-CA');

  // ── Styles ─────────────────────────────────────────────────────────────────
  const sepLine: React.CSSProperties = {
    height: '1px',
    background: 'rgba(0,0,0,0.07)',
    margin: '0.6rem 0',
  };

  function LeftLineItem({
    label,
    sub,
    value,
    prefix = '+',
    green = true,
    bold = false,
    totalRow = false,
  }: {
    label: string;
    sub?: string;
    value: string;
    prefix?: string;
    green?: boolean;
    bold?: boolean;
    totalRow?: boolean;
  }) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0.45rem 0',
        borderBottom: totalRow ? 'none' : '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ flex: 1, paddingRight: '1rem' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: totalRow ? '0.68rem' : '0.82rem',
            fontWeight: totalRow ? 700 : (bold ? 600 : 400),
            color: totalRow ? 'var(--nrg-text-secondary)' : 'var(--nrg-text-heading)',
            letterSpacing: totalRow ? '0.08em' : '0',
            textTransform: totalRow ? 'uppercase' : 'none',
            margin: 0,
          }}>{label}</p>
          {sub && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.7rem',
              color: 'var(--nrg-text-secondary)',
              margin: '0.1rem 0 0',
              lineHeight: 1.4,
            }}>{sub}</p>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: totalRow ? '1.1rem' : '0.88rem',
          fontWeight: totalRow ? 800 : (bold ? 700 : 600),
          color: totalRow ? 'var(--nrg-text-heading)' : (green ? 'var(--nrg-surplus-green)' : 'var(--nrg-text-heading)'),
          margin: 0,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {totalRow ? '' : prefix}{value}
        </p>
      </div>
    );
  }

  function RightLineItem({
    label,
    sub,
    value,
    credit = false,
    totalRow = false,
  }: {
    label: string;
    sub?: string;
    value: string;
    credit?: boolean;
    totalRow?: boolean;
  }) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0.45rem 0',
        borderBottom: totalRow ? 'none' : '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ flex: 1, paddingRight: '1rem' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: totalRow ? '0.68rem' : '0.82rem',
            fontWeight: totalRow ? 700 : 400,
            color: totalRow ? 'var(--nrg-text-secondary)' : 'var(--nrg-text-heading)',
            letterSpacing: totalRow ? '0.08em' : '0',
            textTransform: totalRow ? 'uppercase' : 'none',
            margin: 0,
          }}>{label}</p>
          {sub && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.7rem',
              color: 'var(--nrg-text-secondary)',
              margin: '0.1rem 0 0',
              lineHeight: 1.4,
            }}>{sub}</p>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: totalRow ? '1.1rem' : '0.88rem',
          fontWeight: totalRow ? 800 : 600,
          color: totalRow
            ? 'var(--nrg-text-heading)'
            : credit
              ? 'var(--nrg-surplus-green)'
              : 'var(--nrg-text-heading)',
          margin: 0,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {value}
        </p>
      </div>
    );
  }

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
          True All In Costs
        </p>

        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
          fontWeight: 800,
          color: 'var(--nrg-text-heading)',
          lineHeight: 1.1,
          margin: '0 0 0.75rem',
        }}>
          What You Actually Pay
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          color: 'var(--nrg-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 1.5rem',
          maxWidth: '640px',
        }}>
          When you factor in every offset, credit, and saving against the solar payment,
          here&#8217;s your true all&#8209;in costs &#8212; everything accounted for.
        </p>

        {/* ── Two-panel grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.25rem',
        }}>

          {/* ── Left: Cash Purchase ── */}
          <div style={{
            background: 'var(--nrg-cash-col-bg)',
            border: '1.5px solid #9dd0f0',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Badge */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                background: 'var(--nrg-cash-header)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.3rem 0.875rem',
                borderRadius: '100px',
              }}>Cash Purchase</span>
            </div>

            {/* Subtitle */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              color: 'var(--nrg-text-heading)',
              margin: '0 0 0.5rem',
              fontWeight: 500,
            }}>
              Maximum ROI. Zero Utility Payments
            </p>

            {/* Big number */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.75rem, 2.5vw, 2.4rem)',
              fontWeight: 800,
              color: 'var(--nrg-text-heading)',
              lineHeight: 1,
              margin: '0 0 1rem',
            }}>
              {systemCostFmt}
            </p>

            <div style={sepLine} />

            {/* Line items */}
            <div style={{ flex: 1 }}>
              <LeftLineItem
                label="System Cost"
                value={systemCostFmt}
                prefix=""
                green={false}
              />
              <LeftLineItem
                label="20-Year Utility Bill Avoided"
                sub={`Alberta's historical ${escalationPct}% annual increase per year`}
                value={fmtCAD(parseFloat(twentyYear.utilityAvoided))}
              />
              <LeftLineItem
                label="20-Year Net Metering Sell Revenue"
                sub="Assuming 5% annual increase per year"
                value={fmtCAD(parseFloat(twentyYear.netMeteringRevenue))}
              />
              <LeftLineItem
                label="10-Year Carbon Credits"
                sub="Via Solar Offset"
                value={fmtCAD(parseFloat(twentyYear.carbonCredits))}
              />
              <LeftLineItem
                label="3% Cash Back on Grid Purchases"
                value={fmtCAD(parseFloat(twentyYear.cashBack))}
              />
            </div>

            <div style={{ height: '1px', background: 'var(--nrg-text-heading)', margin: '0.5rem 0' }} />

            {/* Total row */}
            <LeftLineItem
              label="True Savings All-In (20 Years)"
              value={fmtCAD(parseFloat(twentyYear.netSavingsAfterCost))}
              green={false}
              bold
              totalRow
            />
          </div>

          {/* ── Right: Finance Option ── */}
          <div style={{
            background: 'var(--nrg-finance-col-bg)',
            border: '1.5px solid #8dd3b0',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Badge */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                background: 'var(--nrg-dark-green)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.3rem 0.875rem',
                borderRadius: '100px',
              }}>Finance Option</span>
            </div>

            {/* Subtitle */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              color: 'var(--nrg-text-heading)',
              margin: '0 0 0.5rem',
              fontWeight: 500,
            }}>
              Predictable Expense at 0% Interest for 60&#8209;Months
            </p>

            {/* Big number */}
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.75rem, 2.5vw, 2.4rem)',
              fontWeight: 800,
              color: 'var(--nrg-text-heading)',
              lineHeight: 1,
              margin: '0 0 1rem',
            }}>
              {fmtCAD(monthlyFinance, 0)}{' '}
              <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'var(--nrg-text-secondary)' }}>
                / Month
              </span>
            </p>

            <div style={sepLine} />

            {/* Monthly line items */}
            <div style={{ flex: 1 }}>
              <RightLineItem
                label="Finance Payment"
                sub={`0% interest for first ${financeYears} years`}
                value={`+${fmtCAD(monthlyFinance, 2)}`}
              />
              <RightLineItem
                label="Remaining Utility Bill"
                sub={`${gridBuyKwhRounded} kWh @ ~${gridBuyCents}¢ (energy + T&D) ÷ 12 months`}
                value={`+${fmtCAD(monthlyGridCost, 2)}`}
              />
              <RightLineItem
                label="Less: Net Metering Sell Revenue"
                sub={`${surplusKwhRounded} kWh surplus @ ${sellCents}¢ ÷ 12`}
                value={`\u2212${fmtCAD(monthlyNMRev, 2)}`}
                credit
              />
              <RightLineItem
                label="Less: Carbon Credits (Year 1 avg.)"
                sub="Via Solar Offset — paid annually, shown monthly"
                value={`\u2212${fmtCAD(monthlyCarbonCredit, 2)}`}
                credit
              />
              <RightLineItem
                label="Less: 3% Cash Back on Grid Purchases"
                value={`\u2212${fmtCAD(monthlyCashBack, 2)}`}
                credit
              />
            </div>

            <div style={{ height: '1px', background: 'var(--nrg-text-heading)', margin: '0.5rem 0' }} />

            {/* Total row */}
            <RightLineItem
              label="Solar Monthly All-In"
              value={`${fmtCAD(monthlyAllIn, 2)} / MO`}
              totalRow
            />

            {/* vs. current bill — only shown when solar all-in is competitive (within $20) */}
            {monthlyAllIn <= currentMonthlyBill + 20 && <div style={{
              marginTop: '0.75rem',
              padding: '0.6rem 0.875rem',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--nrg-text-secondary)',
                margin: 0,
                fontStyle: 'italic',
              }}>vs. your current utility bill</p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
                margin: 0,
              }}>~{fmtCAD(currentMonthlyBill, 0)} / mo</p>
            </div>}
          </div>
        </div>

        {/* ── Bottom 30-year banner ── */}
        <div style={{
          background: 'rgba(245,166,35,0.08)',
          borderLeft: '4px solid var(--nrg-gold)',
          borderRadius: '0 8px 8px 0',
          padding: '0.875rem 1.25rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          color: 'var(--nrg-text-heading)',
          lineHeight: 1.65,
        }}>
          <strong style={{ color: 'var(--nrg-gold)' }}>Savings over 30 years:</strong>{' '}
          Assuming you stay in your property for 30 years, you would pay an astonishing{' '}
          <strong style={{ color: 'var(--nrg-gold)' }}>
            {fmtCAD(parseFloat(thirtyYear.utilityAvoided))}
          </strong>{' '}
          in electricity without solar, increasing your overall savings to{' '}
          <strong style={{ color: 'var(--nrg-gold)' }}>
            {fmtCAD(parseFloat(thirtyYear.netSavingsAfterCost))}.
          </strong>
        </div>

      </div>
    </div>
  );
}
