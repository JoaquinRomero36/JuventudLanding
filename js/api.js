const API_BASE = '';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function skeletonSkeleton(container, count = 3, kind = 'card') {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += kind === 'card'
      ? '<div class="sk sk-card"><div class="sk-line w60"></div><div class="sk-line w80"></div><div class="sk-line w40"></div></div>'
      : '<div class="sk sk-square"></div>';
  }
  container.innerHTML = `<div class="sk-wrap ${kind === 'card' ? '' : 'sk-grid'}">${html}</div>`;
}

function emptyState(icon, text, ctaHtml = '') {
  return `<div class="empty-state">
    <div class="empty-state-icon"><i class="ti ${icon}"></i></div>
    <p>${escapeHtml(text)}</p>
    ${ctaHtml}
  </div>`;
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'ti-check'
    : type === 'error' ? 'ti-alert-triangle'
    : 'ti-info-circle';
  toast.innerHTML = `<i class="ti ${icon}"></i><span></span>`;
  toast.querySelector('span').textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function safeParse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function apiErrorMessage(err) {
  if (err instanceof TypeError) return 'Sin conexión. Intentá de nuevo.';
  return err.message || 'Algo salió mal. Intentá de nuevo.';
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('jwt');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  } catch {
    throw new Error('Sin conexión. Intentá de nuevo.');
  }
  const json = await safeParse(res);
  if (!res.ok || (json && json.error)) {
    throw new Error((json && json.error) || `Error ${res.status}`);
  }
  return json ? json.data : undefined;
}

async function apiUpload(path, formData) {
  const token = localStorage.getItem('jwt');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST', headers, body: formData
    });
  } catch {
    throw new Error('Sin conexión. Intentá de nuevo.');
  }
  const json = await safeParse(res);
  if (!res.ok || (json && json.error)) {
    throw new Error((json && json.error) || `Error ${res.status}`);
  }
  return json ? json.data : undefined;
}
