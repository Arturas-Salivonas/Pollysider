# 🔍 WEBSOCKET DEBUGGING - 2026-02-03

## 🔴 PROBLEM

**Symptom:** After 5-20 minutes, system stops receiving trades. Console shows:
```
WebSocket connection to 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket' failed: 
WebSocket is closed before the connection is established.
```

## 🔬 COMPREHENSIVE FIXES IMPLEMENTED

### 1. **Backend - Polymarket WebSocket Monitoring**

**File:** `backend/src/websocket/polymarket-client.ts`

**Added:**
- ✅ Message counter (tracks all messages received)
- ✅ Trade counter (tracks trade-specific messages)
- ✅ Last message timestamp tracking
- ✅ Last pong timestamp tracking
- ✅ Comprehensive error logging with details
- ✅ **Pong timeout detection** (10s timeout, forces reconnect if no response)
- ✅ **Stale connection detection** (warns if no messages for 5+ minutes)
- ✅ Subscription confirmation logging
- ✅ Every 10th trade logging
- ✅ Connection close code + reason logging
- ✅ Diagnostic method `getDiagnostics()`

**Key improvement - Heartbeat with timeout:**
```typescript
// Send ping
this.ws.ping();

// Set timeout for pong response
this.pongTimeout = setTimeout(() => {
  console.error('❌ Pong timeout - no response to ping for 10s');
  console.log('⚠️ Connection appears dead, forcing reconnect...');
  this.ws?.terminate(); // Force close and trigger reconnect
}, 10000); // 10 second timeout
```

**Why this matters:** Polymarket's WebSocket may appear "connected" but actually be dead (no data flowing). The pong timeout detects this and forces a reconnect.

---

### 2. **Backend - Last Trade Time Tracking**

**File:** `backend/src/server.ts`

**Added:**
- ✅ `lastPolymarketTradeTime` variable (tracks when we last got data from Polymarket)
- ✅ Health endpoint shows seconds since last trade
- ✅ Warning if no trades for 5+ minutes
- ✅ New `/diagnostics` endpoint with full system state

**Health check response:**
```json
{
  "status": "ok",
  "uptime": 1234,
  "polymarketConnected": true,
  "lastPolymarketTradeTime": "2026-02-03T18:00:00.000Z",
  "secondsSinceLastTrade": 45,
  "warning": null
}
```

**Diagnostics endpoint:**
```
GET http://localhost:3001/diagnostics
```

Returns:
- Server uptime
- Connected clients
- Last trade times
- Polymarket WebSocket diagnostics
- Warnings array

---

### 3. **Frontend - Last Trade Time Display**

**File:** `frontend/src/components/StatsBar.tsx`

**Added:**
- ✅ "Last Trade: Xs ago" display
- ✅ Yellow warning (⚠️) if no trades for 5+ minutes
- ✅ Auto-updates every second (via stats updates)

**Visual feedback:**
- Green: Recent trades flowing
- Yellow ⚠️: No trades for 5+ minutes (possible issue)

---

### 4. **Frontend - WebSocket Error Logging**

**File:** `frontend/src/lib/websocket.ts`

**Added:**
- ✅ Connection timing (logs how long connection took)
- ✅ Comprehensive error logging for all Socket.IO events
- ✅ Diagnostic method `getDiagnostics()`
- ✅ Global debug function `wsDiagnostics()` (call in console)
- ✅ Reconnect attempt counter
- ✅ Better error messages

**Console debugging:**
```javascript
// In browser console:
wsDiagnostics()
```

Shows:
- Connected status
- Reconnect attempts
- Connection state
- Socket existence

---

## 🧪 TESTING PROTOCOL

### Step 1: Start Fresh
```bash
# Backend terminal
cd backend
npm run dev

# Frontend terminal
cd frontend
npm run dev
```

### Step 2: Open Browser Console
- Press `F12` → Console tab
- Watch for WebSocket logs

### Step 3: Monitor Backend Logs

**Expected startup logs:**
```
🔌 Connecting to Polymarket WebSocket...
✅ Polymarket WebSocket connected
📡 Subscribing to Polymarket trades...
✅ Subscription request sent
✅ Subscription confirmed: {...}
💓 Starting heartbeat (ping every 30s, timeout after 10s)
```

**Expected trade logs (every 10 trades):**
```
📊 Received 10 trades so far (last: $5000)
📊 Received 20 trades so far (last: $8000)
...
```

**Expected heartbeat logs (if issues):**
```
⚠️ No messages received for 305s (45 total trades)
```

**Expected reconnect logs (if connection dies):**
```
❌ Pong timeout - no response to ping for 10s
⚠️ Connection appears dead, forcing reconnect...
🔌 Polymarket WebSocket disconnected (code: 1006, reason: none)
📊 Stats before disconnect: 45 trades, 150 messages
🔄 Reconnecting in 5000ms (attempt 1/10)...
🔌 Connecting to Polymarket WebSocket...
✅ Polymarket WebSocket connected
```

### Step 4: Monitor Frontend Stats

Watch the stats bar:
- "Last Trade: 5s ago" (should keep updating)
- If turns yellow with ⚠️ → Problem detected

### Step 5: Check Health Endpoints

**Every 5 minutes, manually check:**
```bash
curl http://localhost:3001/health
curl http://localhost:3001/diagnostics
```

Look for warnings in response.

### Step 6: Watch for 20+ Minutes

**Success criteria:**
- ✅ Trades keep coming in
- ✅ "Last Trade" stays recent (<30s)
- ✅ No "Pong timeout" errors
- ✅ No yellow ⚠️ warning in UI

**Failure indicators:**
- ❌ "Last Trade: 5m ago" with yellow ⚠️
- ❌ "Pong timeout" in backend logs
- ❌ WebSocket error in frontend console
- ❌ Total trades count stops increasing

---

## 🔧 DIAGNOSTIC COMMANDS

### Backend Terminal
```bash
# Watch logs in real-time
npm run dev | grep -E "(trade|Pong|timeout|disconnect)"

# Check if backend is receiving data
curl http://localhost:3001/diagnostics | jq
```

### Browser Console
```javascript
// Check WebSocket connection
wsDiagnostics()

// Check if trades are being filtered out
localStorage.getItem('pollysider-storage')

// Force reconnect
location.reload()
```

### Server Logs Analysis
```bash
# Count trades received in last hour
grep "Received.*trades" backend.log | tail -20

# Find disconnect events
grep "disconnect" backend.log

# Find pong timeouts
grep "Pong timeout" backend.log
```

---

## 🎯 ROOT CAUSE HYPOTHESES

### Hypothesis 1: Polymarket WebSocket Dies Silently
**Symptom:** Connection appears "open" but no data flows  
**Fix:** Pong timeout detection (10s) forces reconnect  
**Test:** Wait 20+ minutes, check if reconnects happen

### Hypothesis 2: Socket.IO Connection Drops
**Symptom:** Frontend loses connection to backend  
**Fix:** Better error logging, auto-reconnect  
**Test:** Check frontend console for "disconnect" events

### Hypothesis 3: Rate Limiting / Throttling
**Symptom:** Polymarket stops sending data after X messages  
**Fix:** Reconnect on pong timeout  
**Test:** Check if reconnect restores data flow

### Hypothesis 4: Memory/Resource Exhaustion
**Symptom:** Backend/frontend runs out of resources  
**Fix:** Previous memory management fixes  
**Test:** Monitor RAM/CPU usage over time

### Hypothesis 5: Network Issues
**Symptom:** Internet connection drops briefly  
**Fix:** Auto-reconnect logic  
**Test:** Temporarily disconnect WiFi, see if recovers

---

## 📊 DATA TO COLLECT

**When issue happens, collect:**

1. **Backend logs:**
   - Last "Received X trades" message
   - Any "Pong timeout" errors
   - Last disconnect event
   - Reconnect attempts

2. **Frontend console:**
   - Last WebSocket error
   - Output of `wsDiagnostics()`
   - Any red errors

3. **Health check response:**
   ```bash
   curl http://localhost:3001/diagnostics > diagnostics-$(date +%s).json
   ```

4. **System stats:**
   - How long was system running?
   - How many trades before freeze?
   - What was "Last Trade" time when noticed?

5. **Browser network tab:**
   - WebSocket connection status
   - Any failed requests?

---

## ✅ SUCCESS INDICATORS

**System is working correctly when:**
- ✅ Backend logs "Received X trades" every 1-5 minutes
- ✅ Frontend "Last Trade" stays under 1 minute
- ✅ No pong timeouts in logs
- ✅ Total trades count keeps increasing
- ✅ No yellow ⚠️ warning in UI
- ✅ Health check shows recent trade time
- ✅ Diagnostics show no warnings

**Run system for 1+ hour and verify all above stay true.**

---

## 🚀 DEPLOYMENT

1. **Backend:**
   - Already running with `tsx watch` (auto-reloads)
   - Fixes are live immediately

2. **Frontend:**
   - Hard refresh browser (`Ctrl+Shift+R`)
   - Or restart Vite dev server

3. **Verification:**
   - Check console logs match expected format above
   - Confirm "Last Trade" appears in stats bar
   - Call `wsDiagnostics()` in browser console

---

## 📝 NEXT STEPS IF STILL FAILS

If system still freezes after 20+ minutes:

1. **Capture diagnostics:**
   ```bash
   curl http://localhost:3001/diagnostics > freeze-diagnostics.json
   ```

2. **Check backend logs for patterns:**
   - Last trade received?
   - Pong timeouts?
   - Disconnect events?

3. **Test Polymarket WebSocket directly:**
   ```javascript
   const ws = new WebSocket('wss://ws-live-data.polymarket.com');
   ws.onopen = () => {
     console.log('Connected');
     ws.send(JSON.stringify({
       action: 'subscribe',
       subscriptions: [{ topic: 'activity', type: 'trades' }]
     }));
   };
   ws.onmessage = (e) => console.log('Message:', e.data);
   ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
   ```

4. **Alternative approaches:**
   - Switch to REST API polling (every 10s) instead of WebSocket
   - Add WebSocket proxy/relay for stability
   - Implement circuit breaker pattern

---

## 💡 KEY LEARNINGS

1. **"Connected" doesn't mean "receiving data"** - Need pong timeout detection
2. **Silent failures are worst** - Comprehensive logging is essential
3. **Last trade time is critical metric** - Shows if data flow stopped
4. **Auto-reconnect isn't enough** - Need to detect when reconnect is needed
5. **Frontend + backend both need monitoring** - Issue could be either side

---

**Status:** ✅ COMPREHENSIVE DEBUGGING DEPLOYED  
**Next:** Run for 20+ minutes and monitor logs  
**Report:** Any "Pong timeout" or ⚠️ warnings
