import os
import json
import urllib.request
from typing import List
from dotenv import load_dotenv

load_dotenv()

_EMBED_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004'


def _api_key():
    return os.getenv('GEMINI_API_KEY')


def create_embeddings(texts: List[str]) -> List[List[float]]:
    url = f'{_EMBED_BASE}:batchEmbedContents?key={_api_key()}'
    embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        body = json.dumps({
            'requests': [
                {'model': 'models/text-embedding-004', 'content': {'parts': [{'text': t}]}}
                for t in batch
            ]
        }).encode()
        req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        embeddings.extend(e['values'] for e in data['embeddings'])
    return embeddings


def embed_query(query: str) -> List[float]:
    url = f'{_EMBED_BASE}:embedContent?key={_api_key()}'
    body = json.dumps({'content': {'parts': [{'text': query}]}}).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data['embedding']['values']
