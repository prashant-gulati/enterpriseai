import os
from typing import List, Dict
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    return _client


async def generate_response(query: str, context_chunks: List[Dict],
                             history: List[Dict], model_name: str = 'gemini-2.5-flash') -> str:
    client = get_client()

    context_text = '\n\n'.join(
        f'[Source {i + 1} — {c.get("filename", "doc")}, chunk {c.get("chunk_index", i) + 1}]:\n{c["content"]}'
        for i, c in enumerate(context_chunks)
    ) if context_chunks else 'No relevant context found in the knowledge base.'

    system_instruction = (
        'You are a helpful AI assistant. Answer the user\'s question using the provided '
        'context from the knowledge base. Cite source numbers when referencing specific information. '
        'If the answer cannot be found in the context, say so clearly and answer from general knowledge if appropriate.\n\n'
        f'Context from knowledge base:\n{context_text}'
    )

    contents = []
    for msg in history:
        role = 'user' if msg['role'] == 'user' else 'model'
        contents.append(types.Content(role=role, parts=[types.Part(text=msg['content'])]))
    contents.append(types.Content(role='user', parts=[types.Part(text=query)]))

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_instruction),
    )
    return response.text


async def raw_generate(prompt: str) -> str:
    client = get_client()
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    return response.text
