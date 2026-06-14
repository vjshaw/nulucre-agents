#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerStellarWalletScoreTool } from "./tools/stellarWalletScore.js";
import { registerEvmWalletScoreTool } from "./tools/evmWalletScore.js";
import { registerHealthCheckTool } from "./tools/healthCheck.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "nulucre-mcp-server",
    version: "1.0.0",
  });

  registerStellarWalletScoreTool(server);
  registerEvmWalletScoreTool(server);
  registerHealthCheckTool(server);

  return server;
}

async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nulucre MCP server running on stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    // Stateless: create a fresh server + transport per request to avoid
    // request ID collisions across concurrent clients.
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "online", service: "nulucre-mcp-server" });
  });

  const port = parseInt(process.env.PORT || "3020", 10);
  app.listen(port, () => {
    console.error(`Nulucre MCP server running on http://localhost:${port}/mcp`);
  });
}

const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
