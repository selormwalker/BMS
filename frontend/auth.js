const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL + '/auth' : 'http://localhost:8000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || 'Login failed');
        return;
      }

      // Store Auth Session
      localStorage.setItem('bms_token', data.access_token);
      localStorage.setItem('bms_user', JSON.stringify(data.user));

      window.location.href = 'chat.html';
    } catch (err) {
      console.warn('Backend server offline, logging in in local mode:', err);
      // Local fallback mode if server is not started yet
      const fallbackUser = { id: 'user_1', username: identifier || 'User', email: 'user@bms.app' };
      localStorage.setItem('bms_token', 'local_dev_token');
      localStorage.setItem('bms_user', JSON.stringify(fallbackUser));
      window.location.href = 'chat.html';
    }
  });

  // Handle Registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || 'Registration failed');
        return;
      }

      // Store Auth Session
      localStorage.setItem('bms_token', data.access_token);
      localStorage.setItem('bms_user', JSON.stringify(data.user));

      window.location.href = 'chat.html';
    } catch (err) {
      console.warn('Backend server offline, registering in local mode:', err);
      const fallbackUser = { id: 'user_' + Date.now(), username, email };
      localStorage.setItem('bms_token', 'local_dev_token');
      localStorage.setItem('bms_user', JSON.stringify(fallbackUser));
      window.location.href = 'chat.html';
    }
  });
});
