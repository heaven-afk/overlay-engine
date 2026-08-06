const FLAG_OFFSET = 127397;

export function getCountryEmoji(countryCode?: string | null): string {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return '🏳️';
  }
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + FLAG_OFFSET));
}
