const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'MTSFX Strategy Indicator' });
});

app.listen(PORT, () => {
  console.log(`MTSFX app running at http://localhost:${PORT}`);
});
