/**
 * Yoga document retriever using TF-IDF search
 */

import { loadIndex, IndexData } from './storage';
import {
  transformText,
  cosineSimilarity,
  createDocumentVectors,
} from './indexing';

export interface SearchResult {
  content: string;
  source: string;
  chunk_index: number;
  score: number;
}

let indexData: IndexData | null = null;
let documentVectors: number[][] | null = null;

/**
 * Initialize retriever by loading index
 */
async function ensureIndexLoaded(): Promise<void> {
  if (!indexData) {
    indexData = await loadIndex();
    documentVectors = createDocumentVectors(indexData);
    console.log(
      `✅ Retriever initialized with ${indexData.documents.length} documents`
    );
  }
}

/**
 * Search for similar documents
 */
export async function retrieveDocuments(
  query: string,
  k: number = 5
): Promise<SearchResult[]> {
  await ensureIndexLoaded();

  if (!indexData || !documentVectors) {
    throw new Error('Index not loaded');
  }

  // Transform query to TF-IDF vector
  const queryVector = transformText(query, indexData);

  // Calculate similarity with all documents
  const similarities = documentVectors.map((docVector, index) => ({
    index,
    score: cosineSimilarity(queryVector, docVector),
  }));

  // Sort by similarity score (descending) and get top k
  const topK = similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  // Return results with content
  const results: SearchResult[] = topK.map((result) => ({
    content: indexData!.documents[result.index],
    source: 'yoga_research_document.md',
    chunk_index: result.index,
    score: result.score,
  }));

  return results;
}

/**
 * Clear cache (for testing)
 */
export function clearCache(): void {
  indexData = null;
  documentVectors = null;
}
