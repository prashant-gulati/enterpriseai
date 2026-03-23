import { useCallback, useState, useEffect } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import useFlowStore from '../store/flowStore'
import InputNode from './nodes/InputNode'
import LLMNode from './nodes/LLMNode'
import AgentNode from './nodes/AgentNode'
import ToolNode from './nodes/ToolNode'
import OutputNode from './nodes/OutputNode'
import { NODE_DEFS } from '../constants/nodeDefinitions'
import RunBar from './RunBar'

const nodeTypes = {
  trigger: InputNode,
  llm: LLMNode,
  agent: AgentNode,
  tool: ToolNode,
  result: OutputNode,
}

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNode, fitViewTrigger } = useFlowStore()
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    if (fitViewTrigger > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    }
  }, [fitViewTrigger])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/node-type')
    if (!type) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(type, position)
  }, [screenToFlowPosition, addNode])

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode="Delete"
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} color="#2d3148" gap={20} size={1} />
        <Controls
          style={{ background: '#1e2130', border: '1px solid #475569', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        />
        {mapOpen && (
          <MiniMap
            nodeColor={(n) => NODE_DEFS[n.type]?.color ?? '#64748b'}
            style={{ background: '#13151f', border: '1px solid #2d3148', marginBottom: 28 }}
          />
        )}
      </ReactFlow>
      <button
        onClick={() => setMapOpen((v) => !v)}
        title={mapOpen ? 'Hide map' : 'Show map'}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 10,
          background: '#1e2130',
          border: '1px solid #475569',
          borderRadius: 6,
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        {mapOpen ? 'Hide map' : 'Map'}
      </button>
      <RunBar />
    </div>
  )
}
