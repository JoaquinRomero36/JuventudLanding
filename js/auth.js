let currentUser = null;
let currentProfile = null;

async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
  }
  return session;
}

async function loadProfile() {
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  currentProfile = data;
}

async function signUp(email, password, fullName) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  await loadProfile();
  return data;
}

async function signOut() {
  await sb.auth.signOut();
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
        await signUp(email, password, name);
        errorEl.textContent = 'Revisá tu email para confirmar la cuenta.';
        errorEl.style.color = '#70AC73';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear cuenta';
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
