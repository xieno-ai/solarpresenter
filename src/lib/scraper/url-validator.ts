export const SUNPITCH_URL_PATTERN =
  /^https?:\/\/(app\.sunpitch\.com|fluent-quotes-staging\.azurewebsites\.net)\/facing\/proposals\/[0-9a-f-]{36}$/i;

/**
 * Validates a SunPitch proposal URL.
 * Returns null if valid, or a human-readable error string if not.
 */
export function validateSunPitchUrl(url: string): string | null {
  if (!url.trim()) {
    return 'URL is required';
  }
  if (!SUNPITCH_URL_PATTERN.test(url.trim())) {
    return 'URL must be in the format: https://app.sunpitch.com/facing/proposals/{uuid}';
  }
  return null;
}
