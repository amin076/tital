// Tital's production agent model is intentionally centralized so runtime,
// documentation, tests, and hackathon evidence cannot silently drift apart.
//
// All Things Agentic requires Gemini 3.5 or newer. Gemini 3.5 Flash is GA on
// Google Cloud and is the submission baseline for Tital.
export const TITAL_GEMINI_MODEL = 'gemini-3.5-flash' as const;
