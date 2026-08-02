/**
 * BMS Contacts Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    contacts: []
  };

  const contactsList = document.getElementById('contacts-list');
  const addContactBtn = document.getElementById('add-contact-btn');
  const searchInput = document.getElementById('contact-search');

  init();

  function init() {
    addContactBtn.addEventListener('click', handleAddContact);
    searchInput.addEventListener('input', (e) => {
      renderContacts(e.target.value.trim().toLowerCase());
    });
  }

  function handleAddContact() {
    const name = prompt('Enter contact username or email:');
    if (!name || !name.trim()) return;

    const newContact = {
      id: 'c_' + Date.now(),
      name: name.trim(),
      status: 'Available'
    };

    state.contacts.push(newContact);
    renderContacts();
  }

  function renderContacts(query = '') {
    const filtered = state.contacts.filter(c => c.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      contactsList.innerHTML = '<div class="empty-notice">No contacts found</div>';
      return;
    }

    contactsList.innerHTML = '';
    filtered.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      card.innerHTML = `
        <div class="contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>
        <div class="contact-details">
          <div class="contact-name">${escapeHtml(contact.name)}</div>
          <div class="contact-status">${escapeHtml(contact.status)}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        // Navigate to chat.html to message contact
        window.location.href = 'chat.html';
      });

      contactsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
