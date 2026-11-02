const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const brokerSessions = new Map();
const tradeHistory = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/broker/status', (req, res) => {
  res.json({
    connectedSessions: brokerSessions.size,
    trades: tradeHistory.length,
    brokers: Array.from(brokerSessions.values())
  });
});

app.post('/api/broker/login', (req, res) => {
  const { broker, platform, account, password, server } = req.body || {};

  if (!broker || !platform || !account || !password || !server) {
    return res.status(400).json({
      ok: false,
      message: 'Broker, platform, account, server and password are required.'
    });
  }

  const session = {
    broker,
    platform,
    account,
    server,
    connectedAt: new Date().toISOString(),
    status: 'connected'
  };

  brokerSessions.set(`${broker}:${platform}:${account}`, session);

  return res.json({
    ok: true,
    message: `${broker} ${platform} login accepted.`,
    session
  });
});

app.post('/api/broker/trade', (req, res) => {
  const { broker, platform, account, server, symbol, side, lots = 0.10, pair } = req.body || {};

  if (!broker || !platform || !account || !server || !symbol || !side) {
    return res.status(400).json({
      ok: false,
      message: 'Missing broker trade information.'
    });
  }

  const order = {
    ok: true,
    broker,
    platform,
    account,
    server,
    symbol,
    side,
    lots: Number(lots) || 0.10,
    pair: pair || symbol,
    ticket: `SIM-${Date.now()}`,
    status: 'ORDER_SENT',
    timestamp: new Date().toISOString(),
    message: `${side} order simulated for ${symbol} on ${broker} ${platform}.`
  };

  tradeHistory.push(order);

  return res.json(order);
});

app.listen(port, () => {
  console.log(`MTSFX app running at http://localhost:${port}`);
});

module.exports = app;
