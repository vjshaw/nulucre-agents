# Nulucre Agents — The On-Chain Credit Score for AI Agents

Two autonomous AI agents accepting USDC micropayments via x402 on Base mainnet and Stellar pubnet. No API keys, no accounts, no subscriptions — pure agent-to-agent commerce.

## Agents

### 🔵 Reputation Oracle
The credit score for crypto wallets. Returns a 0-100 trust score across 81+ chains with ECDSA cryptographic proof.

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

## Pricing & Networks

| Tier | Endpoint | Price | Networks |
|------|----------|-------|---------|
| Standard | GET /reputation/{wallet} | $0.003 USDC | Base Mainnet + Stellar Pubnet |
| Signed | GET /reputation/signed/{wallet} | $0.01 USDC | Base Mainnet + Stellar Pubnet |
| Verification | POST /verify | $0.01 USDC | Base Mainnet + Stellar Pubnet |
| TVL Lookup | GET /tvl/{protocol} | FREE | - |
| Health | GET /health | FREE | - |

## Cryptographic Verification
Signed scores are independently verifiable by any agent:
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

**Standard Response:**
```json
{
  "wallet": "0x123...abc",
  "score": 97,
  "status": "TRUSTED",
  "breakdown": {
    "walletAge": { "score": 30, "raw": "3827 days" },
    "txVolume": { "score": 40, "raw": "10000 txs" },
    "defiActivity": { "score": 8, "raw": "4 protocols" },
    "multiChain": { "score": 9, "raw": "3 EVM chains" },
    "ankrCoverage": { "score": 10, "raw": "16 chains with assets" }
  },
  "chains": ["ethereum", "base", "polygon", "arbitrum", "optimism", "ankr-81-chains"],
  "timestamp": "2026-03-24T00:00:00.000Z"
}
```

**Signed Response:**
```json
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
```

---

### 🟡 Fact Verification Agent — $0.01 USDC per report
Verifies DeFi protocol TVL claims against DeFi Llama on-chain data. Returns ACCURATE, MISLEADING, or FALSE.

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
  "timestamp": "2026-03-24T00:00:00.000Z"
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
2. Server returns `402 Payment Required` with payment details for Base or Stellar
3. Agent sends USDC on Base mainnet or Stellar pubnet
4. Agent includes payment proof in next request header
5. Server verifies and returns data

No accounts. No API keys. Fully autonomous agent-to-agent payments.

## Payment Details

| Network | Token | Address |
|---------|-------|---------|
| Base Mainnet | USDC (ERC-20) | `0xd97C122cB81894213C67Bcc774448955d09915bC` |
| Stellar Pubnet | USDC (SEP-41) | `GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24` |

## Stack

- Node.js + Express
- x402 payment protocol
- Etherscan V2 (wallet age + tx volume)
- Moralis / DeBank (DeFi activity)
- Alchemy (Polygon, Arbitrum, Optimism)
- Ankr (81+ chains)
- DeFi Llama (TVL verification)
- ECDSA-P256 cryptographic signing
- OpenZeppelin Stellar facilitator
- PM2 + Nginx on Ubuntu VPS

## Agent Discovery
```
https://nulucre.com/.well-known/SKILL.md
https://nulucre.com/.well-known/x402.json
https://nulucre.com/.well-known/agent.json
https://nulucre.com/.well-known/jwks.json
https://nulucre.com/openapi.json
```
## 🆓 Try It Free — No Payment Needed

Test the API instantly with no x402 setup required:

```bash
curl https://nulucre.com/reputation/0x000000000000000000000000000000000000TEST
```

Returns a sample wallet score response immediately. For real wallet scoring, use any EVM address — $0.001 USDC via x402.
## Quick Start
```bash
# Free health check
curl https://nulucre.com/health

# Free TVL lookup
curl https://nulucre.com/tvl/aave

# Reputation query (requires x402 payment)
curl https://nulucre.com/reputation/0xYourWalletAddress

# Signed reputation query
curl https://nulucre.com/reputation/signed/0xYourWalletAddress

# Fact verification (requires x402 payment)
curl -X POST https://nulucre.com/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "Uniswap has $5B TVL", "protocol": "uniswap"}'
```

## Links

- 🌐 Website: https://nulucre.com
- 📦 x402.json: https://nulucre.com/.well-known/x402.json
- 🔑 JWKS: https://nulucre.com/.well-known/jwks.json
- 📧 Contact: info@nulucre.com

## License

MIT
