# Nulucre MCP Server

An MCP (Model Context Protocol) server that exposes [Nulucre](https://nulucre.com)'s
live wallet reputation scoring to any MCP-compatible AI agent — Claude Desktop,
Claude Code, Cursor, and any other MCP client.

Nulucre is a Stellar-native and EVM wallet reputation oracle. It returns a 0-100
trust score for any wallet address, computed from real on-chain data, with
real-time OFAC/UN/EU sanctions screening on every Stellar query.

## Tools

### `nulucre_get_stellar_wallet_score`
Score a Stellar `G...` wallet address using 8 Horizon API + Stellar Expert
signals (account age, transaction volume, asset diversity, SDEX participation,
network trust, claimable balances, Soroban contract interactions, liquidity pool
participation) plus a live OFAC/UN/EU sanctions check.

### `nulucre_get_evm_wallet_score`
Score an EVM `0x...` wallet address across 81+ chains using Etherscan, Moralis,
Alchemy, and Ankr data.

### `nulucre_check_service_status`
Free health check — confirms the live Nulucre API is reachable.

## Installation

```bash
npm install
npm run build
```

## Running

### stdio (for Claude Desktop, Claude Code, Cursor, etc.)

```bash
npm start
```

### Streamable HTTP (for remote/multi-client access)

```bash
TRANSPORT=http PORT=3020 npm start
```

The HTTP server listens on `/mcp` (POST) and exposes a free `/health` (GET) check.

## Configuration — Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nulucre": {
      "command": "node",
      "args": ["/path/to/nulucre-mcp-server/dist/index.js"]
    }
  }
}
```

## Configuration — Remote HTTP (e.g. running on a VPS)

```json
{
  "mcpServers": {
    "nulucre": {
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

## Notes on Payment

Nulucre's score endpoints are gated by the [x402 protocol](https://nulucre.com/.well-known/x402.json).
This MCP server queries the free evaluation path (`x-payment: test` header),
which is rate-limited server-side for evaluation purposes. If the free quota
is exhausted, tools return a payment-required explanation including the x402
payment details needed to complete a paid request.

## Links

- Website: https://nulucre.com
- API Docs: https://nulucre.com/docs/
- Integration Guide: https://nulucre.com/docs/integration-guide.md
- JSON Schema: https://nulucre.com/schema/v1/stellar-reputation.json
- GitHub: https://github.com/vjshaw/nulucre-agents
