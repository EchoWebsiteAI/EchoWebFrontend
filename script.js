// script.js - VERSI LENGKAP & DIPERBAIKI

document.addEventListener('DOMContentLoaded', () => {
    // --- Konfigurasi dan State Frontend ---
    const API_BASE_URL = 'https://echowebbackend-production.up.railway.app';
    let activeChatId = null; // Menyimpan ID chat yang sedang aktif di layar
    let conversationHistory = []; // Menyimpan daftar judul chat untuk sidebar

    // --- Element Selectors ---
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close-btn');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const renameAiBtn = document.getElementById('rename-ai-btn');
    const photoUploadInput = document.getElementById('photo-upload');
    const profilePic = document.querySelector('.profile-pic');
    const appNameElements = document.querySelectorAll('.app-name');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');
    const sendBtn = document.getElementById('send-btn');
    const chatHistoryContainer = document.querySelector('.chat-history');

    // --- Functions ---

    const displayMessage = (sender, text) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        chatMessagesContainer.appendChild(messageElement);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    };

    // FUNGSI KUNCI 1: Merender sidebar dan menambahkan kelas '.active' jika ID cocok
    const renderSidebarHistory = () => {
        chatHistoryContainer.innerHTML = '';
        conversationHistory.forEach(chat => {
            const listItem = document.createElement('li');
            // Menambahkan kelas 'active' jika ID chat cocok dengan chat yang sedang dibuka
            if (chat.id === activeChatId) {
                listItem.classList.add('active');
            }
            listItem.innerHTML = `
                <a href="#" data-chat-id="${chat.id}">
                    <span class="chat-title">${chat.title}</span>
                    <span class="delete-chat-btn" data-chat-id="${chat.id}">&times;</span>
                </a>`;
            chatHistoryContainer.appendChild(listItem);
        });
    };

    // FUNGSI KUNCI 2: Memuat chat dan MENGATUR activeChatId
    const loadChat = async (chatId) => {
        try {
            // Mengatur chat yang diklik sebagai chat aktif
            activeChatId = chatId;
            
            // Render ulang sidebar untuk langsung menyorot item yang diklik
            renderSidebarHistory();
            
            chatMessagesContainer.innerHTML = '<div class="message received"><p>Loading chat...</p></div>';

            const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`);
            if (!response.ok) throw new Error('Chat not found or failed to load.');

            const messages = await response.json();

            chatMessagesContainer.innerHTML = '';
            messages.forEach(message => {
                const sender = message.role === 'user' ? 'sent' : 'received';
                displayMessage(sender, message.parts[0]);
            });

        } catch (error) {
            console.error('Error loading chat:', error);
            chatMessagesContainer.innerHTML = '';
            displayMessage('received', 'Sorry, I could not load the conversation.');
        }
    };

    // FUNGSI KUNCI 3: Memulai chat baru dan MENGHAPUS activeChatId
    const startNewChat = () => {
        // Menghapus ID chat aktif karena ini adalah chat baru
        activeChatId = null;
        chatMessagesContainer.innerHTML = `
            <div class="message received">
                <p>Hello! How can I help you today?</p>
            </div>
        `;
        chatInputArea.value = '';
        // Render ulang sidebar untuk menghilangkan semua sorotan aktif
        renderSidebarHistory();
    };

    const deleteChat = async (chatIdToDelete) => {
        try {
            await fetch(`${API_BASE_URL}/api/chat/${chatIdToDelete}`, {
                method: 'DELETE'
            });

            // Jika yang dihapus adalah chat yang aktif, mulai sesi chat baru
            if (activeChatId === chatIdToDelete) {
                startNewChat();
            }
            
            // Perbarui list histori dari server setelah menghapus
            await fetchAndRenderHistory();

        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };
    
    const sendMessage = async () => {
        const messageText = chatInputArea.value.trim();
        if (!messageText) return;

        displayMessage('sent', messageText);
        chatInputArea.value = '';
        adjustTextareaHeight();
        sendBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, chat_id: activeChatId }),
            });

            if (!response.ok) throw new Error('Failed to get response from AI.');

            const data = await response.json();
            displayMessage('received', data.ai_response);
            
            const wasNewChat = activeChatId === null;
            activeChatId = data.chat_id;

            if (wasNewChat) {
                await fetchAndRenderHistory();
            } else {
                renderSidebarHistory();
            }

        } catch (error) {
            console.error('Error sending message:', error);
            displayMessage('received', 'Sorry, I encountered an error.');
        } finally {
            sendBtn.disabled = false;
        }
    };

    const adjustTextareaHeight = () => {
        chatInputArea.style.height = 'auto';
        chatInputArea.style.height = chatInputArea.scrollHeight + 'px';
    };

    const fetchAndRenderHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/history`);
            if (!response.ok) throw new Error('Failed to fetch history.');
            conversationHistory = await response.json();
            renderSidebarHistory();
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    // --- Event Listeners ---
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    });

    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = htmlElement.getAttribute('data-theme');
        htmlElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
    });

    settingsBtn.addEventListener('click', (e) => { e.preventDefault(); settingsModal.classList.add('show'); });
    closeBtn.addEventListener('click', () => settingsModal.classList.remove('show'));
    window.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('show'); });
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());
    photoUploadInput.addEventListener('change', (event) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => { profilePic.src = e.target.result; };
            reader.readAsDataURL(event.target.files[0]);
            settingsModal.classList.remove('show');
        }
    });
    renameAiBtn.addEventListener('click', () => {
        const newName = prompt("Enter the new AI name:", appNameElements[0].textContent);
        if (newName && newName.trim() !== '') {
            appNameElements.forEach(el => { el.textContent = newName.trim(); });
            document.title = newName.trim();
            settingsModal.classList.remove('show');
        }
    });
    
    newChatBtn.addEventListener('click', (e) => { e.preventDefault(); startNewChat(); });
    
    sendBtn.addEventListener('click', sendMessage);
    chatInputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); sendMessage();
        }
    });
    chatInputArea.addEventListener('input', adjustTextareaHeight);

    chatHistoryContainer.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target;

        if (target.classList.contains('delete-chat-btn')) {
            const chatIdToDelete = parseInt(target.dataset.chatId, 10);
            if (confirm('Are you sure you want to delete this chat?')) {
                deleteChat(chatIdToDelete);
            }
            return;
        }

        const link = target.closest('a');
        if (link && link.dataset.chatId) {
            const chatIdToLoad = parseInt(link.dataset.chatId, 10);
            // Hanya muat ulang jika chat yang diklik bukan chat yang sudah aktif
            if (chatIdToLoad !== activeChatId) {
                loadChat(chatIdToLoad);
            }
        }
    });
    
    // --- Inisialisasi Aplikasi ---
    const initializeApp = async () => {
        await fetchAndRenderHistory();
        startNewChat();
    };

    initializeApp();
});