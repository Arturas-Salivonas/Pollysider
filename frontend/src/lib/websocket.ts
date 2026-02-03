/**
 * WebSocket Service
 * Manages connection to backend Socket.IO server
 * Robust reconnection with exponential backoff + comprehensive error logging
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
  private isConnecting = false;
  private connectionStartTime: number | null = null;

  connect(): void {
    // Prevent duplicate connections
    if (this.socket?.connected || this.isConnecting) {
      console.log('⏩ WebSocket: Already connected or connecting, skipping');
      return;
    }

    this.isConnecting = true;
    this.connectionStartTime = Date.now();
    console.log('🔌 WebSocket: Initiating connection to', this.SERVER_URL);

    this.socket = io(this.SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      const connectTime = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
      console.log(`✅ WebSocket: Connected successfully (took ${connectTime}ms)`);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      this.reconnectAttempts++;
      console.warn(`🔌 WebSocket: Disconnected (reason: ${reason}, attempt #${this.reconnectAttempts})`);
      
      // Auto-reconnect if server disconnected us
      if (reason === 'io server disconnect') {
        console.log('🔄 WebSocket: Server disconnected us, reconnecting manually...');
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('❌ WebSocket: Connection error:', error.message);
      console.error('Error details:', error);
      // Socket.IO will auto-retry based on reconnection config
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket: Reconnected successfully (after ${attemptNumber} attempts)`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket: Reconnection attempt #${attemptNumber}...`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket: Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket: Reconnection failed permanently');
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket: General error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🛑 WebSocket: Disconnecting...');
      this.socket.removeAllListeners(); // Clean up listeners
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  onTrade(callback: TradeCallback): void {
    if (!this.socket) {
      console.error('❌ WebSocket: Cannot set trade listener - socket not initialized');
      return;
    }
    
    // Remove any existing listeners before adding new one
    this.socket.off('trade');
    
    this.socket.on('trade', (message: { type: string; payload: EnrichedTrade }) => {
      callback(message.payload);
    });
  }

  onStats(callback: StatsCallback): void {
    if (!this.socket) {
      console.error('❌ WebSocket: Cannot set stats listener - socket not initialized');
      return;
    }
    
    // Remove any existing listeners before adding new one
    this.socket.off('stats');
    
    this.socket.on('stats', (message: { type: string; payload: SystemStats }) => {
      callback(message.payload);
    });
  }

  onConnect(callback: ConnectionCallback): void {
    if (!this.socket) {
      console.error('❌ WebSocket: Cannot set connect listener - socket not initialized');
      return;
    }
    this.socket.off('connect');
    this.socket.on('connect', callback);
  }

  onDisconnect(callback: ConnectionCallback): void {
    if (!this.socket) {
      console.error('❌ WebSocket: Cannot set disconnect listener - socket not initialized');
      return;
    }
    this.socket.off('disconnect');
    this.socket.on('disconnect', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Diagnostic method
  getDiagnostics(): object {
    return {
      connected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting,
      socketExists: this.socket !== null
    };
  }
}

export const wsService = new WebSocketService();

// Expose diagnostics globally for debugging
(window as any).wsDiagnostics = () => {
  console.log('WebSocket Diagnostics:', wsService.getDiagnostics());
};
