# Nulucre Agents

**The on-chain credit score for AI agents.**

Live on Base mainnet and Stellar pubnet via x402 micropayments.

## Agents

### Wallet Reputation Oracle
- `GET /reputation/{wallet}` — EVM wallet score 0-100 across 81+ chains
- `GET /reputation/signed/{wallet}` — ECDSA signed score
- `GET /reputation/stellar/{gAddress}` — Stellar native wallet score
- `GET /reputation/stellar/signed/{gAddress}` — Signed Stellar score

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
- 81+ chains covered

## Links
- Website: https://nulucre.com
- X: https://x.com/NulucreS
- RapidAPI: https://rapidapi.com/vjshaw/api/nulucre-agents
