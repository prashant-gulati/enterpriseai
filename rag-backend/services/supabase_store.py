import os
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if not url or not key:
            raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env')
        _client = create_client(url, key)
    return _client


BATCH_INSERT = 5


def store_vectors(chunks: List[str], embeddings: List[List[float]],
                  doc_id: str, filename: str) -> int:
    client = get_client()
    rows = [
        {
            'doc_id': doc_id,
            'filename': filename,
            'chunk_index': i,
            'content': chunk,
            'embedding': embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]
    total = 0
    for i in range(0, len(rows), BATCH_INSERT):
        result = client.table('rag_chunks').insert(rows[i:i + BATCH_INSERT]).execute()
        total += len(result.data)
    return total


def similarity_search(query_embedding: List[float], k: int = 5,
                      doc_ids: List[str] | None = None) -> List[Dict[str, Any]]:
    client = get_client()
    params: Dict[str, Any] = {
        'query_embedding': query_embedding,
        'match_count': k,
    }
    if doc_ids:
        params['filter_doc_ids'] = doc_ids
    result = client.rpc('match_rag_chunks', params).execute()
    return result.data or []


def delete_doc_chunks(doc_id: str, filename: str | None = None) -> None:
    client = get_client()
    if filename:
        client.table('rag_chunks').delete().eq('filename', filename).execute()
    else:
        client.table('rag_chunks').delete().eq('doc_id', doc_id).execute()
