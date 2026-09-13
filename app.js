// app.js
// Frontend logic: talks to the REST API, renders the table, and runs
// client-side validation. NOTE: this validation is only a UX convenience —
// the backend re-validates everything, since client-side checks can be bypassed.

const API_BASE = '/api';

const state = {
  page: 1,
  limit: 10,
  search: '',
  departmentId: '',
  status: '',
  sortBy: 'created_at',
  order: 'desc',
  departments: []
};

// ---------- DOM refs ----------
const els = {
  tableBody: document.getElementById('studentTableBody'),
  emptyState: document.getElementById('emptyState'),
  searchInput: document.getElementById('searchInput'),
  departmentFilter: document.getElementById('departmentFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortBy: document.getElementById('sortBy'),
  orderToggle: document.getElementById('orderToggle'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
  modal: document.getElementById('studentModal'),
  modalTitle: document.getElementById('modalTitle'),
  form: document.getElementById('studentForm'),
  addBtn: document.getElementById('addStudentBtn'),
  closeModal: document.getElementById('closeModal'),
  cancelForm: document.getElementById('cancelForm'),
  departmentSelect: document.getElementById('department'),
  toast: document.getElementById('toast')
};

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  await loadDepartments();
  await loadStudents();
  bindEvents();
});

function bindEvents() {
  let debounceTimer;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadStudents();
    }, 350); // debounce so we don't hit the API on every keystroke
  });

  els.departmentFilter.addEventListener('change', (e) => {
    state.departmentId = e.target.value;
    state.page = 1;
    loadStudents();
  });

  els.statusFilter.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadStudents();
  });

  els.sortBy.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    loadStudents();
  });

  els.orderToggle.addEventListener('click', () => {
    const next = state.order === 'desc' ? 'asc' : 'desc';
    state.order = next;
    els.orderToggle.textContent = next === 'desc' ? '↓ Desc' : '↑ Asc';
    els.orderToggle.dataset.order = next;
    loadStudents();
  });

  els.prevPage.addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadStudents(); }
  });
  els.nextPage.addEventListener('click', () => {
    state.page++; loadStudents();
  });

  els.addBtn.addEventListener('click', () => openModal());
  els.closeModal.addEventListener('click', closeModal);
  els.cancelForm.addEventListener('click', closeModal);
  els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });

  els.form.addEventListener('submit', handleSubmit);

  // live validation as the user types/blurs
  els.form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      input.dataset.touched = 'true';
      if (input.dataset.touched) validateField(input);
    });
  });
}

// ---------- API helpers ----------
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.payload = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function loadDepartments() {
  const res = await api('/departments');
  state.departments = res.data;
  const opts = state.departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  els.departmentFilter.insertAdjacentHTML('beforeend', opts);
  els.departmentSelect.insertAdjacentHTML('beforeend', opts);
}

async function loadStudents() {
  const params = new URLSearchParams({
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    order: state.order
  });
  if (state.search) params.set('search', state.search);
  if (state.departmentId) params.set('departmentId', state.departmentId);
  if (state.status) params.set('status', state.status);

  try {
    const res = await api(`/students?${params.toString()}`);
    renderTable(res.data);
    renderPagination(res.meta);
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------- Rendering ----------
function renderTable(students) {
  els.tableBody.innerHTML = '';
  els.emptyState.classList.toggle('hidden', students.length > 0);

  for (const s of students) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.department_name || '—')}</td>
      <td><span class="status-badge status-${s.status}">${s.status}</span></td>
      <td>${formatDate(s.enrollment_date)}</td>
      <td>
        <button class="btn-link" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="btn-link" data-action="delete" data-id="${s.id}" style="color:var(--danger)">Delete</button>
      </td>
    `;
    els.tableBody.appendChild(tr);
  }

  els.tableBody.querySelectorAll('[data-action="edit"]').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.id))
  );
  els.tableBody.querySelectorAll('[data-action="delete"]').forEach(btn =>
    btn.addEventListener('click', () => deleteStudent(btn.dataset.id))
  );
}

function renderPagination(meta) {
  els.pageInfo.textContent = `Page ${meta.page} of ${meta.totalPages || 1} (${meta.total} students)`;
  els.prevPage.disabled = meta.page <= 1;
  els.nextPage.disabled = meta.page >= meta.totalPages;
}

// ---------- Modal / form ----------
async function openModal(id = null) {
  els.form.reset();
  clearErrors();
  document.getElementById('studentId').value = '';

  if (id) {
    els.modalTitle.textContent = 'Edit Student';
    try {
      const res = await api(`/students/${id}`);
      const s = res.data;
      document.getElementById('studentId').value = s.id;
      document.getElementById('firstName').value = s.first_name;
      document.getElementById('lastName').value = s.last_name;
      document.getElementById('email').value = s.email;
      document.getElementById('phone').value = s.phone || '';
      document.getElementById('dob').value = s.date_of_birth ? s.date_of_birth.slice(0, 10) : '';
      document.getElementById('department').value = s.department_id || '';
      document.getElementById('status').value = s.status;
    } catch (err) {
      showToast(err.message, true);
      return;
    }
  } else {
    els.modalTitle.textContent = 'Add Student';
  }

  els.modal.classList.remove('hidden');
}

function closeModal() {
  els.modal.classList.add('hidden');
}

// ---------- Client-side validation (mirrors backend rules) ----------
const validators = {
  first_name: v => (!v.trim() ? 'First name is required' :
    !/^[A-Za-z\s'-]{1,50}$/.test(v) ? 'Only letters, spaces, - and \' allowed (max 50)' : ''),
  last_name: v => (!v.trim() ? 'Last name is required' :
    !/^[A-Za-z\s'-]{1,50}$/.test(v) ? 'Only letters, spaces, - and \' allowed (max 50)' : ''),
  email: v => (!v.trim() ? 'Email is required' :
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : ''),
  phone: v => (!v || /^[0-9+\-()\s]{7,20}$/.test(v) ? '' : 'Enter a valid phone number'),
  date_of_birth: v => (!v || new Date(v) < new Date() ? '' : 'Date of birth must be in the past')
};

function validateField(input) {
  const rule = validators[input.name];
  if (!rule) return true;
  const message = rule(input.value);
  showFieldError(input.name, message);
  return !message;
}

function showFieldError(field, message) {
  const el = document.querySelector(`.error-msg[data-for="${field}"]`);
  if (el) el.textContent = message;
  const input = document.querySelector(`[name="${field}"]`);
  if (input) input.classList.toggle('invalid', Boolean(message));
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.form-group input').forEach(el => el.classList.remove('invalid'));
}

function validateForm(formData) {
  let valid = true;
  for (const field of Object.keys(validators)) {
    const value = formData.get(field) || '';
    const message = validators[field](value);
    showFieldError(field, message);
    if (message) valid = false;
  }
  return valid;
}

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(els.form);

  if (!validateForm(formData)) {
    showToast('Please fix the highlighted fields', true);
    return;
  }

  const payload = {
    first_name: formData.get('first_name').trim(),
    last_name: formData.get('last_name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim() || null,
    date_of_birth: formData.get('date_of_birth') || null,
    department_id: formData.get('department_id') || null,
    status: formData.get('status')
  };

  const id = document.getElementById('studentId').value;

  try {
    if (id) {
      await api(`/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Student updated');
    } else {
      await api('/students', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Student added');
    }
    closeModal();
    loadStudents();
  } catch (err) {
    // Surface backend validation errors (e.g. duplicate email) on the right fields
    if (err.payload?.errors) {
      err.payload.errors.forEach(e => showFieldError(e.field, e.message));
    } else {
      showToast(err.message, true);
    }
  }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student? This cannot be undone.')) return;
  try {
    await api(`/students/${id}`, { method: 'DELETE' });
    showToast('Student deleted');
    loadStudents();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------- Utils ----------
function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle('error', isError);
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
