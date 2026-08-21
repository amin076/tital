import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TITAL_GEMINI_MODEL } from '../src/config/models.js';

const AGENT_FILES = [
  'agent.ts',
  'src/agents/claimGenerationAgent.ts',
  'src/agents/defineAgent.ts',
  'src/agents/evidenceExtractionAgent.ts',
  'src/agents/parallelSourceAgent.ts',
  'src/agents/researchQuestionAgent.ts',
  'src/agents/sceneDirectorAgent.ts',
  'src/agents/scientificScriptAgent.ts',
  'src/agents/shotDirectorAgent.ts',
  'src/agents/visualDecisionAgent.ts',
] as const;

describe('All Things Agentic submission compliance', () => {
  it('uses the required Gemini 3.5 Flash submission model', () => {
    expect(TITAL_GEMINI_MODEL).toBe('gemini-3.5-flash');
  });

  it('routes every Tital LLM agent through the centralized compliant model', () => {
    for (const path of AGENT_FILES) {
      const source = readFileSync(path, 'utf8');
      expect(source, path).toContain('TITAL_GEMINI_MODEL');
      expect(source, path).not.toContain("model: 'gemini-2.5-flash'");
    }
  });
});
