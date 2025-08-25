// Application State
let state = {
    activeTab: 'image',
    // Image Generation State
    isGeneratingImage: false,
    currentImage: null,
    currentPrompt: '',
    imageHistory: [],
    // Chat State
    isSendingMessage: false,
    chatHistory: [],
    chatMessageIdCounter: 0
};

// Suggested prompts for image generation
const suggestedPrompts = [
    "View from a Bangalore flyover at night, headlights and taillights streaking below, distant city towers faintly glowing in haze, realistic cinematic tone",
    "green dress anime girl warrior perfect beuty",
    "wall art for men using a lion with scripture ",
    "Sunset over the ocean",
    "Japanese female high school student walking in Shibuya"
];

// Suggested questions for chat
const suggestedQuestions = [
    "What can you help me with?",
    "Tell me a joke",
    "How does AI work?",
    "What's the weather like?",
    "Write a short poem"
];

// DOM Element References
let elements = {};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadImageHistory();
    renderSuggestedPrompts();
    renderChatSuggestions();
    setupEventListeners();
    switchTab('image'); // Default to image tab
});

// Initialize DOM element references
function initializeElements() {
    // Tab elements
    elements.tabButtons = document.querySelectorAll('.tab-btn, .nav-link[data-tab]');
    elements.imageSection = document.getElementById('imageSection');
    elements.chatSection = document.getElementById('chatSection');

    // Image Generation Elements
    elements.promptInput = document.getElementById('promptInput');
    elements.generateBtn = document.getElementById('generateBtn');
    elements.directLinkBtn = document.getElementById('directLinkBtn');
    elements.currentImageCard = document.getElementById('currentImageCard');
    elements.currentImage = document.getElementById('currentImage');
    elements.currentPromptDisplay = document.getElementById('currentPrompt');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.historyCard = document.getElementById('historyCard');
    elements.historyGrid = document.getElementById('historyGrid');
    elements.suggestedPromptsContainer = document.getElementById('suggestedPrompts');

    // Chat Elements
    elements.chatInput = document.getElementById('chatInput');
    elements.sendBtn = document.getElementById('sendBtn');
    elements.clearChatBtn = document.getElementById('clearChatBtn');
    elements.chatMessages = document.getElementById('chatMessages');
    elements.emptyChatState = document.getElementById('emptyChatState');
    elements.suggestedQuestions = document.getElementById('suggestedQuestions');
    elements.chatSuggestionsContainer = document.getElementById('chatSuggestions');

    // Toast container
    elements.toastContainer = document.getElementById('toastContainer');
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab switching
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Image Generation Events
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', generateImage);
    }

    if (elements.promptInput) {
        elements.promptInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !state.isGeneratingImage) {
                generateImage();
            }
        });

        // Update direct link button visibility
        elements.promptInput.addEventListener('input', function() {
            if (elements.directLinkBtn) {
                if (this.value.trim() && !state.isGeneratingImage) {
                    elements.directLinkBtn.classList.remove('hidden');
                } else {
                    elements.directLinkBtn.classList.add('hidden');
                }
            }
        });
    }

    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', function() {
            if (state.currentImage) {
                downloadImage(state.currentImage, state.currentPrompt);
            }
        });
    }

    // Direct link button
    if (elements.directLinkBtn) {
        elements.directLinkBtn.addEventListener('click', function() {
            const prompt = elements.promptInput.value.trim();
            if (prompt) {
                const directUrl = `https://subash-baniya.com.np/api/imagine?prompt=${encodeURIComponent(prompt)}`;
                window.open(directUrl, '_blank');
                showToast('Direct link opened in new tab!');
            }
        });
    }

    // Chat Events
    if (elements.sendBtn) {
        elements.sendBtn.addEventListener('click', sendMessage);
    }

    if (elements.chatInput) {
        elements.chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !state.isSendingMessage) {
                sendMessage();
            }
        });
    }

    if (elements.clearChatBtn) {
        elements.clearChatBtn.addEventListener('click', clearChat);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to generate or send
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (state.activeTab === 'image' && !state.isGeneratingImage) {
                generateImage();
            } else if (state.activeTab === 'chat' && !state.isSendingMessage) {
                sendMessage();
            }
        }

        // Escape to clear input
        if (e.key === 'Escape') {
            if (state.activeTab === 'image' && elements.promptInput) {
                elements.promptInput.value = '';
                elements.promptInput.focus();
            } else if (state.activeTab === 'chat' && elements.chatInput) {
                elements.chatInput.value = '';
                elements.chatInput.focus();
            }
        }

        // Tab switching with number keys
        if (e.key === '1') {
            switchTab('image');
        } else if (e.key === '2') {
            switchTab('chat');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Handle image loading errors
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            e.target.style.display = 'none';
            showToast('Failed to load image', 'error');
        }
    }, true);
}

// Tab Switching
function switchTab(tabName) {
    state.activeTab = tabName;

    // Update tab buttons
    elements.tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Update content visibility
    if (tabName === 'image') {
        elements.imageSection.classList.add('active');
        elements.chatSection.classList.remove('active');
        if (elements.promptInput) {
            elements.promptInput.focus();
        }
    } else if (tabName === 'chat') {
        elements.chatSection.classList.add('active');
        elements.imageSection.classList.remove('active');
        if (elements.chatInput) {
            elements.chatInput.focus();
        }
    }
}

// Render suggested prompts for image generation
function renderSuggestedPrompts() {
    if (!elements.suggestedPromptsContainer) return;

    elements.suggestedPromptsContainer.innerHTML = '';

    suggestedPrompts.forEach(prompt => {
        const button = document.createElement('button');
        button.className = 'suggestion-btn';
        button.textContent = prompt;
        button.addEventListener('click', () => {
            if (elements.promptInput) {
                elements.promptInput.value = prompt;
                elements.promptInput.focus();
                // Trigger input event to show direct link button
                elements.promptInput.dispatchEvent(new Event('input'));
            }
        });
        elements.suggestedPromptsContainer.appendChild(button);
    });
}

// Render suggested questions for chat
function renderChatSuggestions() {
    if (!elements.chatSuggestionsContainer) return;

    elements.chatSuggestionsContainer.innerHTML = '';

    suggestedQuestions.forEach(question => {
        const button = document.createElement('button');
        button.className = 'chat-suggestion-btn';
        button.textContent = question;
        button.addEventListener('click', () => {
            if (elements.chatInput) {
                elements.chatInput.value = question;
                elements.chatInput.focus();
            }
        });
        elements.chatSuggestionsContainer.appendChild(button);
    });
}

// Toast notification system
function showToast(message, type = 'success') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' 
        ? `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polyline points="20,6 9,17 4,12"/>
           </svg>`
        : `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="15" y1="9" x2="9" y2="15"/>
             <line x1="9" y1="9" x2="15" y2="15"/>
           </svg>`;

    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span class="toast-message">${message}</span>
        </div>
    `;

    elements.toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Image Generation Functions
async function generateImage() {
    if (!elements.promptInput) return;

    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        showToast('Please enter a prompt', 'error');
        return;
    }

    setImageGeneratingState(true);

    try {
        // Try multiple methods to handle CORS issues
        let imageUrl = null;

        // Method 1: Direct API call
        try {
            const apiUrl = `/api/imagine?prompt=${encodeURIComponent(prompt)}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            imageUrl = URL.createObjectURL(blob);
        } catch (directError) {
            console.log('Direct API call failed, trying CORS proxy...', directError);

            // Method 2: CORS proxy
            try {
                const proxyUrl = `/api/imagine?prompt=${encodeURIComponent(prompt)}`;
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    throw new Error(`Proxy error! status: ${response.status}`);
                }

                const blob = await response.blob();
                imageUrl = URL.createObjectURL(blob);
            } catch (proxyError) {
                console.log('CORS proxy failed, trying alternative proxy...', proxyError);

                // Method 3: Alternative CORS proxy
                try {
                    const altProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`/api/imagine?prompt=${encodeURIComponent(prompt)}`)}`;
                    const response = await fetch(altProxyUrl);

                    if (!response.ok) {
                        throw new Error(`Alternative proxy error! status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    imageUrl = URL.createObjectURL(blob);
                } catch (altProxyError) {
                    console.log('Alternative proxy failed, trying final method...', altProxyError);

                    // Method 4: Open in new window as fallback
                    const directUrl = `/api/imagine?prompt=${encodeURIComponent(prompt)}`;

                    showToast(
                        'CORS restriction detected. Opening image in new tab. You can right-click and save the image from there.',
                        'error'
                    );

                    window.open(directUrl, '_blank');

                    // Create a placeholder for the current session
                    imageUrl = createPlaceholderImage(prompt);

                    if (imageUrl) {
                        state.currentImage = imageUrl;
                        state.currentPrompt = prompt;

                        // Add to history
                        addToImageHistory(prompt, imageUrl);

                        // Update UI
                        displayCurrentImage();
                        renderImageHistory();

                        showToast('Placeholder created! Check the new tab for your actual image.');
                    }

                    return; // Exit early since we handled this case specially
                }
            }
        }

        if (imageUrl) {
            state.currentImage = imageUrl;
            state.currentPrompt = prompt;

            // Add to history
            addToImageHistory(prompt, imageUrl);

            // Update UI
            displayCurrentImage();
            renderImageHistory();

            showToast('Image generated successfully!');
        }

    } catch (error) {
        console.error('Error generating image:', error);

        // Provide more specific error messages
        if (error.message.includes('CORS')) {
            showToast('CORS restriction: Please try opening the image URL directly in a new tab', 'error');
        } else if (error.message.includes('Failed to fetch')) {
            showToast('Network error: Please check your internet connection and try again', 'error');
        } else if (error.message.includes('404')) {
            showToast('API endpoint not found. Please check if the service is available', 'error');
        } else if (error.message.includes('500')) {
            showToast('Server error: The image generation service is temporarily unavailable', 'error');
        } else {
            showToast('Failed to generate image. Please try again or contact support.', 'error');
        }
    } finally {
        setImageGeneratingState(false);
    }
}

// Create placeholder image using canvas
function createPlaceholderImage(prompt) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Generated!', 256, 200);
    ctx.font = '16px Arial';
    ctx.fillText('Check the new tab to view', 256, 240);
    ctx.fillText('your generated image', 256, 260);
    ctx.fillText(`Prompt: "${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}"`, 256, 320);

    return canvas.toDataURL();
}

// Add image to history
function addToImageHistory(prompt, imageUrl) {
    const newImage = {
        id: Date.now().toString(),
        prompt: prompt,
        imageUrl: imageUrl,
        timestamp: new Date()
    };

    state.imageHistory.unshift(newImage);
    state.imageHistory = state.imageHistory.slice(0, 10); // Keep last 10 images

    // Save to localStorage
    saveImageHistory();
}

// Set image generating state
function setImageGeneratingState(isGenerating) {
    state.isGeneratingImage = isGenerating;

    if (!elements.generateBtn) return;

    const btnText = elements.generateBtn.querySelector('.btn-text');
    const spinner = elements.generateBtn.querySelector('.loading-spinner');

    if (btnText && spinner) {
        if (isGenerating) {
            btnText.textContent = 'Generating...';
            spinner.classList.remove('hidden');
            elements.generateBtn.disabled = true;
            if (elements.promptInput) elements.promptInput.disabled = true;
            if (elements.directLinkBtn) elements.directLinkBtn.classList.add('hidden');

            // Disable suggestion buttons
            document.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.disabled = true;
            });
        } else {
            btnText.textContent = 'Generate';
            spinner.classList.add('hidden');
            elements.generateBtn.disabled = false;
            if (elements.promptInput) {
                elements.promptInput.disabled = false;
                // Trigger input event to potentially show direct link button
                elements.promptInput.dispatchEvent(new Event('input'));
            }

            // Enable suggestion buttons
            document.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.disabled = false;
            });
        }
    }
}

// Display current generated image
function displayCurrentImage() {
    if (state.currentImage && state.currentPrompt && elements.currentImage && elements.currentPromptDisplay && elements.currentImageCard) {
        elements.currentImage.src = state.currentImage;
        elements.currentImage.alt = `Generated image: ${state.currentPrompt}`;
        elements.currentPromptDisplay.textContent = state.currentPrompt;
        elements.currentImageCard.classList.remove('hidden');
    }
}

// Download image function
async function downloadImage(imageUrl, prompt) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-image-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Image downloaded!');
    } catch (error) {
        showToast('Failed to download image', 'error');
    }
}

// Global functions for onclick handlers
window.copyPrompt = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Prompt copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy prompt', 'error');
    });
};

window.deleteFromHistory = function(id) {
    state.imageHistory = state.imageHistory.filter(img => img.id !== id);
    saveImageHistory();
    renderImageHistory();
    showToast('Image removed from history');
};

window.downloadImage = downloadImage;

// Render image history
function renderImageHistory() {
    if (!elements.historyGrid) return;

    if (state.imageHistory.length === 0) {
        if (elements.historyCard) elements.historyCard.classList.add('hidden');
        return;
    }

    if (elements.historyCard) elements.historyCard.classList.remove('hidden');
    elements.historyGrid.innerHTML = '';

    state.imageHistory.forEach(image => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        historyItem.innerHTML = `
            <div class="history-image-container">
                <img src="${image.imageUrl}" alt="Generated: ${image.prompt}" class="history-image">
                <div class="history-overlay">
                    <button class="history-btn" onclick="downloadImage('${image.imageUrl}', '${image.prompt}')" title="Download">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="history-btn" onclick="copyPrompt('${image.prompt.replace(/'/g, "\\'")}')" title="Copy prompt">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="history-btn" onclick="deleteFromHistory('${image.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="history-info">
                <p class="history-prompt" title="${image.prompt}">${image.prompt}</p>
                <p class="history-timestamp">${image.timestamp.toLocaleString()}</p>
            </div>
        `;

        elements.historyGrid.appendChild(historyItem);
    });
}

// Save image history to localStorage
function saveImageHistory() {
    try {
        // Save metadata for display purposes in this session
        const historyMetadata = state.imageHistory.map(img => ({
            id: img.id,
            prompt: img.prompt,
            timestamp: img.timestamp,
            imageUrl: img.imageUrl.startsWith('data:') ? img.imageUrl : null // Only save data URLs
        }));
        localStorage.setItem('aiHubImageHistory', JSON.stringify(historyMetadata));
    } catch (error) {
        console.warn('Failed to save history to localStorage:', error);
    }
}

// Load image history from localStorage
function loadImageHistory() {
    try {
        const saved = localStorage.getItem('aiHubImageHistory');
        if (saved) {
            const historyMetadata = JSON.parse(saved);
            // Only restore items with data URLs (placeholders)
            state.imageHistory = historyMetadata.filter(item => item.imageUrl).map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
        }
    } catch (error) {
        console.warn('Failed to load history from localStorage:', error);
        state.imageHistory = [];
    }
}

// Chat Functions
async function sendMessage() {
    if (!elements.chatInput) return;

    const message = elements.chatInput.value.trim();

    if (!message) {
        showToast('Please enter a message', 'error');
        return;
    }

    const userMessage = {
        id: ++state.chatMessageIdCounter,
        role: 'user',
        content: message,
        timestamp: new Date()
    };

    state.chatHistory.push(userMessage);
    const currentMessage = message;
    elements.chatInput.value = '';
    setChatSendingState(true);
    updateChatDisplay();

    try {
        // Try multiple methods to handle CORS issues
        let response = null;

        // Method 1: Direct API call
        try {
            const apiUrl = `/api/chat?prompt=${encodeURIComponent(currentMessage)}`;
            response = await fetch(apiUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (directError) {
            console.log('Direct API call failed, trying CORS proxy...', directError);

            // Method 2: CORS proxy
            try {
                const proxyUrl = `/api/chat?prompt=${encodeURIComponent(currentMessage)}`;
                response = await fetch(proxyUrl);

                if (!response.ok) {
                    throw new Error(`Proxy error! status: ${response.status}`);
                }
            } catch (proxyError) {
                console.log('CORS proxy failed, trying alternative proxy...', proxyError);

                // Method 3: Alternative CORS proxy
                try {
                    const altProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`/api/chat?prompt=${encodeURIComponent(currentMessage)}`)}`;
                    const altResponse = await fetch(altProxyUrl);

                    if (!altResponse.ok) {
                        throw new Error(`Alternative proxy error! status: ${altResponse.status}`);
                    }

                    const altData = await altResponse.json();
                    response = {
                        ok: true,
                        json: async () => JSON.parse(altData.contents)
                    };
                } catch (altProxyError) {
                    console.log('Alternative proxy failed...', altProxyError);
                    throw new Error('All methods failed');
                }
            }
        }

        if (response && response.ok) {
            const data = await response.json();

            if (data.choices && data.choices[0] && data.choices[0].message) {
                const assistantMessage = {
                    id: ++state.chatMessageIdCounter,
                    role: 'assistant',
                    content: data.choices[0].message.content,
                    timestamp: new Date()
                };

                state.chatHistory.push(assistantMessage);
                updateChatDisplay();
                showToast('Message sent successfully!');
            } else {
                throw new Error('Invalid response format');
            }
        }

    } catch (error) {
        console.error('Error sending message:', error);

        // Add error message to chat
        const errorMessage = {
            id: ++state.chatMessageIdCounter,
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your message. Please try again or check if the service is available.',
            timestamp: new Date()
        };

        state.chatHistory.push(errorMessage);
        updateChatDisplay();

        // Provide specific error messages
        if (error.message.includes('CORS')) {
            showToast('CORS restriction: Unable to connect to chat service', 'error');
        } else if (error.message.includes('Failed to fetch')) {
            showToast('Network error: Please check your internet connection', 'error');
        } else if (error.message.includes('404')) {
            showToast('Chat service not found. Please check if the service is available', 'error');
        } else if (error.message.includes('500')) {
            showToast('Server error: The chat service is temporarily unavailable', 'error');
        } else {
            showToast('Failed to send message. Please try again.', 'error');
        }
    } finally {
        setChatSendingState(false);
    }
}

// Set chat sending state
function setChatSendingState(isSending) {
    state.isSendingMessage = isSending;

    if (!elements.sendBtn) return;

    const sendIcon = elements.sendBtn.querySelector('.send-icon');
    const spinner = elements.sendBtn.querySelector('.chat-loading-spinner');

    if (sendIcon && spinner) {
        if (isSending) {
            sendIcon.classList.add('hidden');
            spinner.classList.remove('hidden');
            elements.sendBtn.disabled = true;
            if (elements.chatInput) elements.chatInput.disabled = true;

            // Disable chat suggestion buttons
            document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
                btn.disabled = true;
            });
        } else {
            sendIcon.classList.remove('hidden');
            spinner.classList.add('hidden');
            elements.sendBtn.disabled = false;
            if (elements.chatInput) elements.chatInput.disabled = false;

            // Enable chat suggestion buttons
            document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
                btn.disabled = false;
            });
        }
    }
}

    // Update chat display
    function updateChatDisplay() {
        if (!elements.chatMessages || !elements.emptyChatState) return;

        const { chatMessages, emptyChatState, clearChatBtn, suggestedQuestions } = elements;
        const { chatHistory } = state;

        // Empty chat state
        if (chatHistory.length === 0) {
            emptyChatState.style.display = "flex";
            if (clearChatBtn) clearChatBtn.classList.add("hidden");
            if (suggestedQuestions) suggestedQuestions.classList.remove("hidden");

            chatMessages.innerHTML = "";
            chatMessages.appendChild(emptyChatState);
            return;
        }

        // Populated chat state
        emptyChatState.style.display = "none";
        if (clearChatBtn) clearChatBtn.classList.remove("hidden");
        if (suggestedQuestions) suggestedQuestions.classList.add("hidden");

        chatMessages.innerHTML = "";

        chatHistory.forEach(({ role, content, timestamp }) => {
            const messageEl = document.createElement("div");
            messageEl.className = `chat-message ${role}`;

            const avatarIcon =
                role === "user"
                    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                         <circle cx="12" cy="7" r="4"/>
                       </svg>`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="M12 8V4H8"/>
                         <rect width="16" height="12" x="4" y="8" rx="2"/>
                         <path d="M2 14h2"/>
                         <path d="M20 14h2"/>
                         <path d="M15 13v2"/>
                         <path d="M9 13v2"/>
                       </svg>`;

            // Escape quotes safely for inline copy button
            const safeContent = content.replace(/'/g, "\\'");

            messageEl.innerHTML = `
                <div class="chat-message-content">
                    <div class="chat-avatar ${role}">${avatarIcon}</div>
                    <div class="chat-message-wrapper">
                        <div class="chat-bubble ${role}">${content}</div>
                        <div class="chat-message-meta">
                            <span>${new Date(timestamp).toLocaleTimeString()}</span>
                            <button class="copy-message-btn" onclick="copyMessage('${safeContent}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            chatMessages.appendChild(messageEl);
        });
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Global function for copy message
window.copyMessage = function(content) {
    navigator.clipboard.writeText(content).then(() => {
        showToast('Message copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy message', 'error');
    });
};

// Clear chat
function clearChat() {
    state.chatHistory = [];
    state.chatMessageIdCounter = 0;
    updateChatDisplay();
    showToast('Chat cleared!');
}

// Auto-focus inputs on page load
window.addEventListener('load', function() {
    if (state.activeTab === 'image' && elements.promptInput) {
        elements.promptInput.focus();
    } else if (state.activeTab === 'chat' && elements.chatInput) {
        elements.chatInput.focus();
    }
});

// Handle window resize for responsive design
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Any resize-specific logic can go here
    }, 250);
});