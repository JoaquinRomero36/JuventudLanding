document.addEventListener('DOMContentLoaded', async () => {

  const authModal = document.getElementById('auth-modal');
  const authModalContent = document.getElementById('auth-modal-content');
  const loginBtn = document.getElementById('login-header-btn');
  const logoutBtn = document.getElementById('logout-header-btn');
  const mainContent = document.getElementById('main-content');
  const navLinks = document.querySelectorAll('[data-section]');
  const galleryLink = document.getElementById('gallery-link');

  function showAuth() {
    authModal.style.display = 'flex';
    renderAuthForm(authModalContent);
  }

  function updateNav() {
    if (currentUser) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      logoutBtn.textContent = 'Salir (' + (currentProfile?.fullName || currentUser.email) + ')';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
    }
  }

  loginBtn.addEventListener('click', showAuth);
  logoutBtn.addEventListener('click', async () => {
    await signOut();
    updateNav();
    location.reload();
  });

  authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    authModal.style.display = 'none';
  });
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    const whatsappBtn = e.target.closest('.btn-whatsapp');
    if (whatsappBtn) {
      const msg = encodeURIComponent('Hola! Quiero saber más sobre Juventud CBA');
      window.open(`https://wa.me/5493511234567?text=${msg}`, '_blank');
    }
  });

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
      btn.querySelector('.faq-icon').textContent = item.classList.contains('open') ? '−' : '+';
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const section = link.dataset.section;
      if (section === 'galeria') showGallery();
      else if (section === 'inicio') location.reload();
    });
  });

  galleryLink.addEventListener('click', (e) => {
    e.preventDefault();
    showGallery();
  });

  function showGallery() {
    mainContent.innerHTML = '<h1 class="page-title">Galería de fotos</h1><div id="full-gallery"></div>';
    const gc = document.getElementById('full-gallery');
    loadPhotos(true).then(photos => renderPhotoGallery(gc, photos)).catch(err => {
      gc.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    });
  }

  await checkSession();
  updateNav();

  renderEventsSection(document.getElementById('events-container'));
  renderHomeGallery(document.getElementById('home-gallery'));
  renderChatSection(document.getElementById('chat-container'));
});
