import { useEffect } from 'react';
import { useTradesStore } from './store/trades';
import { wsService } from './lib/websocket';
import { StatsBar } from './components/StatsBar';
import { FilterPanel } from './components/FilterPanel';
import { HelpPanel } from './components/HelpPanel';
import { TradeList } from './components/TradeList';

function App() {
  const { getFilteredTrades, stats, isConnected, addTrade, setStats, setConnected } = useTradesStore();

  useEffect(() => {
    // Connect to backend
    wsService.connect();

    // Setup event listeners
    wsService.onConnect(() => {
      setConnected(true);
    });

    wsService.onDisconnect(() => {
      setConnected(false);
    });

    wsService.onTrade((trade) => {
      addTrade(trade);
    });

    wsService.onStats((newStats) => {
      setStats(newStats);
    });

    // Cleanup
    return () => {
      wsService.disconnect();
    };
  }, []);

  const filteredTrades = getFilteredTrades();

  return (
    <div className="min-h-screen bg-dark-bg">
      <StatsBar stats={stats} isConnected={isConnected} />
      <FilterPanel />
      <HelpPanel />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4 text-sm text-dark-text-dim">
          Showing {filteredTrades.length} trades (filtered)
        </div>
        <TradeList trades={filteredTrades} />
      </div>
    </div>
  );
}

export default App;
