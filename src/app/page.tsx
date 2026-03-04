export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h1 className="text-lg font-semibold tracking-tight">Solar Presenter</h1>
        </div>
      </header>

      {/* Main content — centered vertically */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl space-y-10">
          {/* Hero */}
          <div className="text-center space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase text-amber-400/80">
              Northern NRG
            </p>
            <p className="text-neutral-400 text-sm">Northern NRG proposal tools</p>
          </div>

          {/* Tool grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Proposal Creator */}
            <a
              href="/enter"
              className="group relative flex flex-col gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800/50"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 group-hover:bg-neutral-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight">Proposal Creator</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Enter system data or import from SunPitch to generate a branded 11-page proposal
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-end">
                <span className="text-amber-400 text-lg font-medium group-hover:translate-x-1 transition-transform inline-block">
                  →
                </span>
              </div>
            </a>

            {/* Card 2: Bill Extractor */}
            <a
              href="/bill"
              className="group relative flex flex-col gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800/50"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 group-hover:bg-neutral-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight">Bill Extractor</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Upload a utility bill and AI extracts usage, rates, and account details instantly
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-end">
                <span className="text-amber-400 text-lg font-medium group-hover:translate-x-1 transition-transform inline-block">
                  →
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-6 text-center">
        <p className="text-xs text-neutral-600">Northern NRG</p>
      </footer>
    </main>
  );
}
