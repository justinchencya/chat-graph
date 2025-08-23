class ChatGraph {
    constructor() {
        this.sessions = new Map();
        this.currentSessionId = null;
        this.nodes = [];
        this.links = [];
        this.currentTopicId = null;
        this.messageCount = 0;
        this.settings = {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            maxTokens: 1000,
            temperature: 0.7
        };
        
        
        this.loadSettings();
        this.loadSessions();
        this.initializeGraph();
        this.initializeChat();
        this.initializeSettings();
        this.initializeShortcuts();
        this.initializeSidebar();
        this.initializeResize();
        this.initializeTextSelection();
        this.initializeSessionContextMenu();
        
        this.initializeOrCreateSession();
    }
    
    initializeGraph() {
        const svg = d3.select("#graph");
        const width = svg.node().getBoundingClientRect().width;
        const height = svg.node().getBoundingClientRect().height;
        
        svg.attr("width", width).attr("height", height);
        
        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(180))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(70));
        
        this.g = svg.append("g");
        
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                this.g.attr("transform", event.transform);
            });
        
        svg.call(zoom);
        
        document.getElementById("reset-zoom").addEventListener("click", () => {
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
            );
        });
    }
    
    initializeChat() {
        const chatInput = document.getElementById("chat-input");
        const sendButton = document.getElementById("send-message");
        const newTopicButton = document.getElementById("new-topic");
        
        sendButton.addEventListener("click", () => this.sendMessage());
        newTopicButton.addEventListener("click", () => this.createNewTopic());
        
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        document.getElementById("export-data").addEventListener("click", () => {
            this.exportData();
        });
    }
    
    initializeSettings() {
        const settingsBtn = document.getElementById("settings-btn");
        const modal = document.getElementById("settings-modal");
        const closeBtn = document.getElementById("close-settings");
        const saveBtn = document.getElementById("save-settings");
        const testBtn = document.getElementById("test-api");
        const temperatureSlider = document.getElementById("temperature");
        const temperatureValue = document.getElementById("temperature-value");
        
        settingsBtn.addEventListener("click", () => {
            this.openSettings();
        });
        
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
        
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
        
        saveBtn.addEventListener("click", () => {
            this.saveSettings();
        });
        
        testBtn.addEventListener("click", () => {
            this.testAPI();
        });
        
        temperatureSlider.addEventListener("input", (e) => {
            temperatureValue.textContent = e.target.value;
        });
    }
    
    
    initializeShortcuts() {
        const createNewShortcut = document.getElementById("create-new-shortcut");
        const searchShortcut = document.getElementById("search-session-shortcut");
        const favoritesShortcut = document.getElementById("favorites-shortcut");
        
        createNewShortcut.addEventListener("click", () => {
            this.createNewSession();
        });
        
        searchShortcut.addEventListener("click", () => {
            this.openSearchModal();
        });
        
        favoritesShortcut.addEventListener("click", () => {
            this.openFavoritesModal();
        });
        
        this.initializeSearchModal();
        this.initializeFavoritesModal();
    }
    
    initializeSidebar() {
        const sidebarToggle = document.getElementById("sidebar-toggle");
        const sidebar = document.getElementById("sidebar");
        
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }
    
    initializeResize() {
        const resizeHandle = document.querySelector(".resize-handle");
        const chatContainer = document.querySelector(".chat-container");
        let isResizing = false;
        
        resizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true;
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
        });
        
        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;
            
            const containerRect = document.querySelector(".main-content").getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;
            
            if (newWidth >= 250 && newWidth <= 600) {
                chatContainer.style.width = `${newWidth}px`;
            }
        });
        
        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        });
    }
    
    initializeTextSelection() {
        this.selectedText = '';
        this.selectionRange = null;
        
        const selectionPopup = document.getElementById("selection-popup");
        const createTopicBtn = document.getElementById("create-topic-from-selection");
        
        // Listen for text selection changes
        document.addEventListener("selectionchange", () => {
            this.handleTextSelection();
        });
        
        // Handle topic creation from selection
        createTopicBtn.addEventListener("click", () => {
            this.createTopicFromSelection();
        });
        
        // Hide popup when clicking elsewhere
        document.addEventListener("click", (e) => {
            if (!selectionPopup.contains(e.target) && !e.target.closest('.message.ai')) {
                this.hideSelectionPopup();
            }
        });
    }
    
    handleTextSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (!selectedText || selectedText.length < 3) {
            this.hideSelectionPopup();
            return;
        }
        
        // Check if selection is within an AI message
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const aiMessage = container.nodeType === Node.TEXT_NODE 
            ? container.parentElement.closest('.message.ai')
            : container.closest('.message.ai');
        
        if (!aiMessage) {
            this.hideSelectionPopup();
            return;
        }
        
        this.selectedText = selectedText;
        this.selectionRange = range;
        this.showSelectionPopup();
    }
    
    showSelectionPopup() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const popup = document.getElementById("selection-popup");
        
        // Position popup above the selection
        const popupX = rect.left + (rect.width / 2) - 90; // Center horizontally
        const popupY = rect.top - 50; // Above the selection
        
        // Keep popup within viewport bounds
        const clampedX = Math.max(10, Math.min(popupX, window.innerWidth - 190));
        const clampedY = Math.max(10, popupY);
        
        popup.style.left = `${clampedX}px`;
        popup.style.top = `${clampedY}px`;
        popup.style.display = 'block';
    }
    
    hideSelectionPopup() {
        const popup = document.getElementById("selection-popup");
        popup.style.display = 'none';
        this.selectedText = '';
        this.selectionRange = null;
    }
    
    createTopicFromSelection() {
        if (!this.selectedText) return;
        
        // Generate topic name from selected text
        let topicName = this.selectedText;
        
        // Clean up the topic name
        if (topicName.length > 50) {
            topicName = topicName.substring(0, 47) + "...";
        }
        
        // Remove excessive whitespace and line breaks
        topicName = topicName.replace(/\s+/g, ' ').trim();
        
        // Create new topic
        this.createNewTopic(topicName);
        
        // Add the selected text as the first user message in the new topic
        if (this.selectedText.length > topicName.length) {
            this.addMessage("user", `Please explain more about: "${this.selectedText}"`);
        }
        
        this.hideSelectionPopup();
        
        // Clear the selection
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }
    
    createInitialTopic() {
        if (this.nodes.length === 0) {
            this.createNewTopic("General Discussion");
        } else {
            this.currentTopicId = this.nodes[0].id;
            this.updateCurrentTopicDisplay();
        }
    }
    
    createNewTopic(topicName = null) {
        const topic = topicName || prompt("Enter topic name:") || `Topic ${this.nodes.length + 1}`;
        
        if (!topic || topic.trim() === "") return;
        
        const currentTopic = this.currentTopicId ? this.nodes.find(n => n.id === this.currentTopicId) : null;
        
        const newNode = {
            id: Date.now().toString(),
            topic: topic,
            messages: [],
            messageCount: 0,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            parentTopicId: currentTopic?.id || null,
            parentTopicName: currentTopic?.topic || null
        };
        
        this.nodes.push(newNode);
        
        if (this.currentTopicId && this.currentTopicId !== newNode.id) {
            this.links.push({
                source: this.currentTopicId,
                target: newNode.id
            });
        }
        
        this.currentTopicId = newNode.id;
        this.updateCurrentTopicDisplay();
        this.updateGraph();
        this.clearChat();
        this.saveData();
        
        this.addSystemMessage(`Started new topic: ${topic}`);
        
        if (currentTopic && currentTopic.messages.length > 0) {
            this.addNavigationMessage(currentTopic);
        }
    }
    
    sendMessage() {
        const input = document.getElementById("chat-input");
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = "";
        this.addMessage("user", message);
        
        this.simulateAIResponse(message);
    }
    
    addMessage(sender, content) {
        const currentTopic = this.nodes.find(n => n.id === this.currentTopicId);
        if (!currentTopic) return;
        
        const message = {
            id: ++this.messageCount,
            sender,
            content,
            timestamp: new Date().toISOString()
        };
        
        currentTopic.messages.push(message);
        currentTopic.messageCount++;
        
        this.displayMessage(message);
        this.updateGraph();
        this.saveData();
        
        this.scrollToBottom();
    }
    
    addSystemMessage(content) {
        const message = {
            id: ++this.messageCount,
            sender: "system",
            content,
            timestamp: new Date().toISOString()
        };
        
        this.displayMessage(message);
    }
    
    getSessionConversationHistory(maxMessages = 20) {
        if (!this.currentSessionId) return [];
        
        const allMessages = [];
        
        this.nodes.forEach(node => {
            node.messages.forEach(message => {
                if (message.sender !== 'system') {
                    allMessages.push({
                        ...message,
                        topicName: node.topic,
                        timestamp: new Date(message.timestamp).getTime()
                    });
                }
            });
        });
        
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        return allMessages.slice(-maxMessages).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }
    
    async simulateAIResponse(userMessage) {
        if (!this.settings.apiKey) {
            this.addSystemMessage("Please set your OpenAI API key in settings to use AI responses.");
            return;
        }
        
        const button = document.getElementById("send-message");
        button.disabled = true;
        button.textContent = "AI is typing...";
        
        try {
            const currentTopic = this.nodes.find(n => n.id === this.currentTopicId);
            const sessionHistory = this.getSessionConversationHistory(15);
            const currentSession = this.sessions.get(this.currentSessionId);
            
            const systemMessage = {
                role: "system",
                content: `You are a helpful AI assistant in session "${currentSession?.name || 'Unknown Session'}". The current topic is "${currentTopic?.topic || 'General Discussion'}". You have access to the conversation history across all topics in this session. Keep responses engaging and educational. When referencing previous conversations from other topics, you can mention the topic name for clarity.`
            };
            
            const messages = [
                systemMessage,
                ...sessionHistory,
                {
                    role: "user",
                    content: userMessage
                }
            ];
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.apiKey}`
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    messages: messages,
                    max_tokens: this.settings.maxTokens,
                    temperature: this.settings.temperature
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            this.addMessage("ai", aiResponse);
            
            if (Math.random() > 0.8) {
                this.suggestTopicBranch(userMessage);
            }
            
        } catch (error) {
            console.error('OpenAI API Error:', error);
            this.addSystemMessage(`Error: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = "Send";
        }
    }
    
    suggestTopicBranch(userMessage) {
        const keywords = userMessage.toLowerCase().split(" ");
        const potentialTopics = [
            "Deep Dive Analysis",
            "Related Concepts",
            "Practical Applications",
            "Historical Context",
            "Future Implications",
            "Alternative Perspectives"
        ];
        
        if (keywords.some(word => ["how", "why", "what", "explain"].includes(word))) {
            const suggestedTopic = potentialTopics[Math.floor(Math.random() * potentialTopics.length)];
            
            setTimeout(() => {
                const shouldBranch = confirm(`Would you like to explore "${suggestedTopic}" as a new topic branch?`);
                if (shouldBranch) {
                    this.createNewTopic(suggestedTopic);
                }
            }, 500);
        }
    }
    
    displayMessage(message) {
        const messagesContainer = document.getElementById("chat-messages");
        const messageEl = document.createElement("div");
        messageEl.className = `message ${message.sender}`;
        
        if (message.sender === 'ai') {
            // Configure marked for AI responses
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false,
                highlight: function(code, lang) {
                    if (Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                }
            });
            
            // Render markdown for AI messages
            messageEl.innerHTML = marked.parse(message.content);
            
            // Apply syntax highlighting after rendering
            setTimeout(() => {
                Prism.highlightAllUnder(messageEl);
            }, 10);
        } else {
            // Keep plain text for user and system messages
            messageEl.textContent = message.content;
        }
        
        messagesContainer.appendChild(messageEl);
    }
    
    addNavigationMessage(parentTopic) {
        const currentTopic = this.nodes.find(n => n.id === this.currentTopicId);
        if (!currentTopic) return;
        
        const navigationMessage = {
            id: ++this.messageCount,
            sender: "navigation",
            content: `Continue from: ${parentTopic.topic}`,
            timestamp: new Date().toISOString(),
            isNavigationLink: true,
            parentTopicId: parentTopic.id,
            parentTopicName: parentTopic.topic
        };
        
        // Add as the first message (after system message if exists)
        const systemMessageIndex = currentTopic.messages.findIndex(m => m.sender === 'system');
        if (systemMessageIndex >= 0) {
            currentTopic.messages.splice(systemMessageIndex + 1, 0, navigationMessage);
        } else {
            currentTopic.messages.unshift(navigationMessage);
        }
        
        currentTopic.messageCount++;
        this.displayNavigationMessage(navigationMessage);
        this.saveData();
    }
    
    displayNavigationMessage(message) {
        const messagesContainer = document.getElementById("chat-messages");
        const linkEl = document.createElement("div");
        linkEl.className = "message navigation-link";
        linkEl.innerHTML = `
            <span class="link-text">Continue from: </span>
            <span class="topic-link" data-topic-id="${message.parentTopicId}">${message.parentTopicName}</span>
            <span class="link-hint"> (click to go back)</span>
        `;
        
        const topicLink = linkEl.querySelector(".topic-link");
        topicLink.addEventListener("click", () => {
            this.loadTopicMessages(message.parentTopicId);
            this.updateGraph();
        });
        
        messagesContainer.appendChild(linkEl);
    }
    
    clearChat() {
        document.getElementById("chat-messages").innerHTML = "";
    }
    
    loadTopicMessages(topicId) {
        const topic = this.nodes.find(n => n.id === topicId);
        if (!topic) return;
        
        this.currentTopicId = topicId;
        this.updateCurrentTopicDisplay();
        this.clearChat();
        
        topic.messages.forEach(message => {
            if (message.isNavigationLink) {
                this.displayNavigationMessage(message);
            } else {
                this.displayMessage(message);
            }
        });
        
        this.scrollToBottom();
    }
    
    updateCurrentTopicDisplay() {
        const currentTopic = this.nodes.find(n => n.id === this.currentTopicId);
        if (currentTopic) {
            document.getElementById("current-topic").textContent = currentTopic.topic;
        }
    }
    
    getNodeEdgePoint(fromNode, toNode) {
        const nodeWidth = 120;
        const nodeHeight = 60;
        
        // Calculate direction vector from center of fromNode to center of toNode
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        
        // Avoid division by zero
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            return { x: fromNode.x, y: fromNode.y };
        }
        
        // Calculate which edge of the rectangle the line intersects
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;
        
        // Calculate intersection with rectangle edges
        let intersectionX, intersectionY;
        
        // Slope of the line
        const slope = dy / dx;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Line is more horizontal - intersect with left or right edge
            if (dx > 0) {
                // Going right - intersect with right edge
                intersectionX = fromNode.x + halfWidth;
                intersectionY = fromNode.y + slope * halfWidth;
            } else {
                // Going left - intersect with left edge
                intersectionX = fromNode.x - halfWidth;
                intersectionY = fromNode.y - slope * halfWidth;
            }
        } else {
            // Line is more vertical - intersect with top or bottom edge
            if (dy > 0) {
                // Going down - intersect with bottom edge
                intersectionY = fromNode.y + halfHeight;
                intersectionX = fromNode.x + (halfHeight / slope);
            } else {
                // Going up - intersect with top edge
                intersectionY = fromNode.y - halfHeight;
                intersectionX = fromNode.x - (halfHeight / slope);
            }
        }
        
        // Clamp to rectangle bounds
        intersectionX = Math.max(fromNode.x - halfWidth, Math.min(fromNode.x + halfWidth, intersectionX));
        intersectionY = Math.max(fromNode.y - halfHeight, Math.min(fromNode.y + halfHeight, intersectionY));
        
        return { x: intersectionX, y: intersectionY };
    }
    
    updateGraph() {
        const linkElements = this.g.selectAll(".link")
            .data(this.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);
        
        linkElements.enter()
            .append("line")
            .attr("class", "link");
        
        linkElements.exit().remove();
        
        const nodeElements = this.g.selectAll(".node")
            .data(this.nodes, d => d.id);
        
        const nodeEnter = nodeElements.enter()
            .append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) this.simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) this.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));
        
        // Create node background rectangle
        nodeEnter.append("rect")
            .attr("class", "node-bg")
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("fill", d => d.id === this.currentTopicId ? "#10a37f" : "#f7f7f8")
            .attr("stroke", d => d.id === this.currentTopicId ? "#10a37f" : "#e5e5e5")
            .attr("stroke-width", 1);
        
        // Add text with proper wrapping
        const textElements = nodeEnter.append("foreignObject")
            .attr("class", "node-text-container")
            .attr("width", 120)
            .attr("height", 60)
            .attr("x", -60)
            .attr("y", -30);
        
        textElements.append("xhtml:div")
            .attr("class", "node-text")
            .style("width", "120px")
            .style("height", "60px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("text-align", "center")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("line-height", "1.2")
            .style("padding", "4px")
            .style("color", d => d.id === this.currentTopicId ? "#ffffff" : "#374151")
            .style("word-wrap", "break-word")
            .style("overflow", "hidden")
            .text(d => d.topic);
        
        // Update rectangle sizes based on text
        nodeEnter.selectAll(".node-bg")
            .attr("width", 120)
            .attr("height", 60)
            .attr("x", -60)
            .attr("y", -30);
        
        nodeEnter.on("click", (event, d) => {
            if (event.button === 0) {
                this.loadTopicMessages(d.id);
                this.updateGraph();
            }
        })
        .on("contextmenu", (event, d) => {
            event.preventDefault();
            this.showNodeContextMenu(event, d);
        });
        
        nodeElements.exit().remove();
        
        // Update existing nodes' colors and text
        this.g.selectAll(".node-bg")
            .attr("fill", d => d.id === this.currentTopicId ? "#10a37f" : "#f7f7f8")
            .attr("stroke", d => d.id === this.currentTopicId ? "#10a37f" : "#e5e5e5");
        
        this.g.selectAll(".node-text")
            .style("color", d => d.id === this.currentTopicId ? "#ffffff" : "#374151")
            .text(d => d.topic);
        
        this.simulation
            .nodes(this.nodes)
            .on("tick", () => {
                this.g.selectAll(".link")
                    .attr("x1", d => {
                        const sourceEdge = this.getNodeEdgePoint(d.source, d.target);
                        return sourceEdge.x;
                    })
                    .attr("y1", d => {
                        const sourceEdge = this.getNodeEdgePoint(d.source, d.target);
                        return sourceEdge.y;
                    })
                    .attr("x2", d => {
                        const targetEdge = this.getNodeEdgePoint(d.target, d.source);
                        return targetEdge.x;
                    })
                    .attr("y2", d => {
                        const targetEdge = this.getNodeEdgePoint(d.target, d.source);
                        return targetEdge.y;
                    });
                
                this.g.selectAll(".node")
                    .attr("transform", d => `translate(${d.x},${d.y})`);
            });
        
        this.simulation.force("link")
            .links(this.links);
        
        this.simulation.alpha(0.3).restart();
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById("chat-messages");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    saveData() {
        const data = {
            nodes: this.nodes,
            links: this.links,
            currentTopicId: this.currentTopicId,
            messageCount: this.messageCount
        };
        localStorage.setItem("chatGraphData", JSON.stringify(data));
    }
    
    loadData() {
        const savedData = localStorage.getItem("chatGraphData");
        if (savedData) {
            const data = JSON.parse(savedData);
            this.nodes = data.nodes || [];
            this.links = data.links || [];
            this.currentTopicId = data.currentTopicId;
            this.messageCount = data.messageCount || 0;
            
            if (this.nodes.length > 0) {
                this.updateGraph();
                this.updateCurrentTopicDisplay();
                
                if (this.currentTopicId) {
                    this.loadTopicMessages(this.currentTopicId);
                }
            }
        }
    }
    
    exportData() {
        const data = {
            nodes: this.nodes,
            links: this.links,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chatgraph-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    openSettings() {
        const modal = document.getElementById("settings-modal");
        document.getElementById("openai-api-key").value = this.settings.apiKey;
        document.getElementById("ai-model").value = this.settings.model;
        document.getElementById("max-tokens").value = this.settings.maxTokens;
        document.getElementById("temperature").value = this.settings.temperature;
        document.getElementById("temperature-value").textContent = this.settings.temperature;
        
        modal.style.display = "block";
    }
    
    saveSettings() {
        this.settings = {
            apiKey: document.getElementById("openai-api-key").value.trim(),
            model: document.getElementById("ai-model").value,
            maxTokens: parseInt(document.getElementById("max-tokens").value),
            temperature: parseFloat(document.getElementById("temperature").value)
        };
        
        localStorage.setItem("chatGraphSettings", JSON.stringify(this.settings));
        document.getElementById("settings-modal").style.display = "none";
        
        this.addSystemMessage("Settings saved successfully!");
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem("chatGraphSettings");
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }
    
    async testAPI() {
        const testBtn = document.getElementById("test-api");
        const apiKey = document.getElementById("openai-api-key").value.trim();
        
        if (!apiKey) {
            alert("Please enter an API key first.");
            return;
        }
        
        testBtn.disabled = true;
        testBtn.textContent = "Testing...";
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: "Hello! This is a test message."
                        }
                    ],
                    max_tokens: 50
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }
            
            alert("API key is valid!");
            
        } catch (error) {
            alert(`API Test Failed: ${error.message}`);
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = "Test API";
        }
    }
    
    hideAllContextMenus() {
        const nodeContextMenu = document.getElementById("node-context-menu");
        const sessionContextMenu = document.getElementById("session-context-menu");
        
        nodeContextMenu.style.display = "none";
        sessionContextMenu.style.display = "none";
        
        this.selectedNode = null;
        this.selectedSessionId = null;
    }
    
    showNodeContextMenu(event, node) {
        this.hideAllContextMenus();
        
        const contextMenu = document.getElementById("node-context-menu");
        this.selectedNode = node;
        
        contextMenu.style.display = "block";
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        
        this.initializeContextMenu();
    }
    
    initializeContextMenu() {
        const contextMenu = document.getElementById("node-context-menu");
        const renameBtn = document.getElementById("rename-node");
        const deleteBtn = document.getElementById("delete-node");
        const exportBtn = document.getElementById("export-node");
        
        const hideMenu = () => {
            contextMenu.style.display = "none";
            this.selectedNode = null;
        };
        
        renameBtn.onclick = () => {
            this.renameNode(this.selectedNode);
            hideMenu();
        };
        
        deleteBtn.onclick = () => {
            this.deleteNode(this.selectedNode);
            hideMenu();
        };
        
        exportBtn.onclick = () => {
            this.exportNode(this.selectedNode);
            hideMenu();
        };
        
        document.addEventListener("click", hideMenu, { once: true });
    }
    
    renameNode(node) {
        if (!node) return;
        
        // Get the SVG container and its bounding rect
        const svg = document.getElementById("graph");
        const svgRect = svg.getBoundingClientRect();
        
        // Calculate screen coordinates from SVG coordinates
        const screenX = svgRect.left + node.x;
        const screenY = svgRect.top + node.y;
        
        // Create overlay input
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            left: ${screenX}px;
            top: ${screenY}px;
            z-index: 1000;
            transform: translate(-50%, -50%);
        `;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = node.topic;
        input.style.cssText = `
            background: white;
            border: 2px solid #10a37f;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            min-width: 150px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        overlay.appendChild(input);
        document.body.appendChild(overlay);
        
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== node.topic) {
                node.topic = newName;
                this.updateGraph();
                this.saveData();
                
                if (node.id === this.currentTopicId) {
                    this.updateCurrentTopicDisplay();
                }
            }
            document.body.removeChild(overlay);
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                document.body.removeChild(overlay);
            }
        });
        
        input.addEventListener('blur', finishRename);
    }
    
    deleteNode(node) {
        if (!node) return;
        
        // Don't allow deletion of the last node
        if (this.nodes.length === 1) {
            return;
        }
        
        const nodeIndex = this.nodes.findIndex(n => n.id === node.id);
        if (nodeIndex === -1) return;
        
        this.nodes.splice(nodeIndex, 1);
        
        this.links = this.links.filter(link => 
            link.source !== node.id && link.target !== node.id &&
            (link.source.id !== node.id) && (link.target.id !== node.id)
        );
        
        if (this.currentTopicId === node.id) {
            // Switch to another existing topic
            this.currentTopicId = this.nodes[0].id;
            this.loadTopicMessages(this.currentTopicId);
        }
        
        this.updateGraph();
        this.saveData();
    }
    
    exportNode(node) {
        if (!node) return;
        
        const nodeData = {
            topic: node.topic,
            messages: node.messages,
            messageCount: node.messageCount,
            parentTopic: node.parentTopic,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(nodeData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `topic-${node.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addSystemMessage(`Topic "${node.topic}" exported successfully.`);
    }
    
    // Modal Methods
    initializeSearchModal() {
        const modal = document.getElementById('search-sessions-modal');
        const input = document.getElementById('search-sessions-input');
        const results = document.getElementById('search-results');
        const closeBtn = document.getElementById('close-search-modal');
        
        closeBtn.addEventListener('click', () => this.closeSearchModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeSearchModal();
        });
        
        input.addEventListener('input', (e) => {
            this.searchSessions(e.target.value, results);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearchModal();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSearchResults(e.key === 'ArrowDown' ? 1 : -1, results);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectHighlightedResult(results);
            }
        });
    }
    
    initializeFavoritesModal() {
        const modal = document.getElementById('favorites-sessions-modal');
        const input = document.getElementById('favorites-sessions-input');
        const results = document.getElementById('favorites-results');
        const closeBtn = document.getElementById('close-favorites-modal');
        
        closeBtn.addEventListener('click', () => this.closeFavoritesModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeFavoritesModal();
        });
        
        input.addEventListener('input', (e) => {
            this.searchFavorites(e.target.value, results);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFavoritesModal();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSearchResults(e.key === 'ArrowDown' ? 1 : -1, results);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectHighlightedResult(results);
            }
        });
    }
    
    openSearchModal() {
        const modal = document.getElementById('search-sessions-modal');
        const input = document.getElementById('search-sessions-input');
        const results = document.getElementById('search-results');
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
            input.focus();
            this.searchSessions('', results); // Show all sessions initially
        }, 10);
    }
    
    closeSearchModal() {
        const modal = document.getElementById('search-sessions-modal');
        const input = document.getElementById('search-sessions-input');
        
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            input.value = '';
        }, 300);
    }
    
    openFavoritesModal() {
        const modal = document.getElementById('favorites-sessions-modal');
        const input = document.getElementById('favorites-sessions-input');
        const results = document.getElementById('favorites-results');
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
            input.focus();
            this.searchFavorites('', results); // Show all favorites initially
        }, 10);
    }
    
    closeFavoritesModal() {
        const modal = document.getElementById('favorites-sessions-modal');
        const input = document.getElementById('favorites-sessions-input');
        
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            input.value = '';
        }, 300);
    }
    
    searchSessions(searchTerm, resultsContainer) {
        const term = searchTerm.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        
        let matchedSessions = [];
        
        this.sessions.forEach((session, sessionId) => {
            const sessionName = session.name.toLowerCase();
            if (!term || sessionName.includes(term)) {
                matchedSessions.push({ session, sessionId });
            }
        });
        
        if (matchedSessions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                </svg>
                <div class="search-no-results-text">No sessions found</div>
            `;
            resultsContainer.appendChild(noResults);
            return;
        }
        
        matchedSessions.forEach(({ session, sessionId }) => {
            const item = this.createSearchResultItem(session, sessionId);
            resultsContainer.appendChild(item);
        });
    }
    
    searchFavorites(searchTerm, resultsContainer) {
        const term = searchTerm.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        
        let matchedFavorites = [];
        
        this.sessions.forEach((session, sessionId) => {
            const sessionName = session.name.toLowerCase();
            
            if (session.isFavorite && (!term || sessionName.includes(term))) {
                matchedFavorites.push({ session, sessionId });
            }
        });
        
        if (matchedFavorites.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
                </svg>
                <div class="search-no-results-text">
                    ${term ? 'No matching favorites found' : 'No favorite sessions yet'}<br>
                    ${!term ? '<small style="color: #9ca3af; font-size: 0.8rem;">Right-click any session to add it to favorites</small>' : ''}
                </div>
            `;
            resultsContainer.appendChild(noResults);
            return;
        }
        
        matchedFavorites.forEach(({ session, sessionId }) => {
            const item = this.createSearchResultItem(session, sessionId);
            resultsContainer.appendChild(item);
        });
    }
    
    createSearchResultItem(session, sessionId) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.sessionId = sessionId;
        
        const createdDate = new Date(session.createdAt).toLocaleDateString();
        const topicCount = session.nodes ? session.nodes.length : 0;
        
        item.innerHTML = `
            <div class="search-result-name">
                ${session.isFavorite ? '<span class="favorite-star">⭐</span>' : ''}
                ${session.name}
            </div>
            <div class="search-result-info">
                <span>${topicCount} topics</span>
                <span>${createdDate}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.switchToSession(sessionId);
            this.closeSearchModal();
            this.closeFavoritesModal();
        });
        
        return item;
    }
    
    navigateSearchResults(direction, resultsContainer) {
        const items = resultsContainer.querySelectorAll('.search-result-item');
        if (items.length === 0) return;
        
        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('highlighted')) {
                currentIndex = index;
                item.classList.remove('highlighted');
            }
        });
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        items[newIndex].classList.add('highlighted');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }
    
    selectHighlightedResult(resultsContainer) {
        const highlighted = resultsContainer.querySelector('.search-result-item.highlighted');
        if (highlighted) {
            highlighted.click();
        } else {
            const firstItem = resultsContainer.querySelector('.search-result-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    }
    
    // Session Management Methods
    initializeOrCreateSession() {
        if (this.sessions.size === 0) {
            this.createNewSession("New Session");
        } else {
            const lastSessionId = localStorage.getItem("chatGraphLastSession");
            if (lastSessionId && this.sessions.has(lastSessionId)) {
                this.switchToSession(lastSessionId);
            } else {
                const firstSession = this.sessions.keys().next().value;
                this.switchToSession(firstSession);
            }
        }
    }
    
    createNewSession(sessionName = null) {
        const name = sessionName || `Session ${this.sessions.size + 1}`;
        
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            name: name.trim(),
            nodes: [],
            links: [],
            currentTopicId: null,
            messageCount: 0,
            createdAt: new Date().toISOString(),
            isFavorite: false
        };
        
        this.sessions.set(sessionId, session);
        this.saveSessions();
        this.updateSessionCards();
        
        this.switchToSession(sessionId);
        this.createInitialTopic();
        
        // If this was a user-initiated new session (not default), trigger rename
        if (!sessionName) {
            setTimeout(() => {
                this.renameSession(sessionId);
            }, 100);
        }
    }
    
    switchToSession(sessionId) {
        if (!this.sessions.has(sessionId)) return;
        
        if (this.currentSessionId) {
            this.saveCurrentSessionData();
        }
        
        const session = this.sessions.get(sessionId);
        this.currentSessionId = sessionId;
        this.nodes = [...session.nodes];
        this.links = [...session.links];
        this.currentTopicId = session.currentTopicId;
        this.messageCount = session.messageCount;
        
        localStorage.setItem("chatGraphLastSession", sessionId);
        
        this.updateGraph();
        this.updateSessionCards();
        
        if (this.nodes.length > 0 && this.currentTopicId) {
            this.loadTopicMessages(this.currentTopicId);
        } else {
            this.clearChat();
        }
    }
    
    saveCurrentSessionData() {
        if (!this.currentSessionId) return;
        
        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.nodes = [...this.nodes];
            session.links = [...this.links];
            session.currentTopicId = this.currentTopicId;
            session.messageCount = this.messageCount;
            this.saveSessions();
        }
    }
    
    renameSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        // Find the session card and its name element
        const sessionCard = document.querySelector(`[data-session-id="${sessionId}"]`);
        const nameElement = sessionCard.querySelector('.session-card-name');
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = session.name;
        input.className = 'session-rename-input';
        input.style.cssText = 'background: transparent; border: 1px solid #10a37f; border-radius: 4px; padding: 2px 4px; font-weight: 600; font-size: 0.95rem; width: 100%;';
        
        // Replace name with input
        const originalText = nameElement.textContent;
        nameElement.innerHTML = '';
        nameElement.appendChild(input);
        
        // Focus and select text
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== originalText) {
                session.name = newName;
                this.saveSessions();
                this.updateSessionCards();
            } else {
                nameElement.textContent = originalText;
            }
        };
        
        // Handle enter key and blur
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                nameElement.textContent = originalText;
            }
        });
        
        input.addEventListener('blur', finishRename);
    }
    
    deleteSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        this.sessions.delete(sessionId);
        this.saveSessions();
        
        // If this was the only session, create a new default session
        if (this.sessions.size === 0) {
            this.createNewSession("New Session");
            return;
        }
        
        if (sessionId === this.currentSessionId) {
            const remainingSessions = Array.from(this.sessions.keys());
            if (remainingSessions.length > 0) {
                this.switchToSession(remainingSessions[0]);
            }
        } else {
            this.updateSessionCards();
        }
    }
    
    toggleSessionFavorite(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.isFavorite = !session.isFavorite;
        this.saveSessions();
        this.updateSessionCards();
    }
    
    updateSessionCards() {
        const container = document.getElementById("session-cards");
        container.innerHTML = "";
        
        this.sessions.forEach((session, sessionId) => {
            const card = document.createElement("div");
            card.className = `session-card ${sessionId === this.currentSessionId ? 'active' : ''}`;
            card.dataset.sessionId = sessionId;
            
            const createdDate = new Date(session.createdAt).toLocaleDateString();
            const topicCount = session.nodes ? session.nodes.length : 0;
            
            card.innerHTML = `
                <div class="session-card-header">
                    <div class="session-card-name">
                        ${session.isFavorite ? '<span class="favorite-star">⭐</span>' : ''}
                        ${session.name}
                    </div>
                </div>
                <div class="session-card-info">
                    <span>${topicCount} topics</span>
                    <span>${createdDate}</span>
                </div>
            `;
            
            card.addEventListener("click", (e) => {
                this.switchToSession(sessionId);
            });
            
            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                this.showSessionContextMenu(e, sessionId);
            });
            
            container.appendChild(card);
        });
    }
    
    showSessionContextMenu(event, sessionId) {
        this.hideAllContextMenus();
        
        const contextMenu = document.getElementById("session-context-menu");
        const favoriteBtn = document.getElementById("toggle-favorite");
        const session = this.sessions.get(sessionId);
        
        this.selectedSessionId = sessionId;
        
        // Update favorite button text
        favoriteBtn.textContent = session?.isFavorite ? "Remove from Favorites" : "Add to Favorites";
        
        contextMenu.style.display = "block";
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        
        // Set up one-time click listener to hide menu
        setTimeout(() => {
            document.addEventListener("click", () => {
                contextMenu.style.display = "none";
                this.selectedSessionId = null;
            }, { once: true });
        }, 10);
    }
    
    initializeSessionContextMenu() {
        const contextMenu = document.getElementById("session-context-menu");
        const renameBtn = document.getElementById("rename-session");
        const favoriteBtn = document.getElementById("toggle-favorite");
        const deleteBtn = document.getElementById("delete-session");
        
        const hideMenu = () => {
            contextMenu.style.display = "none";
            this.selectedSessionId = null;
        };
        
        renameBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.renameSession(this.selectedSessionId);
            hideMenu();
        });
        
        favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleSessionFavorite(this.selectedSessionId);
            hideMenu();
        });
        
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deleteSession(this.selectedSessionId);
            hideMenu();
        });
    }
    
    loadSessions() {
        const savedSessions = localStorage.getItem("chatGraphSessions");
        if (savedSessions) {
            const sessionsData = JSON.parse(savedSessions);
            this.sessions = new Map(Object.entries(sessionsData));
        }
    }
    
    saveSessions() {
        const sessionsData = Object.fromEntries(this.sessions);
        localStorage.setItem("chatGraphSessions", JSON.stringify(sessionsData));
    }
    
    saveData() {
        this.saveCurrentSessionData();
    }
    
    loadData() {
        // Data loading now handled by session management
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ChatGraph();
});