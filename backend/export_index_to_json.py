#!/usr/bin/env python3
"""
Export TF-IDF index from pickle format to JSON
This allows the Next.js backend to load the index
"""

import json
import pickle
from pathlib import Path

def export_index_to_json():
    """Convert pickle index files to JSON format"""

    # Path to pickled index files
    chroma_db = Path(__file__).parent.parent / "chroma_db"
    vectorizer_path = chroma_db / "yoga_index_vectorizer.pkl"
    docs_path = chroma_db / "yoga_index_docs.pkl"
    metadata_path = chroma_db / "yoga_index_metadata.json"

    print("📦 Exporting TF-IDF index to JSON format...")

    # Check if files exist
    if not vectorizer_path.exists() or not docs_path.exists():
        print(f"❌ Index files not found at {chroma_db}")
        print("Run ingestion first: python -m ingestion.embedder")
        return False

    try:
        # Load pickled files
        print(f"Loading vectorizer from {vectorizer_path}...")
        with open(vectorizer_path, "rb") as f:
            vectorizer = pickle.load(f)

        print(f"Loading documents from {docs_path}...")
        with open(docs_path, "rb") as f:
            documents = pickle.load(f)

        # Extract TF-IDF components
        # Convert numpy types to Python native types for JSON serialization
        vocabulary = {str(k): int(v) for k, v in vectorizer.vocabulary_.items()}
        idf_values = {
            str(term): float(idf)
            for term, idf in zip(vectorizer.get_feature_names_out(), vectorizer.idf_)
        }

        # Create output directory
        output_dir = Path(__file__).parent.parent / "public" / "yoga_index"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save as JSON
        print(f"Saving to {output_dir}...")

        # Save documents
        with open(output_dir / "docs.json", "w") as f:
            json.dump(documents, f, indent=2)
        print(f"  ✅ docs.json ({len(documents)} chunks)")

        # Save vocabulary
        with open(output_dir / "vocabulary.json", "w") as f:
            json.dump(vocabulary, f, indent=2)
        print(f"  ✅ vocabulary.json ({len(vocabulary)} terms)")

        # Save IDF values
        with open(output_dir / "idf.json", "w") as f:
            json.dump(idf_values, f, indent=2)
        print(f"  ✅ idf.json ({len(idf_values)} IDF values)")

        # Save metadata
        metadata = {
            "chunks": len(documents),
            "vocabulary_size": len(vocabulary),
            "idf_values_size": len(idf_values),
            "createdAt": None,  # Will be set by storage.ts
            "documentHash": "computed"
        }
        with open(output_dir / "index.json", "w") as f:
            json.dump(metadata, f, indent=2)
        print(f"  ✅ index.json (metadata)")

        print(f"\n✅ Export complete!")
        print(f"📁 Index files saved to: {output_dir}")
        print(f"\nNext steps:")
        print(f"  1. Update Next.js frontend: npm install")
        print(f"  2. Test locally: npm run dev")
        print(f"  3. Deploy to Vercel: git push")

        return True

    except Exception as e:
        print(f"❌ Error during export: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = export_index_to_json()
    exit(0 if success else 1)
