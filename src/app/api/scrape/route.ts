import { NextRequest } from 'next/server';
import { chromium } from 'playwright';
import { scrapeSunPitch } from '@/lib/scraper/sunpitch';
import type { ScrapeResult } from '@/lib/scraper/types';

// REQUIRED: Playwright cannot run in Edge runtime
export const runtime = 'nodejs';
// Allow up to 240 seconds for SunPitch's slow API
export const maxDuration = 240;

export async function POST(request: NextRequest): Promise<Response> {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { status: 'error', message: 'Invalid JSON body', data: null, missingFields: [] },
      { status: 400 },
    );
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return Response.json(
      { status: 'error', message: 'Missing url', data: null, missingFields: [] },
      { status: 400 },
    );
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const result: ScrapeResult = await scrapeSunPitch(browser, url);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown scrape error';
    const errorResult: ScrapeResult = { status: 'error', data: null, missingFields: [], message };
    return Response.json(errorResult, { status: 200 }); // 200 — client reads status field, not HTTP code
  } finally {
    await browser.close();
  }
}
