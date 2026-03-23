import { useState } from 'react'
import { NODE_DEFS } from '../constants/nodeDefinitions'

const HINTS = [
  {
    type: 'trigger',
    usage: 'Starting point of a flow. Provides the user message.',
    example: 'What is the weather today?',
  },
  {
    type: 'llm',
    usage: 'Calls a Gemini model. Set a system prompt to give it a role.',
    example: 'System prompt: "You are a finance analyst."',
  },
  {
    type: 'agent',
    usage: 'An autonomous agent that can use tools and decide when to call them.',
    example: 'Give it google_search to answer live questions.',
  },
  {
    type: 'tool',
    usage: 'A built-in capability. Connect it to an Agent node (not LLM).',
    example: 'google_search → finds real-time info',
  },
  {
    type: 'result',
    usage: 'Terminal node. Marks where the flow ends and displays the output.',
    example: 'Required — add one to enable Run.',
  },
]

const FLOWS = [
  { label: 'Simple Q&A', steps: ['Input', 'LLM', 'Output'] },
  { label: 'Agent + Search', steps: ['Input', 'Agent', 'Tool (google_search)', 'Output'] },
]

export default function HintPanel() {
  const [tab, setTab] = useState('nodes')

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e2130' }}>
        {['nodes', 'flows'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '6px 0',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              color: tab === t ? '#e2e8f0' : '#475569',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '10px 14px', maxHeight: 300, overflowY: 'auto' }}>
        {tab === 'nodes' && HINTS.map(({ type, usage, example }) => {
          const def = NODE_DEFS[type]
          return (
            <div key={type} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: def.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{def.label}</span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{usage}</p>
              <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, margin: '3px 0 0', fontStyle: 'italic' }}>{example}</p>
            </div>
          )
        })}

        {tab === 'flows' && (
          <>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
              Drag nodes from above and connect them handle-to-handle.
            </p>
            {FLOWS.map(({ label, steps }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {steps.map((step, i) => {
                    const typeKey = Object.keys(NODE_DEFS).find((k) =>
                      step.toLowerCase().includes(NODE_DEFS[k].label.toLowerCase())
                    )
                    const color = typeKey ? NODE_DEFS[typeKey].color : '#475569'
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i > 0 && <div style={{ width: 1, height: 8, background: '#2d3148', marginLeft: 3, marginTop: -6, marginBottom: -2 }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{step}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: '#475569' }}>
                  Then type in the Run bar ↓ and hit Run.
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
