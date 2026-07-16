let currentUser = null;
let currentProfile = null;
let gotrue = null;

async function initAuth() {
  if (typeof netlifyIdentity !== 'undefined') {
    gotrue = netlifyIdentity.gotrue;
  }
}

async function getToken() {
  if (!gotrue) return null;
  const user = gotrue.currentUser();
  if (!user) return null;
  try {
    const token = await user.jwt();
    return token;
  } catch {
    const u = gotrue.currentUser();
    return u?.token?.access_token || null;
  }
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/.netlify/functions${path}`, { ...options, headers });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function checkSession() {
  if (!gotrue) return null;
  const user = gotrue.currentUser();
  if (user) {
    currentUser = { id: user.id, email: user.email };
    await loadProfile();
    return currentUser;
  }
  return null;
}

async function loadProfile() {
  try {
    const data = await apiFetch('/profile');
    currentProfile = data.profile;
    currentUser = data.user;
    return data;
  } catch {
    currentProfile = { role: 'user', fullName: '' };
    return null;
  }
}

async function signUp(email, password, fullName) {
  const { data, error } = await gotrue.signup(email, password, { full_name: fullName });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await gotrue.login(email, password, true);
  if (error) throw error;
  currentUser = { id: data.id, email: data.email };
  await loadProfile();
  return data;
}

async function signOut() {
  await gotrue.logout();
  currentUser = null;
  currentProfile = null;
}

function renderAuthForm(container) {
  container.innerHTML = `
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">Iniciar sesión</button>
      <button class="auth-tab" data-tab="register">Registrarme</button>
    </div>
    <form id="auth-form">
      <div id="register-fields" style="display:none;">
        <input type="text" id="auth-name" class="input" placeholder="Nombre completo" required>
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

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cargando...';

      if (isRegister) {
        const name = container.querySelector('#auth-name').value;
        const result = await signUp(email, password, name);
        if (result?.user?.identities?.length === 0) {
          errorEl.textContent = 'Este email ya está registrado. Iniciá sesión.';
          errorEl.style.color = '#B7502B';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Crear cuenta';
          return;
        }
        await signIn(email, password);
        closeModal();
        await renderApp();
        return;
      }

      await signIn(email, password);
      closeModal();
      await renderApp();
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
    }
  });
}
