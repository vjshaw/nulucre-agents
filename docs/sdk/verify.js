/**
 * Nulucre Stellar Reputation Score Verification SDK
 * Verifies ECDSA-P256 signed scores from Nulucre
 * No dependencies required — uses Node.js built-in crypto
 * 
 * GitHub: https://github.com/vjshaw/nulucre-agents
 * Docs: https://nulucre.com/docs/integration-guide.md
 */

const crypto = require('crypto');

/**
 * Fetch the Nulucre public key from JWKS endpoint
 * @returns {Promise<string>} PEM formatted public key
 */
async function getNulucrePublicKey() {
  const response = await fetch('https://nulucre.com/.well-known/jwks.json');
  const jwks = await response.json();
  const key = jwks.keys[0];
  // Convert JWK to PEM format
  const keyObj = crypto.createPublicKey({ key, format: 'jwk' });
  return keyObj.export({ type: 'spki', format: 'pem' });
}

/**
 * Request a signed Stellar wallet reputation score
 * @param {string} gAddress - Stellar G... wallet address
 * @param {string} paymentProof - x402 payment proof header
 * @returns {Promise<object>} Signed score response
 */
async function getSignedScore(gAddress, paymentProof) {
  const response = await fetch(
    `https://nulucre.com/reputation/stellar/signed/${gAddress}`,
    { headers: { 'x-payment': paymentProof } }
  );
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Verify a Nulucre signed score
 * @param {object} signedScore - The signed score response from Nulucre
 * @returns {boolean} True if signature is valid
 */
async function verifyScore(signedScore) {
  try {
    const { score, wallet, timestamp, signature } = signedScore;
    
    // Reconstruct the signed payload
    const payload = JSON.stringify({ score, wallet, timestamp });
    
    // Get Nulucre public key
    const publicKey = await getNulucrePublicKey();
    
    // Verify ECDSA-P256 signature
    const verify = crypto.createVerify('SHA256');
    verify.update(payload);
    const isValid = verify.verify(publicKey, signature, 'base64');
    
    return isValid;
  } catch (err) {
    console.error('Verification error:', err.message);
    return false;
  }
}

/**
 * Full example — get and verify a signed score
 * @param {string} gAddress - Stellar G... wallet address
 */
async function scoreAndVerify(gAddress) {
  console.log(`Scoring Stellar wallet: ${gAddress}`);
  console.log('Note: In production pass a real x402 payment proof');
  
  // For testing use x-payment: test header
  const response = await fetch(
    `https://nulucre.com/reputation/stellar/signed/${gAddress}`,
    { headers: { 'x-payment': 'test' } }
  );
  
  const data = await response.json();
  
  console.log('\nScore Response:');
  console.log(`  Wallet:   ${data.wallet}`);
  console.log(`  Score:    ${data.score}`);
  console.log(`  Status:   ${data.status}`);
  console.log(`  Sanctions: ${data.breakdown?.sanctionsCheck?.raw}`);
  
  if (data.signature) {
    const valid = await verifyScore(data);
    console.log(`  Signature Valid: ${valid}`);
  } else {
    console.log('  No signature — use /signed/ endpoint for verification');
  }
  
  return data;
}

// Decision logic based on score
function makeDecision(scoreData) {
  const { score, status, breakdown } = scoreData;
  
  // Hard block — sanctioned wallet
  if (breakdown?.sanctionsCheck?.raw === 'SANCTIONED') {
    return { action: 'BLOCK', reason: 'Wallet appears on OFAC/UN/EU sanctions list' };
  }
  
  // Score-based decisions
  if (score >= 80) return { action: 'APPROVE', reason: 'TRUSTED wallet' };
  if (score >= 60) return { action: 'APPROVE', reason: 'VERIFIED wallet' };
  if (score >= 40) return { action: 'REVIEW', reason: 'CAUTION — limited history' };
  if (score >= 20) return { action: 'BLOCK', reason: 'RISKY wallet' };
  return { action: 'BLOCK', reason: 'BLACKLISTED wallet' };
}

// Run example
const testWallet = 'GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24';

scoreAndVerify(testWallet).then(data => {
  const decision = makeDecision(data);
  console.log('\nDecision:');
  console.log(`  Action: ${decision.action}`);
  console.log(`  Reason: ${decision.reason}`);
}).catch(console.error);

module.exports = { getSignedScore, verifyScore, makeDecision, getNulucrePublicKey };
