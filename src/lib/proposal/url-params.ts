import type { ProposalFormValues } from '@/lib/form/schema';

/**
 * Encodes ProposalFormValues into a URL-safe base64 string.
 * Uses encodeURIComponent before base64 to handle Unicode characters
 * in customer names and addresses.
 */
export function encodeProposalParams(values: ProposalFormValues): string {
  return btoa(encodeURIComponent(JSON.stringify(values)));
}

/**
 * Decodes a base64-encoded URL param back into ProposalFormValues.
 * Inverse of encodeProposalParams.
 */
export function decodeProposalParams(encoded: string): ProposalFormValues {
  return JSON.parse(decodeURIComponent(atob(encoded))) as ProposalFormValues;
}
