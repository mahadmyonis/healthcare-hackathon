import type { Patient, Referral, ReferralStatus, Specialist, TimelineEvent } from "./types"

interface DB {
  patients: Patient[]
  specialists: Specialist[]
  referrals: Referral[]
  timelines: Record<string, TimelineEvent[]>
  seq: number
}

const DOCTOR = "Dr. Sarah Chen"

function seed(): DB {
  const patients: Patient[] = [
    {
      id: "p1",
      name: "Margaret Chen",
      dob: "1952-03-14",
      gender: "Female",
      health_card_number: "1234-567-890",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      medications: ["Metformin 500mg", "Lisinopril 10mg"],
      allergies: ["Penicillin"],
      family_doctor: DOCTOR,
      last_visit: "2026-06-15",
    },
    {
      id: "p2",
      name: "Ahmed Hassan",
      dob: "1968-07-22",
      gender: "Male",
      health_card_number: "2345-678-901",
      conditions: ["Asthma", "GERD"],
      medications: ["Salbutamol inhaler", "Omeprazole 20mg"],
      allergies: [],
      family_doctor: DOCTOR,
      last_visit: "2026-05-30",
    },
    {
      id: "p3",
      name: "Robert Okafor",
      dob: "1979-11-02",
      gender: "Male",
      health_card_number: "3456-789-012",
      conditions: ["Chronic lower back pain"],
      medications: ["Naproxen 250mg"],
      allergies: ["Sulfa drugs"],
      family_doctor: DOCTOR,
      last_visit: "2026-06-02",
    },
    {
      id: "p4",
      name: "Linda Nguyen",
      dob: "1990-01-19",
      gender: "Female",
      health_card_number: "4567-890-123",
      conditions: ["Migraine"],
      medications: ["Sumatriptan 50mg"],
      allergies: [],
      family_doctor: DOCTOR,
      last_visit: "2026-06-10",
    },
  ]

  const specialists: Specialist[] = [
    {
      id: "s1",
      name: "Dr. Amir Hosseini",
      specialty: "Cardiology",
      clinic_name: "Heartland Cardiology",
      address: "200 Wellington St, Toronto",
      estimated_wait_weeks: 3,
      accepting_referrals: true,
      languages: ["English", "Farsi"],
    },
    {
      id: "s2",
      name: "Dr. Priya Sharma",
      specialty: "Neurology",
      clinic_name: "Downtown Neuro Centre",
      address: "55 King St W, Toronto",
      estimated_wait_weeks: 6,
      accepting_referrals: true,
      languages: ["English", "Hindi"],
    },
    {
      id: "s3",
      name: "Dr. James Wright",
      specialty: "Orthopedics",
      clinic_name: "Bone & Joint Clinic",
      address: "12 Queen St E, Toronto",
      estimated_wait_weeks: 8,
      accepting_referrals: false,
      languages: ["English"],
    },
  ]

  const now = Date.now()
  const day = 86400000
  const iso = (offset: number) => new Date(now - offset * day).toISOString()

  const referrals: Referral[] = [
    {
      id: "r1",
      patientId: "p1",
      referringDoctor: DOCTOR,
      specialistType: "Cardiology",
      reason: "Chest tightness and dyspnea on exertion, 3 weeks progressive. History of HTN and T2DM. BP 155/90.",
      urgency: "urgent",
      appointmentNotes:
        "Doctor: Good morning Margaret, what brings you in today?\n\nPatient: I've been having chest tightness and shortness of breath when I climb stairs. Started 3 weeks ago and getting worse.\n\nDoctor: Any pain in your arm or jaw?\n\nPatient: No, just tightness and I get very tired. My blood pressure readings have been around 155 over 90.\n\nDoctor: Given your history of hypertension and diabetes, we need to investigate this.",
      status: "report_submitted",
      created_at: iso(10),
      report_text:
        "CARDIOLOGY CONSULTATION NOTE\nPatient: Margaret Chen, DOB: 1952-03-14\nReferred by: Dr. Sarah Chen\n\nFINDINGS:\nECG shows left ventricular hypertrophy. Echo reveals mild aortic stenosis valve area 1.4cm2, EF 55%. Stress test positive at 7 METs with ST depression in lateral leads.\n\nIMPRESSION:\nMild aortic stenosis with positive stress test. CAD cannot be excluded.\n\nRECOMMENDATIONS:\n1. Start metoprolol succinate 25mg daily, titrate to 50mg in 4 weeks\n2. Repeat echocardiogram in 6 months\n3. Refer to cardiac surgery within 60 days\n4. Sodium restriction less than 2g per day\n5. Order fasting lipid panel and HbA1c\n6. Follow up cardiology in 3 months",
      extraction: {
        diagnosis: "Mild aortic stenosis with a positive stress test; coronary artery disease cannot be excluded.",
        keyFindings: [
          "ECG: left ventricular hypertrophy",
          "Echo: mild aortic stenosis (valve area 1.4cm2), EF 55%",
          "Stress test positive at 7 METs with lateral ST depression",
        ],
        actionItems: [
          "Start metoprolol succinate 25mg daily, titrate to 50mg in 4 weeks",
          "Repeat echocardiogram in 6 months",
          "Refer to cardiac surgery within 60 days",
          "Sodium restriction < 2g/day",
          "Order fasting lipid panel and HbA1c",
        ],
        followUpTimeline: "Cardiology follow-up in 3 months; cardiac surgery referral within 60 days.",
        patientMessage:
          "Your heart test shows a mild narrowing of one valve. We're starting a new medication and will keep a close eye on it with another scan in 6 months. This is manageable — please reduce salt and follow up as scheduled.",
        urgency: "urgent",
        isRejected: false,
        rejectionReason: "",
        suggestedNextStep: "Start metoprolol and book cardiac surgery referral.",
      },
    },
    {
      id: "r2",
      patientId: "p4",
      referringDoctor: DOCTOR,
      specialistType: "Neurology",
      reason: "Worsening migraines with new visual aura, 2 months. Failed first-line therapy.",
      urgency: "routine",
      appointmentNotes: "Patient reports increasing frequency of migraines with visual aura over the past 2 months.",
      status: "scheduled",
      created_at: iso(6),
    },
    {
      id: "r3",
      patientId: "p2",
      referringDoctor: DOCTOR,
      specialistType: "Gastroenterology",
      reason: "Persistent reflux despite PPI therapy, considering endoscopy.",
      urgency: "routine",
      appointmentNotes: "GERD symptoms persist despite 8 weeks of omeprazole.",
      status: "pending",
      created_at: iso(2),
    },
    {
      id: "r4",
      patientId: "p3",
      referringDoctor: DOCTOR,
      specialistType: "Orthopedics",
      reason: "Chronic lower back pain with radiculopathy, MRI shows L4-L5 disc herniation.",
      urgency: "routine",
      appointmentNotes: "Back pain radiating to left leg for 4 months.",
      status: "rejected",
      created_at: iso(8),
      rejection_reason: "Incomplete referral — please include recent MRI report and conservative treatment history.",
    },
    {
      id: "r5",
      patientId: "p2",
      referringDoctor: DOCTOR,
      specialistType: "Cardiology",
      reason: "Palpitations and occasional lightheadedness, rule out arrhythmia.",
      urgency: "routine",
      appointmentNotes: "Intermittent palpitations for 6 weeks.",
      status: "closed",
      created_at: iso(20),
    },
    {
      id: "r6",
      patientId: "p1",
      referringDoctor: DOCTOR,
      specialistType: "Endocrinology",
      reason: "Poorly controlled diabetes, HbA1c 9.2%, needs medication optimization.",
      urgency: "urgent",
      appointmentNotes: "HbA1c rising despite metformin.",
      status: "needs_attention",
      created_at: iso(4),
    },
  ]

  const timelines: Record<string, TimelineEvent[]> = {}
  const flow: Record<ReferralStatus, ReferralStatus[]> = {
    pending: ["pending"],
    received: ["pending", "received"],
    scheduled: ["pending", "received", "scheduled"],
    seen: ["pending", "received", "scheduled", "seen"],
    report_submitted: ["pending", "received", "scheduled", "seen", "report_submitted"],
    closed: ["pending", "received", "scheduled", "seen", "report_submitted", "closed"],
    rejected: ["pending", "rejected"],
    needs_attention: ["pending", "received", "needs_attention"],
    needs_reschedule: ["pending", "received", "scheduled", "needs_reschedule"],
  }

  for (const r of referrals) {
    const steps = flow[r.status]
    timelines[r.id] = steps.map((status, i) => ({
      status,
      triggered_by: i === 0 ? "Dr. Sarah Chen" : "Dr. Amir Hosseini",
      note:
        status === "rejected"
          ? r.rejection_reason || ""
          : status === r.status && status === "needs_attention"
            ? "Please provide latest labs before scheduling."
            : "",
      created_at: new Date(new Date(r.created_at).getTime() + i * 86400000).toISOString(),
    }))
  }

  return { patients, specialists, referrals, timelines, seq: 100 }
}

// Persist across hot reloads in dev.
const g = globalThis as unknown as { __loopmd?: DB }
if (!g.__loopmd) g.__loopmd = seed()
export const db = g.__loopmd

export function withPatient(r: Referral): Referral {
  return { ...r, patients: db.patients.find((p) => p.id === r.patientId) }
}

export function addTimeline(referralId: string, e: Omit<TimelineEvent, "created_at">) {
  if (!db.timelines[referralId]) db.timelines[referralId] = []
  db.timelines[referralId].push({ ...e, created_at: new Date().toISOString() })
}
