import os
import io
import secrets
from typing import List, Dict, Any

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Store flow objects between auth URL generation and callback
_pending_flows: dict = {}


def _client_config() -> dict:
    return {
        'web': {
            'client_id': os.getenv('GOOGLE_CLIENT_ID', ''),
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
            'redirect_uris': [os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/drive/callback')],
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
        }
    }


def _make_flow(state: str | None = None) -> Flow:
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/drive/callback')
    kwargs = {'state': state} if state else {}
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES,
                                   redirect_uri=redirect_uri, **kwargs)
    return flow


def get_auth_url(state: str) -> str:
    flow = _make_flow(state)
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    _pending_flows[state] = flow  # preserve verifier for token exchange
    return auth_url


def exchange_code(code: str, state: str) -> dict:
    flow = _pending_flows.pop(state, None) or _make_flow(state)
    flow.fetch_token(code=code)
    creds = flow.credentials
    return {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': list(creds.scopes) if creds.scopes else [],
    }


def _build_service(credentials_dict: dict):
    creds = Credentials(
        token=credentials_dict['token'],
        refresh_token=credentials_dict.get('refresh_token'),
        token_uri=credentials_dict.get('token_uri', 'https://oauth2.googleapis.com/token'),
        client_id=credentials_dict.get('client_id'),
        client_secret=credentials_dict.get('client_secret'),
        scopes=credentials_dict.get('scopes'),
    )
    return build('drive', 'v3', credentials=creds)


FILE_Q = (
    "mimeType='text/plain' or "
    "mimeType='application/pdf' or "
    "mimeType='text/markdown' or "
    "mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or "
    "mimeType='application/vnd.google-apps.document'"
)


def _paginate(service, q: str, fields: str) -> List[Dict[str, Any]]:
    items = []
    page_token = None
    while True:
        params = {'pageSize': 500, 'fields': f'nextPageToken, files({fields})', 'q': q}
        if page_token:
            params['pageToken'] = page_token
        result = service.files().list(**params).execute()
        items.extend(result.get('files', []))
        page_token = result.get('nextPageToken')
        if not page_token:
            break
    return items


def list_files(credentials_dict: dict) -> List[Dict[str, Any]]:
    service = _build_service(credentials_dict)
    return _paginate(service, f'({FILE_Q}) and trashed=false', 'id, name, mimeType, size')


def list_tree(credentials_dict: dict) -> Dict[str, Any]:
    service = _build_service(credentials_dict)

    root = service.files().get(fileId='root', fields='id, name').execute()
    root_id = root['id']

    folders = _paginate(
        service,
        "mimeType='application/vnd.google-apps.folder' and trashed=false",
        'id, name, parents',
    )
    files = _paginate(
        service,
        f'({FILE_Q}) and trashed=false',
        'id, name, mimeType, size, parents',
    )

    return {
        'root_id': root_id,
        'root_name': root.get('name', 'My Drive'),
        'folders': folders,
        'files': files,
    }


def download_file(credentials_dict: dict, file_id: str, mime_type: str) -> bytes:
    service = _build_service(credentials_dict)
    if mime_type == 'application/vnd.google-apps.document':
        request = service.files().export_media(fileId=file_id, mimeType='text/plain')
    else:
        request = service.files().get_media(fileId=file_id)

    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue()
