function renderAdminPanel(container) {
  if (!currentProfile || currentProfile.role !== 'admin') {
    container.innerHTML = '<p class="error">No tenés permisos de administrador.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-bar">
      <div class="admin-bar-brand">
        <img src="logo-jvtd.png" alt="Juventud CBA" class="admin-bar-logo">
        <div class="admin-bar-title-wrap">
          <span class="admin-bar-title">Panel de administración</span>
          <span class="admin-bar-subtitle">Juventud CBA</span>
        </div>
      </div>
      <button id="admin-close" class="admin-bar-close" aria-label="Salir del panel de administración" title="Salir"><i class="ti ti-logout"></i> Salir</button>
    </div>
    <div class="admin-layout">
      <div id="admin-stats" class="admin-stats"></div>
      <div class="admin-col admin-col-left">
        <div class="admin-card">
          <h3><span class="admin-card-icon"><i class="ti ti-calendar-plus"></i></span> Crear evento</h3>
          <form id="admin-event-form">
            <input type="text" id="aev-title" class="input" placeholder="Título del evento" required>
            <textarea id="aev-desc" class="input" rows="2" placeholder="Descripción"></textarea>
            <div class="admin-row">
              <input type="date" id="aev-date" class="input" required>
              <input type="time" id="aev-time" class="input">
            </div>
            <div class="admin-row">
              <input type="text" id="aev-location" class="input" placeholder="Ubicación">
              <input type="number" id="aev-max" class="input" placeholder="Cupo (0 = ilimitado)" min="0">
            </div>
            <label class="admin-toggle" for="aev-visible">
              <input type="checkbox" id="aev-visible" checked>
              <span class="admin-toggle-track" aria-hidden="true"></span>
              <span class="admin-toggle-label"><i class="ti ti-eye"></i> Mostrar evento al público</span>
            </label>
            <button type="submit" class="btn-primary btn-block">Crear evento</button>
            <p id="aev-status" class="aev-status"></p>
          </form>
        </div>
        <div class="admin-card">
          <button id="btn-ver-eventos" class="btn-outline btn-block" style="padding:12px">
            <i class="ti ti-eye"></i> Ver eventos
          </button>
        </div>
      </div>
      <div class="admin-col admin-col-right">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3><span class="admin-card-icon"><i class="ti ti-photo"></i></span> Galería</h3>
            <span class="rotation-count" id="rotation-count">0 / 15</span>
          </div>
          <div class="gallery-progress" id="gallery-progress" aria-hidden="true"><span id="gallery-progress-fill"></span></div>
          <p class="admin-card-hint">Las fotos aprobadas se guardan acá. Con el botón de cada una la ponés en la landing o la sacás; nunca se borra de esta lista.</p>
          <div id="admin-gallery-list"></div>
        </div>
        <div class="admin-card">
          <h3><span class="admin-card-icon"><i class="ti ti-message"></i></span> Comentarios</h3>
          <div id="admin-messages-list"></div>
        </div>
      </div>
    </div>

    <div id="eventos-modal" class="admin-modal" style="display:none" role="dialog" aria-modal="true" aria-label="Todos los eventos">
      <div class="admin-modal-backdrop"></div>
      <div class="admin-modal-content admin-modal-wide">
        <div class="admin-modal-header">
          <h3><i class="ti ti-calendar-event"></i> Todos los eventos</h3>
          <button id="eventos-modal-close" class="btn-small btn-outline">Cerrar</button>
        </div>
        <div id="eventos-modal-list" class="admin-modal-body"></div>
      </div>
    </div>

    <div id="edit-modal" class="admin-modal" style="display:none" role="dialog" aria-modal="true" aria-label="Editar evento">
      <div class="admin-modal-backdrop"></div>
      <div class="admin-modal-content">
        <h3 id="edit-modal-title">Editar evento</h3>
        <form id="edit-event-form">
          <input type="hidden" id="eev-id">
          <input type="text" id="eev-title" class="input" placeholder="Título del evento" required>
          <textarea id="eev-desc" class="input" rows="2" placeholder="Descripción"></textarea>
          <div class="admin-row">
            <input type="date" id="eev-date" class="input" required>
            <input type="time" id="eev-time" class="input">
          </div>
          <div class="admin-row">
            <input type="text" id="eev-location" class="input" placeholder="Ubicación">
            <input type="number" id="eev-max" class="input" placeholder="Cupo (0 = ilimitado)" min="0">
          </div>
          <label class="admin-toggle" for="eev-visible">
            <input type="checkbox" id="eev-visible" checked>
            <span class="admin-toggle-track" aria-hidden="true"></span>
            <span class="admin-toggle-label"><i class="ti ti-eye"></i> Mostrar evento al público</span>
          </label>
          <div class="admin-modal-actions">
            <button type="button" id="eev-cancel" class="btn-small btn-outline">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar cambios</button>
          </div>
          <p id="eev-status" class="aev-status"></p>
        </form>
      </div>
    </div>
  `;

  const today = new Date().toISOString().split('T')[0];
  const dateInput = container.querySelector('#aev-date');
  if (dateInput) dateInput.setAttribute('min', today);

  container.querySelector('#admin-close').addEventListener('click', closeAdmin);
  container.querySelector('#btn-ver-eventos').addEventListener('click', openEventosModal);
  container.querySelector('#eventos-modal-close').addEventListener('click', () => {
    closeEventosModal();
  });
  container.querySelector('#eventos-modal .admin-modal-backdrop').addEventListener('click', () => {
    closeEventosModal();
  });

  mountCreateEventForm(container);
  loadAdminStats(container);
  renderAdminGallery(container);
  loadAdminMessages(container);

  container.querySelector('#eev-cancel').addEventListener('click', () => {
    closeEditModal();
  });
  container.querySelector('#edit-modal .admin-modal-backdrop').addEventListener('click', () => {
    closeEditModal();
  });
  mountEditEventForm(container);
}

/* ====== DASHBOARD STATS ====== */
async function loadAdminStats(container) {
  const el = container.querySelector('#admin-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="admin-stat"><div class="admin-stat-icon stat-skeleton"></div><div class="admin-stat-info"><div class="admin-stat-num-skel"></div></div></div>
    <div class="admin-stat"><div class="admin-stat-icon stat-skeleton"></div><div class="admin-stat-info"><div class="admin-stat-num-skel"></div></div></div>
    <div class="admin-stat"><div class="admin-stat-icon stat-skeleton"></div><div class="admin-stat-info"><div class="admin-stat-num-skel"></div></div></div>
    <div class="admin-stat"><div class="admin-stat-icon stat-skeleton"></div><div class="admin-stat-info"><div class="admin-stat-num-skel"></div></div></div>
  `;
  let events = [];
  let photos = [];
  let msgs = [];
  try {
    const results = await Promise.allSettled([loadAllEvents(), loadPhotos(false), loadMessages()]);
    if (results[0].status === 'fulfilled') events = results[0].value || [];
    if (results[1].status === 'fulfilled') photos = results[1].value || [];
    if (results[2].status === 'fulfilled') msgs = results[2].value || [];
  } catch (e) { /* keep empty defaults on failure */ }

  // Próximos eventos
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter(ev => new Date(ev.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextEvent = upcoming[0];
  let nextLabel = upcoming.length === 0
    ? 'Sin eventos próximos'
    : 'Próximo: ' + escapeHtml(nextEvent.title);
  if (nextEvent) {
    const d = new Date(nextEvent.date);
    const day = d.getDate();
    const month = d.toLocaleDateString('es', { month: 'short' });
    nextLabel = `<span>${escapeHtml(nextEvent.title)}</span><span class="mini-pill">${day} ${month}</span>`;
  }

  const pendingPhotos = photos.filter(p => !p.approved).length;

  el.innerHTML = `
    <div class="admin-stat" tabindex="0">
      <div class="admin-stat-icon stat-terra"><i class="ti ti-calendar-event"></i></div>
      <div class="admin-stat-info">
        <div class="admin-stat-number">${upcoming.length}</div>
        <div class="admin-stat-label">Próximos eventos</div>
        ${nextEvent ? `<div class="admin-stat-sub">${nextLabel}</div>` : '<div class="admin-stat-sub stat-warn">Sin eventos futuros</div>'}
      </div>
    </div>
    <div class="admin-stat" tabindex="0">
      <div class="admin-stat-icon stat-ambar"><i class="ti ti-photo-check"></i></div>
      <div class="admin-stat-info">
        <div class="admin-stat-number">${pendingPhotos}</div>
        <div class="admin-stat-label">Fotos por aprobar</div>
        ${pendingPhotos > 0 ? '<div class="admin-stat-sub stat-warn">Requiere tu revisión</div>' : '<div class="admin-stat-sub stat-ok">Todo al día</div>'}
      </div>
    </div>
    <div class="admin-stat" tabindex="0">
      <div class="admin-stat-icon stat-salvia"><i class="ti ti-photo"></i></div>
      <div class="admin-stat-info">
        <div class="admin-stat-number">${photos.length}</div>
        <div class="admin-stat-label">Fotos cargadas</div>
        <div class="admin-stat-sub">${photos.length - pendingPhotos} aprobadas</div>
      </div>
    </div>
    <div class="admin-stat" tabindex="0">
      <div class="admin-stat-icon stat-navy"><i class="ti ti-message-dots"></i></div>
      <div class="admin-stat-info">
        <div class="admin-stat-number">${msgs.length}</div>
        <div class="admin-stat-label">Comentarios</div>
        <div class="admin-stat-sub">Total en la comunidad</div>
      </div>
    </div>
  `;
}

function openAdminModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const firstFocusable = modal.querySelector(
    'input, button, textarea, select, a[href]'
  );
  if (firstFocusable) firstFocusable.focus();
  if (!trigger) return;
  const handler = document._adminEscapeHandler;
  if (handler) document.removeEventListener('keydown', handler);
  document._adminEscapeHandler = function (e) {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.admin-modal[style*="flex"]');
      if (openModal) closeAdminModal(openModal.id, trigger);
    }
    if (e.key === 'Tab') {
      const openModal = document.querySelector('.admin-modal[style*="flex"]');
      if (openModal) trapFocus(openModal, e);
    }
  };
  document.addEventListener('keydown', document._adminEscapeHandler);
}

function closeAdminModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'none';
  if (!document.querySelector('.admin-modal[style*="flex"]')) {
    document.body.style.overflow = '';
  }
  if (trigger && trigger.focus) trigger.focus();
}

function closeEventosModal() {
  closeAdminModal('eventos-modal', document.getElementById('btn-ver-eventos'));
}

function closeEditModal() {
  closeAdminModal('edit-modal', document.querySelector('#btn-ver-eventos'));
}

function closeAdmin() {
  const container = document.getElementById('admin-container');
  const section = document.getElementById('admin-section');
  if (container) container.innerHTML = '';
  if (section) section.style.display = 'none';
  document.body.style.overflow = '';
  const site = document.getElementById('site-content');
  if (site) site.style.display = '';
  refreshLandingEvents();
}

function refreshLandingEvents() {
  const list = document.getElementById('events-list');
  if (list && typeof loadAndRenderEvents === 'function') {
    loadAndRenderEvents(list);
  }
}

function mountCreateEventForm(container) {
  const form = container.querySelector('#admin-event-form');
  const status = container.querySelector('#aev-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('aev-title').value,
      description: document.getElementById('aev-desc').value,
      date: new Date(document.getElementById('aev-date').value).toISOString(),
      time: document.getElementById('aev-time').value,
      location: document.getElementById('aev-location').value,
      max_participants: parseInt(document.getElementById('aev-max').value) || 0,
      visible: document.getElementById('aev-visible').checked
    };
    try {
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Creando...';
      await createEvent(data);
      status.textContent = '✓ Evento creado';
      status.className = 'aev-status ok';
      form.reset();
      showToast('Evento creado', 'success');
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.className = 'aev-status err';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
      form.querySelector('button[type="submit"]').textContent = 'Crear evento';
    }
  });
}

/* ====== EVENTOS MODAL ====== */
async function openEventosModal() {
  const modal = document.getElementById('eventos-modal');
  const list = document.getElementById('eventos-modal-list');
  if (!modal || !list) return;
  openAdminModal('eventos-modal', document.getElementById('btn-ver-eventos'));
  skeletonSkeleton(list, 3, 'card');
  try {
    const events = await loadAllEvents();
    if (events.length === 0) {
      list.innerHTML = emptyState('ti-calendar-off', 'No hay eventos todavía.');
      return;
    }
    list.innerHTML = '';
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      let daysText = '';
      if (diffDays === 0) daysText = '¡Hoy!';
      else if (diffDays === 1) daysText = 'Mañana';
      else if (diffDays < 0) daysText = 'Pasó hace ' + Math.abs(diffDays) + ' días';
      else daysText = 'Faltan ' + diffDays + ' días';

      const registered = event.registrationCount || 0;
      const max = event.max_participants || 0;
      const spotsLeft = max > 0 ? max - registered : -1;
      const spotsText = max > 0
        ? (spotsLeft > 0 ? spotsLeft + ' lugares libres' : 'Completo')
        : 'Sin límite';

      const card = document.createElement('div');
      card.className = 'evento-modal-card';
      card.innerHTML = `
        <div class="evento-modal-card-left">
          <span class="evento-modal-date-badge">
            <strong>${eventDate.getDate()}</strong>
            ${eventDate.toLocaleDateString('es', { month: 'short' })}
          </span>
          <div class="evento-modal-card-info">
            <strong>${escapeHtml(event.title)}</strong>
            <span class="evento-visib ${event.visible === false ? 'hidden' : ''}">${event.visible === false ? '<i class="ti ti-eye-off"></i> Oculto' : '<i class="ti ti-eye"></i> Visible'}</span>
            <p>${event.time ? `<i class="ti ti-clock"></i>${escapeHtml(event.time)}` : ''}${event.location ? `<i class="ti ti-map-pin"></i>${escapeHtml(event.location)}` : ''}</p>
            <div class="evento-modal-stats">
              <span class="stat-days"><i class="ti ti-calendar-due"></i>${daysText}</span>
              <span class="stat-regs"><i class="ti ti-users"></i> ${registered} inscriptos</span>
              <span class="stat-spots">${spotsText}</span>
            </div>
          </div>
        </div>
        <div class="evento-modal-card-actions">
          <button class="btn-small btn-edit" data-action="edit" data-id="${event.id}"><i class="ti ti-pencil"></i> Editar</button>
          <button class="btn-small btn-danger" data-action="delete" data-id="${event.id}"><i class="ti ti-trash"></i> Eliminar</button>
        </div>
      `;
      list.appendChild(card);
      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        closeEventosModal();
        openEditModal(event);
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!(await confirmDialog(`¿Eliminar "${event.title}"?`, { confirmText: 'Eliminar', danger: true }))) return;
        try {
          await deleteEvent(event.id);
          showToast('Evento eliminado', 'success');
          openEventosModal();
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function openEditModal(event) {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;
  document.getElementById('eev-id').value = event.id;
  document.getElementById('eev-title').value = event.title;
  document.getElementById('eev-desc').value = event.description || '';
  document.getElementById('eev-date').value = new Date(event.date).toISOString().split('T')[0];
  document.getElementById('eev-time').value = event.time || '';
  document.getElementById('eev-location').value = event.location || '';
  document.getElementById('eev-max').value = event.max_participants || '';
  const visInput = document.getElementById('eev-visible');
  if (visInput) visInput.checked = event.visible !== false;
  const status = document.getElementById('eev-status');
  status.textContent = '';
  status.className = 'aev-status';
  openAdminModal('edit-modal', document.querySelector('#btn-ver-eventos'));
}

function mountEditEventForm(container) {
  const form = container.querySelector('#edit-event-form');
  const status = container.querySelector('#eev-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('eev-id').value;
    const data = {
      title: document.getElementById('eev-title').value,
      description: document.getElementById('eev-desc').value,
      date: new Date(document.getElementById('eev-date').value).toISOString(),
      time: document.getElementById('eev-time').value,
      location: document.getElementById('eev-location').value,
      max_participants: parseInt(document.getElementById('eev-max').value) || 0,
      visible: document.getElementById('eev-visible').checked
    };
    try {
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Guardando...';
      await updateEvent(id, data);
      status.textContent = '✓ Evento actualizado';
      status.className = 'aev-status ok';
      closeEditModal();
      showToast('Evento actualizado', 'success');
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.className = 'aev-status err';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
      form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
    }
  });
}

/* ====== GALERÍA DE FOTOS (aprobación + publicación, cap 15) ====== */
async function renderAdminGallery(container) {
  const grid = container.querySelector('#admin-gallery-list');
  const countEl = container.querySelector('#rotation-count');
  const progressFill = container.querySelector('#gallery-progress-fill');
  if (!grid) return;
  skeletonSkeleton(grid, 6, 'square');
  let all = [];
  try {
    all = await loadPhotos(false);
  } catch (err) {
    grid.innerHTML = emptyState('ti-alert-circle', 'Error al cargar fotos.');
    return;
  }

  const published = all.filter(p => p.approved && p.featured);
  const approvedUnpublished = all.filter(p => p.approved && !p.featured);
  const pending = all.filter(p => !p.approved);
  const byDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  const publicCount = published.length;

  if (countEl) countEl.textContent = `${publicCount} / 15`;
  if (progressFill) progressFill.style.width = `${Math.min(100, (publicCount / 15) * 100)}%`;

  grid.innerHTML = '';

  if (publicCount === 0 && approvedUnpublished.length === 0 && pending.length === 0) {
    grid.appendChild(Object.assign(document.createElement('p'), {
      className: 'rotation-empty',
      textContent: 'Todavía no hay fotos cargadas.'
    }));
    return;
  }

  const allPhotos = [...pending, ...approvedUnpublished, ...published].sort(byDate);

  const wrap = document.createElement('div');
  wrap.className = 'gallery-grid';
  grid.appendChild(wrap);

  allPhotos.forEach(photo => {
    const state = !photo.approved ? 'pending' : photo.featured ? 'published' : 'unpublished';
    const safeDesc = escapeHtml(photo.description || 'Sin descripción');
    const tile = document.createElement('div');
    tile.className = `gallery-tile gallery-tile--${state}`;
    tile.title = safeDesc;

    const overlay = state === 'pending'
      ? `<button class="gallery-act" data-action="approve" data-id="${photo.id}" aria-label="Aprobar" title="Aprobar"><i class="ti ti-check"></i></button>
         <button class="gallery-act gallery-act--danger" data-action="delete" data-id="${photo.id}" aria-label="Eliminar" title="Eliminar"><i class="ti ti-trash"></i></button>`
      : `<button class="gallery-act ${state === 'published' ? 'gallery-act--remove' : 'gallery-act--add'}" data-action="toggle" data-id="${photo.id}" aria-label="${state === 'published' ? 'Sacar de la landing' : 'Poner en la landing'}" title="${state === 'published' ? 'Sacar de la landing' : 'Poner en la landing'}"><i class="ti ${state === 'published' ? 'ti-eye-off' : 'ti-eye'}"></i></button>
         <button class="gallery-act gallery-act--danger" data-action="delete" data-id="${photo.id}" aria-label="Eliminar" title="Eliminar"><i class="ti ti-trash"></i></button>`;

    const badge = state === 'published'
      ? '<span class="gallery-badge gallery-badge--ok" title="Está en la landing"><i class="ti ti-eye"></i></span>'
      : state === 'pending'
        ? '<span class="gallery-badge gallery-badge--pending">Nueva</span>'
        : '<span class="gallery-badge gallery-badge--off" title="No está en la landing"><i class="ti ti-eye-off"></i></span>';

    tile.innerHTML = `
      <img class="gallery-tile-img" src="${photo.url}" alt="${safeDesc}" loading="lazy">
      ${badge}
      <div class="gallery-overlay">${overlay}</div>
    `;
    wrap.appendChild(tile);

    tile.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      const el = tile.querySelector('[data-action="toggle"]');
      el.disabled = true;
      try {
        if (!photo.featured && publicCount >= 15) {
          showToast('La galería está llena (15 fotos). Desactivá una antes de publicar otra.', 'error');
        } else {
          await setPhotoFeatured(photo.id, !photo.featured);
          showToast(photo.featured ? 'Foto sacada de la landing' : 'Foto puesta en la landing', 'success');
        }
      } catch (err) {
        showToast(apiErrorMessage(err), 'error');
      }
      renderAdminGallery(container);
    });

    tile.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!(await confirmDialog('¿Eliminar esta foto?', { confirmText: 'Eliminar', danger: true }))) return;
      try {
        await deletePhoto(photo.id);
        showToast('Foto eliminada', 'success');
        renderAdminGallery(container);
      } catch (err) { showToast(apiErrorMessage(err), 'error'); }
    });

    tile.querySelector('[data-action="approve"]')?.addEventListener('click', async () => {
      try {
        await approvePhoto(photo.id);
        showToast('Foto aprobada. Ya podés publicarla.', 'success');
        renderAdminGallery(container);
      } catch (err) { showToast(apiErrorMessage(err), 'error'); }
    });
  });
}

async function loadAdminMessages(container) {
  const list = container.querySelector('#admin-messages-list');
  skeletonSkeleton(list, 3, 'card');
  try {
    const msgs = await loadMessages();
    if (msgs.length === 0) {
      list.innerHTML = emptyState('ti-message', 'No hay comentarios todavía.');
      return;
    }
    const allExpanded = list.dataset.expanded === 'true';
    const items = allExpanded ? msgs : msgs.slice(0, 4);
    list.innerHTML = '';
    items.forEach(msg => {
      const safeName = escapeHtml(msg.fullName || 'Anónimo');
      const isLong = msg.content.length > 90;
      const shortContent = escapeHtml(msg.content.slice(0, 90)) + (isLong ? '…' : '');
      const fullContent = escapeHtml(msg.content);
      const initial = escapeHtml((msg.fullName || 'A').trim().charAt(0).toUpperCase());
      const timeText = formatChatDate(msg.createdAt);
      const avatarVariants = ['stat-terra', 'stat-salvia', 'stat-ambar', 'stat-navy'];
      const avatarColor = avatarVariants[(msg.fullName || '').length % avatarVariants.length];
      const card = document.createElement('div');
      card.className = 'admin-msg-card';
      card.innerHTML = `
        <div class="admin-msg-avatar ${avatarColor}" aria-hidden="true">${initial}</div>
        <div class="admin-msg-card-info">
          <div class="admin-msg-head">
            <strong>${safeName}</strong>
            <span class="admin-msg-time">${timeText}</span>
          </div>
          <p class="${isLong ? 'admin-msg-clamped' : ''}">${isLong ? shortContent : fullContent}</p>
          ${isLong ? '<button type="button" class="admin-msg-toggle">Ver más</button>' : ''}
        </div>
        <button class="btn-small btn-danger" data-id="${msg.id}"><i class="ti ti-trash"></i> Eliminar</button>
      `;
      list.appendChild(card);
      const toggle = card.querySelector('.admin-msg-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          const p = card.querySelector('.admin-msg-card-info p');
          const expanded = p.classList.contains('admin-msg-clamped') ? false : true;
          if (expanded) {
            p.textContent = shortContent;
            p.classList.add('admin-msg-clamped');
            toggle.textContent = 'Ver más';
          } else {
            p.textContent = fullContent;
            p.classList.remove('admin-msg-clamped');
            toggle.textContent = 'Ver menos';
          }
        });
      }
      card.querySelector('button[data-id]').addEventListener('click', async () => {
        if (!(await confirmDialog('¿Eliminar este comentario?', { confirmText: 'Eliminar', danger: true }))) return;
        try {
          await deleteMessage(msg.id);
          showToast('Comentario eliminado', 'success');
          loadAdminMessages(container);
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
      });
    });
    if (msgs.length > 4) {
      const btn = document.createElement('button');
      btn.className = 'admin-expand-btn';
      btn.innerHTML = allExpanded
        ? `<i class="ti ti-chevron-up"></i> Mostrar menos`
        : `<i class="ti ti-chevron-down"></i> Ver los ${msgs.length} comentarios`;
      btn.addEventListener('click', () => {
        list.dataset.expanded = allExpanded ? 'false' : 'true';
        loadAdminMessages(container);
      });
      list.appendChild(btn);
    }
  } catch (err) {
    list.innerHTML = `<p class="error">${err.message}</p>`;
  }
}
