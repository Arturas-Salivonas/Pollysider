# 🕵️ Pollysider - Real-Time Polymarket Insider Trading Detector

**Detect suspicious trading activity on Polymarket in real-time using WebSocket feeds and behavioral pattern analysis.**

Pollysider monitors live trades on Polymarket and flags potential insider trading based on:
- **New wallet age** (freshly created accounts)
- **Large trade sizes** (significant capital deployment)
- **Behavioral patterns** (unusual trading velocity, position sizing)
- **Market timing** (proximity to market resolution)

---

## ✨ Features

- 🔴 **Real-time monitoring** via Polymarket WebSocket feeds
- 🧠 **Multi-factor detection** using 8+ behavioral signals
- 💰 **Wallet profiling** with automatic age detection
- 📊 **Beautiful dark-themed UI** with live trade feed
- ⚡ **Instant alerts** for suspicious activity
- 🔍 **Advanced filtering** by trade size, wallet age, trade action
- 📈 **Live statistics** (markets scanned, wallets analyzed, detection rate)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **TypeScript** knowledge (optional but helpful)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pollysider.git
cd pollysider

# Install dependencies
npm install

# Set up environment (backend)
cd backend
cp .env.example .env
# Edit .env if needed (defaults work fine)

# Start the backend (in one terminal)
npm run dev

# Start the frontend (in another terminal)
cd ../frontend
npm run dev
```

### Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎯 How It Works

### 1. **Data Collection**
- Connects to Polymarket's real-time WebSocket feed
- Monitors ALL trades across ALL markets
- Fetches wallet creation dates from Polymarket's profile API
- Enriches trades with market metadata (end time, category, etc.)

### 2. **Detection Logic**
Analyzes trades using multiple behavioral signals:

| Signal | Description | Weight |
|--------|-------------|---------|
| **New Wallet** | Wallet created <7 days ago | HIGH |
| **Large Trade** | Position size >$10,000 | MEDIUM |
| **High Velocity** | Multiple large trades in short time | HIGH |
| **Extreme Conviction** | Price far from 50% | MEDIUM |
| **Market Timing** | Trade near market resolution | CRITICAL |
| **Unusual Size** | Trade size >>average market | HIGH |

### 3. **Confidence Scoring**
- **VERY_HIGH**: Multiple critical signals + large size + new wallet
- **HIGH**: Strong patterns with substantial capital
- **MEDIUM**: Some suspicious indicators
- **LOW**: Single minor signal

### 4. **Real-Time Display**
- Trades appear instantly in the UI
- Color-coded by suspicion level (red = suspicious, green = normal)
- Filter by trade size, wallet age, BUY/SELL
- Click wallet/market links to investigate on Polymarket

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + TypeScript
- Express (REST API)
- Socket.IO (WebSocket server)
- RxJS (WebSocket client for Polymarket)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)

**APIs Used:**
- `gamma-api.polymarket.com` - Market metadata & wallet profiles
- `data-api.polymarket.com` - Trade history
- Polymarket WebSocket (via `clob.polymarket.com`)

---

## 📂 Project Structure

```
pollysider/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express + Socket.IO server
│   │   ├── websocket/
│   │   │   └── polymarket-client.ts  # WebSocket feed handler
│   │   ├── profiler/
│   │   │   └── wallet-analyzer.ts    # Wallet age detection
│   │   ├── detector/
│   │   │   └── insider-detector.ts   # Behavioral analysis
│   │   └── utils/
│   │       ├── market-enricher.ts    # Market metadata caching
│   │       └── rate-limiter.ts       # API rate limiting
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main app container
│   │   ├── components/
│   │   │   ├── TradeCard.tsx      # Individual trade display
│   │   │   ├── TradeList.tsx      # Trade feed
│   │   │   ├── FilterPanel.tsx    # Filter controls
│   │   │   ├── StatsBar.tsx       # System statistics
│   │   │   └── HelpPanel.tsx      # User guide
│   │   ├── store/
│   │   │   └── trades.ts          # Zustand state
│   │   ├── lib/
│   │   │   ├── websocket.ts       # Socket.IO client
│   │   │   └── time-utils.ts      # Time formatting
│   │   └── index.css              # Tailwind + custom styles
│   └── package.json
│
├── shared/
│   └── types.ts                   # Shared TypeScript types
│
└── README.md
```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
PORT=3001
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

### Frontend Socket URL

Defaults to `http://localhost:3001`. To change:

Edit `frontend/src/lib/websocket.ts`:
```typescript
const socket = io('http://your-backend-url:3001');
```

---

## 📊 Detection Examples

### Example 1: High Confidence Insider
```
🚨 SUSPICIOUS - VERY_HIGH
Wallet: 0x4e62...d78D Created 2 days 5 hours ago
Market: Will Trump win 2024? Ends in 15 minutes
Action: BUY YES @ $0.95
Size: $25,000 USDC

Detection Signals:
[CRITICAL] Large trade ($25,000) in newly created wallet (48 hours old)
[HIGH] Trade within 30 minutes of market close
[HIGH] Extreme conviction (95% price on YES)
```

### Example 2: Medium Confidence
```
🚨 SUSPICIOUS - MEDIUM
Wallet: 0xF7Dc...7B4D Created 15 hours ago
Market: Will it rain in NYC tomorrow?
Action: BUY NO @ $0.70
Size: $8,500 USDC

Detection Signals:
[MEDIUM] New wallet (15 hours) with significant trade
[MEDIUM] Moderate size trade in low-volume market
```

---

## 🎨 UI Features

### Filter Panel
- **Min Trade Size**: Show only trades above USD threshold
- **Max Wallet Age**: Filter by wallet creation time (hours)
- **Action**: Filter by BUY, SELL, or ALL
- **Show only suspicious**: Hide normal trades

### Trade Cards
- Color-coded borders (red = suspicious, gray = normal)
- Clickable wallet addresses → Polymarket profile
- Clickable market titles → Market page
- Time indicators (wallet age, market countdown)
- Detection signals breakdown

### Stats Bar
- Markets scanned (total unique markets seen)
- Wallets analyzed (total unique wallets profiled)
- Detection rate (% of trades flagged)
- Connection status (green = live, red = disconnected)

---

## 🐛 Troubleshooting

### Backend Issues

**"Cannot connect to Polymarket WebSocket"**
- Check internet connection
- Polymarket may be blocking your IP (use VPN)
- Wait 30 seconds and restart backend

**"Profile API returning 405 errors"**
- This is expected for some endpoints
- System will fallback to trade history for wallet age

### Frontend Issues

**"Trades not appearing"**
- Check browser console for errors
- Verify backend is running (`http://localhost:3001`)
- Check WebSocket connection in Network tab

**"Filters not working"**
- Clear browser cache/localStorage
- Reload page

---

## 📈 Performance Notes

- **Memory usage**: ~100MB (backend), ~50MB (frontend)
- **CPU usage**: ~2-5% (idle), ~10-15% (high activity)
- **Trade retention**: 30 minutes in memory (configurable)
- **Cache duration**: 1hr (wallets), 10min (markets)
- **Latency**: <100ms from trade execution to UI display

---

## 🚧 Limitations

1. **Profile API rate limits**: Aggressive rate limiting may delay wallet age detection
2. **WebSocket reliability**: May disconnect occasionally (auto-reconnects)
3. **Historical data**: Only monitors real-time trades (no backfill)
4. **Detection accuracy**: Behavioral heuristics, not definitive proof
5. **Market coverage**: Only Polymarket (not other prediction markets)

---

## 🔮 Future Enhancements

- [ ] Historical trade analysis
- [ ] Wallet clustering (identify related wallets)
- [ ] Telegram/Discord alerts
- [ ] Market impact analysis
- [ ] Export trade data (CSV/JSON)
- [ ] Multi-exchange support (Kalshi, PredictIt)
- [ ] Machine learning detection models
- [ ] Browser extension

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pollysider/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pollysider/discussions)

---

## 🙏 Acknowledgments

- **Polymarket** for providing open WebSocket feeds
- **React** ecosystem for amazing tooling
- **Socket.IO** for reliable WebSocket abstraction

---

Built with 💪 by developers who believe transparency makes better markets.
