import { useState, useRef, useCallback, useEffect } from 'react'

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx,.doc'
const ACCEPTED_MIME = [
  'application/pdf', 'text/plain', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const MAX_FILES = 3

function fileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['docx', 'doc'].includes(ext)) return '📝'
  return '📃'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ apiBase, uploadedDocs, onDocAdded, onDocRemoved, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [defaults, setDefaults] = useState([])
  const [loadingDefault, setLoadingDefault] = useState(null)
  const inputRef = useRef()

  useEffect(() => {
    fetch(`${apiBase}/defaults`)
      .then(r => r.json())
      .then(d => setDefaults(d.files || []))
      .catch(() => {})
  }, [apiBase])

  const loadDefault = useCallback(async (filename) => {
    if (uploadedDocs.find(d => d.filename === filename)) return
    if (uploadedDocs.length >= MAX_FILES) return
    setLoadingDefault(filename)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/defaults/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      if (!res.ok) throw new Error('Failed to load sample')
      const data = await res.json()
      onDocAdded(data.doc_id, data.filename, data.char_count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingDefault(null)
    }
  }, [apiBase, uploadedDocs, onDocAdded])

  const uploadFile = useCallback(async (file) => {
    setError(null)
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(err.detail || 'Upload failed')
      }
      const data = await res.json()
      onDocAdded(data.doc_id, file.name, data.char_count)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [apiBase, onDocAdded])

  const handleFiles = useCallback((files) => {
    const remaining = MAX_FILES - uploadedDocs.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining)
    for (const file of toUpload) {
      const validMime = ACCEPTED_MIME.includes(file.type)
      const validExt = ACCEPTED_TYPES.split(',').some(ext => file.name.toLowerCase().endsWith(ext))
      if (!validMime && !validExt) {
        setError(`Unsupported file type: ${file.name}`)
        continue
      }
      uploadFile(file)
    }
  }, [uploadFile, uploadedDocs.length])

  const canAddMore = uploadedDocs.length < MAX_FILES && !disabled && !uploading

  return (
    <div className="section-content">
      {/* Sample documents grouped by folder */}
      {defaults.length > 0 && (() => {
        const groups = {}
        for (const f of defaults) {
          const sep = f.indexOf('/') !== -1 ? '/' : '\\'
          const parts = f.split(sep)
          const folder = parts.length > 1 ? parts[0] : ''
          if (!groups[folder]) groups[folder] = []
          groups[folder].push(f)
        }
        return (
          <div style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Sample Docs — click to load
            </div>
            {Object.entries(groups).map(([folder, files]) => (
              <div key={folder} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: '0.03em' }}>
                  {(folder || 'General').charAt(0).toUpperCase() + (folder || 'General').slice(1)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
                  {files.map(filename => {
                    const isLoaded = uploadedDocs.some(d => d.filename === filename)
                    const isLoading = loadingDefault === filename
                    const isDisabled = disabled || isLoaded || (uploadedDocs.length >= MAX_FILES && !isLoaded)
                    return (
                      <button
                        key={filename}
                        onClick={() => !isDisabled && loadDefault(filename)}
                        disabled={isDisabled}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 5px', background: 'var(--bg-elevated)',
                          border: `1px solid ${isLoaded ? 'var(--success)' : 'var(--border)'}`,
                          borderRadius: 20, cursor: isDisabled ? 'default' : 'pointer',
                          fontSize: 9, color: isLoaded ? 'var(--success)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap', transition: 'all 0.15s',
                          opacity: isDisabled && !isLoaded ? 0.45 : 1,
                        }}
                        onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.borderColor = 'var(--accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = isLoaded ? 'var(--success)' : 'var(--border)' }}
                      >
                        <span style={{ fontSize: 9, flexShrink: 0 }}>📄</span>
                        <span>{filename.split(/[\\/]/).pop().replace('.pdf', '').replace(/_/g, ' ')}</span>
                        {isLoading && <div className="spinner" style={{ width: 9, height: 9, flexShrink: 0 }} />}
                        {isLoaded && <span style={{ flexShrink: 0 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Uploaded file cards */}
      {uploadedDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {uploadedDocs.map(doc => (
            <div key={doc.docId} className="file-card">
              <div className="file-icon">{fileIcon(doc.filename)}</div>
              <div className="file-info">
                <div className="file-name">{doc.filename}</div>
                <div className="file-meta">{doc.charCount?.toLocaleString()} chars</div>
              </div>
              <button className="file-remove" onClick={() => onDocRemoved(doc.docId)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone — only shown if slots remain */}
      {canAddMore && (
        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          style={{ padding: uploadedDocs.length > 0 ? '16px' : '28px 20px' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} multiple
            onChange={(e) => handleFiles(e.target.files)} disabled={!canAddMore} />
          {uploading ? (
            <><div className="dropzone-icon">⏳</div><p>Uploading…</p></>
          ) : (
            <>
              <div className="dropzone-icon" style={{ fontSize: uploadedDocs.length > 0 ? 20 : 28 }}>📂</div>
              <p>{uploadedDocs.length > 0 ? `Add another file (${uploadedDocs.length}/${MAX_FILES})` : 'Drop a file here or click to browse'}</p>
              {uploadedDocs.length === 0 && <span>PDF, DOCX, TXT, MD · Max 20MB</span>}
            </>
          )}
        </div>
      )}

      {uploadedDocs.length >= MAX_FILES && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
          Maximum {MAX_FILES} files selected
        </div>
      )}

      {error && <div className="status-msg error" style={{ marginTop: 8 }}><span>⚠</span> {error}</div>}
    </div>
  )
}
