"""Simple embeddings using sklearn TfidfVectorizer (no ML dependencies needed)."""
import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any
import hashlib

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
except ImportError:
    raise ImportError("Please install scikit-learn: pip install scikit-learn")


class SimpleEmbedder:
    """Simple TF-IDF based embedder for semantic search."""

    def __init__(self, persist_dir: str = None):
        """Initialize embedder with optional persistence."""
        if persist_dir is None:
            persist_dir = str(Path(__file__).parent.parent.parent / "chroma_db")

        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words="english")
        self.vectors = None
        self.documents = []

    def fit(self, documents: List[str]) -> None:
        """Fit vectorizer on documents."""
        self.documents = documents
        self.vectors = self.vectorizer.fit_transform(documents)

    def encode(self, texts: List[str]) -> Any:
        """Encode texts using fitted vectorizer."""
        return self.vectorizer.transform(texts)

    def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Find k most similar documents to query."""
        if self.vectors is None:
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = query_vec.dot(self.vectors.T).toarray()[0]

        # Get top k indices
        top_k_indices = (-similarities).argsort()[:k]

        results = []
        for idx in top_k_indices:
            results.append({
                "content": self.documents[idx],
                "score": float(similarities[idx]),
                "chunk_index": idx
            })

        return results

    def save_index(self, name: str = "index") -> None:
        """Save vectorizer and documents to disk."""
        vectorizer_path = self.persist_dir / f"{name}_vectorizer.pkl"
        docs_path = self.persist_dir / f"{name}_docs.pkl"

        with open(vectorizer_path, "wb") as f:
            pickle.dump(self.vectorizer, f)
        with open(docs_path, "wb") as f:
            pickle.dump(self.documents, f)

    def load_index(self, name: str = "index") -> bool:
        """Load vectorizer and documents from disk."""
        vectorizer_path = self.persist_dir / f"{name}_vectorizer.pkl"
        docs_path = self.persist_dir / f"{name}_docs.pkl"

        if not vectorizer_path.exists() or not docs_path.exists():
            return False

        with open(vectorizer_path, "rb") as f:
            self.vectorizer = pickle.load(f)
        with open(docs_path, "rb") as f:
            self.documents = pickle.load(f)

        self.vectors = self.vectorizer.transform(self.documents)
        return True
