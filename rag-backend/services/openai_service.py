import os
from typing import List, Dict
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = 'gpt-4o'


async def generate_response(query: str, context_chunks: List[Dict],
                             history: List[Dict]) -> str:
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    context_text = '\n\n'.join(
        f'[Source {i + 1} — {c.get("filename", "doc")}, chunk {c.get("chunk_index", i) + 1}]:\n{c["content"]}'
        for i, c in enumerate(context_chunks)
    ) if context_chunks else 'No relevant context found in the knowledge base.'

    system_prompt = (
        'You are a helpful AI assistant. Answer the user\'s question using the provided '
        'context from the knowledge base. Cite source numbers when referencing specific information. '
        'If the answer cannot be found in the context, say so clearly and answer from general knowledge if appropriate.\n\n'
        f'Context from knowledge base:\n{context_text}'
    )

    messages = [{'role': 'system', 'content': system_prompt}]
    for msg in history:
        role = 'assistant' if msg['role'] == 'assistant' else 'user'
        messages.append({'role': role, 'content': msg['content']})
    messages.append({'role': 'user', 'content': query})

    response = await client.chat.completions.create(model=MODEL_NAME, messages=messages)
    return response.choices[0].message.content
