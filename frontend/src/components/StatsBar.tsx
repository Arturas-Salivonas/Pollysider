import React from 'react';
import clsx from 'clsx';
import type { SystemStats } from '@shared/types';

interface StatsBarProps {
  stats: SystemStats | null;
  isConnected: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, isConnected }) => {
  const formatTimeSince = (date: Date | null | undefined): string => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getLastTradeWarning = (date: Date | null | undefined): boolean => {
    if (!date) return true;
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    return seconds > 300; // Warn if no trades for 5+ minutes
  };

  const lastTradeWarning = stats ? getLastTradeWarning(stats.lastPolymarketTradeAt || stats.lastTradeAt) : false;

  return (
    <div className="bg-dark-surface border-b border-dark-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold">POLLYSIDER</h1>
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-success pulse-danger' : 'bg-danger'
          )} />
          <span className="text-sm">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
      
      {stats && (
        <div className="flex gap-6 text-sm font-mono">
          <div>
            <span className="text-dark-text-dim">Total:</span>{' '}
            <span className="text-white">{stats.totalTrades}</span>
          </div>
          <div>
            <span className="text-dark-text-dim">Suspicious:</span>{' '}
            <span className="text-danger font-bold">{stats.suspiciousTrades}</span>
          </div>
          <div>
            <span className="text-dark-text-dim">Rate:</span>{' '}
            <span className="text-warning">{stats.detectionRate.toFixed(2)}%</span>
          </div>
          <div className={lastTradeWarning ? 'text-yellow-500' : ''}>
            <span className="text-dark-text-dim">Last:</span>{' '}
            <span className={lastTradeWarning ? 'text-yellow-500 font-bold' : 'text-white'}>
              {formatTimeSince(stats.lastPolymarketTradeAt || stats.lastTradeAt)}
              {lastTradeWarning && ' ⚠️'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
