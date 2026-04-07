# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build process or dependencies to install. Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
open http://localhost:8080
```

## Architecture

ChatGraph is a zero-dependency, single-page web app that visualizes AI conversations as a D3.js force-directed graph. All state lives in browser LocalStorage — no server, no build step.

**Files:**
- [index.html](index.html) — DOM skeleton, modals, SVG graph container, CDN library imports (D3, Marked, Prism, MathJax)
- [script.js](script.js) — Entire application logic (~1,700 lines) as a single `ChatGraph` class, instantiated once as `window.chatGraph`
- [styles.css](styles.css) — All styling

**Libraries loaded via CDN** (no npm):
- D3.js v7 — force-directed graph physics and SVG rendering
- Marked.js — GitHub-flavored markdown in AI responses
- Prism.js — code syntax highlighting
- MathJax 3 — LaTeX math rendering

## Key Concepts

**Sessions** — top-level containers; stored in LocalStorage under `"chatGraphSessions"` as a serialized Map. Each session holds `nodes` (topics) and `links` (connections between topics).

**Topics (Nodes)** — each topic is a chat thread. Properties: `id`, `topic` (name), `messages[]`, `x/y` (graph position), `parentTopicId`, `contextText` (selected text that spawned this topic).

**Branching** — when a user selects text and creates a subtopic, the selected text is stored in `node.contextText` and injected into the OpenAI system prompt so the AI understands the context. The last 3 messages from the parent topic are also passed as context.

**AI calls** — direct `fetch()` to the OpenAI REST API using the key stored in settings. Model, temperature, and max tokens are user-configurable. Conversation history sent is capped at the last 10 messages.

## Data Flow

1. **Startup**: `DOMContentLoaded` → `new ChatGraph()` → load settings + sessions from LocalStorage → initialize D3 simulation → restore last active session/topic
2. **Send message**: user input → `addMessage("user")` → `simulateAIResponse()` → OpenAI API → `addMessage("ai")` → markdown/LaTeX/Prism render → auto-save to LocalStorage
3. **New topic**: create node → add D3 link to parent → switch active topic → `updateGraph()` re-runs force simulation → save
4. **Graph render**: `updateGraph()` → D3 data join → force simulation ticks → SVG node/link positions updated
