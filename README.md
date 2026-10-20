# Nulucre Agents — Wallet Reputation Oracle for AI Agents

Real-time wallet trust scores across 4 chains, paid via x402 micropayments. No API keys, no accounts, no subscriptions — pure agent-to-agent commerce.

**Base URL:** `https://agents.nulucre.com`  
**Methodology:** `https://agents.nulucre.com/methodology`  
**MCP Server:** `https://agents.nulucre.com/mcp`

---

## Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /reputation/{wallet}` | $0.001 USDC | EVM wallet score (81+ chains) |
| `GET /reputation/signed/{wallet}` | $0.01 USDC | EVM score with ECDSA proof |
| `GET /reputation/stellar/{G-address}` | $0.001 USDC | Stellar wallet score |
| `GET /reputation/stellar/signed/{G-address}` | $0.01 USDC | Stellar score with ECDSA proof |
| `GET /reputation/xrpl/{r-address}` | $0.001 USDC | XRPL wallet score |
| `GET /reputation/solana/{address}` | $0.001 USDC | Solana wallet score |
| `POST /verify` | $0.01 USDC | DeFi TVL fact verification |
| `GET /tvl/{protocol}` | FREE | Raw TVL lookup |
| `GET /health` | FREE | Health check |
| `GET /methodology` | FREE | Scoring methodology |

---

## Payment Networks

| Network | Token | Pay To |
|---------|-------|--------|
| Base Mainnet | USDC (ERC-20) | `0xd97C122cB81894213C67Bcc774448955d09915bC` |
| Stellar Pubnet | USDC (SEP-41) | `GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24` |
| Solana Mainnet | USDC (SPL) | `GCRUBFDANv52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24` |

---

## Score Bands

| Score | Status | Meaning |
|-------|--------|---------|
| 80–100 | `TRUSTED` | Long history, high activity, broad multi-chain footprint |
| 60–79 | `VERIFIED` | Established wallet with meaningful on-chain history |
| 40–59 | `CAUTION` | Limited history or signals |
| 20–39 | `RISKY` | Very new, inactive, or abnormal patterns |
| 0–19 | `BLACKLISTED` | Sanctioned or near-zero activity |
| — | `INSUFFICIENT_DATA` | Fewer than 5 txs (EVM/Solana) or 3 txs (Stellar/XRPL) — not a risk verdict |

Full methodology: https://agents.nulucre.com/methodology

---

## Standard Response

```json
{
  "wallet": "0x123...abc",
  "score": 74,
  "status": "VERIFIED",
  "network": "evm",
  "breakdown": {
    "walletAge": { "score": 28, "raw": "3400 days" },
    "txVolume": { "score": 35, "raw": "2100 txs" },
    "defiActivity": { "score": 6, "raw": "3 protocols" },
    "multiChain": { "score": 5, "raw": "2 EVM chains" }
  },
  "timestamp": "2026-10-20T00:00:00.000Z"
}
```

Thin-file response:

```json
{
  "wallet": "0x123...abc",
  "score": null,
  "status": "INSUFFICIENT_DATA",
  "message": "Too few transactions to score reliably",
  "timestamp": "2026-10-20T00:00:00.000Z"
}
```

---

## How x402 Payment Works

1. Agent calls endpoint
2. Server returns `402 Payment Required` with payment details (Base, Stellar, or Solana)
3. Agent sends USDC on chosen network
4. Agent includes payment proof in next request header
5. Server verifies and returns score

No accounts. No API keys. Fully autonomous.

---

## Cryptographic Verification

Signed endpoints return an ECDSA-P256 signature verifiable against the Nulucre public key.

- **JWKS:** `https://nulucre.com/.well-known/jwks.json`
- **Algorithm:** ECDSA-P256 / SHA-256 / IEEE P1363

---

## Agent Discovery

https://agents.nulucre.com/reputation/
https://nulucre.com/.well-known/agent.json
https://nulucre.com/.well-known/x402.json
https://nulucre.com/.well-known/jwks.json
https://nulucre.com/openapi.json


---

## Quick Start

```bash
# Free health check
curl https://agents.nulucre.com/health

# Free TVL lookup
curl https://agents.nulucre.com/tvl/aave

# EVM wallet score (requires x402 payment)
curl https://agents.nulucre.com/reputation/0xYourWalletAddress

# EVM signed score with ECDSA proof
curl https://agents.nulucre.com/reputation/signed/0xYourWalletAddress

# Stellar wallet score
curl https://agents.nulucre.com/reputation/stellar/GYourStellarAddress

# XRPL wallet score
curl https://agents.nulucre.com/reputation/xrpl/rYourXRPLAddress

# Solana wallet score
curl https://agents.nulucre.com/reputation/solana/YourSolanaAddress

# Fact verification
curl -X POST https://agents.nulucre.com/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "Uniswap has $5B TVL", "protocol": "uniswap"}'
```

---

## Stack

- Node.js + Express + PM2
- x402 payment protocol (Base, Stellar, Solana)
- Etherscan V2, Alchemy, Ankr, DeBank/Moralis (EVM)
- Stellar Horizon + StellarExpert (Stellar)
- xrplcluster.com (XRPL)
- Solana Mainnet RPC (Solana)
- ECDSA-P256 cryptographic signing
- Nginx reverse proxy on Ubuntu VPS

---

## Links

- 🌐 Website: https://nulucre.com
- 📖 Methodology: https://agents.nulucre.com/methodology
- 🔌 MCP Server: https://agents.nulucre.com/mcp
- 🔑 JWKS: https://nulucre.com/.well-known/jwks.json
- 📧 Contact: info@nulucre.com

---

MIT License — © 2026 Nulucre Inc.
