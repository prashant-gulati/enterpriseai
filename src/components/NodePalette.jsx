import { useState } from 'react'
import { NODE_DEFS, NODE_TYPE_KEYS } from '../constants/nodeDefinitions'
import { AGENT_FLOWS } from '../constants/agentFlows'
import useFlowStore from '../store/flowStore'
import HintPanel from './HintPanel'

export default function NodePalette() {
  const [hintOpen, setHintOpen] = useState(false)
  const [expandedFlow, setExpandedFlow] = useState(null)
  const loadFlow = useFlowStore((s) => s.loadFlow)

  const handleLoadFlow = async (flow) => {
    let nodes = flow.nodes
    const triggerNode = nodes.find((n) => n.type === 'trigger' && n.data?.inputType === 'file')
    if (triggerNode) {
      try {
        let filePath = triggerNode.data.filePath
        // If no specific file, resolve the first PDF from the folder
        if (!filePath && triggerNode.data.fileFolder) {
          const res = await fetch(`http://localhost:8000/list-pdfs?folder=${encodeURIComponent(triggerNode.data.fileFolder)}`)
          if (res.ok) {
            const files = await res.json()
            if (files.length > 0) filePath = files[0].path
          }
        }
        if (filePath) {
          const res = await fetch(`http://localhost:8000/preload?path=${encodeURIComponent(filePath)}`)
          if (res.ok) {
            const { text, filename, char_count } = await res.json()
            nodes = nodes.map((n) =>
              n.id === triggerNode.id
                ? { ...n, data: { ...n.data, fileText: text, fileName: filename, charCount: char_count, filePath } }
                : n
            )
          }
        }
      } catch (_) {
        // backend unavailable — load template without file text
      }
    }
    loadFlow(nodes, flow.edges)
  }

  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/node-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: '#13151f',
        borderRight: '1px solid #1e2130',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Node list */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Build Agent
        </div>

        {NODE_TYPE_KEYS.map((type) => {
          const def = NODE_DEFS[type]
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              style={{
                background: '#1e2130',
                border: '1px solid #2d3148',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'grab',
                userSelect: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = def.color
                e.currentTarget.style.background = '#252840'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2d3148'
                e.currentTarget.style.background = '#1e2130'
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: def.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{def.label}</span>
            </div>
          )
        })}
        {/* Pre-built flows */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Templates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AGENT_FLOWS.map((flow) => {
              const isExpanded = expandedFlow === flow.id
              return (
                <div key={flow.id}>
                  <button
                    onClick={() => flow.subFlows
                      ? setExpandedFlow(isExpanded ? null : flow.id)
                      : handleLoadFlow(flow)
                    }
                    style={{
                      width: '100%',
                      background: '#1e2130',
                      border: `1px solid #2d3148`,
                      borderLeft: `3px solid ${flow.color}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = flow.color
                      e.currentTarget.style.background = '#252840'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2d3148'
                      e.currentTarget.style.borderLeftColor = flow.color
                      e.currentTarget.style.background = '#1e2130'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{flow.label}</div>
                      {flow.subFlows && (
                        <span style={{ fontSize: 10, color: '#475569' }}>{isExpanded ? '▲' : '▼'}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{flow.description}</div>
                  </button>
                  {flow.subFlows && isExpanded && (
                    <div style={{ marginTop: 3, marginLeft: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {flow.subFlows.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleLoadFlow(sub)}
                          style={{
                            background: '#0f1117',
                            border: `1px solid #2d3148`,
                            borderLeft: `3px solid ${flow.color}`,
                            borderRadius: 6,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = flow.color
                            e.currentTarget.style.background = '#1e2130'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#2d3148'
                            e.currentTarget.style.borderLeftColor = flow.color
                            e.currentTarget.style.background = '#0f1117'
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>{sub.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hint panel (expands upward above footer) */}
      {hintOpen && (
        <div style={{ borderTop: '1px solid #1e2130' }}>
          <HintPanel onClose={() => setHintOpen(false)} />
        </div>
      )}

      {/* Footer buttons */}
      <div
        style={{
          borderTop: '1px solid #1e2130',
          display: 'flex',
          gap: 1,
        }}
      >
        {[
          { label: 'Help', active: hintOpen, onClick: () => setHintOpen((v) => !v) },
        ].map(({ label, active, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            style={{
              flex: 1,
              padding: '8px 0',
              background: active ? '#1e2130' : 'transparent',
              border: 'none',
              borderTop: active ? '2px solid #6366f1' : '2px solid transparent',
              color: active ? '#e2e8f0' : '#475569',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
