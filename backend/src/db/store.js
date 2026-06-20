const supabase = require('./supabase');

// ─────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────

async function getAllPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

async function getPatientById(id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────

async function getAllReferrals(status = null) {
  let query = supabase
    .from('referrals')
    .select(`*, patients(name, dob, health_card_number, conditions, medications)`)
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getReferralById(id) {
  const { data, error } = await supabase
    .from('referrals')
    .select(`*, patients(*)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createReferral({ patientId, referringDoctor, specialistType, reason, urgency = 'routine', appointmentNotes = null }) {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      patient_id: patientId,
      referring_doctor: referringDoctor,
      specialist_type: specialistType,
      reason,
      urgency,
      appointment_notes: appointmentNotes,
      status: 'pending',
    })
    .select(`*, patients(*)`)
    .single();
  if (error) throw error;

  // Log timeline event
  await addTimelineEvent(data.id, 'pending', 'doctor', 'Referral created and sent to specialist.');

  return data;
}

async function updateReferral(id, updates) {
  const { data, error } = await supabase
    .from('referrals')
    .update(updates)
    .eq('id', id)
    .select(`*, patients(*)`)
    .single();
  if (error) throw error;
  return data;
}

async function updateReferralStatus(id, status, triggeredBy = 'system', note = null) {
  const { data, error } = await supabase
    .from('referrals')
    .update({ status })
    .eq('id', id)
    .select(`*, patients(*)`)
    .single();
  if (error) throw error;

  // Log timeline event for every status change
  await addTimelineEvent(id, status, triggeredBy, note || `Status updated to ${status}`);

  return data;
}

async function deleteReferral(id) {
  const { error } = await supabase
    .from('referrals')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ─────────────────────────────────────────
// TIMELINE EVENTS
// ─────────────────────────────────────────

async function addTimelineEvent(referralId, status, triggeredBy, note = null) {
  const { error } = await supabase
    .from('timeline_events')
    .insert({ referral_id: referralId, status, triggered_by: triggeredBy, note });
  if (error) console.error('Timeline event error:', error);
}

async function getTimeline(referralId) {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('referral_id', referralId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

module.exports = {
  getAllPatients,
  getPatientById,
  getAllReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  updateReferralStatus,
  deleteReferral,
  addTimelineEvent,
  getTimeline,
};
