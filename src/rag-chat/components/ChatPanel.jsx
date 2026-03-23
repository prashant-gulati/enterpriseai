import { useState, useRef, useEffect, useCallback } from 'react'

const MODELS = [
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', provider: 'Google' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
]

function TypingIndicator() {
  return (
    <div className="message assistant">
      <div className="message-avatar">✦</div>
      <div className="message-body">
        <div className="message-bubble" style={{ padding: 0 }}>
          <div className="typing-dots">
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  return (
    <div className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
      <div className="message-avatar">{msg.role === 'assistant' ? '✦' : '👤'}</div>
      <div className="message-body">
        <div className="message-bubble">{msg.content}</div>
        {msg.sources?.length > 0 && (
          <div className="message-sources">
            {msg.sources.map((s, i) => (
              <div key={i} className="source-chip" title={s.content}>
                ↗ {s.filename} · chunk {s.chunk_index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel({ messages, isLoading, docs, embedded, model, onModelChange, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef()
  const textareaRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(text)
  }, [input, isLoading, onSend])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const SAMPLE_PROMPTS = [
    'Compare the net income for Redhat for 2017 vs 2018 vs 2019',
    "How did Redhat's stock-based compensation vary from 2017 to 2019?",
    'What was the value of the transaction in the Salesforce merger?',
  ]

  const activeModel = MODELS.find(m => m.id === model) || MODELS[0]

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-title">
          <div className="model-selector">
            {MODELS.map(m => (
              <button
                key={m.id}
                className={`model-btn ${model === m.id ? 'active' : ''}`}
                onClick={() => onModelChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {embedded && docs.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 240 }}>
            {docs.map(d => (
              <span key={d.docId} className="doc-badge" title={d.filename}>✓ {d.filename}</span>
            ))}
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <h3>RAG Chat</h3>
          <p>
            {embedded
              ? `Ask anything about your ${docs.length} document${docs.length > 1 ? 's' : ''}`
              : 'Upload documents and create embeddings to start chatting'}
          </p>
          <div className="sample-prompts">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button key={i} className="sample-prompt-btn"
                disabled={!embedded}
                onClick={() => onSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-area">
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder={embedded ? 'Ask a question about your documents…' : 'Create embeddings first to enable chat…'}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!embedded || isLoading}
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim() || !embedded || isLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="chat-input-hint">Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}
