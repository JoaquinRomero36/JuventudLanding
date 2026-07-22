let currentUser = null;
let currentProfile = null;

async function apiAuth(path, body) {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function signUp(email, password, fullName) {
  return apiAuth('/signup', { email, password, fullName });
}

async function signIn(email, password) {
  const data = await apiAuth('/signin', { email, password });
  localStorage.setItem('jwt', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  currentUser = data.user;
  currentProfile = data.user;
  return data;
}

async function signOut() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  currentUser = null;
  currentProfile = null;
}

async function checkSession() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    currentUser = json.user;
    currentProfile = json.user;
    return json.user;
  } catch {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    currentUser = null;
    currentProfile = null;
    return null;
  }
}

async function loadProfile() {
  return currentProfile;
}
