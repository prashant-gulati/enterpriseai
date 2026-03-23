import BaseNode from './BaseNode'

export default function AgentNode(props) {
  return (
    <BaseNode type="agent" {...props}>
      <div style={{ fontSize: 6, color: '#64748b' }}>{props.data.agentName}</div>
    </BaseNode>
  )
}
