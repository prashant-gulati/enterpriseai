"""
Translates a flow graph (nodes + edges) into a Google ADK agent and runs it.
Yields text chunks as they stream from the model.
"""
from typing import AsyncIterator
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search, url_context
from google.genai.types import Content, Part

BUILTIN_TOOLS = {
    "google_search": google_search,
    "url_context": url_context,
}

TOOL_LABELS = {
    "google_search": "Google Search",
    "url_context": "URL Context",
}


def _subgraph(nodes: list[dict], edges: list[dict], trigger_id: str) -> tuple[list[dict], list[dict]]:
    """Return only nodes/edges reachable from trigger_id (BFS over directed edges)."""
    node_map = {n["id"]: n for n in nodes}
    visited = set()
    queue = [trigger_id]
    while queue:
        nid = queue.pop()
        if nid in visited:
            continue
        visited.add(nid)
        # follow outgoing edges
        for e in edges:
            if e["source"] == nid and e["target"] not in visited:
                queue.append(e["target"])
        # also follow incoming edges (tool nodes connect into agent)
        for e in edges:
            if e["target"] == nid and e["source"] not in visited:
                queue.append(e["source"])
    sub_nodes = [n for n in nodes if n["id"] in visited]
    sub_edges = [e for e in edges if e["source"] in visited and e["target"] in visited]
    return sub_nodes, sub_edges


def _build_agent(nodes: list[dict], edges: list[dict], trigger_id: str | None) -> tuple[LlmAgent, str]:
    node_map = {n["id"]: n for n in nodes}

    # Find trigger
    if trigger_id:
        trigger = node_map.get(trigger_id)
    else:
        trigger = next((n for n in nodes if n["type"] == "trigger"), None)

    # Restrict to subgraph
    if trigger:
        nodes, edges = _subgraph(nodes, edges, trigger["id"])
        node_map = {n["id"]: n for n in nodes}

    input_text = (trigger["data"].get("placeholder") or "Hello") if trigger else "Hello"

    def targets_of(node_id: str) -> list[str]:
        return [e["target"] for e in edges if e["source"] == node_id]

    def sources_of(node_id: str) -> list[str]:
        return [e["source"] for e in edges if e["target"] == node_id]

    agent_nodes = [n for n in nodes if n["type"] in ("agent", "llm")]
    if not agent_nodes:
        raise ValueError("Flow must contain at least one Agent or LLM node.")

    root = None
    if trigger:
        for nid in targets_of(trigger["id"]):
            n = node_map.get(nid)
            if n and n["type"] in ("agent", "llm"):
                root = n
                break
    if root is None:
        root = agent_nodes[0]

    tool_instances = []
    for nid in sources_of(root["id"]):
        n = node_map.get(nid)
        if n and n["type"] == "tool":
            tool_key = n["data"].get("toolName", "")
            if tool_key in BUILTIN_TOOLS:
                tool_instances.append(BUILTIN_TOOLS[tool_key])

    data = root["data"]
    raw_name = data.get("label") or "agent"
    name = raw_name.strip().replace(" ", "_") or "agent"
    model = data.get("model") or "gemini-2.5-flash"
    instruction = data.get("systemPrompt") or "You are a helpful assistant."
    print(f"[runner] agent={name!r} model={model!r} tools={[t.__name__ if hasattr(t, '__name__') else str(t) for t in tool_instances]}", flush=True)
    agent = LlmAgent(
        name=name,
        model=model,
        instruction=instruction,
        tools=tool_instances,
    )
    return agent, input_text


async def run_flow(
    nodes: list[dict],
    edges: list[dict],
    user_message: str | None = None,
    trigger_id: str | None = None,
) -> AsyncIterator[str]:
    agent, default_input = _build_agent(nodes, edges, trigger_id)
    message = user_message or default_input

    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name="canvas", user_id="user")
    runner = Runner(agent=agent, app_name="canvas", session_service=session_service)
    msg = Content(role="user", parts=[Part(text=message)])

    async for event in runner.run_async(user_id="user", session_id=session.id, new_message=msg):
        if not event.content:
            continue
        parts = event.content.parts or []
        for part in parts:
            if part.text and not getattr(part, 'thought', False):
                yield part.text
