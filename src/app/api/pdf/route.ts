import { NextRequest } from 'next/server';
import { chromium } from 'playwright-core';
import chromiumPkg from '@sparticuz/chromium';

// REQUIRED: Playwright cannot run in Edge runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const d = request.nextUrl.searchParams.get('d');
  if (!d) {
    return new Response('Missing d parameter', { status: 400 });
  }

  // Derive base URL from env var first, then request headers
  const host = request.headers.get('host') ?? 'localhost:3001';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

  const executablePath = process.env.VERCEL
    ? await chromiumPkg.executablePath()
    : undefined;

  const browser = await chromium.launch({
    headless: true,
    args: process.env.VERCEL
      ? chromiumPkg.args
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set viewport to 1920×1080 — matches the 16:9 aspect ratio the proposal pages are designed for
    await page.setViewportSize({ width: 1920, height: 1080 });

    // CRITICAL: emulateMedia before goto — applies screen CSS throughout load
    // Without this, page.pdf() uses @media print which strips all backgrounds
    await page.emulateMedia({ media: 'screen' });

    await page.goto(
      `${baseUrl}/proposal/pdf?d=${encodeURIComponent(d)}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );

    // Safety buffer: allow chart JS (ssr:false dynamic imports) and deferred renders to settle
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      // Custom 16:9 page size matching 1920×1080 viewport — no format preset, explicit px dimensions
      width: '1920px',
      height: '1080px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    // Convert Buffer to Uint8Array for BodyInit compatibility
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proposal.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}
