document.addEventListener('DOMContentLoaded', async () => {
  const WHATSAPP_NUMBER = '5493511234567';
  const WHATSAPP_MESSAGE = 'Hola! Quiero saber más sobre Juventud CBA';

  const authArea = document.getElementById('auth-area');
  const authModal = document.getElementById('auth-modal');
  const authModalContent = document.getElementById('auth-modal-content');

  function renderLoggedIn() {
    const name = currentProfile?.fullName || currentUser?.email || 'Usuario';
    authArea.innerHTML = `
      <span class="nav-user">${name}</span>
      <button id="logout-btn" class="nav-logout">Cerrar sesión</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await signOut();
      location.reload();
    });
  }

  function renderLoggedOut() {
    authArea.innerHTML = `<button id="login-btn" class="nav-login">Iniciar sesión</button>`;
    document.getElementById('login-btn').addEventListener('click', () => {
      authModal.style.display = 'flex';
      renderAuthForm(authModalContent);
    });
  }

  authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  await checkSession();
  if (currentUser) {
    renderLoggedIn();
  } else {
    renderLoggedOut();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-whatsapp');
    if (btn) {
      const msg = encodeURIComponent(WHATSAPP_MESSAGE);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    }
  });

  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');
      document.querySelectorAll('.faq-question').forEach(b => {
        b.classList.remove('open');
        b.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen) {
        btn.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  const uploadModal = document.getElementById('upload-modal');
  const uploadBackdrop = uploadModal?.querySelector('.modal-backdrop');
  const openBtn = document.getElementById('open-upload-modal');

  openBtn?.addEventListener('click', () => { uploadModal.style.display = 'flex'; });
  uploadBackdrop?.addEventListener('click', () => { uploadModal.style.display = 'none'; });

  const uploadSubmit = document.getElementById('upload-modal-submit');
  const uploadFile = document.getElementById('upload-modal-file');
  const uploadName = document.getElementById('upload-modal-name');
  const uploadStatus = document.getElementById('upload-modal-status');

  uploadSubmit?.addEventListener('click', async () => {
    const file = uploadFile.files[0];
    if (!file) { uploadStatus.textContent = 'Seleccioná una foto.'; return; }
    try {
      uploadSubmit.disabled = true;
      uploadSubmit.textContent = 'Subiendo...';
      await uploadPhoto(file, uploadName.value || 'Foto');
      uploadStatus.textContent = '¡Foto subida! Gracias por compartirla.';
      uploadFile.value = '';
      uploadName.value = '';
      setTimeout(() => { uploadModal.style.display = 'none'; uploadStatus.textContent = ''; }, 1500);
    } catch (err) {
      uploadStatus.textContent = 'Error: ' + err.message;
    } finally {
      uploadSubmit.disabled = false;
      uploadSubmit.textContent = 'Subir';
    }
  });

  const eventsContainer = document.getElementById('events-container');
  eventsContainer.innerHTML = '<div id="events-list" class="events-list"></div>';
  loadAndRenderEvents(eventsContainer.querySelector('#events-list'));

  renderChatSection(document.getElementById('chat-container'));
  renderHomeGallery(document.getElementById('home-gallery'));

  document.querySelector('a[href="#galeria"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('galeria').scrollIntoView({ behavior: 'smooth' });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const adminLink = document.getElementById('admin-link');
  const adminSection = document.getElementById('admin-section');
  const adminContainer = document.getElementById('admin-container');
  const siteContent = document.getElementById('site-content');
  if (currentProfile?.role === 'admin') {
    adminLink.style.display = '';
    adminLink.addEventListener('click', (e) => {
      e.preventDefault();
      siteContent.style.display = 'none';
      adminSection.style.display = '';
      renderAdminPanel(adminContainer);
    });
  }
});
