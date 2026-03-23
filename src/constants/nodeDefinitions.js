export const NODE_DEFS = {
  trigger: {
    label: 'Input',
    color: '#22c55e',
    description: 'Entry point for user messages or files',
    hasTarget: false,
    hasSource: true,
    defaultData: {
      label: 'Input',
      inputType: 'user_message',
      placeholder: 'user message',
    },
  },
  llm: {
    label: 'LLM',
    color: '#6366f1',
    description: 'Language model call',
    hasTarget: true,
    hasSource: true,
    defaultData: {
      label: 'LLM',
      model: 'gemini-2.5-flash-lite',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
    },
  },
  agent: {
    label: 'Agent',
    color: '#f59e0b',
    description: 'Autonomous agent with tools',
    hasTarget: true,
    hasSource: true,
    defaultData: {
      label: 'Agent',
      systemPrompt: '',
      maxIterations: 5,
    },
  },
  tool: {
    label: 'Tool',
    color: '#0ea5e9',
    description: 'Callable function or API',
    hasTarget: false,
    hasSource: true,
    defaultData: {
      label: 'Tool',
      toolName: 'google_search',
    },
  },
  result: {
    label: 'Output',
    color: '#ef4444',
    description: 'Terminal output node',
    hasTarget: true,
    hasSource: false,
    defaultData: {
      label: 'Output',
      outputLabel: 'Result',
      format: 'text',
    },
  },
}

export const NODE_TYPE_KEYS = Object.keys(NODE_DEFS)
