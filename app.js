// ============================================
// FOREX STOCHASTIC INDICATOR DASHBOARD
// ============================================

// 🔑 VALID LICENSE KEYS - Add/remove keys as needed
const VALID_LICENSE_KEYS = [
    'MTSFX-FOREX-2026-PROFESSIONAL',
    'MTSFX-FOREX-2026-DEMO',
    'FOREX-STOCH-2024-DEMO',
    'MTSFX-LICENSE-ACTIVE',
    'TRADING-INDICATOR-2026'
];

const STORAGE_KEY = 'forexIndicator';
let chart = null;
let currentPair = { display: 'EUR/USD', symbol: 'EURUSD' };
let licenseActive = false;
let apiKey = localStorage.getItem(`${STORAGE_KEY}_apiKey`) || '';
let priceData = [];

// ============================================
// LICENSE MANAGEMENT
// ============================================

function activateLicense() {
    console.log('🔍 activateLicense() called');
    const keyInput = document.getElementById('licenseKeyInput');
    const key = keyInput.value.trim().toUpperCase();

    console.log('📝 Input key (uppercase):', key);

    if (!key) {
        console.warn('⚠️ No key entered');
        showError('Please enter a license key');
        return;
    }

    // Validate license key locally
    if (validateLicenseKey(key)) {
        console.log('✅ License validation passed!');
        licenseActive = true;
        localStorage.setItem(`${STORAGE_KEY}_license`, key);
        updateLicenseStatus(true);
        document.getElementById('mainContent').classList.add('active');
        document.getElementById('licenseSection').classList.add('hidden');
        keyInput.value = '';
        console.log('🎉 License activated successfully');
        initializeDashboard();
    } else {
        console.error('❌ Invalid license key');
        showError('❌ Invalid license key. Please check and try again.');
        updateLicenseStatus(false);
    }
}

function validateLicenseKey(key) {
    // Check if key is in the valid list
    const isValid = VALID_LICENSE_KEYS.some(validKey => 
        validKey.toUpperCase() === key.toUpperCase()
    );
    
    console.log('🔑 Valid license keys available:', VALID_LICENSE_KEYS.length);
    console.log('✓ Key matches:', isValid);
    
    return isValid;
}

function updateLicenseStatus(active) {
    const status = document.getElementById('licenseStatus');
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

function checkLicense() {
    const savedLicense = localStorage.getItem(`${STORAGE_KEY}_license`);
    console.log('🔍 Checking saved license:', savedLicense);
    
    if (savedLicense && validateLicenseKey(savedLicense)) {
        console.log('✅ Saved license found and valid');
        licenseActive = true;
        updateLicenseStatus(true);
        document.getElementById('mainContent').classList.add('active');
        document.getElementById('licenseSection').classList.add('hidden');
        initializeDashboard();
        return true;
    }
    console.log('❌ No valid saved license');
    return false;
}

// ============================================
// API KEY MANAGEMENT
// ============================================

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

// ============================================
// PAIR SELECTION
// ============================================

function selectPair(display, symbol) {
    currentPair = { display, symbol };
    
    // Update button states
    document.querySelectorAll('.pair-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(display)) {
            btn.classList.add('active');
        }
    });

    refreshData();
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchForexData() {
    if (!apiKey) {
        showError('Please enter your AlphaVantage API key first');
        return null;
    }

    const symbol = currentPair.symbol;
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3)}&apikey=${apiKey}`;

    try {
        document.getElementById('loading').classList.remove('hidden');
        const response = await fetch(url);
        const data = await response.json();

        if (data['Error Message']) {
            throw new Error('Invalid API Key or rate limit exceeded');
        }

        if (!data['Time Series FX (Daily)']) {
            throw new Error('No data available. Check API key and symbol.');
        }

        const timeSeries = data['Time Series FX (Daily)'];
        const prices = Object.entries(timeSeries).slice(0, 50).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close'])
        })).reverse();

        priceData = prices;
        document.getElementById('loading').classList.add('hidden');
        return prices;
    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        showError(`Error fetching data: ${error.message}`);
        return null;
    }
}

// ============================================
// STOCHASTIC OSCILLATOR CALCULATION
// ============================================

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

    // Smooth K line
    const K = simpleMovingAverage(fastK, smoothK);
    // D line is SMA of K
    const D = simpleMovingAverage(K, smoothD);

    return {
        K: K[K.length - 1],
        D: D[D.length - 1],
        fastK,
        K,
        D
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

// ============================================
// SIGNAL GENERATION
// ============================================

function generateSignals(stochastic) {
    if (!stochastic) return { buy: 'Awaiting data', sell: 'Awaiting data' };

    const K = stochastic.K;
    const D = stochastic.D;
    let buySignal = '';
    let sellSignal = '';

    // Overbought (>80) / Oversold (<20)
    if (K > 80 && D > 80) {
        buySignal = '';
        sellSignal = 'Overbought Signal';
    } else if (K < 20 && D < 20) {
        buySignal = 'Oversold Signal';
        sellSignal = '';
    } else if (K > D && K < 50) {
        buySignal = 'Bullish Crossover';
        sellSignal = '';
    } else if (K < D && K > 50) {
        buySignal = '';
        sellSignal = 'Bearish Crossover';
    } else {
        buySignal = 'Wait for signal';
        sellSignal = 'Wait for signal';
    }

    return { buy: buySignal || 'Neutral', sell: sellSignal || 'Neutral' };
}

// ============================================
// CHART RENDERING
// ============================================

function renderChart(prices, stochastic) {
    const ctx = document.getElementById('chart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const dates = prices.map(p => p.date.substring(5));
    const closes = prices.map(p => p.close);
    const kValues = stochastic.K || [];
    const dValues = stochastic.D || [];

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Price',
                    data: closes,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y',
                    pointRadius: 2,
                    pointBackgroundColor: '#00d4ff'
                },
                {
                    label: 'Stochastic K',
                    data: kValues,
                    borderColor: '#4caf50',
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 1,
                    borderDash: [5, 5]
                },
                {
                    label: 'Stochastic D',
                    data: dValues,
                    borderColor: '#ff9800',
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 1,
                    borderDash: [10, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: '#e0e0e0', font: { size: 12 } }
                },
                filler: { propagate: true }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 100,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

// ============================================
// UI UPDATES
// ============================================

function updateUI(prices) {
    if (!prices || prices.length === 0) return;

    const stochastic = calculateStochastic(prices);
    if (!stochastic) return;

    // Update Stochastic values
    document.getElementById('stochasticValue').textContent = 
        `K: ${stochastic.K.toFixed(2)} | D: ${stochastic.D.toFixed(2)}`;

    // Generate and display signals
    const signals = generateSignals(stochastic);
    
    // Update Buy Signal
    const buySignal = document.getElementById('buySignal');
    buySignal.classList.remove('buy', 'sell', 'neutral');
    if (signals.buy === 'Oversold Signal' || signals.buy === 'Bullish Crossover') {
        buySignal.classList.add('buy');
        document.getElementById('buyReason').textContent = signals.buy;
    } else {
        buySignal.classList.add('neutral');
        document.getElementById('buyReason').textContent = signals.buy;
    }

    // Update Sell Signal
    const sellSignal = document.getElementById('sellSignal');
    sellSignal.classList.remove('buy', 'sell', 'neutral');
    if (signals.sell === 'Overbought Signal' || signals.sell === 'Bearish Crossover') {
        sellSignal.classList.add('sell');
        document.getElementById('sellReason').textContent = signals.sell;
    } else {
        sellSignal.classList.add('neutral');
        document.getElementById('sellReason').textContent = signals.sell;
    }

    // Render chart
    renderChart(prices, stochastic);
}

// ============================================
// DATA REFRESH
// ============================================

async function refreshData() {
    const btn = event?.target;
    if (btn) btn.disabled = true;

    const prices = await fetchForexData();
    if (prices) {
        updateUI(prices);
    }

    if (btn) btn.disabled = false;
}

// ============================================
// ERROR HANDLING
// ============================================

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

// ============================================
// INITIALIZATION
// ============================================

function initializeDashboard() {
    console.log('📊 Initializing dashboard');
    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
    }
}

// ============================================
// PAGE LOAD
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page loaded, checking license...');
    if (!checkLicense()) {
        // Show license section
        document.getElementById('licenseSection').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('active');
        console.log('📋 License section shown');
    }
});
