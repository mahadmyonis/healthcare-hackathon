export type ReferralStatus =
  | "pending"
  | "received"
  | "scheduled"
  | "seen"
  | "needs_attention"
  | "needs_reschedule"
  | "report_submitted"
  | "rejected"
  | "closed"

export type Urgency = "routine" | "urgent" | "emergent"

export interface Patient {
  id: string
  name: string
  dob: string
  gender: string
  health_card_number: string
  conditions: string[]
  medications: string[]
  allergies: string[]
  family_doctor: string
  last_visit: string
}

export interface Specialist {
  id: string
  name: string
  specialty: string
  clinic_name: string
  address: string
  estimated_wait_weeks: number
  accepting_referrals: boolean
  languages: string[]
}

export interface TimelineEvent {
  status: ReferralStatus
  triggered_by: string
  note: string
  created_at: string
}

export interface Extraction {
  diagnosis: string
  keyFindings: string[]
  actionItems: string[]
  followUpTimeline: string
  patientMessage: string
  urgency: string
  isRejected: boolean
  rejectionReason: string
  suggestedNextStep: string
}

export interface Referral {
  id: string
  patientId: string
  referringDoctor: string
  specialistType: string
  reason: string
  urgency: Urgency
  appointmentNotes: string
  status: ReferralStatus
  created_at: string
  report_text?: string
  extraction?: Extraction
  rejection_reason?: string
  patients?: Patient
}
