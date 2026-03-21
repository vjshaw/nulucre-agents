# nulucre-agents
AI infrastructure agents with x402 micropayments on Base — Reputation Oracle &amp; DeFi Fact Verification

# Nulucre Agents — AI Infrastructure on Base

Two autonomous AI agents that accept USDC micropayments via the x402 protocol on Base mainnet. No API keys, no accounts, no subscriptions — just pay-per-query.

## Agents

### 🔵 Reputation Oracle — $0.003 USDC per query
## Scoring Breakdown

| Component | Max Score | Source |
|-----------|-----------|--------|
| Wallet Age | 30 | Etherscan V2 |
| TX Volume | 40 | Etherscan V2 |
| DeFi Activity | 20 | Moralis / DeBank |
| Base Activity | 10 | Basescan via Etherscan V2 |
| Multi-Chain EVM | 10 | Alchemy (Polygon, Arbitrum, Optimism) |
| Ankr Coverage | 10 | Ankr (81+ chains) |
| **Total** | **100+** | Multi-source |

## Pricing Tiers

| Tier | Endpoint | Price | Description |
|------|----------|-------|-------------|
| Standard | GET /reputation/{wallet} | $0.003 USDC | 0-100 score across 81+ chains |
| Signed | GET /reputation/signed/{wallet} | $0.01 USDC | Score + ECDSA cryptographic proof |
| Verification | POST /verify | $0.01 USDC | DeFi TVL fact verification |

## Cryptographic Verification
Signed scores can be independently verified by any agent:
- **JWKS endpoint:** https://nulucre.com/.well-known/jwks.json
- **Algorithm:** ECDSA-P256
- **Signed by:** nulucre.com

**Status Labels:**
| Score | Status |
|-------|--------|
| 80–100 | TRUSTED |
| 60–79 | VERIFIED |
| 40–59 | CAUTION |
| 20–39 | RISKY |
| 0–19 | BLACKLISTED |
**Endpoint:**
GET https://nulucre.com/reputation/{wallet}

{
  "wallet": "0x123...abc",
  "score": 97,
  "status": "TRUSTED",
  "breakdown": {
    "walletAge": { "score": 30, "raw": "3827 days" },
    "txVolume": { "score": 40, "raw": "10000 txs" },
    "defiActivity": { "score": 8, "raw": "4 protocols" },
    "baseActivity": { "score": 0, "raw": "0 base txs" },
    "multiChain": { "score": 9, "raw": "3 EVM chains" },
    "ankrCoverage": { "score": 10, "raw": "16 chains with assets" }
  },
  "chains": ["ethereum", "base", "polygon", "arbitrum", "optimism", "ankr-81-chains"],
  "timestamp": "2026-03-21T19:10:38.797Z"
}
{
  "wallet": "0x123...abc",
  "score": 97,
  "status": "TRUSTED",
  "proof": {
    "signature": "MEQCIFruX2vD...",
    "algorithm": "ECDSA-P256",
    "signedBy": "nulucre.com",
    "verifyAt": "https://nulucre.com/.well-known/jwks.json"
  }
}

**Status Labels:**
- TRUSTED (80–100)
- VERIFIED (60–79)
- CAUTION (40–59)
- RISKY (20–39)
- BLACKLISTED (0–19)

---

### 🟡 Fact Verification Agent — $0.01 USDC per report
Verifies DeFi protocol TVL claims against DeFi Llama on-chain data. Accepts natural language input.

**Endpoint:**
POST https://nulucre.com/verify

**Request Body:**
```json
{
  "claim": "Aave has $12B TVL",
  "protocol": "aave"
}
```

**Example Response:**
```json
{
  "verdict": "ACCURATE",
  "claimedTVL": 12000000000,
  "actualTVL": 11840000000,
  "discrepancyPercent": -1.3,
  "dataSource": "DeFi Llama",
  "timestamp": "2026-03-17T11:07:00Z"
}
```

**Verdicts:**
- ACCURATE (< 5% difference)
- MOSTLY_ACCURATE (5–10%)
- INACCURATE (10–25%)
- MISLEADING (25–50%)
- FALSE (> 50%)

---

### 🆓 Free Endpoints

**Health check:**
GET https://nulucre.com/health

**Raw TVL lookup:**
GET https://nulucre.com/tvl/{protocol}

---

## How x402 Payment Works

1. Agent calls your endpoint
2. Server returns `402 Payment Required` with payment details
3. Agent sends USDC on Base to the payment address
4. Agent includes payment proof in next request header
5. Server verifies and returns data

No accounts. No API keys. Fully autonomous agent-to-agent payments.

## Payment Details

- **Network:** Base Mainnet (Chain 8453)
- **Token:** USDC (ERC-20)
- **Protocol:** x402
- **Receiving Wallet:** `0xd97C122cB81894213C67Bcc774448955d09915bC`

## Stack

- Node.js + Express
- x402 payment protocol
- Etherscan API (wallet data)
- DeFi Llama API (TVL data)
- Coinbase CDP (payment verification)
- PM2 + Nginx on Ubuntu VPS

## Links

- 🌐 Website & Docs: https://nulucre.com
- 📧 Contact: info@nulucre.com

## Quick Start

Any x402-compatible agent can call these endpoints directly:
```bash
# Free health check
curl https://nulucre.com/health

# Free TVL lookup
curl https://nulucre.com/tvl/aave

# Reputation query (requires x402 payment of $0.003 USDC)
curl https://nulucre.com/reputation/0xYourWalletAddress

# Fact verification (requires x402 payment of $0.01 USDC)
curl -X POST https://nulucre.com/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "Uniswap has $5B TVL", "protocol": "uniswap"}'
```

## Agent Discovery

This service follows the Base Agent App standard and is automatically discoverable by AI agents:
```
https://nulucre.com/.well-known/SKILL.md
```

Any agent can read this file to understand available endpoints, pricing, and how to interact programmatically — no human in the loop required.
## License

MIT
