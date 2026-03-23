import os
import json
import urllib.request
import urllib.error
from typing import List
from dotenv import load_dotenv

load_dotenv()

_EMBED_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001'


def _api_key():
    key = os.getenv('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('GEMINI_API_KEY env var is not set')
    return key


def _call(url: str, body: bytes) -> dict:
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/json',
        'x-goog-api-key': _api_key(),
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Gemini API {e.code}: {e.read().decode()}') from e


def create_embeddings(texts: List[str]) -> List[List[float]]:
    url = f'{_EMBED_BASE}:batchEmbedContents'
    embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        body = json.dumps({
            'requests': [
                {'model': 'models/embedding-001', 'content': {'parts': [{'text': t}]}}
                for t in batch
            ]
        }).encode()
        data = _call(url, body)
        embeddings.extend(e['values'] for e in data['embeddings'])
    return embeddings


def embed_query(query: str) -> List[float]:
    url = f'{_EMBED_BASE}:embedContent'
    body = json.dumps({'content': {'parts': [{'text': query}]}}).encode()
    data = _call(url, body)
    return data['embedding']['values']
