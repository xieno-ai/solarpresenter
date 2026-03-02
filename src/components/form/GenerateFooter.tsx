export interface GenerateFooterProps {
  errorCount: number;    // Count of blocking validation errors
  isFormValid: boolean;  // react-hook-form formState.isValid
  onGenerate: () => void;
}

export function GenerateFooter({ errorCount, isFormValid, onGenerate }: GenerateFooterProps) {
  const isDisabled = !isFormValid || errorCount > 0;
  const fieldCount = errorCount === 1 ? '1 field remaining' : `${errorCount} fields remaining`;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Status text */}
        {errorCount > 0 ? (
          <span className="text-sm text-neutral-400">{fieldCount}</span>
        ) : (
          <span className="text-sm text-emerald-400">Ready to generate</span>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isDisabled}
          className="px-6 py-2.5 rounded-lg bg-amber-400 text-neutral-950 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Proposal
        </button>
      </div>
    </div>
  );
}
