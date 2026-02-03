import { useEffect } from 'react';
import { useTradesStore } from './store/trades';
import { wsService } from './lib/websocket';
import { StatsBar } from './components/StatsBar';
import { FilterPanel } from './components/FilterPanel';
import { HelpPanel } from './components/HelpPanel';
import { TradeList } from './components/TradeList';

function App() {
  const { 
    getFilteredTrades, 
    allTrades, // Access raw trades
    stats, 
    isConnected, 
    addTrade, 
    setStats, 
    setConnected, 
    cleanupOldTrades 
  } = useTradesStore();

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

    // Cleanup - ONLY disconnect when component actually unmounts
    return () => {
      wsService.disconnect();
    };
  }, []); // Empty deps - run once on mount

  // Periodic cleanup every 5 minutes to flush old/filtered trades from memory
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupOldTrades();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [cleanupOldTrades]);

  const filteredTrades = getFilteredTrades();

  return (
    <div className="min-h-screen bg-dark-bg">
      <StatsBar stats={stats} isConnected={isConnected} />
      <FilterPanel />
      <HelpPanel />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4 text-sm text-dark-text-dim flex gap-4">
          <span>Stored: {allTrades.length} trades</span>
          <span>•</span>
          <span>Showing: {filteredTrades.length} trades (after filters)</span>
        </div>
        <TradeList trades={filteredTrades} />
      </div>
    </div>
  );
}

export default App;
