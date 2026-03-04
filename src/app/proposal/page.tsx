import { redirect } from 'next/navigation';
import './proposal.css';

import { decodeProposalParams } from '@/lib/proposal/url-params';
import { getAlbertaConfig } from '@/lib/config/alberta';
import { calculateProposal } from '@/lib/engine/calculate';
import { d } from '@/lib/decimal';
import type { ProposalFormValues } from '@/lib/form/schema';
import type { ProposalInputs, MonthlyValues } from '@/lib/types';
import type { ProposalOutputs, SavingsSummary } from '@/lib/types';
import type { SerializedProposalOutputs, SerializedSavingsSummary } from '@/app/actions/calculate';

import { CoverPage } from './pages/CoverPage';
import { TableOfContentsPage } from './pages/TableOfContentsPage';
import { NetMeteringPage } from './pages/NetMeteringPage';
import { CarbonCreditsPage } from './pages/CarbonCreditsPage';
import { AllInCostsPage } from './pages/AllInCostsPage';
import { PriceHistoryPage } from './pages/PriceHistoryPage';
import { WhatsComingPage } from './pages/WhatsComingPage';
import { WhyUsPage } from './pages/WhyUsPage';
import { WarrantyPage } from './pages/WarrantyPage';
import { FAQPage } from './pages/FAQPage';
import { NextStepsPage } from './pages/NextStepsPage';
import { ProposalFAB } from './ProposalFAB';

// ---------------------------------------------------------------------------
// Satellite image URL builder (server-side only — API key never sent to client)
// ---------------------------------------------------------------------------

function buildSatelliteImageUrl(address: string): string | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address.trim()) return null;
  const encoded = encodeURIComponent(address);
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=19&size=640x400&scale=2&maptype=satellite&key=${apiKey}`;
}

// ---------------------------------------------------------------------------
// Input builder — identical pattern to runCalculation in actions/calculate.ts
// ---------------------------------------------------------------------------

function buildProposalInputs(formValues: ProposalFormValues): ProposalInputs {
  return {
    customer: {
      name: formValues.customer.name,
      address: formValues.customer.address,
      latitude: 0,
      longitude: 0,
    },
    system: {
      systemSizeKw: d(formValues.system.systemSizeKw),
      annualProductionKwh: d(formValues.system.annualProductionKwh),
      monthlyProductionKwh: formValues.system.monthlyProductionKwh.map(d) as MonthlyValues,
    },
    consumption: {
      annualConsumptionKwh: d(formValues.consumption.annualConsumptionKwh),
      monthlyConsumptionKwh: formValues.consumption.monthlyConsumptionKwh.map(d) as MonthlyValues,
      annualElectricityCost: d(formValues.consumption.annualElectricityCost),
    },
    rates: {
      allInRate: d(formValues.rates.allInRate),
      netMeteringBuyRate: d(formValues.rates.netMeteringBuyRate).greaterThan(0)
        ? d(formValues.rates.netMeteringBuyRate).times(2)
        : d(formValues.rates.netMeteringBuyRate),
      netMeteringSellRate: d(formValues.rates.netMeteringSellRate),
      annualEscalationRate: d(formValues.rates.annualEscalationRate),
    },
    financing: {
      cashPurchasePrice: d(formValues.financing.cashPurchasePrice),
      financeMonthlyPayment: d(formValues.financing.financeMonthlyPayment),
      financeTermMonths: parseInt(formValues.financing.financeTermMonths, 10),
      financeInterestRate: d(formValues.financing.financeInterestRate),
    },
  };
}

// ---------------------------------------------------------------------------
// Output serializer — maps Decimal fields to strings for safe JSX consumption
// ---------------------------------------------------------------------------

function serializeSavings(s: SavingsSummary): SerializedSavingsSummary {
  return {
    utilityAvoided: s.utilityAvoided.toString(),
    netMeteringRevenue: s.netMeteringRevenue.toString(),
    carbonCredits: s.carbonCredits.toString(),
    cashBack: s.cashBack.toString(),
    totalSavings: s.totalSavings.toString(),
    netSavingsAfterCost: s.netSavingsAfterCost.toString(),
  };
}

function serializeOutputs(outputs: ProposalOutputs): SerializedProposalOutputs {
  return {
    solarOffsetPercent: outputs.solarOffsetPercent.toString(),
    twentyYearUtilityCost: outputs.twentyYearUtilityCost.toString(),
    twentyYearSavings: outputs.twentyYearSavings.toString(),
    monthlyNetMetering: outputs.monthlyNetMetering.map((m) => ({
      month: m.month,
      consumptionKwh: m.consumptionKwh.toString(),
      productionKwh: m.productionKwh.toString(),
      gridBuyKwh: m.gridBuyKwh.toString(),
      surplusSoldKwh: m.surplusSoldKwh.toString(),
      costToBuy: m.costToBuy.toString(),
      revenueEarned: m.revenueEarned.toString(),
    })),
    annualGridPurchaseCost: outputs.annualGridPurchaseCost.toString(),
    annualSellRevenue: outputs.annualSellRevenue.toString(),
    carbonCredits: {
      annualCo2Avoided: outputs.carbonCredits.annualCo2Avoided.toString(),
      tenYearPayoutLow: outputs.carbonCredits.tenYearPayoutLow.toString(),
      tenYearPayoutHigh: outputs.carbonCredits.tenYearPayoutHigh.toString(),
      benchmarkSchedule: outputs.carbonCredits.benchmarkSchedule.map((entry) => ({
        year: entry.year,
        pricePerTonne: entry.pricePerTonne.toString(),
        payoutLow: entry.payoutLow.toString(),
        payoutHigh: entry.payoutHigh.toString(),
      })),
    },
    cashPurchase: {
      twentyYear: serializeSavings(outputs.cashPurchase.twentyYear),
      thirtyYear: serializeSavings(outputs.cashPurchase.thirtyYear),
    },
    financeOption: {
      monthlyAllInCost: outputs.financeOption.monthlyAllInCost.toString(),
      totalMonthlyPayment: outputs.financeOption.totalMonthlyPayment.toString(),
    },
    utilityProjection20Year: outputs.utilityProjection20Year.map((v) => v.toString()),
    utilityProjection30Year: outputs.utilityProjection30Year.map((v) => v.toString()),
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const params = await searchParams;

  // Redirect to /enter if no encoded data provided
  if (!params.d) redirect('/enter');

  // Decode form values — redirect on invalid base64
  let formValues: ProposalFormValues;
  try {
    formValues = decodeProposalParams(params.d);
  } catch {
    redirect('/enter');
  }

  // Run calculation server-side (no server action boundary needed here)
  const config = await getAlbertaConfig();
  const inputs = buildProposalInputs(formValues);
  const outputs = calculateProposal(inputs, config);
  const serialized = serializeOutputs(outputs);

  // Satellite image URL built server-side — API key stays on server
  const satelliteUrl = buildSatelliteImageUrl(formValues.customer.address);

  return (
    <div className="proposal-root proposal-snap-container">
      {/* Page 1 — Cover */}
      <CoverPage
        customerName={formValues.customer.name}
        address={formValues.customer.address}
        systemSizeKw={formValues.system.systemSizeKw}
        outputs={serialized}
        satelliteUrl={satelliteUrl}
      />

      {/* Page 2 — Table of Contents */}
      <TableOfContentsPage />

      {/* Page 3 — Net Metering */}
      <NetMeteringPage
        monthlyNetMetering={serialized.monthlyNetMetering}
        annualGridPurchaseCost={serialized.annualGridPurchaseCost}
        annualSellRevenue={serialized.annualSellRevenue}
        allInRate={formValues.rates.allInRate}
        gridBuyRate={parseFloat(formValues.rates.netMeteringBuyRate) > 0
          ? String(parseFloat(formValues.rates.netMeteringBuyRate) * 2)
          : formValues.rates.netMeteringBuyRate}
        sellRate={formValues.rates.netMeteringSellRate}
        preSolarRate={config.defaultPreSolarRate.toString()}
      />

      {/* Page 4 — Carbon Credits */}
      <CarbonCreditsPage
        carbonCredits={serialized.carbonCredits}
        annualProductionKwh={formValues.system.annualProductionKwh}
      />

      {/* Page 5 — All-In Costs */}
      <AllInCostsPage
        cashPurchase={serialized.cashPurchase}
        financeOption={serialized.financeOption}
        systemCost={formValues.financing.cashPurchasePrice}
        annualGridPurchaseCost={serialized.annualGridPurchaseCost}
        annualSellRevenue={serialized.annualSellRevenue}
        annualGridBuyKwh={serialized.monthlyNetMetering
          .reduce((s, m) => s + parseFloat(m.gridBuyKwh), 0)
          .toFixed(0)}
        annualSurplusKwh={serialized.monthlyNetMetering
          .reduce((s, m) => s + parseFloat(m.surplusSoldKwh), 0)
          .toFixed(0)}
        gridBuyRate={parseFloat(formValues.rates.netMeteringBuyRate) > 0
          ? String(parseFloat(formValues.rates.netMeteringBuyRate) * 2)
          : formValues.rates.netMeteringBuyRate}
        sellRate={formValues.rates.netMeteringSellRate}
        escalationRate={formValues.rates.annualEscalationRate}
        financeTermMonths={formValues.financing.financeTermMonths}
        carbonCredits={serialized.carbonCredits}
      />

      {/* Page 6 — Price History */}
      <PriceHistoryPage />

      {/* Page 7 — What's Coming */}
      <WhatsComingPage />

      {/* Page 8 — Why Northern NRG */}
      <WhyUsPage />

      {/* Page 9 — Warranty & Protection */}
      <WarrantyPage />

      {/* Page 10 — FAQ */}
      <FAQPage systemCost={formValues.financing.cashPurchasePrice} />

      {/* Page 11 — Next Steps */}
      <NextStepsPage />

      {/* Persistent floating action button */}
      <ProposalFAB d={params.d} customerName={formValues.customer.name} />
    </div>
  );
}
