/**
 * WebSocket Service
 * Manages connection to backend Socket.IO server
 * Robust reconnection with exponential backoff
 */

import { io, Socket } from 'socket.io-client';
import type { EnrichedTrade, SystemStats } from '@shared/types';

type TradeCallback = (trade: EnrichedTrade) => void;
type StatsCallback = (stats: SystemStats) => void;
type ConnectionCallback = () => void;

class WebSocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = 'http://localhost:3001';
  private reconnectAttempts = 0;

  connect(): void {
    if (this.socket?.connected) {
      console.log('Already connected');
      return;
    }

    console.log('🔌 Connecting to backend...');

    this.socket = io(this.SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to backend');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      this.reconnectAttempts++;
      
      // Auto-reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        // Server disconnected us, reconnect manually
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      // Socket.IO will auto-retry
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed permanently');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onTrade(callback: TradeCallback): void {
    if (!this.socket) return;
    
    this.socket.on('trade', (message: { type: string; payload: EnrichedTrade }) => {
      callback(message.payload);
    });
  }

  onStats(callback: StatsCallback): void {
    if (!this.socket) return;
    
    this.socket.on('stats', (message: { type: string; payload: SystemStats }) => {
      callback(message.payload);
    });
  }

  onConnect(callback: ConnectionCallback): void {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  onDisconnect(callback: ConnectionCallback): void {
    if (!this.socket) return;
    this.socket.on('disconnect', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
