import React from 'react';
import clsx from 'clsx';
import type { SystemStats } from '@shared/types';

interface StatsBarProps {
  stats: SystemStats | null;
  isConnected: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, isConnected }) => {
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
        </div>
      )}
    </div>
  );
};
