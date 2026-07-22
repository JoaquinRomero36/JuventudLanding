const API_BASE = '';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('jwt');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function apiUpload(path, formData) {
  const token = localStorage.getItem('jwt');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'POST', headers, body: formData
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}
