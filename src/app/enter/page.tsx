'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { proposalFormSchema, ProposalFormValues } from '@/lib/form/schema';
import { getEmptyDefaults } from '@/lib/form/defaults';
import { loadFormDraft, saveFormDraft } from '@/lib/form/persistence';
import { getDefaultRates } from '@/app/actions/get-defaults';
import { runCalculation, SerializedProposalOutputs } from '@/app/actions/calculate';
import { FormInput } from '@/components/form/FormInput';
import { SectionCard } from '@/components/form/SectionCard';
import { GenerateFooter } from '@/components/form/GenerateFooter';
import { MonthlyGrid } from '@/components/form/MonthlyGrid';

export default function ManualEntryPage() {
  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    mode: 'onBlur',
    defaultValues: getEmptyDefaults(),
  });

  const [warnings, setWarnings] = useState<{ systemProductionMismatch?: string }>({});
  const [calculationResult, setCalculationResult] = useState<SerializedProposalOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // 1. Load localStorage draft on mount
  useEffect(() => {
    const draft = loadFormDraft();
    if (draft) reset({ ...getEmptyDefaults(), ...draft });
  }, [reset]);

  // 2. Pre-fill rate defaults from Supabase on mount
  useEffect(() => {
    getDefaultRates()
      .then((rates) => {
        setValue('rates.allInRate', rates.allInRate, { shouldDirty: false });
        setValue('rates.netMeteringBuyRate', rates.netMeteringBuyRate, { shouldDirty: false });
        setValue('rates.netMeteringSellRate', rates.netMeteringSellRate, { shouldDirty: false });
        setValue('rates.annualEscalationRate', rates.annualEscalationRate, { shouldDirty: false });
      })
      .catch(() => {
        // Supabase offline — defaults stay empty, user fills manually
      });
  }, [setValue]);

  // 3. Auto-save on change
  useEffect(() => {
    const sub = watch((values) => saveFormDraft(values as ProposalFormValues));
    return () => sub.unsubscribe();
  }, [watch]);

  // 4. Cross-field warning — system size vs production ratio
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name !== 'system.systemSizeKw' && name !== 'system.annualProductionKwh') return;
      const size = Number(values.system?.systemSizeKw ?? '');
      const prod = Number(values.system?.annualProductionKwh ?? '');
      if (!isNaN(size) && !isNaN(prod) && size > 0 && prod > 0) {
        const ratio = prod / size;
        if (ratio < 1000 || ratio > 1800) {
          setWarnings((w) => ({
            ...w,
            systemProductionMismatch: `Production/size ratio ${ratio.toFixed(0)} kWh/kW is outside the typical Alberta range (1000–1800 kWh/kW)`,
          }));
        } else {
          setWarnings((w) => ({ ...w, systemProductionMismatch: undefined }));
        }
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // 5. Computed annualElectricityCost
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name !== 'consumption.annualConsumptionKwh' && name !== 'rates.allInRate') return;
      const kwh = Number(values.consumption?.annualConsumptionKwh ?? '');
      const rate = Number(values.rates?.allInRate ?? '');
      if (!isNaN(kwh) && !isNaN(rate) && kwh > 0 && rate > 0) {
        setValue('consumption.annualElectricityCost', (kwh * rate).toFixed(2), {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    });
    return () => sub.unsubscribe();
  }, [watch, setValue]);

  // Error count for footer (flatten nested errors)
  const rhfErrorCount = Object.keys(errors).reduce((count, section) => {
    const sectionErrors = (errors as Record<string, unknown>)[section];
    if (!sectionErrors) return count;
    const countSection = (obj: unknown): number => {
      if (!obj) return 0;
      if (typeof obj === 'object' && 'message' in (obj as object)) return 1;
      return Object.values(obj as Record<string, unknown>).reduce(
        (c: number, v) => c + countSection(v),
        0,
      );
    };
    return count + countSection(sectionErrors);
  }, 0);

  // When the form has not been touched yet (onBlur mode never fires initial validation),
  // RHF reports isValid=true and errors={} for an empty form. Count unfilled required
  // scalar fields so the footer shows "N fields remaining" instead of "Ready to generate"
  // on a blank form. Monthly arrays are excluded — the annual totals drive those.
  const allValues = watch();
  const emptyRequiredFieldCount = [
    allValues.customer?.name,
    allValues.customer?.address,
    allValues.system?.systemSizeKw,
    allValues.system?.annualProductionKwh,
    allValues.consumption?.annualConsumptionKwh,
    allValues.consumption?.annualElectricityCost,
    allValues.rates?.allInRate,
    allValues.rates?.netMeteringBuyRate,
    allValues.rates?.netMeteringSellRate,
    allValues.rates?.annualEscalationRate,
    allValues.financing?.cashPurchasePrice,
    allValues.financing?.financeMonthlyPayment,
    allValues.financing?.financeTermMonths,
    allValues.financing?.financeInterestRate,
  ].filter((v) => v === undefined || v === null || v.trim() === '').length;

  // Use whichever count is greater: RHF errors (post-blur) or empty field count (pre-touch)
  const errorCount = Math.max(rhfErrorCount, emptyRequiredFieldCount);

  // Submit handler — calls runCalculation server action with real engine
  const onSubmit = async (values: ProposalFormValues) => {
    setIsCalculating(true);
    setCalcError(null);
    try {
      const result = await runCalculation(values);
      setCalculationResult(result);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Page header */}
      <header className="border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight">Solar Presenter</h1>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.15em] uppercase text-neutral-500">
            Manual Entry
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <main className="max-w-5xl mx-auto px-6 py-10 pb-28 space-y-8">
          {/* Page title */}
          <div>
            <h2 className="text-2xl font-semibold text-neutral-100 font-[family-name:var(--font-sans)]">
              Manual Entry
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Enter proposal data. Rate fields are pre-filled with current Alberta defaults.
            </p>
          </div>

          {/* 1. Customer Information */}
          <SectionCard label="Customer Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="customer.name"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Customer Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. David Friesen"
                  />
                )}
              />
              <Controller
                control={control}
                name="customer.address"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Service Address"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 123 Main St, Calgary, AB"
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* 2. System */}
          <SectionCard label="System" warning={warnings.systemProductionMismatch}>
            <div className="space-y-6">
              <Controller
                control={control}
                name="system.systemSizeKw"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="System Size"
                    unit="kW"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 12.24"
                  />
                )}
              />
              <MonthlyGrid
                control={control}
                setValue={setValue}
                watch={watch}
                section="system"
                annualFieldName="annualProductionKwh"
                monthlyFieldName="monthlyProductionKwh"
                label="Production (kWh)"
                useAlbertaCurve={true}
                errors={
                  errors.system?.monthlyProductionKwh as
                    | Record<string, { message?: string }[]>
                    | undefined
                }
              />
            </div>
          </SectionCard>

          {/* 3. Consumption */}
          <SectionCard label="Consumption">
            <div className="space-y-6">
              <MonthlyGrid
                control={control}
                setValue={setValue}
                watch={watch}
                section="consumption"
                annualFieldName="annualConsumptionKwh"
                monthlyFieldName="monthlyConsumptionKwh"
                label="Consumption (kWh)"
                useAlbertaCurve={false}
                errors={
                  errors.consumption?.monthlyConsumptionKwh as
                    | Record<string, { message?: string }[]>
                    | undefined
                }
              />
              <Controller
                control={control}
                name="consumption.annualElectricityCost"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Annual Electricity Cost"
                    unit="$"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    readOnly
                    hint="Computed: annual consumption x all-in rate"
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* 4. Rates */}
          <SectionCard label="Rates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="rates.allInRate"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="All-In Rate"
                    unit="$/kWh"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    hint="Total cost per kWh including distribution, transmission, admin"
                    placeholder="e.g. 0.168"
                  />
                )}
              />
              <Controller
                control={control}
                name="rates.netMeteringBuyRate"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Grid Buy Rate"
                    unit="$/kWh"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 0.168"
                  />
                )}
              />
              <Controller
                control={control}
                name="rates.netMeteringSellRate"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Net Metering Sell Rate"
                    unit="$/kWh"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 0.335"
                  />
                )}
              />
              <Controller
                control={control}
                name="rates.annualEscalationRate"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Annual Rate Escalation"
                    unit="%"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    hint="e.g. 0.05 for 5%"
                    placeholder="e.g. 0.05"
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* 5. Financing */}
          <SectionCard label="Financing">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="financing.cashPurchasePrice"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Cash Purchase Price"
                    unit="$"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 28000"
                  />
                )}
              />
              <Controller
                control={control}
                name="financing.financeMonthlyPayment"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Monthly Finance Payment"
                    unit="$"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 250"
                  />
                )}
              />
              <Controller
                control={control}
                name="financing.financeTermMonths"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Finance Term"
                    unit="months"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="e.g. 120"
                  />
                )}
              />
              <Controller
                control={control}
                name="financing.financeInterestRate"
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Annual Interest Rate"
                    unit="%"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    hint="e.g. 0.079 for 7.9%"
                    placeholder="e.g. 0.079"
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* Calculation status — loading */}
          {isCalculating && (
            <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
              <span className="text-sm text-neutral-400 font-[family-name:var(--font-mono)]">
                Calculating...
              </span>
            </div>
          )}

          {/* Calculation status — error */}
          {calcError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-6">
              <div className="text-xs font-[family-name:var(--font-mono)] text-red-400 uppercase tracking-widest mb-2">
                Calculation Error
              </div>
              <p className="text-sm text-red-300">{calcError}</p>
            </div>
          )}

          {/* Calculation output — real proposal figures */}
          {calculationResult !== null && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6 space-y-4">
              <div className="text-xs font-[family-name:var(--font-mono)] text-emerald-400 uppercase tracking-widest">
                Proposal Outputs
              </div>
              {/* Key summary metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500 font-[family-name:var(--font-mono)]">Solar Offset</div>
                  <div className="text-lg font-semibold text-emerald-400">{calculationResult.solarOffsetPercent}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500 font-[family-name:var(--font-mono)]">20-Year Utility Cost</div>
                  <div className="text-lg font-semibold text-red-400">${parseFloat(calculationResult.twentyYearUtilityCost).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500 font-[family-name:var(--font-mono)]">20-Year Savings</div>
                  <div className="text-lg font-semibold text-emerald-400">${parseFloat(calculationResult.twentyYearSavings).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500 font-[family-name:var(--font-mono)]">CO&#8322; Avoided/yr</div>
                  <div className="text-lg font-semibold text-sky-400">{calculationResult.carbonCredits.annualCo2Avoided} t</div>
                </div>
              </div>
              {/* Full JSON dump for debugging */}
              <details className="mt-2">
                <summary className="text-xs text-neutral-500 cursor-pointer font-[family-name:var(--font-mono)] hover:text-neutral-400">
                  Full output JSON
                </summary>
                <pre className="text-xs text-neutral-300 font-[family-name:var(--font-mono)] overflow-auto max-h-96 mt-2">
                  {JSON.stringify(calculationResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </main>

        <GenerateFooter
          errorCount={errorCount}
          isFormValid={isValid}
          onGenerate={handleSubmit(onSubmit)}
        />
      </form>
    </div>
  );
}
