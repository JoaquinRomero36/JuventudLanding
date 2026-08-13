document.addEventListener('DOMContentLoaded', async () => {
  const WHATSAPP_NUMBER = '5493511234567';
  const WHATSAPP_MESSAGE = 'Hola! Quiero saber más sobre Juventud CBA';

  const SOCIALS = {
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    spotify: 'https://open.spotify.com/'
  };

  document.querySelectorAll('.social-btn').forEach(btn => {
    const key = btn.classList.contains('social-whatsapp') ? 'whatsapp'
      : btn.classList.contains('social-ig') ? 'instagram'
      : btn.classList.contains('social-yt') ? 'youtube'
      : 'spotify';
    btn.href = SOCIALS[key];
  });

  const authArea = document.getElementById('auth-area');
  const authModal = document.getElementById('auth-modal');
  const authModalContent = document.getElementById('auth-modal-content');
  const uploadModal = document.getElementById('upload-modal');

  function renderLoggedIn() {
    const name = currentProfile?.fullName || currentUser?.email || 'Usuario';
    const html = `
      <span class="nav-user">${escapeHtml(name)}</span>
      <button id="logout-btn" class="nav-logout">Cerrar sesión</button>
    `;
    authArea.innerHTML = html;
    const mobileAuth = document.getElementById('auth-area-mobile');
    if (mobileAuth) mobileAuth.innerHTML = html;
    document.querySelectorAll('#logout-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await signOut();
        location.reload();
      });
    });
  }

  function renderLoggedOut() {
    const html = `<button id="login-btn" class="nav-login">Iniciar sesión</button>`;
    authArea.innerHTML = html;
    const mobileAuth = document.getElementById('auth-area-mobile');
    if (mobileAuth) mobileAuth.innerHTML = html;
    document.querySelectorAll('#login-btn').forEach(btn => {
      btn.addEventListener('click', openAuthModal);
    });
  }

  authModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

  await checkSession();
  if (currentUser) {
    renderLoggedIn();
  } else {
    renderLoggedOut();
  }

  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close-modal]');
    if (closer) {
      hideModal(closer.dataset.closeModal, closer);
      return;
    }
    const openUpload = e.target.closest('#open-upload-modal');
    if (openUpload) {
      if (!currentUser) {
        openAuthModal();
      } else {
        openModal('upload-modal', openUpload);
      }
    }
  });

  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      const firstLink = navLinks.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  });
  navLinks.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [authModal, uploadModal].forEach(m => {
        if (m && m.style.display !== 'none') hideModal(m.id);
      });
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
      const adminSection = document.getElementById('admin-section');
      if (adminSection && adminSection.style.display !== 'none') {
        closeAdmin();
      }
    }
    if (e.key === 'Tab') {
      const openModal = [authModal, uploadModal].find(m => m && m.style.display !== 'none');
      if (openModal) trapFocus(openModal, e);
      else if (navLinks.classList.contains('open')) trapFocus(navLinks, e);
    }
  });

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', btn.nextElementSibling.id || '');
    if (!btn.nextElementSibling.id) {
      btn.nextElementSibling.id = 'faq-answer-' + Math.random().toString(36).slice(2, 8);
      btn.setAttribute('aria-controls', btn.nextElementSibling.id);
    }
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');
      document.querySelectorAll('.faq-question').forEach(b => {
        b.classList.remove('open');
        b.setAttribute('aria-expanded', 'false');
        b.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen) {
        btn.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  const uploadBackdrop = uploadModal?.querySelector('.modal-backdrop');
  uploadBackdrop?.addEventListener('click', () => { hideModal('upload-modal'); });

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
      uploadStatus.textContent = '';
      uploadFile.value = '';
      uploadName.value = '';
      hideModal('upload-modal', document.getElementById('open-upload-modal'));
      showToast('¡Foto subida! Queda en revisión.', 'success');
    } catch (err) {
      uploadStatus.textContent = 'Error: ' + apiErrorMessage(err);
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

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target && link.id !== 'admin-link') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const nav = document.querySelector('.nav');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('#nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          if (a.getAttribute('href') === '#' + entry.target.id) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      }
    });
  }, { threshold: 0.2 });
  ['sobre', 'events-section', 'testimonials-section', 'galeria', 'faqs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });
  function onNavScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

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
