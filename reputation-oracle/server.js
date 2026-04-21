const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// FREE TEST ENDPOINT - no payment required
app.get('/reputation/0x000000000000000000000000000000000000TEST', (req, res) => {
  res.json({
    wallet: '0x000000000000000000000000000000000000TEST',
    score: 75,
    status: 'TRUSTED',
    breakdown: {
      walletAge: { score: 25, raw: '365 days' },
      txVolume: { score: 30, raw: '150 txs' },
      contractInteractions: { score: 20, raw: '45 contracts' }
    },
    note: 'This is a free test response. Query a real wallet address for live scoring.',
    pricing: '$0.001 USDC via x402 for real queries',
    chains: ['ethereum', 'base', 'polygon'],
    timestamp: new Date().toISOString()
  });
});
const PORT = process.env.PORT_ORACLE || 3001;
const WALLET = process.env.WALLET_ADDRESS || '0xYourWallet';
function gate(price) {
  return async (req, res, next) => {
    if (!req.headers['x-payment']) {
      return res.status(402).json({
        error: 'Payment Required',
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'base-mainnet',
          maxAmountRequired: (parseFloat(price) * 1e6).toString(),
          resource: req.path,
          description: `Reputation Query - $${price} USDC`,
          payTo: WALLET,
          maxTimeoutSeconds: 300,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
        },
        {
          scheme: 'exact',
          network: 'stellar:pubnet',
          maxAmountRequired: (parseFloat(price) * 1e7).toString(),
          resource: req.path,
          description: `Reputation Query - $${price} USDC on Stellar`,
          payTo: process.env.STELLAR_ADDRESS,
          maxTimeoutSeconds: 300,
          asset: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
          outputSchema: {
            input: { type: 'object', properties: { wallet: { type: 'string', description: 'EVM wallet address (0x...)' } }, required: ['wallet'] },
            output: { type: 'object', properties: { score: { type: 'number' }, status: { type: 'string' }, breakdown: { type: 'object' }, chains: { type: 'array' }, proof: { type: 'object' } } }
          }
        }]
      });
    }
    next();
  };
}
async function getScore(wallet) {
  const key = process.env.ETHERSCAN_API_KEY;
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`;
  const r = await axios.get(url);
  const list = Array.isArray(r.data.result) ? r.data.result : [];
  const txCount = list.length;
  let ageInDays = 0;
  if (txCount > 0 && list[0]?.timeStamp) {
    ageInDays = (Date.now() - parseInt(list[0].timeStamp) * 1000) / 86400000;
  }
  const ageScore = Math.min(ageInDays / 365 * 30, 30);
  const txScore = Math.min(Math.log10(txCount + 1) * 10, 40);
  const score = Math.max(0, Math.min(100, Math.round(ageScore + txScore)));
  const status = score>=80?'TRUSTED':score>=60?'VERIFIED':score>=40?'CAUTION':score>=20?'RISKY':'BLACKLISTED';
  return { wallet, score, status, breakdown: { walletAge: { score: Math.round(ageScore), raw: Math.round(ageInDays) + ' days' }, txVolume: { score: Math.round(txScore), raw: txCount + ' txs' } }, timestamp: new Date().toISOString() };
}
app.get('/reputation/', (req, res) => res.json({ service: 'Reputation Oracle', usage: 'GET /reputation/{wallet}', price: '$0.001 USDC' }));
app.get('/health', (req, res) => res.json({ status: 'online', service: 'Reputation Oracle' }));
app.get('/reputation/:wallet', gate('0.001'), async (req, res) => {
  const { wallet } = req.params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return res.status(400).json({ error: 'Invalid wallet' });
  try { res.json(await getFullScoreV3(wallet)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.listen(PORT, () => console.log(`Reputation Oracle running on :${PORT}`));

async function fetchDebankData(wallet) {
  const apiKey = process.env.DEBANK_API_KEY;
  if (!apiKey) return { protocolCount: 0 };
  try {
    const res = await axios.get(
      `https://pro-openapi.debank.com/v1/user/used_chain_list?id=${wallet}`,
      { headers: { 'AccessKey': apiKey } }
    );
    return { protocolCount: res.data?.length || 0 };
  } catch { return { protocolCount: 0 }; }
}

async function getScoreWithDebank(wallet) {
  const [ethData, debankData] = await Promise.allSettled([
    getScore(wallet),
    getDeFiActivity(wallet)
  ]);
  const base = ethData.status === 'fulfilled' ? ethData.value : { score: 0, status: 'RISKY', breakdown: {} };
  const debank = debankData.status === 'fulfilled' ? debankData.value : { protocolCount: 0 };
  const defiScore = Math.min(debank.protocolCount * 2, 20);
  const finalScore = Math.max(0, Math.min(100, base.score + defiScore));
  const status = finalScore>=80?'TRUSTED':finalScore>=60?'VERIFIED':finalScore>=40?'CAUTION':finalScore>=20?'RISKY':'BLACKLISTED';
  return {
    ...base,
    score: finalScore,
    status,
    breakdown: {
      ...base.breakdown,
      defiActivity: { score: defiScore, raw: debank.protocolCount + ' protocols' }
    }
  };
}

async function fetchBaseData(wallet) {
  const key = process.env.ETHERSCAN_API_KEY;
  try {
    const url = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`;
    const r = await axios.get(url);
    const list = Array.isArray(r.data.result) ? r.data.result : [];
    return { baseTxCount: list.length };
  } catch { return { baseTxCount: 0 }; }
}

async function getFullScore(wallet) {
  const [baseScore, baseData] = await Promise.allSettled([
    getScoreWithDebank(wallet),
    fetchBaseData(wallet)
  ]);
  const base = baseScore.status === 'fulfilled' ? baseScore.value : { score: 0, status: 'RISKY', breakdown: {} };
  const baseChain = baseData.status === 'fulfilled' ? baseData.value : { baseTxCount: 0 };
  const baseTxScore = Math.min(Math.log10(baseChain.baseTxCount + 1) * 5, 10);
  const finalScore = Math.max(0, Math.min(100, base.score + baseTxScore));
  const status = finalScore>=80?'TRUSTED':finalScore>=60?'VERIFIED':finalScore>=40?'CAUTION':finalScore>=20?'RISKY':'BLACKLISTED';
  return {
    ...base,
    score: finalScore,
    status,
    breakdown: {
      ...base.breakdown,
      baseActivity: { score: Math.round(baseTxScore), raw: baseChain.baseTxCount + ' base txs' }
    }
  };
}

async function fetchMoralisData(wallet) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) return { protocolCount: 0 };
  try {
    const res = await axios.get(
      `https://deep-index.moralis.io/api/v2.2/wallets/${wallet}/defi/summary?chain=eth`,
      { headers: { 'X-API-Key': apiKey } }
    );
    const protocols = res.data?.active_protocols || 0;
    return { protocolCount: protocols };
  } catch { return { protocolCount: 0 }; }
}

async function getDeFiActivity(wallet) {
  const debank = await fetchDebankData(wallet);
  if (debank.protocolCount > 0) return debank;
  const moralis = await fetchMoralisData(wallet);
  return moralis;
}

async function fetchAlchemyData(wallet) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return { alchemyTxCount: 0, chainCount: 0 };
  try {
    const chains = [
      { name: 'polygon', url: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}` },
      { name: 'arbitrum', url: `https://arb-mainnet.g.alchemy.com/v2/${apiKey}` },
      { name: 'optimism', url: `https://opt-mainnet.g.alchemy.com/v2/${apiKey}` }
    ];
    const results = await Promise.allSettled(
      chains.map(chain =>
        axios.post(chain.url, {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionCount',
          params: [wallet, 'latest']
        })
      )
    );
    let alchemyTxCount = 0;
    let chainCount = 0;
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const count = parseInt(r.value.data.result, 16) || 0;
        if (count > 0) { alchemyTxCount += count; chainCount++; }
      }
    });
    return { alchemyTxCount, chainCount };
  } catch { return { alchemyTxCount: 0, chainCount: 0 }; }
}

async function getFullScoreV2(wallet) {
  const [ethData, debankData, baseData, alchemyData] = await Promise.allSettled([
    fetchEtherscanData(wallet),
    getDeFiActivity(wallet),
    fetchBaseData(wallet),
    fetchAlchemyData(wallet)
  ]);
  const eth = ethData.status === 'fulfilled' ? ethData.value : { txCount: 0, ageInDays: 0 };
  const defi = debankData.status === 'fulfilled' ? debankData.value : { protocolCount: 0 };
  const base = baseData.status === 'fulfilled' ? baseData.value : { baseTxCount: 0 };
  const alchemy = alchemyData.status === 'fulfilled' ? alchemyData.value : { alchemyTxCount: 0, chainCount: 0 };
  const ageScore = Math.min(eth.ageInDays / 365 * 30, 30);
  const txScore = Math.min(Math.log10(eth.txCount + 1) * 10, 40);
  const defiScore = Math.min(defi.protocolCount * 2, 20);
  const baseScore = Math.min(Math.log10(base.baseTxCount + 1) * 5, 10);
  const chainScore = Math.min(alchemy.chainCount * 2, 6);
  const multiScore = Math.min(Math.log10(alchemy.alchemyTxCount + 1) * 2, 4);
  const rawScore = ageScore + txScore + defiScore + baseScore + chainScore + multiScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const status = finalScore>=80?'TRUSTED':finalScore>=60?'VERIFIED':finalScore>=40?'CAUTION':finalScore>=20?'RISKY':'BLACKLISTED';
  return {
    wallet, score: finalScore, status,
    breakdown: {
      walletAge: { score: Math.round(ageScore), raw: Math.round(eth.ageInDays) + ' days' },
      txVolume: { score: Math.round(txScore), raw: eth.txCount + ' txs' },
      defiActivity: { score: Math.round(defiScore), raw: defi.protocolCount + ' protocols' },
      baseActivity: { score: Math.round(baseScore), raw: base.baseTxCount + ' base txs' },
      multiChain: { score: Math.round(chainScore + multiScore), raw: alchemy.chainCount + ' chains active' }
    },
    chains: ['ethereum', 'base', 'polygon', 'arbitrum', 'optimism'],
    timestamp: new Date().toISOString()
  };
}

async function fetchEtherscanData(wallet) {
  const key = process.env.ETHERSCAN_API_KEY;
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`;
  try {
    const r = await axios.get(url);
    const list = Array.isArray(r.data.result) ? r.data.result : [];
    const txCount = list.length;
    let ageInDays = 0;
    if (txCount > 0 && list[0]?.timeStamp) {
      ageInDays = (Date.now() - parseInt(list[0].timeStamp) * 1000) / 86400000;
    }
    return { txCount, ageInDays };
  } catch { return { txCount: 0, ageInDays: 0 }; }
}

const crypto = require('crypto');
const fs = require('fs');

function signScore(scoreData) {
  try {
    const keyPath = process.env.NULUCRE_PRIVATE_KEY_PATH;
    if (!keyPath) return null;
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const payload = JSON.stringify({
      wallet: scoreData.wallet,
      score: scoreData.score,
      status: scoreData.status,
      timestamp: scoreData.timestamp
    });
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    const signature = sign.sign(privateKey, 'base64');
    return {
      signature,
      algorithm: 'ECDSA-P256',
      signedBy: 'nulucre.com',
      verifyAt: 'https://nulucre.com/.well-known/jwks.json',
      payload: Buffer.from(payload).toString('base64')
    };
  } catch { return null; }
}

app.get('/reputation/signed/:wallet', gate('0.01'), async (req, res) => {
  const { wallet } = req.params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  try {
    const score = await getFullScoreV3(wallet);
    const proof = signScore(score);
    res.json({ ...score, proof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchAnkrData(wallet) {
  const apiKey = process.env.ANKR_API_KEY;
  if (!apiKey) return { ankrChainCount: 0, ankrTxCount: 0 };
  try {
    const res = await axios.post(
      `https://rpc.ankr.com/multichain/${apiKey}`,
      {
        jsonrpc: '2.0',
        method: 'ankr_getAccountBalance',
        params: {
          walletAddress: wallet,
          onlyWhitelisted: false
        },
        id: 1
      }
    );
    const assets = res.data?.result?.assets || [];
    const activeChains = new Set(assets.map(a => a.blockchain)).size;
    return { ankrChainCount: activeChains, ankrTxCount: assets.length };
  } catch { return { ankrChainCount: 0, ankrTxCount: 0 }; }
}

async function getFullScoreV3(wallet) {
  const [ethData, debankData, baseData, alchemyData, ankrData] = await Promise.allSettled([
    fetchEtherscanData(wallet),
    getDeFiActivity(wallet),
    fetchBaseData(wallet),
    fetchAlchemyData(wallet),
    fetchAnkrData(wallet)
  ]);
  const eth = ethData.status === 'fulfilled' ? ethData.value : { txCount: 0, ageInDays: 0 };
  const defi = debankData.status === 'fulfilled' ? debankData.value : { protocolCount: 0 };
  const base = baseData.status === 'fulfilled' ? baseData.value : { baseTxCount: 0 };
  const alchemy = alchemyData.status === 'fulfilled' ? alchemyData.value : { alchemyTxCount: 0, chainCount: 0 };
  const ankr = ankrData.status === 'fulfilled' ? ankrData.value : { ankrChainCount: 0, ankrTxCount: 0 };

  const ageScore = Math.min(eth.ageInDays / 365 * 30, 30);
  const txScore = Math.min(Math.log10(eth.txCount + 1) * 10, 40);
  const defiScore = Math.min(defi.protocolCount * 2, 20);
  const baseScore = Math.min(Math.log10(base.baseTxCount + 1) * 5, 10);
  const alchemyChainScore = Math.min(alchemy.chainCount * 2, 6);
  const alchemyTxScore = Math.min(Math.log10(alchemy.alchemyTxCount + 1) * 2, 4);
  const ankrScore = Math.min(ankr.ankrChainCount * 1.5, 10);

  const rawScore = ageScore + txScore + defiScore + baseScore + alchemyChainScore + alchemyTxScore + ankrScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const status = finalScore>=80?'TRUSTED':finalScore>=60?'VERIFIED':finalScore>=40?'CAUTION':finalScore>=20?'RISKY':'BLACKLISTED';

  return {
    wallet, score: finalScore, status,
    breakdown: {
      walletAge: { score: Math.round(ageScore), raw: Math.round(eth.ageInDays) + ' days' },
      txVolume: { score: Math.round(txScore), raw: eth.txCount + ' txs' },
      defiActivity: { score: Math.round(defiScore), raw: defi.protocolCount + ' protocols' },
      baseActivity: { score: Math.round(baseScore), raw: base.baseTxCount + ' base txs' },
      multiChain: { score: Math.round(alchemyChainScore + alchemyTxScore), raw: alchemy.chainCount + ' EVM chains' },
      ankrCoverage: { score: Math.round(ankrScore), raw: ankr.ankrChainCount + ' chains with assets' }
    },
    chains: ['ethereum', 'base', 'polygon', 'arbitrum', 'optimism', 'ankr-81-chains'],
    timestamp: new Date().toISOString()
  };
}

// ============================================
// STELLAR NATIVE WALLET SCORING — TRANCHE 1
// ============================================

async function fetchStellarHorizonData(gAddress) {
  try {
    const [accountRes, txRes, opsRes] = await Promise.allSettled([
      axios.get(`https://horizon.stellar.org/accounts/${gAddress}`, { timeout: 10000 }),
      axios.get(`https://horizon.stellar.org/accounts/${gAddress}/transactions?limit=200&order=asc`, { timeout: 10000 }),
      axios.get(`https://horizon.stellar.org/accounts/${gAddress}/operations?limit=200`, { timeout: 10000 })
    ]);

    const account = accountRes.status === 'fulfilled' ? accountRes.value.data : null;
    const txs = txRes.status === 'fulfilled' ? txRes.value.data?._embedded?.records || [] : [];
    const ops = opsRes.status === 'fulfilled' ? opsRes.value.data?._embedded?.records || [] : [];

    if (!account) return null;

    const createdAt = txs.length > 0 ? new Date(txs[0].created_at) : new Date();
    const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const txCount = txs.length;
    const opCount = ops.length;
    const balances = account.balances || [];
    const assetCount = balances.filter(b => b.asset_type !== 'native').length;
    const xlmBalance = parseFloat(balances.find(b => b.asset_type === 'native')?.balance || '0');
    const subentryCount = account.subentry_count || 0;
    const lastModified = account.last_modified_time || null;

    return { ageInDays, txCount, opCount, assetCount, xlmBalance, subentryCount, lastModified };
  } catch { return null; }
}

async function fetchStellarExpertData(gAddress) {
  try {
    const res = await axios.get(
      `https://api.stellar.expert/explorer/public/account/${gAddress}`,
      { timeout: 10000 }
    );
    const data = res.data || {};
    const trades = data.trades || 0;
    const payments = data.payments || 0;
    const trustlines = data.trustlines || 0;
    return { trades, payments, trustlines };
  } catch { return { trades: 0, payments: 0, trustlines: 0 }; }
}

async function getStellarScore(gAddress) {
  if (!gAddress || !gAddress.startsWith('G') || gAddress.length !== 56) {
    throw new Error('Invalid Stellar address — must start with G and be 56 characters');
  }

  const [horizonData, expertData] = await Promise.allSettled([
    fetchStellarHorizonData(gAddress),
    fetchStellarExpertData(gAddress)
  ]);

  const horizon = horizonData.status === 'fulfilled' && horizonData.value ? horizonData.value : {
    ageInDays: 0, txCount: 0, opCount: 0, assetCount: 0, xlmBalance: 0, subentryCount: 0
  };
  const expert = expertData.status === 'fulfilled' ? expertData.value : { trades: 0, payments: 0, trustlines: 0 };

  // SCORING ALGORITHM
  // Account Age — max 25 points
  const ageScore = Math.min(horizon.ageInDays / 365 * 25, 25);

  // Transaction Volume — max 25 points
  const txScore = Math.min(Math.log10(horizon.txCount + 1) * 8, 25);

  // Asset Diversity — max 20 points
  const assetScore = Math.min(horizon.assetCount * 4, 20);

  // DEX Participation — max 15 points
  const dexScore = Math.min(expert.trades * 1.5, 15);

  // Network Trust Score — max 15 points
  const trustScore = Math.min(
    (expert.trustlines * 2) + (horizon.xlmBalance > 10 ? 5 : 0) + (horizon.subentryCount * 1),
    15
  );

  const rawScore = ageScore + txScore + assetScore + dexScore + trustScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const status = finalScore>=80?'TRUSTED':finalScore>=60?'VERIFIED':finalScore>=40?'CAUTION':finalScore>=20?'RISKY':'BLACKLISTED';

  return {
    wallet: gAddress,
    network: 'stellar:pubnet',
    score: finalScore,
    status,
    breakdown: {
      accountAge: { score: Math.round(ageScore), raw: horizon.ageInDays + ' days' },
      txVolume: { score: Math.round(txScore), raw: horizon.txCount + ' transactions' },
      assetDiversity: { score: Math.round(assetScore), raw: horizon.assetCount + ' assets held' },
      dexParticipation: { score: Math.round(dexScore), raw: expert.trades + ' DEX trades' },
      networkTrust: { score: Math.round(trustScore), raw: expert.trustlines + ' trustlines' }
    },
    chains: ['stellar:pubnet'],
    dataSource: 'Horizon API + Stellar Expert',
    timestamp: new Date().toISOString()
  };
}

// STELLAR REPUTATION ENDPOINT
app.get('/reputation/stellar/:gAddress', gate('0.003'), async (req, res) => {
  try {
    const { gAddress } = req.params;
    const score = await getStellarScore(gAddress);
    res.json(score);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// STELLAR FREE TEST ENDPOINT
app.get('/reputation/stellar/GTEST00000000000000000000000000000000000000000000000000', (req, res) => {
  res.json({
    wallet: 'GTEST00000000000000000000000000000000000000000000000000',
    network: 'stellar:pubnet',
    score: 72,
    status: 'VERIFIED',
    breakdown: {
      accountAge: { score: 20, raw: '292 days' },
      txVolume: { score: 18, raw: '25 transactions' },
      assetDiversity: { score: 16, raw: '4 assets held' },
      dexParticipation: { score: 10, raw: '7 DEX trades' },
      networkTrust: { score: 8, raw: '3 trustlines' }
    },
    note: 'Free test response. Query a real G... address for live scoring.',
    chains: ['stellar:pubnet'],
    timestamp: new Date().toISOString()
  });
});


// STELLAR SIGNED REPUTATION ENDPOINT
app.get('/reputation/stellar/signed/:gAddress', gate('0.01'), async (req, res) => {
  try {
    const { gAddress } = req.params;
    const score = await getStellarScore(gAddress);
    const fs = require('fs');
    const crypto = require('crypto');
    const privateKey = fs.readFileSync(process.env.NULUCRE_PRIVATE_KEY_PATH || '/root/agents/nulucre-private.pem', 'utf8');
    const payload = {
      wallet: score.wallet,
      network: score.network,
      score: score.score,
      status: score.status,
      timestamp: score.timestamp
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const sign = crypto.createSign('SHA256');
    sign.update(payloadB64);
    const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64');
    res.json({
      ...score,
      proof: {
        signature,
        algorithm: 'ECDSA-P256',
        signedBy: 'nulucre.com',
        verifyAt: 'https://nulucre.com/.well-known/jwks.json',
        payload: payloadB64
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

