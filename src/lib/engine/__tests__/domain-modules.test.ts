import { describe, it, expect } from 'vitest';
import { d } from '@/lib/decimal';
import { paulFriesenInputs } from '@/test-data/paul-friesen';
import { paulFriesenConfig } from '@/test-data/paul-friesen-config';

import { projectUtilityCosts } from '../utility-projection';
import { computeMonthlyNetMetering, computeNetMeteringProjection } from '../net-metering';
import { computeCarbonCredits } from '../carbon-credits';
import { computeCashBack } from '../cash-back';
import { computeSavingsSummary, computeFinanceOption } from '../savings';

// ---------------------------------------------------------------------------
// CALC-01: Utility Projection
// ---------------------------------------------------------------------------
describe('projectUtilityCosts — CALC-01', () => {
  const costs20 = projectUtilityCosts(
    paulFriesenInputs.consumption.annualElectricityCost,
    paulFriesenInputs.rates.annualEscalationRate,
    20,
  );
  const costs30 = projectUtilityCosts(
    paulFriesenInputs.consumption.annualElectricityCost,
    paulFriesenInputs.rates.annualEscalationRate,
    30,
  );

  it('returns exactly 20 entries for 20-year projection', () => {
    expect(costs20).toHaveLength(20);
  });

  it('returns exactly 30 entries for 30-year projection', () => {
    expect(costs30).toHaveLength(30);
  });

  it('Year 1 = $4212 × 1.05^0 = $4212.00 (no escalation in Year 1)', () => {
    expect(costs20[0].toFixed(2)).toBe('4212.00');
  });

  it('Year 2 = $4212 × 1.05^1 = $4422.60', () => {
    expect(costs20[1].toFixed(2)).toBe('4422.60');
  });
});

// ---------------------------------------------------------------------------
// CALC-02 / CALC-03: Monthly Net Metering
// ---------------------------------------------------------------------------
describe('computeMonthlyNetMetering — CALC-02/03', () => {
  const monthly = computeMonthlyNetMetering(paulFriesenInputs);

  it('returns 12 months', () => {
    expect(monthly).toHaveLength(12);
  });

  it('January: production(648) < consumption(1100) → gridBuyKwh = 452, surplusSoldKwh = 0', () => {
    const jan = monthly[0];
    expect(jan.month).toBe('Jan');
    expect(jan.gridBuyKwh.toFixed(0)).toBe('452');
    expect(jan.surplusSoldKwh.toFixed(0)).toBe('0');
  });

  it('June: production(1764) > consumption(850) → surplusSoldKwh = 914, gridBuyKwh = 0', () => {
    const jun = monthly[5];
    expect(jun.month).toBe('Jun');
    expect(jun.surplusSoldKwh.toFixed(0)).toBe('914');
    expect(jun.gridBuyKwh.toFixed(0)).toBe('0');
  });

  it('January costToBuy = 452 × 0.1680 = 75.936', () => {
    const jan = monthly[0];
    expect(jan.costToBuy.toFixed(3)).toBe('75.936');
  });

  it('June revenueEarned = 914 × 0.3350 = 306.190', () => {
    const jun = monthly[5];
    expect(jun.revenueEarned.toFixed(3)).toBe('306.190');
  });

  it('each month has correct consumptionKwh and productionKwh values', () => {
    expect(monthly[0].consumptionKwh.toFixed(0)).toBe('1100');
    expect(monthly[0].productionKwh.toFixed(0)).toBe('648');
  });

  it('production === consumption → treated as surplus (gridBuyKwh = 0)', () => {
    // Construct a case where production exactly equals consumption
    const evenInputs = {
      ...paulFriesenInputs,
      system: {
        ...paulFriesenInputs.system,
        monthlyProductionKwh: [
          d('1100'), d('1050'), d('1000'), d('950'), d('900'), d('850'),
          d('900'), d('950'), d('1000'), d('1050'), d('1100'), d('1150'),
        ] as typeof paulFriesenInputs.system.monthlyProductionKwh,
      },
    };
    const evenMonthly = computeMonthlyNetMetering(evenInputs);
    expect(evenMonthly[0].gridBuyKwh.toFixed(0)).toBe('0');
    expect(evenMonthly[0].surplusSoldKwh.toFixed(0)).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// CALC-04: Net Metering Projection
// ---------------------------------------------------------------------------
describe('computeNetMeteringProjection — CALC-04', () => {
  it('returns totalSellRevenue and totalGridPurchaseCost as Decimal', () => {
    const result = computeNetMeteringProjection(
      d('1000'),
      d('500'),
      d('0.05'),
      20,
    );
    expect(result.totalSellRevenue).toBeDefined();
    expect(result.totalGridPurchaseCost).toBeDefined();
  });

  it('with zero escalation, 20-year total = annual × 20', () => {
    const result = computeNetMeteringProjection(
      d('1000'),
      d('500'),
      d('0'),
      20,
    );
    // With 0 escalation: (1+0)^n = 1 for all n, sum = annual × 20
    expect(result.totalSellRevenue.toFixed(2)).toBe('20000.00');
    expect(result.totalGridPurchaseCost.toFixed(2)).toBe('10000.00');
  });

  it('year 1 = base value (no escalation in Year 1)', () => {
    const result = computeNetMeteringProjection(
      d('1000'),
      d('0'),
      d('0.05'),
      1,
    );
    expect(result.totalSellRevenue.toFixed(2)).toBe('1000.00');
  });
});

// ---------------------------------------------------------------------------
// CALC-05: Carbon Credits (SolarOffset.ca GDF schedule)
// ---------------------------------------------------------------------------
describe('computeCarbonCredits — CALC-05', () => {
  // Paul Friesen: systemSizeKw = 12.24 kWp → 5–30 range → 30% platform fee → 70% to owner
  const cc = computeCarbonCredits(
    paulFriesenInputs.system.annualProductionKwh,
    paulFriesenInputs.system.systemSizeKw,
  );

  it('annualCo2Avoided = 15408 / 1000 × 0.4588 (Year 1 GDF) = 7.0691904', () => {
    expect(cc.annualCo2Avoided.toFixed(7)).toBe('7.0691904');
  });

  it('tenYearPayoutLow is greater than 0', () => {
    expect(cc.tenYearPayoutLow.greaterThan(d('0'))).toBe(true);
  });

  it('tenYearPayoutHigh > tenYearPayoutLow', () => {
    expect(cc.tenYearPayoutHigh.greaterThan(cc.tenYearPayoutLow)).toBe(true);
  });

  it('benchmarkSchedule has 10 entries (years 2026-2035)', () => {
    expect(cc.benchmarkSchedule).toHaveLength(10);
  });

  it('benchmarkSchedule[0].year === 2026', () => {
    expect(cc.benchmarkSchedule[0].year).toBe(2026);
  });
});

// ---------------------------------------------------------------------------
// CALC-06: Cash Back
// ---------------------------------------------------------------------------
describe('computeCashBack — CALC-06', () => {
  it('returns a Decimal', () => {
    const cb = computeCashBack(d('500'), d('0.05'), d('0.03'), 20);
    expect(cb).toBeDefined();
    expect(typeof cb.toFixed).toBe('function');
  });

  it('year 1: cashBack = annualGridPurchaseCost × 1.05^0 × 0.03 (no escalation Year 1)', () => {
    const cb = computeCashBack(d('500'), d('0.05'), d('0.03'), 1);
    // 500 × 1.05^0 × 0.03 = 500 × 0.03 = 15.00
    expect(cb.toFixed(2)).toBe('15.00');
  });

  it('with zero escalation, result = annualGridPurchaseCost × cashBackRate × years', () => {
    const cb = computeCashBack(d('1000'), d('0'), d('0.03'), 10);
    // 0% escalation: each year = 1000 × 0.03 = 30; total = 300
    expect(cb.toFixed(2)).toBe('300.00');
  });
});

// ---------------------------------------------------------------------------
// CALC-07: Savings Summary
// ---------------------------------------------------------------------------
describe('computeSavingsSummary — CALC-07', () => {
  const summary = computeSavingsSummary(
    d('100000'),  // utilityAvoided
    d('20000'),   // netMeteringRevenue
    d('5000'),    // carbonCredits
    d('3000'),    // cashBack
    d('30000'),   // cashPurchasePrice
  );

  it('totalSavings = utilityAvoided + netMeteringRevenue + carbonCredits + cashBack', () => {
    expect(summary.totalSavings.toFixed(2)).toBe('128000.00');
  });

  it('netSavingsAfterCost = totalSavings - cashPurchasePrice', () => {
    expect(summary.netSavingsAfterCost.toFixed(2)).toBe('98000.00');
  });

  it('all fields present', () => {
    expect(summary.utilityAvoided.toFixed(2)).toBe('100000.00');
    expect(summary.netMeteringRevenue.toFixed(2)).toBe('20000.00');
    expect(summary.carbonCredits.toFixed(2)).toBe('5000.00');
    expect(summary.cashBack.toFixed(2)).toBe('3000.00');
  });

  it('allows negative netSavingsAfterCost when system cost exceeds savings', () => {
    const negativeSummary = computeSavingsSummary(
      d('10000'),
      d('0'),
      d('0'),
      d('0'),
      d('50000'),
    );
    expect(negativeSummary.netSavingsAfterCost.lessThan(d('0'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CALC-08: Finance Option
// ---------------------------------------------------------------------------
describe('computeFinanceOption — CALC-08', () => {
  it('returns monthlyAllInCost and totalMonthlyPayment', () => {
    const result = computeFinanceOption(
      d('189'),    // financeMonthlyPayment
      d('500'),    // annualGridPurchaseCost
      d('200'),    // annualSellRevenue
      d('100'),    // annualCarbonCredit
      d('15'),     // annualCashBackYear1
    );
    expect(result.monthlyAllInCost).toBeDefined();
    expect(result.totalMonthlyPayment).toBeDefined();
  });

  it('totalMonthlyPayment is the finance payment (pass-through)', () => {
    const result = computeFinanceOption(
      d('189'),
      d('500'),
      d('200'),
      d('100'),
      d('15'),
    );
    expect(result.totalMonthlyPayment.toFixed(2)).toBe('189.00');
  });

  it('monthlyAllInCost = financePayment + gridCost/12 - sellRev/12 - carbonCredit/12 - cashBack/12', () => {
    // financePayment=189, gridCost=500/12≈41.67, sellRev=200/12≈16.67, carbonCredit=100/12≈8.33, cashBack=15/12=1.25
    // monthlyAllInCost = 189 + 41.6667 - 16.6667 - 8.3333 - 1.25 = 204.4167
    const result = computeFinanceOption(
      d('189'),
      d('500'),
      d('200'),
      d('100'),
      d('15'),
    );
    // Allow tolerance: compute the expected value precisely
    const expected = d('189')
      .plus(d('500').dividedBy(d('12')))
      .minus(d('200').dividedBy(d('12')))
      .minus(d('100').dividedBy(d('12')))
      .minus(d('15').dividedBy(d('12')));
    expect(result.monthlyAllInCost.toFixed(4)).toBe(expected.toFixed(4));
  });

  it('with zero offsets, monthlyAllInCost = financePayment + gridCost/12', () => {
    const result = computeFinanceOption(
      d('189'),
      d('1200'),
      d('0'),
      d('0'),
      d('0'),
    );
    expect(result.monthlyAllInCost.toFixed(2)).toBe('289.00');
  });
});
