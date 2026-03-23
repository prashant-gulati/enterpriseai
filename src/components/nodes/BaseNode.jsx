import { Handle, Position } from '@xyflow/react'
import { NODE_DEFS } from '../../constants/nodeDefinitions'

export default function BaseNode({ type, data, selected, children }) {
  const def = NODE_DEFS[type]
  if (!def) return null

  return (
    <div
      style={{
        background: '#1e2130',
        border: `1px solid ${selected ? def.color : '#2d3148'}`,
        borderRadius: 3,
        minWidth: 63,
        boxShadow: selected ? `0 0 0 2px ${def.color}40` : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {def.hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ background: def.color, borderColor: '#0f1117' }}
        />
      )}

      {/* Header */}
      <div
        style={{
          background: def.color,
          borderRadius: '3px 3px 0 0',
          padding: '1px 3px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 6, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {def.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '2px 3px', fontSize: 7, color: '#cbd5e1' }}>
        <div style={{ fontWeight: 500, marginBottom: children ? 6 : 0 }}>
          {data.label}
        </div>
        {children}
      </div>

      {def.hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ background: def.color, borderColor: '#0f1117' }}
        />
      )}
    </div>
  )
}
