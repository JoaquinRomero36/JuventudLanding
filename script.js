document.addEventListener('DOMContentLoaded', async () => {

  const WHATSAPP_NUMBER = '5493511234567';
  const WHATSAPP_MESSAGE = 'Hola! Quiero saber más sobre Juventud CBA';

  // --- Auth ---
  const authArea = document.getElementById('auth-area');
  const authModal = document.getElementById('auth-modal');
  const authModalContent = document.getElementById('auth-modal-content');

  function renderLoggedIn(user) {
    const name = currentProfile?.fullName || user?.email || 'Usuario';
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

  // --- WhatsApp ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-whatsapp');
    if (btn) {
      const msg = encodeURIComponent(WHATSAPP_MESSAGE);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    }
  });

  // --- FAQ accordion ---
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

  // --- Photo upload (Netlify Blobs) ---
  const uploadBtn = document.getElementById('photo-upload-btn');
  const nameInput = document.getElementById('photo-name');
  const fileInput = document.getElementById('photo-file');
  const uploadStatus = document.getElementById('upload-status');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) { uploadStatus.textContent = 'Seleccioná una foto.'; return; }
      try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';
        await uploadPhoto(file, nameInput.value || 'Foto');
        uploadStatus.textContent = '¡Foto subida! Gracias por compartirla.';
        nameInput.value = '';
        fileInput.value = '';
      } catch (err) {
        uploadStatus.textContent = 'Error: ' + err.message;
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Subir foto';
      }
    });
  }

  // --- Render sections ---
  const eventsContainer = document.getElementById('events-container');
  eventsContainer.innerHTML = '<div id="events-list" class="events-list"></div>';
  loadAndRenderEvents(eventsContainer.querySelector('#events-list'));
  renderChatSection(document.getElementById('chat-container'));

  const homeGallery = document.getElementById('home-gallery');
  renderHomeGallery(homeGallery);

  // --- Gallery link (scroll) ---
  document.querySelector('a[href="#galeria"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('galeria').scrollIntoView({ behavior: 'smooth' });
  });

});
