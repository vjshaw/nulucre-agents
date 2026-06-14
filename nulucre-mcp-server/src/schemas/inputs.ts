import { z } from "zod";

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

// Stellar G... addresses: 56 characters, starting with 'G', base32 alphabet
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

// EVM addresses: 0x followed by 40 hex characters
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const StellarWalletScoreInputSchema = z
  .object({
    g_address: z
      .string()
      .regex(
        STELLAR_ADDRESS_REGEX,
        "Must be a valid Stellar G... address (56 characters, starts with 'G')"
      )
      .describe("Stellar wallet address starting with 'G' (56 characters)"),
    signed: z
      .boolean()
      .default(false)
      .describe(
        "If true, requests an ECDSA-P256 cryptographically signed score for independent verification (higher cost endpoint)"
      ),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe(
        "Output format: 'markdown' for human-readable report or 'json' for machine-readable structured data"
      ),
  })
  .strict();

export type StellarWalletScoreInput = z.infer<
  typeof StellarWalletScoreInputSchema
>;

export const EvmWalletScoreInputSchema = z
  .object({
    wallet: z
      .string()
      .regex(
        EVM_ADDRESS_REGEX,
        "Must be a valid EVM address (0x followed by 40 hex characters)"
      )
      .describe("EVM wallet address starting with '0x' (42 characters)"),
    signed: z
      .boolean()
      .default(false)
      .describe(
        "If true, requests an ECDSA-P256 cryptographically signed score for independent verification (higher cost endpoint)"
      ),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe(
        "Output format: 'markdown' for human-readable report or 'json' for machine-readable structured data"
      ),
  })
  .strict();

export type EvmWalletScoreInput = z.infer<typeof EvmWalletScoreInputSchema>;

export const HealthCheckInputSchema = z.object({}).strict();

export type HealthCheckInput = z.infer<typeof HealthCheckInputSchema>;
