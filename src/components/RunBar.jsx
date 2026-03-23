import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useFlowStore from '../store/flowStore'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function RunBar() {
  const { nodes, edges, updateNodeData, isRunning, setRunState } = useFlowStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      updateNodeData: s.updateNodeData,
      isRunning: s.isRunning,
      setRunState: s.setRunState,
    }))
  )
  const [message, setMessage] = useState('')

  const triggerNodes = nodes.filter((n) => n.type === 'trigger')
  const [selectedTriggerId, setSelectedTriggerId] = useState(null)
  const triggerNode = triggerNodes.find((n) => n.id === selectedTriggerId) ?? triggerNodes[0]
  const resultNode = nodes.find((n) => n.type === 'result')

  async function handleRun() {
    if (!resultNode) return
    setRunState({ isRunning: true })
    updateNodeData(resultNode.id, { result: '', running: true })

    try {
      updateNodeData(resultNode.id, { result: 'Connecting to backend…', running: true })
      const res = await fetch(`${BACKEND}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          message: triggerNode?.data?.inputType === 'file'
            ? triggerNode?.data?.fileText || undefined
            : message || undefined,
          trigger_id: triggerNode?.id ?? null,
        }),
      })

      if (!res.ok) {
        updateNodeData(resultNode.id, { result: `HTTP ${res.status}: ${res.statusText}`, running: false })
        return
      }

      updateNodeData(resultNode.id, { result: 'Waiting for response…', running: true })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''
      let done = false

      while (!done) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const json = line.slice(5).trim()
          if (!json) continue
          try {
            const obj = JSON.parse(json)
            if (obj.error) {
              accumulated = `Error: ${obj.error}`
              done = true
              break
            }
            if (obj.done) {
              done = true
              break
            }
            if (obj.text) {
              accumulated += obj.text
              updateNodeData(resultNode.id, { result: accumulated, running: true })
            }
          } catch {}
        }
      }

      if (!accumulated) {
        updateNodeData(resultNode.id, { result: 'No response received from backend.', running: false })
      }
    } catch (e) {
      updateNodeData(resultNode.id, { result: `Network error: ${e.message}`, running: false })
    } finally {
      setRunState({ isRunning: false })
      updateNodeData(resultNode.id, { running: false })
    }
  }

  const noOutputNode = !resultNode
  const isFileInput = triggerNode?.data?.inputType === 'file'
  const output = resultNode?.data?.result || ''
  const running = resultNode?.data?.running || false

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        width: 480,
        background: '#13151f',
        border: `1px solid ${noOutputNode ? '#f59e0b40' : '#2d3148'}`,
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {noOutputNode && (
        <div style={{ padding: '5px 12px', fontSize: 11, color: '#f59e0b', borderBottom: '1px solid #f59e0b20', textAlign: 'center' }}>
          Add an Output node to see results
        </div>
      )}
      {triggerNodes.length > 1 && (
        <div style={{ padding: '5px 10px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Flow:</span>
          <select
            value={triggerNode?.id ?? ''}
            onChange={(e) => setSelectedTriggerId(e.target.value)}
            style={{ flex: 1, background: '#0f1117', border: '1px solid #2d3148', borderRadius: 4, padding: '3px 6px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
          >
            {triggerNodes.map((t) => (
              <option key={t.id} value={t.id}>{t.data.label || 'Input'}</option>
            ))}
          </select>
        </div>
      )}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid #1e2130',
          fontSize: 12,
          color: output ? '#cbd5e1' : '#475569',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 220,
          minHeight: 36,
          overflowY: 'auto',
        }}
      >
        {output || (running ? 'Running…' : 'Output will appear here')}
        {output && running && <span style={{ opacity: 0.4 }}>▋</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isRunning && !noOutputNode && handleRun()}
          placeholder={isFileInput ? 'File input active — upload a file in the Input node' : triggerNode?.data?.placeholder || 'Enter a message...'}
          disabled={noOutputNode || isFileInput}
          style={{
            flex: 1,
            background: '#0f1117',
            border: '1px solid #2d3148',
            borderRadius: 6,
            padding: '6px 10px',
            color: noOutputNode || isFileInput ? '#475569' : '#e2e8f0',
            fontSize: 13,
            outline: 'none',
            cursor: noOutputNode || isFileInput ? 'not-allowed' : 'text',
          }}
        />
        <button
          onClick={handleRun}
          disabled={isRunning || noOutputNode}
          style={{
            background: isRunning || noOutputNode ? '#2d3148' : '#6366f1',
            border: 'none',
            borderRadius: 6,
            padding: '6px 16px',
            color: noOutputNode ? '#475569' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: isRunning || noOutputNode ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>
    </div>
  )
}
