import {
  StellarScoreResponse,
  EvmScoreResponse,
  PaymentRequiredResponse,
} from "../types.js";

export function isPaymentRequired(
  data: unknown
): data is PaymentRequiredResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "maxAmountRequired" in data &&
    "payTo" in data
  );
}

/**
 * Format a 402 Payment Required response into a human-readable
 * explanation, since this is the response an unpaid agent will
 * receive from the live Nulucre endpoints.
 */
export function formatPaymentRequiredMarkdown(
  data: PaymentRequiredResponse,
  wallet: string
): string {
  return `## Payment Required — HTTP 402

Nulucre's live wallet scoring endpoint requires a small x402 micropayment to return a full score for **${wallet}**.

- **Resource**: \`${data.resource}\`
- **Description**: ${data.description}
- **Network**: ${data.network}
- **Amount required**: ${data.maxAmountRequired} (smallest unit)
- **Pay to**: \`${data.payTo}\`
- **Asset**: \`${data.asset}\`
- **Timeout**: ${data.maxTimeoutSeconds} seconds

This MCP server queries Nulucre's free evaluation path, which is rate-limited. If you are seeing this response, the free evaluation quota may be temporarily exhausted, or the endpoint is enforcing standard x402 payment for this request.

To pay for a full score, send the required amount via the x402 protocol on the specified network to the \`payTo\` address, then retry the request with a valid \`x-payment\` proof header.

Full integration guide: https://nulucre.com/docs/integration-guide.md`;
}

/**
 * Format a Stellar wallet score response as Markdown.
 */
export function formatStellarScoreMarkdown(
  data: StellarScoreResponse
): string {
  const b = data.breakdown;
  const sanctionsLine =
    b.sanctionsCheck.raw === "SANCTIONED"
      ? `🛑 **SANCTIONED** — this wallet matched the ${b.sanctionsCheck.source} list. Score forced to 0.`
      : b.sanctionsCheck.raw === "CLEAR"
        ? `✅ **CLEAR** — no match against ${b.sanctionsCheck.source}.`
        : `⚠️ **UNCHECKED** — sanctions screening unavailable for this query.`;

  return `## Stellar Wallet Reputation — ${data.wallet}

**Score: ${data.score}/100 — ${data.status}**

${sanctionsLine}

### Signal Breakdown

| Signal | Score | Detail |
|---|---|---|
| Account Age | ${b.accountAge.score} | ${b.accountAge.raw} |
| Transaction Volume | ${b.txVolume.score} | ${b.txVolume.raw} |
| Asset Diversity | ${b.assetDiversity.score} | ${b.assetDiversity.raw} |
| SDEX DEX Participation | ${b.dexParticipation.score} | ${b.dexParticipation.raw} |
| Network Trust | ${b.networkTrust.score} | ${b.networkTrust.raw} |
| Claimable Balance Activity | ${b.claimableActivity.score} | ${b.claimableActivity.raw} |
| Soroban Contract Interactions | ${b.sorobanUsage.score} | ${b.sorobanUsage.raw} |
| Liquidity Pool Participation | ${b.liquidityPools.score} | ${b.liquidityPools.raw} |
| Spam Detection Penalty | ${b.spamPenalty.score} | ${b.spamPenalty.raw} |

**Data source**: ${data.dataSource}
**Timestamp**: ${data.timestamp}
**Network**: ${data.network}${data.signature ? `\n**Signature (ECDSA-P256)**: \`${data.signature}\`` : ""}

### Score Tiers
- 80-100 TRUSTED — established wallet with strong history
- 60-79 VERIFIED — good standing with moderate activity
- 40-59 CAUTION — limited history or mixed signals
- 20-39 RISKY — low activity or concerning patterns
- 0-19 BLACKLISTED — very new, suspicious, or sanctioned`;
}

/**
 * Format an EVM wallet score response as Markdown.
 */
export function formatEvmScoreMarkdown(data: EvmScoreResponse): string {
  const rows = Object.entries(data.breakdown)
    .map(([key, value]) => `| ${key} | ${value.score} | ${value.raw} |`)
    .join("\n");

  return `## EVM Wallet Reputation — ${data.wallet}

**Score: ${data.score}/100 — ${data.status}**

### Signal Breakdown

| Signal | Score | Detail |
|---|---|---|
${rows}

**Data source**: ${data.dataSource}
**Timestamp**: ${data.timestamp}${data.chains ? `\n**Chains**: ${data.chains.join(", ")}` : ""}${data.signature ? `\n**Signature (ECDSA-P256)**: \`${data.signature}\`` : ""}

### Score Tiers
- 80-100 TRUSTED — established wallet with strong history
- 60-79 VERIFIED — good standing with moderate activity
- 40-59 CAUTION — limited history or mixed signals
- 20-39 RISKY — low activity or concerning patterns
- 0-19 BLACKLISTED — very new, suspicious, or sanctioned`;
}
