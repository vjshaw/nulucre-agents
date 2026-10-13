import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchXrplScore, NulucreApiError } from "../services/nulucreApi.js";
import { formatXrplScoreMarkdown, formatPaymentRequiredMarkdown, isPaymentRequired } from "../services/formatters.js";

const XrplWalletScoreInputSchema = {
  r_address: z.string().describe("XRPL wallet address starting with r (25-35 characters)"),
  signed: z.boolean().default(false).describe("If true, request an ECDSA-P256 signed score"),
  response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format")
};

export function registerXrplWalletScoreTool(server: McpServer): void {
  server.registerTool(
    "nulucre_get_xrpl_wallet_score",
    {
      title: "Get XRPL Wallet Reputation Score",
      description: "Get a 0-100 trust score for an XRPL wallet address (r...) from Nulucre. Scored using 7 XRPL Ledger signals: account age, transaction volume, trustline diversity, DEX participation, network trust, payment activity, and spam detection. Includes real-time OFAC/UN/EU sanctions screening. Use before paying or interacting with any XRPL wallet.",
      inputSchema: XrplWalletScoreInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      try {
        const data = await fetchXrplScore(params.r_address, params.signed);
        if (isPaymentRequired(data)) {
          return { content: [{ type: "text", text: formatPaymentRequiredMarkdown(data, params.r_address) }] };
        }
        if (params.response_format === "json") {
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
        }
        return { content: [{ type: "text", text: formatXrplScoreMarkdown(data) }] };
      } catch (error) {
        return { content: [{ type: "text", text: "Error: " + (error as Error).message }], isError: true };
      }
    }
  );
}
