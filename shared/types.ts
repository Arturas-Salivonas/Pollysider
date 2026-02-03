/**
 * Pollysider - Shared Type Definitions
 * Single source of truth for all data structures
 */

// ============================================================================
// POLYMARKET DATA TYPES
// ============================================================================

export interface PolymarketTrade {
  asset: string;              // ERC1155 token ID
  conditionId: string;        // Market condition ID
  eventSlug: string;          // Event slug for URL
  slug: string;               // Market slug
  title: string;              // Event title
  outcome: string;            // Human-readable outcome (e.g., "Yes", "No")
  outcomeIndex: number;       // 0 or 1
  price: number;              // Trade price (0.00-1.00)
  side: 'BUY' | 'SELL';      // Trade direction
  size: number;               // Trade size in shares
  timestamp: number;          // Unix timestamp (seconds)
  transactionHash: string;    // Polygon tx hash
  proxyWallet: string;        // User's proxy wallet address
  name?: string;              // Username (if available)
  profileImage?: string;      // Profile image URL
  pseudonym?: string;         // User pseudonym
  endDate?: Date | null;      // Market end date (if available)
}

// ============================================================================
// WALLET ANALYSIS
// ============================================================================

export interface WalletProfile {
  address: string;            // Wallet address
  txCount: number;            // Total transactions on Polygon
  ageHours: number | null;    // Wallet age in hours
  firstSeen: Date | null;     // First transaction timestamp
  balance: string;            // MATIC balance (formatted)
  fundingSource: string | null; // Address that funded this wallet
  isFresh: boolean;           // Less than 5 transactions
  isVerySuspicious: boolean;  // Less than 24 hours old
  createdAt: Date | null;     // Wallet creation date from Polymarket API
}

// ============================================================================
// DETECTION SIGNALS
// ============================================================================

export type SignalType = 
  | 'fresh_wallet'         // Wallet <5 transactions
  | 'very_new_wallet'      // Wallet <24 hours old
  | 'large_trade'          // Trade >$10K
  | 'unusual_sizing'       // Trade >2% of order book
  | 'niche_market';        // Low volume market

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DetectionSignal {
  type: SignalType;
  severity: SeverityLevel;
  description: string;
}

export interface SuspiciousActivity {
  isSuspicious: boolean;
  signals: DetectionSignal[];
  confidence: ConfidenceLevel;
  walletProfile: WalletProfile;
}

// ============================================================================
// ENRICHED TRADE (WHAT WE SEND TO FRONTEND)
// ============================================================================

export interface EnrichedTrade {
  // Original trade data
  trade: PolymarketTrade;
  
  // Wallet analysis
  wallet: WalletProfile;
  
  // Detection results
  detection: SuspiciousActivity;
  
  // Calculated fields
  tradeSizeUSD: number;       // Shares * price in USD
  timeAgo: string;            // "2 minutes ago"
  
  // URLs
  marketUrl: string;          // Link to Polymarket event
  profileUrl: string;         // Link to user profile
  
  // Metadata
  receivedAt: Date;           // When we received this trade
  id: string;                 // Unique identifier
}

// ============================================================================
// WEBSOCKET MESSAGES
// ============================================================================

export interface SocketMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface TradeMessage extends SocketMessage<EnrichedTrade> {
  type: 'trade';
}

export interface StatsMessage extends SocketMessage<SystemStats> {
  type: 'stats';
}

export interface ErrorMessage extends SocketMessage<{ message: string }> {
  type: 'error';
}

export type ClientMessage = TradeMessage | StatsMessage | ErrorMessage;

// ============================================================================
// SYSTEM STATS
// ============================================================================

export interface SystemStats {
  totalTrades: number;
  suspiciousTrades: number;
  detectionRate: number;      // Percentage
  connectedClients: number;
  uptime: number;             // Seconds
  lastTradeAt: Date | null;
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

export interface FilterConfig {
  minTradeSize: number;       // Minimum USD trade size
  maxWalletAge: number;       // Maximum wallet age in hours
  minConfidence: ConfidenceLevel;
  showOnlySuspicious: boolean;
  tradeSide?: 'ALL' | 'BUY' | 'SELL'; // Filter by trade direction
}

// ============================================================================
// CACHE ENTRY
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
