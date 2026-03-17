"""Load and parse the yoga research document."""
from pathlib import Path
from typing import List
from langchain_core.documents import Document


def load_yoga_document(doc_path: str = None) -> List[Document]:
    """
    Load yoga research document as a single document.

    Args:
        doc_path: Path to the markdown document. Defaults to yoga_research_document.md in parent directory.

    Returns:
        List with single Document object containing full content.
    """
    if doc_path is None:
        # Find yoga_research_document.md in parent directory
        current_dir = Path(__file__).parent
        doc_path = current_dir.parent.parent / "yoga_research_document.md"

    doc_path = Path(doc_path)

    if not doc_path.exists():
        raise FileNotFoundError(f"Document not found: {doc_path}")

    # Read the markdown file directly (avoid heavy dependencies)
    with open(doc_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Create a single document
    doc = Document(
        page_content=content,
        metadata={"source": str(doc_path), "filename": doc_path.name}
    )

    return [doc]


if __name__ == "__main__":
    docs = load_yoga_document()
    print(f"Loaded {len(docs)} documents")
    print(f"Total content length: {len(docs[0].page_content)} characters")
    print(f"First 300 chars:\n{docs[0].page_content[:300]}...")
    print(f"Metadata: {docs[0].metadata}")
