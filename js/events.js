async function loadEvents() {
  return apiFetch('/events');
}

async function loadAllEvents() {
  return apiFetch('/events?all=true');
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

function renderEventsSection(container) {
  container.innerHTML = '<div id="events-list" class="events-list"></div>';
  const list = container.querySelector('#events-list');
  loadAndRenderEvents(list);
}

async function loadAndRenderEvents(list) {
  skeletonSkeleton(list, 3, 'card');
  try {
    const events = await loadEvents();
    if (events.length === 0) {
      list.innerHTML = emptyState('ti-calendar-off', 'Todavía no hay eventos cargados. Volvé pronto, los estamos preparando.');
      return;
    }
    list.innerHTML = '';
    events.forEach((event, idx) => {
      const card = document.createElement('div');
      const isFeatured = idx === 0;
      card.className = isFeatured ? 'event-card event-featured' : 'event-card';
      const isFull = event.registrationCount >= event.max_participants && event.max_participants > 0;
      const actionHtml = event.registered
        ? `<button class="btn-small btn-outline" data-action="unregister" data-id="${event.id}">Inscripto</button>`
        : isFull
          ? `<button class="btn-small btn-disabled" disabled>Completo</button>`
          : currentUser
            ? `<button class="btn-small btn-primary-solid" data-action="register" data-id="${event.id}">Inscribirme</button>`
            : `<button class="btn-small btn-primary-solid" data-action="auth">Inscribirme</button>`;
      const date = new Date(event.date);
      const dayName = date.toLocaleDateString('es', { weekday: 'long' });
      const featuredAction = event.registered
        ? `<button class="ev-featured-cta cta-outline" data-action="unregister" data-id="${event.id}"><i class="ti ti-check"></i> Inscripto</button>`
        : isFull
          ? `<button class="ev-featured-cta cta-disabled" disabled>Completo</button>`
          : `<button class="ev-featured-cta cta-solid" data-action="${currentUser ? 'register' : 'auth'}" data-id="${currentUser ? event.id : ''}"><i class="ti ti-heart"></i> ¡Me inscribo!</button>`;
      card.innerHTML = isFeatured ? `
        <div class="ev-featured-badge"><i class="ti ti-party-popper"></i> PRÓXIMO ENCUENTRO</div>
        <div class="ev-featured-body">
          <div class="ev-featured-date">
            <span class="ev-fd-day">${date.getDate()}</span>
            <span class="ev-fd-month">${date.toLocaleString('es', { month: 'long' })}</span>
          </div>
          <div class="ev-featured-info">
            <h3>${escapeHtml(event.title)}</h3>
            <p class="ev-featured-weekday">${escapeHtml(dayName)} · reservá tu lugar</p>
            <p class="ev-featured-desc">${escapeHtml(event.description || '')}</p>
            <p class="event-meta">
              ${event.time ? `<span><i class="ti ti-clock"></i> ${escapeHtml(event.time)}</span>` : ''}
              ${event.location ? `<span><i class="ti ti-map-pin"></i> ${escapeHtml(event.location)}</span>` : ''}
              ${event.max_participants > 0 ? `<span><i class="ti ti-users"></i> ${event.registrationCount}/${event.max_participants}</span>` : ''}
            </p>
          </div>
          <div class="ev-featured-action">
            ${featuredAction}
            ${!currentUser ? '<p class="event-login-hint"><i class="ti ti-user"></i> Iniciá sesión para inscribirte</p>' : ''}
          </div>
        </div>
      ` : `
        <div class="event-date">
          <span class="event-day">${date.getDate()}</span>
          <span class="event-month">${date.toLocaleString('es', { month: 'short' })}</span>
        </div>
        <div class="event-info">
          <h3>${escapeHtml(event.title)}</h3>
          <p class="event-desc">${escapeHtml(event.description || '')}</p>
          <p class="event-meta">
            ${event.time ? `<span><i class="ti ti-clock"></i> ${escapeHtml(event.time)}</span>` : ''}
            ${event.location ? `<span><i class="ti ti-map-pin"></i> ${escapeHtml(event.location)}</span>` : ''}
            ${event.max_participants > 0 ? `<span><i class="ti ti-users"></i> ${event.registrationCount}/${event.max_participants}</span>` : ''}
          </p>
        </div>
        <div class="event-action">${actionHtml}</div>
        ${!currentUser ? '<p class="event-login-hint"><i class="ti ti-user"></i> Iniciá sesión para inscribirte</p>' : ''}
      `;
      const actionBtn = card.querySelector('[data-action]');
      if (actionBtn) {
        actionBtn.addEventListener('click', async () => {
          try {
            if (actionBtn.dataset.action === 'auth') {
              openAuthModal();
              return;
            }
            if (actionBtn.dataset.action === 'register') {
              await registerForEvent(event.id);
            } else {
              await unregisterFromEvent(event.id);
            }
            await loadAndRenderEvents(list);
            if (actionBtn.dataset.action === 'register') {
              showToast('¡Listo, te esperamos!', 'success');
            } else {
              showToast('Te desinscribiste', 'info');
            }
          } catch (err) { showToast(apiErrorMessage(err), 'error'); }
        });
      }
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
