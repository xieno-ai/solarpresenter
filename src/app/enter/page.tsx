'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { proposalFormSchema, ProposalFormValues } from '@/lib/form/schema';
import { getEmptyDefaults } from '@/lib/form/defaults';
import { loadFormDraft, saveFormDraft } from '@/lib/form/persistence';
import { getDefaultRates } from '@/app/actions/get-defaults';
import { encodeProposalParams } from '@/lib/proposal/url-params';
import { FormInput } from '@/components/form/FormInput';
import { SectionCard } from '@/components/form/SectionCard';
import { GenerateFooter } from '@/components/form/GenerateFooter';
import { MonthlyGrid } from '@/components/form/MonthlyGrid';
import { SunPitchTab } from './components/SunPitchTab';
import type { ScrapeResult, HighlightMap } from '@/lib/scraper/types';

export default function ManualEntryPage() {
  const router = useRouter();

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
  const [activeTab, setActiveTab] = useState<'sunpitch' | 'manual'>('sunpitch');
  const [highlights, setHighlights] = useState<HighlightMap>({});

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

  // Handle successful import from SunPitch scraper
  function handleImportSuccess(result: ScrapeResult) {
    if (!result.data) return; // hard error — SunPitchTab already showed error

    // Full reset: merge empty defaults with scraped data
    const merged = { ...getEmptyDefaults(), ...result.data };
    reset(merged);

    // Persist to draft so page refresh doesn't wipe scraped data
    saveFormDraft(merged as ProposalFormValues);

    // Build highlight map
    const newHighlights: HighlightMap = {};

    // Mark scraped fields green — walk the data object paths
    function markScraped(obj: Record<string, unknown>, prefix: string) {
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val !== null && val !== undefined && val !== '' && !Array.isArray(val)) {
          newHighlights[path] = 'scraped';
        } else if (Array.isArray(val)) {
          newHighlights[path] = 'scraped'; // monthly arrays count as one field
        }
      }
    }
    markScraped(result.data as Record<string, unknown>, '');

    // Mark missing fields amber
    result.missingFields.forEach((path) => {
      newHighlights[path] = 'missing';
    });

    setHighlights(newHighlights);
    setActiveTab('manual');
  }

  // Clear a field's highlight when user edits it (user takes ownership)
  function clearHighlight(fieldPath: string) {
    setHighlights((prev) => {
      const next = { ...prev };
      delete next[fieldPath];
      return next;
    });
  }

  // Helper: get highlight class for a field path
  function highlightClass(fieldPath: string) {
    const hl = highlights[fieldPath];
    if (hl === 'scraped') return 'rounded-lg ring-1 ring-green-500/30 bg-green-500/5';
    if (hl === 'missing') return 'rounded-lg ring-1 ring-amber-400/30 bg-amber-400/5';
    return '';
  }

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

  // Submit handler — navigates to /proposal with encoded form values
  const onSubmit = (values: ProposalFormValues) => {
    router.push(`/proposal?d=${encodeProposalParams(values)}`);
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
            {activeTab === 'sunpitch' ? 'SunPitch Import' : 'Manual Entry'}
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <main className="max-w-5xl mx-auto px-6 py-10 pb-28 space-y-8">

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('sunpitch')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sunpitch'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Paste SunPitch URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manual'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* SunPitch tab content */}
          {activeTab === 'sunpitch' && (
            <SunPitchTab onImportSuccess={handleImportSuccess} />
          )}

          {activeTab === 'manual' && (
            <>
              {/* 1. Customer Information */}
              <SectionCard label="Customer Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={highlightClass('customer.name')}>
                    <Controller
                      control={control}
                      name="customer.name"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Customer Name"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('customer.name'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. David Friesen"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('customer.address')}>
                    <Controller
                      control={control}
                      name="customer.address"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Service Address"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('customer.address'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 123 Main St, Calgary, AB"
                        />
                      )}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* 2. System */}
              <SectionCard label="System" warning={warnings.systemProductionMismatch}>
                <div className="space-y-6">
                  <div className={highlightClass('system.systemSizeKw')}>
                    <Controller
                      control={control}
                      name="system.systemSizeKw"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="System Size"
                          unit="kW"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('system.systemSizeKw'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 12.24"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('system.monthlyProductionKwh')}>
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
                </div>
              </SectionCard>

              {/* 3. Consumption */}
              <SectionCard label="Consumption">
                <div className="space-y-6">
                  <div className={highlightClass('consumption.monthlyConsumptionKwh')}>
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
                  </div>
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
                  <div className={highlightClass('rates.allInRate')}>
                    <Controller
                      control={control}
                      name="rates.allInRate"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="All-In Rate"
                          unit="$/kWh"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('rates.allInRate'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          hint="Total cost per kWh including distribution, transmission, admin"
                          placeholder="e.g. 0.168"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('rates.netMeteringBuyRate')}>
                    <Controller
                      control={control}
                      name="rates.netMeteringBuyRate"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Grid Buy Rate"
                          unit="$/kWh"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('rates.netMeteringBuyRate'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 0.168"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('rates.netMeteringSellRate')}>
                    <Controller
                      control={control}
                      name="rates.netMeteringSellRate"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Net Metering Sell Rate"
                          unit="$/kWh"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('rates.netMeteringSellRate'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 0.335"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('rates.annualEscalationRate')}>
                    <Controller
                      control={control}
                      name="rates.annualEscalationRate"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Annual Rate Escalation"
                          unit="%"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('rates.annualEscalationRate'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          hint="e.g. 0.05 for 5%"
                          placeholder="e.g. 0.05"
                        />
                      )}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* 5. Financing */}
              <SectionCard label="Financing">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={highlightClass('financing.cashPurchasePrice')}>
                    <Controller
                      control={control}
                      name="financing.cashPurchasePrice"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Cash Purchase Price"
                          unit="$"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('financing.cashPurchasePrice'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 28000"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('financing.financeMonthlyPayment')}>
                    <Controller
                      control={control}
                      name="financing.financeMonthlyPayment"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Monthly Finance Payment"
                          unit="$"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('financing.financeMonthlyPayment'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 250"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('financing.financeTermMonths')}>
                    <Controller
                      control={control}
                      name="financing.financeTermMonths"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Finance Term"
                          unit="months"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('financing.financeTermMonths'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          placeholder="e.g. 120"
                        />
                      )}
                    />
                  </div>
                  <div className={highlightClass('financing.financeInterestRate')}>
                    <Controller
                      control={control}
                      name="financing.financeInterestRate"
                      render={({ field, fieldState }) => (
                        <FormInput
                          label="Annual Interest Rate"
                          unit="%"
                          value={field.value}
                          onChange={(v) => { field.onChange(v); clearHighlight('financing.financeInterestRate'); }}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          hint="e.g. 0.079 for 7.9%"
                          placeholder="e.g. 0.079"
                        />
                      )}
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

        </main>

        {activeTab === 'manual' && (
          <GenerateFooter
            errorCount={errorCount}
            isFormValid={isValid}
            onGenerate={handleSubmit(onSubmit)}
          />
        )}
      </form>
    </div>
  );
}
