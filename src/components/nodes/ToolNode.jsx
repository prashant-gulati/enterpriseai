import BaseNode from './BaseNode'

export default function ToolNode(props) {
  return (
    <BaseNode type="tool" {...props}>
      <div style={{ fontSize: 6, color: '#64748b' }}>{props.data.toolName || 'pick a tool'}</div>
    </BaseNode>
  )
}
