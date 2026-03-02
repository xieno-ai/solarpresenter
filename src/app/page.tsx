import { paulFriesenInputs } from '@/test-data/paul-friesen';
import { d, toFixed, Decimal } from '@/lib/decimal';
import { getAlbertaConfig } from '@/lib/config/alberta';
import type { AlbertaConfig } from '@/lib/types';

/** Safe wrapper for fetching Alberta config -- returns null if Supabase is not connected */
async function fetchConfig(): Promise<{ config: AlbertaConfig | null; error: string | null }> {
  // Check if env vars are set before attempting connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      config: null,
      error: 'Supabase environment variables not set. Copy .env.local.example to .env.local and add your Supabase project URL and anon key.',
    };
  }

  try {
    const config = await getAlbertaConfig();
    return { config, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { config: null, error: message };
  }
}

export default async function Home() {
  const inputs = paulFriesenInputs;
  const { config, error: configError } = await fetchConfig();

  // Decimal.js precision proof values
  const decimalResult = d('0.1').plus('0.2');
  const nativeResult = 0.1 + 0.2;
  const roundingDemo = d('1.005').toFixed(2);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight">Solar Presenter</h1>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/enter"
              className="font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] uppercase text-amber-400 hover:text-amber-300 transition-colors"
            >
              Manual Entry →
            </a>
            <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.15em] uppercase text-neutral-500">
              Phase 1 Smoke Test
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ---- Section 1: Paul Friesen Test Fixture ---- */}
        <section>
          <SectionLabel>Test Fixture</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight mt-1 mb-6">Paul Friesen Reference Case</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer & System */}
            <Card title="Customer & System">
              <DataRow label="Name" value={inputs.customer.name} />
              <DataRow label="Address" value={inputs.customer.address} />
              <DataRow label="Coordinates" value={`${inputs.customer.latitude}, ${inputs.customer.longitude}`} />
              <Divider />
              <DataRow label="System Size" value={`${toFixed(inputs.system.systemSizeKw, 2)} kW`} />
              <DataRow label="Annual Production" value={`${toFixed(inputs.system.annualProductionKwh, 0)} kWh`} />
            </Card>

            {/* Rates */}
            <Card title="Rates">
              <DataRow label="All-In Rate" value={`${toFixed(inputs.rates.allInRate.times(100), 2)}\u00A2/kWh`} />
              <DataRow label="Net Metering Buy" value={`${toFixed(inputs.rates.netMeteringBuyRate.times(100), 2)}\u00A2/kWh`} />
              <DataRow label="Net Metering Sell" value={`${toFixed(inputs.rates.netMeteringSellRate.times(100), 2)}\u00A2/kWh`} />
              <DataRow label="Escalation Rate" value={`${toFixed(inputs.rates.annualEscalationRate.times(100), 1)}%`} />
              <Divider />
              <DataRow label="Annual Consumption" value={`${toFixed(inputs.consumption.annualConsumptionKwh, 0)} kWh`} />
              <DataRow label="Annual Electricity Cost" value={`$${toFixed(inputs.consumption.annualElectricityCost, 2)}`} />
            </Card>

            {/* Financing */}
            <Card title="Financing">
              <DataRow label="Cash Price" value={`$${toFixed(inputs.financing.cashPurchasePrice, 2)}`} />
              <DataRow label="Monthly Payment" value={`$${toFixed(inputs.financing.financeMonthlyPayment, 2)}`} />
              <DataRow label="Term" value={`${inputs.financing.financeTermMonths} months`} />
              <DataRow label="Interest Rate" value={`${toFixed(inputs.financing.financeInterestRate.times(100), 2)}%`} />
            </Card>

            {/* Monthly Production vs Consumption */}
            <Card title="Monthly Production vs Consumption">
              <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-0.5 font-[family-name:var(--font-mono)] text-xs">
                <span className="text-neutral-500">Month</span>
                <span className="text-emerald-400/70 text-right">Prod (kWh)</span>
                <span className="text-sky-400/70 text-right">Cons (kWh)</span>
                {MONTHS.map((month, i) => (
                  <MonthRow
                    key={month}
                    month={month}
                    production={inputs.system.monthlyProductionKwh[i]}
                    consumption={inputs.consumption.monthlyConsumptionKwh[i]}
                  />
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ---- Section 2: Alberta Config from Supabase ---- */}
        <section>
          <SectionLabel>Supabase Integration</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight mt-1 mb-6">Alberta Config</h2>

          {configError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div className="space-y-3">
                  <p className="text-amber-200 font-medium">Supabase Not Connected</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">{configError}</p>
                  <div className="text-sm text-neutral-500 space-y-1.5 mt-4">
                    <p className="font-medium text-neutral-400">Setup instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Create a Supabase project at <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">supabase.com/dashboard</code></li>
                      <li>Copy <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">.env.local.example</code> to <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">.env.local</code></li>
                      <li>Fill in <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                      <li>Run <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">supabase/schema.sql</code> in SQL Editor</li>
                      <li>Run <code className="text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">supabase/seed.sql</code> in SQL Editor</li>
                      <li>Restart the dev server</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : config ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Regulatory Parameters">
                <DataRow label="Config ID" value={config.id.slice(0, 8) + '...'} mono />
                <DataRow label="Effective From" value={config.effectiveFrom} />
                <DataRow label="Effective To" value={config.effectiveTo ?? 'Currently Active'} highlight />
                <Divider />
                <DataRow label="Grid Emission Factor" value={`${toFixed(config.gridEmissionFactor, 2)} t CO\u2082/MWh`} />
                <DataRow label="Payout Range" value={`${toFixed(config.payoutPercentageLow.times(100), 0)}% \u2013 ${toFixed(config.payoutPercentageHigh.times(100), 0)}%`} />
                <DataRow label="Cash Back Rate" value={`${toFixed(config.cashBackRate.times(100), 0)}%`} />
                <DataRow label="Escalation Rate" value={`${toFixed(config.defaultEscalationRate.times(100), 0)}%`} />
                <DataRow label="Net Metering Buy" value={`${toFixed(config.defaultNetMeteringBuyRate.times(100), 1)}\u00A2/kWh`} />
                <DataRow label="Net Metering Sell" value={`${toFixed(config.defaultNetMeteringSellRate.times(100), 1)}\u00A2/kWh`} />
              </Card>

              <Card title="Carbon Benchmark Schedule">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-4 gap-y-0.5 font-[family-name:var(--font-mono)] text-xs">
                  <span className="text-neutral-500">Year</span>
                  <span className="text-neutral-500 text-right">$/tonne</span>
                  <span className="text-emerald-400/70 text-right">Low</span>
                  <span className="text-amber-400/70 text-right">High</span>
                  {config.carbonBenchmarkSchedule.map((entry) => (
                    <BenchmarkRow key={entry.year} entry={entry} />
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </section>

        {/* ---- Section 3: Decimal.js Precision Proof ---- */}
        <section>
          <SectionLabel>Precision Arithmetic</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight mt-1 mb-6">Decimal.js Proof</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="0.1 + 0.2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Native JavaScript</p>
                  <p className="font-[family-name:var(--font-mono)] text-red-400 text-sm">{String(nativeResult)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Decimal.js</p>
                  <p className="font-[family-name:var(--font-mono)] text-emerald-400 text-sm">{decimalResult.toString()}</p>
                </div>
                <p className="text-xs text-neutral-600">
                  {decimalResult.toString() === '0.3' ? 'Exact result confirmed' : 'PRECISION ERROR'}
                </p>
              </div>
            </Card>

            <Card title="ROUND_HALF_UP">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">d(&apos;1.005&apos;).toFixed(2)</p>
                  <p className="font-[family-name:var(--font-mono)] text-emerald-400 text-sm">{roundingDemo}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Native (1.005).toFixed(2)</p>
                  <p className="font-[family-name:var(--font-mono)] text-red-400 text-sm">{(1.005).toFixed(2)}</p>
                </div>
                <p className="text-xs text-neutral-600">
                  {roundingDemo === '1.01' ? 'Banker\'s rounding avoided' : 'ROUNDING ERROR'}
                </p>
              </div>
            </Card>

            <Card title="Precision Config">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Significant Digits</p>
                  <p className="font-[family-name:var(--font-mono)] text-sky-400 text-sm">{Decimal.precision}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Rounding Mode</p>
                  <p className="font-[family-name:var(--font-mono)] text-sky-400 text-sm">ROUND_HALF_UP ({Decimal.rounding})</p>
                </div>
                <p className="text-xs text-neutral-600">
                  Configured for 30-year financial projections
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ---- Section 4: Engine Status ---- */}
        <section>
          <SectionLabel>Calculation Engine</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight mt-1 mb-6">Status</h2>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <span className="text-neutral-400 text-sm">
                Calculation engine is a <span className="text-neutral-300 font-medium">stub</span> (Phase 3).
                Calling <code className="font-[family-name:var(--font-mono)] text-xs text-amber-400/80 bg-neutral-800 px-1.5 py-0.5 rounded">calculateProposal()</code> will throw.
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-3 ml-[22px]">
              Phase 3 implements the full calculation engine from the Solar Proposal Calculations document.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-800/60 pt-8 pb-12 text-center">
          <p className="text-xs text-neutral-600">
            Solar Presenter &mdash; Phase 1 Foundation & Data Schema
          </p>
        </footer>
      </div>
    </main>
  );
}

// ---- Helper Components ---- //

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase text-amber-400/80">
      {children}
    </p>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <h3 className="font-[family-name:var(--font-mono)] text-xs tracking-wide text-neutral-500 uppercase mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DataRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-sm text-neutral-500">{label}</span>
      <span
        className={`text-sm ${mono ? 'font-[family-name:var(--font-mono)] text-xs' : ''} ${
          highlight ? 'text-emerald-400' : 'text-neutral-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-neutral-800/60 my-2" />;
}

function MonthRow({
  month,
  production,
  consumption,
}: {
  month: string;
  production: Decimal;
  consumption: Decimal;
}) {
  return (
    <>
      <span className="text-neutral-400">{month}</span>
      <span className="text-emerald-400 text-right">{toFixed(production, 0)}</span>
      <span className="text-sky-400 text-right">{toFixed(consumption, 0)}</span>
    </>
  );
}

function BenchmarkRow({ entry }: { entry: { year: number; pricePerTonne: Decimal; payoutLow: Decimal; payoutHigh: Decimal } }) {
  return (
    <>
      <span className="text-neutral-400">{entry.year}</span>
      <span className="text-neutral-200 text-right">${toFixed(entry.pricePerTonne, 0)}</span>
      <span className="text-emerald-400 text-right">${toFixed(entry.payoutLow, 2)}</span>
      <span className="text-amber-400 text-right">${toFixed(entry.payoutHigh, 2)}</span>
    </>
  );
}
