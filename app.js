const VALID_LICENSE_KEYS = [
  'MTSFX-FOREX-2026-PROFESSIONAL',
  'MTSFX-FOREX-2026-DEMO',
  'FOREX-STOCH-2024-DEMO',
  'MTSFX-LICENSE-ACTIVE',
  'TRADING-INDICATOR-2026'
];

const STORAGE_KEY = 'forexIndicator';
const TIMEFRAME_OPTIONS = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];
const DEFAULT_SCANNER_SYMBOLS = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'USD/JPY'];

let priceChart = null;
let stochasticChart = null;
let currentPair = { display: 'EUR/USD', from_symbol: 'EUR', to_symbol: 'USD' };
let apiKey = localStorage.getItem(`${STORAGE_KEY}_apiKey`) || '';
let priceData = [];
let activeTimeframe = 'M15';
let selectedScannerSymbols = [...DEFAULT_SCANNER_SYMBOLS];
let scannerResults = [];

function showLoginScreen() {
  const loginSection = document.getElementById('loginSection');
  const licenseSection = document.getElementById('licenseSection');
  const mainContent = document.getElementById('mainContent');

  if (loginSection) loginSection.classList.remove('hidden');
  if (licenseSection) licenseSection.classList.add('hidden');
  if (mainContent) mainContent.classList.remove('active');
}

function showLicenseScreen() {
  const loginSection = document.getElementById('loginSection');
  const licenseSection = document.getElementById('licenseSection');
  const mainContent = document.getElementById('mainContent');

  if (loginSection) loginSection.classList.add('hidden');
  if (licenseSection) licenseSection.classList.remove('hidden');
  if (mainContent) mainContent.classList.remove('active');
}

function showDashboardScreen() {
  const loginSection = document.getElementById('loginSection');
  const licenseSection = document.getElementById('licenseSection');
  const mainContent = document.getElementById('mainContent');

  if (loginSection) loginSection.classList.add('hidden');
  if (licenseSection) licenseSection.classList.add('hidden');
  if (mainContent) mainContent.classList.add('active');
}

function validateLicenseKey(key) {
  return VALID_LICENSE_KEYS.some(validKey =>
    validKey.toUpperCase() === (key || '').trim().toUpperCase()
  );
}

function updateLicenseStatus(active) {
  const status = document.getElementById('licenseStatus');
  if (!status) return;
  if (active) {
    status.textContent = '✅ License Active';
    status.classList.remove('inactive');
    status.classList.add('active');
  } else {
    status.textContent = '❌ License Inactive';
    status.classList.remove('active');
    status.classList.add('inactive');
  }
}

function showError(message, hide = false) {
  const errorDiv = document.getElementById('errorMessage');
  if (!errorDiv) return;
  if (hide || !message) {
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    return;
  }
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

function login() {
  const username = document.getElementById('usernameInput')?.value.trim();
  const password = document.getElementById('passwordInput')?.value.trim();

  // Remove the username/password gate completely.
  localStorage.setItem(`${STORAGE_KEY}_username`, username || 'guest');
  localStorage.setItem(`${STORAGE_KEY}_password`, password || 'guest');
  localStorage.setItem(`${STORAGE_KEY}_license`, 'MTSFX-LICENSE-ACTIVE');
  updateLicenseStatus(true);
  showDashboardScreen();
  initializeDashboard();
  showError('', true);
}

function activateLicense() {
  const input = document.getElementById('licenseKeyInput');
  const key = input.value.trim();

  // No blocking license flow required anymore.
  if (!key) {
    localStorage.setItem(`${STORAGE_KEY}_license`, 'MTSFX-LICENSE-ACTIVE');
    updateLicenseStatus(true);
    showDashboardScreen();
    initializeDashboard();
    return;
  }

  if (!validateLicenseKey(key)) {
    showError('❌ Invalid license key. Please check and try again.');
    updateLicenseStatus(false);
    return;
  }

  localStorage.setItem(`${STORAGE_KEY}_license`, key);
  updateLicenseStatus(true);
  input.value = '';
  showDashboardScreen();
  initializeDashboard();
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) {
    showError('Please enter an API key');
    return;
  }
  apiKey = key;
  localStorage.setItem(`${STORAGE_KEY}_apiKey`, key);
  refreshData();
}

function populateBrokerOptions() {
  const brokerSelect = document.getElementById('brokerSelect');
  const platformSelect = document.getElementById('platformSelect');
  if (!brokerSelect) return;

  const brokerConfigs = {
    'IC Markets': { description: 'Major MT4/MT5 broker', platforms: ['MT4', 'MT5'] },
    Pepperstone: { description: 'Major MT4/MT5 broker', platforms: ['MT4', 'MT5'] },
    Exness: { description: 'Major MT4/MT5 broker', platforms: ['MT4', 'MT5'] },
    XM: { description: 'Major MT4/MT5 broker', platforms: ['MT4', 'MT5'] }
  };

  brokerSelect.innerHTML = Object.keys(brokerConfigs)
    .map(broker => `<option value="${broker}">${broker}</option>`)
    .join('');

  if (platformSelect) {
    platformSelect.innerHTML = ['MT4', 'MT5']
      .map(platform => `<option value="${platform}">${platform}</option>`)
      .join('');
  }

  brokerSelect.value = 'IC Markets';
  if (platformSelect) platformSelect.value = 'MT5';
}

function setBrokerStatus(message, ok = false) {
  const statusEl = document.getElementById('brokerStatus');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('good', ok);
  statusEl.classList.toggle('bad', !ok);
}

function getBrokerSymbol(symbolLabel, platform = 'MT5') {
  const cleaned = (symbolLabel || '').replace(/\s+/g, '').replace('/', '').toUpperCase();
  const symbolMap = {
    EURUSD: { MT4: 'EURUSD', MT5: 'EURUSD' },
    GBPUSD: { MT4: 'GBPUSD', MT5: 'GBPUSD' },
    USDJPY: { MT4: 'USDJPY', MT5: 'USDJPY' },
    AUDUSD: { MT4: 'AUDUSD', MT5: 'AUDUSD' },
    USDCAD: { MT4: 'USDCAD', MT5: 'USDCAD' },
    USDCHF: { MT4: 'USDCHF', MT5: 'USDCHF' },
    XAUUSD: { MT4: 'XAUUSD', MT5: 'XAUUSD' },
    BTCUSD: { MT4: 'BTCUSD', MT5: 'BTCUSD' }
  };

  const mapped = symbolMap[cleaned] || { MT4: cleaned, MT5: cleaned };
  return mapped[platform] || mapped.MT5 || cleaned;
}

function saveBrokerLogin() {
  const broker = document.getElementById('brokerSelect')?.value || 'IC Markets';
  const platform = document.getElementById('platformSelect')?.value || 'MT5';
  const account = document.getElementById('brokerAccount')?.value.trim();
  const server = document.getElementById('brokerServer')?.value.trim();
  const password = document.getElementById('brokerPassword')?.value.trim();
  const lotSize = Number(document.getElementById('tradeLotSize')?.value || 0.10);

  if (!broker || !platform || !account || !server || !password) {
    setBrokerStatus('Please fill broker, account, server and password fields.', false);
    return;
  }

  const brokerState = {
    broker,
    platform,
    account,
    server,
    password,
    tradeLotSize: Number.isFinite(lotSize) && lotSize > 0 ? lotSize : 0.10,
    isLoggedIn: true,
    lastSignal: null,
    lastTradeAt: 0
  };

  localStorage.setItem(`${STORAGE_KEY}_broker`, JSON.stringify(brokerState));
  setBrokerStatus(`${broker} ${platform} connected successfully. Auto-trading enabled.`, true);
}

function selectPair(display, from_symbol, to_symbol) {
  currentPair = { display, from_symbol, to_symbol };
  document.querySelectorAll('.pair-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(display)) btn.classList.add('active');
  });
  refreshData();
}

function setActiveTimeframe(tf) {
  activeTimeframe = tf;
  const marketTimeframe = document.getElementById('marketTimeframe');
  if (marketTimeframe) marketTimeframe.textContent = tf;

  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tf === tf);
  });

  refreshData();
}

function toggleScannerSymbol(symbol) {
  if (!symbol) return;
  const exists = selectedScannerSymbols.includes(symbol);

  if (exists) {
    if (selectedScannerSymbols.length === 1) return;
    selectedScannerSymbols = selectedScannerSymbols.filter(item => item !== symbol);
  } else {
    selectedScannerSymbols = [...selectedScannerSymbols, symbol];
  }

  document.querySelectorAll('.scan-symbol').forEach(btn => {
    const active = selectedScannerSymbols.includes(btn.dataset.symbol);
    btn.classList.toggle('active', active);
  });

  runSignalScanner();
}

function getPairBaseMap() {
  return {
    'EUR/USD': 1.09,
    'GBP/USD': 1.27,
    'BTC/USD': 42000,
    'XAU/USD': 1980,
    'USD/JPY': 149.2,
    'USD/CHF': 0.88,
    'AUD/USD': 0.66,
    'USD/CAD': 1.35
  };
}

function generateOfflineSeries(pairName, timeframe = activeTimeframe) {
  const baseMap = getPairBaseMap();
  const base = baseMap[pairName] || 1.0;
  const points = [];
  let value = base;
  const volatilityScale = base < 100 ? 0.0027 : 22;
  const stepFactor = {
    M1: 1,
    M5: 2,
    M15: 5,
    M30: 8,
    H1: 12,
    H4: 20,
    D1: 35
  }[timeframe] || 8;

  for (let i = 0; i < 140; i++) {
    const drift = Math.sin((i + 1) / (6 + stepFactor / 3)) * volatilityScale + (i % 9 === 0 ? volatilityScale * 0.8 : 0);
    value += drift;
    const open = value - drift * 0.55;
    const close = value;
    const high = Math.max(open, close) + volatilityScale * 1.2;
    const low = Math.min(open, close) - volatilityScale * 1.2;
    points.push({
      date: new Date(Date.now() - (140 - i) * (timeframe === 'D1' ? 86400000 : 3600000)).toISOString(),
      open,
      high,
      low,
      close
    });
  }

  return points;
}

async function fetchForexData() {
  const pairName = currentPair.display;

  if (apiKey) {
    const { from_symbol, to_symbol } = currentPair;
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from_symbol}&to_symbol=${to_symbol}&apikey=${apiKey}`;

    try {
      setLoadingState(true);
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data['Error Message']) throw new Error('Invalid API Key or rate limit exceeded');
      if (data['Note']) throw new Error('API Rate limit exceeded. Please wait a minute and try again.');

      const timeSeries = data['Time Series FX (Daily)'];
      if (!timeSeries) throw new Error('No data available. Check API key and symbol.');

      const prices = Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close'])
        }))
        .reverse();

      priceData = prices;
      setLoadingState(false);
      return prices;
    } catch (error) {
      console.warn('External data failed, using local offline data instead:', error.message);
      const localPrices = generateOfflineSeries(pairName, activeTimeframe);
      priceData = localPrices;
      setLoadingState(false);
      return localPrices;
    }
  }

  const localPrices = generateOfflineSeries(pairName, activeTimeframe);
  priceData = localPrices;
  return localPrices;
}

function setLoadingState(isLoading) {
  const loading = document.getElementById('loading');
  if (!loading) return;
  if (isLoading) loading.classList.remove('hidden');
  else loading.classList.add('hidden');
}

function simpleMovingAverage(data, period) {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    sma.push(slice.reduce((a, b) => a + b) / period);
  }
  return sma;
}

function calculateStochastic(prices, kPeriod = 14, smoothK = 3, smoothD = 3) {
  if (prices.length < kPeriod) return null;

  const closes = prices.map(p => p.close);
  const fastK = [];

  for (let i = kPeriod - 1; i < closes.length; i++) {
    const period = closes.slice(i - kPeriod + 1, i + 1);
    const lowest = Math.min(...period);
    const highest = Math.max(...period);
    const value = ((closes[i] - lowest) / (highest - lowest || 1)) * 100;
    fastK.push(isNaN(value) ? 50 : value);
  }

  const K = simpleMovingAverage(fastK, smoothK);
  const D = simpleMovingAverage(K, smoothD);

  return {
    K: K[K.length - 1],
    D: D[D.length - 1],
    allKValues: K,
    allDValues: D
  };
}

function calculateRSI(prices, period = 14) {
  if (prices.length <= period) return 50;

  const closes = prices.map(p => p.close);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - i] - closes[closes.length - i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (prices.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0 };

  const closes = prices.map(p => p.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine = fastEMA[fastEMA.length - 1] - slowEMA[slowEMA.length - 1];

  const signalLine = calculateEMA(
    fastEMA.slice(Math.max(0, fastEMA.length - signalPeriod)).map((v, i, arr) => arr[i]),
    signalPeriod
  );

  const signalValue = signalLine[signalLine.length - 1] || 0;
  return {
    macd: macdLine,
    signal: signalValue,
    histogram: macdLine - signalValue
  };
}

function calculateEMA(values, period) {
  const k = 2 / (period + 1);
  const ema = [];

  values.forEach((value, index) => {
    if (index === 0) {
      ema.push(value);
      return;
    }
    ema.push((value - ema[index - 1]) * k + ema[index - 1]);
  });

  return ema;
}

function generateSignals(stochastic) {
  if (!stochastic) return { buy: 'Awaiting data', sell: 'Awaiting data' };

  const K = stochastic.K;
  const D = stochastic.D;
  let buySignal = '';
  let sellSignal = '';

  if (K > 80 && D > 80) {
    sellSignal = 'Overbought Signal';
  } else if (K < 20 && D < 20) {
    buySignal = 'Oversold Signal';
  } else if (K > D && K < 50) {
    buySignal = 'Bullish Crossover';
  } else if (K < D && K > 50) {
    sellSignal = 'Bearish Crossover';
  } else {
    buySignal = 'Wait for signal';
    sellSignal = 'Wait for signal';
  }

  return { buy: buySignal || 'Neutral', sell: sellSignal || 'Neutral' };
}

function updatePriceActionMeta(prices) {
  if (!prices || prices.length < 2) return;

  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const direction = last.close >= prev.close ? 'Bullish' : 'Bearish';
  const changePercent = ((last.close - prev.close) / prev.close) * 100;

  const trendChip = document.getElementById('marketTrendChip');
  if (trendChip) {
    trendChip.textContent = direction;
    trendChip.style.color = direction === 'Bullish' ? '#4ade80' : '#f87171';
    trendChip.style.borderColor = direction === 'Bullish' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)';
  }

  const marketTimeframe = document.getElementById('marketTimeframe');
  if (marketTimeframe) marketTimeframe.textContent = activeTimeframe;

  const pairPrice = document.getElementById('pairPrice');
  if (pairPrice) pairPrice.textContent = `$${last.close.toFixed(5)}`;

  const pairChange = document.getElementById('pairChange');
  if (pairChange) {
    pairChange.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
    pairChange.classList.remove('green', 'red');
    pairChange.classList.add(changePercent >= 0 ? 'green' : 'red');
  }

  const trendValue = document.getElementById('trendValue');
  if (trendValue) trendValue.textContent = direction;

  const trendStrength = document.getElementById('trendStrength');
  if (trendStrength) trendStrength.textContent = `${Math.abs(changePercent).toFixed(2)}%`;

  const marketBiasText = document.getElementById('marketBiasText');
  if (marketBiasText) marketBiasText.textContent = direction;

  const signalStrength = document.getElementById('signalStrength');
  if (signalStrength) signalStrength.textContent = Math.abs(changePercent) > 0.5 ? 'Strong' : 'Moderate';

  const breakoutZone = document.getElementById('breakoutZone');
  if (breakoutZone) breakoutZone.textContent = changePercent > 0 ? 'Breakout above range' : 'Breakdown below range';

  const marketPairName = document.getElementById('marketPairName');
  if (marketPairName) marketPairName.textContent = currentPair.display;

  const marketLastUpdated = document.getElementById('marketLastUpdated');
  if (marketLastUpdated) marketLastUpdated.textContent = 'Updated now';
}

function renderPriceChart(prices) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 900;
  const height = rect.height || 260;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(300, width * dpr);
  canvas.height = Math.max(220, height * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const visibleCandles = prices.slice(-80);
  if (!visibleCandles.length) return;

  const pad = { top: 18, right: 14, bottom: 28, left: 42 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const minPrice = Math.min(...visibleCandles.map(c => c.low));
  const maxPrice = Math.max(...visibleCandles.map(c => c.high));
  const priceRange = Math.max(maxPrice - minPrice, 0.0001);

  function yFromPrice(price) {
    const ratio = (maxPrice - price) / priceRange;
    return pad.top + ratio * innerHeight;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#8ea0bb';
  ctx.font = '11px Arial';

  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * innerHeight;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();

    const priceLabel = maxPrice - (i / 5) * priceRange;
    ctx.fillText(priceLabel.toFixed(4), 6, y + 4);
  }

  const xStep = innerWidth / visibleCandles.length;
  const candleWidth = Math.min(14, Math.max(4, xStep * 0.68));

  visibleCandles.forEach((candle, index) => {
    const x = pad.left + index * xStep + xStep / 2;
    const highY = yFromPrice(candle.high);
    const lowY = yFromPrice(candle.low);
    const openY = yFromPrice(candle.open);
    const closeY = yFromPrice(candle.close);
    const isBullish = candle.close >= candle.open;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
    const color = isBullish ? '#22c55e' : '#ef4444';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  });

  const last = visibleCandles[visibleCandles.length - 1];
  const prev = visibleCandles[visibleCandles.length - 2] || last;
  const trend = last.close >= prev.close ? 'Bullish' : 'Bearish';
  const signalEl = document.getElementById('marketTrendChip');
  if (signalEl) {
    signalEl.textContent = trend;
    signalEl.style.color = trend === 'Bullish' ? '#4ade80' : '#f87171';
    signalEl.style.borderColor = trend === 'Bullish' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)';
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScannerSignalForSymbol(symbol) {
  const prices = generateOfflineSeries(symbol, activeTimeframe);
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2] || last;
  const stochastic = calculateStochastic(prices, 14, 3, 3);
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices, 12, 26, 9);
  const direction = last.close >= prev.close ? 'Bullish' : 'Bearish';

  let score = 0;
  score += last.close >= prev.close ? 16 : -16;

  if (rsi > 55) score += 12;
  if (rsi < 45) score -= 12;
  if (rsi > 70) score += 4;
  if (rsi < 30) score -= 4;

  if (macd.macd > macd.signal) score += 18;
  else score -= 18;

  if (macd.histogram > 0) score += 8;
  if (macd.histogram < 0) score -= 8;

  if (stochastic) {
    if (stochastic.K > stochastic.D) score += 10;
    else score -= 10;
    if (stochastic.K > 70) score += 5;
    if (stochastic.K < 30) score -= 5;
  }

  const signal = score >= 0 ? 'Buy' : 'Sell';
  const confidence = clamp(50 + Math.abs(score) * 2.2, 52, 97);
  const atr = prices.reduce((sum, candle) => sum + (candle.high - candle.low), 0) / prices.length;
  const risk = atr * 1.6;
  const entry = last.close;
  const stopLoss = signal === 'Buy' ? entry - risk : entry + risk;
  const takeProfit = signal === 'Buy' ? entry + risk * 2.5 : entry - risk * 2.5;

  const reason = `${direction} bias • RSI ${rsi.toFixed(1)} • MACD ${macd.macd.toFixed(4)} • K ${stochastic ? stochastic.K.toFixed(1) : 'N/A'}`;

  return {
    symbol,
    timeframe: activeTimeframe,
    signal,
    direction,
    score,
    confidence,
    entry: Number(entry).toFixed(5),
    tp: Number(takeProfit).toFixed(5),
    sl: Number(stopLoss).toFixed(5),
    reason
  };
}

function renderScannerResults() {
  const container = document.getElementById('scannerList');
  if (!container) return;

  scannerResults = selectedScannerSymbols
    .map(getScannerSignalForSymbol)
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  container.innerHTML = scannerResults
    .map((item, index) => {
      const isBuy = item.signal === 'Buy';
      return `
        <div class="scanner-row ${isBuy ? 'buy' : 'sell'}">
          <div class="scanner-head">
            <span class="scanner-symbol">#${index + 1} ${item.symbol}</span>
            <span class="scanner-time">${item.timeframe}</span>
          </div>
          <div class="scanner-bias">${item.signal}</div>
          <div class="scanner-metric">Entry ${item.entry}</div>
          <div class="scanner-metric">TP ${item.tp}</div>
          <div class="scanner-metric">SL ${item.sl}</div>
          <div class="scanner-confidence">${item.confidence}%</div>
          <div class="scanner-reason">${item.reason}</div>
        </div>
      `;
    })
    .join('');
}

function runSignalScanner() {
  renderScannerResults();
}

function renderStochasticChart(prices, stochastic) {
  const canvas = document.getElementById('stochasticChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (stochasticChart) stochasticChart.destroy();

  const startIdx = prices.length - stochastic.allKValues.length;
  const dates = prices.slice(startIdx).map(p => p.date.substring(5));

  stochasticChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Stochastic K (14)',
          data: stochastic.allKValues,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: '#4caf50',
          borderWidth: 2
        },
        {
          label: 'Stochastic D (SMA)',
          data: stochastic.allDValues,
          borderColor: '#ff9800',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: '#ff9800',
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#e0e0e0', font: { size: 12 } } }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: '#a0a0a0',
            callback: value => value + '%'
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    }
  });
}

function updateUI(prices) {
  if (!prices || prices.length === 0) return;

  updatePriceActionMeta(prices);

  const stochastic = calculateStochastic(prices);
  if (!stochastic) return;

  const valueEl = document.getElementById('stochasticValue');
  if (valueEl) valueEl.textContent = `K: ${stochastic.K.toFixed(2)} | D: ${stochastic.D.toFixed(2)}`;

  const signals = generateSignals(stochastic);

  const buySignal = document.getElementById('buySignal');
  if (buySignal) {
    buySignal.classList.remove('buy', 'sell', 'neutral');
    if (signals.buy === 'Oversold Signal' || signals.buy === 'Bullish Crossover') {
      buySignal.classList.add('buy');
      const reason = document.getElementById('buyReason');
      if (reason) reason.textContent = signals.buy;
    } else {
      buySignal.classList.add('neutral');
      const reason = document.getElementById('buyReason');
      if (reason) reason.textContent = signals.buy;
    }
  }

  const sellSignal = document.getElementById('sellSignal');
  if (sellSignal) {
    sellSignal.classList.remove('buy', 'sell', 'neutral');
    if (signals.sell === 'Overbought Signal' || signals.sell === 'Bearish Crossover') {
      sellSignal.classList.add('sell');
      const reason = document.getElementById('sellReason');
      if (reason) reason.textContent = signals.sell;
    } else {
      sellSignal.classList.add('neutral');
      const reason = document.getElementById('sellReason');
      if (reason) reason.textContent = signals.sell;
    }
  }

  renderPriceChart(prices);
  renderStochasticChart(prices, stochastic);
  runSignalScanner();
}

async function refreshData(evt) {
  const btn = evt?.target || null;
  if (btn) btn.disabled = true;

  const prices = await fetchForexData();
  if (prices) updateUI(prices);

  if (btn) btn.disabled = false;
}

function initializeDashboard() {
  populateBrokerOptions();
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tf === activeTimeframe);
  });

  document.querySelectorAll('.scan-symbol').forEach(btn => {
    btn.classList.toggle('active', selectedScannerSymbols.includes(btn.dataset.symbol));
  });

  if (apiKey) {
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = apiKey;
  }

  if (priceData.length) {
    updateUI(priceData);
  } else {
    refreshData();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const savedLicense = localStorage.getItem(`${STORAGE_KEY}_license`);
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');

  if (usernameInput) usernameInput.value = 'guest';
  if (passwordInput) passwordInput.value = 'guest';

  localStorage.setItem(`${STORAGE_KEY}_username`, 'guest');
  localStorage.setItem(`${STORAGE_KEY}_password`, 'guest');
  localStorage.setItem(`${STORAGE_KEY}_license`, 'MTSFX-LICENSE-ACTIVE');

  if (savedLicense && validateLicenseKey(savedLicense)) {
    updateLicenseStatus(true);
  } else {
    updateLicenseStatus(true);
  }

  showDashboardScreen();
  initializeDashboard();

  if (apiKey) {
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = apiKey;
  }
});

window.addEventListener('resize', () => {
  if (priceData.length) {
    renderPriceChart(priceData);
    const stochastic = calculateStochastic(priceData);
    if (stochastic) renderStochasticChart(priceData, stochastic);
  }
});

window.login = login;
window.activateLicense = activateLicense;
window.saveApiKey = saveApiKey;
window.refreshData = refreshData;
window.selectPair = selectPair;
window.setActiveTimeframe = setActiveTimeframe;
window.toggleScannerSymbol = toggleScannerSymbol;
