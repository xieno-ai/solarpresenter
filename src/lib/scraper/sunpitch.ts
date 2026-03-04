import type { Browser } from 'playwright';
import type { ScrapeResult } from './types';
import type { ProposalFormValues } from '@/lib/form/schema';

/**
 * Normalizes a raw array to exactly 12 string entries.
 * Pads with '0' if fewer than 12; trims to 12 if more.
 */
function normalizeMonthlyArray(raw: (string | number | null | undefined)[]): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = raw[i];
    if (v == null || v === '') return '0';
    return String(Math.round(Number(v)));
  });
}

/**
 * Days per calendar month (non-leap year).
 * Used to convert kWh/day production values to kWh/month.
 */
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * The real SunPitch API response shape for /api/proposals/{uuid}.
 * Derived from live DOM inspection on 2026-03-03.
 */
interface SunPitchProposalApiResponse {
  id?: number;
  uid?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    address?: {
      address?: string;
      city?: string;
      state?: string;
    };
  };
  address?: {
    address?: string;
    city?: string;
    state?: string;
  };
  utility?: {
    /** $/kWh — the effective rate the customer pays per kWh. Form allInRate range is 0.01–2.0 $/kWh. */
    rate?: number;
    /** $/kWh — sell/credit rate for net metering. Often 0 for Alberta. */
    creditPerKwh?: number;
    connectionRate?: number;
    /** JSON string, e.g. {"avgYearlyUsage":"7650"} or {"monthlyUsage":[...]} */
    infoData?: string;
    /** "AvgYearlyUsage" | "MonthlyUsage" | etc. */
    infoType?: string;
    companyName?: string;
  };
  config?: {
    /** JSON string: {"production": [[zone1_kWh/day×12], [zone2_kWh/day×12], ...]} */
    projections?: string;
    /** JSON string: {manufacturer, panel: {valueWh, equipmentName}, inverter: {...}} */
    equipment?: string;
    /** JSON string with TotalSolarPanel count used to compute system size */
    editor?: string;
    /** JSON string: array of adder objects with priceType/price_ab/selected/qty */
    adders?: string;
    systemLoss?: string;
  };
}

/**
 * Parses the SunPitch /api/proposals/{uuid} JSON response into ProposalFormValues.
 *
 * Field mapping (from live API inspection, 2026-03-03):
 *   customer.name                    ← `${customer.firstName} ${customer.lastName}`
 *   customer.address                 ← address.address (full string)
 *   consumption.annualConsumptionKwh ← utility.infoData.avgYearlyUsage (AvgYearlyUsage)
 *                                   OR sum of utility.infoData.monthlyUsage (MonthlyUsage)
 *   consumption.monthlyConsumptionKwh← utility.infoData.monthlyUsage (MonthlyUsage only)
 *   rates.allInRate                  ← utility.rate ($/kWh)
 *   rates.netMeteringBuyRate         ← utility.rate (same — Alberta flat-rate net metering)
 *   rates.netMeteringSellRate        ← utility.creditPerKwh (if > 0)
 *   system.monthlyProductionKwh      ← sum of all zones in config.projections.production
 *                                     (kWh/day × days_per_month)
 *   system.annualProductionKwh       ← sum of monthlyProductionKwh
 *   system.systemSizeKw              ← editor.TotalSolarPanel × equipment.panel.valueWh / 1000
 *   financing.cashPurchasePrice      ← sum of selected adders (PerWatt × system_watts + Fixed × qty)
 */
function parseApiResponse(raw: SunPitchProposalApiResponse): ScrapeResult {
  console.log('[scraper] parseApiResponse: mapping SunPitch API fields');

  const data: Partial<ProposalFormValues> = {};
  const missingFields: string[] = [];

  // --- Customer name ---
  const firstName = raw.customer?.firstName?.trim() ?? '';
  const lastName = raw.customer?.lastName?.trim() ?? '';
  if (firstName || lastName) {
    data.customer = {
      name: `${firstName} ${lastName}`.trim(),
      address: '',
    };
    console.log('[scraper] customer.name:', data.customer.name);
  } else {
    missingFields.push('customer.name');
  }

  // --- Customer address ---
  // Prefer top-level address (has lat/lng), fall back to customer.address
  const addrStr =
    raw.address?.address?.trim() ||
    raw.customer?.address?.address?.trim() ||
    '';
  if (addrStr) {
    data.customer = {
      name: data.customer?.name ?? '',
      address: addrStr,
    };
    console.log('[scraper] customer.address:', addrStr);
  } else {
    missingFields.push('customer.address');
  }

  // --- Utility rate → allInRate ---
  // utility.rate is in $/kWh; form allInRate range is 0.01–2.0 ($/kWh)
  const utilityRate = raw.utility?.rate;
  if (utilityRate != null && utilityRate > 0) {
    const rateStr = String(Math.round(utilityRate * 10000) / 10000); // up to 4 decimal places
    data.rates = {
      ...(data.rates ?? {}),
      allInRate: rateStr,
    } as typeof data.rates;
    console.log('[scraper] rates.allInRate:', rateStr);
  } else {
    missingFields.push('rates.allInRate');
  }

  // Alberta regulatory constants — always pre-fill with known values
  data.rates = {
    ...(data.rates ?? {}),
    netMeteringBuyRate: '0.084',    // 8.40¢/kWh grid buy rate
    netMeteringSellRate: '0.335',   // 33.50¢/kWh net metering sell rate
  } as typeof data.rates;
  console.log('[scraper] rates.netMeteringBuyRate: 0.084, netMeteringSellRate: 0.335 (Alberta defaults)');

  // --- Annual/monthly consumption from utility.infoData ---
  if (raw.utility?.infoData) {
    try {
      const info = JSON.parse(raw.utility.infoData) as Record<string, unknown>;
      const infoType = raw.utility.infoType ?? '';
      console.log('[scraper] utility.infoType:', infoType, '| infoData keys:', Object.keys(info).join(', '));

      if (infoType === 'AvgYearlyUsage' && info.avgYearlyUsage) {
        // Annual only — monthly not available from this info type
        const annual = String(info.avgYearlyUsage);
        data.consumption = {
          ...(data.consumption ?? {}),
          annualConsumptionKwh: annual,
          monthlyConsumptionKwh: data.consumption?.monthlyConsumptionKwh ?? normalizeMonthlyArray([]),
          annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
        } as typeof data.consumption;
        console.log('[scraper] consumption.annualConsumptionKwh (AvgYearlyUsage):', annual);
        // Monthly not available from this info type
        missingFields.push('consumption.monthlyConsumptionKwh');
      } else if (infoType === 'MonthlyUsage' && Array.isArray(info.monthlyUsage)) {
        const monthly = info.monthlyUsage as (string | number)[];
        const normalized = normalizeMonthlyArray(monthly);
        const annual = normalized.reduce((sum, v) => sum + Number(v), 0);
        data.consumption = {
          ...(data.consumption ?? {}),
          annualConsumptionKwh: String(annual),
          monthlyConsumptionKwh: normalized,
          annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
        } as typeof data.consumption;
        console.log('[scraper] consumption from MonthlyUsage:', normalized);
      } else {
        // Try generic keys in infoData
        const yearlyVal = (info.annualUsage ?? info.yearlyUsage ?? info.avgYearlyUsage) as string | number | undefined;
        if (yearlyVal != null) {
          data.consumption = {
            ...(data.consumption ?? {}),
            annualConsumptionKwh: String(yearlyVal),
            monthlyConsumptionKwh: data.consumption?.monthlyConsumptionKwh ?? normalizeMonthlyArray([]),
            annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
          } as typeof data.consumption;
          console.log('[scraper] consumption.annualConsumptionKwh (generic key):', yearlyVal);
          missingFields.push('consumption.monthlyConsumptionKwh');
        } else {
          missingFields.push('consumption.annualConsumptionKwh');
          missingFields.push('consumption.monthlyConsumptionKwh');
          console.log('[scraper] infoData has no recognized consumption keys');
        }
      }
    } catch (e) {
      console.log('[scraper] infoData parse error:', e);
      missingFields.push('consumption.annualConsumptionKwh');
      missingFields.push('consumption.monthlyConsumptionKwh');
    }
  } else {
    missingFields.push('consumption.annualConsumptionKwh');
    missingFields.push('consumption.monthlyConsumptionKwh');
  }

  // --- Monthly production from config.projections ---
  // projections.production: array of zones, each zone = array of 12 kWh/day values.
  // Sum all zones → multiply by days_per_month → kWh/month.
  if (raw.config?.projections) {
    try {
      const proj = JSON.parse(raw.config.projections) as {
        production?: number[][];
      };

      if (Array.isArray(proj.production) && proj.production.length > 0) {
        // Sum all zone kWh/day for each month index
        const monthlyKwhPerDay = proj.production.reduce<number[]>((acc, zone) => {
          return zone.map((v, i) => (acc[i] ?? 0) + (Number(v) || 0));
        }, new Array(12).fill(0) as number[]);

        // Convert kWh/day × actual_days_in_month → kWh/month
        const monthlyKwh = monthlyKwhPerDay.map((v, i) => Math.round(v * DAYS_PER_MONTH[i]));
        const annualKwh = monthlyKwh.reduce((sum, v) => sum + v, 0);

        data.system = {
          ...(data.system ?? {}),
          monthlyProductionKwh: monthlyKwh.map(String),
          annualProductionKwh: String(annualKwh),
          systemSizeKw: data.system?.systemSizeKw ?? '',
        } as typeof data.system;
        console.log('[scraper] system.monthlyProductionKwh from', proj.production.length, 'zone(s)');
        console.log('[scraper] system.annualProductionKwh:', annualKwh);
      } else {
        missingFields.push('system.monthlyProductionKwh');
        missingFields.push('system.annualProductionKwh');
        console.log('[scraper] projections.production missing or empty');
      }
    } catch (e) {
      console.log('[scraper] projections parse error:', e);
      missingFields.push('system.monthlyProductionKwh');
      missingFields.push('system.annualProductionKwh');
    }
  } else {
    missingFields.push('system.monthlyProductionKwh');
    missingFields.push('system.annualProductionKwh');
  }

  // --- System size from config.editor.TotalSolarPanel × config.equipment.panel.valueWh ---
  let systemSizeKw: string | null = null;
  try {
    if (raw.config?.editor && raw.config?.equipment) {
      const editor = JSON.parse(raw.config.editor) as { TotalSolarPanel?: number };
      const equip = JSON.parse(raw.config.equipment) as {
        panel?: { valueWh?: number; equipmentName?: string };
      };
      const panelCount = editor.TotalSolarPanel;
      const panelWh = equip.panel?.valueWh;
      if (panelCount && panelWh && panelCount > 0 && panelWh > 0) {
        // Round to 1 decimal place (e.g., 13 × 445 = 5785W → 5.8 kW)
        const kw = Math.round((panelCount * panelWh) / 100) / 10;
        systemSizeKw = String(kw);
        console.log('[scraper] system.systemSizeKw:', panelCount, 'panels ×', panelWh, 'W =', kw, 'kW');
      }
    }
  } catch (e) {
    console.log('[scraper] editor/equipment parse error:', e);
  }

  if (systemSizeKw) {
    data.system = {
      ...(data.system ?? {}),
      systemSizeKw,
    } as typeof data.system;
  } else {
    missingFields.push('system.systemSizeKw');
    console.log('[scraper] system.systemSizeKw: could not compute from editor/equipment');
  }

  // --- System cost from config.adders ---
  // Sum selected adders: PerWatt × system_watts + Fixed × qty
  try {
    if (raw.config?.adders && data.system?.systemSizeKw) {
      const adders = JSON.parse(raw.config.adders) as Array<{
        adderName?: string;
        selected?: boolean;
        qty?: number;
        priceType?: string; // "PerWatt" | "Fixed"
        price_ab?: number;
        price_default?: number | string;
      }>;

      const systemWatts = Number(data.system.systemSizeKw) * 1000;
      let totalCost = 0;

      for (const adder of adders) {
        if (!adder.selected || (adder.qty ?? 0) === 0) continue;
        // Prefer Alberta price (price_ab), fall back to price_default
        const priceRaw = adder.price_ab ?? adder.price_default;
        const price = Number(priceRaw);
        if (isNaN(price) || price <= 0) continue;

        if (adder.priceType === 'PerWatt') {
          totalCost += price * systemWatts;
          console.log('[scraper] adder', adder.adderName, ':', price, '$/W ×', systemWatts, 'W =', price * systemWatts);
        } else if (adder.priceType === 'Fixed') {
          totalCost += price * (adder.qty ?? 1);
          console.log('[scraper] adder', adder.adderName, ': Fixed', price, '×', adder.qty ?? 1);
        }
      }

      if (totalCost > 0) {
        data.financing = {
          ...(data.financing ?? {}),
          cashPurchasePrice: String(Math.round(totalCost)),
        } as typeof data.financing;
        console.log('[scraper] financing.cashPurchasePrice:', Math.round(totalCost));
      } else {
        missingFields.push('financing.cashPurchasePrice');
        console.log('[scraper] financing.cashPurchasePrice: no cost from adders');
      }
    } else {
      missingFields.push('financing.cashPurchasePrice');
    }
  } catch (e) {
    console.log('[scraper] adders parse error:', e);
    missingFields.push('financing.cashPurchasePrice');
  }

  // Financing details are not in the public proposal API
  missingFields.push('financing.financeMonthlyPayment');
  missingFields.push('financing.financeTermMonths');
  missingFields.push('financing.financeInterestRate');

  // Alberta regulatory defaults — always pre-fill with known constants
  data.rates = {
    ...(data.rates ?? {}),
    annualEscalationRate: '0.05',   // 5% annual utility escalation
  } as typeof data.rates;
  console.log('[scraper] rates.annualEscalationRate: 0.05 (Alberta default)');

  return buildResult(data, missingFields);
}

/**
 * Determines status based on extracted data and builds the final ScrapeResult.
 * Hard-error threshold: all three critical fields (name, system size, monthly production) missing.
 */
function buildResult(
  data: Partial<ProposalFormValues>,
  extraMissingFields: string[],
): ScrapeResult {
  const missingFields = [...new Set(extraMissingFields)];

  const hasName = !!data.customer?.name;
  const hasSystemSize = !!data.system?.systemSizeKw;
  const hasMonthlyProduction =
    Array.isArray(data.system?.monthlyProductionKwh) &&
    data.system.monthlyProductionKwh.some((v) => v !== '0');

  console.log(
    '[scraper] buildResult — hasName:',
    hasName,
    '| hasSystemSize:',
    hasSystemSize,
    '| hasMonthly:',
    hasMonthlyProduction,
  );

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

  // annualElectricityCost is intentionally excluded — computed by watch() in the form, never scraped
  const isPartial = missingFields.some((f) => allExpectedFields.includes(f));

  return {
    status: isPartial ? 'partial' : 'success',
    data,
    missingFields,
  };
}

/**
 * Scrapes a SunPitch proposal URL using Playwright browser with route interception.
 *
 * WHY BROWSER ONLY:
 * The SunPitch /api/proposals/{uuid} endpoint requires the Angular app's session context.
 * Direct server-side fetch hangs indefinitely (connection hangs, no response).
 * The endpoint responds normally when called FROM the browser that loaded the proposal page.
 *
 * WHY ROUTE INTERCEPTION (not page.on('response')):
 * page.on('response') + response.body() does not reliably capture XHR bodies from Angular apps —
 * the body reference is consumed before Playwright's listener can read it.
 * page.route() interception buffers the full response body reliably.
 *
 * WHY THE TIMEOUT IS 40s:
 * SunPitch's API takes 10–16 seconds to respond after the page loads. The original scraper
 * only waited 2 seconds after domcontentloaded, which is why it captured nothing.
 *
 * Diagnosed 2026-03-03 using real URL: https://app.sunpitch.com/facing/proposals/db9b7ee9-...
 */
export async function scrapeSunPitch(browser: Browser, url: string): Promise<ScrapeResult> {
  console.log('[scraper] scrapeSunPitch: url =', url);

  const uuidMatch = url.match(/\/facing\/proposals\/([0-9a-f-]{36})/i);
  if (!uuidMatch) {
    return {
      status: 'error',
      data: null,
      missingFields: [],
      message:
        'URL does not match expected SunPitch format: https://app.sunpitch.com/facing/proposals/{uuid}',
    };
  }
  const uuid = uuidMatch[1];

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let capturedData: SunPitchProposalApiResponse | null = null;
  let captureError: string | null = null;

  // Set up route interception BEFORE goto — reliably buffers the full response body
  await page.route(`**/api/proposals/${uuid}**`, async (route) => {
    try {
      // SunPitch API can take up to 60 seconds to respond — increase route.fetch timeout
      const response = await route.fetch({ timeout: 60000 });
      const body = await response.body();
      const text = body.toString('utf8');
      console.log('[scraper] route intercepted /api/proposals — status:', response.status(), '| bytes:', text.length);

      if (response.status() === 401 || response.status() === 403) {
        captureError = `SunPitch API returned ${response.status()} — proposal may require authentication`;
        console.log('[scraper] auth error:', response.status());
        await route.fulfill({ response });
        return;
      }

      if (response.status() === 200 && text.length > 0) {
        try {
          capturedData = JSON.parse(text) as SunPitchProposalApiResponse;
          console.log('[scraper] API response parsed — top-level keys:', Object.keys(capturedData).join(', '));
        } catch (e) {
          captureError = `JSON parse error: ${e instanceof Error ? e.message : String(e)}`;
          console.log('[scraper] JSON parse error:', captureError);
        }
      }
      await route.fulfill({ response });
    } catch (e) {
      console.log('[scraper] route handler error:', e instanceof Error ? e.message : String(e));
      await route.continue();
    }
  });

  try {
    console.log('[scraper] navigating to:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Check for auth redirect — if not on the proposal page, we were sent to login
    const currentUrl = page.url();
    if (!currentUrl.includes('/facing/proposals/')) {
      return {
        status: 'error',
        data: null,
        missingFields: [],
        message:
          'SunPitch redirected away from the proposal page. The URL may require authentication.',
      };
    }

    // Poll for the route interceptor to fire.
    // SunPitch API takes 10–60 seconds to respond after page load (depending on server load).
    // route.fetch timeout is set to 60s; poll for up to 55s to give it time.
    const TIMEOUT_MS = 55000;
    const POLL_INTERVAL_MS = 500;
    let waited = 0;

    while (capturedData === null && captureError === null && waited < TIMEOUT_MS) {
      await page.waitForTimeout(POLL_INTERVAL_MS);
      waited += POLL_INTERVAL_MS;
    }

    console.log('[scraper] waited', waited, 'ms for API — capturedData:', capturedData !== null, '| error:', captureError);

    if (captureError) {
      return {
        status: 'error',
        data: null,
        missingFields: [],
        message: captureError,
      };
    }

    if (capturedData !== null) {
      return parseApiResponse(capturedData);
    }

    // API never responded within timeout
    return {
      status: 'error',
      data: null,
      missingFields: [],
      message:
        'SunPitch API did not respond within 40 seconds. Check server logs for [scraper] entries.',
    };
  } finally {
    await context.close();
  }
}
