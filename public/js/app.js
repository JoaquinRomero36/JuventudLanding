function closeModal() {
  document.querySelector('#auth-modal').style.display = 'none';
}

function renderAuthForm(container) {
  container.innerHTML = `
    <h2>${'Iniciar sesión'}</h2>
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">Iniciar sesión</button>
      <button class="auth-tab" data-tab="register">Registrarme</button>
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

  const tabs = container.querySelectorAll('.auth-tab');
  const registerFields = container.querySelector('#register-fields');
  const submitBtn = container.querySelector('#auth-submit');
  const errorEl = container.querySelector('#auth-error');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
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
  try {
    const photos = await loadPhotos(true);
    renderPhotoGallery(container, photos);
  } catch (err) {
    container.innerHTML = `<p class="error">Error al cargar galería: ${err.message}</p>`;
  }
}
