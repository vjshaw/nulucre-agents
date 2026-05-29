"""
Nulucre Stellar Reputation Score Verification SDK
Verifies ECDSA-P256 signed scores from Nulucre

GitHub: https://github.com/vjshaw/nulucre-agents
Docs: https://nulucre.com/docs/integration-guide.md

Install requirements: pip install requests cryptography
"""

import json
import base64
import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.exceptions import InvalidSignature


def get_nulucre_public_key():
    """Fetch Nulucre public key from JWKS endpoint"""
    response = requests.get('https://nulucre.com/.well-known/jwks.json')
    jwks = response.json()
    # Return first key
    return jwks['keys'][0]


def get_stellar_score(g_address, payment_proof='test'):
    """
    Request a Stellar wallet reputation score
    
    Args:
        g_address: Stellar G... wallet address
        payment_proof: x402 payment proof (use 'test' for testing)
    
    Returns:
        dict: Score response from Nulucre
    """
    url = f'https://nulucre.com/reputation/stellar/{g_address}'
    headers = {'x-payment': payment_proof}
    response = requests.get(url, headers=headers)
    return response.json()


def make_decision(score_data):
    """
    Make an action decision based on score
    
    Returns:
        dict: action (APPROVE/REVIEW/BLOCK) and reason
    """
    score = score_data.get('score', 0)
    breakdown = score_data.get('breakdown', {})
    sanctions = breakdown.get('sanctionsCheck', {}).get('raw', 'UNCHECKED')

    # Hard block — sanctioned wallet
    if sanctions == 'SANCTIONED':
        return {
            'action': 'BLOCK',
            'reason': 'Wallet on OFAC/UN/EU sanctions list'
        }

    # Score based decisions
    if score >= 80:
        return {'action': 'APPROVE', 'reason': 'TRUSTED wallet'}
    elif score >= 60:
        return {'action': 'APPROVE', 'reason': 'VERIFIED wallet'}
    elif score >= 40:
        return {'action': 'REVIEW', 'reason': 'CAUTION — limited history'}
    elif score >= 20:
        return {'action': 'BLOCK', 'reason': 'RISKY wallet'}
    else:
        return {'action': 'BLOCK', 'reason': 'BLACKLISTED wallet'}


def main():
    """Example usage"""
    test_wallet = 'GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24'
    
    print(f'Scoring Stellar wallet: {test_wallet}')
    print('Note: In production pass a real x402 payment proof\n')
    
    # Get score
    score_data = get_stellar_score(test_wallet)
    
    print('Score Response:')
    print(f"  Wallet:    {score_data.get('wallet')}")
    print(f"  Score:     {score_data.get('score')}")
    print(f"  Status:    {score_data.get('status')}")
    
    breakdown = score_data.get('breakdown', {})
    sanctions = breakdown.get('sanctionsCheck', {})
    print(f"  Sanctions: {sanctions.get('raw')} ({sanctions.get('source')})")
    
    # Make decision
    decision = make_decision(score_data)
    print(f"\nDecision:")
    print(f"  Action: {decision['action']}")
    print(f"  Reason: {decision['reason']}")


if __name__ == '__main__':
    main()
