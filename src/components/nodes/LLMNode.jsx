import BaseNode from './BaseNode'

export default function LLMNode(props) {
  return (
    <BaseNode type="llm" {...props}>
      <div style={{ fontSize: 6, color: '#64748b' }}>{props.data.model}</div>
    </BaseNode>
  )
}
