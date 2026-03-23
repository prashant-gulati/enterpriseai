export const AGENT_FLOWS = [
  {
    id: 'finance',
    label: 'Finance Agent',
    description: 'Market analysis & reporting',
    color: '#10b981',
    nodes: [
      {
        id: 'f-trigger',
        type: 'trigger',
        position: { x: 80, y: 180 },
        data: { label: 'Redhat 2019 Results', description: 'Annual results PDF', inputType: 'file', fileName: 'Redhat_2019.pdf', filePath: 'pdfs/finance/Redhat_2019.pdf' },
      },
      {
        id: 'f-llm',
        type: 'llm',
        position: { x: 320, y: 180 },
        data: { label: 'Financial Analyst', description: 'Analyses data and drafts insights', model: 'gemini-2.5-flash-lite', temperature: 0.7, systemPrompt: 'You are a senior financial analyst. Use the provided market data to deliver concise, actionable insights. Provide a summary of less than 500 words of the performance across the year' },
      },
      {
        id: 'f-result',
        type: 'result',
        position: { x: 560, y: 180 },
        data: { label: 'Financial Summary < 500 words', description: 'Formatted financial summary' },
      },
    ],
    edges: [
      { id: 'fe1', source: 'f-trigger', sourceHandle: 'out', target: 'f-llm', targetHandle: 'in', animated: true, type: 'smoothstep' },
      { id: 'fe2', source: 'f-llm', sourceHandle: 'out', target: 'f-result', targetHandle: 'in', animated: true, type: 'smoothstep' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal Agent',
    description: 'Contract review & analysis',
    color: '#f59e0b',
    subFlows: [
      {
        id: 'legal-force-majeure',
        label: 'Force Majeure',
        nodes: [
          {
            id: 'l-trigger',
            type: 'trigger',
            position: { x: 80, y: 180 },
            data: { label: 'Salesforce Merger', description: 'Merger agreement PDF', inputType: 'file', fileName: 'Salesforce_Merger.pdf', filePath: 'pdfs/legal/Salesforce_Merger.pdf' },
          },
          {
            id: 'l-llm',
            type: 'llm',
            position: { x: 320, y: 180 },
            data: { label: 'Legal Reviewer', description: 'Identifies force majeure provisions', model: 'gemini-2.5-flash-lite', temperature: 0.7, systemPrompt: 'You are an expert contract attorney. Review the given document to identify any clauses that identify force majeure provisions. Summarize in < 500 words' },
          },
          {
            id: 'l-result',
            type: 'result',
            position: { x: 560, y: 180 },
            data: { label: 'Force Majeure clauses', description: 'Force majeure provisions summary' },
          },
        ],
        edges: [
          { id: 'le1', source: 'l-trigger', sourceHandle: 'out', target: 'l-llm', targetHandle: 'in', animated: true, type: 'smoothstep' },
          { id: 'le2', source: 'l-llm', sourceHandle: 'out', target: 'l-result', targetHandle: 'in', animated: true, type: 'smoothstep' },
        ],
      },
      {
        id: 'legal-compliance',
        label: 'Compliance Risks',
        nodes: [
          {
            id: 'lc-trigger',
            type: 'trigger',
            position: { x: 80, y: 180 },
            data: { label: 'Salesforce Merger', description: 'Merger agreement PDF', inputType: 'file', fileName: 'Salesforce_Merger.pdf', filePath: 'pdfs/legal/Salesforce_Merger.pdf' },
          },
          {
            id: 'lc-llm',
            type: 'llm',
            position: { x: 320, y: 180 },
            data: { label: 'Compliance Reviewer', description: 'Flags compliance risks', model: 'gemini-2.5-flash-lite', temperature: 0.7, systemPrompt: 'You are an expert contract attorney. Review the given document to flag any compliance risks. Summarize in < 500 words' },
          },
          {
            id: 'lc-result',
            type: 'result',
            position: { x: 560, y: 180 },
            data: { label: 'Compliance risks', description: 'Compliance risk summary' },
          },
        ],
        edges: [
          { id: 'lce1', source: 'lc-trigger', sourceHandle: 'out', target: 'lc-llm', targetHandle: 'in', animated: true, type: 'smoothstep' },
          { id: 'lce2', source: 'lc-llm', sourceHandle: 'out', target: 'lc-result', targetHandle: 'in', animated: true, type: 'smoothstep' },
        ],
      },
    ],
  },
  {
    id: 'hr',
    label: 'HR Agent',
    description: 'Candidate screening',
    color: '#8b5cf6',
    nodes: [
      {
        id: 'h-trigger',
        type: 'trigger',
        position: { x: 80, y: 220 },
        data: { label: 'Candidate CV', description: 'Candidate resume PDF', inputType: 'file', fileName: '', filePath: '', fileFolder: 'pdfs/hr' },
      },
      {
        id: 'h-tool-search',
        type: 'tool',
        position: { x: 300, y: 100 },
        data: { label: 'Google Search', toolName: 'google_search' },
      },
      {
        id: 'h-tool-url',
        type: 'tool',
        position: { x: 300, y: 220 },
        data: { label: 'URL Context', toolName: 'url_context' },
      },
      {
        id: 'h-agent',
        type: 'agent',
        position: { x: 520, y: 220 },
        data: { label: 'HR Screener', systemPrompt: 'You are an experienced HR business partner. Look through the provided PDF to identify the candidate\n\nthen use the google search tool to identify social media profiles for the user on linkedin and \nthen use the URL context tool to look through those profiles and identify any information that doesn\'t match well with the resume and flag it. Summarize what you found in < 300 words\n', maxIterations: 5 },
      },
      {
        id: 'h-result',
        type: 'result',
        position: { x: 740, y: 220 },
        data: { label: 'Candidate screening', description: 'Screening summary and flags' },
      },
    ],
    edges: [
      { id: 'he1', source: 'h-trigger', sourceHandle: 'out', target: 'h-agent', targetHandle: 'in', animated: true, type: 'smoothstep' },
      { id: 'he2', source: 'h-tool-search', sourceHandle: 'out', target: 'h-agent', targetHandle: 'in', animated: true, type: 'smoothstep' },
      { id: 'he3', source: 'h-tool-url', sourceHandle: 'out', target: 'h-agent', targetHandle: 'in', animated: true, type: 'smoothstep' },
      { id: 'he4', source: 'h-agent', sourceHandle: 'out', target: 'h-result', targetHandle: 'in', animated: true, type: 'smoothstep' },
    ],
  },
]
