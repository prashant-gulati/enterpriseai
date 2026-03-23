import { useShallow } from 'zustand/react/shallow'
import useFlowStore from '../store/flowStore'

export default function OutputPanel() {
  const { runOutput, runError, isRunning, setRunState } = useFlowStore(
    useShallow((s) => ({
      runOutput: s.runOutput,
      runError: s.runError,
      isRunning: s.isRunning,
      setRunState: s.setRunState,
    }))
  )

  if (!runOutput && !runError && !isRunning) return null

  return (
    <div
      style={{
        width: 300,
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
          padding: '10px 14px',
          borderBottom: '1px solid #1e2130',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Output
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isRunning && (
            <span style={{ fontSize: 11, color: '#6366f1' }}>Running…</span>
          )}
          <button
            onClick={() => setRunState({ runOutput: '', runError: '' })}
            title="Clear"
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          fontSize: 13,
          lineHeight: 1.7,
          color: runError ? '#f87171' : '#cbd5e1',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {runError || runOutput}
        {isRunning && !runError && <span style={{ opacity: 0.4 }}>▋</span>}
      </div>
    </div>
  )
}
