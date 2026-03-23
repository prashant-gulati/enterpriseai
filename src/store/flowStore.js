import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import { NODE_DEFS } from '../constants/nodeDefinitions'

const useFlowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  fitViewTrigger: 0,

  // run state
  runOutput: '',
  runError: '',
  isRunning: false,
  setRunState: (patch) => set(patch),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true, type: 'smoothstep' }, get().edges) })
  },

  addNode: (type, position) => {
    const def = NODE_DEFS[type]
    if (!def) return
    const id = crypto.randomUUID()
    const node = {
      id,
      type,
      position,
      data: { ...def.defaultData },
    }
    set({ nodes: [...get().nodes, node] })
  },

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    })
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id })
  },

  loadFlow: (nodes, edges) => {
    set({ nodes, edges, selectedNodeId: null, fitViewTrigger: get().fitViewTrigger + 1 })
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    })
  },
}))

export default useFlowStore
