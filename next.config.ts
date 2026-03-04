import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Include @sparticuz/chromium binary files in the Vercel deployment bundle.
  // Next.js file tracing only follows JS imports — it cannot detect .br binaries.
  // Without this, executablePath() throws "input directory does not exist" on Vercel → 500.
  outputFileTracingIncludes: {
    '/api/scrape': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
