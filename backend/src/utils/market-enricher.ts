/**
 * Market Data Enricher
 * Fetches additional market metadata from Polymarket APIs
 * Caches results to avoid redundant requests
 */

import type { CacheEntry } from '../../../shared/types';

interface MarketMetadata {
  slug: string;
  endDate: Date | null;
  description?: string;
  volume?: number;
}

export class MarketEnricher {
  private cache: Map<string, CacheEntry<MarketMetadata>> = new Map();
  private readonly cacheTTL = 600000; // 10 minutes
  private pendingRequests: Map<string, Promise<MarketMetadata>> = new Map();

  /**
   * Get market metadata (with caching)
   */
  async getMarketMetadata(slug: string): Promise<MarketMetadata> {
    // Check cache first
    const cached = this.getFromCache(slug);
    if (cached) {
      return cached;
    }

    // Check if request is already in flight
    const pending = this.pendingRequests.get(slug);
    if (pending) {
      return pending;
    }

    // Fetch fresh data
    const promise = this.fetchMarketMetadata(slug);
    this.pendingRequests.set(slug, promise);

    try {
      const metadata = await promise;
      this.setCache(slug, metadata);
      return metadata;
    } finally {
      this.pendingRequests.delete(slug);
    }
  }

  /**
   * Fetch market metadata from Polymarket API
   */
  private async fetchMarketMetadata(slug: string): Promise<MarketMetadata> {
    try {
      // Try Gamma API first (has endDate)
      const response = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${slug}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const event = data[0];
          
          // Get end date from either endDate or end_date_iso field
          let endDate: Date | null = null;
          if (event.endDate) {
            endDate = new Date(event.endDate);
          } else if (event.end_date_iso) {
            endDate = new Date(event.end_date_iso);
          }
          
          return {
            slug,
            endDate,
            description: event.description,
            volume: event.volume
          };
        }
      }

      // Fallback: no end date available
      return {
        slug,
        endDate: null
      };
    } catch (error) {
      console.warn(`Failed to fetch market metadata for ${slug}:`, error);
      
      return {
        slug,
        endDate: null
      };
    }
  }

  /**
   * Cache management
   */
  private getFromCache(slug: string): MarketMetadata | null {
    const entry = this.cache.get(slug);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(slug);
      return null;
    }

    return entry.data;
  }

  private setCache(slug: string, metadata: MarketMetadata): void {
    const entry: CacheEntry<MarketMetadata> = {
      data: metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheTTL
    };
    
    this.cache.set(slug, entry);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Market metadata cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: this.cache.size
    };
  }
}
