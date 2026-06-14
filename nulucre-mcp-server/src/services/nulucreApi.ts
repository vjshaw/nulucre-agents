import axios, { AxiosError } from "axios";
import { NULUCRE_API_BASE, REQUEST_TIMEOUT_MS, TEST_PAYMENT_HEADER } from "../constants.js";
import {
  StellarScoreResponse,
  EvmScoreResponse,
  HealthResponse,
  PaymentRequiredResponse,
} from "../types.js";

/**
 * Shared HTTP client configured for the live Nulucre API.
 * All Nulucre score endpoints are x402-gated. Passing the
 * "test" payment header allows free evaluation queries against
 * the live production scoring engine (server-side rate limited).
 */
const client = axios.create({
  baseURL: NULUCRE_API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "x-payment": TEST_PAYMENT_HEADER,
    "User-Agent": "nulucre-mcp-server/1.0.0",
  },
  // Don't throw on 402 — Nulucre uses 402 as part of the x402
  // payment negotiation flow, and we want to surface that to the caller.
  validateStatus: () => true,
});

export class NulucreApiError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = "NulucreApiError";
  }
}

/**
 * Fetch the live Stellar wallet reputation score for a Stellar G... address.
 * Uses the free/test evaluation path (x-payment: test header).
 */
export async function fetchStellarScore(
  gAddress: string,
  signed: boolean
): Promise<StellarScoreResponse | PaymentRequiredResponse> {
  const path = signed
    ? `/reputation/stellar/signed/${gAddress}`
    : `/reputation/stellar/${gAddress}`;

  try {
    const response = await client.get(path);

    if (response.status === 200) {
      return response.data as StellarScoreResponse;
    }
    if (response.status === 402) {
      return response.data as PaymentRequiredResponse;
    }
    if (response.status === 400) {
      throw new NulucreApiError(
        `Invalid Stellar wallet address: ${gAddress}`,
        400
      );
    }
    throw new NulucreApiError(
      `Nulucre API returned unexpected status ${response.status}`,
      response.status
    );
  } catch (error) {
    throw wrapError(error, "Stellar wallet score");
  }
}

/**
 * Fetch the live EVM wallet reputation score for a 0x... address.
 * Uses the free/test evaluation path (x-payment: test header).
 */
export async function fetchEvmScore(
  wallet: string,
  signed: boolean
): Promise<EvmScoreResponse | PaymentRequiredResponse> {
  const path = signed ? `/reputation/signed/${wallet}` : `/reputation/${wallet}`;

  try {
    const response = await client.get(path);

    if (response.status === 200) {
      return response.data as EvmScoreResponse;
    }
    if (response.status === 402) {
      return response.data as PaymentRequiredResponse;
    }
    if (response.status === 400) {
      throw new NulucreApiError(`Invalid EVM wallet address: ${wallet}`, 400);
    }
    throw new NulucreApiError(
      `Nulucre API returned unexpected status ${response.status}`,
      response.status
    );
  } catch (error) {
    throw wrapError(error, "EVM wallet score");
  }
}

/**
 * Free health check — no payment required.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const response = await client.get("/health");
    return response.data as HealthResponse;
  } catch (error) {
    throw wrapError(error, "health check");
  }
}

function wrapError(error: unknown, context: string): NulucreApiError {
  if (error instanceof NulucreApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    if (axiosErr.code === "ECONNABORTED") {
      return new NulucreApiError(
        `Nulucre API request for ${context} timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    return new NulucreApiError(
      `Nulucre API request for ${context} failed: ${axiosErr.message}`
    );
  }
  return new NulucreApiError(
    `Unexpected error during ${context}: ${(error as Error).message}`
  );
}
