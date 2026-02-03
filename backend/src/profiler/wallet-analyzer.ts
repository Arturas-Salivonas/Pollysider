/**
 * Wallet Analyzer
 * Profiles wallets using ONLY Polymarket's API
 * 
 * No blockchain queries - pure Polymarket data
 * Smart caching, efficient queries, elegant error handling
 */

import type { WalletProfile, CacheEntry } from '../../../shared/types';
import { RateLimiter } from '../utils/rate-limiter';

export class WalletAnalyzer {
  private cache: Map<string, CacheEntry<WalletProfile>> = new Map();
  private readonly cacheTTL: number;
  private rateLimiter: RateLimiter;

  constructor(cacheTTL: number = 3600) {
    this.cacheTTL = cacheTTL * 1000; // Convert to milliseconds
    this.rateLimiter = new RateLimiter(250); // Max 4 requests/second
  }

  /**
   * Analyze wallet - returns cached if available
   */
  async analyzeWallet(address: string): Promise<WalletProfile> {
    // Check cache first
    const cached = this.getFromCache(address);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const profile = await this.fetchWalletProfile(address);
    
    // Cache it
    this.setCache(address, profile);
    
    return profile;
  }

  /**
   * Fetch wallet profile from Polymarket API ONLY
   */
  private async fetchWalletProfile(address: string): Promise<WalletProfile> {
    try {
      let polymarketTrades = 0;
      let firstPolymarketActivity: Date | null = null;
      let createdAt: Date | null = null;
      
      // Fetch wallet creation date from public profile API
      try {
        const profileResponse = await this.rateLimiter.execute(() =>
          fetch(
            `https://gamma-api.polymarket.com/public-profile?address=${address}`,
            { 
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(5000)
            }
          )
        );
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData && profileData.createdAt) {
            createdAt = new Date(profileData.createdAt);
          }
        }
      } catch (profileError) {
        // Profile fetch failed, will fall back to first trade timestamp
      }

      // Fetch Polymarket user activity (trade history) for trade count
      const response = await this.rateLimiter.execute(() =>
        fetch(
          `https://data-api.polymarket.com/activity?user=${address}&limit=500&sortBy=TIMESTAMP&sortDirection=ASC`,
          { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          }
        )
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          polymarketTrades = data.length;
          
          // Find oldest trade (data is already sorted ASC, so first item is oldest)
          const timestamps = data.map((trade: any) => trade.timestamp).filter(Boolean);
          
          if (timestamps.length > 0) {
            const oldestTimestamp = timestamps[0]; // First item (already sorted ASC)
            firstPolymarketActivity = new Date(oldestTimestamp * 1000);
            
            // If we don't have createdAt from profile, use first trade as fallback
            if (!createdAt) {
              createdAt = firstPolymarketActivity;
            }
          }
        }
      }

      // Calculate age (prefer createdAt from profile, fallback to first trade)
      let ageHours: number | null = null;
      let firstSeen: Date | null = createdAt || firstPolymarketActivity;

      if (createdAt) {
        const ageMs = Date.now() - createdAt.getTime();
        ageHours = ageMs / (1000 * 3600);
      } else if (polymarketTrades === 0) {
        // Brand new wallet - first trade ever
        ageHours = 0;
        firstSeen = new Date();
        createdAt = new Date();
      }

      const profile: WalletProfile = {
        address,
        txCount: polymarketTrades,
        ageHours,
        firstSeen,
        balance: '0', // Not available without blockchain query
        fundingSource: null,
        isFresh: polymarketTrades < 5,
        isVerySuspicious: ageHours !== null && ageHours < 24,
        createdAt
      };

      return profile;
    } catch (error) {
      console.error(`Failed to analyze wallet ${address}:`, error);
      
      // Return minimal profile on error
      return {
        address,
        txCount: 0,
        ageHours: null,
        firstSeen: null,
        balance: '0',
        fundingSource: null,
        isFresh: true,
        isVerySuspicious: false,
        createdAt: null
      };
    }
  }

  /**
   * Cache management
   */
  private getFromCache(address: string): WalletProfile | null {
    const entry = this.cache.get(address);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(address);
      return null;
    }

    return entry.data;
  }

  private setCache(address: string, profile: WalletProfile): void {
    const entry: CacheEntry<WalletProfile> = {
      data: profile,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheTTL
    };
    
    this.cache.set(address, entry);
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    };
  }
}
