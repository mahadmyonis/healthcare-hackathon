const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/specialists
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('specialists').select('*').order('name');
    if (req.query.specialty) query = query.eq('specialty', req.query.specialty);
    if (req.query.accepting === 'true') query = query.eq('accepting_referrals', true);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, specialists: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/specialists/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ success: true, specialist: data });
  } catch (err) {
    res.status(404).json({ error: 'Specialist not found' });
  }
});

// GET /api/specialists/by-specialty/:specialty
router.get('/by-specialty/:specialty', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .ilike('specialty', `%${req.params.specialty}%`)
      .eq('accepting_referrals', true)
      .order('estimated_wait_weeks');
    if (error) throw error;
    res.json({ success: true, specialists: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
