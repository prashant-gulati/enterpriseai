import { useState, useCallback } from 'react'
import FileUpload from './FileUpload'
import DriveConnect from './DriveConnect'
import ChunkingConfig from './ChunkingConfig'

const DEFAULT_PARAMS = {
  fixed:      { chunk_size: 1500, overlap: 50 },
  structural: {},
  semantic:   { threshold: 0.7 },
  recursive:  { chunk_size: 1500, overlap: 50 },
  llm:        {},
}

const STEPS = { IDLE: 'idle', CHUNKING: 'chunking', EMBEDDING: 'embedding', DONE: 'done', ERROR: 'error' }

export default function Sidebar({ apiBase, docs, embedded, onDocAdded, onDocRemoved, onEmbeddingDone, onAllCleared }) {
  const [activeTab, setActiveTab] = useState('upload')
  const [strategy, setStrategy] = useState('structural')
  const [params, setParams] = useState(DEFAULT_PARAMS.fixed)
  const [step, setStep] = useState(embedded ? STEPS.DONE : STEPS.IDLE)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [chunkPreview, setChunkPreview] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)

  const handleStrategyChange = (s) => { setStrategy(s); setParams(DEFAULT_PARAMS[s] || {}) }

  // Reset embed state when docs change
  const handleDocAdded = useCallback((docId, filename, charCount) => {
    setStep(STEPS.IDLE); setChunkPreview([]); setErrorMsg(null)
    onDocAdded(docId, filename, charCount)
  }, [onDocAdded])

  const handleDocRemoved = useCallback((docId) => {
    if (docs.length <= 1) { setStep(STEPS.IDLE); setChunkPreview([]); setErrorMsg(null) }
    onDocRemoved(docId)
  }, [docs.length, onDocRemoved])

  const createEmbeddings = useCallback(async () => {
    if (!docs.length) return
    setStep(STEPS.CHUNKING)
    setErrorMsg(null)

    const totalDocs = docs.length
    let allChunkCount = 0
    let firstPreview = []

    for (let i = 0; i < totalDocs; i++) {
      const doc = docs[i]
      const baseProgress = (i / totalDocs) * 100

      try {
        setProgress(Math.round(baseProgress + 5))
        setProgressLabel(`Chunking "${doc.filename}"… (${i + 1}/${totalDocs})`)

        const chunkRes = await fetch(`${apiBase}/chunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc_id: doc.docId, strategy, params }),
        })
        if (!chunkRes.ok) {
          const e = await chunkRes.json().catch(() => ({ detail: 'Chunking failed' }))
          throw new Error(`${doc.filename}: ${e.detail || 'Chunking failed'}`)
        }
        const chunkData = await chunkRes.json()
        allChunkCount += chunkData.chunk_count
        if (i === 0) firstPreview = chunkData.preview || []

        setProgress(Math.round(baseProgress + (1 / totalDocs) * 50))
        setProgressLabel(`Embedding "${doc.filename}"… (${i + 1}/${totalDocs})`)
        setStep(STEPS.EMBEDDING)

        const embedRes = await fetch(`${apiBase}/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc_id: doc.docId }),
        })
        if (!embedRes.ok) {
          const e = await embedRes.json().catch(() => ({ detail: 'Embedding failed' }))
          throw new Error(`${doc.filename}: ${e.detail || 'Embedding failed'}`)
        }
      } catch (err) {
        setStep(STEPS.ERROR)
        setErrorMsg(err.message)
        setProgress(0)
        return
      }
    }

    setChunkPreview(firstPreview)
    setProgress(100)
    setProgressLabel(`${allChunkCount} chunks stored across ${totalDocs} file${totalDocs > 1 ? 's' : ''}`)
    setStep(STEPS.DONE)
    onEmbeddingDone()
  }, [apiBase, docs, strategy, params, onEmbeddingDone])

  const isProcessing = step === STEPS.CHUNKING || step === STEPS.EMBEDDING
  const isDone = step === STEPS.DONE
  const hasFiles = docs.length > 0

  return (
    <div className="sidebar">
      <div className="sidebar-body">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}>↑ Upload File</button>
          <button className={`tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => setActiveTab('drive')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="13" height="12" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a15.92 15.92 0 001.55 7.10z" fill="#0066da"/>
              <path d="M43.65 25L29.9 1.2a9.1 9.1 0 00-3.3 3.3L.55 50.4A15.92 15.92 0 000 57.5h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25A15.92 15.92 0 0087.3 50.4H59.8l5.85 11.05z" fill="#ea4335"/>
              <path d="M43.65 25L57.4 1.2C56.05.45 54.5 0 52.85 0H34.45c-1.65 0-3.2.45-4.55 1.2z" fill="#00832d"/>
              <path d="M59.8 57.5H27.5L13.75 81.1c1.35.75 2.9 1.2 4.55 1.2h50.7c1.65 0 3.2-.45 4.55-1.2z" fill="#2684fc"/>
              <path d="M73.4 26.35l-13.2-22.85c-1.35-.8-2.9-1.2-4.55-1.3H50.4l-6.75 25-5.85 10.5h27.5z" fill="#ffba00"/>
            </svg>
            Google Drive
          </button>
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-label">{activeTab === 'upload' ? 'File Upload' : 'Google Drive'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>up to 3 docs</span>
            {hasFiles && (
              <span className="section-badge done" style={{ marginLeft: 'auto' }}>{docs.length} file{docs.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {activeTab === 'upload' ? (
            <FileUpload apiBase={apiBase} uploadedDocs={docs}
              onDocAdded={handleDocAdded} onDocRemoved={handleDocRemoved} disabled={isProcessing} />
          ) : (
            <DriveConnect apiBase={apiBase} uploadedDocs={docs}
              onDocAdded={handleDocAdded} onDocRemoved={handleDocRemoved} disabled={isProcessing} />
          )}
        </div>

        {hasFiles && !isDone && (
          <div className="section">
            <div className="section-header">
              <span className="section-label">Pick Chunking Strategy</span>
            </div>
            <ChunkingConfig value={strategy} params={params}
              onChange={handleStrategyChange} onParamsChange={setParams} />
          </div>
        )}

        {chunkPreview.length > 0 && isDone && (
          <div className="section">
            <div className="section-header">
              <span className="section-label">Chunk Preview</span>
            </div>
            <div className="section-content">
              <div className="chunk-preview">
                {chunkPreview.map((c, i) => (
                  <div key={i} className="chunk-preview-item">
                    <div className="chunk-preview-label">Chunk {i + 1}</div>
                    {c.length > 180 ? c.slice(0, 180) + '…' : c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {hasFiles && (
        <div className="sidebar-footer">
          {isProcessing && (
            <div className="progress-wrap" style={{ marginBottom: 10 }}>
              <div className="progress-label">
                <span>{progressLabel}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {step === STEPS.ERROR && (
            <div className="status-msg error" style={{ marginBottom: 10 }}>
              <span>⚠</span> {errorMsg}
            </div>
          )}

          {isDone ? (
            <div className="status-msg success">
              <span>✓</span> {progressLabel}
            </div>
          ) : (
            <button className="embed-btn" onClick={createEmbeddings} disabled={isProcessing}>
              {isProcessing
                ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Processing…</>
                : <><span>⬡</span> Create Embeddings</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
