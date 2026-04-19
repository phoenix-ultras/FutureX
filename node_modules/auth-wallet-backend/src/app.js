const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const marketRoutes = require('./routes/marketRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const walletRoutes = require('./routes/walletRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const squadRoutes = require('./routes/squadRoutes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiters');
const env = require('./config/env');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(apiLimiter);

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/markets', marketRoutes);
app.use('/market', marketRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/trade', tradeRoutes);
app.use('/user', tradeRoutes);
app.use('/api/user', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/squads', squadRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
