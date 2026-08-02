const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'http://localhost:8000/api';
const WS_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.WS_BASE_URL : 'ws://localhost:8000/ws';

document.addEventListener('DOMContentLoaded', () => {
  // Read Auth User
  const storedUser = localStorage.getItem('bms_user');
  const storedToken = localStorage.getItem('bms_token');
  
  if (!storedUser || !storedToken) {
    window.location.href = 'auth.html';
    return;
  }

  const currentUser = JSON.parse(storedUser);

  const state = {
    conversations: [],
    activeConversationId: null,
    socket: null,
    isRecording: false,
    recordingTimer: 0,
    recordingInterval: null,
    callTimer: 0,
    callInterval: null
  };

  // DOM Elements
  const appContainer = document.querySelector('.chat-app-container');
  const conversationsList = document.getElementById('conversations-list');
  const messagesContainer = document.getElementById('messages-container');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const activeAvatar = document.getElementById('active-avatar');
  const activeUserName = document.getElementById('active-user-name');
  const activeUserStatus = document.getElementById('active-user-status');
  const newChatBtn = document.getElementById('new-chat-btn');
  const newGroupBtn = document.getElementById('new-group-btn');
  const mobileBackBtn = document.getElementById('mobile-back-btn');
  const chatHeaderActions = document.getElementById('chat-header-actions');
  const voiceCallBtn = document.getElementById('voice-call-btn');
  const videoCallBtn = document.getElementById('video-call-btn');

  // Input Tools & Attachments
  const attachBtn = document.getElementById('attach-btn');
  const attachMenu = document.getElementById('attach-menu');
  const optImage = document.getElementById('opt-image');
  const optFile = document.getElementById('opt-file');
  const imageFileInput = document.getElementById('image-file-input');
  const docFileInput = document.getElementById('doc-file-input');
  const emojiBtn = document.getElementById('emoji-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  const micBtn = document.getElementById('mic-btn');

  // Recording Bar
  const recordingBar = document.getElementById('recording-bar');
  const recordingTimerEl = document.getElementById('recording-timer');
  const recordingCancelBtn = document.getElementById('recording-cancel-btn');
  const recordingSendBtn = document.getElementById('recording-send-btn');

  // Group Modal
  const groupModal = document.getElementById('group-modal');
  const groupForm = document.getElementById('group-form');
  const groupModalClose = document.getElementById('group-modal-close');
  const groupModalCancel = document.getElementById('group-modal-cancel');

  // Call Overlay
  const callOverlay = document.getElementById('call-overlay');
  const callAvatar = document.getElementById('call-avatar');
  const callUserName = document.getElementById('call-user-name');
  const callStatus = document.getElementById('call-status');
  const callTimerEl = document.getElementById('call-timer');
  const callEndBtn = document.getElementById('call-end-btn');
  const callMuteBtn = document.getElementById('call-mute-btn');
  const callCamBtn = document.getElementById('call-cam-btn');

  // SVG Icons
  const groupSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const docSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const playSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  init();

  function init() {
    initWebSocket();

    newChatBtn.addEventListener('click', handleCreateNewChat);
    newGroupBtn.addEventListener('click', () => groupModal.classList.remove('hidden'));
    groupModalClose.addEventListener('click', () => groupModal.classList.add('hidden'));
    groupModalCancel.addEventListener('click', () => groupModal.classList.add('hidden'));
    groupForm.addEventListener('submit', handleCreateGroup);

    if (mobileBackBtn) {
      mobileBackBtn.addEventListener('click', () => appContainer.classList.remove('show-chat'));
    }

    messageForm.addEventListener('submit', handleSendMessage);

    attachBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      attachMenu.classList.toggle('hidden');
      emojiPicker.classList.add('hidden');
    });

    optImage.addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      imageFileInput.click();
    });

    optFile.addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      docFileInput.click();
    });

    imageFileInput.addEventListener('change', handleImageUpload);
    docFileInput.addEventListener('change', handleDocUpload);

    micBtn.addEventListener('click', startVoiceRecording);
    recordingCancelBtn.addEventListener('click', cancelVoiceRecording);
    recordingSendBtn.addEventListener('click', sendVoiceRecording);

    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPicker.classList.toggle('hidden');
      attachMenu.classList.add('hidden');
    });

    emojiPicker.querySelectorAll('span').forEach(emoji => {
      emoji.addEventListener('click', () => {
        messageInput.value += emoji.textContent;
        emojiPicker.classList.add('hidden');
        messageInput.focus();
      });
    });

    document.addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      emojiPicker.classList.add('hidden');
    });

    voiceCallBtn.addEventListener('click', () => startCall('Voice Call'));
    videoCallBtn.addEventListener('click', () => startCall('Video Call'));
    callEndBtn.addEventListener('click', endCall);

    let isMuted = false;
    callMuteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      callMuteBtn.style.opacity = isMuted ? '0.5' : '1';
    });

    let isCamOff = false;
    callCamBtn.addEventListener('click', () => {
      isCamOff = !isCamOff;
      callCamBtn.style.opacity = isCamOff ? '0.5' : '1';
    });
  }

  // Initialize Real-Time WebSocket Connection
  function initWebSocket() {
    try {
      state.socket = new WebSocket(`${WS_BASE_URL}/${currentUser.id}`);

      state.socket.onopen = () => {
        console.log('WebSocket Connected to BMS Backend');
      };

      state.socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleIncomingWSMessage(msg);
      };

      state.socket.onerror = (err) => {
        console.warn('WebSocket connection error (local fallback active):', err);
      };
    } catch (err) {
      console.warn('WebSocket initialization fallback:', err);
    }
  }

  // Handle incoming real-time WebSocket message
  function handleIncomingWSMessage(msg) {
    const chat = state.conversations.find(c => c.id === msg.chat_id);
    if (chat) {
      const formattedMsg = {
        id: msg.id || 'msg_' + Date.now(),
        type: msg.msg_type || 'text',
        sender: msg.sender_id === currentUser.id ? 'outgoing' : 'incoming',
        text: msg.text,
        imgSrc: msg.media_url,
        fileName: msg.file_name,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reaction: msg.reaction
      };
      chat.messages.push(formattedMsg);
      renderConversations();
      if (state.activeConversationId === chat.id) {
        renderActiveMessages();
      }
    }
  }

  async function handleCreateNewChat() {
    const name = prompt('Enter contact name or username:');
    if (!name || !name.trim()) return;

    const newConv = {
      id: 'conv_' + Date.now(),
      name: name.trim(),
      type: 'direct',
      messages: []
    };

    try {
      const res = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_name: name.trim(), is_group: false, participants: [currentUser.id] })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        newConv.id = data.id;
      }
    } catch (e) {
      console.warn('Local mode chat creation');
    }

    state.conversations.push(newConv);
    state.activeConversationId = newConv.id;
    renderConversations();
    renderActiveMessages();
    appContainer.classList.add('show-chat');
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    const groupName = document.getElementById('group-name-input').value.trim();
    const members = document.getElementById('group-members-input').value.trim();
    if (!groupName) return;

    const newGroup = {
      id: 'group_' + Date.now(),
      name: groupName,
      type: 'group',
      members: members,
      messages: []
    };

    try {
      const res = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_name: groupName, is_group: true, participants: [currentUser.id] })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        newGroup.id = data.id;
      }
    } catch (e) {
      console.warn('Local mode group creation');
    }

    state.conversations.push(newGroup);
    state.activeConversationId = newGroup.id;
    groupForm.reset();
    groupModal.classList.add('hidden');
    renderConversations();
    renderActiveMessages();
    appContainer.classList.add('show-chat');
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    if (!state.activeConversationId) {
      alert('Please select or create a conversation first');
      return;
    }

    const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!activeConv) return;

    const payload = {
      action: 'send_message',
      chat_id: activeConv.id,
      receiver_id: activeConv.type === 'direct' ? 'receiver_id' : null,
      text: text,
      msg_type: 'text'
    };

    // Send via WebSocket if connected
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(payload));
    } else {
      // Local state fallback
      const message = {
        id: 'msg_' + Date.now(),
        type: 'text',
        sender: 'outgoing',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: []
      };
      activeConv.messages.push(message);
      renderConversations();
      renderActiveMessages();
    }

    messageInput.value = '';
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
      if (!activeConv) return;

      const message = {
        id: 'msg_' + Date.now(),
        type: 'image',
        sender: 'outgoing',
        imgSrc: event.target.result,
        text: file.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: []
      };

      activeConv.messages.push(message);
      renderConversations();
      renderActiveMessages();
    };
    reader.readAsDataURL(file);
    imageFileInput.value = '';
  }

  function handleDocUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!activeConv) return;

    const message = {
      id: 'msg_' + Date.now(),
      type: 'file',
      sender: 'outgoing',
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: []
    };

    activeConv.messages.push(message);
    renderConversations();
    renderActiveMessages();
    docFileInput.value = '';
  }

  function startVoiceRecording() {
    if (!state.activeConversationId) {
      alert('Select a conversation to record a voice note');
      return;
    }
    state.isRecording = true;
    state.recordingTimer = 0;
    recordingBar.classList.remove('hidden');
    messageForm.classList.add('hidden');

    state.recordingInterval = setInterval(() => {
      state.recordingTimer++;
      const mins = String(Math.floor(state.recordingTimer / 60)).padStart(2, '0');
      const secs = String(state.recordingTimer % 60).padStart(2, '0');
      recordingTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function cancelVoiceRecording() {
    clearInterval(state.recordingInterval);
    state.isRecording = false;
    recordingBar.classList.add('hidden');
    messageForm.classList.remove('hidden');
  }

  function sendVoiceRecording() {
    clearInterval(state.recordingInterval);
    state.isRecording = false;
    recordingBar.classList.add('hidden');
    messageForm.classList.remove('hidden');

    const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!activeConv) return;

    const secs = String(state.recordingTimer % 60).padStart(2, '0');
    const message = {
      id: 'msg_' + Date.now(),
      type: 'audio',
      sender: 'outgoing',
      duration: `0:${secs}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: []
    };

    activeConv.messages.push(message);
    renderConversations();
    renderActiveMessages();
  }

  function startCall(callType) {
    const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!activeConv) return;

    callAvatar.innerHTML = activeConv.type === 'group' ? groupSvgIcon : activeConv.name.charAt(0).toUpperCase();
    callUserName.textContent = activeConv.name;
    callStatus.textContent = `${callType} Connected`;

    state.callTimer = 0;
    callTimerEl.textContent = '00:00';
    callOverlay.classList.remove('hidden');

    state.callInterval = setInterval(() => {
      state.callTimer++;
      const mins = String(Math.floor(state.callTimer / 60)).padStart(2, '0');
      const secs = String(state.callTimer % 60).padStart(2, '0');
      callTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function endCall() {
    clearInterval(state.callInterval);
    callOverlay.classList.add('hidden');
  }

  function renderConversations() {
    const emptyNotice = document.getElementById('empty-list-notice');
    if (state.conversations.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      conversationsList.innerHTML = '';
      if (emptyNotice) conversationsList.appendChild(emptyNotice);
      return;
    }

    conversationsList.innerHTML = '';
    state.conversations.forEach(conv => {
      const item = document.createElement('div');
      const isActive = conv.id === state.activeConversationId;
      item.className = `conv-item ${isActive ? 'active' : ''}`;
      
      const lastMsg = conv.messages.length > 0 
        ? (conv.messages[conv.messages.length - 1].text || conv.messages[conv.messages.length - 1].fileName || 'Media attachment') 
        : 'No messages yet';

      const avatarContent = conv.type === 'group' ? groupSvgIcon : conv.name.charAt(0).toUpperCase();

      item.innerHTML = `
        <div class="conv-avatar">${avatarContent}</div>
        <div class="conv-info">
          <div class="conv-name">${escapeHtml(conv.name)}</div>
          <div class="conv-last-msg">${escapeHtml(lastMsg)}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        state.activeConversationId = conv.id;
        renderConversations();
        renderActiveMessages();
        appContainer.classList.add('show-chat');
      });

      conversationsList.appendChild(item);
    });
  }

  function renderActiveMessages() {
    const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!activeConv) {
      activeAvatar.textContent = '?';
      activeUserName.textContent = 'Select a conversation';
      activeUserStatus.textContent = 'Offline';
      chatHeaderActions.style.display = 'none';
      messagesContainer.innerHTML = '<div class="empty-chat-state">Select or start a conversation to display messages</div>';
      return;
    }

    if (activeConv.type === 'group') {
      activeAvatar.innerHTML = groupSvgIcon;
    } else {
      activeAvatar.textContent = activeConv.name.charAt(0).toUpperCase();
    }

    activeUserName.textContent = activeConv.name;
    activeUserStatus.textContent = activeConv.type === 'group' ? `Group • ${activeConv.members}` : 'Online';
    chatHeaderActions.style.display = 'flex';

    if (activeConv.messages.length === 0) {
      messagesContainer.innerHTML = '<div class="empty-chat-state">No messages in this chat yet</div>';
      return;
    }

    messagesContainer.innerHTML = '';
    activeConv.messages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `msg-bubble ${msg.sender}`;

      if (msg.type === 'image') {
        bubble.innerHTML = `
          <img src="${msg.imgSrc}" alt="Attached Image" class="msg-media-img">
          <div>${escapeHtml(msg.text)}</div>
        `;
      } else if (msg.type === 'file') {
        bubble.innerHTML = `
          <div class="msg-doc-card">
            ${docSvgIcon}
            <div>
              <div>${escapeHtml(msg.fileName)}</div>
              <small style="opacity: 0.7;">${msg.fileSize}</small>
            </div>
          </div>
        `;
      } else if (msg.type === 'audio') {
        bubble.innerHTML = `
          <div class="msg-audio-card">
            <button type="button" class="audio-play-btn">${playSvgIcon}</button>
            <div class="audio-waveform"></div>
            <span>${msg.duration}</span>
          </div>
        `;
      } else {
        bubble.textContent = msg.text;
      }

      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        showReactionsMenu(bubble, msg);
      });

      if (msg.reaction) {
        const reactBadge = document.createElement('span');
        reactBadge.className = 'msg-reaction-badge';
        reactBadge.textContent = msg.reaction;
        bubble.appendChild(reactBadge);
      }

      messagesContainer.appendChild(bubble);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showReactionsMenu(bubble, msg) {
    const existing = document.querySelector('.reaction-bar');
    if (existing) existing.remove();

    const reactionBar = document.createElement('div');
    reactionBar.className = 'reaction-bar';
    reactionBar.innerHTML = `
      <span class="reaction-opt">❤️</span>
      <span class="reaction-opt">👍</span>
      <span class="reaction-opt">😂</span>
      <span class="reaction-opt">😮</span>
      <span class="reaction-opt">🔥</span>
    `;

    reactionBar.querySelectorAll('.reaction-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        msg.reaction = opt.textContent;
        reactionBar.remove();
        renderActiveMessages();
      });
    });

    bubble.appendChild(reactionBar);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
