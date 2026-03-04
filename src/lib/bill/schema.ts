import { z } from 'zod';

// Each field is nullable — Gemini may not find all values in every utility bill.
// A null field means "not found or uncertain", not "zero".
export const extractedBillSchema = z.object({
  // Monthly consumption — preferred source (12-element array or null if no monthly data)
  // Individual months may be null if the bill only shows a subset.
  monthlyKwh: z.array(z.number().nullable()).length(12).nullable(),
  // Annual total — fallback when monthly breakdown is unavailable
  annualKwh: z.number().nullable(),
  // Effective all-in rate: total bill amount ÷ total kWh (includes ALL charges, not just energy)
  allInRateCentsPerKwh: z.number().nullable(),
  // Commodity/energy-only rate (excludes distribution, transmission, and fixed charges)
  energyRateCentsPerKwh: z.number().nullable(),
  // Name of the electricity utility company (e.g. "EPCOR", "ENMAX", "ATCOenergy")
  utilityProvider: z.string().nullable(),
  // Account holder name as shown on the bill
  accountHolderName: z.string().nullable(),
  // Service/delivery address (where electricity is delivered, not mailing address)
  serviceAddress: z.string().nullable(),
});

export type ExtractedBillFields = z.infer<typeof extractedBillSchema>;

// API response envelope — mirrors ScrapeResult shape from src/lib/scraper/types.ts
export interface ExtractBillResult {
  status: 'success' | 'partial' | 'error';
  fields: ExtractedBillFields | null;
  message?: string;
}
