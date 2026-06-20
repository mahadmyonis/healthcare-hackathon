-- LoopClose — Full Schema
-- Run this in Supabase SQL Editor

-- PATIENTS (Synthea data)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  health_card_number TEXT,
  conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  family_doctor TEXT,
  last_visit DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  referring_doctor TEXT NOT NULL,
  specialist_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergent')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'received', 'scheduled', 'seen',
    'needs_attention', 'needs_reschedule',
    'report_submitted', 'rejected', 'closed'
  )),
  appointment_notes TEXT,
  report_text TEXT,
  report_received_at TIMESTAMPTZ,
  diagnosis TEXT,
  key_findings TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  follow_up_timeline TEXT,
  patient_message TEXT,
  rejection_reason TEXT,
  suggested_next_step TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on referrals
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- SEED: Synthea Patients
-- ─────────────────────────────────────────
INSERT INTO patients (name, dob, gender, health_card_number, conditions, medications, allergies, family_doctor, last_visit) VALUES
(
  'Margaret Chen', '1952-03-14', 'Female', '1234-567-890',
  ARRAY['Hypertension', 'Type 2 Diabetes'],
  ARRAY['Metformin 500mg twice daily', 'Ramipril 10mg daily'],
  ARRAY['Penicillin'],
  'Dr. Sarah Chen', '2026-06-01'
),
(
  'James Okafor', '1968-07-22', 'Male', '2345-678-901',
  ARRAY['COPD', 'Hypertension'],
  ARRAY['Salbutamol inhaler PRN', 'Amlodipine 5mg daily'],
  ARRAY['None known'],
  'Dr. Sarah Chen', '2026-05-28'
),
(
  'Sarah Tremblay', '1975-11-05', 'Female', '3456-789-012',
  ARRAY['Anxiety Disorder', 'Iron Deficiency Anemia'],
  ARRAY['Sertraline 50mg daily', 'Ferrous sulfate 300mg daily'],
  ARRAY['Sulfa drugs'],
  'Dr. Sarah Chen', '2026-06-10'
),
(
  'Robert Patel', '1945-09-30', 'Male', '4567-890-123',
  ARRAY['Atrial Fibrillation', 'Heart Failure', 'Hypertension'],
  ARRAY['Warfarin 5mg daily', 'Furosemide 40mg daily', 'Bisoprolol 5mg daily'],
  ARRAY['ASA', 'Codeine'],
  'Dr. Sarah Chen', '2026-06-18'
),
(
  'Linda Beaumont', '1983-02-18', 'Female', '5678-901-234',
  ARRAY['Rheumatoid Arthritis'],
  ARRAY['Methotrexate 15mg weekly', 'Folic acid 5mg weekly'],
  ARRAY['None known'],
  'Dr. Sarah Chen', '2026-05-15'
),
(
  'Ahmed Hassan', '1990-04-11', 'Male', '6789-012-345',
  ARRAY['Asthma'],
  ARRAY['Fluticasone 250mcg inhaler twice daily', 'Salbutamol inhaler PRN'],
  ARRAY['Aspirin'],
  'Dr. Sarah Chen', '2026-06-05'
),
(
  'Dorothy Williams', '1938-12-25', 'Female', '7890-123-456',
  ARRAY['Osteoporosis', 'Chronic Kidney Disease Stage 3'],
  ARRAY['Calcium carbonate 500mg twice daily', 'Vitamin D 1000IU daily', 'Alendronate 70mg weekly'],
  ARRAY['NSAIDs', 'Contrast dye'],
  'Dr. Sarah Chen', '2026-06-12'
),
(
  'Kevin Nguyen', '1961-08-03', 'Male', '8901-234-567',
  ARRAY['Type 2 Diabetes', 'Diabetic Neuropathy'],
  ARRAY['Insulin Glargine 20 units nightly', 'Gabapentin 300mg three times daily', 'Metformin 1000mg twice daily'],
  ARRAY['None known'],
  'Dr. Sarah Chen', '2026-06-08'
);

-- ─────────────────────────────────────────
-- SEED: Demo Referrals
-- ─────────────────────────────────────────

-- Referral 1: Margaret Chen → Cardiology (report submitted)
INSERT INTO referrals (
  patient_id, referring_doctor, specialist_type, reason, urgency, status,
  report_text, report_received_at,
  diagnosis, key_findings, action_items, follow_up_timeline, patient_message,
  sent_at
) VALUES (
  (SELECT id FROM patients WHERE name = 'Margaret Chen'),
  'Dr. Sarah Chen', 'Cardiology',
  'Exertional chest tightness and dyspnea on exertion x3 weeks, progressive. History of hypertension and T2DM. Rule out cardiac etiology.',
  'urgent', 'report_submitted',
  'CARDIOLOGY CONSULTATION NOTE — Patient seen June 18, 2026. Findings: LVH on ECG, mild aortic stenosis valve area 1.4cm2, EF 55%, positive stress test at 7 METs. Impression: Mild aortic stenosis, CAD cannot be excluded. Recommendations: Start metoprolol succinate 25mg daily, repeat echo in 6 months, refer to cardiac surgery within 60 days, sodium restriction, fasting lipids and HbA1c, follow up cardiology in 3 months.',
  NOW() - INTERVAL '1 day',
  'Mild aortic stenosis with positive stress test. Coronary artery disease cannot be excluded.',
  ARRAY['LVH on ECG', 'Valve area 1.4cm2 (mild stenosis)', 'EF 55% preserved', 'Positive stress test at 7 METs', 'ST depression in lateral leads'],
  ARRAY['Start metoprolol succinate 25mg daily, titrate to 50mg in 4 weeks', 'Order repeat echocardiogram in 6 months', 'Refer to cardiac surgery within 60 days', 'Patient education on sodium restriction (<2g/day)', 'Order fasting lipid panel and HbA1c'],
  'Cardiology follow-up in 3 months. Cardiac surgery consult within 60 days.',
  'Your heart specialist found a mild narrowing of one of your heart valves. We are starting a new medication to help and will monitor this closely over the next 6 months.',
  NOW() - INTERVAL '5 days'
);

-- Referral 2: James Okafor → Respirology (scheduled)
INSERT INTO referrals (patient_id, referring_doctor, specialist_type, reason, urgency, status, sent_at)
VALUES (
  (SELECT id FROM patients WHERE name = 'James Okafor'),
  'Dr. Sarah Chen', 'Respirology',
  'COPD exacerbation frequency increasing. FEV1 declining. Reassess pulmonary function and optimize management.',
  'routine', 'scheduled', NOW() - INTERVAL '10 days'
);

-- Referral 3: Robert Patel → Cardiology (pending — emergent)
INSERT INTO referrals (patient_id, referring_doctor, specialist_type, reason, urgency, status, sent_at)
VALUES (
  (SELECT id FROM patients WHERE name = 'Robert Patel'),
  'Dr. Sarah Chen', 'Cardiology',
  'Worsening heart failure symptoms. Recent weight gain 4kg in 1 week. INR supratherapeutic at 4.2. Urgent cardiology review needed.',
  'emergent', 'pending', NOW() - INTERVAL '1 day'
);

-- Referral 4: Sarah Tremblay → Psychiatry (needs attention)
INSERT INTO referrals (patient_id, referring_doctor, specialist_type, reason, urgency, status, rejection_reason, sent_at)
VALUES (
  (SELECT id FROM patients WHERE name = 'Sarah Tremblay'),
  'Dr. Sarah Chen', 'Psychiatry',
  'Anxiety not responding to Sertraline after 8 weeks. Patient reports worsening panic attacks. Psychiatric evaluation requested.',
  'routine', 'needs_attention',
  'Please include PHQ-9 and GAD-7 scores with referral. Also clarify if patient has had any prior psychiatric care.',
  NOW() - INTERVAL '12 days'
);

-- Referral 5: Linda Beaumont → Rheumatology (closed)
INSERT INTO referrals (
  patient_id, referring_doctor, specialist_type, reason, urgency, status,
  diagnosis, key_findings, action_items, follow_up_timeline, patient_message, sent_at
) VALUES (
  (SELECT id FROM patients WHERE name = 'Linda Beaumont'),
  'Dr. Sarah Chen', 'Rheumatology',
  'RA management review. Patient on Methotrexate 15mg weekly. Joint inflammation persisting in hands and wrists.',
  'routine', 'closed',
  'Moderate active rheumatoid arthritis despite MTX monotherapy.',
  ARRAY['DAS28 score 4.8 (moderate disease activity)', 'Synovitis in MCP joints bilaterally', 'MTX levels therapeutic'],
  ARRAY['Add hydroxychloroquine 200mg twice daily', 'Monitor LFTs in 6 weeks', 'Consider biologic therapy if no improvement in 3 months'],
  'Rheumatology follow-up in 3 months.',
  'Your arthritis specialist has added a new medication to your treatment plan to help reduce joint inflammation.',
  NOW() - INTERVAL '23 days'
);

-- Referral 6: Ahmed Hassan → Pulmonology (rejected)
INSERT INTO referrals (patient_id, referring_doctor, specialist_type, reason, urgency, status, rejection_reason, suggested_next_step, sent_at)
VALUES (
  (SELECT id FROM patients WHERE name = 'Ahmed Hassan'),
  'Dr. Sarah Chen', 'Pulmonology',
  'Asthma poorly controlled on current inhaler regimen.',
  'routine', 'rejected',
  'Referral incomplete — missing spirometry results and asthma control questionnaire. Please resubmit with ACQ score and recent PFT.',
  'Complete spirometry and ACQ-7, then resubmit referral to Respirology.',
  NOW() - INTERVAL '8 days'
);

-- ─────────────────────────────────────────
-- SEED: Timeline Events
-- ─────────────────────────────────────────

-- Margaret Chen timeline
INSERT INTO timeline_events (referral_id, status, triggered_by, note, created_at) VALUES
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Margaret Chen') LIMIT 1), 'pending', 'doctor', 'Referral created after appointment. AI suggested Cardiology.', NOW() - INTERVAL '5 days'),
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Margaret Chen') LIMIT 1), 'received', 'specialist', 'Referral received by Dr. Amir Hosseini, Cardiology.', NOW() - INTERVAL '4 days'),
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Margaret Chen') LIMIT 1), 'scheduled', 'specialist', 'Appointment scheduled for June 18 at 10:00am.', NOW() - INTERVAL '3 days'),
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Margaret Chen') LIMIT 1), 'seen', 'specialist', 'Patient seen by Dr. Hosseini. Consultation completed.', NOW() - INTERVAL '2 days'),
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Margaret Chen') LIMIT 1), 'report_submitted', 'specialist', 'Consultation report submitted. AI extracted 5 action items.', NOW() - INTERVAL '1 day');

-- Robert Patel timeline
INSERT INTO timeline_events (referral_id, status, triggered_by, note, created_at) VALUES
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Robert Patel') LIMIT 1), 'pending', 'doctor', 'Urgent referral created. Patient has worsening heart failure.', NOW() - INTERVAL '1 day');

-- Ahmed Hassan timeline
INSERT INTO timeline_events (referral_id, status, triggered_by, note, created_at) VALUES
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Ahmed Hassan') LIMIT 1), 'pending', 'doctor', 'Referral sent to Pulmonology.', NOW() - INTERVAL '8 days'),
((SELECT id FROM referrals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Ahmed Hassan') LIMIT 1), 'rejected', 'specialist', 'Rejected: missing spirometry and ACQ score.', NOW() - INTERVAL '6 days');
