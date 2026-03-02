import Decimal from 'decimal.js';

// Configure once at module load
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/** Create Decimal from string (preferred) or number. Never from float arithmetic. */
export function d(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/** Convert Decimal to fixed-point string for display (e.g., "1234.50"). */
export function toFixed(value: Decimal, places: number = 2): string {
  return value.toFixed(places);
}

/** Convert Decimal to number ONLY for non-financial purposes (e.g., chart data). */
export function toNumber(value: Decimal): number {
  return value.toNumber();
}

/** Serialize Decimal for JSON (stores as string to preserve precision). */
export function toJSON(value: Decimal): string {
  return value.toString();
}

/** Deserialize Decimal from JSON string. */
export function fromJSON(value: string): Decimal {
  return new Decimal(value);
}

// Re-export Decimal class for direct use
export { Decimal };
