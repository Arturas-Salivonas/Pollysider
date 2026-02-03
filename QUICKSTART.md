# POLLYSIDER - QUICKSTART

**Get running in 2 minutes.**

---

## Step 1: Get Polygon RPC Key (1 minute)

1. Go to https://www.alchemy.com/
2. Sign up (free)
3. Create New App → Polygon → Mainnet
4. Copy the API key

---

## Step 2: Configure (30 seconds)

Edit `backend/.env` and paste your key:

```bash
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE
```

---

## Step 3: Start (30 seconds)

From project root:

```bash
npm run dev
```

**That's it.**

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

---

## What You'll See

**Top bar:**
- POLLYSIDER (title)
- 🟢 LIVE (connection status)
- Stats (total trades, suspicious count, detection rate)

**Trade feed:**
- Trades streaming in real-time
- Normal trades: green indicator
- Suspicious trades: red border + 🚨

**Each trade shows:**
- Wallet address (age, transaction count) [View Profile]
- Market name [View Market]
- Action: BUY/SELL YES/NO @ price
- Size: $X,XXX USDC
- Time ago
- Detection signals (for suspicious trades)

---

## Troubleshooting

**No trades appearing?**
- Wait 1-2 minutes (Polymarket may be quiet)
- Check backend console for "✅ Polymarket WebSocket connected"
- Verify Polymarket.com is active

**Connection errors?**
- Check Polygon RPC URL is correct
- Verify Alchemy API key is valid
- Check firewall isn't blocking ports 3001/5173

**Still stuck?**
- Backend logs: Check terminal running `npm run dev`
- Frontend errors: Check browser console (F12)

---

## Next Steps

1. **Watch the feed** - See trades streaming in
2. **Click links** - Explore markets and wallets
3. **Adjust thresholds** - Edit `backend/.env` to tune detection
4. **Read BUILD.md** - Understand the architecture
5. **Customize** - Make it yours

---

**Happy hunting!** 💪
