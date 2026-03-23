import os
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_configured = False
_model_cache: Dict[str, genai.GenerativeModel] = {}


def get_model(model_name: str = 'gemini-2.5-pro'):
    global _configured
    if not _configured:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise RuntimeError('GEMINI_API_KEY must be set in .env')
        genai.configure(api_key=api_key)
        _configured = True
    if model_name not in _model_cache:
        _model_cache[model_name] = genai.GenerativeModel(model_name)
    return _model_cache[model_name]


async def generate_response(query: str, context_chunks: List[Dict],
                             history: List[Dict], model_name: str = 'gemini-2.5-pro') -> str:
    model = get_model(model_name)

    context_text = '\n\n'.join(
        f'[Source {i + 1} — {c.get("filename", "doc")}, chunk {c.get("chunk_index", i) + 1}]:\n{c["content"]}'
        for i, c in enumerate(context_chunks)
    ) if context_chunks else 'No relevant context found in the knowledge base.'

    system_context = (
        'You are a helpful AI assistant. Answer the user\'s question using the provided '
        'context from the knowledge base. Cite source numbers when referencing specific information. '
        'If the answer cannot be found in the context, say so clearly and answer from general knowledge if appropriate.\n\n'
        f'Context from knowledge base:\n{context_text}'
    )

    chat_history = []
    for msg in history:
        role = 'user' if msg['role'] == 'user' else 'model'
        chat_history.append({'role': role, 'parts': [msg['content']]})

    chat = model.start_chat(history=chat_history)
    response = chat.send_message(
        f'{system_context}\n\n---\nUser question: {query}'
    )
    return response.text


async def raw_generate(prompt: str) -> str:
    """Single-turn generation — used for LLM-based chunking."""
    model = get_model('gemini-2.5-pro')
    response = model.generate_content(prompt)
    return response.text
