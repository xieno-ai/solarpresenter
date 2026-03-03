import { describe, it, expect, beforeAll } from 'vitest';
import { d } from '@/lib/decimal';
import { paulFriesenInputs } from '@/test-data/paul-friesen';
import { paulFriesenConfig } from '@/test-data/paul-friesen-config';
import { calculateProposal } from '@/lib/engine/calculate';
import type { ProposalOutputs } from '@/lib/types/proposal-outputs';

describe('calculateProposal — full integration', () => {
  let outputs: ProposalOutputs;

  beforeAll(() => {
    outputs = calculateProposal(paulFriesenInputs, paulFriesenConfig);
  });

  describe('CALC-01 — utility projections', () => {
    it('utilityProjection20Year has exactly 20 entries', () => {
      expect(outputs.utilityProjection20Year).toHaveLength(20);
    });

    it('utilityProjection30Year has exactly 30 entries', () => {
      expect(outputs.utilityProjection30Year).toHaveLength(30);
    });

    it('utilityProjection20Year[0] equals 4212 × 1.05^0 = 4212.00 (no escalation Year 1)', () => {
      expect(outputs.utilityProjection20Year[0].toFixed(2)).toBe('4212.00');
    });

    it('twentyYearUtilityCost equals sum of all 20 projected years', () => {
      const sum = outputs.utilityProjection20Year.reduce(
        (acc, v) => acc.plus(v),
        d('0'),
      );
      expect(outputs.twentyYearUtilityCost.toFixed(2)).toBe(sum.toFixed(2));
    });
  });

  describe('CALC-02 — monthly net metering', () => {
    it('monthlyNetMetering has exactly 12 entries', () => {
      expect(outputs.monthlyNetMetering).toHaveLength(12);
    });

    it('Jan (index 0): gridBuyKwh = 452 (1100 - 648), surplusSoldKwh = 0', () => {
      const jan = outputs.monthlyNetMetering[0];
      expect(jan.gridBuyKwh.toFixed(0)).toBe('452');
      expect(jan.surplusSoldKwh.toFixed(0)).toBe('0');
    });

    it('Jun (index 5): surplusSoldKwh = 914 (1764 - 850), gridBuyKwh = 0', () => {
      const jun = outputs.monthlyNetMetering[5];
      expect(jun.surplusSoldKwh.toFixed(0)).toBe('914');
      expect(jun.gridBuyKwh.toFixed(0)).toBe('0');
    });

    it('Mar (index 2): surplus month — gridBuyKwh = 0, surplusSoldKwh = 188 (1188 - 1000)', () => {
      const mar = outputs.monthlyNetMetering[2];
      expect(mar.gridBuyKwh.toFixed(0)).toBe('0');
      expect(mar.surplusSoldKwh.toFixed(0)).toBe('188');
    });

    it('Dec (index 11): gridBuyKwh = 610 (1150 - 540), surplusSoldKwh = 0', () => {
      const dec = outputs.monthlyNetMetering[11];
      expect(dec.gridBuyKwh.toFixed(0)).toBe('610');
      expect(dec.surplusSoldKwh.toFixed(0)).toBe('0');
    });
  });

  describe('CALC-03 — annual net metering totals', () => {
    it('annualGridPurchaseCost is greater than 0 (deficit months cost money)', () => {
      expect(outputs.annualGridPurchaseCost.greaterThan(d('0'))).toBe(true);
    });

    it('annualSellRevenue is greater than 0 (surplus months generate revenue)', () => {
      expect(outputs.annualSellRevenue.greaterThan(d('0'))).toBe(true);
    });

    it('annualGridPurchaseCost equals sum of all 12 monthly costToBuy values', () => {
      const sum = outputs.monthlyNetMetering.reduce(
        (acc, m) => acc.plus(m.costToBuy),
        d('0'),
      );
      expect(outputs.annualGridPurchaseCost.toFixed(2)).toBe(sum.toFixed(2));
    });

    it('annualSellRevenue equals sum of all 12 monthly revenueEarned values', () => {
      const sum = outputs.monthlyNetMetering.reduce(
        (acc, m) => acc.plus(m.revenueEarned),
        d('0'),
      );
      expect(outputs.annualSellRevenue.toFixed(2)).toBe(sum.toFixed(2));
    });
  });

  describe('CALC-04 — net metering projections (escalation effect)', () => {
    it('20-year net metering revenue exceeds annualSellRevenue × 20 (escalation increases it)', () => {
      const flat20 = outputs.annualSellRevenue.times(d('20'));
      expect(
        outputs.cashPurchase.twentyYear.netMeteringRevenue.greaterThan(flat20),
      ).toBe(true);
    });
  });

  describe('CALC-05 — carbon credits', () => {
    it('annualCo2Avoided = 15408 / 1000 × 0.55 = 8.4744', () => {
      expect(outputs.carbonCredits.annualCo2Avoided.toFixed(4)).toBe('8.4744');
    });

    it('benchmarkSchedule has at least 10 entries', () => {
      expect(outputs.carbonCredits.benchmarkSchedule.length).toBeGreaterThanOrEqual(10);
    });

    it('tenYearPayoutLow is greater than 0', () => {
      expect(outputs.carbonCredits.tenYearPayoutLow.greaterThan(d('0'))).toBe(true);
    });

    it('tenYearPayoutHigh is greater than tenYearPayoutLow', () => {
      expect(
        outputs.carbonCredits.tenYearPayoutHigh.greaterThan(
          outputs.carbonCredits.tenYearPayoutLow,
        ),
      ).toBe(true);
    });
  });

  describe('CALC-06 — cash back', () => {
    it('20-year cash back is greater than 0', () => {
      expect(outputs.cashPurchase.twentyYear.cashBack.greaterThan(d('0'))).toBe(true);
    });

    it('30-year cash back is greater than 20-year cash back', () => {
      expect(
        outputs.cashPurchase.thirtyYear.cashBack.greaterThan(
          outputs.cashPurchase.twentyYear.cashBack,
        ),
      ).toBe(true);
    });

    it('20-year cashBack divided by 30-year cashBack is less than 1', () => {
      const ratio = outputs.cashPurchase.twentyYear.cashBack.dividedBy(
        outputs.cashPurchase.thirtyYear.cashBack,
      );
      expect(ratio.lessThan(d('1'))).toBe(true);
    });
  });

  describe('CALC-07 — true all-in savings', () => {
    it('20-year netSavingsAfterCost equals totalSavings minus 30000 (cashPurchasePrice)', () => {
      const expected = outputs.cashPurchase.twentyYear.totalSavings.minus(d('30000'));
      expect(outputs.cashPurchase.twentyYear.netSavingsAfterCost.toFixed(2)).toBe(
        expected.toFixed(2),
      );
    });

    it('20-year totalSavings equals sum of utilityAvoided + netMeteringRevenue + carbonCredits + cashBack', () => {
      const s = outputs.cashPurchase.twentyYear;
      const sum = s.utilityAvoided
        .plus(s.netMeteringRevenue)
        .plus(s.carbonCredits)
        .plus(s.cashBack);
      expect(s.totalSavings.toFixed(2)).toBe(sum.toFixed(2));
    });

    it('30-year netSavingsAfterCost is greater than 20-year netSavingsAfterCost', () => {
      expect(
        outputs.cashPurchase.thirtyYear.netSavingsAfterCost.greaterThan(
          outputs.cashPurchase.twentyYear.netSavingsAfterCost,
        ),
      ).toBe(true);
    });
  });

  describe('CALC-08 — monthly finance analysis', () => {
    it('monthlyAllInCost is greater than 0', () => {
      expect(outputs.financeOption.monthlyAllInCost.greaterThan(d('0'))).toBe(true);
    });

    it('totalMonthlyPayment equals 189 (financeMonthlyPayment pass-through)', () => {
      expect(outputs.financeOption.totalMonthlyPayment.toFixed(2)).toBe('189.00');
    });

    it('monthlyAllInCost is a finite Decimal (not NaN or Infinity)', () => {
      expect(outputs.financeOption.monthlyAllInCost.isFinite()).toBe(true);
      expect(outputs.financeOption.monthlyAllInCost.isNaN()).toBe(false);
    });
  });

  describe('solarOffsetPercent', () => {
    it('solarOffsetPercent = 15408 / 12000 × 100 = 128.40', () => {
      expect(outputs.solarOffsetPercent.toFixed(2)).toBe('128.40');
    });
  });

  describe('twentyYearSavings', () => {
    it('twentyYearSavings equals cashPurchase.twentyYear.netSavingsAfterCost', () => {
      expect(outputs.twentyYearSavings.toFixed(2)).toBe(
        outputs.cashPurchase.twentyYear.netSavingsAfterCost.toFixed(2),
      );
    });
  });
});
