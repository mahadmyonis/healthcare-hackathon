const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACTION_PROMPT = `You are a clinical AI assistant helping Canadian family physicians manage specialist referrals.

You will be given a specialist consultation note. Your job is to extract the following in structured JSON:

1. diagnosis — What the specialist found (1-2 sentences, plain language)
2. keyFindings — Array of the most important clinical findings (max 5 bullet points)
3. actionItems — Array of specific things the FAMILY DOCTOR must do now (e.g. "Start metoprolol 25mg daily", "Order repeat echo in 6 months"). Be specific and actionable. Max 5.
4. followUpTimeline — When the patient needs to be seen again and by whom
5. patientMessage — A plain-language 2-sentence summary the family doctor can use to explain the outcome to the patient
6. urgency — One of: "routine", "urgent", "emergent"
7. isRejected — Boolean. True if the specialist is declining or redirecting the referral
8. rejectionReason — If rejected, why. Otherwise null.
9. suggestedNextStep — If rejected, what the family doctor should do instead. Otherwise null.

Respond ONLY with valid JSON. No markdown, no explanation.`;

async function extractFromReport(reportText) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `CONSULTATION NOTE:\n\n${reportText}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
}

async function suggestSpecialist({ reason, patientHistory, location = 'Ottawa, Ontario' }) {
  const prompt = `You are a Canadian primary care AI assistant. Based on the referral reason and patient history below, suggest the most appropriate specialist type for a patient in ${location}.

Referral reason: ${reason}
Patient history: ${patientHistory || 'Not provided'}

Respond in JSON with:
- specialistType: the recommended specialist (e.g. "Cardiologist", "Respirologist")
- rationale: 1-2 sentences explaining why
- alternativeSpecialist: a second option if the first has long wait times
- estimatedWaitWeeks: estimated wait time range in Ottawa (e.g. "6-12 weeks")
- warningFlags: array of any red flags that might warrant urgent referral instead

Respond ONLY with valid JSON.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

async function extractClinicalNotes(transcript, patientHistory = null) {
  const prompt = `You are a clinical AI assistant listening to a doctor-patient appointment in Canada.

Extract the following from the transcript in structured JSON:

1. symptoms — Array of symptoms mentioned by the patient
2. duration — How long symptoms have been present
3. severity — mild / moderate / severe
4. relevantHistory — Array of relevant medical history items (from transcript or patient record below)
5. urgencyAssessment — routine / urgent / emergent
6. urgencyReason — One sentence explaining the urgency level
7. recommendedAction — What the doctor should do next (e.g. "Cardiology referral", "Order ECG", "Blood work")
8. suggestedSpecialistType — The specialist type most appropriate (e.g. "Cardiologist", "Respirologist")
9. referralReason — A concise, clinical referral reason the doctor can use (2-3 sentences, professional tone)
10. redFlags — Array of any red flag symptoms that need immediate attention

Patient history context: ${patientHistory || 'Not provided'}

Respond ONLY with valid JSON. No markdown.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `APPOINTMENT TRANSCRIPT:\n\n${transcript}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { extractFromReport, suggestSpecialist, extractClinicalNotes };
