"""LangChain RAG chain for generating answers with Claude."""
import os
import sys
from typing import Iterator
from pathlib import Path
from langchain_core.prompts import PromptTemplate
from langchain_anthropic import ChatAnthropic

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from retriever import YogaRetriever


class YogaRAGChain:
    """RAG chain combining retrieval and language model."""

    def __init__(self, model: str = None, persist_dir: str = None):
        """
        Initialize RAG chain.

        Args:
            model: LLM model name (e.g., claude-opus-4-6, claude-haiku-4-5-20251001).
            persist_dir: Directory where ChromaDB is persisted.
        """
        if model is None:
            model = os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001")

        self.model = model
        self.retriever = YogaRetriever(persist_dir)

        # Initialize Claude LLM
        self.llm = ChatAnthropic(
            model=model,
            temperature=0.7,
        )

        # Define prompt template for RAG
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are a knowledgeable and compassionate yoga instructor assistant.
Answer the user's question about yoga using ONLY the provided context information.

Guidelines:
- Be helpful, clear, and encouraging
- Always mention safety considerations when relevant
- If the answer involves a pose, provide clear, step-by-step instructions
- If the query mentions health concerns, remind them to consult a healthcare provider
- If the question cannot be answered from the provided context, say so clearly
- Cite which yoga poses or concepts you're referring to

Context from yoga knowledge base:
{context}

Question: {question}

Answer:""",
        )

    def format_context(self, retrieved_docs: list) -> str:
        """Format retrieved documents as context."""
        context_parts = []
        for doc in retrieved_docs:
            context_parts.append(f"- {doc['content']}")
        return "\n".join(context_parts)

    def generate_answer(self, question: str, k: int = 5) -> dict:
        """
        Generate answer using RAG.

        Args:
            question: User's question.
            k: Number of documents to retrieve.

        Returns:
            Dict with 'answer', 'sources', and 'model'.
        """
        # Retrieve relevant documents
        retrieved_docs = self.retriever.retrieve(question, k=k)

        # Format context
        context = self.format_context(retrieved_docs)

        # Generate answer
        prompt = self.prompt_template.format(context=context, question=question)
        answer = self.llm.invoke(prompt).content

        return {
            "answer": answer,
            "sources": retrieved_docs,
            "model": self.model,
            "question": question,
        }

    def generate_answer_stream(self, question: str, k: int = 5) -> Iterator[str]:
        """
        Generate answer with streaming (if supported).

        Args:
            question: User's question.
            k: Number of documents to retrieve.

        Yields:
            Chunks of the answer text.
        """
        retrieved_docs = self.retriever.retrieve(question, k=k)
        context = self.format_context(retrieved_docs)
        prompt = self.prompt_template.format(context=context, question=question)

        # Stream the response
        for chunk in self.llm.stream(prompt):
            if hasattr(chunk, "content"):
                yield chunk.content


if __name__ == "__main__":
    chain = YogaRAGChain()

    # Test question
    test_question = "What are the benefits of practicing Tadasana?"
    print(f"Question: {test_question}\n")

    result = chain.generate_answer(test_question)

    print(f"Answer:\n{result['answer']}\n")
    print(f"Sources ({len(result['sources'])} documents):")
    for i, source in enumerate(result["sources"]):
        print(f"\n{i + 1}. Score: {source['score']:.3f}")
        print(f"   Content: {source['content'][:150]}...")
