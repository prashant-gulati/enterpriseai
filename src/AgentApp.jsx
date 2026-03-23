import useFlowStore from './store/flowStore'
import NodePalette from './components/NodePalette'
import Canvas from './components/Canvas'
import ConfigPanel from './components/ConfigPanel'

export default function AgentApp() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <NodePalette />
      <Canvas />
      {selectedNodeId && <ConfigPanel />}
    </div>
  )
}
