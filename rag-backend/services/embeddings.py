from typing import List
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
    return _model


def create_embeddings(texts: List[str]) -> List[List[float]]:
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    model = get_model()
    embedding = model.encode([query], normalize_embeddings=True, show_progress_bar=False)
    return embedding[0].tolist()
