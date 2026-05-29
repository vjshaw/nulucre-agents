# Nulucre Stellar Wallet Reputation — Developer Integration Guide

## What is Nulucre?

Nulucre scores any Stellar G... wallet address 0-100 using 8 Horizon API signals plus real-time OFAC sanctions screening. Any application pays $0.003 USDC via x402 on Stellar pubnet and receives a JSON score response instantly.

## Quick Start

### 1. Free Test — No Payment Required

```bash
curl -s https://nulucre.com/reputation/stellar/GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24 -H "x-payment: test"
```

### 2. Check Service Health

```bash
curl -s https://nulucre.com/health
```

### 3. Get a 402 Payment Challenge

```bash
curl -s https://nulucre.com/reputation/stellar/{YOUR_G_ADDRESS}
```

Returns HTTP 402 with 6 payment options in USDC, EURC, MXNT, NGNT, ARST, or BRL on Stellar pubnet.

## Score Response Schema

Full schema available at:
https://nulucre.com/schema/v1/stellar-reputation.json

Example response:
```json
{
  "wallet": "GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24",
  "network": "stellar:pubnet",
  "score": 56,
  "status": "CAUTION",
  "breakdown": {
    "accountAge": { "score": 22, "raw": "314 days" },
    "txVolume": { "score": 18, "raw": "200 transactions" },
    "assetDiversity": { "score": 8, "raw": "2 assets held" },
    "dexParticipation": { "score": 3, "raw": "2 DEX trades" },
    "networkTrust": { "score": 7, "raw": "0 trustlines" },
    "claimableActivity": { "score": 5, "raw": "6 claimable balances" },
    "sorobanUsage": { "score": 0, "raw": "0 contract interactions" },
    "liquidityPools": { "score": 0, "raw": "0 LP interactions" },
    "spamPenalty": { "score": -5, "raw": "56% spam ratio" },
    "sanctionsCheck": { "score": 0, "raw": "CLEAR", "source": "OFAC/UN/EU SDN" }
  },
  "dataSource": "Horizon API + Stellar Expert + OFAC Sanctions Screening",
  "timestamp": "2026-05-27T05:22:28.000Z"
}
```

## Score Tiers

| Score | Status | Meaning |
|-------|--------|---------|
| 80-100 | TRUSTED | Established wallet with strong history |
| 60-79 | VERIFIED | Good standing with moderate activity |
| 40-59 | CAUTION | Limited history or mixed signals |
| 20-39 | RISKY | Low activity or concerning patterns |
| 0-19 | BLACKLISTED | Very new, suspicious, or sanctioned |

## Sanctions Check

Every score includes real-time screening against:
- OFAC Specially Designated Nationals (SDN)
- OFAC Non-SDN Consolidated List
- EU Financial Sanctions
- UN Security Council Sanctions

A sanctioned wallet automatically returns score 0 and status BLACKLISTED.

## Payment

All payments via x402 protocol on Stellar pubnet.

| Endpoint | Price |
|----------|-------|
| GET /reputation/stellar/{gAddress} | $0.003 USDC |
| GET /reputation/stellar/signed/{gAddress} | $0.010 USDC |

Accepted currencies: USDC, EURC, MXNT, NGNT, ARST, BRL

## JavaScript Example

```javascript
const response = await fetch(
  'https://nulucre.com/reputation/stellar/GYOURWALLETADDRESS',
  { headers: { 'x-payment': 'YOUR_X402_PAYMENT_PROOF' } }
);
const score = await response.json();

if (score.breakdown.sanctionsCheck.raw === 'SANCTIONED') {
  console.log('Wallet is sanctioned — block transaction');
} else if (score.score >= 80) {
  console.log('TRUSTED — auto approve');
} else if (score.score >= 60) {
  console.log('VERIFIED — approve with monitoring');
} else {
  console.log('CAUTION or below — manual review');
}
```

## Python Example

```python
import requests

url = "https://nulucre.com/reputation/stellar/GYOURWALLETADDRESS"
headers = {"x-payment": "YOUR_X402_PAYMENT_PROOF"}

response = requests.get(url, headers=headers)
score = response.json()

print(f"Score: {score['score']}")
print(f"Status: {score['status']}")
print(f"Sanctions: {score['breakdown']['sanctionsCheck']['raw']}")
```

## Discovery

Nulucre is discoverable by AI agents via:
- https://nulucre.com/.well-known/x402.json
- https://nulucre.com/.well-known/agent.json
- https://nulucre.com/openapi.json

## Links

- Website: https://nulucre.com
- GitHub: https://github.com/vjshaw/nulucre-agents
- Schema: https://nulucre.com/schema/v1/stellar-reputation.json
- Email: nulucreinc@gmail.com
- Email: info@nulucre.com
