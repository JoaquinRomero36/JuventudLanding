function renderAdminPanel(container) {
  if (!currentProfile || currentProfile.role !== 'admin') {
    container.innerHTML = '<p class="error">No tenés permisos de administrador.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-bar">
      <img src="logo-jvtd.png" alt="Juventud CBA" class="admin-bar-logo">
      <span class="admin-bar-title">Administración</span>
      <button id="admin-close" class="admin-bar-close"><i class="ti ti-x"></i> Cerrar</button>
    </div>
    <div class="admin-layout">
      <div class="admin-col admin-col-left">
        <div class="admin-card">
          <h3><i class="ti ti-calendar-plus"></i> Crear evento</h3>
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
            <h3><i class="ti ti-photo"></i> Fotos</h3>
            <div class="admin-tabs" id="photo-tabs">
              <button class="admin-tab active" data-tab="pending">Pendientes</button>
              <button class="admin-tab" data-tab="all">Todas</button>
            </div>
          </div>
          <div id="admin-photos-list"></div>
        </div>
        <div class="admin-card">
          <h3><i class="ti ti-message"></i> Comentarios</h3>
          <div id="admin-messages-list"></div>
        </div>
      </div>
    </div>

    <div id="eventos-modal" class="admin-modal" style="display:none">
      <div class="admin-modal-backdrop"></div>
      <div class="admin-modal-content admin-modal-wide">
        <div class="admin-modal-header">
          <h3><i class="ti ti-calendar-event"></i> Todos los eventos</h3>
          <button id="eventos-modal-close" class="btn-small btn-outline">Cerrar</button>
        </div>
        <div id="eventos-modal-list" class="admin-modal-body"></div>
      </div>
    </div>

    <div id="edit-modal" class="admin-modal" style="display:none">
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
    container.querySelector('#eventos-modal').style.display = 'none';
  });
  container.querySelector('#eventos-modal .admin-modal-backdrop').addEventListener('click', () => {
    container.querySelector('#eventos-modal').style.display = 'none';
  });

  mountCreateEventForm(container);
  loadAdminPhotos(container, 'pending');
  loadAdminMessages(container);

  const photoTabs = container.querySelectorAll('#photo-tabs .admin-tab');
  photoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      photoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadAdminPhotos(container, tab.dataset.tab);
    });
  });

  container.querySelector('#eev-cancel').addEventListener('click', () => {
    container.querySelector('#edit-modal').style.display = 'none';
  });
  container.querySelector('#edit-modal .admin-modal-backdrop').addEventListener('click', () => {
    container.querySelector('#edit-modal').style.display = 'none';
  });
  mountEditEventForm(container);
}

function closeAdmin() {
  const container = document.getElementById('admin-container');
  const section = document.getElementById('admin-section');
  if (container) container.innerHTML = '';
  if (section) section.style.display = 'none';
  const site = document.getElementById('site-content');
  if (site) site.style.display = '';
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
      max_participants: parseInt(document.getElementById('aev-max').value) || 0
    };
    try {
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Creando...';
      await createEvent(data);
      status.textContent = '✓ Evento creado';
      status.className = 'aev-status ok';
      form.reset();
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
  modal.style.display = 'flex';
  list.innerHTML = '<p class="loading">Cargando...</p>';
  try {
    const events = await loadEvents();
    if (events.length === 0) {
      list.innerHTML = '<p class="empty">No hay eventos.</p>';
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
            <p>${event.time ? escapeHtml(event.time) + ' · ' : ''}${event.location ? escapeHtml(event.location) : ''}</p>
            <div class="evento-modal-stats">
              <span class="stat-days">${daysText}</span>
              <span class="stat-regs"><i class="ti ti-users"></i> ${registered} inscriptos</span>
              <span class="stat-spots">${spotsText}</span>
            </div>
          </div>
        </div>
        <div class="evento-modal-card-actions">
          <button class="btn-small btn-outline" data-action="edit" data-id="${event.id}">Editar</button>
          <button class="btn-small btn-danger" data-action="delete" data-id="${event.id}">Eliminar</button>
        </div>
      `;
      list.appendChild(card);
      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        modal.style.display = 'none';
        openEditModal(event);
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar "${event.title}"?`)) return;
        try {
          await deleteEvent(event.id);
          openEventosModal();
        } catch (err) { alert(err.message); }
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
  modal.style.display = 'flex';
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
      max_participants: parseInt(document.getElementById('eev-max').value) || 0
    };
    try {
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Guardando...';
      await updateEvent(id, data);
      status.textContent = '✓ Evento actualizado';
      status.className = 'aev-status ok';
      container.querySelector('#edit-modal').style.display = 'none';
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.className = 'aev-status err';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
      form.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
    }
  });
}

async function loadAdminPhotos(container, tab) {
  const list = container.querySelector('#admin-photos-list');
  list.innerHTML = '<p class="loading">Cargando...</p>';
  try {
    const all = await loadPhotos(false);
    const showPending = tab === 'pending';
    const photos = showPending ? all.filter(p => !p.approved) : all;
    if (photos.length === 0) {
      list.innerHTML = `<p class="empty">${showPending ? 'No hay fotos pendientes.' : 'No hay fotos.'}</p>`;
      return;
    }
    const allExpanded = list.dataset.expanded === 'true';
    const items = allExpanded ? photos : photos.slice(0, 4);
    list.innerHTML = '';
    items.forEach(photo => {
      const safeDesc = escapeHtml(photo.description || 'Sin descripción');
      const statusClass = photo.approved ? 'photo-status-ok' : 'photo-status-pending';
      const statusText = photo.approved ? 'Aprobada' : 'Pendiente';
      const card = document.createElement('div');
      card.className = 'admin-photo-card';
      card.innerHTML = `
        <img src="${photo.url}" alt="" loading="lazy">
        <div class="admin-photo-card-info">
          <p>${safeDesc}</p>
          <span class="${statusClass}">${statusText}</span>
        </div>
        <div class="admin-photo-card-actions">
          ${!photo.approved ? `<button class="btn-small btn-approve" data-action="approve" data-id="${photo.id}">Aprobar</button>` : ''}
          <button class="btn-small btn-danger" data-action="delete" data-id="${photo.id}">Eliminar</button>
        </div>
      `;
      list.appendChild(card);
      card.querySelector('[data-action="approve"]')?.addEventListener('click', async () => {
        try {
          await approvePhoto(photo.id);
          loadAdminPhotos(container, tab);
        } catch (err) { alert(err.message); }
      });
      card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta foto?')) return;
        try {
          await deletePhoto(photo.id);
          loadAdminPhotos(container, tab);
        } catch (err) { alert(err.message); }
      });
    });
    if (photos.length > 4) {
      const btn = document.createElement('button');
      btn.className = 'admin-expand-btn';
      btn.innerHTML = allExpanded
        ? `<i class="ti ti-chevron-up"></i> Mostrar menos`
        : `<i class="ti ti-chevron-down"></i> Ver las ${photos.length} fotos`;
      btn.addEventListener('click', () => {
        list.dataset.expanded = allExpanded ? 'false' : 'true';
        loadAdminPhotos(container, tab);
      });
      list.appendChild(btn);
    }
  } catch (err) {
    list.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function loadAdminMessages(container) {
  const list = container.querySelector('#admin-messages-list');
  list.innerHTML = '<p class="loading">Cargando...</p>';
  try {
    const msgs = await loadMessages();
    if (msgs.length === 0) {
      list.innerHTML = '<p class="empty">No hay comentarios.</p>';
      return;
    }
    const allExpanded = list.dataset.expanded === 'true';
    const items = allExpanded ? msgs : msgs.slice(0, 4);
    list.innerHTML = '';
    items.forEach(msg => {
      const safeName = escapeHtml(msg.fullName || 'Anónimo');
      const safeContent = escapeHtml(msg.content.length > 90 ? msg.content.slice(0, 90) + '…' : msg.content);
      const card = document.createElement('div');
      card.className = 'admin-msg-card';
      card.innerHTML = `
        <div class="admin-msg-card-info">
          <strong>${safeName}</strong>
          <p>${safeContent}</p>
        </div>
        <button class="btn-small btn-danger" data-id="${msg.id}">Eliminar</button>
      `;
      list.appendChild(card);
      card.querySelector('button').addEventListener('click', async () => {
        if (!confirm('¿Eliminar comentario?')) return;
        try {
          await deleteMessage(msg.id);
          loadAdminMessages(container);
        } catch (err) { alert(err.message); }
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
