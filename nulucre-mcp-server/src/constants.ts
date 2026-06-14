// Nulucre API base URL — live production endpoint
export const NULUCRE_API_BASE = "https://nulucre.com";

// Default request timeout in milliseconds
export const REQUEST_TIMEOUT_MS = 15000;

// x-payment header value for free/test queries
// Nulucre's live endpoints accept "test" as a payment proof for
// no-cost evaluation queries (rate-limited on the server side)
export const TEST_PAYMENT_HEADER = "test";

// Character limit for response text before truncation guidance
export const CHARACTER_LIMIT = 25000;
