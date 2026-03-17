"""Retrieve relevant yoga documents from index."""
import sys
from pathlib import Path
from typing import List

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "ingestion"))

from simple_embedder import SimpleEmbedder


class YogaRetriever:
    """Retrieve relevant yoga documents using TF-IDF search."""

    def __init__(self, persist_dir: str = None):
        """
        Initialize retriever.

        Args:
            persist_dir: Directory where index is persisted.
        """
        if persist_dir is None:
            persist_dir = str(Path(__file__).parent.parent.parent / "chroma_db")

        self.persist_dir = persist_dir
        self.embedder = SimpleEmbedder(persist_dir)
        self.loaded = False

    def ensure_loaded(self):
        """Load index if not already loaded."""
        if not self.loaded:
            self.loaded = self.embedder.load_index("yoga_index")
            if not self.loaded:
                raise RuntimeError(
                    f"Index not found in {self.persist_dir}. "
                    "Run ingestion first: python -m ingestion.embedder"
                )

    def retrieve(self, query: str, k: int = 5) -> List[dict]:
        """
        Retrieve relevant documents for a query.

        Args:
            query: The search query.
            k: Number of top documents to retrieve.

        Returns:
            List of dicts with 'content', 'source', and 'score'.
        """
        self.ensure_loaded()
        results = self.embedder.similarity_search(query, k=k)

        # Reformat results and convert numpy types to Python native types
        formatted = []
        for result in results:
            formatted.append({
                "content": str(result["content"]),
                "source": "yoga_research_document.md",
                "chunk_index": int(result["chunk_index"]),  # Convert numpy int to Python int
                "score": float(result["score"]),  # Convert numpy float to Python float
            })

        return formatted


if __name__ == "__main__":
    retriever = YogaRetriever()
    results = retriever.retrieve("What are the benefits of meditation in yoga?", k=3)

    print(f"Retrieved {len(results)} documents:\n")
    for i, result in enumerate(results):
        print(f"Result {i + 1} (Score: {result['score']:.3f}):")
        print(f"Content: {result['content'][:250]}...")
        print(f"Source: {result['source']}\n")
