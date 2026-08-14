import crypto from 'crypto';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import {
  ParallelSearchRequestSchema,
  type ParallelSearchClient,
  type ParallelSearchRequest,
  type ParallelSearchResponse,
} from '../integrations/parallel/parallelSearch.js';

export function validateResearchQuestionForSearch(question: ResearchQuestion): void {
  const parsed = ResearchQuestionSchema.safeParse(question);
  if (!parsed.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsed.error.message}`);
  }

  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: source discovery requires APPROVED status, current status is "${question.status}".`
    );
  }
}

export function mapParallelResultsToSources(
  questionId: string,
  response: ParallelSearchResponse,
  idFactory: () => string = () => `SRC-${crypto.randomUUID()}`,
  now: () => string = () => new Date().toISOString()
): SourceRecord[] {
  return response.results.map((result) => {
    const source = {
      id: idFactory(),
      researchQuestionId: questionId,
      provider: 'PARALLEL' as const,
      providerSearchId: response.search_id,
      url: result.url,
      title: result.title,
      publishDate: result.publish_date,
      excerpts: result.excerpts.filter((excerpt) => excerpt.trim().length > 0),
      retrievedAt: now(),
      status: 'DISCOVERED' as const,
    };

    const parsed = SourceRecordSchema.safeParse(source);
    if (!parsed.success) {
      throw new Error(`Final SourceRecord validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  });
}

export async function discoverSources(
  researchQuestion: ResearchQuestion,
  request: ParallelSearchRequest,
  searchClient: ParallelSearchClient,
  options: {
    idFactory?: () => string;
    now?: () => string;
  } = {}
): Promise<SourceRecord[]> {
  validateResearchQuestionForSearch(researchQuestion);

  const parsedRequest = ParallelSearchRequestSchema.safeParse(request);
  if (!parsedRequest.success) {
    throw new Error(`Invalid Parallel Search request: ${parsedRequest.error.message}`);
  }

  const response = await searchClient(parsedRequest.data);
  return mapParallelResultsToSources(
    researchQuestion.id,
    response,
    options.idFactory,
    options.now
  );
}
