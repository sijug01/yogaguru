/**
 * TF-IDF vectorization logic (TypeScript port of scikit-learn TfidfVectorizer)
 */

import { IndexData } from './storage';

/**
 * Tokenize text into lowercase words, removing punctuation
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Calculate TF (Term Frequency) for a document
 */
export function calculateTF(tokens: string[]): { [key: string]: number } {
  const tf: { [key: string]: number } = {};
  const total = tokens.length;

  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1 / total;
  }

  return tf;
}

/**
 * Fit vectorizer on documents and create TF-IDF index
 */
export function fitVectorizer(documents: string[]): IndexData {
  const vocabulary: { [key: string]: number } = {};
  const documentTokens: string[][] = [];
  const documentFrequencies: { [key: string]: number } = {};

  // Step 1: Tokenize all documents and build vocabulary
  for (const doc of documents) {
    const tokens = tokenize(doc);
    documentTokens.push(tokens);

    // Track document frequency for each term
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      documentFrequencies[term] = (documentFrequencies[term] || 0) + 1;
    }
  }

  // Step 2: Build vocabulary (assign index to each term)
  let vocabIndex = 0;
  for (const term of Object.keys(documentFrequencies).sort()) {
    vocabulary[term] = vocabIndex++;
  }

  // Step 3: Calculate IDF (Inverse Document Frequency)
  const idfValues: { [key: string]: number } = {};
  const numDocs = documents.length;

  for (const term of Object.keys(vocabulary)) {
    const docFreq = documentFrequencies[term] || 1;
    // IDF = log(N / df) where N = total docs, df = document frequency
    idfValues[term] = Math.log(numDocs / docFreq);
  }

  return {
    documents,
    vocabulary,
    idfValues,
    metadata: {
      chunks: documents.length,
      createdAt: new Date().toISOString(),
      documentHash: 'computed',
    },
  };
}

/**
 * Transform text to TF-IDF vector
 */
export function transformText(text: string, indexData: IndexData): number[] {
  const { vocabulary, idfValues } = indexData;
  const tokens = tokenize(text);
  const tf = calculateTF(tokens);

  // Create vector of size = vocabulary size
  const vector = new Array(Object.keys(vocabulary).length).fill(0);

  // Fill vector with TF-IDF values
  for (const term of Object.keys(tf)) {
    if (vocabulary[term] !== undefined) {
      const vocabIndex = vocabulary[term];
      const idf = idfValues[term] || 0;
      vector[vocabIndex] = tf[term] * idf;
    }
  }

  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Create TF-IDF vectors for all documents
 */
export function createDocumentVectors(indexData: IndexData): number[][] {
  return indexData.documents.map((doc) => transformText(doc, indexData));
}
