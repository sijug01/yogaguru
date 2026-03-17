"""Generate embeddings and store in a simple searchable index."""
import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from loader import load_yoga_document
from chunker import chunk_documents
from simple_embedder import SimpleEmbedder


class EmbeddingPipeline:
    """Handle document ingestion, chunking, and embedding storage."""

    def __init__(self, persist_dir: str = None):
        """
        Initialize embedding pipeline.

        Args:
            persist_dir: Directory to persist index. Defaults to ./chroma_db
        """
        if persist_dir is None:
            persist_dir = str(Path(__file__).parent.parent.parent / "chroma_db")

        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.embedder = SimpleEmbedder(str(persist_dir))
        self.chunk_metadata = []

    def ingest(self, doc_path: str = None) -> Dict[str, Any]:
        """
        Load, chunk, embed, and store documents.

        Args:
            doc_path: Path to markdown document.

        Returns:
            Dict with ingestion statistics.
        """
        if doc_path is None:
            doc_path = str(Path(__file__).parent.parent.parent / "yoga_research_document.md")

        print(f"Loading document: {doc_path}")
        documents = load_yoga_document(doc_path)
        print(f"Loaded {len(documents)} documents")

        print("Chunking documents...")
        chunked_docs = chunk_documents(documents, chunk_size=500, overlap=50)
        print(f"Created {len(chunked_docs)} chunks")

        print("Generating embeddings...")
        chunk_texts = [doc.page_content for doc in chunked_docs]
        self.chunk_metadata = [doc.metadata for doc in chunked_docs]

        self.embedder.fit(chunk_texts)
        print(f"Fitted vectorizer on {len(chunk_texts)} chunks")

        print("Saving index...")
        self.embedder.save_index("yoga_index")

        # Save metadata separately
        metadata_path = self.persist_dir / "yoga_index_metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(self.chunk_metadata, f, indent=2)

        print(f"Stored {len(chunk_texts)} chunks and metadata in {self.persist_dir}")

        return {
            "chunks": len(chunk_texts),
            "persist_dir": str(self.persist_dir),
            "status": "success"
        }

    def load_index(self) -> bool:
        """Load the index from disk."""
        success = self.embedder.load_index("yoga_index")
        if success:
            metadata_path = self.persist_dir / "yoga_index_metadata.json"
            if metadata_path.exists():
                with open(metadata_path, "r") as f:
                    self.chunk_metadata = json.load(f)
        return success

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        results = self.embedder.similarity_search(query, k=k)

        # Add metadata to results
        for i, result in enumerate(results):
            if i < len(self.chunk_metadata):
                result["metadata"] = self.chunk_metadata[i]

        return results


if __name__ == "__main__":
    pipeline = EmbeddingPipeline()
    result = pipeline.ingest()
    print(f"\nEmbedding pipeline complete! Status: {result}")

    # Test retrieval
    if pipeline.load_index():
        results = pipeline.search("What is Tadasana?", k=3)
        print(f"\nTest query results: {len(results)} documents")
        for i, result in enumerate(results):
            print(f"\nResult {i + 1} (Score: {result['score']:.3f}):")
            print(f"Content: {result['content'][:200]}...")
