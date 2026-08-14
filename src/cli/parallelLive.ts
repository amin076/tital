import crypto from 'crypto';
import { type ResearchQuestion } from '../domain/researchQuestion.js';
import { discoverSources } from '../services/discoverSources.js';
import { parallelSearch } from '../integrations/parallel/parallelSearch.js';

async function main(): Promise<void> {
  const questionText = process.argv.slice(2).join(' ').trim();

  if (!questionText) {
    console.error('Usage: npm run parallel-live -- "<approved research question>"');
    process.exit(1);
  }

  if (!process.env.PARALLEL_API_KEY) {
    console.error('Error: PARALLEL_API_KEY is not set in the environment.');
    process.exit(1);
  }

  const researchQuestion: ResearchQuestion = {
    id: `RQ-LIVE-${crypto.randomUUID()}`,
    filmBriefId: 'FB-LIVE-PARALLEL-INTEGRATION',
    question: questionText,
    purpose: 'Live Phase 4B integration check for Partner source discovery.',
    priority: 'HIGH',
    status: 'APPROVED',
  };

  try {
    const sources = await discoverSources(
      researchQuestion,
      {
        objective: `Find reliable public-web sources that directly help answer this approved scientific research question: ${questionText}`,
        searchQueries: [questionText],
        mode: 'basic',
        maxCharsTotal: 6000,
      },
      parallelSearch
    );

    console.log(JSON.stringify({
      researchQuestionId: researchQuestion.id,
      sourceCount: sources.length,
      sources,
    }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Parallel live integration failed: ${message}`);
    process.exit(1);
  }
}

void main();
