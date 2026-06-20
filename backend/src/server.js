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

app.get('/', (req, res) => {
  res.json({
    name: 'LoopClose API',
    version: '2.0.0',
    status: 'running',
    database: 'Supabase (Postgres)',
    description: 'AI-powered referral loop closure for primary care',
  });
});

app.use('/api/referrals', referralRoutes);
app.use('/api/referrals', reportRoutes);
app.use('/api/patients', (req, res, next) => {
  req.url = '/patients' + req.url;
  referralRoutes(req, res, next);
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🏥 LoopClose API running on http://localhost:${PORT}`);
  console.log(`🗄️  Database: Supabase — kmxrsbmjfyqdvzdluwfg`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET    /api/patients`);
  console.log(`   GET    /api/patients/:id`);
  console.log(`   GET    /api/referrals`);
  console.log(`   POST   /api/referrals`);
  console.log(`   GET    /api/referrals/:id`);
  console.log(`   PATCH  /api/referrals/:id/status`);
  console.log(`   GET    /api/referrals/:id/timeline`);
  console.log(`   POST   /api/referrals/:id/report`);
  console.log(`   POST   /api/referrals/process-text`);
  console.log(`   POST   /api/referrals/suggest-specialist\n`);
});
