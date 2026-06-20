require('dotenv').config();
const express = require('express');
const cors = require('cors');

const referralRoutes = require('./routes/referrals');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Relay Health API',
    version: '1.0.0',
    status: 'running',
    description: 'AI-powered referral loop closure for primary care',
  });
});

// Routes
app.use('/api/referrals', referralRoutes);
app.use('/api/referrals', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🏥 Relay Health API running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET    /api/referrals`);
  console.log(`   POST   /api/referrals`);
  console.log(`   GET    /api/referrals/:id`);
  console.log(`   PATCH  /api/referrals/:id/status`);
  console.log(`   POST   /api/referrals/:id/report  (upload specialist note)`);
  console.log(`   POST   /api/referrals/process-text  (quick demo endpoint)`);
  console.log(`   POST   /api/referrals/suggest-specialist\n`);
});
