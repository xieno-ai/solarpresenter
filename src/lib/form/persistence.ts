import type { ProposalFormValues } from './schema';

/** localStorage key for the form draft */
export const FORM_STORAGE_KEY = 'solar-presenter-form-draft';

/**
 * Load a previously saved form draft from localStorage.
 *
 * Guards against SSR: returns null when called outside a browser context.
 * Wraps JSON.parse in try/catch to handle corrupted/stale data gracefully.
 *
 * @returns Partial form values if a valid draft exists, null otherwise
 */
export function loadFormDraft(): Partial<ProposalFormValues> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ProposalFormValues>;
  } catch {
    return null;
  }
}

/**
 * Save the current form values to localStorage as a draft.
 *
 * Guards against SSR: no-ops when called outside a browser context.
 * Wraps localStorage.setItem in try/catch to handle quota errors silently.
 *
 * @param values - Full form values to persist
 */
export function saveFormDraft(values: ProposalFormValues): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Quota exceeded or private browsing — fail silently
  }
}
