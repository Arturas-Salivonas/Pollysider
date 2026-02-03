/**
 * Pollysider Server
 * Orchestrates WebSocket clients, detection engine, and frontend communication
 * 
 * The heart of the system - elegant, efficient, resilient
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config as dotenvConfig } from 'dotenv';
import { PolymarketClient } from './websocket/polymarket-client';
import { WalletAnalyzer } from './profiler/wallet-analyzer';
import { InsiderDetector } from './detector/insider-detector';
import { MarketEnricher } from './utils/market-enricher';
import type {
  PolymarketTrade,
  EnrichedTrade,
  SystemStats,
  ClientMessage
} from '../../shared/types';

// Load environment variables (fix deprecation warning)
dotenvConfig();

// Configuration
const PORT = process.env.PORT || 3001;
const MIN_TRADE_SIZE = parseInt(process.env.MIN_TRADE_SIZE_USD || '10000');
const MAX_WALLET_AGE = parseInt(process.env.MAX_WALLET_AGE_HOURS || '24');
const FRESH_WALLET_MAX_TX = parseInt(process.env.FRESH_WALLET_MAX_TRANSACTIONS || '5');
const CACHE_TTL = parseInt(process.env.WALLET_CACHE_TTL || '3600');

// Initialize Express and Socket.IO
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize core components
const polymarketClient = new PolymarketClient();
const walletAnalyzer = new WalletAnalyzer(CACHE_TTL);
const insiderDetector = new InsiderDetector(MIN_TRADE_SIZE, MAX_WALLET_AGE, FRESH_WALLET_MAX_TX);
const marketEnricher = new MarketEnricher();

// System statistics
const stats: SystemStats = {
  totalTrades: 0,
  suspiciousTrades: 0,
  detectionRate: 0,
  connectedClients: 0,
  uptime: 0,
  lastTradeAt: null
};

const startTime = Date.now();
let lastPolymarketTradeTime: Date | null = null;
let emittedToFrontend = 0;

// Track processed trades to prevent duplicates
const processedTradeIds = new Set<string>();
const MAX_PROCESSED_HISTORY = 10000;

// Queue to prevent parallel processing overwhelming APIs
let processingQueue = Promise.resolve();

/**
 * Process incoming trade from Polymarket
 */
async function processTrade(trade: PolymarketTrade): Promise<void> {
  try {
    // Track last trade time from Polymarket
    lastPolymarketTradeTime = new Date();
    
    // Generate trade ID
    const tradeId = `${trade.transactionHash}_${trade.timestamp}`;
    
    // 🔥 CRITICAL: Check for duplicates BEFORE processing
    if (processedTradeIds.has(tradeId)) {
      // Duplicate - skip silently
      return;
    }
    
    // Add to processed set
    processedTradeIds.add(tradeId);
    
    // Limit set size to prevent memory leak
    if (processedTradeIds.size > MAX_PROCESSED_HISTORY) {
      // Remove oldest entries (convert to array, remove first 1000, convert back)
      const arr = Array.from(processedTradeIds);
      processedTradeIds.clear();
      arr.slice(1000).forEach(id => processedTradeIds.add(id));
    }
    
    // Update stats
    stats.totalTrades++;
    stats.lastTradeAt = new Date();

    // Analyze wallet
    let wallet;
    try {
      wallet = await walletAnalyzer.analyzeWallet(trade.proxyWallet);
    } catch (walletError) {
      console.error(`❌ Wallet API failed for trade #${stats.totalTrades}:`, walletError.message);
      throw walletError;
    }

    // Enrich market data (get end date)
    let marketMetadata;
    try {
      marketMetadata = await marketEnricher.getMarketMetadata(trade.eventSlug);
    } catch (marketError) {
      console.error(`❌ Market API failed for trade #${stats.totalTrades}:`, marketError.message);
      throw marketError;
    }
    
    // Add end date to trade
    trade.endDate = marketMetadata.endDate;

    // Detect suspicious activity
    const detection = insiderDetector.detect(trade, wallet);

    if (detection.isSuspicious) {
      stats.suspiciousTrades++;
    }

    stats.detectionRate = (stats.suspiciousTrades / stats.totalTrades) * 100;

    // Calculate trade size in USD
    const tradeSizeUSD = trade.size * trade.price;

    // Build enriched trade
    const enrichedTrade: EnrichedTrade = {
      trade,
      wallet,
      detection,
      tradeSizeUSD,
      timeAgo: formatTimeAgo(trade.timestamp),
      marketUrl: `https://polymarket.com/event/${trade.eventSlug}`,
      profileUrl: `https://polymarket.com/profile/${trade.proxyWallet}`,
      receivedAt: new Date(),
      id: `${trade.transactionHash}_${trade.timestamp}`
    };

    // Broadcast to all connected clients
    const message: ClientMessage = {
      type: 'trade',
      payload: enrichedTrade
    };

    io.emit('trade', message);
    emittedToFrontend++;

    // Also broadcast updated stats in real-time
    io.emit('stats', {
      type: 'stats',
      payload: { 
        ...stats, 
        uptime: Math.floor((Date.now() - startTime) / 1000),
        lastPolymarketTradeAt: lastPolymarketTradeTime
      }
    });

    // Log suspicious trades
    if (detection.isSuspicious && detection.confidence !== 'LOW') {
      console.log(`🚨 SUSPICIOUS: ${trade.proxyWallet.slice(0, 8)}... | $${tradeSizeUSD.toFixed(0)} | ${detection.confidence}`);
    }
  } catch (error) {
    console.error(`❌ Error processing trade #${stats.totalTrades}:`, error);
    console.error(`   Wallet: ${trade.proxyWallet.slice(0, 10)}...`);
    console.error(`   Market: ${trade.eventSlug}`);
    // Don't throw - let other trades continue
  }
}

/**
 * Format timestamp as "X time ago"
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
  stats.connectedClients = io.engine.clientsCount;
  console.log(`✅ Client connected (${stats.connectedClients} total)`);

  // Send current stats
  socket.emit('stats', {
    type: 'stats',
    payload: { 
      ...stats, 
      uptime: Math.floor((Date.now() - startTime) / 1000),
      lastPolymarketTradeAt: lastPolymarketTradeTime
    }
  });

  socket.on('disconnect', () => {
    stats.connectedClients = io.engine.clientsCount;
    console.log(`👋 Client disconnected (${stats.connectedClients} remaining)`);
  });
});

/**
 * REST API endpoints
 */

// Health check
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const polymarketConnected = polymarketClient.getConnectionStatus();
  const timeSinceLastTrade = lastPolymarketTradeTime 
    ? Math.floor((Date.now() - lastPolymarketTradeTime.getTime()) / 1000)
    : null;

  const health = {
    status: 'ok',
    uptime,
    polymarketConnected,
    stats,
    lastPolymarketTradeTime: lastPolymarketTradeTime?.toISOString() || 'never',
    secondsSinceLastTrade: timeSinceLastTrade,
    warning: timeSinceLastTrade && timeSinceLastTrade > 300 
      ? '⚠️ No trades received for 5+ minutes - possible connection issue'
      : null
  };

  console.log(`📊 Health check: Polymarket=${polymarketConnected}, Last trade=${timeSinceLastTrade}s ago`);

  res.json(health);
});

// Get current stats
app.get('/stats', (req, res) => {
  res.json({
    ...stats,
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

// Diagnostic endpoint
app.get('/diagnostics', (req, res) => {
  const diagnostics = {
    server: {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      connectedClients: stats.connectedClients,
      lastTradeAt: stats.lastTradeAt?.toISOString() || 'never',
      lastPolymarketTradeAt: lastPolymarketTradeTime?.toISOString() || 'never'
    },
    polymarket: polymarketClient.getDiagnostics(),
    stats: stats,
    warnings: [] as string[]
  };

  // Check for issues
  const timeSinceLastTrade = lastPolymarketTradeTime 
    ? Math.floor((Date.now() - lastPolymarketTradeTime.getTime()) / 1000)
    : null;

  if (timeSinceLastTrade && timeSinceLastTrade > 300) {
    diagnostics.warnings.push(`No trades received for ${timeSinceLastTrade}s - possible Polymarket connection issue`);
  }

  if (!polymarketClient.getConnectionStatus()) {
    diagnostics.warnings.push('Polymarket WebSocket NOT connected');
  }

  console.log('🔍 Diagnostics requested:', diagnostics);
  res.json(diagnostics);
});

/**
 * Initialize Polymarket connection
 */
async function initializePolymarket(): Promise<void> {
  polymarketClient.on('trade', (trade) => {
    // Queue processing to prevent parallel execution
    processingQueue = processingQueue.then(() => processTrade(trade)).catch(err => {
      console.error('❌ Trade processing failed:', err);
    });
  });

  polymarketClient.on('connected', () => {
    console.log('✅ Polymarket stream active');
  });

  polymarketClient.on('disconnected', () => {
    console.log('⚠️  Polymarket stream disconnected');
  });

  polymarketClient.on('error', (error) => {
    console.error('Polymarket error:', error);
  });

  await polymarketClient.connect();
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  polymarketClient.disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

/**
 * Start server
 */
async function start(): Promise<void> {
  try {
    console.log('🚀 Starting Pollysider...\n');

    // Connect to Polymarket
    await initializePolymarket();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Stats: http://localhost:${PORT}/stats`);
      console.log(`💊 Health: http://localhost:${PORT}/health\n`);
      console.log(`Waiting for trades...\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();
