import { useState, useEffect } from 'react';
import { useTradesStore } from '../store/trades';

export const FilterPanel: React.FC = () => {
  const { filters, updateFilters } = useTradesStore();
  
  const [minTradeSize, setMinTradeSize] = useState(filters.minTradeSize);
  const [maxWalletAge, setMaxWalletAge] = useState(filters.maxWalletAge);
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(filters.showOnlySuspicious);
  const [tradeSide, setTradeSide] = useState(filters.tradeSide || 'ALL');

  // Sync local state with store on mount
  useEffect(() => {
    setMinTradeSize(filters.minTradeSize);
    setMaxWalletAge(filters.maxWalletAge);
    setShowOnlySuspicious(filters.showOnlySuspicious);
    setTradeSide(filters.tradeSide || 'ALL');
  }, [filters]);

  const handleMinTradeSizeChange = (value: string) => {
    const num = parseInt(value) || 0;
    setMinTradeSize(num);
    updateFilters({ minTradeSize: num });
  };

  const handleMaxWalletAgeChange = (value: string) => {
    const num = parseInt(value) || 24;
    setMaxWalletAge(num);
    updateFilters({ maxWalletAge: num });
  };

  const handleShowOnlySuspiciousChange = (checked: boolean) => {
    setShowOnlySuspicious(checked);
    updateFilters({ showOnlySuspicious: checked });
  };

  const handleTradeSideChange = (value: 'ALL' | 'BUY' | 'SELL') => {
    setTradeSide(value);
    updateFilters({ tradeSide: value });
  };

  return (
    <div className="bg-dark-surface border-b border-dark-border p-4">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-dark-text-dim">Min Trade Size:</label>
          <input
            type="number"
            value={minTradeSize}
            onChange={(e) => handleMinTradeSizeChange(e.target.value)}
            className="bg-dark-bg border border-dark-border text-white px-3 py-1 rounded font-mono text-sm w-32"
            placeholder="100"
            step="100"
          />
          <span className="text-xs text-dark-text-dim">USD</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-dark-text-dim">Max Wallet Age:</label>
          <input
            type="number"
            value={maxWalletAge}
            onChange={(e) => handleMaxWalletAgeChange(e.target.value)}
            className="bg-dark-bg border border-dark-border text-white px-3 py-1 rounded font-mono text-sm w-24"
            placeholder="24"
            step="1"
            min="1"
            max="168"
          />
          <span className="text-xs text-dark-text-dim">hours</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-dark-text-dim">Action:</label>
          <select
            value={tradeSide}
            onChange={(e) => handleTradeSideChange(e.target.value as 'ALL' | 'BUY' | 'SELL')}
            className="bg-dark-bg border border-dark-border text-white px-3 py-1 rounded font-mono text-sm cursor-pointer"
          >
            <option value="ALL">All (BUY + SELL)</option>
            <option value="BUY">BUY only</option>
            <option value="SELL">SELL only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showOnlySuspicious"
            checked={showOnlySuspicious}
            onChange={(e) => handleShowOnlySuspiciousChange(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="showOnlySuspicious" className="text-sm text-dark-text-dim cursor-pointer">
            Show only suspicious
          </label>
        </div>
      </div>
    </div>
  );
};
