# North — Enterprise AI Agent Platform

North is a visual platform for building, deploying, and managing AI agents across your enterprise. Design multi-step agent workflows in a drag-and-drop canvas, connect to your business tools, and run production-grade AI pipelines — all within your own infrastructure.

---

## Features

### Visual Agent Builder
Design agent workflows visually using a node-based canvas powered by React Flow. Connect LLMs, tools, retrievers, and logic blocks without writing boilerplate.

### Built-in Agent Templates
Get started quickly with pre-configured agents for common enterprise use cases:

- **Finance** — Quarterly financial summaries, revenue analysis, budgeting, invoice processing, spend classification, and forecasting
- **Legal** — Contract review, clause extraction, compliance risk flagging, and due diligence
- **HR** — Onboarding workflows, policy lookup, benefits Q&A, and candidate screening (with Google Drive/Gmail integration)

### GenAI Content Creation
- Generate tables, charts, and documents from natural language
- Summarize long-form content
- Transform structured data into visualizations

### RAG (Retrieval-Augmented Generation)
Connect agents to your knowledge base — upload files, link Google Drive or Notion, and power domain-specific Q&A.

### MCP & A2A Integration
Built for the modern agent ecosystem: supports Model Context Protocol (MCP) for tool connectivity and Agent-to-Agent (A2A) coordination for multi-agent pipelines.

---

## Enterprise-Ready

- **Private** — Deploy within your VPC or on-premises for complete data sovereignty
- **Secure** — Built-in Admin control panel and zero-trust security architecture
- **Compliant** — Full data traceability and audit-ready logs; designed with SOC 2, ISO 27001, ISO/IEC 42001, GDPR, and CCPA in mind

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Flow (`@xyflow/react`), Zustand |
| Backend | Python, FastAPI (uvicorn) |
| RAG backend | Python, FastAPI (uvicorn) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt

# RAG backend
cd rag-backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
```

### Run locally

```bash
# Run all services together
npm run dev:all

# Or run frontend only
npm run dev
```

The frontend runs on `http://localhost:5173`. The agent backend runs on port `8000`, and the RAG backend on port `8001`.

---

## Roadmap

- [ ] Agent creation UI (name, prompt, tools, model)
- [ ] Flowise-style drag-and-drop agent composition
- [ ] Certification pathway: SOC 2 Type II → ISO 27001 → ISO/IEC 42001
- [ ] Expanded data source connectors (Google Drive, Notion, file upload)

---

## Architecture Notes

**Core building blocks:**
- Agent logic & tool integration
- LLM integrations and routing
- Knowledge search & retrieval
- Conversation memory
- Workflow orchestration
- Observability & evals
- Dev and production tooling

**Engineering priorities:** Reliability, observability, deployment readiness → Prompts → Evals/Context engineering → Security/RBAC for agents

---

## License

Private / proprietary. Contact for licensing information.
