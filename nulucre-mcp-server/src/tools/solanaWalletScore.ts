import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchSolanaScore, NulucreApiError } from "../services/nulucreApi.js";
import { formatSolanaScoreMarkdown, formatPaymentRequiredMarkdown, isPaymentRequired } from "../services/formatters.js";

const SolanaWalletScoreInputSchema = {
  address: z.string().describe("Solana wallet address (base58, 32-44 characters)"),
  signed: z.boolean().default(false).describe("If true, request an ECDSA-P256 signed score"),
  response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format")
};

export function registerSolanaWalletScoreTool(server: McpServer): void {
  server.registerTool(
    "nulucre_get_solana_wallet_score",
    {
      title: "Get Solana Wallet Reputation Score",
      description: "Get a 0-100 trust score for a Solana wallet address from Nulucre. Scored using 7 native Solana RPC signals: account age, transaction volume, SOL balance, token diversity, recent activity, program account status, and failed transaction ratio. Includes real-time OFAC/UN/EU sanctions screening. Use before paying or interacting with any Solana wallet. Pay per query via x402 USDC micropayments.",
      inputSchema: SolanaWalletScoreInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await fetchSolanaScore(params.address, params.signed);
        if (isPaymentRequired(data)) {
          return { content: [{ type: "text", text: formatPaymentRequiredMarkdown(data, params.address) }] };
        }
        if (params.response_format === "json") {
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
        }
        return { content: [{ type: "text", text: formatSolanaScoreMarkdown(data) }] };
      } catch (error) {
        return { content: [{ type: "text", text: "Error: " + (error as Error).message }], isError: true };
      }
    }
  );
}
