# ChatGraph - AI Conversation Graph

ChatGraph is an interactive web application that visualizes AI conversations as connected topic nodes in a dynamic graph. It allows users to organize their AI chats into topics, create new topics from selected text, and visualize the relationships between different conversation threads.

![ChatGraph Interface](logo.png)

## Features

### 🌐 Interactive Graph Visualization
- **Dynamic Node Graph**: Visualize your conversations as interactive nodes connected by relationships
- **D3.js-powered**: Smooth, physics-based graph animations and interactions
- **Topic Relationships**: See how different conversation topics branch and connect
- **Zoom & Pan**: Navigate large conversation graphs with intuitive controls

### 💬 AI Chat Integration
- **OpenAI Integration**: Connect with GPT-3.5-turbo, GPT-4, or GPT-4-turbo
- **Context-Aware Responses**: AI maintains context within topics and understands relationships between parent topics
- **Real-time Responses**: Get AI responses with proper typing indicators

### 📝 Rich Content Support
- **Markdown Rendering**: AI responses support full GitHub-flavored markdown
- **LaTeX Mathematics**: Render mathematical equations with MathJax support
- **Syntax Highlighting**: Code blocks with automatic language detection via Prism.js

### 🗂️ Smart Topic Management
- **Create Topics from Selection**: Highlight any text and create new topics with context
- **Topic Branching**: New topics automatically link to their parent topics
- **Inline Renaming**: Click to rename topics directly in the graph
- **Context Preservation**: Selected text provides context for new topic discussions

### 📚 Session Management
- **Multiple Sessions**: Organize different projects or conversations into separate sessions
- **Session Search**: Quickly find sessions with full-text search
- **Favorites System**: Mark important sessions as favorites for quick access
- **Session Export**: Export individual topics or entire sessions

### ⚙️ Customizable Settings
- **AI Model Selection**: Choose between different OpenAI models
- **Response Tuning**: Adjust temperature, max tokens, and other parameters
- **API Key Management**: Secure local storage of your OpenAI API key
- **Resizable Interface**: Adjust chat and graph panel sizes

## Quick Start

1. **Open the Application**: Simply open `index.html` in a modern web browser
2. **Configure API Key**: Click Settings and enter your OpenAI API key
3. **Start Chatting**: Type a message and start your first conversation
4. **Create Topics**: Highlight text and create new topics, or use the "New Topic" button
5. **Explore the Graph**: Click nodes to switch between topics, drag to rearrange

## Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation
```bash
# Clone or download the repository
git clone [repository-url]

# No build process required - just open index.html in your browser
```

### Configuration
1. Open the application in your browser
2. Click the "Settings" button in the top-right corner
3. Enter your OpenAI API key
4. Optionally adjust other settings:
   - AI Model (GPT-3.5-turbo, GPT-4, GPT-4-turbo)
   - Max Response Length (100-4000 tokens)
   - Creativity/Temperature (0.0-2.0)
5. Click "Test API" to verify your connection
6. Save your settings

## Usage Guide

### Basic Chat
- Type messages in the chat input at the bottom
- Press Enter or click Send to submit
- AI responses appear with markdown formatting

### Topic Management
- **New Topic**: Click "New Topic" button to create a new conversation thread
- **Topic from Selection**: Highlight any text in a message and click "New Topic from Selection"
- **Switch Topics**: Click any node in the graph to switch to that topic
- **Rename Topics**: Right-click nodes or use inline editing

### Graph Navigation
- **Pan**: Click and drag empty space to move around
- **Zoom**: Use mouse wheel to zoom in/out
- **Reset View**: Click "Reset View" button to center the graph
- **Node Dragging**: Drag nodes to reorganize the layout

### Session Management
- **New Session**: Click the "+" shortcut in the sidebar
- **Search Sessions**: Use the search shortcut to find specific sessions
- **Favorites**: Mark sessions as favorites for quick access
- **Switch Sessions**: Click session cards in the sidebar

### Export Options
- **Export Data**: Export entire session data as JSON
- **Export Topic**: Right-click any node to export individual topics

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: D3.js for graph rendering and physics simulation
- **Markdown**: Marked.js for rich text rendering
- **Mathematics**: MathJax for LaTeX equation rendering
- **Syntax Highlighting**: Prism.js for code blocks
- **Storage**: Local Storage for data persistence
- **API**: OpenAI ChatGPT API for AI responses

### File Structure
```
chat-graph/
├── index.html          # Main application HTML
├── script.js           # Core application logic
├── styles.css          # Application styles
├── logo.png            # Application logo
└── README.md           # This file
```

### Key Components
- **ChatGraph Class**: Main application controller
- **Graph Visualization**: D3.js-based node/link visualization
- **Session Management**: Multi-session support with persistence
- **Topic System**: Hierarchical topic organization with context
- **AI Integration**: OpenAI API integration with context management

## Data Storage

All data is stored locally in your browser using Local Storage:
- **Sessions**: Complete session data including topics and messages
- **Settings**: API keys and user preferences
- **State**: Current session and topic selection

No data is sent to external servers except for AI API calls to OpenAI.

## Privacy & Security

- **Local Storage**: All conversation data stays in your browser
- **API Keys**: Stored locally, never transmitted except to OpenAI
- **No Analytics**: No tracking or analytics data collection
- **No Server**: Completely client-side application

## Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Contributing

This is a client-side application built with vanilla JavaScript. To contribute:

1. Fork the repository
2. Make your changes to `script.js`, `index.html`, or `styles.css`
3. Test in multiple browsers
4. Submit a pull request

## License

[Add your license information here]

## Support

For issues or questions:
- Check browser console for error messages
- Verify your OpenAI API key is valid
- Ensure you have sufficient API credits
- Try refreshing the page to reset the application state

## Changelog

### Latest Version
- Interactive conversation graph visualization
- Multi-session support with search and favorites
- Topic creation from text selection
- Rich markdown and LaTeX support
- Resizable interface panels
- Context-aware AI responses
- Export functionality for sessions and topics