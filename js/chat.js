async function loadMessages() {
  try {
    return await apiFetch('/messages');
  } catch (err) {
    if (err.message === 'No autorizado') return [];
    throw err;
  }
}

async function loadReplies(parentId) {
  const msgs = await loadMessages();
  const msg = msgs.find(m => m.id === parentId);
  return msg ? msg.replies : [];
}

async function sendMessage(content, parentId = null) {
  return apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify({ content, parentId })
  });
}

async function deleteMessage(id) {
  return apiFetch(`/messages?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function toggleLike(messageId) {
  return apiFetch('/likes', {
    method: 'POST',
    body: JSON.stringify({ messageId })
  });
}

async function hasLiked(messageId) {
  const msgs = await loadMessages();
  for (const m of msgs) {
    if (m.id === messageId) return m.userLiked;
    for (const r of (m.replies || [])) {
      if (r.id === messageId) return r.userLiked;
    }
  }
  return false;
}

function renderChatSection(container) {
  container.innerHTML = `
    ${currentUser ? `
    <div class="chat-input-area">
      <textarea id="chat-input" class="input" placeholder="Dejá tu testimonio..." rows="2"></textarea>
      <button id="chat-send" class="btn-primary">Enviar</button>
    </div>` : `
    <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">Iniciá sesión para dejar tu testimonio.</p>`}
    <div id="chat-messages" class="chat-messages"></div>
  `;

  const sendBtn = container.querySelector('#chat-send');
  const input = container.querySelector('#chat-input');
  const messagesContainer = container.querySelector('#chat-messages');

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const content = input.value.trim();
      if (!content) return;
      try {
        await sendMessage(content);
        input.value = '';
        await renderMessages(messagesContainer);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  renderMessages(messagesContainer);
}

async function renderMessages(container) {
  container.innerHTML = '<p class="loading">Cargando testimonios...</p>';

  try {
    const messages = await loadMessages();
    if (messages.length === 0) {
      container.innerHTML = '<p class="empty">Sé el primero en dejar un testimonio.</p>';
      return;
    }

    container.innerHTML = '';
    for (const msg of messages) {
      const isOwner = currentUser?.id === msg.userId;
      const isAdmin = currentProfile?.role === 'admin';

      const el = document.createElement('div');
      el.className = 'chat-message';
      el.innerHTML = `
        <div class="chat-msg-header">
          <strong>${msg.fullName || 'Anónimo'}</strong>
          <span class="chat-time">${new Date(msg.createdAt).toLocaleDateString('es')}</span>
          ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${msg.id}"><i class="ti ti-trash"></i></button>` : ''}
        </div>
        <p class="chat-content">${msg.content}</p>
        <div class="chat-actions">
          <button class="chat-like ${msg.userLiked ? 'liked' : ''}" data-id="${msg.id}">
            <i class="ti ti-heart${msg.userLiked ? '-filled' : ''}"></i> <span>${msg.likesCount}</span>
          </button>
          <button class="chat-reply-btn" data-id="${msg.id}">Responder</button>
        </div>
        <div class="chat-replies" id="replies-${msg.id}"></div>
        <div class="chat-reply-form" id="reply-form-${msg.id}" style="display:none;">
          <textarea class="input reply-input" placeholder="Escribí tu respuesta..." rows="1"></textarea>
          <button class="btn-small btn-primary-solid reply-send" data-parent="${msg.id}">Enviar</button>
        </div>
      `;
      container.appendChild(el);

      el.querySelector('.chat-delete')?.addEventListener('click', async () => {
        if (!confirm('¿Eliminar mensaje?')) return;
        try {
          await deleteMessage(msg.id);
          el.remove();
        } catch (err) { alert(err.message); }
      });

      el.querySelector('.chat-like').addEventListener('click', async () => {
        try {
          await toggleLike(msg.id);
          await renderMessages(container);
        } catch (err) { alert(err.message); }
      });

      el.querySelector('.chat-reply-btn').addEventListener('click', () => {
        const form = el.querySelector('.chat-reply-form');
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
      });

      el.querySelector('.reply-send').addEventListener('click', async () => {
        const replyInput = el.querySelector('.reply-input');
        const content = replyInput.value.trim();
        if (!content) return;
        try {
          await sendMessage(content, msg.id);
          replyInput.value = '';
          await renderReplies(el.querySelector('.chat-replies'), msg.replies);
        } catch (err) { alert(err.message); }
      });

      await renderReplies(el.querySelector('.chat-replies'), msg.replies);
    }
  } catch (err) {
    container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

async function renderReplies(container, replies) {
  container.innerHTML = '';
  if (!replies || replies.length === 0) return;

  for (const reply of replies) {
    const isOwner = currentUser?.id === reply.userId;
    const isAdmin = currentProfile?.role === 'admin';

    const el = document.createElement('div');
    el.className = 'chat-reply';
    el.innerHTML = `
      <div class="chat-msg-header">
        <strong>${reply.fullName || 'Anónimo'}</strong>
        <span class="chat-time">${new Date(reply.createdAt).toLocaleDateString('es')}</span>
        ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${reply.id}"><i class="ti ti-trash"></i></button>` : ''}
      </div>
      <p class="chat-content">${reply.content}</p>
      <div class="chat-actions">
        <button class="chat-like ${reply.userLiked ? 'liked' : ''}" data-id="${reply.id}">
          <i class="ti ti-heart${reply.userLiked ? '-filled' : ''}"></i> <span>${reply.likesCount}</span>
        </button>
      </div>
    `;
    container.appendChild(el);
  }
}
