export function getUserRole(user) {
  return String(user?.role || '').trim().toLowerCase();
}

export function canManageSystem(user) {
  const role = getUserRole(user);
  return role === 'superadmin' || role === 'admin';
}

export function canControlDevices(user) {
  const role = getUserRole(user);
  return role === 'superadmin' || role === 'admin' || role === 'homeowner';
}
