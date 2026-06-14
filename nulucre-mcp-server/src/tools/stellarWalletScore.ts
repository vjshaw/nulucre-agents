import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  StellarWalletScoreInputSchema,
  StellarWalletScoreInput,
  ResponseFormat,
} from "../schemas/inputs.js";
import { fetchStellarScore, NulucreApiError } from "../services/nulucreApi.js";
import {
  formatStellarScoreMarkdown,
  formatPaymentRequiredMarkdown,
  isPaymentRequired,
} from "../services/formatters.js";

export function registerStellarWalletScoreTool(server: McpServer): void {
  server.registerTool(
    "nulucre_get_stellar_wallet_score",
    {
      title: "Get Stellar Wallet Reputation Score",
      description: `Get a 0-100 trust score for a Stellar wallet address (G...) from Nulucre, a live Stellar-native wallet reputation oracle.

The score is computed from 8 signals pulled directly from the Stellar Horizon API and Stellar Expert — account age, transaction volume, asset diversity, SDEX DEX participation, network trust, claimable balance activity, Soroban contract interactions, and liquidity pool participation, plus a spam detection penalty. No EVM data is used.

Every score includes a real-time sanctions screening result against the OFAC SDN, OFAC Non-SDN, EU Financial Sanctions, and UN Security Council Sanctions lists. A wallet matching any of these lists automatically receives a score of 0 and status BLACKLISTED.

Use this tool to assess counterparty risk before an agent interacts with or pays a Stellar wallet — for example before executing a payment, approving a swap counterparty, or evaluating a new account.

Args:
  - g_address (string): Stellar wallet address starting with 'G' (56 characters)
  - signed (boolean): If true, request an ECDSA-P256 signed score for independent
    verification via Nulucre's public JWKS endpoint (default: false)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "wallet": string,
    "network": "stellar:pubnet",
    "score": number,            // 0-100
    "status": string,           // TRUSTED | VERIFIED | CAUTION | RISKY | BLACKLISTED
    "breakdown": {
      "accountAge": { "score": number, "raw": string },
      "txVolume": { "score": number, "raw": string },
      "assetDiversity": { "score": number, "raw": string },
      "dexParticipation": { "score": number, "raw": string },
      "networkTrust": { "score": number, "raw": string },
      "claimableActivity": { "score": number, "raw": string },
      "sorobanUsage": { "score": number, "raw": string },
      "liquidityPools": { "score": number, "raw": string },
      "spamPenalty": { "score": number, "raw": string },
      "sanctionsCheck": { "score": number, "raw": "CLEAR"|"SANCTIONED"|"UNCHECKED", "source": string }
    },
    "dataSource": string,
    "timestamp": string,
    "signature"?: string        // present only when signed=true
  }

Examples:
  - Use when: "Is this Stellar wallet safe to pay?" -> g_address="GABC...", signed=false
  - Use when: "Get a verifiable score I can check independently" -> g_address="GABC...", signed=true
  - Don't use when: scoring an Ethereum or other EVM address (use nulucre_get_evm_wallet_score instead)

Error Handling:
  - Returns "Error: Invalid Stellar wallet address" if the address format is invalid
  - Returns a payment-required explanation if the free evaluation quota is exhausted`,
      inputSchema: StellarWalletScoreInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: StellarWalletScoreInput) => {
      try {
        const data = await fetchStellarScore(params.g_address, params.signed);

        if (isPaymentRequired(data)) {
          return {
            content: [
              {
                type: "text",
                text: formatPaymentRequiredMarkdown(data, params.g_address),
              },
            ],
          };
        }

        if (params.response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            structuredContent: data as unknown as Record<string, unknown>,
          };
        }

        return {
          content: [{ type: "text", text: formatStellarScoreMarkdown(data) }],
        };
      } catch (error) {
        const message =
          error instanceof NulucreApiError
            ? error.message
            : `Unexpected error: ${(error as Error).message}`;
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
