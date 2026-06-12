# 📊 Forex Stochastic Indicator Dashboard

A mobile-first progressive web app for real-time forex trading analysis using Stochastic Oscillator indicators.

## 🚀 Features

- **Mobile-Optimized UI** - Fully responsive design for mobile phones
- **License Key System** - Secure activation with license keys
- **Stochastic Oscillator** - Real-time technical analysis
- **Multiple Currency Pairs** - Support for:
  - EUR/USD
  - GBP/USD
  - XAU/USD (Gold)
  - USD/JPY
  - GBP/JPY
  - US 30 (Dow Jones)
  - NAS 100 (Nasdaq 100)
  - US OIL (Crude Oil)

- **Trading Signals** - Buy/Sell recommendations based on:
  - Oversold conditions (K < 20)
  - Overbought conditions (K > 80)
  - Bullish/Bearish crossovers

- **Live Charts** - Real-time price visualization with Chart.js
- **Offline Support** - PWA with service worker caching
- **Free API Integration** - AlphaVantage for live market data

## 📱 Installation

### On Mobile (iOS & Android):

1. Open the app in your mobile browser
2. Look for "Add to Home Screen" or "Install" option
3. Enter demo license key: `FOREX-STOCH-2024-DEMO`
4. Add your free AlphaVantage API key (get it at: https://www.alphavantage.co)
5. Select currency pair and start analyzing!

### On Desktop:

1. Clone the repository
2. Serve with any HTTP server (e.g., `python -m http.server 8000`)
3. Open in browser at `http://localhost:8000`

## 🔐 License System

**Demo License Key:** `FOREX-STOCH-2024-DEMO`

Create custom license keys using format: `FOREX-STOCH-XXXX` where XXXX is your custom code.

## 📊 Stochastic Oscillator Formula

```
K = ((Close - Lowest Low) / (Highest High - Lowest Low)) × 100
D = 3-period SMA of K
```

**Signal Interpretation:**
- **K < 20**: Oversold (potential BUY)
- **K > 80**: Overbought (potential SELL)
- **K crosses above D**: Bullish signal
- **K crosses below D**: Bearish signal

## 🔑 API Requirements

1. Free account at [AlphaVantage.co](https://www.alphavantage.co)
2. Get your API key
3. Paste it in the app settings

**API Limits:** 5 requests/minute (free tier)

## 📋 Technical Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Charts:** Chart.js library
- **Data:** AlphaVantage API
- **PWA:** Service Worker for offline support
- **Storage:** Local browser storage

## 🎯 How to Use

1. **Activate License**: Enter demo key or your custom license
2. **Setup API Key**: Add your AlphaVantage API key
3. **Select Pair**: Choose from 8 available currency pairs
4. **View Signals**: Get real-time trading recommendations
5. **Refresh Data**: Click refresh button to update charts

## ⚠️ Disclaimer

**This app is for educational purposes only.** Always conduct your own research and consult with a financial advisor before making trading decisions. Past performance does not guarantee future results.

## 📈 Future Enhancements

- [ ] RSI (Relative Strength Index) indicator
- [ ] MACD indicator
- [ ] Bollinger Bands
- [ ] Multiple timeframes
- [ ] Alert notifications
- [ ] Trading journal
- [ ] Technical analysis patterns
- [ ] WebSocket for real-time updates

## 📝 License

This project is open source. Feel free to fork and modify for personal use.

## 🤝 Support

For issues or feature requests, open an issue in the repository.

---

**Get your free API key:** https://www.alphavantage.co

**Demo License:** `FOREX-STOCH-2024-DEMO`
