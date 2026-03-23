import os
from typing import List
from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    return _client


def create_embeddings(texts: List[str]) -> List[List[float]]:
    client = get_client()
    result = client.models.embed_content(
        model='models/text-embedding-004',
        contents=texts,
    )
    return [e.values for e in result.embeddings]


def embed_query(query: str) -> List[float]:
    client = get_client()
    result = client.models.embed_content(
        model='models/text-embedding-004',
        contents=query,
    )
    return result.embeddings[0].values
