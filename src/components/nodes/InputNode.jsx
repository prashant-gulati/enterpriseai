import BaseNode from './BaseNode'

export default function InputNode(props) {
  const { inputType, placeholder, fileName } = props.data
  const subtitle = inputType === 'file'
    ? (fileName || 'file upload')
    : placeholder

  return (
    <BaseNode type="trigger" {...props}>
      {subtitle && <div style={{ fontSize: 6, color: '#64748b' }}>{subtitle}</div>}
    </BaseNode>
  )
}
