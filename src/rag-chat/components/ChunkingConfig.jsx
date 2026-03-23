import { useState } from 'react'

const STRATEGIES = [
  {
    id: 'fixed',
    name: 'Fixed Size',
    desc: 'Split by character count with configurable overlap',
    params: [
      { key: 'chunk_size', label: 'Chunk size (chars)', type: 'number', min: 100, max: 4000, step: 50, default: 1500 },
      { key: 'overlap', label: 'Overlap (chars)', type: 'number', min: 0, max: 500, step: 10, default: 50 },
    ],
  },
  {
    id: 'structural',
    name: 'Structural',
    desc: 'Split on headings and paragraph boundaries',
    params: [],
  },
  {
    id: 'semantic',
    name: 'Semantic',
    desc: 'Split where sentence similarity drops (uses embeddings)',
    params: [
      { key: 'threshold', label: 'Similarity threshold', type: 'range', min: 0.3, max: 0.95, step: 0.05, default: 0.7 },
    ],
  },
  {
    id: 'recursive',
    name: 'Recursive',
    desc: 'Recursively splits using hierarchy of separators',
    params: [
      { key: 'chunk_size', label: 'Chunk size (chars)', type: 'number', min: 100, max: 4000, step: 50, default: 1500 },
      { key: 'overlap', label: 'Overlap (chars)', type: 'number', min: 0, max: 500, step: 10, default: 50 },
    ],
  },
  {
    id: 'llm',
    name: 'LLM-Based',
    desc: 'Gemini identifies natural topic boundaries in the text',
    params: [],
  },
]

export default function ChunkingConfig({ value, params, onChange, onParamsChange }) {
  const strategy = STRATEGIES.find(s => s.id === value) || STRATEGIES[0]

  const handleParamChange = (key, val) => {
    onParamsChange({ ...params, [key]: val })
  }

  return (
    <div className="section-content" style={{ paddingTop: 10 }}>
      <div className="strategy-grid">
        {STRATEGIES.map(s => (
          <div
            key={s.id}
            className={`strategy-option ${value === s.id ? 'selected' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <div className="strategy-radio" />
            <div className="strategy-text">
              <div className="strategy-name">{s.name}</div>
              <div className="strategy-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {strategy.params.length > 0 && (
        <div className="params-grid">
          {strategy.params.map(p => (
            <div key={p.key} className="param-row">
              <div className="param-label">{p.label}</div>
              {p.type === 'range' ? (
                <>
                  <input
                    type="range"
                    className="param-input"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={params[p.key] ?? p.default}
                    onChange={e => handleParamChange(p.key, parseFloat(e.target.value))}
                    style={{ padding: 0, height: 'auto', cursor: 'pointer' }}
                  />
                  <div className="param-value">{(params[p.key] ?? p.default).toFixed(2)}</div>
                </>
              ) : (
                <input
                  type="number"
                  className="param-input"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={params[p.key] ?? p.default}
                  onChange={e => handleParamChange(p.key, parseInt(e.target.value, 10))}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
