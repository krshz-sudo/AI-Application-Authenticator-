import { MOCK_CORPUS, findCorpusRule } from './corpus';
import { RetrievedPassage, ScenarioId } from '../types';

export const VECTOR_DB_LABEL = 'Vector DB (ChromaDB, demo)';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface VectorSearchResult {
  dbLabel: string;
  collectionName: string;
  totalIndexedChunks: number;
  queryText: string;
  embeddingPreview: string;
  latencyMs: number;
  topK: RetrievedPassage[];
}

/**
 * Simulated ChromaDB vector search.
 * Always waits 650-950ms and returns the pre-assigned top-3 passages with
 * similarity scores like 0.91 / 0.84 / 0.79.
 */
export async function searchVectorStore(
  scenarioId: ScenarioId,
  customQuery?: string
): Promise<VectorSearchResult> {
  const waitMs = 680 + Math.floor(Math.random() * 240);
  await delay(waitMs);

  let ruleIds: [string, string, string] = ['APP-4.2', 'CERT-5.3', 'ADDR-3.1'];
  let scores: [number, number, number] = [0.91, 0.84, 0.79];
  let defaultQuery =
    'applicant_name format uppercase space AND certificate valid_until expiry check AND address 6-digit PIN code';

  switch (scenarioId) {
    case 'A':
      ruleIds = ['APP-4.2', 'CERT-5.3', 'ADDR-3.1'];
      scores = [0.91, 0.84, 0.79];
      defaultQuery =
        'verify compliant applicant_name "ANANYA SHARMA", valid_until "30/11/2028", address PIN "560001" against Form A-1 rules';
      break;
    case 'B':
      ruleIds = ['CERT-1.4', 'DOB-2.1', 'APP-2.4'];
      scores = [0.92, 0.86, 0.78];
      defaultQuery =
        'template schema mandatory certificate_number format 2 letters 8 digits AND date_of_birth DD/MM/YYYY format';
      break;
    case 'C':
      ruleIds = ['AUTH-2.2', 'AUTH-4.4', 'APP-4.2'];
      scores = [0.91, 0.84, 0.79];
      defaultQuery =
        'visual integrity applicant photograph region GAN anomaly risk indicator AND standard field compliance';
      break;
    case 'D':
      ruleIds = ['APP-4.2', 'CERT-5.3', 'ADDR-3.1'];
      scores = [0.91, 0.84, 0.79];
      defaultQuery =
        'validate single-token name "RAHULKUMAR" spacing rule AND expired certificate valid_until "15/03/2024"';
      break;
    case 'E':
      ruleIds = ['ADDR-4.2', 'AUD-2.5', 'ADDR-3.1'];
      scores = [0.61, 0.58, 0.52];
      defaultQuery =
        'cross-border deputation diplomatic enclave transit address exemption without standard domestic 6-digit PIN';
      break;
  }

  const topK: RetrievedPassage[] = ruleIds.map((id, idx) => {
    const found = findCorpusRule(id) || MOCK_CORPUS[idx];
    return {
      ...found,
      similarityScore: scores[idx],
    };
  });

  return {
    dbLabel: VECTOR_DB_LABEL,
    collectionName: 'sih2026_regulatory_guidelines_v4',
    totalIndexedChunks: MOCK_CORPUS.length,
    queryText: customQuery || defaultQuery,
    embeddingPreview: '[-0.0241, 0.0819, -0.0412, 0.1104, 0.0093, ... 1536 dims]',
    latencyMs: waitMs,
    topK,
  };
}
