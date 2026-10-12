(() => {
  'use strict';

  const USERS_KEY = 'ictu_cnxhkh_users_v1';
  const SESSION_KEY = 'ictu_cnxhkh_session_v1';
  const defaultUsers = [
    { id: 'admin-1', name: 'Quản trị viên', username: 'admin', password: 'admin123', role: 'admin', status: 'active', createdAt: '2026-01-01' },
    { id: 'student-1', name: 'Học viên mẫu', username: 'student', password: 'student123', role: 'student', status: 'active', createdAt: '2026-01-01' }
  ];

  function readUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
      return Array.isArray(users) && users.length ? users : defaultUsers.map(user => ({ ...user }));
    } catch {
      return defaultUsers.map(user => ({ ...user }));
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
