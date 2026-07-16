function renderAdminPanel(container) {
  if (!currentProfile || currentProfile.role !== 'admin') {
    container.innerHTML = '<p class="error">No tenés permisos de administrador.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="events">Eventos</button>
      <button class="admin-tab" data-tab="photos">Fotos pendientes</button>
    </div>
    <div id="admin-content"></div>
  `;

  const adminContent = container.querySelector('#admin-content');

  container.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switch (tab.dataset.tab) {
        case 'events': renderAdminEvents(adminContent); break;
        case 'photos': renderAdminPhotos(adminContent); break;
      }
    });
  });

  renderAdminEvents(adminContent);
}

function renderAdminEvents(container) {
  container.innerHTML = `
    <div class="admin-header">
      <button id="admin-new-event" class="btn-primary">+ Nuevo evento</button>
    </div>
    <div id="admin-events-list"></div>
    <div id="admin-event-form"></div>
  `;

  const list = container.querySelector('#admin-events-list');
  const formContainer = container.querySelector('#admin-event-form');

  container.querySelector('#admin-new-event').addEventListener('click', () => {
    renderEventForm(formContainer);
  });

  loadAndRenderAdminEvents(list, formContainer);
}

async function loadAndRenderAdminEvents(list, formContainer) {
  list.innerHTML = '<p class="loading">Cargando...</p>';
  try {
    const events = await loadEvents();
    if (events.length === 0) {
      list.innerHTML = '<p class="empty">No hay eventos.</p>';
      return;
    }
    list.innerHTML = '';
    events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'admin-event-card';
      card.innerHTML = `
        <div>
          <strong>${event.title}</strong>
          <p>${new Date(event.date).toLocaleDateString('es')} ${event.time ? `- ${event.time}` : ''}</p>
        </div>
        <div class="admin-event-actions">
          <button class="btn-small btn-outline" data-action="edit" data-id="${event.id}">Editar</button>
          <button class="btn-small btn-danger" data-action="delete" data-id="${event.id}">Eliminar</button>
        </div>
      `;
      list.appendChild(card);

      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        renderEventForm(formContainer, event);
      });

      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar "${event.title}"?`)) return;
        try {
          await deleteEvent(event.id);
          await loadAndRenderAdminEvents(list, formContainer);
        } catch (err) { alert(err.message); }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderAdminPhotos(container) {
  container.innerHTML = '<div id="admin-photos-list"></div>';
  const list = container.querySelector('#admin-photos-list');
  loadAndRenderPendingPhotos(list);
}

async function loadAndRenderPendingPhotos(list) {
  list.innerHTML = '<p class="loading">Cargando...</p>';
  try {
    const allPhotos = await loadPhotos(false);
    const pending = allPhotos.filter(p => !p.approved);

    if (pending.length === 0) {
      list.innerHTML = '<p class="empty">No hay fotos pendientes de moderación.</p>';
      return;
    }

    list.innerHTML = '';
    pending.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'admin-photo-card';
      card.innerHTML = `
        <img src="${photo.url}" alt="${photo.description || ''}" loading="lazy">
        <div class="admin-photo-info">
          <p>${photo.description || 'Sin descripción'}</p>
          <div class="admin-photo-actions">
            <button class="btn-small btn-primary-solid" data-action="approve" data-id="${photo.id}">Aprobar</button>
            <button class="btn-small btn-danger" data-action="delete" data-id="${photo.id}" data-url="${photo.url}">Rechazar</button>
          </div>
        </div>
      `;
      list.appendChild(card);

      card.querySelector('[data-action="approve"]').addEventListener('click', async () => {
        try {
          await approvePhoto(photo.id);
          card.remove();
        } catch (err) { alert(err.message); }
      });

      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        try {
          await deletePhoto(photo.id, photo.url);
          card.remove();
        } catch (err) { alert(err.message); }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="error">${err.message}</p>`;
  }
}
