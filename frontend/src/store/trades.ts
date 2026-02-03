/**
 * Trades Store
 * Zustand state management for trades and system stats
 * Clean, simple, powerful
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnrichedTrade, SystemStats, FilterConfig } from '@shared/types';

interface TradesState {
  allTrades: EnrichedTrade[];
  stats: SystemStats | null;
  filters: FilterConfig;
  isConnected: boolean;
  
  // Actions
  addTrade: (trade: EnrichedTrade) => void;
  setStats: (stats: SystemStats) => void;
  setConnected: (connected: boolean) => void;
  updateFilters: (filters: Partial<FilterConfig>) => void;
  clearTrades: () => void;
  cleanupOldTrades: () => void; // NEW: Periodic cleanup
  
  // Computed
  getFilteredTrades: () => EnrichedTrade[];
}

const DEFAULT_FILTERS: FilterConfig = {
  minTradeSize: 100, // Lowered to $100 to capture more trades
  maxWalletAge: 50000, // Very high default to show all wallets
  minConfidence: 'LOW',
  showOnlySuspicious: false,
  tradeSide: 'ALL' // Changed back to ALL so trades show up
};

const MAX_TRADES_IN_MEMORY = 500; // Keep last 500 trades
const TRADE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (don't expire too quickly)

export const useTradesStore = create<TradesState>()(
  persist(
    (set, get) => ({
      allTrades: [],
      stats: null,
      filters: DEFAULT_FILTERS,
      isConnected: false,

      addTrade: (trade) =>
        set((state) => {
          // Don't add duplicate trades (shouldn't happen with backend dedup, but safety check)
          const isDuplicate = state.allTrades.some(t => t.id === trade.id);
          if (isDuplicate) {
            return state;
          }
          
          // ✅ STORE EVERYTHING - Let filters work at display time only
          
          // Remove trades older than TRADE_EXPIRY_MS
          const now = Date.now();
          const filteredTrades = state.allTrades.filter(t => {
            const tradeTime = t.trade.timestamp * 1000;
            return (now - tradeTime) < TRADE_EXPIRY_MS;
          });
          
          const newTrades = [trade, ...filteredTrades].slice(0, MAX_TRADES_IN_MEMORY);
          
          return {
            allTrades: newTrades
          };
        }),

      setStats: (stats) =>
        set({ stats }),

      setConnected: (connected) =>
        set({ isConnected: connected }),

      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
          // Don't delete trades - let getFilteredTrades() handle display filtering
        })),

      clearTrades: () =>
        set({ allTrades: [] }),
      
      // Periodic cleanup - call this every 5 minutes to flush old/filtered trades
      cleanupOldTrades: () =>
        set((state) => {
          const now = Date.now();
          
          const cleanedTrades = state.allTrades.filter(t => {
            // Only remove if expired (older than 24h)
            const tradeTime = t.trade.timestamp * 1000;
            return (now - tradeTime) < TRADE_EXPIRY_MS;
          });
          
          const removedCount = state.allTrades.length - cleanedTrades.length;
          if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} old trades (${cleanedTrades.length} remaining)`);
          }
          
          return {
            allTrades: cleanedTrades
          };
        }),

      getFilteredTrades: () => {
        const { allTrades, filters } = get();
        
        return allTrades.filter((trade) => {
          // Filter by trade size
          if (trade.tradeSizeUSD < filters.minTradeSize) {
            return false;
          }

          // Filter by wallet age (only if age is known)
          if (trade.wallet.ageHours !== null && trade.wallet.ageHours > filters.maxWalletAge) {
            return false;
          }

          // Filter by suspicious only
          if (filters.showOnlySuspicious && !trade.detection.isSuspicious) {
            return false;
          }

          // Filter by trade side (BUY/SELL)
          if (filters.tradeSide && filters.tradeSide !== 'ALL') {
            if (trade.trade.side !== filters.tradeSide) {
              return false;
            }
          }

          return true;
        });
      }
    }),
    {
      name: 'pollysider-storage',
      partialize: (state) => ({ 
        filters: state.filters // Only persist filters, not trades
      })
    }
  )
);
