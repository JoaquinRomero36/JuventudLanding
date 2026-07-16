const state = {
  view: 'landing'
};

async function renderApp() {
  const nav = document.querySelector('#main-nav');
  const main = document.querySelector('#main-content');

  if (!currentUser) {
    nav.style.display = 'none';
    showLockScreen();
    return;
  }

  nav.style.display = 'flex';
  hideLockScreen();

  const isAdmin = currentProfile?.role === 'admin';

  nav.innerHTML = `
    <div class="nav-brand" data-view="landing">Juventud CBA</div>
    <div class="nav-links">
      <button class="nav-link ${state.view === 'landing' ? 'active' : ''}" data-view="landing">Inicio</button>
      <button class="nav-link" data-view="gallery">Galería</button>
      ${isAdmin ? `<button class="nav-link ${state.view === 'admin' ? 'active' : ''}" data-view="admin">Admin</button>` : ''}
      <button id="nav-logout" class="nav-link nav-logout">Salir</button>
    </div>
  `;

  nav.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      renderView(main);
    });
  });

  nav.querySelector('#nav-logout').addEventListener('click', async () => {
    await signOut();
    await renderApp();
  });

  renderView(main);
}

function renderView(container) {
  switch (state.view) {
    case 'landing': renderLanding(container); break;
    case 'gallery': renderGalleryPage(container); break;
    case 'admin': renderAdminPanel(container); break;
    default: renderLanding(container);
  }
}

function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-hero">
      <div class="hero-content">
        <div class="hero-icon"><i class="ti ti-flame"></i></div>
        <h1>Juventud CBA</h1>
        <p>Un grupo de jóvenes adventistas en Córdoba que se junta para crecer en fe, en comunidad y en propósito.</p>
      </div>
    </div>

    <section class="section" id="about-section">
      <h2>Quiénes somos</h2>
      <p class="desc">Empezamos hace un año con un objetivo simple: que los jóvenes de Córdoba tengan un lugar donde conectar con Dios y entre ellos. Hoy somos un grupo que crece cada sábado.</p>
    </section>

    <section class="section" id="events-section">
      <div id="events-container"></div>
    </section>

    <section class="section" id="testimonials-section">
      <div id="chat-container"></div>
    </section>

    <section class="section" id="photos-section">
      <div class="section-header">
        <h2>Galería</h2>
        <a href="#" class="section-link" data-view="gallery">Ver todas</a>
      </div>
      <div id="home-gallery"></div>
    </section>

    <section class="cta">
      <h2>¿Tenés 15 a 35 años?</h2>
      <p>No hace falta nada más que las ganas de venir.</p>
      <button class="btn-whatsapp"><i class="ti ti-brand-whatsapp"></i> Escribinos por WhatsApp</button>
    </section>

    <footer class="footer">
      <p>© ${new Date().getFullYear()} Juventud CBA</p>
    </footer>
  `;

  renderEventsSection(container.querySelector('#events-container'));
  renderChatSection(container.querySelector('#chat-container'));
  renderHomeGallery(container.querySelector('#home-gallery'));

  container.querySelector('[data-view="gallery"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.view = 'gallery';
    container.querySelector('#main-nav')?.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    container.querySelector('#main-content').innerHTML = '';
    renderView(document.querySelector('#main-content'));
  });
}

async function renderHomeGallery(container) {
  try {
    const photos = await loadPhotos(true);
    renderPhotoGallery(container, photos.slice(0, 6));
  } catch (err) {
    container.innerHTML = `<p class="error">Error al cargar galería: ${err.message}</p>`;
  }
}

async function renderGalleryPage(container) {
  container.innerHTML = `
    <h1 class="page-title">Galería de fotos</h1>
    <div id="full-gallery"></div>
  `;

  const galleryContainer = container.querySelector('#full-gallery');
  try {
    const photos = await loadPhotos(true);
    renderPhotoGallery(galleryContainer, photos);
  } catch (err) {
    galleryContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

function showLockScreen() {
  document.querySelector('#lock-screen').style.display = 'flex';
}

function hideLockScreen() {
  document.querySelector('#lock-screen').style.display = 'none';
}

function closeModal() {
  document.querySelector('#auth-modal').style.display = 'none';
}
