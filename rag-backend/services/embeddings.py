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
    embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        result = client.models.embed_content(
            model='text-embedding-004',
            contents=batch,
        )
        embeddings.extend(e.values for e in result.embeddings)
    return embeddings


def embed_query(query: str) -> List[float]:
    client = get_client()
    result = client.models.embed_content(
        model='text-embedding-004',
        contents=query,
    )
    return result.embeddings[0].values
