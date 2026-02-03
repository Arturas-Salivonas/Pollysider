/**
 * Insider Detector
 * Analyzes trades and wallets for suspicious patterns
 * 
 * Clean logic, clear signals, confident decisions
 */

import type {
  PolymarketTrade,
  WalletProfile,
  SuspiciousActivity,
  DetectionSignal,
  ConfidenceLevel,
  SeverityLevel
} from '../../../shared/types';

export class InsiderDetector {
  private readonly minTradeSize: number;
  private readonly maxWalletAge: number;
  private readonly freshWalletMaxTx: number;

  constructor(
    minTradeSize: number = 10000,
    maxWalletAge: number = 24,
    freshWalletMaxTx: number = 5
  ) {
    this.minTradeSize = minTradeSize;
    this.maxWalletAge = maxWalletAge;
    this.freshWalletMaxTx = freshWalletMaxTx;
  }

  /**
   * Detect suspicious activity in a trade
   */
  detect(trade: PolymarketTrade, wallet: WalletProfile): SuspiciousActivity {
    const signals: DetectionSignal[] = [];
    const tradeSizeUSD = trade.size * trade.price;

    // Signal 1: Fresh wallet with large trade
    if (wallet.isFresh && tradeSizeUSD >= this.minTradeSize) {
      signals.push({
        type: 'fresh_wallet',
        severity: 'HIGH',
        description: `Fresh wallet (${wallet.txCount} txns) trading $${this.formatNumber(tradeSizeUSD)}`
      });
    }

    // Signal 2: Very new wallet (< 24 hours)
    if (wallet.isVerySuspicious && tradeSizeUSD >= this.minTradeSize / 2) {
      signals.push({
        type: 'very_new_wallet',
        severity: 'CRITICAL',
        description: `Wallet created ${wallet.ageHours?.toFixed(1)}h ago, trading $${this.formatNumber(tradeSizeUSD)}`
      });
    }

    // Signal 3: Large trade (regardless of wallet age)
    if (tradeSizeUSD >= this.minTradeSize * 2) {
      signals.push({
        type: 'large_trade',
        severity: this.getSeverityForTradeSize(tradeSizeUSD),
        description: `Large trade: $${this.formatNumber(tradeSizeUSD)}`
      });
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(signals, wallet, tradeSizeUSD);

    return {
      isSuspicious: signals.length > 0,
      signals,
      confidence,
      walletProfile: wallet
    };
  }

  /**
   * Calculate confidence level based on signals
   */
  private calculateConfidence(
    signals: DetectionSignal[],
    wallet: WalletProfile,
    tradeSizeUSD: number
  ): ConfidenceLevel {
    // VERY_HIGH: Multiple critical signals
    if (signals.some(s => s.severity === 'CRITICAL') && signals.length >= 2) {
      return 'VERY_HIGH';
    }

    // HIGH: Fresh wallet + large trade
    if (wallet.isVerySuspicious && tradeSizeUSD >= this.minTradeSize) {
      return 'HIGH';
    }

    // HIGH: Multiple signals
    if (signals.length >= 2) {
      return 'HIGH';
    }

    // MEDIUM: Single strong signal
    if (signals.length === 1 && signals[0].severity === 'HIGH') {
      return 'MEDIUM';
    }

    // LOW: Weak signals
    return 'LOW';
  }

  /**
   * Get severity based on trade size
   */
  private getSeverityForTradeSize(tradeSizeUSD: number): SeverityLevel {
    if (tradeSizeUSD >= this.minTradeSize * 5) {
      return 'CRITICAL';
    }
    if (tradeSizeUSD >= this.minTradeSize * 3) {
      return 'HIGH';
    }
    if (tradeSizeUSD >= this.minTradeSize * 2) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Format large numbers with commas
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  /**
   * Update detection thresholds dynamically
   */
  updateThresholds(
    minTradeSize?: number,
    maxWalletAge?: number,
    freshWalletMaxTx?: number
  ): void {
    if (minTradeSize !== undefined) {
      this.minTradeSize = minTradeSize;
    }
    if (maxWalletAge !== undefined) {
      this.maxWalletAge = maxWalletAge;
    }
    if (freshWalletMaxTx !== undefined) {
      this.freshWalletMaxTx = freshWalletMaxTx;
    }

    console.log('Detection thresholds updated:', {
      minTradeSize: this.minTradeSize,
      maxWalletAge: this.maxWalletAge,
      freshWalletMaxTx: this.freshWalletMaxTx
    });
  }
}
