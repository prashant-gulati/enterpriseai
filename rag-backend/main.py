import io
import os
import uuid
import secrets
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

load_dotenv()

from services.chunking import chunk_document
from services.embeddings import create_embeddings, embed_query
from services.gemini_service import generate_response as gemini_generate, raw_generate
from services.openai_service import generate_response as openai_generate
from services.supabase_store import similarity_search, store_vectors, delete_doc_chunks
from services.drive_service import (
    download_file,
    exchange_code,
    get_auth_url,
    list_files,
    list_tree,
)

app = FastAPI(title='RAG Chat API')

_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# In-memory stores (use Redis/DB in production)
doc_sessions: Dict[str, Dict] = {}
drive_sessions: Dict[str, Dict] = {}


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text(content: bytes, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'txt'
    if ext == 'pdf':
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype='pdf')
        return '\n'.join(page.get_text() for page in doc)
    elif ext in ('docx', 'doc'):
        import docx
        doc = docx.Document(io.BytesIO(content))
        return '\n'.join(p.text for p in doc.paragraphs)
    else:
        return content.decode('utf-8', errors='replace')


# ---------------------------------------------------------------------------
# Default / sample documents
# ---------------------------------------------------------------------------

PDFS_DIR = os.path.join(os.path.dirname(__file__), '..', 'pdfs')


@app.get('/debug-models')
async def debug_models():
    import urllib.request, urllib.error, json
    key = os.getenv('GEMINI_API_KEY', '')
    if not key:
        return {'error': 'GEMINI_API_KEY not set'}
    url = f'https://generativelanguage.googleapis.com/v1beta/models?key={key}'
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())
        names = [m['name'] for m in data.get('models', [])]
        return {'key_prefix': key[:8] + '...', 'model_count': len(names), 'models': names}
    except urllib.error.HTTPError as e:
        return {'error': f'{e.code}: {e.read().decode()}'}


@app.get('/defaults')
async def list_defaults():
    files = []
    try:
        for dirpath, _, filenames in os.walk(PDFS_DIR):
            for f in filenames:
                if f.lower().endswith('.pdf'):
                    rel = os.path.relpath(os.path.join(dirpath, f), PDFS_DIR)
                    files.append(rel)
        files.sort()
    except FileNotFoundError:
        pass
    return {'files': files}


class LoadDefaultRequest(BaseModel):
    filename: str


@app.post('/defaults/load')
async def load_default(req: LoadDefaultRequest):
    path = os.path.realpath(os.path.join(PDFS_DIR, req.filename))
    # Prevent path traversal
    if not path.startswith(os.path.realpath(PDFS_DIR)):
        raise HTTPException(400, 'Invalid filename')
    if not os.path.isfile(path):
        raise HTTPException(404, f'File not found: {req.filename}')

    with open(path, 'rb') as f:
        content = f.read()

    try:
        text = extract_text(content, req.filename)
    except Exception as e:
        raise HTTPException(500, f'Could not extract text: {e}')

    doc_id = uuid.uuid5(uuid.NAMESPACE_URL, req.filename).hex
    doc_sessions[doc_id] = {'filename': req.filename, 'text': text}
    print(f'[default] {req.filename} → {len(text):,} chars (doc_id={doc_id})')

    return {'doc_id': doc_id, 'filename': req.filename, 'char_count': len(text)}


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, 'File too large (max 20 MB)')

    try:
        text = extract_text(content, file.filename)
    except Exception as e:
        raise HTTPException(400, f'Could not extract text: {e}')

    doc_id = uuid.uuid5(uuid.NAMESPACE_URL, file.filename).hex
    doc_sessions[doc_id] = {'filename': file.filename, 'text': text}
    print(f'[upload] {file.filename} → {len(text):,} chars extracted (doc_id={doc_id})')

    return {
        'doc_id': doc_id,
        'filename': file.filename,
        'char_count': len(text),
        'preview': text[:500],
    }


# ---------------------------------------------------------------------------
# Chunk
# ---------------------------------------------------------------------------

class ChunkRequest(BaseModel):
    doc_id: str
    strategy: str
    params: Dict[str, Any] = {}


@app.post('/chunk')
async def chunk_file(req: ChunkRequest):
    session = doc_sessions.get(req.doc_id)
    if not session:
        raise HTTPException(404, 'Document not found — please upload first')

    text = session['text']

    embed_fn = None
    gemini_fn = None

    if req.strategy == 'semantic':
        from services.embeddings import create_embeddings as _emb
        embed_fn = _emb
    elif req.strategy == 'llm':
        gemini_fn = raw_generate

    try:
        chunks = chunk_document(text, req.strategy, req.params, embed_fn, gemini_fn)
    except Exception as e:
        raise HTTPException(500, f'Chunking failed: {e}')

    if not chunks:
        raise HTTPException(500, 'Chunking produced no chunks')

    session['chunks'] = chunks

    return {
        'chunk_count': len(chunks),
        'preview': chunks[:3],
        'avg_chunk_size': sum(len(c) for c in chunks) // len(chunks),
    }


# ---------------------------------------------------------------------------
# Embed + Store
# ---------------------------------------------------------------------------

class EmbedRequest(BaseModel):
    doc_id: str


@app.post('/embed')
async def embed_and_store(req: EmbedRequest):
    session = doc_sessions.get(req.doc_id)
    if not session:
        raise HTTPException(404, 'Document not found')
    if 'chunks' not in session:
        raise HTTPException(400, 'Chunk the document first')

    chunks = session['chunks']
    filename = session['filename']

    try:
        print(f'[embed] deleting old chunks for doc_id={req.doc_id} filename={filename!r}')
        delete_doc_chunks(req.doc_id, filename)
        embeddings = create_embeddings(chunks)
        count = store_vectors(chunks, embeddings, req.doc_id, filename)
        print(f'[embed] stored {count} chunks for {filename!r}')
    except Exception as e:
        raise HTTPException(500, f'Embedding/storage failed: {e}')

    session['embedded'] = True
    return {'stored_chunks': count, 'doc_id': req.doc_id}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str
    doc_ids: Optional[List[str]] = None
    history: List[Dict[str, Any]] = []
    model: str = 'gemini-2.5-flash-lite'


@app.post('/chat')
async def chat(req: ChatRequest):
    try:
        query_embedding = embed_query(req.query)
        context_chunks = similarity_search(query_embedding, k=5, doc_ids=req.doc_ids)
    except Exception as e:
        raise HTTPException(500, f'Retrieval failed: {e}')

    try:
        if req.model.startswith('gpt'):
            response = await openai_generate(req.query, context_chunks, req.history)
        else:
            response = await gemini_generate(req.query, context_chunks, req.history, req.model)
    except Exception as e:
        raise HTTPException(500, f'Generation failed: {e}')

    return {'response': response, 'sources': context_chunks[:3]}


# ---------------------------------------------------------------------------
# Google Drive OAuth
# ---------------------------------------------------------------------------

@app.get('/drive/auth')
async def drive_auth(state: Optional[str] = None):
    if not state:
        state = secrets.token_urlsafe(16)
    auth_url = get_auth_url(state)
    return {'auth_url': auth_url, 'state': state}


@app.get('/drive/callback')
async def drive_callback(code: str, state: str):
    try:
        credentials = exchange_code(code, state)
        drive_sessions[state] = credentials
    except Exception as e:
        return HTMLResponse(f'<html><body><p>Error: {e}</p></body></html>', status_code=400)

    return HTMLResponse("""
    <html>
    <head><title>Google Drive Connected</title></head>
    <body style="font-family:sans-serif;background:#0d0d14;color:#e2e2f0;
                 display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">✓</div>
        <h2 style="margin:0 0 8px;">Google Drive Connected</h2>
        <p style="color:#8888aa;margin:0;">You can close this tab.</p>
        <script>setTimeout(() => window.close(), 1500);</script>
      </div>
    </body>
    </html>
    """)


@app.get('/drive/status')
async def drive_status(state: str):
    if state in drive_sessions:
        credentials = drive_sessions.pop(state)
        return {'connected': True, 'credentials': credentials}
    return {'connected': False}


class DriveFilesRequest(BaseModel):
    credentials: Dict[str, Any]


@app.post('/drive/files')
async def drive_files(req: DriveFilesRequest):
    try:
        files = list_files(req.credentials)
    except Exception as e:
        raise HTTPException(500, f'Failed to list Drive files: {e}')
    return {'files': files}


@app.post('/drive/tree')
async def drive_tree(req: DriveFilesRequest):
    try:
        tree = list_tree(req.credentials)
    except Exception as e:
        raise HTTPException(500, f'Failed to fetch Drive tree: {e}')
    return tree


class DriveDownloadRequest(BaseModel):
    credentials: Dict[str, Any]
    file_id: str
    filename: str
    mime_type: str


@app.post('/drive/download')
async def drive_download(req: DriveDownloadRequest):
    try:
        content = download_file(req.credentials, req.file_id, req.mime_type)
    except Exception as e:
        raise HTTPException(500, f'Failed to download file: {e}')

    text = extract_text(content, req.filename)
    doc_id = uuid.uuid5(uuid.NAMESPACE_URL, req.filename).hex
    doc_sessions[doc_id] = {'filename': req.filename, 'text': text}

    return {
        'doc_id': doc_id,
        'filename': req.filename,
        'char_count': len(text),
        'preview': text[:500],
    }


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8001, reload=True)
