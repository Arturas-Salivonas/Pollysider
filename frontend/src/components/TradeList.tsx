import React from 'react';
import { TradeCard } from './TradeCard';
import type { EnrichedTrade } from '@shared/types';

interface TradeListProps {
  trades: EnrichedTrade[];
}

export const TradeList: React.FC<TradeListProps> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-text-dim">
        <div className="text-center">
          <div className="text-4xl mb-2">📡</div>
          <div>Waiting for trades...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {trades.map((trade) => (
        <TradeCard key={trade.id} trade={trade} />
      ))}
    </div>
  );
};
