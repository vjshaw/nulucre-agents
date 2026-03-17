# nulucre-agents
AI infrastructure agents with x402 micropayments on Base — Reputation Oracle &amp; DeFi Fact Verification

# Nulucre Agents — AI Infrastructure on Base

Two autonomous AI agents that accept USDC micropayments via the x402 protocol on Base mainnet. No API keys, no accounts, no subscriptions — just pay-per-query.

## Agents

### 🔵 Reputation Oracle — $0.003 USDC per query
Returns a 0–100 trust score for any EVM wallet address based on on-chain data.

**Endpoint:**
GET https://nulucre.com/reputation/{wallet}

**Example Response:**
```json
{
  "wallet": "0x123...abc",
  "score": 82,
  "status": "TRUSTED",
  "breakdown": {
    "walletAge": { "score": 24, "raw": "847 days" },
    "txVolume":  { "score": 38, "raw": "3240 txs" }
  },
  "timestamp": "2026-03-17T11:07:00Z"
}
```

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

## License

MIT
