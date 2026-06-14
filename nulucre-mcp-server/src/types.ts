// Shared TypeScript interfaces for Nulucre API responses

export interface SignalBreakdownEntry {
  score: number;
  raw: string;
  source?: string;
}

export interface SanctionsCheck {
  score: number;
  raw: "CLEAR" | "SANCTIONED" | "UNCHECKED";
  source: string;
}

export interface StellarScoreBreakdown {
  accountAge: SignalBreakdownEntry;
  txVolume: SignalBreakdownEntry;
  assetDiversity: SignalBreakdownEntry;
  dexParticipation: SignalBreakdownEntry;
  networkTrust: SignalBreakdownEntry;
  claimableActivity: SignalBreakdownEntry;
  sorobanUsage: SignalBreakdownEntry;
  liquidityPools: SignalBreakdownEntry;
  spamPenalty: SignalBreakdownEntry;
  sanctionsCheck: SanctionsCheck;
}

export interface StellarScoreResponse {
  wallet: string;
  network: "stellar:pubnet";
  score: number;
  status: "TRUSTED" | "VERIFIED" | "CAUTION" | "RISKY" | "BLACKLISTED";
  breakdown: StellarScoreBreakdown;
  dataSource: string;
  timestamp: string;
  signature?: string;
}

export interface EvmScoreBreakdownEntry {
  score: number;
  raw: string;
}

export interface EvmScoreResponse {
  wallet: string;
  score: number;
  status: "TRUSTED" | "VERIFIED" | "CAUTION" | "RISKY" | "BLACKLISTED";
  breakdown: Record<string, EvmScoreBreakdownEntry>;
  chains?: string[];
  dataSource: string;
  timestamp: string;
  signature?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface PaymentRequiredResponse {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  [key: string]: unknown;
}
