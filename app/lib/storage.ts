/**
 * Storage utilities for loading TF-IDF index from /public
 */

import fs from 'fs';
import path from 'path';

export interface IndexMetadata {
  chunks: number;
  createdAt: string;
  documentHash: string;
}

export interface IndexData {
  documents: string[];
  vocabulary: { [key: string]: number };
  idfValues: { [key: string]: number };
  metadata: IndexMetadata;
}

let cachedIndex: IndexData | null = null;

/**
 * Load index from /public/yoga_index/
 * Returns cached version if available
 */
export async function loadIndex(): Promise<IndexData> {
  if (cachedIndex) {
    return cachedIndex;
  }

  try {
    // In production (Vercel), use /public path
    const indexDir = path.join(process.cwd(), 'public', 'yoga_index');

    // Check if index files exist
    const metadataPath = path.join(indexDir, 'index.json');
    const docsPath = path.join(indexDir, 'docs.json');
    const vocabPath = path.join(indexDir, 'vocabulary.json');
    const idfPath = path.join(indexDir, 'idf.json');

    if (
      !fs.existsSync(metadataPath) ||
      !fs.existsSync(docsPath) ||
      !fs.existsSync(vocabPath) ||
      !fs.existsSync(idfPath)
    ) {
      throw new Error(
        'Index files not found. Run: python -m ingestion.embedder'
      );
    }

    // Load all files
    const metadata: IndexMetadata = JSON.parse(
      fs.readFileSync(metadataPath, 'utf-8')
    );
    const documents: string[] = JSON.parse(
      fs.readFileSync(docsPath, 'utf-8')
    );
    const vocabulary: { [key: string]: number } = JSON.parse(
      fs.readFileSync(vocabPath, 'utf-8')
    );
    const idfValues: { [key: string]: number } = JSON.parse(
      fs.readFileSync(idfPath, 'utf-8')
    );

    cachedIndex = {
      documents,
      vocabulary,
      idfValues,
      metadata,
    };

    console.log(
      `✅ Loaded index: ${metadata.chunks} chunks, ${Object.keys(vocabulary).length} vocabulary terms`
    );

    return cachedIndex;
  } catch (error) {
    console.error('❌ Error loading index:', error);
    throw error;
  }
}

/**
 * Clear cache (for testing or manual rebuild)
 */
export function clearCache() {
  cachedIndex = null;
  console.log('Index cache cleared');
}

/**
 * Save index to /public/yoga_index/ (for ingestion)
 */
export function saveIndex(indexData: IndexData): void {
  const indexDir = path.join(process.cwd(), 'public', 'yoga_index');

  // Create directory if it doesn't exist
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  // Save files
  fs.writeFileSync(
    path.join(indexDir, 'index.json'),
    JSON.stringify(indexData.metadata, null, 2)
  );
  fs.writeFileSync(
    path.join(indexDir, 'docs.json'),
    JSON.stringify(indexData.documents, null, 2)
  );
  fs.writeFileSync(
    path.join(indexDir, 'vocabulary.json'),
    JSON.stringify(indexData.vocabulary, null, 2)
  );
  fs.writeFileSync(
    path.join(indexDir, 'idf.json'),
    JSON.stringify(indexData.idfValues, null, 2)
  );

  console.log(`✅ Saved index to ${indexDir}`);
}
