async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles!inner(full_name),
      message_likes(count)
    `)
    .is('parent_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function loadReplies(parentId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles!inner(full_name),
      message_likes(count)
    `)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function sendMessage(content, parentId = null) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ content, parent_id: parentId, user_id: currentUser.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteMessage(id) {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}

async function toggleLike(messageId) {
  const { data: existing } = await supabase
    .from('message_likes')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('message_likes').delete().eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('message_likes').insert({ message_id: messageId, user_id: currentUser.id });
    if (error) throw error;
  }
}

async function hasLiked(messageId) {
  const { data } = await supabase
    .from('message_likes')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', currentUser.id)
    .maybeSingle();
  return !!data;
}

function renderChatSection(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Testimonios</h2>
    </div>
    <div class="chat-input-area">
      <textarea id="chat-input" class="input" placeholder="Dejá tu testimonio..." rows="2"></textarea>
      <button id="chat-send" class="btn-primary">Enviar</button>
    </div>
    <div id="chat-messages" class="chat-messages"></div>
  `;

  const sendBtn = container.querySelector('#chat-send');
  const input = container.querySelector('#chat-input');
  const messagesContainer = container.querySelector('#chat-messages');

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
      const likesCount = msg.message_likes?.[0]?.count || 0;
      const liked = await hasLiked(msg.id);
      const isOwner = currentUser?.id === msg.user_id;
      const isAdmin = currentProfile?.role === 'admin';

      const el = document.createElement('div');
      el.className = 'chat-message';
      el.innerHTML = `
        <div class="chat-msg-header">
          <strong>${msg.profiles?.full_name || 'Anónimo'}</strong>
          <span class="chat-time">${new Date(msg.created_at).toLocaleDateString('es')}</span>
          ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${msg.id}"><i class="ti ti-trash"></i></button>` : ''}
        </div>
        <p class="chat-content">${msg.content}</p>
        <div class="chat-actions">
          <button class="chat-like ${liked ? 'liked' : ''}" data-id="${msg.id}">
            <i class="ti ti-heart${liked ? '-filled' : ''}"></i> <span>${likesCount}</span>
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
          await renderReplies(el.querySelector('.chat-replies'), msg.id);
        } catch (err) { alert(err.message); }
      });

      await renderReplies(el.querySelector('.chat-replies'), msg.id);
    }
  } catch (err) {
    container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

async function renderReplies(container, parentId) {
  container.innerHTML = '';
  try {
    const replies = await loadReplies(parentId);
    if (replies.length === 0) return;

    for (const reply of replies) {
      const isOwner = currentUser?.id === reply.user_id;
      const isAdmin = currentProfile?.role === 'admin';
      const likesCount = reply.message_likes?.[0]?.count || 0;
      const liked = await hasLiked(reply.id);

      const el = document.createElement('div');
      el.className = 'chat-reply';
      el.innerHTML = `
        <div class="chat-msg-header">
          <strong>${reply.profiles?.full_name || 'Anónimo'}</strong>
          <span class="chat-time">${new Date(reply.created_at).toLocaleDateString('es')}</span>
          ${(isOwner || isAdmin) ? `<button class="chat-delete" data-id="${reply.id}"><i class="ti ti-trash"></i></button>` : ''}
        </div>
        <p class="chat-content">${reply.content}</p>
        <div class="chat-actions">
          <button class="chat-like ${liked ? 'liked' : ''}" data-id="${reply.id}">
            <i class="ti ti-heart${liked ? '-filled' : ''}"></i> <span>${likesCount}</span>
          </button>
        </div>
      `;
      container.appendChild(el);
    }
  } catch (err) {
    container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
