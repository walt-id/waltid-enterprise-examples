const DEFAULT_IBAN_COUNTRY = "BE";

/** ISO 3166-1 alpha-2 country code used as the IBAN prefix. */
export function ibanCountryCode(): string {
  const configured = process.env.NEXT_PUBLIC_IBAN_COUNTRY?.trim().toUpperCase();
  if (configured && /^[A-Z]{2}$/.test(configured)) {
    return configured;
  }
  return DEFAULT_IBAN_COUNTRY;
}

/** Keep the account number and spacing, and set the leading country code. */
export function withIbanCountry(iban: string): string {
  return iban.replace(/^[A-Za-z]{2}/, ibanCountryCode());
}
