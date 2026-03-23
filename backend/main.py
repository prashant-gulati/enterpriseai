import os
from dotenv import load_dotenv
load_dotenv()

os.environ.setdefault("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY", ""))

import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from graph_runner import run_flow, TOOL_LABELS
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class FlowPayload(BaseModel):
    nodes: list[dict]
    edges: list[dict]
    message: str | None = None
    trigger_id: str | None = None


@app.post("/run")
async def run(payload: FlowPayload):
    async def stream():
        try:
            async for chunk in run_flow(payload.nodes, payload.edges, payload.message, payload.trigger_id):
                yield {"data": json.dumps({"text": chunk})}
        except Exception as e:
            yield {"data": json.dumps({"error": str(e)})}
        yield {"data": json.dumps({"done": True})}

    return EventSourceResponse(stream())


def extract_text(content: bytes, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'txt'
    if ext == 'pdf':
        import fitz
        doc = fitz.open(stream=content, filetype='pdf')
        return '\n'.join(page.get_text() for page in doc)
    elif ext in ('docx', 'doc'):
        import docx
        doc = docx.Document(io.BytesIO(content))
        return '\n'.join(p.text for p in doc.paragraphs)
    else:
        return content.decode('utf-8', errors='replace')


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, 'File too large (max 20 MB)')
    try:
        text = extract_text(content, file.filename)
    except Exception as e:
        raise HTTPException(400, f'Could not extract text: {e}')
    return {'filename': file.filename, 'text': text, 'char_count': len(text)}


@app.get("/list-pdfs")
async def list_pdfs(folder: str):
    base = os.path.dirname(__file__)
    full_folder = os.path.normpath(os.path.join(base, '..', folder))
    pdfs_root = os.path.normpath(os.path.join(base, '..', 'pdfs'))
    if not full_folder.startswith(pdfs_root):
        raise HTTPException(403, 'Access denied')
    if not os.path.isdir(full_folder):
        return []
    files = [f for f in os.listdir(full_folder) if f.lower().endswith('.pdf')]
    return [{'name': f, 'path': f'{folder}/{f}'} for f in sorted(files)]


@app.get("/preload")
async def preload_file(path: str):
    base = os.path.dirname(__file__)
    full_path = os.path.normpath(os.path.join(base, '..', path))
    # Restrict to the pdfs folder to prevent path traversal
    pdfs_root = os.path.normpath(os.path.join(base, '..', 'pdfs'))
    if not full_path.startswith(pdfs_root):
        raise HTTPException(403, 'Access denied')
    if not os.path.isfile(full_path):
        raise HTTPException(404, 'File not found')
    with open(full_path, 'rb') as f:
        content = f.read()
    filename = os.path.basename(full_path)
    try:
        text = extract_text(content, filename)
    except Exception as e:
        raise HTTPException(400, f'Could not extract text: {e}')
    return {'filename': filename, 'text': text, 'char_count': len(text)}


@app.get("/tools")
def list_tools():
    return [{"key": k, "label": v} for k, v in TOOL_LABELS.items()]
