"""Text chunking for semantic splitting."""
from typing import List
from langchain_core.documents import Document


def chunk_documents(documents: List[Document], chunk_size: int = 500, overlap: int = 50) -> List[Document]:
    """
    Split documents into semantic chunks (simple custom implementation).

    Args:
        documents: List of Document objects.
        chunk_size: Size of each chunk in characters.
        overlap: Overlap between chunks to preserve context.

    Returns:
        List of chunked Document objects with metadata.
    """
    chunked_docs = []

    for doc in documents:
        text = doc.page_content

        # Split by double newlines first (section breaks)
        sections = text.split("\n\n")

        current_chunk = ""
        chunk_index = 0

        for section in sections:
            # If adding this section exceeds chunk_size, save current chunk and start new one
            if len(current_chunk) + len(section) + 2 > chunk_size and current_chunk:
                # Create document for current chunk
                chunk_doc = Document(
                    page_content=current_chunk.strip(),
                    metadata={**doc.metadata, "chunk_index": chunk_index}
                )
                chunked_docs.append(chunk_doc)

                # Start new chunk with overlap
                chunk_index += 1
                current_chunk = current_chunk[-overlap:] + "\n\n"

            current_chunk += section + "\n\n"

        # Don't forget the last chunk
        if current_chunk.strip():
            chunk_doc = Document(
                page_content=current_chunk.strip(),
                metadata={**doc.metadata, "chunk_index": chunk_index}
            )
            chunked_docs.append(chunk_doc)

    return chunked_docs


if __name__ == "__main__":
    from loader import load_yoga_document

    docs = load_yoga_document()
    chunked = chunk_documents(docs)
    print(f"Original documents: {len(docs)}")
    print(f"Chunked documents: {len(chunked)}")
    print(f"\nFirst chunk:")
    print(f"Content: {chunked[0].page_content[:300]}...")
    print(f"Metadata: {chunked[0].metadata}")
