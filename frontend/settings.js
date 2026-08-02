/**
 * BMS Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const logoutBtn = document.getElementById('logout-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username-input').value;
    const bio = document.getElementById('bio-input').value;
    
    document.getElementById('display-name-heading').textContent = username;
    alert('Settings saved successfully!');
  });

  logoutBtn.addEventListener('click', () => {
    window.location.href = 'auth.html';
  });
});
