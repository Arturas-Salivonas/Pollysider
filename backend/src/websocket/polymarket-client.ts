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
  private isConnected = false;

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
        
        // Subscribe to all trades (no filter = all markets)
        this.subscribeToTrades();
        
        // Start heartbeat
        this.startHeartbeat();
        
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        this.emit('error', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
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
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscription = {
      action: 'subscribe',
      subscriptions: [
        {
          topic: 'activity',
          type: 'trades',
          filters: '' // Empty filter = all trades
        }
      ]
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('📡 Subscribed to all Polymarket trades');
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
      
      // Check if this is a trade message
      if (message.topic === 'activity' && message.type === 'trades') {
        const trade = message.payload as PolymarketTrade;
        this.emit('trade', trade);
      }
    } catch (error) {
      // Silently ignore non-JSON messages (like binary pings)
      if (data.toString().length > 0 && data.toString() !== 'ping' && data.toString() !== 'pong') {
        console.error('Failed to parse message:', error);
      }
    }
  }

  /**
   * Heartbeat mechanism to keep connection alive
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
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
    console.log('Disconnecting from Polymarket...');
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
    return this.isConnected && 
           this.ws !== null && 
           this.ws.readyState === WebSocket.OPEN;
  }
}
