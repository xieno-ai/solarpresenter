import type { Browser } from 'playwright-core';
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
 * Alberta average residential consumption distribution by month (Jan–Dec).
 * Winter-heavy profile reflecting cold climate and shorter daylight hours.
 * Fractions sum to exactly 1.0.
 */
const ALBERTA_MONTHLY_FRACTIONS = [0.10, 0.09, 0.085, 0.08, 0.07, 0.075, 0.08, 0.08, 0.075, 0.08, 0.085, 0.10];

/**
 * Distribute an annual kWh total across 12 months using the Alberta consumption curve.
 */
function distributeByAlbertaCurve(annualKwh: number): string[] {
  return ALBERTA_MONTHLY_FRACTIONS.map((f) => String(Math.round(annualKwh * f)));
}

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
    /** JSON string: {"production": [[zone1_kWh/panel/month×12], [zone2_kWh/panel/month×12], ...]} */
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
 *                                     (kWh/panel/month × AllZones[i].TotalSolarPanel)
 *   system.annualProductionKwh       ← sum of monthlyProductionKwh
 *   system.systemSizeKw              ← editor.TotalSolarPanel × equipment.panel.valueWh / 1000
 *   financing.cashPurchasePrice      ← sum of selected adders (PerWatt × system_watts + Fixed × qty)
 *   financing.financeMonthlyPayment  ← DOM scrape or finance sub-API (not in main proposals API)
 *   financing.financeTermMonths      ← DOM scrape or finance sub-API (not in main proposals API)
 */
function parseApiResponse(
  raw: SunPitchProposalApiResponse,
  domMonthlyPayment?: string | null,
  domTermMonths?: string | null,
): ScrapeResult {
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
        const annualNum = Number(info.avgYearlyUsage);
        const monthly = distributeByAlbertaCurve(annualNum);
        data.consumption = {
          ...(data.consumption ?? {}),
          annualConsumptionKwh: String(annualNum),
          monthlyConsumptionKwh: monthly,
          annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
        } as typeof data.consumption;
        console.log('[scraper] consumption (AvgYearlyUsage + Alberta curve):', annualNum, 'kWh →', monthly);
        missingFields.push('consumption.monthlyConsumptionKwh'); // estimated, not from SunPitch
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
          const annualNum = Number(yearlyVal);
          const monthly = distributeByAlbertaCurve(annualNum);
          data.consumption = {
            ...(data.consumption ?? {}),
            annualConsumptionKwh: String(annualNum),
            monthlyConsumptionKwh: monthly,
            annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
          } as typeof data.consumption;
          console.log('[scraper] consumption (generic key + Alberta curve):', annualNum, 'kWh →', monthly);
          missingFields.push('consumption.monthlyConsumptionKwh'); // estimated, not from SunPitch
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
  // projections.production: array of zones, each zone = array of 12 kWh/panel/month values.
  // Each zone must be multiplied by its panel count (from editor.AllZones[i].TotalSolarPanel).
  // Zones with 0 panels contribute 0 kWh (multiplied out implicitly).
  if (raw.config?.projections) {
    try {
      const proj = JSON.parse(raw.config.projections) as {
        production?: number[][];
      };

      if (Array.isArray(proj.production) && proj.production.length > 0) {
        // Parse editor to get per-zone panel counts (AllZones array)
        const editorForProd = raw.config?.editor
          ? (JSON.parse(raw.config.editor) as {
              TotalSolarPanel?: number;
              AllZones?: { Name?: string; TotalSolarPanel?: number }[];
            })
          : null;

        // Build per-zone panel counts aligned with production array index.
        // Falls back to TotalSolarPanel on the root editor object if AllZones is absent
        // and there is only one zone.
        const zonePanels: number[] = proj.production.map((_, zoneIdx) => {
          if (editorForProd?.AllZones && editorForProd.AllZones[zoneIdx] !== undefined) {
            return Number(editorForProd.AllZones[zoneIdx].TotalSolarPanel) || 0;
          }
          // Fallback: single-zone proposal with no AllZones array
          if (proj.production!.length === 1) {
            return Number(editorForProd?.TotalSolarPanel) || 0;
          }
          return 0;
        });
        console.log('[scraper] zone panel counts:', zonePanels);

        // Sum: for each month, sum(zone[month] × panelCount[zone])
        // Unit of production[zone][month] is kWh/panel/month — NOT kWh/day.
        const monthlyKwh = Array.from({ length: 12 }, (_, month) =>
          Math.round(
            proj.production!.reduce((sum, zone, zoneIdx) =>
              sum + (Number(zone[month]) || 0) * zonePanels[zoneIdx], 0
            )
          )
        );
        const annualKwh = monthlyKwh.reduce((sum, v) => sum + v, 0);

        data.system = {
          ...(data.system ?? {}),
          monthlyProductionKwh: monthlyKwh.map(String),
          annualProductionKwh: String(annualKwh),
          systemSizeKw: data.system?.systemSizeKw ?? '',
        } as typeof data.system;
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

  // Financing details (financeMonthlyPayment, financeTermMonths) are not in the public proposal
  // API — they come from DOM scraping or a finance sub-API intercepted at page load time.
  if (domMonthlyPayment != null) {
    data.financing = {
      ...(data.financing ?? {}),
      financeMonthlyPayment: domMonthlyPayment,
    } as typeof data.financing;
    console.log('[scraper] financing.financeMonthlyPayment (DOM/API):', domMonthlyPayment);
  } else {
    missingFields.push('financing.financeMonthlyPayment');
    console.log('[scraper] financing.financeMonthlyPayment: not found — added to missingFields');
  }

  if (domTermMonths != null) {
    data.financing = {
      ...(data.financing ?? {}),
      financeTermMonths: domTermMonths,
    } as typeof data.financing;
    console.log('[scraper] financing.financeTermMonths (DOM/API):', domTermMonths);
  } else {
    missingFields.push('financing.financeTermMonths');
    console.log('[scraper] financing.financeTermMonths: not found — added to missingFields');
  }

  // Interest rate default — always 0%
  data.financing = {
    ...(data.financing ?? {}),
    financeInterestRate: '0',
  } as typeof data.financing;
  console.log('[scraper] financing.financeInterestRate: 0 (default)');

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
 * WHY THE TIMEOUT IS 240s:
 * SunPitch's API can take anywhere from 10–240 seconds to respond after the page loads,
 * depending on server load. The original scraper only waited 2 seconds after domcontentloaded.
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
  let capturedFinanceData: { monthlyPayment?: number; termMonths?: number } | null = null as { monthlyPayment?: number; termMonths?: number } | null;

  // Set up sub-route interceptor BEFORE goto — captures any finance sub-API endpoints.
  // Pattern: **/api/proposals/{uuid}/** (with trailing slash) matches sub-routes only.
  await page.route(`**/api/proposals/${uuid}/**`, async (route) => {
    const reqUrl = route.request().url();
    console.log('[scraper] sub-route intercepted:', reqUrl);
    try {
      const response = await route.fetch({ timeout: 60000 });
      if (response.status() === 200) {
        const body = await response.body();
        const text = body.toString('utf8');
        if (text.length > 0 && text.trimStart().startsWith('{')) {
          try {
            const json = JSON.parse(text) as Record<string, unknown>;
            console.log('[scraper] sub-route JSON keys:', Object.keys(json).join(', '));
            // Look for finance-shaped keys: monthlyPayment, loanAmount, termMonths, months, payment
            const payment = json.monthlyPayment ?? json.payment ?? json.monthly_payment;
            const term = json.termMonths ?? json.term_months ?? json.months ?? json.loanTermMonths;
            if (payment != null || term != null) {
              capturedFinanceData = {
                monthlyPayment: payment != null ? Number(payment) : undefined,
                termMonths: term != null ? Number(term) : undefined,
              };
              console.log('[scraper] finance API data captured:', capturedFinanceData);
            }
          } catch { /* not JSON — skip */ }
        }
      }
      await route.fulfill({ response });
    } catch (e) {
      console.log('[scraper] sub-route error:', e instanceof Error ? e.message : String(e));
      await route.continue();
    }
  });

  // Set up route interception BEFORE goto — reliably buffers the full response body.
  // NOTE: This exact-UUID pattern (**/api/proposals/{uuid}) matches only the main proposals endpoint,
  // not sub-routes (which are handled by the interceptor above).
  await page.route(`**/api/proposals/${uuid}`, async (route) => {
    try {
      // SunPitch API can take up to 240 seconds to respond — increase route.fetch timeout
      const response = await route.fetch({ timeout: 240000 });
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
    // SunPitch API takes 10–240 seconds to respond after page load (depending on server load).
    // route.fetch timeout is set to 240s; poll for up to 235s to give it time.
    const TIMEOUT_MS = 235000;
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
      // DOM scrape for finance values — only attempt if the main API responded (page is loaded)
      let scrapedMonthlyPayment: string | null = null;
      let scrapedTermMonths: string | null = null;

      try {
        // Wait briefly for Angular to finish rendering finance sections
        await page.waitForSelector('[class*="finance"], [class*="payment"], [class*="monthly"]', { timeout: 10000 }).catch(() => null);

        const financeText = await page.evaluate(() => document.body.innerText).catch(() => '');

        // Match patterns like "$220/mo", "$220/month", "$220 /month", "$1,200/mo"
        const paymentMatch = financeText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*mo(?:nth)?/i);
        if (paymentMatch) {
          scrapedMonthlyPayment = paymentMatch[1].replace(/,/g, '');
          console.log('[scraper] DOM finance scan — raw payment match:', paymentMatch[0], '→', scrapedMonthlyPayment);
        }

        // Match patterns like "MONTHS 1-60", "60 months", "60-month"
        const termMatch =
          financeText.match(/MONTHS\s+1[-\u2013](\d+)/i) ||
          financeText.match(/(\d+)[- ]months?/i);
        if (termMatch) {
          scrapedTermMonths = termMatch[1];
          console.log('[scraper] DOM finance scan — raw term match:', termMatch[0], '→', scrapedTermMonths);
        }

        console.log('[scraper] DOM finance scan — payment:', scrapedMonthlyPayment, '| term:', scrapedTermMonths);
      } catch (e) {
        console.log('[scraper] DOM finance scan error:', e instanceof Error ? e.message : String(e));
      }

      // Prefer API-intercepted finance values (capturedFinanceData) over DOM-scraped values
      const finalMonthlyPayment = capturedFinanceData?.monthlyPayment != null
        ? String(Math.round(capturedFinanceData.monthlyPayment))
        : scrapedMonthlyPayment;
      const finalTermMonths = capturedFinanceData?.termMonths != null
        ? String(capturedFinanceData.termMonths)
        : scrapedTermMonths;

      console.log('[scraper] final finance values — monthlyPayment:', finalMonthlyPayment, '| termMonths:', finalTermMonths);

      return parseApiResponse(capturedData, finalMonthlyPayment, finalTermMonths);
    }

    // API never responded within timeout
    return {
      status: 'error',
      data: null,
      missingFields: [],
      message:
        'SunPitch API did not respond within 240 seconds. Check server logs for [scraper] entries.',
    };
  } finally {
    await context.close();
  }
}
