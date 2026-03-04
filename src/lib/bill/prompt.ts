/**
 * Gemini extraction prompt for Alberta electricity utility bills.
 *
 * Kept in a separate file so prompt tuning doesn't require touching the route handler.
 * Alberta context: major providers are EPCOR, ENMAX, ATCOenergy, Encor, Direct Energy.
 * Typical all-in rates: 14–25 cents/kWh (varies by zone, season, and retailer).
 */
export const BILL_EXTRACTION_PROMPT = `You are an expert at reading Alberta electricity utility bills.

Extract the following fields from the provided utility bill document and return them as JSON.

Fields to extract:

monthlyKwh
  An array of exactly 12 monthly electricity consumption values in kWh, ordered January through December.
  If the bill only shows some months, place those values in the correct month positions and fill the remaining positions with null.
  If no monthly data exists at all, return null for the entire array (not an array of nulls).

annualKwh
  Total annual electricity consumption in kWh.
  If not explicitly stated on the bill, calculate it by summing all non-null values in monthlyKwh.
  If neither monthly nor annual data is available, return null.

allInRateCentsPerKwh
  The effective all-in rate in cents per kWh.
  Calculate as: (total bill amount in dollars ÷ total kWh consumed) × 100.
  This rate MUST include all charges: energy, distribution, transmission, administration, and any other fees.
  It should NOT be just the energy or commodity charge line item — it is the total cost per kWh.
  Alberta all-in rates are typically 14–25 cents/kWh. If you calculate a value far outside this range, re-check your calculation.

energyRateCentsPerKwh
  The energy or commodity rate in cents per kWh.
  This is ONLY the energy/electricity charge line item, excluding distribution, transmission, and fixed charges.
  Look for line items labelled "Energy Charge", "Commodity Charge", "Electricity Rate", or similar.
  Return null if you cannot identify the energy-only rate with confidence.

utilityProvider
  The name of the electricity utility company as shown on the bill.
  Common Alberta providers: EPCOR, ENMAX, ATCOenergy, Encor, Direct Energy, FortisAlberta.
  Return the name exactly as printed on the bill.

accountHolderName
  The full name of the account holder as shown on the bill.
  This is typically near the top of the bill, on the address block, or under "Bill To" / "Account Holder".

serviceAddress
  The service or delivery address — where the electricity is physically delivered.
  This may differ from the mailing/billing address; prefer the service address if both are present.
  Include street number, street name, city, province, and postal code if visible.

Rules:
- Return null for any field you cannot find or are not confident about. Never guess.
- Do not return 0 when data is missing — return null.
- Rates should be in cents per kWh (not dollars per kWh). Multiply by 100 if the bill shows $/kWh.
- Monthly kWh values should be whole numbers or decimals as shown on the bill — do not round.
`;
