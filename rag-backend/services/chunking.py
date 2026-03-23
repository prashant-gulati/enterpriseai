import re
from typing import List


def fixed_chunk(text: str, chunk_size: int = 1500, overlap: int = 50) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


def structural_chunk(text: str) -> List[str]:
    # Split on double newlines, markdown headings, or HR lines
    parts = re.split(r'\n\s*\n|(?=^#{1,6}\s)', text, flags=re.MULTILINE)
    chunks = []
    current = ''
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Merge very short pieces with next
        if len(current) + len(part) < 150 and current:
            current += '\n\n' + part
        else:
            if current:
                chunks.append(current)
            current = part
    if current:
        chunks.append(current)
    return chunks


def recursive_chunk(text: str, chunk_size: int = 1500, overlap: int = 50) -> List[str]:
    separators = ['\n\n', '\n', '. ', ' ', '']

    def _split(text: str, seps: List[str]) -> List[str]:
        if not seps or len(text) <= chunk_size:
            return [text] if text.strip() else []

        sep = seps[0]
        splits = text.split(sep) if sep else list(text)

        results = []
        current_parts = []
        current_len = 0

        for s in splits:
            s_len = len(s)
            if current_len + s_len + len(sep) > chunk_size and current_parts:
                merged = sep.join(current_parts)
                if len(merged) > chunk_size:
                    results.extend(_split(merged, seps[1:]))
                else:
                    results.append(merged)
                # Keep overlap
                overlap_parts = []
                ol = 0
                for p in reversed(current_parts):
                    if ol + len(p) <= overlap:
                        overlap_parts.insert(0, p)
                        ol += len(p) + len(sep)
                    else:
                        break
                current_parts = overlap_parts + [s]
                current_len = sum(len(p) for p in current_parts) + len(sep) * (len(current_parts) - 1)
            else:
                current_parts.append(s)
                current_len += s_len + len(sep)

        if current_parts:
            merged = sep.join(current_parts)
            if len(merged) > chunk_size:
                results.extend(_split(merged, seps[1:]))
            else:
                results.append(merged)

        return results

    return [c for c in _split(text, separators) if c.strip()]


def semantic_chunk(text: str, embed_fn, threshold: float = 0.7) -> List[str]:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity

    try:
        import nltk
        nltk.download('punkt_tab', quiet=True)
        from nltk.tokenize import sent_tokenize
        sentences = sent_tokenize(text)
    except Exception:
        # Fallback: split on period + space
        sentences = re.split(r'(?<=[.!?])\s+', text)

    sentences = [s for s in sentences if s.strip()]
    if len(sentences) <= 1:
        return sentences

    embeddings = embed_fn(sentences)

    chunks = []
    current = [sentences[0]]

    for i in range(1, len(sentences)):
        sim = cosine_similarity([embeddings[i - 1]], [embeddings[i]])[0][0]
        if sim < threshold:
            chunks.append(' '.join(current))
            current = [sentences[i]]
        else:
            current.append(sentences[i])

    if current:
        chunks.append(' '.join(current))

    return chunks


async def llm_chunk(text: str, gemini_fn) -> List[str]:
    prompt = f"""You are a document chunking expert.
Split the following text into semantically coherent, self-contained sections.
Output ONLY a valid JSON array of strings, where each string is one complete chunk.
Each chunk should be 200-800 words. Preserve the original text exactly.

Document:
{text[:7000]}

Output only the JSON array, nothing else."""

    raw = await gemini_fn(prompt)
    # Parse JSON array from response
    import json
    try:
        # Find first [ ... ] block
        start = raw.find('[')
        end = raw.rfind(']') + 1
        if start >= 0 and end > start:
            chunks = json.loads(raw[start:end])
            return [c for c in chunks if isinstance(c, str) and c.strip()]
    except Exception:
        pass
    # Fallback: split on double newlines
    return [p.strip() for p in text.split('\n\n') if p.strip()]


def chunk_document(text: str, strategy: str, params: dict,
                   embed_fn=None, gemini_fn=None) -> List[str]:
    if strategy == 'fixed':
        return fixed_chunk(text,
                           chunk_size=params.get('chunk_size', 1500),
                           overlap=params.get('overlap', 50))
    elif strategy == 'structural':
        return structural_chunk(text)
    elif strategy == 'recursive':
        return recursive_chunk(text,
                               chunk_size=params.get('chunk_size', 1500),
                               overlap=params.get('overlap', 50))
    elif strategy == 'semantic':
        if not embed_fn:
            raise ValueError('embed_fn required for semantic chunking')
        return semantic_chunk(text, embed_fn, threshold=params.get('threshold', 0.7))
    elif strategy == 'llm':
        if not gemini_fn:
            raise ValueError('gemini_fn required for LLM chunking')
        import asyncio
        return asyncio.get_event_loop().run_until_complete(llm_chunk(text, gemini_fn))
    else:
        raise ValueError(f'Unknown strategy: {strategy}')
