<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0b111b" />
  <title>MTSFX Strategy Indicator</title>
  <style>
    :root {
      --bg: #070d17;
      --panel: rgba(15, 23, 42, 0.96);
      --border: rgba(148, 163, 184, 0.18);
      --text: #e2e8f0;
      --muted: #8ea0bb;
      --blue: #60a5fa;
      --green: #21c87a;
      --red: #f87171;
      --amber: #fbbf24;
      --shadow: rgba(0, 0, 0, 0.5);
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 100%;
      min-height: 100%;
      background: radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 35%), linear-gradient(180deg, #070d17 0%, #0b111b 100%);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 18px;
    }

    .container {
      width: min(100%, 1180px);
      min-height: 780px;
      background: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(11,17,27,0.98));
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: 0 28px 80px rgba(0,0,0,0.45);
      overflow: hidden;
    }

    .header {
      padding: 20px 24px;
      background: rgba(15, 23, 42, 0.94);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header h1 {
      margin: 0;
      font-size: clamp(1.4rem, 2vw, 2.4rem);
      color: var(--blue);
      letter-spacing: 0.5px;
    }

    .header p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 0.8rem;
    }

    .market-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(74,222,128,0.35);
      color: #bbf7d0;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .market-status-pill .dot {
      width: 9px; height: 9px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 12px rgba(74, 222, 128, 0.8);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }

    .hidden { display: none !important; }
    .page-shell { padding: 24px; }

    .auth-card, .license-box, .mini-panel, .panel {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.25);
    }

    .auth-card {
      width: min(100%, 520px);
      margin: 42px auto 0;
      padding: 28px 24px 22px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .brand-mark {
      width: 48px; height: 48px;
      display: grid; place-items: center;
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(96,165,250,0.16), rgba(96,165,250,0.05));
      border: 1px solid rgba(96,165,250,0.32);
      font-size: 1.5rem;
    }

    .auth-card h2, .license-box h2 {
      margin: 0; color: var(--blue); font-size: clamp(1.2rem, 2vw, 1.8rem);
    }

    .step-row {
      display: flex; gap: 10px; margin: 18px 0 20px; flex-wrap: wrap;
    }

    .step-badge {
      display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; font-size: 0.75rem;
      border: 1px solid rgba(96,165,250,0.3); background: rgba(96,165,250,0.08); color: #dbeafe; font-weight: 700;
    }

    .step-badge.active {
      background: rgba(34,197,94,0.08); border-color: rgba(74,222,128,0.35); color: #bbf7d0;
    }

    .step-badge .num {
      width: 20px; height: 20px; border-radius: 50%; display: inline-grid; place-items: center; font-size: 0.68rem; background: rgba(96,165,250,0.18);
    }

    .step-badge.active .num { background: rgba(34,197,94,0.18); }

    .form-grid { display: grid; gap: 14px; }

    label {
      display: block; font-size: 0.72rem; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; margin-bottom: 7px; font-weight: 700;
    }

    input, select {
      width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(96, 165, 250, 0.35); background: rgba(15, 23, 42, 0.8); color: var(--text); font-size: 0.95rem;
    }

    input:focus, select:focus {
      outline: none; border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96,165,250,0.16);
    }

    button {
      border: none; border-radius: 10px; padding: 12px 16px; font-weight: 800; cursor: pointer; transition: 0.2s ease; letter-spacing: 0.02em;
    }

    .primary-btn {
      background: linear-gradient(180deg, #4f8cff, #2d68ff); color: white; box-shadow: 0 12px 24px rgba(45, 108, 255, 0.25);
    }

    .primary-btn:hover { background: linear-gradient(180deg, #5d98ff, #2d6df8); transform: translateY(-1px); }

    .license-box { max-width: 620px; margin: 44px auto 0; padding: 24px; }
    .license-status {
      margin-top: 12px; padding: 11px 12px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 0.84rem;
    }

    .license-status.active {
      background: rgba(34, 197, 94, 0.08); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.35);
    }

    .license-status.inactive {
      background: rgba(239, 68, 68, 0.08); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.35);
    }

    .content { display: none; gap: 18px; flex-direction: column; }
    .content.active { display: flex; }

    .topbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
    .market-badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .chip {
      background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96,165,250,0.2); color: #dbeafe; border-radius: 999px; padding: 7px 12px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    }

    .api-key-info {
      background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 12px; padding: 12px 14px; color: #bfdbfe; font-size: 0.82rem;
    }

    .api-key-info a { color: var(--blue); text-decoration: none; font-weight: 700; }
    .api-key-section { display: flex; gap: 10px; align-items: center; }
    .api-key-section input { flex: 1; }

    .pair-selector { display: flex; flex-wrap: wrap; gap: 8px; }
    .pair-btn {
      flex: 1 1 140px; min-width: 120px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.24); color: #dbe4f0; border-radius: 10px; padding: 10px 12px; font-weight: 700;
    }
    .pair-btn.active { background: linear-gradient(180deg, #4f8cff, #2d68ff); color: #fff; border-color: rgba(96,165,250,0.9); }

    .dashboard-layout { display: grid; grid-template-columns: minmax(0, 2.1fr) minmax(300px, 0.9fr); gap: 18px; }
    .left-column, .right-column { display: grid; gap: 18px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .summary-card {
      background: linear-gradient(180deg, rgba(15,23,42,0.9), rgba(11,18,32,0.96)); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px;
    }
    .summary-label { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; font-weight: 700; }
    .summary-value { font-size: 1.4rem; font-weight: 800; color: var(--text); }
    .summary-change { margin-top: 5px; font-size: 0.75rem; font-weight: 700; }
    .green { color: var(--green); } .red { color: var(--red); } .blue { color: var(--blue); }

    .chart-panel { background: #0b1220; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; min-height: 300px; }
    .chart-title {
      background: rgba(15, 23, 42, 0.96); padding: 10px 12px; border-bottom: 1px solid rgba(148,163,184,0.12); color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;
    }
    canvas { display: block; width: 100%; height: 260px; background: #0b1220; }

    .mini-panel {
      background: linear-gradient(180deg, rgba(15,23,42,0.92), rgba(11,18,32,0.96)); border: 1px solid var(--border); border-radius: 14px; padding: 16px;
    }
    .mini-panel h3 {
      margin: 0 0 12px; color: var(--blue); font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase;
    }
    .watchlist { display: grid; gap: 10px; }
    .watch-item {
      display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(148,163,184,0.12);
    }
    .watch-item .name { color: var(--text); font-weight: 700; }
    .watch-item .value { color: var(--muted); font-size: 0.8rem; font-weight: 700; }

    .signal-box { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .signal {
      border-radius: 12px; padding: 16px 12px; text-align: center; font-weight: 800; border: 1px solid transparent; font-size: 1rem;
    }
    .signal.buy { background: rgba(34, 197, 94, 0.08); color: #4ade80; border-color: rgba(74, 222, 128, 0.45); }
    .signal.sell { background: rgba(239, 68, 68, 0.08); color: #f87171; border-color: rgba(248, 113, 113, 0.45); }
    .signal.neutral { background: rgba(96, 165, 250, 0.08); color: #bfdbfe; border-color: rgba(96, 165, 250, 0.25); }
    .signal small { display: block; margin-top: 6px; opacity: 0.9; font-size: 0.72rem; }

    .broker-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .broker-status {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px; font-size: 0.8rem; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); color: var(--text);
    }
    .broker-status.good { background: rgba(34, 197, 94, 0.08); border-color: rgba(74, 222, 128, 0.35); color: #4ade80; }
    .broker-status.bad { background: rgba(239, 68, 68, 0.08); border-color: rgba(248, 113, 113, 0.35); color: #f87171; }

    .error-message {
      display: none; margin-top: 14px; background: rgba(239, 68, 68, 0.08); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.35); border-radius: 10px; padding: 10px 12px; font-size: 0.8rem;
    }
    .error-message.show { display: block; }

    @media (max-width: 900px) { .dashboard-layout { grid-template-columns: 1fr; } }
    @media (max-width: 700px) {
      body { padding: 12px; }
      .page-shell { padding: 14px; }
      .summary-grid, .signal-box, .broker-grid { grid-template-columns: 1fr; }
      .auth-card, .license-box { margin-top: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>📊 MT4 / MT5 Forex Indicator</h1>
        <p>Login first, activate your license, then unlock the dashboard.</p>
      </div>
      <div class="market-status-pill"><span class="dot"></span> Live Market</div>
    </div>

    <div class="page-shell">
      <div id="loginSection" class="auth-card">
        <div class="brand-row">
          <div class="brand-mark">📈</div>
          <h2>Access Login</h2>
        </div>

        <div class="step-row">
          <div class="step-badge active"><span class="num">1</span> Login</div>
          <div class="step-badge"><span class="num">2</span> License</div>
          <div class="step-badge"><span class="num">3</span> Dashboard</div>
        </div>

        <div class="form-grid">
          <div>
            <label for="usernameInput">Username</label>
            <input id="usernameInput" type="text" placeholder="Enter username" />
          </div>
          <div>
            <label for="passwordInput">Password</label>
            <input id="passwordInput" type="password" placeholder="Enter password" />
          </div>
          <button class="primary-btn" onclick="login()">Login</button>
        </div>

        <div id="errorMessage" class="error-message"></div>
      </div>

      <div id="licenseSection" class="hidden">
        <div class="license-box">
          <div class="brand-row" style="margin-bottom: 18px;">
            <div class="brand-mark">🛡️</div>
            <h2>Activate License</h2>
          </div>

          <div class="step-row">
            <div class="step-badge"><span class="num">1</span> Login</div>
            <div class="step-badge active"><span class="num">2</span> License</div>
            <div class="step-badge"><span class="num">3</span> Dashboard</div>
          </div>

          <div class="form-grid">
            <div>
              <label for="licenseKeyInput">License Key</label>
              <input id="licenseKeyInput" type="text" placeholder="Enter your license key" />
            </div>
            <button class="primary-btn" onclick="activateLicense()">Activate</button>
          </div>

          <div id="licenseStatus" class="license-status inactive">❌ License Inactive</div>
        </div>
      </div>

      <div id="mainContent" class="content">
        <div class="topbar">
          <div class="market-badges">
            <span class="chip" id="marketPairName">EUR/USD</span>
            <span class="chip" id="marketTrendChip">Bullish</span>
            <span class="chip" id="marketTimeframe">M5</span>
          </div>
          <div class="chip" id="marketLastUpdated">Updated now</div>
        </div>

        <div class="api-key-info">
          <strong>⚙️ Setup:</strong> Add your free API key from <a href="https://www.alphavantage.co" target="_blank">AlphaVantage.co</a>
        </div>

        <div class="api-key-section">
          <input id="apiKeyInput" type="text" placeholder="Enter AlphaVantage API Key" />
          <button class="primary-btn" onclick="saveApiKey()">Save</button>
        </div>

        <div class="mini-panel">
          <h3>Broker Login & Auto-Trade</h3>
          <div class="broker-grid">
            <div>
              <label for="brokerSelect">Broker</label>
              <select id="brokerSelect"></select>
            </div>
            <div>
              <label for="platformSelect">Platform</label>
              <select id="platformSelect"></select>
            </div>
            <div>
              <label for="brokerAccount">Account Number</label>
              <input id="brokerAccount" type="text" placeholder="Enter MT4/MT5 account number" />
            </div>
            <div>
              <label for="brokerServer">Broker Server</label>
              <input id="brokerServer" type="text" placeholder="e.g. ICMarketsSC-Demo" />
            </div>
            <div>
              <label for="brokerPassword">Broker Password</label>
              <input id="brokerPassword" type="password" placeholder="Enter broker password" />
            </div>
            <div>
              <label for="tradeLotSize">Lot Size</label>
              <input id="tradeLotSize" type="number" min="0.01" step="0.01" value="0.10" />
            </div>
          </div>
          <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <button class="primary-btn" onclick="saveBrokerLogin()">Connect Broker</button>
            <div id="brokerStatus" class="broker-status">Broker not connected</div>
          </div>
        </div>

        <div class="pair-selector">
          <button class="pair-btn active" onclick="selectPair('EUR/USD', 'EUR', 'USD')">EUR/USD</button>
          <button class="pair-btn" onclick="selectPair('GBP/USD', 'GBP', 'USD')">GBP/USD</button>
          <button class="pair-btn" onclick="selectPair('BTC/USD', 'BTC', 'USD')">BTC/USD</button>
          <button class="pair-btn" onclick="selectPair('XAU/USD', 'XAU', 'USD')">XAU/USD</button>
          <button class="pair-btn" onclick="selectPair('USD/JPY', 'USD', 'JPY')">USD/JPY</button>
          <button class="pair-btn" onclick="selectPair('USD/CHF', 'USD', 'CHF')">USD/CHF</button>
          <button class="pair-btn" onclick="selectPair('AUD/USD', 'AUD', 'USD')">AUD/USD</button>
          <button class="pair-btn" onclick="selectPair('USD/CAD', 'USD', 'CAD')">USD/CAD</button>
        </div>

        <div class="dashboard-layout">
          <div class="left-column">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Last Price</div>
                <div class="summary-value" id="pairPrice">$0.0000</div>
                <div class="summary-change green" id="pairChange">+0.00%</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Trend</div>
                <div class="summary-value blue" id="trendValue">Neutral</div>
                <div class="summary-change blue" id="trendStrength">--</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Volatility</div>
                <div class="summary-value blue" id="volatilityValue">--</div>
                <div class="summary-change blue" id="volatilityStatus">Low</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Stochastic</div>
                <div class="summary-value blue" id="stochasticValue">K: -- | D: --</div>
                <div class="summary-change" id="signalState">Waiting</div>
              </div>
            </div>

            <div class="chart-panel">
              <div class="chart-title">Price Chart</div>
              <canvas id="priceChart"></canvas>
            </div>

            <div class="signal-box">
              <div class="signal buy" id="buySignal">🟢 BUY<br><small id="buyReason">Awaiting data</small></div>
              <div class="signal sell" id="sellSignal">🔴 SELL<br><small id="sellReason">Awaiting data</small></div>
            </div>
          </div>

          <div class="right-column">
            <div class="mini-panel">
              <h3>Market Watch</h3>
              <div class="watchlist">
                <div class="watch-item"><span class="name">EUR/USD</span><span class="value">Bullish</span></div>
                <div class="watch-item"><span class="name">GBP/USD</span><span class="value">Neutral</span></div>
                <div class="watch-item"><span class="name">BTC/USD</span><span class="value">Strong</span></div>
                <div class="watch-item"><span class="name">XAU/USD</span><span class="value">Bullish</span></div>
              </div>
            </div>

            <div class="mini-panel">
              <h3>Stochastic</h3>
              <canvas id="stochasticChart" style="height: 220px;"></canvas>
            </div>

            <div class="mini-panel">
              <h3>Trade Insight</h3>
              <div class="watchlist">
                <div class="watch-item"><span class="name">Bias</span><span class="value" id="marketBiasText">Bullish</span></div>
                <div class="watch-item"><span class="name">Breakout</span><span class="value" id="breakoutZone">Inside range</span></div>
                <div class="watch-item"><span class="name">Strength</span><span class="value" id="signalStrength">Moderate</span></div>
                <div class="watch-item"><span class="name">Resistance</span><span class="value" id="resistance">--</span></div>
                <div class="watch-item"><span class="name">Support</span><span class="value" id="support">--</span></div>
              </div>
            </div>
          </div>
        </div>

        <button class="primary-btn" onclick="refreshData(event)">🔄 Refresh Data</button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="app.js"></script>
</body>
</html>
