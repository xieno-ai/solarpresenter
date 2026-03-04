'use client';

import { useRef, useEffect } from 'react';
import { Controller, Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ProposalFormValues } from '@/lib/form/schema';
import { ALBERTA_SOLAR_CURVE } from '@/lib/form/defaults';
import { FormInput } from './FormInput';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export interface MonthlyGridProps {
  control: Control<ProposalFormValues>;
  setValue: UseFormSetValue<ProposalFormValues>;
  watch: UseFormWatch<ProposalFormValues>;
  /** Field path prefix: 'system' | 'consumption' */
  section: 'system' | 'consumption';
  /** Field names within the section */
  annualFieldName: 'annualProductionKwh' | 'annualConsumptionKwh';
  monthlyFieldName: 'monthlyProductionKwh' | 'monthlyConsumptionKwh';
  label: string;                      // e.g. "Production (kWh)"
  useAlbertaCurve?: boolean;          // true for production, false for consumption (even split)
  errors?: Record<string, { message?: string }[]>;  // Monthly field errors from formState
  /** Optional className applied to the annual total wrapper only */
  annualWrapperClassName?: string;
  /** Optional className applied to the monthly grid wrapper only */
  monthlyWrapperClassName?: string;
}

export function MonthlyGrid({
  control,
  setValue,
  watch,
  section,
  annualFieldName,
  monthlyFieldName,
  label,
  useAlbertaCurve = false,
  errors,
  annualWrapperClassName,
  monthlyWrapperClassName,
}: MonthlyGridProps) {
  const syncSource = useRef<'annual' | 'monthly' | null>(null);
  const annualPath = `${section}.${annualFieldName}` as const;
  const monthlyBasePath = `${section}.${monthlyFieldName}` as const;

  // Annual → monthly distribution
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name !== annualPath) return;
      if (syncSource.current === 'monthly') return;
      const raw = (values as Record<string, unknown>)?.[section] as Record<string, unknown> | undefined;
      const annualVal = raw?.[annualFieldName] ?? '';
      const annual = Number(annualVal);
      if (isNaN(annual) || annual <= 0) return;
      // Skip distribution if monthly values are already populated (e.g. scraped from SunPitch)
      const sectionVals = (values as Record<string, unknown>)?.[section] as Record<string, unknown> | undefined;
      const months = (sectionVals?.[monthlyFieldName] ?? []) as string[];
      const monthlySum = months.reduce((acc, v) => acc + (Number(v) || 0), 0);
      if (monthlySum > 0) return;
      syncSource.current = 'annual';
      const curve = useAlbertaCurve ? ALBERTA_SOLAR_CURVE : Array(12).fill(1 / 12);
      curve.forEach((fraction: number, i: number) => {
        setValue(
          `${monthlyBasePath}.${i}` as Parameters<UseFormSetValue<ProposalFormValues>>[0],
          (annual * fraction).toFixed(0) as never,
          { shouldDirty: true, shouldValidate: false },
        );
      });
      syncSource.current = null;
    });
    return () => sub.unsubscribe();
  }, [watch, setValue, annualPath, monthlyBasePath, section, annualFieldName, useAlbertaCurve]);

  // Monthly → annual sum
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (!name?.startsWith(monthlyBasePath)) return;
      if (syncSource.current === 'annual') return;
      const sectionVals = (values as Record<string, unknown>)?.[section] as Record<string, unknown> | undefined;
      const months = (sectionVals?.[monthlyFieldName] ?? []) as string[];
      const sum = months.reduce((acc, v) => acc + (Number(v) || 0), 0);
      syncSource.current = 'monthly';
      setValue(
        annualPath as Parameters<UseFormSetValue<ProposalFormValues>>[0],
        sum.toFixed(0) as never,
        { shouldDirty: true, shouldValidate: false },
      );
      syncSource.current = null;
    });
    return () => sub.unsubscribe();
  }, [watch, setValue, annualPath, monthlyBasePath, section, monthlyFieldName]);

  return (
    <div>
      {/* Annual total input */}
      <div className={annualWrapperClassName}>
        <Controller
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={annualPath as any}
          render={({ field, fieldState }) => (
            <FormInput
              label={`${label} — Annual Total`}
              unit="kWh"
              value={field.value as string}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="0"
            />
          )}
        />
      </div>

      {/* 12-month grid: 4 columns × 3 rows */}
      <div className={`grid grid-cols-4 gap-2 mt-3 ${monthlyWrapperClassName ?? ''}`}>
        {MONTH_NAMES.map((month, i) => (
          <Controller
            key={month}
            control={control}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={`${monthlyBasePath}.${i}` as any}
            render={({ field, fieldState }) => (
              <FormInput
                label={month}
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors?.[i]?.[0]?.message ?? fieldState.error?.message}
              />
            )}
          />
        ))}
      </div>
    </div>
  );
}
