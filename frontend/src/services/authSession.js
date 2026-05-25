const TOKEN_KEY = 'token';
const USER_KEY = 'authUser';
export const AUTH_STATE_CHANGE_EVENT = 'auth-state-change';

function notifyAuthStateChange() {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT));
}

export function getUserRole(user) {
  return String(user?.role || '').trim().toLowerCase();
}

export function canManageSystem(user) {
  const role = getUserRole(user);
  return role === 'superadmin' || role === 'admin';
}

export function getRoleLabel(user) {
  const role = getUserRole(user);

  if (role === 'superadmin' || role === 'admin') {
    return 'System Admin';
  }

  if (role === 'homeowner' || role === 'customer') {
    return 'Customer';
  }

  if (role === 'guest') {
    return 'Guest';
  }

  return 'User';
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  notifyAuthStateChange();
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthStateChange();
}
