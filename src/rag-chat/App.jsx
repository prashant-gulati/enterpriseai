import { useState, useCallback } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'

const API_BASE = '/rag'

export default function RagApp() {
  const [docs, setDocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rag_docs')) || [] } catch { return [] }
  })
  const [embedded, setEmbedded] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rag_embedded')) || false } catch { return false }
  })
  const [model, setModel] = useState(() => {
    return localStorage.getItem('rag_model') || 'gemini-2.5-flash-lite'
  })
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const onDocAdded = useCallback((docId, filename, charCount) => {
    setDocs(prev => {
      if (prev.find(d => d.docId === docId)) return prev
      const next = [...prev, { docId, filename, charCount }]
      localStorage.setItem('rag_docs', JSON.stringify(next))
      return next
    })
    setEmbedded(false)
    localStorage.setItem('rag_embedded', 'false')
  }, [])

  const onDocRemoved = useCallback((docId) => {
    setDocs(prev => {
      const next = prev.filter(d => d.docId !== docId)
      localStorage.setItem('rag_docs', JSON.stringify(next))
      return next
    })
    setEmbedded(false)
    localStorage.setItem('rag_embedded', 'false')
    setMessages([])
  }, [])

  const onEmbeddingDone = useCallback(() => {
    setEmbedded(true)
    localStorage.setItem('rag_embedded', 'true')
  }, [])

  const onAllCleared = useCallback(() => {
    setDocs([])
    setEmbedded(false)
    setMessages([])
    localStorage.removeItem('rag_docs')
    localStorage.removeItem('rag_embedded')
  }, [])

  const handleModelChange = useCallback((m) => {
    setModel(m)
    localStorage.setItem('rag_model', m)
  }, [])

  const sendMessage = useCallback(async (query) => {
    if (!query.trim()) return
    const userMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          doc_ids: docs.map(d => d.docId),
          history: messages.map(({ role, content }) => ({ role, content })),
          model,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(err.detail || 'Chat request failed')
      }
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, sources: data.sources }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: err.message, isError: true }])
    } finally {
      setIsLoading(false)
    }
  }, [docs, messages, model])

  return (
    <div className="app">
      <Sidebar
        apiBase={API_BASE}
        docs={docs}
        embedded={embedded}
        onDocAdded={onDocAdded}
        onDocRemoved={onDocRemoved}
        onEmbeddingDone={onEmbeddingDone}
        onAllCleared={onAllCleared}
      />
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        docs={docs}
        embedded={embedded}
        model={model}
        onModelChange={handleModelChange}
        onSend={sendMessage}
      />
    </div>
  )
}
