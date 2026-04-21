module.exports = {
  apps: [
    {
      name: 'reputation-oracle',
      script: '/root/agents/reputation-oracle/server.js',
      env: {
        PORT_ORACLE: 3010,
        WALLET_ADDRESS: '0xd97C122cB81894213C67Bcc774448955d09915bC',
        ETHERSCAN_API_KEY: 'HE73XSV7RA4PQNEC3AU99ZYBTQEJBMTP2M',
        DEBANK_API_KEY: '02add1dcc8f106b4ff390730a22eb4c96255c837',
        MORALIS_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImM5NzM4ZWRhLWEwZmQtNGRmZi1hNjI1LWMxNzE5NTE0YTAyOSIsIm9yZ0lkIjoiNTA2MDIxIiwidXNlcklkIjoiNTIwNjY0IiwidHlwZUlkIjoiMTBkMmNiOWMtNDQ0ZC00Mjg4LWJlMTYtZWQ1OWJhYjE3YzJhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzM4NTc0MDQsImV4cCI6NDkyOTYxNzQwNH0.4AEBKMIVNBGVydkVPgfxGZo69xyLHwDuGKJQsbWZafs',
        ALCHEMY_API_KEY: 'LV2IVvin2hWbC3Dm5iq0o',
        NULUCRE_PRIVATE_KEY_PATH: '/root/agents/nulucre-private.pem',
        ANKR_API_KEY: '57e4d6fe84db1737df8e4970fe97a1e1b565f359b8c607b48db32353f4e048c7',
        STELLAR_ADDRESS: 'GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24',
        STELLAR_FACILITATOR_KEY: '95a00fce-1550-42b8-b9a8-fd7ee936e958',
        CDP_API_KEY: 'organizations/97fd3395-4792-46d1-8c68-04b55662100a/apiKeys/2e20b5eb-9e29-4b8d-ba43-546acc36ef73'
      }
    },
    {
      name: 'fact-verification',
      script: '/root/agents/fact-verification/server.js',
      env: {
        PORT_VERIFY: 3011,
        STELLAR_ADDRESS: 'GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24',
        STELLAR_FACILITATOR_KEY: '95a00fce-1550-42b8-b9a8-fd7ee936e958',
        WALLET_ADDRESS: '0xd97C122cB81894213C67Bcc774448955d09915bC'
      }
    }
  ]
}
