# ChatGraph

![ChatGraph logo](logo.svg)

**Map your thinking with AI.**

ChatGraph is a local-first web app for exploring AI conversations as a graph of connected topics. Instead of keeping one long linear chat, you can branch into new topics, keep context from earlier messages, and move through the conversation visually.

## What It Does

- Visualizes conversation topics as draggable D3 graph nodes
- Lets you branch a new topic from selected text
- Keeps parent-topic context when you continue a thread
- Supports Markdown, code highlighting, and LaTeX in AI responses
- Organizes work into searchable sessions with favorites
- Exports full graph data or individual topics as JSON
- Stores sessions, messages, and settings locally in your browser

## Quick Start

1. Open `index.html` in a modern browser.
2. Click `Settings`.
3. Add your OpenAI API key.
4. Start a conversation.
5. Use `New Topic` or highlight text in a message to branch the discussion.

No build step or server is required.

## Files

```text
chat-graph/
├── index.html    # App markup
├── script.js     # App behavior and graph logic
├── styles.css    # Visual design
├── logo.svg      # Current app logo
├── logo.png      # Legacy logo asset
└── README.md
```

## Tech Stack

- Vanilla HTML, CSS, and JavaScript
- D3.js for graph rendering
- Marked.js for Markdown
- Prism.js for syntax highlighting
- MathJax for LaTeX
- Browser Local Storage for persistence
- OpenAI chat completions API for responses

## Privacy

ChatGraph runs entirely in the browser. Conversation data, sessions, and your API key are stored locally. The only external calls are the AI requests sent to OpenAI when you send a message.

## Browser Support

Use a current version of Chrome, Safari, Firefox, or Edge.
