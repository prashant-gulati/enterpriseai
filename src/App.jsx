import { useState, useEffect, useRef } from 'react'
import AgentApp from './AgentApp'
import RagApp from './rag-chat/App'

const tabStyle = {
  padding: '10px 20px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: '#8888aa',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
}

const activeTabStyle = {
  ...tabStyle,
  color: '#e2e2f0',
  borderBottom: '2px solid #5b5bd6',
}

function ColdStartTimer() {
  const [seconds, setSeconds] = useState(90)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(intervalRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const done = seconds === 0
  const accent = done ? '#22c55e' : seconds <= 15 ? '#ef4444' : '#f59e0b'
  const progress = seconds / 90

  return (
    <div style={{ marginLeft: 'auto', padding: '0 20px 0 12px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #2a2a42' }}>
      {!done && (
        <div style={{ fontSize: '11px', color: '#6060808', maxWidth: '220px', lineHeight: '1.4', color: '#5a5a7a' }}>
          Services on Render may take up to 90s to come online. <span style={{ color: '#7070909' }}>Agent Canvas and RAG Chat may be delayed.</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'default' }}>
        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" stroke="#1e1e2e" strokeWidth="4" fill="none"/>
            <circle cx="22" cy="22" r="18" stroke={accent} strokeWidth="4" fill="none"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.3s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: done ? '9px' : '11px', fontWeight: '700', color: accent, letterSpacing: done ? '0.02em' : '0' }}>
              {done ? 'LIVE' : seconds}
            </span>
          </div>
        </div>
        <div style={{ fontSize: '8px', fontWeight: '600', letterSpacing: '0.08em', color: done ? accent : '#4a4a6a', textAlign: 'center', lineHeight: '1.2' }}>
          {done ? 'RENDER READY' : 'COLD START'}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d0d14' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#13131e', borderBottom: '1px solid #2a2a42', flexShrink: 0 }}>
        <span style={{ padding: '0 24px', color: '#ffffff', fontSize: '20px', fontWeight: '700', letterSpacing: '0.04em', borderRight: '1px solid #2a2a42', marginRight: '4px', lineHeight: '48px', textTransform: 'uppercase', background: 'linear-gradient(90deg, #7c7cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Enterprise AI Hub
        </span>
        <button style={tab === 'home' ? activeTabStyle : tabStyle} onClick={() => setTab('home')}>
          Home
          <span style={{ display: 'block', fontSize: '8px', lineHeight: '1', marginTop: '3px' }}>&nbsp;</span>
        </button>
        <button style={tab === 'agent' ? activeTabStyle : tabStyle} onClick={() => setTab('agent')}>
          Agent Canvas
          <span style={{ display: 'block', fontSize: '8px', lineHeight: '1', marginTop: '3px' }}>&nbsp;</span>
        </button>
        <button style={tab === 'rag' ? activeTabStyle : tabStyle} onClick={() => setTab('rag')}>
          RAG Chat
          <span style={{ display: 'block', fontSize: '8px', lineHeight: '1', marginTop: '3px' }}>&nbsp;</span>
        </button>
        <button style={tab === 'observability' ? activeTabStyle : tabStyle} onClick={() => setTab('observability')}>
          Observability
          <span style={{ display: 'block', fontSize: '8px', fontWeight: '700', letterSpacing: '0.1em', color: '#f59e0b', lineHeight: '1', marginTop: '3px', textAlign: 'right' }}>IN DEV</span>
        </button>
        <button style={tab === 'admin' ? activeTabStyle : tabStyle} onClick={() => setTab('admin')}>
          Admin
          <span style={{ display: 'block', fontSize: '8px', fontWeight: '700', letterSpacing: '0.1em', color: '#f59e0b', lineHeight: '1', marginTop: '3px', textAlign: 'right' }}>IN DEV</span>
        </button>
        <ColdStartTimer />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', color: '#e2e2f0', overflowY: 'auto', paddingTop: '40px', paddingBottom: '32px' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', background: 'linear-gradient(90deg, #7c7cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Enterprise AI Hub
            </div>
            <div style={{ fontSize: '15px', color: '#8888aa', maxWidth: '420px', textAlign: 'center', lineHeight: '1.6', marginTop: '12px' }}>
              Your unified platform for building, running, and managing AI agents across the enterprise.
            </div>
            <div style={{ marginTop: '52px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Key Features
            </div>
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '680px' }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v4c0 3.31 2.57 6.41 6 7.16C12.43 15.41 15 12.31 15 9V5L9 2z" stroke="#7c7cf8" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 9l2 2 3-3" stroke="#7c7cf8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Privacy', desc: 'Deploy within your VPC or on-prem for complete data sovereignty' },
                { icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="3" y="8" width="12" height="8" rx="1.5" stroke="#a78bfa" strokeWidth="1.4"/><path d="M6 8V6a3 3 0 016 0v2" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round"/><circle cx="9" cy="12" r="1.2" fill="#a78bfa"/></svg>, label: 'Security', desc: 'Protect your data with zero-trust security architecture' },
                { icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M15 5H3a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1z" stroke="#60c8a8" strokeWidth="1.4"/><path d="M12 5V4a3 3 0 00-6 0v1" stroke="#60c8a8" strokeWidth="1.4" strokeLinecap="round"/><path d="M6 10h6M6 12.5h4" stroke="#60c8a8" strokeWidth="1.2" strokeLinecap="round"/></svg>, label: 'Compliance', desc: 'Full data traceability and audit-ready logs' },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: '#0e0e1a', border: '1px solid #2a2a42', borderRadius: '8px', flex: '1', minWidth: '160px', maxWidth: '210px' }}>
                  <div style={{ flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#d0d0e8' }}>{label}</div>
                    <div style={{ fontSize: '10px', color: '#5a5a7a', lineHeight: '1.4', marginTop: '2px' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: '320px', height: '1px', background: 'linear-gradient(90deg, transparent, #2a2a42, transparent)', marginTop: '28px' }} />
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a4a6a', fontWeight: '600' }}>
                Powered By
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '680px' }}>
                {/* PyMuPDF */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="1" width="9" height="12" rx="1" stroke="#f97316" strokeWidth="1.3"/>
                    <path d="M5 5h5M5 7.5h5M5 10h3" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M11 1v3l3-1.5L11 1z" fill="#f97316"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>PyMuPDF</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>text extraction</span>
                  </div>
                </div>
                {/* Supabase + pgvector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4.5C3 3.67 5.24 3 8 3s5 .67 5 1.5v7C13 12.33 10.76 13 8 13s-5-.67-5-1.5v-7z" stroke="#3ecf8e" strokeWidth="1.3"/>
                    <ellipse cx="8" cy="4.5" rx="5" ry="1.5" stroke="#3ecf8e" strokeWidth="1.3"/>
                    <ellipse cx="8" cy="8" rx="5" ry="1.5" stroke="#3ecf8e" strokeWidth="1.1" strokeDasharray="2 1.5"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>Supabase</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>pgvector · HNSW</span>
                  </div>
                </div>
                {/* Google ADK */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5.5" stroke="#4285f4" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" fill="#4285f4"/>
                    <path d="M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2" stroke="#4285f4" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>Google ADK</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>agent dev kit</span>
                  </div>
                </div>
                {/* Flowise */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="3" cy="8" r="1.8" stroke="#06b6d4" strokeWidth="1.3"/>
                    <circle cx="8" cy="4" r="1.8" stroke="#06b6d4" strokeWidth="1.3"/>
                    <circle cx="13" cy="8" r="1.8" stroke="#06b6d4" strokeWidth="1.3"/>
                    <circle cx="8" cy="12" r="1.8" stroke="#06b6d4" strokeWidth="1.3"/>
                    <path d="M4.7 7.2L6.3 5.5M9.7 4.5L11.3 6.8M11.3 9.2L9.7 11.2M6.3 11.5L4.7 9.5" stroke="#06b6d4" strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>Flowise</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>agent builder</span>
                  </div>
                </div>
                {/* Claude Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" stroke="#d4a27f" strokeWidth="1.3"/>
                    <path d="M5.5 6.5L4 8l1.5 1.5M10.5 6.5L12 8l-1.5 1.5M9 5.5l-2 5" stroke="#d4a27f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>Claude Code</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>AI engineering</span>
                  </div>
                </div>
                {/* Google Drive OAuth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L13.5 11.5H2.5L8 2z" fill="none" stroke="#fbbc04" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M2.5 11.5h11" stroke="#34a853" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M5.5 2h5" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d0d0e8' }}>Google Drive</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', marginLeft: '6px' }}>OAuth 2.0</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: '320px', height: '1px', background: 'linear-gradient(90deg, transparent, #2a2a42, transparent)', marginTop: '48px' }} />
            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a4a6a', fontWeight: '600' }}>
                Trusted &amp; Certified
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* SOC 2 Type II */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '5px 8px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '6px', width: '46px' }}>
                  <svg width="13" height="15" viewBox="0 0 36 40" fill="none">
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#1e1e2e" stroke="#5b5bd6" strokeWidth="1.5"/>
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="url(#soc2grad)" fillOpacity="0.15"/>
                    <path d="M12 20l4 4 8-8" stroke="#7c7cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="soc2grad" x1="3" y1="2" x2="33" y2="39" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#7c7cf8"/>
                        <stop offset="1" stopColor="#a78bfa"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '7px', fontWeight: '700', color: '#c0c0e0', letterSpacing: '0.04em' }}>SOC 2</div>
                    <div style={{ fontSize: '7px', color: '#5b5bd6', fontWeight: '600', letterSpacing: '0.08em', marginTop: '1px' }}>TYPE II</div>
                  </div>
                </div>
                {/* ISO 27001 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '5px 8px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '6px', width: '46px' }}>
                  <svg width="13" height="15" viewBox="0 0 36 40" fill="none">
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#1e1e2e" stroke="#22c55e" strokeWidth="1.5"/>
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#22c55e" fillOpacity="0.08"/>
                    <rect x="14" y="19" width="8" height="7" rx="1" stroke="#22c55e" strokeWidth="1.5"/>
                    <path d="M15 19v-2a3 3 0 016 0v2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="18" cy="22.5" r="1" fill="#22c55e"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '7px', fontWeight: '700', color: '#c0c0e0', letterSpacing: '0.04em' }}>ISO 27001</div>
                    <div style={{ fontSize: '7px', color: '#22c55e', fontWeight: '600', letterSpacing: '0.08em', marginTop: '1px' }}>CERTIFIED</div>
                  </div>
                </div>
                {/* ISO/IEC 42001 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '5px 8px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '6px', width: '46px' }}>
                  <svg width="13" height="15" viewBox="0 0 36 40" fill="none">
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#1e1e2e" stroke="#f59e0b" strokeWidth="1.5"/>
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#f59e0b" fillOpacity="0.08"/>
                    <circle cx="18" cy="20" r="3.5" stroke="#f59e0b" strokeWidth="1.5"/>
                    <path d="M18 13v2M18 25v2M11 20h2M23 20h2M13.1 15.1l1.4 1.4M21.5 21.5l1.4 1.4M13.1 24.9l1.4-1.4M21.5 18.5l1.4-1.4" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '7px', fontWeight: '700', color: '#c0c0e0', letterSpacing: '0.04em' }}>ISO 42001</div>
                    <div style={{ fontSize: '7px', color: '#f59e0b', fontWeight: '600', letterSpacing: '0.08em', marginTop: '1px' }}>AI MGMT</div>
                  </div>
                </div>
                {/* GDPR / CCPA */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '5px 8px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '6px', width: '46px' }}>
                  <svg width="13" height="15" viewBox="0 0 36 40" fill="none">
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#1e1e2e" stroke="#38bdf8" strokeWidth="1.5"/>
                    <path d="M18 2L3 8.5V20C3 28.5 9.5 36.5 18 39C26.5 36.5 33 28.5 33 20V8.5L18 2Z" fill="#38bdf8" fillOpacity="0.08"/>
                    <circle cx="18" cy="17" r="3" stroke="#38bdf8" strokeWidth="1.5"/>
                    <path d="M11 27c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '7px', fontWeight: '700', color: '#c0c0e0', letterSpacing: '0.04em' }}>GDPR</div>
                    <div style={{ fontSize: '7px', color: '#38bdf8', fontWeight: '600', letterSpacing: '0.08em', marginTop: '1px' }}>CCPA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'agent' && <AgentApp />}
        {tab === 'rag' && <RagApp />}
        {tab === 'observability' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e2e2f0', gap: '0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#1e1a0e', border: '1px solid #3d3010', borderRadius: '6px', marginBottom: '28px' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#f59e0b" strokeWidth="1.2"/><path d="M5 3v2.5l1.5 1" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round"/></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', color: '#f59e0b' }}>IN DEVELOPMENT</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c7cf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>Compliance</div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', width: '100%' }}>
              {[
                'Full data traceability and audit-ready logs',
                'Designed with SOC 2, ISO 27001, ISO/IEC 42001, GDPR, and CCPA in mind',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M2 7.5L5.5 11l6.5-7" stroke="#5b5bd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: '13px', color: '#8888aa', lineHeight: '1.5' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e2e2f0', gap: '0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#1e1a0e', border: '1px solid #3d3010', borderRadius: '6px', marginBottom: '28px' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#f59e0b" strokeWidth="1.2"/><path d="M5 3v2.5l1.5 1" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round"/></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', color: '#f59e0b' }}>IN DEVELOPMENT</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '680px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: '280px', flex: '1' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c7cf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>Security &amp; IAM</div>
                {[
                  'Role-based access control for the enterprise user base',
                  'Fine-grained permissioning to access agents and data sources',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px', marginBottom: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M2 7.5L5.5 11l6.5-7" stroke="#5b5bd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: '13px', color: '#8888aa', lineHeight: '1.5' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: '280px', flex: '1' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c7cf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>Privacy</div>
                {[
                  'Host in the cloud on Render',
                  'Host in a private VPC or on-prem to maintain complete data sovereignty',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#13131e', border: '1px solid #2a2a42', borderRadius: '8px', marginBottom: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M2 7.5L5.5 11l6.5-7" stroke="#5b5bd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: '13px', color: '#8888aa', lineHeight: '1.5' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
