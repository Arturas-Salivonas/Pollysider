/**
 * Polymarket WebSocket Client
 * Connects to Polymarket's real-time trade stream
 * 
 * Elegant, resilient, production-ready
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type { PolymarketTrade } from '../../../shared/types';

export class PolymarketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private lastMessageTime: Date | null = null;
  private messageCount = 0;
  private tradeCount = 0;
  private lastPongTime: Date | null = null;

  private readonly WS_URL = 'wss://ws-live-data.polymarket.com';
  
  constructor() {
    super();
  }

  /**
   * Connect to Polymarket WebSocket and subscribe to all trades
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to Polymarket WebSocket...');
      
      this.ws = new WebSocket(this.WS_URL);

      this.ws.on('open', () => {
        console.log('✅ Polymarket WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.messageCount = 0;
        this.tradeCount = 0;
        this.lastMessageTime = new Date();
        
        // Subscribe to all trades (no filter = all markets)
        this.subscribeToTrades();
        
        // Start heartbeat
        this.startHeartbeat();
        
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.lastMessageTime = new Date();
        this.messageCount++;
        this.handleMessage(data);
      });

      this.ws.on('pong', () => {
        this.lastPongTime = new Date();
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ Polymarket WebSocket error:', error.message);
        console.error('Error details:', error);
        this.emit('error', error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 Polymarket WebSocket disconnected (code: ${code}, reason: ${reason || 'none'})`);
        console.log(`📊 Stats before disconnect: ${this.tradeCount} trades, ${this.messageCount} messages`);
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        
        // Auto-reconnect
        this.scheduleReconnect();
      });
    });
  }

  /**
   * Subscribe to all trade events
   */
  private subscribeToTrades(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot subscribe: WebSocket not connected (readyState:', this.ws?.readyState, ')');
      return;
    }

    const subscription = {
      action: 'subscribe',
      subscriptions: [
        {
          topic: 'activity',
          type: 'trades'
          // NO filters = all trades across all markets
        }
      ]
    };

    console.log('📡 Subscribing to Polymarket trades...');
    this.ws.send(JSON.stringify(subscription));
    console.log('✅ Subscription request sent');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const dataString = data.toString();
      
      // Ignore ping/pong messages
      if (dataString === 'ping' || dataString === 'pong' || dataString.length === 0) {
        return;
      }
      
      const message = JSON.parse(dataString);
      
      // Log subscription confirmation
      if (message.action === 'subscribed') {
        console.log('✅ Subscription confirmed:', JSON.stringify(message));
        return;
      }
      
      // Check if this is a trade message
      if (message.topic === 'activity' && message.type === 'trades') {
        this.tradeCount++;
        const trade = message.payload as PolymarketTrade;
        
        // Log every 10th trade to confirm flow
        if (this.tradeCount % 10 === 0) {
          const now = new Date();
          const timestamp = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
          console.log(`[${timestamp}] 📊 Received ${this.tradeCount} trades so far (last: $${(trade.size * trade.price).toFixed(0)})`);
        }
        
        this.emit('trade', trade);
      } else if (message.topic || message.type) {
        // Log unexpected message types
        console.log('📬 Received non-trade message:', { topic: message.topic, type: message.type });
      }
    } catch (error) {
      // Silently ignore non-JSON messages (like binary pings)
      if (data.toString().length > 0 && data.toString() !== 'ping' && data.toString() !== 'pong') {
        console.error('❌ Failed to parse message:', error);
        console.error('Raw data:', data.toString().substring(0, 200));
      }
    }
  }

  /**
   * Heartbeat mechanism to keep connection alive
   */
  private startHeartbeat(): void {
    console.log('💓 Starting heartbeat (ping every 30s, timeout after 10s)');
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping
        this.ws.ping();
        
        // Set timeout for pong response
        this.pongTimeout = setTimeout(() => {
          console.error('❌ Pong timeout - no response to ping for 10s');
          console.log('⚠️ Connection appears dead, forcing reconnect...');
          this.ws?.terminate(); // Force close and trigger reconnect
        }, 10000); // 10 second timeout
        
        // Log status every 5 minutes
        const now = Date.now();
        const timeSinceLastMessage = this.lastMessageTime 
          ? Math.floor((now - this.lastMessageTime.getTime()) / 1000)
          : null;
        
        if (timeSinceLastMessage !== null && timeSinceLastMessage > 300) {
          console.warn(`⚠️ No messages received for ${timeSinceLastMessage}s (${this.tradeCount} total trades)`);
        }
      } else {
        console.error('❌ Cannot ping: WebSocket not open (readyState:', this.ws?.readyState, ')');
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Reconnection logic with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Giving up.');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Graceful disconnect
   */
  disconnect(): void {
    console.log('🛑 Disconnecting from Polymarket...');
    console.log(`📊 Final stats: ${this.tradeCount} trades, ${this.messageCount} messages`);
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    const status = this.isConnected && 
           this.ws !== null && 
           this.ws.readyState === WebSocket.OPEN;
    
    return status;
  }

  /**
   * Get diagnostic info
   */
  getDiagnostics(): object {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState,
      messageCount: this.messageCount,
      tradeCount: this.tradeCount,
      lastMessageTime: this.lastMessageTime?.toISOString(),
      lastPongTime: this.lastPongTime?.toISOString(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
