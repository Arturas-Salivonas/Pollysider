/**
 * TradeCard Component
 * Displays a single trade with all relevant information
 * Beautiful, clean, information-dense
 */

import React from 'react';
import clsx from 'clsx';
import type { EnrichedTrade } from '@shared/types';
import { formatDetailedTimeAgo, formatTimeUntil } from '../lib/time-utils';

interface TradeCardProps {
  trade: EnrichedTrade;
}

export const TradeCard: React.FC<TradeCardProps> = ({ trade }) => {
  const isSuspicious = trade.detection.isSuspicious;
  const confidence = trade.detection.confidence;

  const confidenceColor = {
    'VERY_HIGH': 'text-danger',
    'HIGH': 'text-danger',
    'MEDIUM': 'text-warning',
    'LOW': 'text-dark-text-dim'
  }[confidence];

  const borderColor = isSuspicious && confidence !== 'LOW'
    ? 'border-danger'
    : 'border-dark-border';

  // Calculate wallet age display
  const walletAgeText = trade.wallet.createdAt 
    ? `Created ${formatDetailedTimeAgo(trade.wallet.createdAt)}`
    : 'Creation date unknown';

  // Calculate market end time display (if available)
  const marketEndText = trade.trade.endDate 
    ? formatTimeUntil(trade.trade.endDate)
    : null;

  return (
    <div
      className={clsx(
        'border-l-4 p-4 mb-3 bg-dark-surface fade-in',
        borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSuspicious && (
            <span className={clsx('text-sm font-bold', confidenceColor)}>
              🚨 SUSPICIOUS
            </span>
          )}
          {!isSuspicious && (
            <span className="text-sm text-success">🟢 Normal</span>
          )}
          <span className="text-xs text-dark-text-dim">• {trade.timeAgo}</span>
        </div>
        {isSuspicious && (
          <span className={clsx('text-xs font-mono', confidenceColor)}>
            {confidence}
          </span>
        )}
      </div>

      {/* Wallet Info */}
      <div className="mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-dark-text-dim">Wallet:</span>
          <a
            href={trade.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-blue-400 hover:text-blue-300 underline"
          >
            {trade.trade.proxyWallet.slice(0, 6)}...{trade.trade.proxyWallet.slice(-4)}
          </a>
          <span className="text-xs text-orange-400 font-medium">
            {walletAgeText}
          </span>
        </div>
      </div>

      {/* Market Info */}
      <div className="mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-dark-text-dim">Market:</span>
          <a
            href={trade.marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white hover:text-gray-300 underline flex-1"
          >
            {trade.trade.title}
          </a>
          {marketEndText && (
            <span className="text-xs text-purple-400 font-medium">
              {marketEndText}
            </span>
          )}
        </div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
        <div>
          <span className="text-dark-text-dim">Action:</span>{' '}
          <span className={trade.trade.side === 'BUY' ? 'text-success' : 'text-danger'}>
            {trade.trade.side} {trade.trade.outcome}
          </span>{' '}
          <span className="text-dark-text-dim">@ ${trade.trade.price.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-dark-text-dim">Size:</span>{' '}
          <span className="text-white font-bold">
            ${trade.tradeSizeUSD.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}{' '}
            USDC
          </span>
        </div>
      </div>

      {/* Detection Signals */}
      {isSuspicious && trade.detection.signals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <div className="text-xs text-dark-text-dim mb-1">Detection Signals:</div>
          <div className="space-y-1">
            {trade.detection.signals.map((signal, idx) => (
              <div key={idx} className="text-xs font-mono">
                <span className={clsx(
                  'mr-2',
                  signal.severity === 'CRITICAL' ? 'text-danger' :
                  signal.severity === 'HIGH' ? 'text-warning' :
                  'text-dark-text-dim'
                )}>
                  [{signal.severity}]
                </span>
                <span className="text-dark-text-dim">{signal.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
