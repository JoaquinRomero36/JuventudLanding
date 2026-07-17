let currentUser = null;
let currentProfile = null;

function identityUrl() {
  const base = window.location.origin;
  return base + '/.netlify/identity';
}

async function netlifyFetch(path, opts = {}) {
  const res = await fetch(identityUrl() + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers }
  });
  const json = await res.json();
  if (json.error || json.msg) throw new Error(json.msg || json.error_description || json.error);
  return json;
}

let cachedToken = null;

async function ensureToken() {
  if (cachedToken) {
    try {
      const r = await netlifyFetch('/user', { headers: { Authorization: `Bearer ${cachedToken}` } });
      if (r.id) return cachedToken;
    } catch {}
    cachedToken = null;
  }
  const ref = localStorage.getItem('gotrue.user');
  if (!ref) return null;
  try {
    const u = JSON.parse(ref);
    if (u.token?.access_token) {
      const r = await netlifyFetch('/user', { headers: { Authorization: `Bearer ${u.token.access_token}` } });
      if (r.id) {
        cachedToken = u.token.access_token;
        return cachedToken;
      }
    }
  } catch {}
  return null;
}

async function getToken() {
  return ensureToken();
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
  const token = await ensureToken();
  if (!token) return null;
  const ref = localStorage.getItem('gotrue.user');
  if (!ref) return null;
  try {
    const u = JSON.parse(ref);
    currentUser = { id: u.id, email: u.email };
    await loadProfile();
    return currentUser;
  } catch {
    return null;
  }
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
  const data = await netlifyFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data: { full_name: fullName } })
  });
  return data;
}

async function signIn(email, password) {
  const data = await netlifyFetch('/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  });
  const session = {
    id: data.user.id,
    email: data.user.email,
    token: { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in }
  };
  localStorage.setItem('gotrue.user', JSON.stringify(session));
  cachedToken = data.access_token;
  currentUser = { id: data.user.id, email: data.user.email };
  await loadProfile();
  return data;
}

async function signOut() {
  localStorage.removeItem('gotrue.user');
  cachedToken = null;
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
        if (result?.id) {
          const user = JSON.parse(localStorage.getItem('gotrue.user') || '{}');
          if (!user.id) {
            errorEl.textContent = 'Revisá tu email para confirmar la cuenta (si hace falta).';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear cuenta';
            return;
          }
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
