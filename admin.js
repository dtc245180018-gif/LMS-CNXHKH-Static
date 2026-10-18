(() => {
  'use strict';
  const session = ICTUAuth.getSession();
  if (!session || session.role !== 'admin') {
    window.location.replace('login.html');
    return;
  }
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const toast = message => { const node = $('toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2600); };
  $('admin-name').textContent = session.name;
  $('logout').addEventListener('click', ICTUAuth.signOut);
  document.querySelector('[data-action="toggle-menu"]').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));

  function render() {
    const users = ICTUAuth.readUsers();
    $('total-users').textContent = users.length;
    $('active-users').textContent = users.filter(user => user.status === 'active').length;
    $('student-users').textContent = users.filter(user => user.role === 'student').length;
    $('admin-users').textContent = users.filter(user => user.role === 'admin').length;
    $('user-list').innerHTML = users.length ? users.map(user => `<tr><td><strong>${escapeHTML(user.name)}</strong></td><td>${escapeHTML(user.username)}</td><td>${user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</td><td><span class="status-pill ${user.status === 'active' ? 'status-active' : 'status-disabled'}">${user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}</span></td><td>${escapeHTML(user.createdAt)}</td><td>${user.id === session.id ? '<small class="subtle">Tài khoản hiện tại</small>' : `<button class="btn btn-danger btn-xs" data-delete="${escapeHTML(user.id)}">Xóa</button>`}</td></tr>`).join('') : '<tr><td class="admin-empty" colspan="6">Chưa có tài khoản.</td></tr>';
    document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.delete;
      const next = users.find(user => user.id === id);
      if (!next || !window.confirm(`Xóa tài khoản "${next.username}"?`)) return;
      ICTUAuth.saveUsers(users.filter(user => user.id !== id));
      render();
      toast('Đã xóa tài khoản.');
    }));
  }
  $('user-form').addEventListener('submit', event => {
    event.preventDefault();
    const error = $('user-error');
    const users = ICTUAuth.readUsers();
    const username = $('username').value.trim();
    error.textContent = '';
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) { error.textContent = 'Tên đăng nhập đã tồn tại.'; return; }
    users.push({ id: `user-${Date.now()}`, name: $('name').value.trim(), username, password: $('password').value, role: $('role').value, status: 'active', createdAt: new Date().toISOString().slice(0, 10) });
    ICTUAuth.saveUsers(users);
    event.target.reset();
    render();
    toast('Đã tạo tài khoản mới.');
  });
  render();
})();
