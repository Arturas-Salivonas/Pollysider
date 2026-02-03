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
  
  // Computed
  getFilteredTrades: () => EnrichedTrade[];
}

const DEFAULT_FILTERS: FilterConfig = {
  minTradeSize: 1000, // Lowered from 5000 to see more trades
  maxWalletAge: 50000, // Very high default to show all wallets
  minConfidence: 'LOW',
  showOnlySuspicious: false,
  tradeSide: 'ALL' // Changed back to ALL so trades show up
};

const MAX_TRADES_IN_MEMORY = 1500; // Increased from 500 to keep trades 3x longer
const TRADE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes (3x longer than before)

export const useTradesStore = create<TradesState>()(
  persist(
    (set, get) => ({
      allTrades: [],
      stats: null,
      filters: DEFAULT_FILTERS,
      isConnected: false,

      addTrade: (trade) =>
        set((state) => {
          // Don't add duplicate trades
          const isDuplicate = state.allTrades.some(t => t.id === trade.id);
          if (isDuplicate) {
            return state;
          }
          
          // Remove trades older than TRADE_EXPIRY_MS
          const now = Date.now();
          const filteredTrades = state.allTrades.filter(t => {
            // FIX: trade.timestamp is in SECONDS, not milliseconds
            const tradeTime = t.trade.timestamp * 1000;
            return (now - tradeTime) < TRADE_EXPIRY_MS;
          });
          
          return {
            allTrades: [trade, ...filteredTrades].slice(0, MAX_TRADES_IN_MEMORY)
          };
        }),

      setStats: (stats) =>
        set({ stats }),

      setConnected: (connected) =>
        set({ isConnected: connected }),

      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

      clearTrades: () =>
        set({ allTrades: [] }),

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
