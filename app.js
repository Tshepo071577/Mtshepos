// ============================================
// LICENSE-ONLY ACCESS FLOW
// ============================================

const VALID_LICENSE_KEYS = [
  'MTSFX-FOREX-2026-PROFESSIONAL',
  'MTSFX-FOREX-2026-DEMO',
  'FOREX-STOCH-2024-DEMO',
  'MTSFX-LICENSE-ACTIVE',
  'TRADING-INDICATOR-2026'
];

const STORAGE_KEY = 'forexIndicator';
let priceChart = null;
let stochasticChart = null;
let currentPair = { display: 'EUR/USD', from_symbol: 'EUR', to_symbol: 'USD' };
let apiKey = localStorage.getItem(`${STORAGE_KEY}_apiKey`) || '';
let priceData = [];

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

function activateLicense() {
  const keyInput = document.getElementById('licenseKeyInput');
  const key = keyInput.value.trim();

  if (!key) {
    showError('Please enter a license key');
    return;
  }

  if (!validateLicenseKey(key)) {
    showError('❌ Invalid license key. Please check and try again.');
    updateLicenseStatus(false);
    return;
  }

  localStorage.setItem(`${STORAGE_KEY}_license`, key);
  updateLicenseStatus(true);
  keyInput.value = '';
  showDashboardScreen();
  initializeDashboard();
}

function checkSavedLicense() {
  const savedLicense = localStorage.getItem(`${STORAGE_KEY}_license`);
  if (savedLicense && validateLicenseKey(savedLicense)) {
    updateLicenseStatus(true);
    showDashboardScreen();
    initializeDashboard();
    return true;
  }
  updateLicenseStatus(false);
  return false;
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) {
    showError('Please enter an API key');
    return;
  }
  apiKey = key;
  localStorage.setItem(`${STORAGE_KEY}_apiKey`, key);
  document.getElementById('apiKeyInput').value = key;
  refreshData();
}

function selectPair(display, from_symbol, to_symbol) {
  currentPair = { display, from_symbol, to_symbol };
  document.querySelectorAll('.pair-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(display)) btn.classList.add('active');
  });
  refreshData();
}

async function fetchForexData() {
  if (!apiKey) {
    showError('Please enter your AlphaVantage API key first');
    return null;
  }

  const { from_symbol, to_symbol } = currentPair;
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from_symbol}&to_symbol=${to_symbol}&apikey=${apiKey}`;

  try {
    setLoadingState(true);
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) throw new Error('Invalid API Key or rate limit exceeded');
    if (data['Note']) throw new Error('API Rate limit exceeded. Please wait a minute and try again.');

    let timeSeries = data['Time Series FX (Daily)'];
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
    setLoadingState(false);
    showError(`Error fetching data: ${error.message}`);
    return null;
  }
}

function setLoadingState(isLoading) {
  const loading = document.getElementById('loading');
  if (!loading) return;
  if (isLoading) loading.classList.remove('hidden');
  else loading.classList.add('hidden');
}

function calculateStochastic(prices, kPeriod = 14, smoothK = 3, smoothD = 3) {
  if (prices.length < kPeriod) return null;

  const fastK = [];
  const closes = prices.map(p => p.close);

  for (let i = kPeriod - 1; i < closes.length; i++) {
    const period = closes.slice(i - kPeriod + 1, i + 1);
    const lowest = Math.min(...period);
    const highest = Math.max(...period);
    const k = ((closes[i] - lowest) / (highest - lowest)) * 100;
    fastK.push(isNaN(k) ? 50 : k);
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

function simpleMovingAverage(data, period) {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    sma.push(slice.reduce((a, b) => a + b) / period);
  }
  return sma;
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

function renderPriceChart(prices) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (priceChart) priceChart.destroy();

  const dates = prices.map(p => p.date.substring(5));
  const closes = prices.map(p => p.close);

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: `${currentPair.display} Price`,
        data: closes,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#00d4ff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 12 } } } },
      scales: {
        y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    }
  });
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
      document.getElementById('buyReason').textContent = signals.buy;
    } else {
      buySignal.classList.add('neutral');
      document.getElementById('buyReason').textContent = signals.buy;
    }
  }

  const sellSignal = document.getElementById('sellSignal');
  if (sellSignal) {
    sellSignal.classList.remove('buy', 'sell', 'neutral');
    if (signals.sell === 'Overbought Signal' || signals.sell === 'Bearish Crossover') {
      sellSignal.classList.add('sell');
      document.getElementById('sellReason').textContent = signals.sell;
    } else {
      sellSignal.classList.add('neutral');
      document.getElementById('sellReason').textContent = signals.sell;
    }
  }

  renderPriceChart(prices);
  renderStochasticChart(prices, stochastic);
}

async function refreshData(evt) {
  const btn = evt?.target || null;
  if (btn) btn.disabled = true;

  const prices = await fetchForexData();
  if (prices) updateUI(prices);

  if (btn) btn.disabled = false;
}

function initializeDashboard() {
  if (apiKey) {
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = apiKey;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  if (loginSection) loginSection.classList.add('hidden');

  const savedLicense = localStorage.getItem(`${STORAGE_KEY}_license`);
  if (savedLicense && validateLicenseKey(savedLicense)) {
    updateLicenseStatus(true);
    showDashboardScreen();
    initializeDashboard();
    return;
  }

  showLicenseScreen();
  updateLicenseStatus(false);
  if (apiKey) {
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = apiKey;
  }
});
