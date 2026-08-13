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

function formatChatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

function renderChatSection(container) {
  container.innerHTML = `
    ${currentUser ? `
    <div class="chat-input-area">
      <textarea id="chat-input" placeholder="Dejá tu testimonio..." rows="2"></textarea>
      <button id="chat-send" class="btn-primary">Enviar</button>
    </div>` : `
    <p class="chat-login-hint">Iniciá sesión para dejar tu testimonio.</p>`}
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
        showToast('Testimonio publicado', 'success');
      } catch (err) { showToast(apiErrorMessage(err), 'error'); }
    });
  }

  renderMessages(messagesContainer);
}

async function renderMessages(container) {
  skeletonSkeleton(container, 3, 'card');
  try {
    const messages = await loadMessages();
    if (messages.length === 0) {
      container.innerHTML = emptyState('ti-message-heart', 'Sé el primero en dejar un testimonio.');
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
          <span class="chat-time">${formatChatDate(msg.createdAt)}</span>
          ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${msg.id}" aria-label="Eliminar mensaje"><i class="ti ti-trash"></i></button>` : ''}
        </div>
        <p class="chat-content">${safeContent}</p>
        <div class="chat-actions">
          <button class="chat-like ${msg.userLiked ? 'liked' : ''}" data-id="${msg.id}" aria-label="Me gusta">
            <i class="ti ti-heart${msg.userLiked ? '-filled' : ''}"></i> <span>${msg.likesCount}</span>
          </button>
          ${currentUser ? `<button class="chat-reply-btn" data-id="${msg.id}">Responder</button>` : ''}
        </div>
        <div class="chat-replies" id="replies-${msg.id}"></div>
        ${currentUser ? `
        <div class="chat-reply-form" id="reply-form-${msg.id}" style="display:none;">
          <textarea class="reply-input" placeholder="Escribí tu respuesta..." rows="1"></textarea>
          <button class="btn-small btn-primary-solid reply-send" data-parent="${msg.id}">Enviar</button>
        </div>` : ''}
      `;
      container.appendChild(el);
      el.querySelector('.chat-delete')?.addEventListener('click', async () => {
        if (!(await confirmDialog('¿Eliminar este mensaje?', { confirmText: 'Eliminar', danger: true }))) return;
        try {
          await deleteMessage(msg.id);
          el.remove();
          showToast('Mensaje eliminado', 'success');
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
      });
      el.querySelector('.chat-like').addEventListener('click', async () => {
        if (!currentUser) {
          openAuthModal();
          return;
        }
        const btn = el.querySelector('.chat-like');
        const count = btn.querySelector('span');
        const wasLiked = btn.classList.contains('liked');
        try {
          const res = await toggleLike(msg.id);
          const isLiked = res && typeof res.liked === 'boolean' ? res.liked : !wasLiked;
          if (res && typeof res.likesCount === 'number') {
            count.textContent = res.likesCount;
          } else {
            count.textContent = Math.max(0, parseInt(count.textContent || '0', 10) + (isLiked === wasLiked ? 0 : (isLiked ? 1 : -1)));
          }
          btn.classList.toggle('liked', isLiked);
          btn.querySelector('i').className = `ti ti-heart${isLiked ? '-filled' : ''}`;
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
      });
      el.querySelector('.chat-reply-btn')?.addEventListener('click', () => {
        const form = el.querySelector('.chat-reply-form');
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
      });
      el.querySelector('.reply-send')?.addEventListener('click', async () => {
        const replyInput = el.querySelector('.reply-input');
        const content = replyInput.value.trim();
        if (!content) return;
        try {
          await sendMessage(content, msg.id);
          replyInput.value = '';
          await renderMessages(container);
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
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
              <span class="chat-time">${formatChatDate(reply.createdAt)}</span>
            </div>
            <p class="chat-content">${rSafeContent}</p>
            <div class="chat-actions">
              <button class="chat-like ${reply.userLiked ? 'liked' : ''}" data-id="${reply.id}" aria-label="Me gusta">
                <i class="ti ti-heart${reply.userLiked ? '-filled' : ''}"></i> <span>${reply.likesCount}</span>
              </button>
            </div>
          `;
          rEl.querySelector('.chat-like').addEventListener('click', async () => {
            if (!currentUser) {
              openAuthModal();
              return;
            }
            const btn = rEl.querySelector('.chat-like');
            const count = btn.querySelector('span');
            const wasLiked = btn.classList.contains('liked');
            try {
              const res = await toggleLike(reply.id);
              const isLiked = res && typeof res.liked === 'boolean' ? res.liked : !wasLiked;
              if (res && typeof res.likesCount === 'number') {
                count.textContent = res.likesCount;
              } else {
                count.textContent = Math.max(0, parseInt(count.textContent || '0', 10) + (isLiked === wasLiked ? 0 : (isLiked ? 1 : -1)));
              }
              btn.classList.toggle('liked', isLiked);
              btn.querySelector('i').className = `ti ti-heart${isLiked ? '-filled' : ''}`;
            } catch (err) { showToast(apiErrorMessage(err), 'error'); }
          });
          repliesContainer.appendChild(rEl);
        }
      }
    }
  } catch (err) {
    container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
