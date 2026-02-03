import React, { useState } from 'react';

export const HelpPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-dark-surface border-b border-dark-border p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-400 hover:text-blue-300 underline"
      >
        {isOpen ? '▼' : '▶'} How does suspicious detection work?
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-sm text-dark-text-dim max-w-4xl">
          <div>
            <h3 className="text-white font-bold mb-2">🚨 Suspicious Activity Detection</h3>
            <p className="mb-2">
              The system analyzes every trade on Polymarket in real-time and flags suspicious patterns
              that might indicate insider trading or informed betting.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Detection Signals:</h4>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="text-danger font-mono">[CRITICAL]</span> <span className="text-white">Very New Wallet:</span>
                <br />Wallet created less than 24 hours ago + trade size ≥$5,000
                <br /><span className="text-xs italic">Why suspicious: New wallets making large bets often know something</span>
              </li>
              
              <li>
                <span className="text-warning font-mono">[HIGH]</span> <span className="text-white">Fresh Wallet:</span>
                <br />Wallet has fewer than 5 total transactions + large trade
                <br /><span className="text-xs italic">Why suspicious: Minimal activity suggests single-purpose account</span>
              </li>
              
              <li>
                <span className="text-warning font-mono">[MEDIUM]</span> <span className="text-white">Large Trade:</span>
                <br />Trade size ≥$20,000 (regardless of wallet age)
                <br /><span className="text-xs italic">Why suspicious: Big bets deserve attention</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Confidence Levels:</h4>
            <ul className="space-y-1 ml-4">
              <li><span className="text-danger font-mono">VERY_HIGH:</span> Multiple critical signals (e.g., brand new wallet + huge trade)</li>
              <li><span className="text-danger font-mono">HIGH:</span> Very suspicious wallet + large trade, or 2+ signals</li>
              <li><span className="text-warning font-mono">MEDIUM:</span> Single strong signal</li>
              <li><span className="text-dark-text-dim font-mono">LOW:</span> Weak signals only</li>
            </ul>
          </div>

          <div className="bg-dark-bg p-3 rounded border border-dark-border">
            <h4 className="text-white font-semibold mb-2">Real Example:</h4>
            <div className="font-mono text-xs">
              <div className="text-danger mb-1">🚨 SUSPICIOUS • VERY_HIGH</div>
              <div className="mb-1">Wallet: 0x7a3...f91 (Age: 2.0h, Txs: 3)</div>
              <div className="mb-1">Market: "Will X resign by March 2026?"</div>
              <div className="mb-1">Action: BUY YES @ $0.075</div>
              <div className="mb-2">Size: $35,000 USDC</div>
              <div className="text-xs text-dark-text-dim">
                <div>[CRITICAL] Wallet created 2.0h ago, trading $35,000</div>
                <div>[HIGH] Fresh wallet (3 txns) trading $35,000</div>
              </div>
            </div>
            <p className="text-xs italic mt-2">
              This pattern: brand new wallet + massive bet + low-probability outcome = classic insider signal
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">What to look for:</h4>
            <ul className="space-y-1 ml-4 text-xs">
              <li>✅ New wallet (&lt;3 hours) betting big on unlikely outcomes</li>
              <li>✅ Multiple fresh wallets betting same direction on niche markets</li>
              <li>✅ Large trades right before news breaks or events happen</li>
              <li>✅ Wallets that make 1-2 trades then go dormant</li>
            </ul>
          </div>

          <div className="border-t border-dark-border pt-3 mt-3">
            <p className="text-xs italic">
              <strong>Note:</strong> Not all suspicious activity is insider trading. Some users create fresh wallets
              for privacy or testing. Use this tool as a starting point for investigation, not definitive proof.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
