async function loadEvents() {
  return apiFetch('/events');
}

async function createEvent(event) {
  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(event)
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

function renderEventsSection(container) {
  container.innerHTML = '<div id="events-list" class="events-list"></div>';
  const list = container.querySelector('#events-list');
  loadAndRenderEvents(list);
}

async function loadAndRenderEvents(list) {
  list.innerHTML = '<p class="loading">Cargando eventos...</p>';
  try {
    const events = await loadEvents();
    if (events.length === 0) {
      list.innerHTML = '<p class="empty">No hay eventos próximos.</p>';
      return;
    }
    list.innerHTML = '';
    for (const event of events) {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-date">
          <span class="event-day">${new Date(event.date).getDate()}</span>
          <span class="event-month">${new Date(event.date).toLocaleString('es', { month: 'short' })}</span>
        </div>
        <div class="event-info">
          <h3>${event.title}</h3>
          <p class="event-desc">${event.description}</p>
          <p class="event-meta">
            ${event.time ? `<span><i class="ti ti-clock"></i> ${event.time}</span>` : ''}
            ${event.location ? `<span><i class="ti ti-map-pin"></i> ${event.location}</span>` : ''}
            ${event.max_participants > 0 ? `<span><i class="ti ti-users"></i> ${event.registrationCount}/${event.max_participants}</span>` : ''}
          </p>
        </div>
        <div class="event-action">
          ${event.registered
            ? `<button class="btn-small btn-outline" data-action="unregister" data-id="${event.id}">Inscripto</button>`
            : event.registrationCount >= event.max_participants && event.max_participants > 0
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
          } catch (err) { alert(err.message); }
        });
      }
      list.appendChild(card);
    }
  } catch (err) {
    list.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
