document.addEventListener('DOMContentLoaded', () => {

  const WHATSAPP_NUMBER = '5493511234567';
  const WHATSAPP_MESSAGE = 'Hola! Quiero saber más sobre Juventud CBA';

  // --- Login / logout (solo un botón en el nav, no bloquea el sitio) ---
  const authArea = document.getElementById('auth-area');

  function renderLoggedIn(user) {
    authArea.innerHTML = `
      <span class="nav-user">${user.user_metadata.full_name || user.email}</span>
      <button id="logout-btn" class="nav-login">Cerrar sesión</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => netlifyIdentity.logout());
  }

  function renderLoggedOut() {
    authArea.innerHTML = `<button id="login-btn" class="nav-login">Iniciar sesión</button>`;
    document.getElementById('login-btn').addEventListener('click', () => netlifyIdentity.open());
  }

  if (window.netlifyIdentity) {
    netlifyIdentity.init();
    netlifyIdentity.on('init', user => user ? renderLoggedIn(user) : renderLoggedOut());
    netlifyIdentity.on('login', user => { renderLoggedIn(user); netlifyIdentity.close(); });
    netlifyIdentity.on('logout', renderLoggedOut);
    renderLoggedOut();
  }

  // --- WhatsApp ---
  const btnWhatsapp = document.querySelector('.btn-whatsapp');
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      const msg = encodeURIComponent(WHATSAPP_MESSAGE);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    });
  }

  // --- FAQ acordeón ---
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

  // --- Subida de foto (Netlify Forms) ---
  const photoForm = document.getElementById('photo-form');
  const uploadStatus = document.getElementById('upload-status');
  if (photoForm) {
    photoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(photoForm);
      fetch('/', { method: 'POST', body: data })
        .then(() => {
          uploadStatus.textContent = '¡Foto subida! Gracias por compartirla.';
          photoForm.reset();
        })
        .catch(() => {
          uploadStatus.textContent = 'Hubo un error, intentá de nuevo.';
        });
    });
  }

});
