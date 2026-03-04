import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Include @sparticuz/chromium binary files in the Vercel deployment bundle.
  // Next.js file tracing only follows JS imports — it cannot detect .br binaries.
  // Without this, executablePath() throws "input directory does not exist" on Vercel → 500.
  outputFileTracingIncludes: {
    '/api/scrape': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },

  // Redirect bare /proposal to /enter (no `d` query param).
  // /proposal?d=<base64> must still reach the proposal renderer — the `missing` guard
  // ensures this redirect only fires when the `d` param is absent.
  async redirects() {
    return [
      {
        source: '/proposal',
        destination: '/enter',
        permanent: false, // 307 — safer while testing; upgrade to true once stable
        missing: [{ type: 'query', key: 'd' }],
      },
    ];
  },
};

export default nextConfig;
