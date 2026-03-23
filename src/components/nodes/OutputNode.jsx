import BaseNode from './BaseNode'

export default function OutputNode(props) {
  const { result, running } = props.data

  return (
    <BaseNode type="result" {...props}>
      {result ? (
        <div
          style={{
            marginTop: 2,
            fontSize: 6,
            color: '#64748b',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxWidth: 240,
            borderTop: '1px solid #2d3148',
            paddingTop: 4,
          }}
        >
          {result.length > 100 ? result.slice(0, 100) + '…' : result}
          {running && <span style={{ opacity: 0.4 }}>▋</span>}
        </div>
      ) : (
        <div style={{ fontSize: 6, color: '#64748b' }}>
          {running ? 'Running…' : props.data.format}
        </div>
      )}
    </BaseNode>
  )
}
