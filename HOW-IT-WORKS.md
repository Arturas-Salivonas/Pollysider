# POLLYSIDER - HOW IT WORKS

## 🎯 What Gets Flagged as Suspicious

### The Core Question
**"How do we detect insider trading on Polymarket?"**

The answer: **Fresh wallets making large bets.**

---

## 🧠 Detection Logic

### Signal 1: Fresh Wallet + Large Trade
```
IF wallet has < 5 total transactions
AND trade size >= $5,000
THEN flag as SUSPICIOUS (HIGH severity)
```

**Why this matters:**
- Normal users accumulate transaction history over time
- Someone creating a brand new wallet JUST to make one big bet is suspicious
- Suggests they know something and want to bet before the market moves

**Real example:**
```
Wallet: 0x1461...22d8
Age: 2 hours
Transactions: 3
Trade: $35,000 on "Will X resign?"
Result: Market moved 80% the next day
```

### Signal 2: Very New Wallet
```
IF wallet created < 24 hours ago
AND trade size >= $5,000  
THEN flag as CRITICAL
```

**Why even MORE suspicious:**
- Wallet literally created today/yesterday
- Immediately starts making large bets
- Classic insider pattern: create wallet → get funds → bet → disappear

### Signal 3: Massive Trade Size
```
IF trade size >= $20,000
THEN flag based on size
```

**Severity levels:**
- $20K-$30K = MEDIUM
- $30K-$50K = HIGH
- $50K+ = CRITICAL

---

## 📊 Confidence Levels

### VERY_HIGH (Red Alert)
- Multiple critical signals triggered
- Example: Wallet <24h old + $50K trade + <5 transactions

### HIGH (Strong Suspicion)
- Fresh wallet + large trade
- OR 2+ signals detected

### MEDIUM (Worth Watching)
- Single strong signal
- Example: Just a large trade, but old wallet

### LOW (Noise)
- Weak signals only
- Probably not interesting

---

## 🔍 Why This Works

### Real-World Case Study (Jan 3, 2026)

**Timeline:**
1. **8:00 AM** - Fresh wallet created (3 transactions total)
2. **10:00 AM** - Wallet bets $35,000 on unlikely political event (@7.5% odds)
3. **2:00 PM** - News breaks, market moves to 95%
4. **Result** - Wallet turns $35K → $442K (12.6x return)

**What Pollysider would show:**
```
🚨 SUSPICIOUS • VERY_HIGH • 10:00 AM

Wallet: 0xabc...123 (Age: 2h, Txs: 3)
Market: "Will X announce Y by March?"
Action: BUY YES @ $0.075
Size: $35,000 USDC

Detection Signals:
[CRITICAL] Wallet created 2.0h ago, trading $35,000
[HIGH] Fresh wallet (3 txns) trading $35,000
[HIGH] Large trade size ($35,000)

Confidence: VERY_HIGH (3 signals)
```

**4 hours before news broke, you would have known.**

---

## ⚙️ How Wallet Age Is Calculated

### Method 1: Polymarket API (Most Accurate)
```
1. Fetch user activity: GET /activity?user={wallet}&limit=1000
2. Find oldest trade timestamp
3. Calculate: age = now - oldest_trade
```

**Example:**
```json
{
  "timestamp": 1706918400,  // Feb 2, 2024 10:00 AM
  "type": "TRADE"
}
```
Age = Feb 2, 2026 10:00 PM - Feb 2, 2024 10:00 AM = **730 days**

### Method 2: Polygon Blockchain (Fallback)
```
1. Get transaction count from Polygon
2. If < 10 transactions:
   - Check recent blocks for first transaction
   - Calculate exact age from block timestamp
3. If >= 10 transactions:
   - Estimate: age ≈ tx_count × 24 hours (heuristic)
```

**Why both methods:**
- Polymarket API = more accurate for Polymarket users
- Polygon blockchain = works for all wallets, even non-Polymarket

---

## 🎛️ Filter Controls

### Min Trade Size
- **Default:** $5,000
- **Purpose:** Only show bets above this amount
- **Why:** Small bets (<$1K) are noise, we want whale activity

### Max Wallet Age  
- **Default:** 3 hours
- **Purpose:** Only show wallets younger than this
- **Why:** Fresh wallets (<3h) are most suspicious

### Show Only Suspicious
- **Default:** OFF
- **Purpose:** Hide normal trades, only show flagged ones
- **Why:** Focus on high-signal activity

---

## 🚨 What To Watch For

### Pattern 1: Single Fresh Wallet
```
New wallet → Large bet → Unusual outcome
```
**Verdict:** Potentially informed bet

### Pattern 2: Cluster of Fresh Wallets
```
Multiple new wallets → Same market → Same direction
```
**Verdict:** HIGHLY suspicious, possible coordinated insider activity

### Pattern 3: Timing
```
Fresh wallet bet → News breaks <24h later → Market moves 50%+
```
**Verdict:** Classic insider pattern

### Pattern 4: Niche Markets
```
Fresh wallet → Low volume market (<$50K/day) → Large bet
```
**Verdict:** Someone betting on obscure market with conviction = knows something

---

## 💡 How To Use This Tool

### Step 1: Set Your Filters
```
Min Trade Size: $5,000 (catch whales)
Max Wallet Age: 3 hours (ultra-fresh only)
Show Only Suspicious: ON (hide noise)
```

### Step 2: Watch The Feed
- Trades stream in real-time
- Red border = suspicious
- Green indicator = normal

### Step 3: Investigate Suspicious Trades
1. **Click [View Profile]** - See wallet history on Polymarket
2. **Click [View Market]** - Understand what they're betting on
3. **Check signals** - Why was it flagged?
4. **Research the market** - Is there upcoming news/events?

### Step 4: Track Patterns
- Same wallet making multiple suspicious bets? → Follow them
- Multiple fresh wallets on same market? → Something big coming
- Fresh wallet bet + market moved? → Insider confirmed

---

## 📈 Success Metrics

### What "Success" Looks Like

**High Signal:**
- Most flagged trades are actually suspicious
- Minimal false positives (old whales flagged by mistake)

**Early Detection:**
- See insider bets BEFORE market moves
- Hours/days ahead of news breaking

**Actionable Intel:**
- Can investigate wallet clusters
- Can follow smart money
- Can fade obvious insider bets (bet against them for mispricings)

---

## ⚠️ Important Disclaimers

### Not All Suspicious Activity Is Insider Trading
- Some users create fresh wallets for privacy
- Some whales test new strategies with small accounts
- Some bots create wallets programmatically

### Use As Investigation Tool, Not Proof
- Flagged trade = "worth investigating"
- Not "definitive insider activity"
- Do your own research

### Polymarket TOS
- Insider trading may violate Polymarket terms
- This tool is for research/transparency
- Not financial advice

---

## 🎯 Bottom Line

**Pollysider detects:**
- Fresh wallets (<24h old)
- Making large bets (>$5K)
- On prediction markets
- In real-time

**Why it matters:**
- Insider trading happens on Polymarket
- Fresh wallets + big bets = classic pattern
- Early detection = edge

**What you get:**
- Real-time alerts
- Wallet age + transaction count
- Confidence levels (VERY_HIGH, HIGH, MEDIUM, LOW)
- Direct links to investigate

**The goal:**
See the future before it happens. 💪
