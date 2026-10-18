(() => {
  'use strict';

  const USERS_KEY = 'ictu_cnxhkh_users_v1';
  const SESSION_KEY = 'ictu_cnxhkh_session_v1';
  const defaultUsers = [
    { id: 'admin-1', name: 'Quản trị viên', username: 'admin', password: 'admin123', role: 'admin', status: 'active', createdAt: '2026-01-01' },
    { id: 'student-1', name: 'Học viên mẫu', username: 'student', password: 'student123', role: 'student', status: 'active', createdAt: '2026-01-01' }
  ];

  function getDefaultUsers() {
    return defaultUsers.map(user => ({ ...user }));
  }

  function readUsers() {
    const defaults = getDefaultUsers();
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
      if (!Array.isArray(users) || !users.length) return defaults;

      const protectedUsernames = new Set(defaults.map(user => user.username.toLowerCase()));
      const mergedUsers = defaults.map(user => ({ ...user }));
      for (const user of users) {
        if (!user || typeof user.username !== 'string') continue;
        const username = user.username.trim();
        if (!username || protectedUsernames.has(username.toLowerCase())) continue;
        mergedUsers.push({
          id: user.id || `user-${Date.now()}-${mergedUsers.length}`,
          name: user.name || username,
          username,
          password: String(user.password ?? ''),
          role: user.role === 'admin' ? 'admin' : 'student',
          status: user.status === 'active' ? 'active' : 'disabled',
          createdAt: user.createdAt || new Date().toISOString().slice(0, 10)
        });
      }
      return mergedUsers;
    } catch {
      return defaults;
    }
  }

  function saveUsers(users) {
    const defaults = getDefaultUsers();
    const protectedUsernames = new Set(defaults.map(user => user.username.toLowerCase()));
    const nextUsers = Array.isArray(users) ? users.filter(user => user && typeof user.username === 'string' && user.username.trim()) : [];
    const mergedUsers = defaults.map(user => ({ ...user }));
    for (const user of nextUsers) {
      const username = user.username.trim();
      if (protectedUsernames.has(username.toLowerCase())) continue;
      mergedUsers.push({
        id: user.id || `user-${Date.now()}-${mergedUsers.length}`,
        name: user.name || username,
        username,
        password: String(user.password ?? ''),
        role: user.role === 'admin' ? 'admin' : 'student',
        status: user.status === 'active' ? 'active' : 'disabled',
        createdAt: user.createdAt || new Date().toISOString().slice(0, 10)
      });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: user.id, name: user.name, username: user.username, role: user.role
    }));
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  window.ICTUAuth = { USERS_KEY, SESSION_KEY, readUsers, saveUsers, getSession, setSession, signOut };
})();
