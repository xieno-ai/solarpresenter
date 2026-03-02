import { describe, it, expect } from 'vitest';

// ============================================================
// schema.ts tests
// ============================================================
describe('proposalFormSchema', () => {
  it('validates customer.name as non-empty string', async () => {
    const { proposalFormSchema } = await import('../schema');
    const result = proposalFormSchema.shape.customer.shape.name.safeParse('');
    expect(result.success).toBe(false);
    const result2 = proposalFormSchema.shape.customer.shape.name.safeParse('John');
    expect(result2.success).toBe(true);
  });

  it('validates system.systemSizeKw as numeric string in range 1-100', async () => {
    const { proposalFormSchema } = await import('../schema');
    const field = proposalFormSchema.shape.system.shape.systemSizeKw;
    expect(field.safeParse('0').success).toBe(false);   // below min
    expect(field.safeParse('101').success).toBe(false); // above max
    expect(field.safeParse('10').success).toBe(true);   // valid
    expect(field.safeParse('abc').success).toBe(false); // not numeric
  });

  it('validates monthly arrays as exactly 12 entries, each numeric string 0-5000', async () => {
    const { proposalFormSchema } = await import('../schema');
    const monthlyField = proposalFormSchema.shape.system.shape.monthlyProductionKwh;
    const validArray = Array(12).fill('100');
    expect(monthlyField.safeParse(validArray).success).toBe(true);
    // Too few
    expect(monthlyField.safeParse(Array(11).fill('100')).success).toBe(false);
    // Too many
    expect(monthlyField.safeParse(Array(13).fill('100')).success).toBe(false);
    // Out of range
    expect(monthlyField.safeParse(Array(12).fill('6000')).success).toBe(false);
  });

  it('validates rates.allInRate as numeric string in range 0.01-2.0', async () => {
    const { proposalFormSchema } = await import('../schema');
    const field = proposalFormSchema.shape.rates.shape.allInRate;
    expect(field.safeParse('0').success).toBe(false);   // below min
    expect(field.safeParse('3').success).toBe(false);   // above max
    expect(field.safeParse('0.15').success).toBe(true); // valid
  });

  it('validates financing.financeTermMonths as numeric string in range 1-600', async () => {
    const { proposalFormSchema } = await import('../schema');
    const field = proposalFormSchema.shape.financing.shape.financeTermMonths;
    expect(field.safeParse('0').success).toBe(false);   // below min
    expect(field.safeParse('601').success).toBe(false); // above max
    expect(field.safeParse('360').success).toBe(true);  // valid
  });

  it('ProposalFormValues has all string fields (not Decimal)', async () => {
    const { proposalFormSchema } = await import('../schema');
    // Validate a complete valid object to confirm all string fields accepted
    const valid = {
      customer: { name: 'Jane Doe', address: '123 Main St' },
      system: {
        systemSizeKw: '10',
        annualProductionKwh: '12000',
        monthlyProductionKwh: Array(12).fill('1000'),
      },
      consumption: {
        annualConsumptionKwh: '10000',
        monthlyConsumptionKwh: Array(12).fill('833'),
        annualElectricityCost: '1500',
      },
      rates: {
        allInRate: '0.168',
        netMeteringBuyRate: '0.168',
        netMeteringSellRate: '0.335',
        annualEscalationRate: '0.05',
      },
      financing: {
        cashPurchasePrice: '25000',
        financeMonthlyPayment: '250',
        financeTermMonths: '120',
        financeInterestRate: '0.05',
      },
    };
    const result = proposalFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================
// defaults.ts tests
// ============================================================
describe('ALBERTA_SOLAR_CURVE', () => {
  it('has exactly 12 entries', async () => {
    const { ALBERTA_SOLAR_CURVE } = await import('../defaults');
    expect(ALBERTA_SOLAR_CURVE).toHaveLength(12);
  });

  it('sums to approximately 1.0 (within 0.001)', async () => {
    const { ALBERTA_SOLAR_CURVE } = await import('../defaults');
    const sum = ALBERTA_SOLAR_CURVE.reduce((acc, v) => acc + v, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });
});

describe('getEmptyDefaults', () => {
  it('returns object with all 12 monthly slots set to "0" for production', async () => {
    const { getEmptyDefaults } = await import('../defaults');
    const defaults = getEmptyDefaults();
    expect(defaults.system.monthlyProductionKwh).toHaveLength(12);
    expect(defaults.system.monthlyProductionKwh.every((v: string) => v === '0')).toBe(true);
  });

  it('returns object with all 12 monthly slots set to "0" for consumption', async () => {
    const { getEmptyDefaults } = await import('../defaults');
    const defaults = getEmptyDefaults();
    expect(defaults.consumption.monthlyConsumptionKwh).toHaveLength(12);
    expect(defaults.consumption.monthlyConsumptionKwh.every((v: string) => v === '0')).toBe(true);
  });
});

// ============================================================
// persistence.ts tests
// ============================================================
describe('loadFormDraft', () => {
  it('returns null in a non-browser environment (window undefined)', async () => {
    const { loadFormDraft } = await import('../persistence');
    // In Vitest Node environment, window is undefined
    const result = loadFormDraft();
    expect(result).toBeNull();
  });
});

describe('saveFormDraft', () => {
  it('does not throw in a non-browser environment', async () => {
    const { saveFormDraft, FORM_STORAGE_KEY } = await import('../persistence');
    // In Vitest Node environment, window is undefined — should not throw
    expect(() => saveFormDraft({} as any)).not.toThrow();
    expect(FORM_STORAGE_KEY).toBe('solar-presenter-form-draft');
  });
});
