import { useState } from 'react'
import useFlowStore from '../store/flowStore'
import { NODE_DEFS } from '../constants/nodeDefinitions'

const inputStyle = {
  width: '100%',
  background: '#0f1117',
  border: '1px solid #2d3148',
  borderRadius: 6,
  padding: '6px 8px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  display: 'block',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  )
}

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function FileUpload({ data, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BACKEND}/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).detail)
      const { text, filename, char_count } = await res.json()
      onChange({ fileText: text, fileName: filename, charCount: char_count })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label
        style={{
          display: 'block',
          background: '#0f1117',
          border: '1px dashed #475569',
          borderRadius: 6,
          padding: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          fontSize: 12,
          color: '#64748b',
        }}
      >
        {uploading ? 'Uploading…' : data.fileName ? `${data.fileName} (${(data.charCount / 1000).toFixed(1)}k chars)` : 'Click to upload PDF, DOCX, or TXT'}
        <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {error && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{error}</div>}
      {data.fileText && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#475569', maxHeight: 60, overflowY: 'auto', fontFamily: 'monospace' }}>
          {data.fileText.slice(0, 300)}…
        </div>
      )}
    </div>
  )
}

function NodeFields({ type, data, onChange }) {
  if (type === 'trigger') return (
    <>
      <Field label="Input Type">
        <select value={data.inputType} onChange={(e) => onChange({ inputType: e.target.value })} style={inputStyle}>
          <option value="user_message">User Message</option>
          <option value="file">File</option>
        </select>
      </Field>
      {data.inputType === 'file' ? (
        <Field label="File">
          <FileUpload data={data} onChange={onChange} />
        </Field>
      ) : (
        <Field label="User Message">
          <textarea
            value={data.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>
      )}
    </>
  )

  if (type === 'llm') return (
    <>
      <Field label="Model">
        <select value={data.model} onChange={(e) => onChange({ model: e.target.value })} style={inputStyle}>
          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro</option>
          <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
        </select>
      </Field>
      <Field label="System Prompt">
        <textarea
          value={data.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </Field>
      <Field label={`Temperature: ${data.temperature}`}>
        <input
          type="range" min="0" max="2" step="0.1"
          value={data.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: NODE_DEFS.llm.color }}
        />
      </Field>
    </>
  )

  if (type === 'agent') return (
    <>
      <Field label="System Prompt">
        <textarea
          value={data.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </Field>
      <Field label="Max Iterations">
        <input
          type="number" min="1" max="50"
          value={data.maxIterations}
          onChange={(e) => onChange({ maxIterations: parseInt(e.target.value) })}
          style={inputStyle}
        />
      </Field>
    </>
  )

  if (type === 'tool') return (
    <>
      <Field label="Built-in Tool">
        <select value={data.toolName} onChange={(e) => onChange({ toolName: e.target.value })} style={inputStyle}>
          <option value="google_search">Google Search</option>
          <option value="url_context">URL Context</option>
        </select>
      </Field>
    </>
  )

  if (type === 'result') return null

  return null
}

export default function ConfigPanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, setSelectedNode } = useFlowStore()
  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const def = NODE_DEFS[node.type]

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: '#13151f',
        borderLeft: '1px solid #1e2130',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1e2130',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: def.color }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{def.label}</span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <Field label="Label">
          <input
            value={node.data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <NodeFields
          type={node.type}
          data={node.data}
          onChange={(patch) => updateNodeData(node.id, patch)}
        />
      </div>

      {/* Delete */}
      <div style={{ padding: 16, borderTop: '1px solid #1e2130' }}>
        <button
          onClick={() => deleteNode(node.id)}
          style={{
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: '1px solid #ef4444',
            borderRadius: 6,
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444420' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          Delete Node
        </button>
      </div>
    </div>
  )
}
