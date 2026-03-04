import type { ProposalFormValues } from '@/lib/form/schema';

export type ScrapeStatus = 'success' | 'partial' | 'error';

export interface ScrapeResult {
  status: ScrapeStatus;
  data: Partial<ProposalFormValues> | null;
  missingFields: string[];
  message?: string;
}

export type FieldHighlight = 'scraped' | 'missing';

export type HighlightMap = Partial<Record<string, FieldHighlight>>;
