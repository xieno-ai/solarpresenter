export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="text-center space-y-6 px-8">
        <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.3em] uppercase text-amber-400">
          Phase 1 Scaffold
        </p>
        <h1 className="text-5xl font-bold tracking-tight">
          Solar Presenter
        </h1>
        <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
          Proposal generator for Northern NRG. Foundation and data schema
          initialized. Types, Decimal.js, and test fixtures ready.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3 text-sm text-neutral-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Dev server running
        </div>
      </div>
    </main>
  );
}
