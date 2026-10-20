# Nulucre Agents

**The on-chain credit score for AI agents.**

Live on EVM, Stellar, XRPL, and Solana via x402 micropayments.

## Agents

### Wallet Reputation Oracle
- `GET /reputation/{wallet}` — EVM wallet score 0-100 across 81+ chains
- `GET /reputation/signed/{wallet}` — ECDSA signed EVM score
- `GET /reputation/stellar/{gAddress}` — Stellar native wallet score
- `GET /reputation/stellar/signed/{gAddress}` — Signed Stellar score
- `GET /reputation/xrpl/{rAddress}` — XRPL native wallet score
- `GET /reputation/xrpl/signed/{rAddress}` — Signed XRPL score
- `GET /reputation/solana/{address}` — Solana native wallet score
- `GET /reputation/solana/signed/{address}` — Signed Solana score

All paid endpoints: **$0.001 USDC** (standard) · **$0.01 USDC** (signed)

Scoring includes sanctions screening (OFAC/UN/EU) on all chains before behavioral scoring.
Wallets with insufficient transaction history return `INSUFFICIENT_DATA` rather than a low score.

Methodology: https://agents.nulucre.com/methodology

### DeFi Fact Verification
- `POST /verify` — Verify DeFi TVL claims against DeFi Llama

## Payment
Accepts 7 currencies via x402:
- USDC (Base Mainnet)
- USDC, EURC, MXNT, NGNT, ARST, BRL (Stellar Pubnet)

## Discovery
- https://nulucre.com/.well-known/x402.json
- https://nulucre.com/.well-known/agent.json
- https://nulucre.com/openapi.json

## Live Stats
- 11,313+ total requests
- 1,732+ unique visitors
- 15 countries reached
- 81+ chains covered (EVM) + Stellar + XRPL + Solana

## Links
- Website: https://nulucre.com
- Methodology: https://agents.nulucre.com/methodology
- X: https://x.com/NulucreS
- RapidAPI: https://rapidapi.com/vjshaw/api/nulucre-agents
