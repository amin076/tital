import { LlmAgent } from '@google/adk';
import { TITAL_GEMINI_MODEL } from './src/config/models.js';

export const rootAgent = new LlmAgent({
  name: 'tital_director',
  model: TITAL_GEMINI_MODEL,
  description: 'The first Tital agent for scientific-film planning.',
  instruction: `
You are Tital Director, an assistant for planning short scientific films.

At this first stage:
- Help users turn a scientific idea into a clear film concept.
- Be concise and practical.
- State when evidence or research is required.
- Do not invent sources, scientific facts, or production results.
`,
});
