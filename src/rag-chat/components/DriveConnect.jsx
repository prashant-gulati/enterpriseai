import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_INTERVAL = 2000
const MAX_FILES = 3

function DriveIcon() {
  return (
    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a15.92 15.92 0 001.55 7.10z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2a9.1 9.1 0 00-3.3 3.3L.55 50.4A15.92 15.92 0 000 57.5h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25A15.92 15.92 0 0087.3 50.4H59.8l5.85 11.05z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.45 54.5 0 52.85 0H34.45c-1.65 0-3.2.45-4.55 1.2z" fill="#00832d"/>
      <path d="M59.8 57.5H27.5L13.75 81.1c1.35.75 2.9 1.2 4.55 1.2h50.7c1.65 0 3.2-.45 4.55-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.35l-13.2-22.85c-1.35-.8-2.9-1.2-4.55-1.3H50.4l-6.75 25-5.85 10.5h27.5z" fill="#ffba00"/>
    </svg>
  )
}

function fileIcon(mimeType) {
  if (mimeType?.includes('pdf')) return '📄'
  if (mimeType?.includes('word') || mimeType === 'application/vnd.google-apps.document') return '📝'
  return '📃'
}

function buildTree(rootId, folders, files) {
  const map = new Map()
  folders.forEach(f => map.set(f.id, { ...f, isFolder: true, children: [], files: [] }))
  if (!map.has(rootId)) {
    map.set(rootId, { id: rootId, name: 'My Drive', isFolder: true, children: [], files: [] })
  }
  folders.forEach(f => {
    const parentId = f.parents?.[0]
    if (parentId && map.has(parentId) && f.id !== rootId) {
      map.get(parentId).children.push(map.get(f.id))
    } else if (parentId && !map.has(parentId)) {
      map.get(rootId).children.push(map.get(f.id))
    }
  })
  files.forEach(f => {
    const parentId = f.parents?.[0]
    if (parentId && map.has(parentId)) {
      map.get(parentId).files.push(f)
    }
  })
  return map.get(rootId)
}

function FolderNode({ node, depth, selectedIds, loadingIds, onToggle, canSelect }) {
  const [open, setOpen] = useState(depth === 0)
  const indent = depth * 14
  const hasContent = node.children.length > 0 || node.files.length > 0

  return (
    <div>
      {depth > 0 && (
        <div className="drive-folder-row" style={{ paddingLeft: 10 + indent }}
          onClick={() => setOpen(o => !o)}>
          <span className="drive-folder-arrow">{open ? '▾' : '▸'}</span>
          <span className="drive-folder-icon">📁</span>
          <span className="drive-item-name">{node.name}</span>
        </div>
      )}

      {(open || depth === 0) && hasContent && (
        <div>
          {node.children.slice().sort((a, b) => a.name.localeCompare(b.name)).map(child => (
            <FolderNode key={child.id} node={child} depth={depth + 1}
              selectedIds={selectedIds} loadingIds={loadingIds}
              onToggle={onToggle} canSelect={canSelect} />
          ))}
          {node.files.slice().sort((a, b) => a.name.localeCompare(b.name)).map(file => {
            const isSelected = selectedIds.has(file.id)
            const isLoading = loadingIds.has(file.id)
            const isDisabled = !isSelected && !canSelect
            return (
              <div key={file.id}
                className={`drive-file-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'dimmed' : ''}`}
                style={{ paddingLeft: 10 + indent + (depth > 0 ? 14 : 0) }}
                onClick={() => !isLoading && !isDisabled && onToggle(file)}>
                <div className={`drive-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <span>✓</span>}
                </div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{fileIcon(file.mimeType)}</span>
                <span className="drive-item-name">{file.name}</span>
                {isLoading && <div className="spinner" style={{ width: 11, height: 11, flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      )}

      {(open || depth === 0) && !hasContent && depth > 0 && (
        <div style={{ paddingLeft: 10 + indent + 14, fontSize: 11, color: 'var(--text-muted)', padding: `4px 0 4px ${10 + indent + 14}px` }}>
          Empty folder
        </div>
      )}
    </div>
  )
}

export default function DriveConnect({ apiBase, uploadedDocs, onDocAdded, onDocRemoved, disabled }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [tree, setTree] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loadingIds, setLoadingIds] = useState(new Set())
  const [fileMap, setFileMap] = useState(new Map())
  const pollRef = useRef(null)

  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null }
  useEffect(() => () => stopPolling(), [])

  useEffect(() => {
    const currentDocIds = new Set(uploadedDocs.map(d => d.docId))
    setSelectedIds(prev => {
      const next = new Set()
      prev.forEach(driveId => {
        const meta = fileMap.get(driveId)
        if (meta && currentDocIds.has(meta._docId)) next.add(driveId)
      })
      return next
    })
  }, [uploadedDocs, fileMap])

  const fetchTree = useCallback(async (creds) => {
    try {
      const res = await fetch(`${apiBase}/drive/tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: creds }),
      })
      if (!res.ok) throw new Error('Failed to fetch Drive tree')
      const data = await res.json()
      const root = buildTree(data.root_id, data.folders, data.files)
      root.name = data.root_name || 'My Drive'
      setTree(root)
    } catch (err) {
      setError(err.message)
    }
  }, [apiBase])

  const connectDrive = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    const stateId = Math.random().toString(36).slice(2)
    try {
      const res = await fetch(`${apiBase}/drive/auth?state=${stateId}`)
      if (!res.ok) throw new Error('Failed to get auth URL')
      const { auth_url } = await res.json()
      window.open(auth_url, 'drive-auth', 'width=520,height=620,scrollbars=yes')
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${apiBase}/drive/status?state=${stateId}`)
          const d = await r.json()
          if (d.connected) {
            stopPolling()
            setCredentials(d.credentials)
            setStatus('connected')
            fetchTree(d.credentials)
          }
        } catch (_) {}
      }, POLL_INTERVAL)
      setTimeout(() => { stopPolling(); setStatus(s => s === 'connecting' ? 'idle' : s) }, 5 * 60 * 1000)
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }, [apiBase, fetchTree])

  const toggleFile = useCallback(async (file) => {
    if (selectedIds.has(file.id)) {
      const meta = fileMap.get(file.id)
      if (meta?._docId) onDocRemoved(meta._docId)
      setSelectedIds(prev => { const n = new Set(prev); n.delete(file.id); return n })
      setFileMap(prev => { const n = new Map(prev); n.delete(file.id); return n })
      return
    }

    if (uploadedDocs.length >= MAX_FILES) return

    setLoadingIds(prev => new Set(prev).add(file.id))
    setError(null)
    try {
      const res = await fetch(`${apiBase}/drive/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, file_id: file.id, filename: file.name, mime_type: file.mimeType }),
      })
      if (!res.ok) throw new Error('Failed to download file')
      const data = await res.json()
      setSelectedIds(prev => new Set(prev).add(file.id))
      setFileMap(prev => new Map(prev).set(file.id, { ...file, _docId: data.doc_id }))
      onDocAdded(data.doc_id, file.name, data.char_count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(file.id); return n })
    }
  }, [apiBase, credentials, selectedIds, fileMap, uploadedDocs.length, onDocAdded, onDocRemoved])

  const disconnect = () => {
    setCredentials(null); setTree(null)
    setSelectedIds(new Set()); setFileMap(new Map())
    setStatus('idle')
  }

  const canSelect = uploadedDocs.length < MAX_FILES

  return (
    <div className="section-content">
      {status === 'idle' && (
        <button className="drive-connect-btn" onClick={connectDrive} disabled={disabled}>
          <DriveIcon /> Connect Google Drive
        </button>
      )}

      {status === 'connecting' && (
        <div className="status-msg loading"><div className="spinner" /> Waiting for Google authorization…</div>
      )}

      {status === 'connected' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="drive-status">
              <div className="drive-status-dot" /> Google Drive connected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedIds.size > 0 && (
                <span style={{ fontSize: 11, color: 'var(--accent-hover)' }}>
                  {selectedIds.size}/{MAX_FILES} selected
                </span>
              )}
              <button className="btn-sm" onClick={disconnect}>Disconnect</button>
            </div>
          </div>

          {!tree ? (
            <div className="status-msg loading"><div className="spinner" /> Loading files…</div>
          ) : (
            <div className="drive-tree">
              <FolderNode node={tree} depth={0} selectedIds={selectedIds}
                loadingIds={loadingIds} onToggle={toggleFile} canSelect={canSelect} />
            </div>
          )}
        </>
      )}

      {error && <div className="status-msg error" style={{ marginTop: 10 }}><span>⚠</span> {error}</div>}
    </div>
  )
}
