module.exports = {
  apps: [{
    name: 'reputation-oracle',
    script: '/root/agents/reputation-oracle/server.cjs',
    cwd: '/root/agents/reputation-oracle',
    env: {
      PORT_ORACLE: '3010'
    }
  }]
}
