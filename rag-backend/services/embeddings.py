import os
from typing import List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        _configured = True


def create_embeddings(texts: List[str]) -> List[List[float]]:
    _ensure_configured()
    result = genai.embed_content(
        model='models/text-embedding-004',
        content=texts,
        task_type='retrieval_document',
    )
    return result['embedding']


def embed_query(query: str) -> List[float]:
    _ensure_configured()
    result = genai.embed_content(
        model='models/text-embedding-004',
        content=query,
        task_type='retrieval_query',
    )
    return result['embedding']
