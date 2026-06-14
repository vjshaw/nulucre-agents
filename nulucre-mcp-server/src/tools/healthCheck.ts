import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HealthCheckInputSchema } from "../schemas/inputs.js";
import { fetchHealth, NulucreApiError } from "../services/nulucreApi.js";

export function registerHealthCheckTool(server: McpServer): void {
  server.registerTool(
    "nulucre_check_service_status",
    {
      title: "Check Nulucre Service Status",
      description: `Check whether the live Nulucre reputation oracle service is online. This is a free endpoint that requires no payment.

Use this tool to verify Nulucre is reachable before relying on it for wallet scoring decisions, or for general uptime monitoring.

Args: none

Returns:
  Structured data with schema:
  {
    "status": string,    // "online" if the service is reachable
    "service": string    // service name
  }

Examples:
  - Use when: "Is Nulucre up?" -> no params needed
  - Use when: checking service availability before a batch of scoring calls

Error Handling:
  - Returns "Error: ..." with details if the service is unreachable`,
      inputSchema: HealthCheckInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const data = await fetchHealth();
        return {
          content: [
            {
              type: "text",
              text: `Nulucre service status: **${data.status}** (${data.service})`,
            },
          ],
          structuredContent: data as unknown as Record<string, unknown>,
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
