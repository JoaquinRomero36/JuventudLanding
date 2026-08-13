function openModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (trigger) modal._trigger = trigger;
  const firstFocusable = modal.querySelector('input, button, textarea, select, a[href]');
  if (firstFocusable) firstFocusable.focus();
}

function hideModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'none';
  if (!document.querySelector('.modal[style*="flex"]')) {
    document.body.style.overflow = '';
  }
  const target = trigger || (modal._trigger || null);
  if (target && target.focus) target.focus();
}

function closeModal() {
  hideModal('auth-modal');
}

function confirmDialog(message, { confirmText = 'Confirmar', danger = false } = {}) {
  return new Promise((resolve) => {
    let existing = document.getElementById('confirm-dialog');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'confirm-dialog';
    container.className = 'modal confirm-modal';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', message);
    container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <h2>¿Estás seguro?</h2>
        <p class="confirm-text"></p>
        <div class="confirm-actions">
          <button class="btn-small btn-outline" data-confirm="no">Cancelar</button>
          <button class="btn-small ${danger ? 'btn-danger' : 'btn-primary-solid'}" data-confirm="yes">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    container.querySelector('.confirm-text').textContent = message;
    document.body.appendChild(container);
    document.body.style.overflow = 'hidden';
    const done = (val) => {
      container.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', keyHandler);
      resolve(val);
    };
    function keyHandler(e) {
      if (e.key === 'Escape') done(false);
      if (e.key === 'Tab') trapFocus(container, e);
    }
    document.addEventListener('keydown', keyHandler);
    container.querySelector('[data-confirm="no"]').addEventListener('click', () => done(false));
    container.querySelector('[data-confirm="yes"]').addEventListener('click', () => done(true));
    container.querySelector('.modal-backdrop').addEventListener('click', () => done(false));
    container.querySelector('[data-confirm="no"]').focus();
  });
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-modal-content');
  if (!modal || !content) return;
  openModal('auth-modal');
  renderAuthForm(content);
  const firstField = content.querySelector('input');
  if (firstField) firstField.focus();
}

function trapFocus(container, e) {
  const focusables = container.querySelectorAll(
    'button, input, textarea, select, a[href]'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function renderAuthForm(container) {
  container.innerHTML = `
    <button class="modal-close" data-close-modal="auth-modal" aria-label="Cerrar">×</button>
    <h2 id="auth-modal-title">${'Iniciar sesión'}</h2>
    <div class="auth-tabs" role="tablist" aria-label="Autenticación">
      <button class="auth-tab active" data-tab="login" role="tab" aria-selected="true">Iniciar sesión</button>
      <button class="auth-tab" data-tab="register" role="tab" aria-selected="false">Registrarme</button>
    </div>
    <form id="auth-form">
      <div id="register-fields" style="display:none;">
        <input type="text" id="auth-name" class="input" placeholder="Nombre completo">
      </div>
      <input type="email" id="auth-email" class="input" placeholder="Email" required>
      <input type="password" id="auth-password" class="input" placeholder="Contraseña" required>
      <p id="auth-error" class="auth-error"></p>
      <button type="submit" class="btn-primary" id="auth-submit">Iniciar sesión</button>
    </form>
  `;

  container.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

  const tabs = container.querySelectorAll('.auth-tab');
  const registerFields = container.querySelector('#register-fields');
  const submitBtn = container.querySelector('#auth-submit');
  const errorEl = container.querySelector('#auth-error');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      registerFields.style.display = tab.dataset.tab === 'register' ? 'block' : 'none';
      submitBtn.textContent = tab.dataset.tab === 'register' ? 'Crear cuenta' : 'Iniciar sesión';
    });
  });

  const form = container.querySelector('#auth-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const email = container.querySelector('#auth-email').value;
    const password = container.querySelector('#auth-password').value;
    const isRegister = container.querySelector('.auth-tab.active').dataset.tab === 'register';

    if (password.length < 6) {
      errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cargando...';
      if (isRegister) {
        const name = container.querySelector('#auth-name').value;
        await signUp(email, password, name);
      }
      await signIn(email, password);
      closeModal();
      location.reload();
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
    }
  });
}

async function renderHomeGallery(container) {
  skeletonSkeleton(container, 6, 'square');
  try {
    const photos = await loadPhotos(true);
    const countEl = document.getElementById('gallery-count');
    if (countEl) countEl.textContent = `${photos.length} fotos`;
    renderPhotoGallery(container, photos);
  } catch (err) {
    container.innerHTML = `<p class="error">Error al cargar galería: ${apiErrorMessage(err)}</p>`;
  }
}
