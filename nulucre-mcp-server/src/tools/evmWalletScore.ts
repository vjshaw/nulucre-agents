import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  EvmWalletScoreInputSchema,
  EvmWalletScoreInput,
  ResponseFormat,
} from "../schemas/inputs.js";
import { fetchEvmScore, NulucreApiError } from "../services/nulucreApi.js";
import {
  formatEvmScoreMarkdown,
  formatPaymentRequiredMarkdown,
  isPaymentRequired,
} from "../services/formatters.js";

export function registerEvmWalletScoreTool(server: McpServer): void {
  server.registerTool(
    "nulucre_get_evm_wallet_score",
    {
      title: "Get EVM Wallet Reputation Score",
      description: `Get a 0-100 trust score for an EVM wallet address (0x...) from Nulucre, a multi-chain wallet reputation oracle covering 81+ chains.

The score is computed from on-chain data including wallet age, transaction volume, DeFi activity, and multi-chain presence, pulled from Etherscan, Moralis, Alchemy, and Ankr.

Use this tool to assess counterparty risk before an agent interacts with or pays an EVM wallet on Ethereum, Base, Polygon, Arbitrum, Optimism, or any of the 81+ supported chains.

Args:
  - wallet (string): EVM wallet address starting with '0x' (42 characters)
  - signed (boolean): If true, request an ECDSA-P256 signed score for independent
    verification via Nulucre's public JWKS endpoint (default: false)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "wallet": string,
    "score": number,            // 0-100
    "status": string,           // TRUSTED | VERIFIED | CAUTION | RISKY | BLACKLISTED
    "breakdown": {
      "<signalName>": { "score": number, "raw": string },
      ...
    },
    "chains"?: string[],
    "dataSource": string,
    "timestamp": string,
    "signature"?: string        // present only when signed=true
  }

Examples:
  - Use when: "Is this Ethereum wallet trustworthy?" -> wallet="0xabc...", signed=false
  - Use when: "Get a verifiable score for this 0x address" -> wallet="0xabc...", signed=true
  - Don't use when: scoring a Stellar G... address (use nulucre_get_stellar_wallet_score instead)

Error Handling:
  - Returns "Error: Invalid EVM wallet address" if the address format is invalid
  - Returns a payment-required explanation if the free evaluation quota is exhausted`,
      inputSchema: EvmWalletScoreInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EvmWalletScoreInput) => {
      try {
        const data = await fetchEvmScore(params.wallet, params.signed);

        if (isPaymentRequired(data)) {
          return {
            content: [
              {
                type: "text",
                text: formatPaymentRequiredMarkdown(data, params.wallet),
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
          content: [{ type: "text", text: formatEvmScoreMarkdown(data) }],
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
