# Nulucre Signed Score Format

## Overview

Every signed score endpoint returns an ECDSA-P256 
cryptographic signature. Any developer can verify 
the score independently without trusting Nulucre.

## Signed Endpoints

GET /reputation/stellar/signed/{gAddress} — $0.01 USDC
GET /reputation/signed/{wallet} — $0.01 USDC

## Signature Fields

Every signed response includes these additional fields:

```json
{
  "wallet": "GCRUBFDANV52JP3...",
  "score": 56,
  "status": "CAUTION",
  "timestamp": "2026-05-27T05:22:28.000Z",
  "signature": "base64_encoded_ecdsa_signature",
  "breakdown": { ... }
}
```

## How to Verify

1. Fetch public key from:
   https://nulucre.com/.well-known/jwks.json

2. Reconstruct the signed payload:
   JSON.stringify({ score, wallet, timestamp })

3. Verify ECDSA-P256 signature against payload

## Public Key Endpoint

https://nulucre.com/.well-known/jwks.json

Algorithm: ECDSA-P256 (ES256)
Signed by: nulucre.com

## Verification SDK

JavaScript: https://nulucre.com/docs/sdk/verify.js
Python: https://nulucre.com/docs/sdk/verify.py
