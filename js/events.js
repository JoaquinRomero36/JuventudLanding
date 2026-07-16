let eventsCache = null;

async function loadEvents() {
  const data = await apiFetch('/events');
  eventsCache = data;
  return data;
}

async function createEvent(event) {
  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify({ ...event, created_by: currentUser.id })
  });
}

async function updateEvent(id, updates) {
  return apiFetch('/events', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates })
  });
}

async function deleteEvent(id) {
  return apiFetch(`/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function registerForEvent(eventId) {
  return apiFetch('/registrations', {
    method: 'POST',
    body: JSON.stringify({ eventId })
  });
}

async function unregisterFromEvent(eventId) {
  return apiFetch(`/registrations?eventId=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}

async function getUserRegistrations() {
  const data = await apiFetch('/registrations');
  return new Set(data);
}

async function getRegistrationCount(eventId) {
  const events = await loadEvents();
  const ev = events.find(e => e.id === eventId);
  return ev ? ev.registrationCount : 0;
}

function renderEventsSection(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Próximos eventos</h2>
    </div>
    <div id="events-list" class="events-list"></div>
  `;

  const list = container.querySelector('#events-list');
  loadAndRenderEvents(list);
}

async function loadAndRenderEvents(list) {
  list.innerHTML = '<p class="loading">Cargando eventos...</p>';

  try {
    const events = await loadEvents();
    let userRegs;

    if (currentUser) {
      userRegs = await getUserRegistrations();
    }

    if (events.length === 0) {
      list.innerHTML = '<p class="empty">No hay eventos próximos.</p>';
      return;
    }

    list.innerHTML = '';
    for (const event of events) {
      const count = event.registrationCount || 0;
      const isRegistered = userRegs?.has(event.id);
      const isFull = event.max_participants > 0 && count >= event.max_participants;

      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-date-badge">
          <span class="event-day">${new Date(event.date).getDate()}</span>
          <span class="event-month">${new Date(event.date).toLocaleString('es', { month: 'short' })}</span>
        </div>
        <div class="event-info">
          <h3>${event.title}</h3>
          <p class="event-desc">${event.description}</p>
          <p class="event-meta">
            ${event.time ? `<span><i class="ti ti-clock"></i> ${event.time}</span>` : ''}
            ${event.location ? `<span><i class="ti ti-map-pin"></i> ${event.location}</span>` : ''}
            ${event.max_participants > 0 ? `<span><i class="ti ti-users"></i> ${count}/${event.max_participants}</span>` : ''}
          </p>
        </div>
        <div class="event-action">
          ${isRegistered
            ? `<button class="btn-small btn-outline" data-action="unregister" data-id="${event.id}">Inscripto</button>`
            : isFull
              ? `<button class="btn-small btn-disabled" disabled>Completo</button>`
              : `<button class="btn-small btn-primary-solid" data-action="register" data-id="${event.id}">Inscribirme</button>`
          }
        </div>
      `;

      const actionBtn = card.querySelector('[data-action]');
      if (actionBtn) {
        actionBtn.addEventListener('click', async () => {
          try {
            if (actionBtn.dataset.action === 'register') {
              await registerForEvent(event.id);
            } else {
              await unregisterFromEvent(event.id);
            }
            await loadAndRenderEvents(list);
          } catch (err) {
            alert(err.message);
          }
        });
      }

      list.appendChild(card);
    }
  } catch (err) {
    list.innerHTML = `<p class="error">Error al cargar eventos: ${err.message}</p>`;
  }
}

function renderEventForm(container, event = null) {
  const isEdit = !!event;
  container.innerHTML = `
    <h3>${isEdit ? 'Editar evento' : 'Nuevo evento'}</h3>
    <form id="event-form">
      <input type="text" id="ev-title" class="input" placeholder="Título" value="${event?.title || ''}" required>
      <textarea id="ev-desc" class="input" placeholder="Descripción" rows="3">${event?.description || ''}</textarea>
      <div class="form-row">
        <input type="date" id="ev-date" class="input" value="${event?.date || ''}" required>
        <input type="time" id="ev-time" class="input" value="${event?.time || ''}">
      </div>
      <input type="text" id="ev-location" class="input" placeholder="Ubicación" value="${event?.location || ''}">
      <input type="number" id="ev-max" class="input" placeholder="Cupo máximo (0 = sin límite)" value="${event?.max_participants || 0}">
      <p id="ev-error" class="auth-error"></p>
      <button type="submit" class="btn-primary">${isEdit ? 'Guardar cambios' : 'Crear evento'}</button>
      ${isEdit ? `<button type="button" class="btn-secondary" id="ev-cancel">Cancelar</button>` : ''}
    </form>
  `;

  const form = container.querySelector('#event-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = container.querySelector('#ev-error');
    errEl.textContent = '';
    const data = {
      title: container.querySelector('#ev-title').value,
      description: container.querySelector('#ev-desc').value,
      date: container.querySelector('#ev-date').value,
      time: container.querySelector('#ev-time').value,
      location: container.querySelector('#ev-location').value,
      max_participants: parseInt(container.querySelector('#ev-max').value) || 0,
    };

    try {
      if (isEdit) {
        await updateEvent(event.id, data);
      } else {
        await createEvent(data);
      }
      container.innerHTML = '';
      await loadAndRenderEvents(container.closest('.section')?.querySelector('#events-list') || document.querySelector('#events-list'));
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  const cancelBtn = container.querySelector('#ev-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => { container.innerHTML = ''; });
  }
}
