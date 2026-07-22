async function loadMessages() {
  try {
    return await apiFetch('/messages');
  } catch (err) {
    if (err.message === 'No autorizado') return [];
    throw err;
  }
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

function renderChatSection(container) {
  container.innerHTML = `
    ${currentUser ? `
    <div class="chat-input-area">
      <textarea id="chat-input" placeholder="Dejá tu testimonio..." rows="2"></textarea>
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
      } catch (err) { alert(err.message); }
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
      const safeName = escapeHtml(msg.fullName || 'Anónimo');
      const safeContent = escapeHtml(msg.content);
      const el = document.createElement('div');
      el.className = 'chat-message';
      el.innerHTML = `
        <div class="chat-msg-header">
          <strong>${safeName}</strong>
          <span class="chat-time">${new Date(msg.createdAt).toLocaleDateString('es')}</span>
          ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${msg.id}"><i class="ti ti-trash"></i></button>` : ''}
        </div>
        <p class="chat-content">${safeContent}</p>
        <div class="chat-actions">
          <button class="chat-like ${msg.userLiked ? 'liked' : ''}" data-id="${msg.id}">
            <i class="ti ti-heart${msg.userLiked ? '-filled' : ''}"></i> <span>${msg.likesCount}</span>
          </button>
          <button class="chat-reply-btn" data-id="${msg.id}">Responder</button>
        </div>
        <div class="chat-replies" id="replies-${msg.id}"></div>
        <div class="chat-reply-form" id="reply-form-${msg.id}" style="display:none;">
          <textarea class="reply-input" placeholder="Escribí tu respuesta..." rows="1"></textarea>
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
        } catch (err) { alert(err.message); }
      });
      const repliesContainer = el.querySelector('.chat-replies');
      if (msg.replies && msg.replies.length > 0) {
        for (const reply of msg.replies) {
          const rSafeName = escapeHtml(reply.fullName || 'Anónimo');
          const rSafeContent = escapeHtml(reply.content);
          const rEl = document.createElement('div');
          rEl.className = 'chat-reply';
          rEl.innerHTML = `
            <div class="chat-msg-header">
              <strong>${rSafeName}</strong>
              <span class="chat-time">${new Date(reply.createdAt).toLocaleDateString('es')}</span>
            </div>
            <p class="chat-content">${rSafeContent}</p>
            <div class="chat-actions">
              <button class="chat-like ${reply.userLiked ? 'liked' : ''}" data-id="${reply.id}">
                <i class="ti ti-heart${reply.userLiked ? '-filled' : ''}"></i> <span>${reply.likesCount}</span>
              </button>
            </div>
          `;
          repliesContainer.appendChild(rEl);
        }
      }
    }
  } catch (err) {
    container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
