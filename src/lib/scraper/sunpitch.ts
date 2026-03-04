import type { Browser, Page } from 'playwright';
import type { ScrapeResult } from './types';
import type { ProposalFormValues } from '@/lib/form/schema';

/** Captured payload from a network response during page load */
interface CapturedPayload {
  url: string;
  data: unknown;
}

/**
 * Normalizes a raw array to exactly 12 string entries.
 * Pads with '0' if fewer than 12; trims to 12 if more.
 */
function normalizeMonthlyArray(raw: (string | number | null | undefined)[]): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = raw[i];
    if (v == null || v === '') return '0';
    return String(v);
  });
}

/**
 * Determines whether a parsed JSON object is likely to contain SunPitch proposal data.
 * Checks for known field names that appear in proposal API responses.
 */
function looksLikeProposalData(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false;
  const obj = json as Record<string, unknown>;
  const keys = [
    'systemSize',
    'monthlyProduction',
    'production',
    'proposal',
    'customer',
    'clientName',
  ];
  return keys.some((k) => k in obj);
}

/**
 * Extracts a numeric kW value from text like "10.2 kW" or "10kW".
 */
function extractKwValue(text: string): string | null {
  const match = text.match(/(\d+\.?\d*)\s*kW/i);
  return match ? match[1] : null;
}

/**
 * Attempts to map a raw API JSON payload into Partial<ProposalFormValues>.
 * Since SunPitch's API shape is unknown until tested, this is a best-effort mapping
 * that logs what it finds for debugging.
 */
function extractFromApiResponse(payloads: CapturedPayload[]): ScrapeResult {
  console.log('[scraper] extractFromApiResponse: processing', payloads.length, 'captured payloads');

  const data: Partial<ProposalFormValues> = {};
  const missingFields: string[] = [];

  // Try each payload in order — use the first one that yields data
  for (const { url: payloadUrl, data: raw } of payloads) {
    console.log('[scraper] examining payload from:', payloadUrl);

    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Record<string, unknown>;

    // Customer name — try common field names
    if (!data.customer?.name) {
      const nameVal =
        (obj.clientName as string | undefined) ??
        (obj.customerName as string | undefined) ??
        ((obj.customer as Record<string, unknown> | undefined)?.name as string | undefined) ??
        ((obj.proposal as Record<string, unknown> | undefined)?.clientName as string | undefined);
      if (nameVal && typeof nameVal === 'string') {
        data.customer = { ...data.customer, name: nameVal, address: data.customer?.address ?? '' };
        console.log('[scraper] customer.name found:', nameVal);
      }
    }

    // Customer address
    if (!data.customer?.address) {
      const addrVal =
        (obj.address as string | undefined) ??
        (obj.clientAddress as string | undefined) ??
        ((obj.customer as Record<string, unknown> | undefined)?.address as string | undefined);
      if (addrVal && typeof addrVal === 'string') {
        data.customer = { ...data.customer, address: addrVal, name: data.customer?.name ?? '' };
        console.log('[scraper] customer.address found:', addrVal);
      }
    }

    // System size kW
    if (!data.system?.systemSizeKw) {
      const sizeRaw =
        (obj.systemSize as string | number | undefined) ??
        ((obj.system as Record<string, unknown> | undefined)?.size as string | number | undefined) ??
        ((obj.proposal as Record<string, unknown> | undefined)?.systemSize as string | number | undefined);
      if (sizeRaw != null) {
        const sizeStr = String(sizeRaw);
        const kwVal = extractKwValue(sizeStr) ?? (isNaN(Number(sizeStr)) ? null : sizeStr);
        if (kwVal) {
          data.system = { ...data.system, systemSizeKw: kwVal } as typeof data.system;
          console.log('[scraper] system.systemSizeKw found:', kwVal);
        }
      }
    }

    // Annual production
    if (!data.system?.annualProductionKwh) {
      const annualProd =
        (obj.annualProduction as string | number | undefined) ??
        ((obj.production as Record<string, unknown> | undefined)?.annual as string | number | undefined);
      if (annualProd != null) {
        data.system = {
          ...data.system,
          annualProductionKwh: String(annualProd),
        } as typeof data.system;
        console.log('[scraper] system.annualProductionKwh found:', annualProd);
      }
    }

    // Monthly production
    if (!data.system?.monthlyProductionKwh) {
      const monthlyProd =
        (obj.monthlyProduction as (string | number | null)[] | undefined) ??
        ((obj.production as Record<string, unknown> | undefined)?.monthly as (string | number | null)[] | undefined);
      if (Array.isArray(monthlyProd)) {
        data.system = {
          ...data.system,
          monthlyProductionKwh: normalizeMonthlyArray(monthlyProd),
        } as typeof data.system;
        console.log('[scraper] system.monthlyProductionKwh found:', monthlyProd.length, 'entries');
      }
    }

    // Annual consumption
    if (!data.consumption?.annualConsumptionKwh) {
      const annualCons =
        (obj.annualConsumption as string | number | undefined) ??
        ((obj.consumption as Record<string, unknown> | undefined)?.annual as string | number | undefined);
      if (annualCons != null) {
        data.consumption = {
          ...data.consumption,
          annualConsumptionKwh: String(annualCons),
        } as typeof data.consumption;
        console.log('[scraper] consumption.annualConsumptionKwh found:', annualCons);
      }
    }

    // Monthly consumption
    if (!data.consumption?.monthlyConsumptionKwh) {
      const monthlyCons =
        (obj.monthlyConsumption as (string | number | null)[] | undefined) ??
        ((obj.consumption as Record<string, unknown> | undefined)?.monthly as (string | number | null)[] | undefined);
      if (Array.isArray(monthlyCons)) {
        data.consumption = {
          ...data.consumption,
          monthlyConsumptionKwh: normalizeMonthlyArray(monthlyCons),
        } as typeof data.consumption;
        console.log('[scraper] consumption.monthlyConsumptionKwh found:', monthlyCons.length, 'entries');
      }
    }

    // Rates
    if (!data.rates?.allInRate) {
      const rate =
        (obj.allInRate as string | number | undefined) ??
        (obj.electricityRate as string | number | undefined) ??
        ((obj.rates as Record<string, unknown> | undefined)?.allInRate as string | number | undefined);
      if (rate != null) {
        data.rates = { ...data.rates, allInRate: String(rate) } as typeof data.rates;
        console.log('[scraper] rates.allInRate found:', rate);
      }
    }

    // Financing
    if (!data.financing?.cashPurchasePrice) {
      const cashPrice =
        (obj.cashPrice as string | number | undefined) ??
        (obj.systemCost as string | number | undefined) ??
        ((obj.financing as Record<string, unknown> | undefined)?.cashPrice as string | number | undefined);
      if (cashPrice != null) {
        data.financing = {
          ...data.financing,
          cashPurchasePrice: String(cashPrice),
        } as typeof data.financing;
        console.log('[scraper] financing.cashPurchasePrice found:', cashPrice);
      }
    }

    if (!data.financing?.financeMonthlyPayment) {
      const monthlyPayment =
        (obj.monthlyPayment as string | number | undefined) ??
        ((obj.financing as Record<string, unknown> | undefined)?.monthlyPayment as string | number | undefined);
      if (monthlyPayment != null) {
        data.financing = {
          ...data.financing,
          financeMonthlyPayment: String(monthlyPayment),
        } as typeof data.financing;
        console.log('[scraper] financing.financeMonthlyPayment found:', monthlyPayment);
      }
    }
  }

  return buildResult(data, missingFields, 'API');
}

/**
 * Falls back to DOM extraction when no API payload is captured.
 * Uses flexible, resilient selectors since SunPitch's class names may be hashed.
 */
async function extractFromDOM(page: Page): Promise<ScrapeResult> {
  console.log('[scraper] extractFromDOM: falling back to DOM extraction');

  const data: Partial<ProposalFormValues> = {};
  const missingFields: string[] = [];

  // -- Customer name --
  try {
    const nameText = await page
      .locator('h1, h2, [class*="client"], [class*="customer"], [class*="name"]')
      .first()
      .textContent({ timeout: 5000 });
    if (nameText?.trim()) {
      data.customer = {
        name: nameText.trim(),
        address: '',
      };
      console.log('[scraper] DOM customer.name:', nameText.trim());
    } else {
      missingFields.push('customer.name');
    }
  } catch {
    missingFields.push('customer.name');
    console.log('[scraper] DOM customer.name: not found');
  }

  // -- Customer address --
  try {
    const addrText = await page
      .locator('[class*="address"], [class*="location"]')
      .first()
      .textContent({ timeout: 3000 });
    if (addrText?.trim()) {
      data.customer = {
        name: data.customer?.name ?? '',
        address: addrText.trim(),
      };
      console.log('[scraper] DOM customer.address:', addrText.trim());
    } else {
      missingFields.push('customer.address');
    }
  } catch {
    missingFields.push('customer.address');
    console.log('[scraper] DOM customer.address: not found');
  }

  // -- System size --
  try {
    const kwLocator = page.locator('text=/\\d+\\.?\\d*\\s*kW/i').first();
    const kwText = await kwLocator.textContent({ timeout: 5000 });
    if (kwText) {
      const kwVal = extractKwValue(kwText);
      if (kwVal) {
        data.system = {
          systemSizeKw: kwVal,
          annualProductionKwh: data.system?.annualProductionKwh ?? '',
          monthlyProductionKwh: data.system?.monthlyProductionKwh ?? normalizeMonthlyArray([]),
        };
        console.log('[scraper] DOM system.systemSizeKw:', kwVal);
      } else {
        missingFields.push('system.systemSizeKw');
      }
    } else {
      missingFields.push('system.systemSizeKw');
    }
  } catch {
    missingFields.push('system.systemSizeKw');
    console.log('[scraper] DOM system.systemSizeKw: not found');
  }

  // -- Monthly production --
  // Try to find a chart or table with 12 numeric values
  try {
    const monthlyTexts = await page
      .locator('[class*="month"], [class*="production"], td')
      .allTextContents();
    // Filter to entries that look like numbers (kWh values)
    const numericEntries = monthlyTexts
      .map((t) => t.replace(/,/g, '').trim())
      .filter((t) => /^\d+\.?\d*$/.test(t));
    if (numericEntries.length >= 12) {
      const monthly = normalizeMonthlyArray(numericEntries.slice(0, 12));
      data.system = {
        systemSizeKw: data.system?.systemSizeKw ?? '',
        annualProductionKwh: data.system?.annualProductionKwh ?? '',
        monthlyProductionKwh: monthly,
      };
      console.log('[scraper] DOM system.monthlyProductionKwh: found', numericEntries.length, 'entries');
    } else {
      missingFields.push('system.monthlyProductionKwh');
      console.log('[scraper] DOM system.monthlyProductionKwh: only found', numericEntries.length, 'numeric entries');
    }
  } catch {
    missingFields.push('system.monthlyProductionKwh');
    console.log('[scraper] DOM system.monthlyProductionKwh: not found');
  }

  // Mark remaining fields as missing if not yet populated
  if (!data.system?.annualProductionKwh) missingFields.push('system.annualProductionKwh');
  if (!data.consumption?.annualConsumptionKwh) missingFields.push('consumption.annualConsumptionKwh');
  if (!data.consumption?.monthlyConsumptionKwh) missingFields.push('consumption.monthlyConsumptionKwh');
  if (!data.rates?.allInRate) missingFields.push('rates.allInRate');
  if (!data.rates?.netMeteringBuyRate) missingFields.push('rates.netMeteringBuyRate');
  if (!data.rates?.netMeteringSellRate) missingFields.push('rates.netMeteringSellRate');
  if (!data.rates?.annualEscalationRate) missingFields.push('rates.annualEscalationRate');
  if (!data.financing?.cashPurchasePrice) missingFields.push('financing.cashPurchasePrice');
  if (!data.financing?.financeMonthlyPayment) missingFields.push('financing.financeMonthlyPayment');
  if (!data.financing?.financeTermMonths) missingFields.push('financing.financeTermMonths');
  if (!data.financing?.financeInterestRate) missingFields.push('financing.financeInterestRate');

  return buildResult(data, missingFields, 'DOM');
}

/**
 * Determines status based on extracted data and builds the final ScrapeResult.
 * Hard-error threshold: if customer name AND system size AND monthly production are ALL missing.
 */
function buildResult(
  data: Partial<ProposalFormValues>,
  extraMissingFields: string[],
  strategy: 'API' | 'DOM',
): ScrapeResult {
  const missingFields = [...new Set(extraMissingFields)];

  const hasName = !!data.customer?.name;
  const hasSystemSize = !!data.system?.systemSizeKw;
  const hasMonthlyProduction = Array.isArray(data.system?.monthlyProductionKwh) &&
    data.system.monthlyProductionKwh.some((v) => v !== '0');

  console.log('[scraper] buildResult via', strategy, '— hasName:', hasName, 'hasSystemSize:', hasSystemSize, 'hasMonthly:', hasMonthlyProduction);

  // Hard-error threshold: all three critical fields missing
  if (!hasName && !hasSystemSize && !hasMonthlyProduction) {
    return {
      status: 'error',
      data: null,
      missingFields,
      message:
        'Could not extract minimum required data (customer name, system size, and monthly production). The SunPitch proposal layout may have changed.',
    };
  }

  const allExpectedFields = [
    'customer.name',
    'customer.address',
    'system.systemSizeKw',
    'system.annualProductionKwh',
    'system.monthlyProductionKwh',
    'consumption.annualConsumptionKwh',
    'consumption.monthlyConsumptionKwh',
    'rates.allInRate',
    'rates.netMeteringBuyRate',
    'rates.netMeteringSellRate',
    'rates.annualEscalationRate',
    'financing.cashPurchasePrice',
    'financing.financeMonthlyPayment',
    'financing.financeTermMonths',
    'financing.financeInterestRate',
  ];

  // Note: annualElectricityCost is intentionally omitted — it is computed by watch() in the form
  const isPartial = missingFields.some((f) => allExpectedFields.includes(f));

  return {
    status: isPartial ? 'partial' : 'success',
    data,
    missingFields,
  };
}

/**
 * Scrapes a SunPitch proposal URL using a dual-strategy approach:
 * 1. Network interception — captures JSON API responses during page load (preferred)
 * 2. DOM fallback — extracts data from rendered elements if no API payload captured
 */
export async function scrapeSunPitch(browser: Browser, url: string): Promise<ScrapeResult> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const capturedApiPayloads: CapturedPayload[] = [];

  // Set up response listener BEFORE goto — capture any JSON API responses
  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? '';
    if (!ct.includes('application/json')) return;
    if (!response.ok()) return;

    try {
      const json: unknown = await response.json();
      if (looksLikeProposalData(json)) {
        capturedApiPayloads.push({ url: response.url(), data: json });
        console.log('[scraper] captured API response from:', response.url());
      }
    } catch {
      // Body already consumed by another handler, or response was not valid JSON
    }
  });

  try {
    console.log('[scraper] navigating to:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Check for auth redirect — if the URL no longer contains /facing/proposals/, we were redirected
    const currentUrl = page.url();
    if (!currentUrl.includes('/facing/proposals/')) {
      console.log('[scraper] redirected away from proposal URL, current URL:', currentUrl);
      return {
        status: 'error',
        data: null,
        missingFields: [],
        message:
          'SunPitch redirected to login or an unexpected page. The proposal URL may require authentication.',
      };
    }

    // Soft wait for proposal content — continue even if nothing found
    await page
      .waitForSelector('[data-testid], [data-proposal], main, .proposal, article', {
        timeout: 15000,
      })
      .catch(() => {
        console.log('[scraper] waitForSelector timed out — continuing with what was captured');
      });

    // Give any async data loads a moment to complete after DOM is ready
    await page.waitForTimeout(2000);

    console.log('[scraper] captured', capturedApiPayloads.length, 'API payload(s)');

    if (capturedApiPayloads.length > 0) {
      return extractFromApiResponse(capturedApiPayloads);
    }

    return await extractFromDOM(page);
  } finally {
    await context.close();
  }
}
