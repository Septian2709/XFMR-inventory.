
app_js = '''// ============================================
// INVENTARISKU - PWA Application Logic
// ============================================

// ==================== STATE ====================
let currentUser = null;
let items = [];
let history = [];
let editingId = null;
let transactingId = null;
let historyFilter = 'all';
let currentTab = 'dashboard';
let deferredPrompt = null;
let isOnline = navigator.onLine;

const CATEGORIES = {
  elektronik: { label: 'Elektronik', class: 'cat-elektronik' },
  perkakas: { label: 'Perkakas', class: 'cat-perkakas' },
  kantor: { label: 'Kantor', class: 'cat-kantor' },
  lainnya: { label: 'Lainnya', class: 'cat-lainnya' }
};

const ICONS = {
  elektronik: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  perkakas: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  kantor: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  lainnya: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
};

// ==================== DEMO DATA ====================
function loadDemoData() {
  items = [
    { id: '1', name: 'Laptop Dell Latitude 7430', category: 'elektronik', qty: 12, unit: 'unit', minStock: 3, location: 'Gudang A - Rak 1' },
    { id: '2', name: 'Printer HP LaserJet Pro', category: 'elektronik', qty: 5, unit: 'unit', minStock: 2, location: 'Gudang A - Rak 2' },
    { id: '3', name: 'Bor Listrik Bosch GSB 550', category: 'perkakas', qty: 8, unit: 'unit', minStock: 2, location: 'Gudang B - Rak 3' },
    { id: '4', name: 'Kertas A4 80gsm (500 lbr)', category: 'kantor', qty: 150, unit: 'rim', minStock: 20, location: 'Gudang C - Rak 1' },
    { id: '5', name: 'Tinta Printer Hitam HP 680', category: 'kantor', qty: 2, unit: 'pcs', minStock: 5, location: 'Gudang C - Rak 2' },
    { id: '6', name: 'Monitor LED 24" Samsung', category: 'elektronik', qty: 7, unit: 'unit', minStock: 2, location: 'Gudang A - Rak 3' }
  ];
  
  history = [
    { id: 'h1', itemId: '1', itemName: 'Laptop Dell Latitude 7430', type: 'out', qty: 2, note: 'Proyek Website - Tim Dev', date: '2026-07-10T09:30:00', user: 'admin' },
    { id: 'h2', itemId: '4', itemName: 'Kertas A4 80gsm (500 lbr)', type: 'out', qty: 10, note: 'Kebutuhan bulanan kantor', date: '2026-07-09T14:15:00', user: 'admin' },
    { id: 'h3', itemId: '1', itemName: 'Laptop Dell Latitude 7430', type: 'in', qty: 5, note: 'Restock dari supplier Dell Indonesia', date: '2026-07-08T10:00:00', user: 'admin' },
    { id: 'h4', itemId: '5', itemName: 'Tinta Printer Hitam HP 680', type: 'out', qty: 3, note: 'Cetak laporan keuangan Q2', date: '2026-07-07T16:45:00', user: 'admin' },
    { id: 'h5', itemId: '3', itemName: 'Bor Listrik Bosch GSB 550', type: 'in', qty: 2, note: 'Pembelian baru - PO #2026/07/001', date: '2026-07-06T11:20:00', user: 'admin' }
  ];
}

// ==================== AUTH ====================
function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  
  if (!user || !pass) {
    showLoginError('Username dan password wajib diisi!');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Memuat...';
  
  // Simulate auth delay
  setTimeout(() => {
    // Demo auth - in production, use proper backend
    if (user === 'admin' && pass === 'admin123') {
      currentUser = { username: user, name: user.charAt(0).toUpperCase() + user.slice(1), role: 'Administrator' };
      localStorage.setItem('inv_user', JSON.stringify(currentUser));
      
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
      document.getElementById('userAvatar').textContent = user.charAt(0).toUpperCase();
      document.getElementById('profileName').textContent = currentUser.name;
      
      loadFromLocal();
      if (items.length === 0) loadDemoData();
      renderItems();
      renderHistory();
      updateStats();
      showToast('Selamat datang, ' + currentUser.name + '! 👋', 'success');
    } else {
      showLoginError('Username atau password salah. Demo: admin / admin123');
    }
    
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }, 600);
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  document.getElementById('loginErrorMsg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('inv_user');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showToast('Berhasil keluar. Sampai jumpa! 👋', 'success');
}

// ==================== NAVIGATION ====================
function switchTab(tab) {
  currentTab = tab;
  
  document.getElementById('tabDashboard').style.display = 'none';
  document.getElementById('tabHistory').style.display = 'none';
  document.getElementById('tabSettings').style.display = 'none';
  document.getElementById('fabBtn').style.display = 'none';
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';
  document.getElementById('nav' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
  
  if (tab === 'dashboard') {
    document.getElementById('fabBtn').style.display = 'flex';
    renderItems();
  } else if (tab === 'history') {
    renderHistory();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleProfileMenu() {
  document.getElementById('profileMenu').classList.toggle('show');
}

// ==================== ITEMS ====================
function renderItems() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const clearBtn = document.getElementById('clearSearch');
  clearBtn.classList.toggle('show', search.length > 0);
  
  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search) ||
    i.category.toLowerCase().includes(search) ||
    i.location.toLowerCase().includes(search)
  );
  
  const container = document.getElementById('itemsList');
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <h3>${search ? 'Tidak ditemukan' : 'Belum ada barang'}</h3>
        <p>${search ? 'Coba kata kunci lain' : 'Tap tombol + untuk menambahkan barang pertama'}</p>
      </div>`;
    return;
  }
  
  container.innerHTML = filtered.map(item => {
    const cat = CATEGORIES[item.category] || CATEGORIES.lainnya;
    const qtyClass = item.qty <= item.minStock ? 'qty-low' : item.qty <= item.minStock * 2 ? 'qty-med' : 'qty-ok';
    const iconColor = item.category === 'elektronik' ? 'blue' : item.category === 'perkakas' ? 'orange' : item.category === 'kantor' ? 'green' : 'purple';
    const lowBadge = item.qty <= item.minStock ? '<span style="background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">STOK HABIS</span>' : '';
    
    return `
      <div class="item-card" onclick="openEditModal('${item.id}')">
        <div class="item-icon ${iconColor}">${ICONS[item.category] || ICONS.lainnya}</div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-meta">
            <span class="cat-chip ${cat.class}">${cat.label}</span>
            ${lowBadge}
            <span style="color:#bbb;">📍 ${item.location}</span>
          </div>
        </div>
        <div class="item-qty ${qtyClass}">${item.qty}</div>
        <div class="item-actions" onclick="event.stopPropagation()">
          <button class="btn-icon plus" onclick="openTransModal('${item.id}', 'in')" title="Restock">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="btn-icon minus" onclick="openTransModal('${item.id}', 'out')" title="Kurangi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterItems() {
  renderItems();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  renderItems();
  document.getElementById('searchInput').focus();
}

// ==================== HISTORY ====================
function renderHistory() {
  let filtered = history;
  if (historyFilter !== 'all') {
    filtered = history.filter(h => h.type === historyFilter);
  }
  
  const container = document.getElementById('historyList');
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3;">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <h3>Belum ada riwayat</h3>
        <p>Transaksi masuk/keluar akan muncul di sini</p>
      </div>`;
    return;
  }
  
  container.innerHTML = filtered.map(h => {
    const date = new Date(h.date);
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const typeLabel = h.type === 'in' ? '⬇️ Masuk' : '⬆️ Keluar';
    
    return `
      <div class="history-item ${h.type}">
        <div class="history-dot ${h.type}"></div>
        <div class="history-info">
          <div class="history-item-name">${h.itemName}</div>
          <div class="history-detail">${dateStr} • ${timeStr}<br>${typeLabel} • ${h.note}<br>👤 ${h.user}</div>
        </div>
        <div class="history-qty ${h.type}">${h.type === 'in' ? '+' : '−'}${h.qty}</div>
      </div>
    `;
  }).join('');
}

function setHistoryFilter(filter) {
  historyFilter = filter;
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', 
      (filter === 'all' && i === 0) || 
      (filter === 'in' && i === 1) || 
      (filter === 'out' && i === 2)
    );
  });
  renderHistory();
}

// ==================== MODALS ====================
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '➕ Tambah Barang';
  document.getElementById('itemName').value = '';
  document.getElementById('itemCategory').value = 'elektronik';
  document.getElementById('itemQty').value = '';
  document.getElementById('itemUnit').value = '';
  document.getElementById('itemMin').value = '';
  document.getElementById('itemLocation').value = '';
  document.getElementById('btnDelete').style.display = 'none';
  showModal('itemModal');
}

function openEditModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  
  editingId = id;
  document.getElementById('modalTitle').textContent = '✏️ Edit Barang';
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemQty').value = item.qty;
  document.getElementById('itemUnit').value = item.unit;
  document.getElementById('itemMin').value = item.minStock;
  document.getElementById('itemLocation').value = item.location;
  document.getElementById('btnDelete').style.display = 'block';
  showModal('itemModal');
}

function showModal(id) {
  const overlay = document.getElementById(id);
  overlay.classList.add('active');
  // Trigger reflow for animation
  void overlay.offsetWidth;
  overlay.classList.add('show');
  
  // Focus first input
  setTimeout(() => {
    const firstInput = overlay.querySelector('input:not([readonly])');
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('show');
    setTimeout(() => m.classList.remove('active'), 300);
  });
}

function openTransModal(id, type) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  
  transactingId = id;
  document.getElementById('transModalTitle').textContent = type === 'in' ? '📥 Restock Barang' : '📤 Catat Penggunaan';
  document.getElementById('transItemName').value = item.name;
  document.getElementById('transType').value = type;
  document.getElementById('transQty').value = '';
  document.getElementById('transNote').value = '';
  showModal('transModal');
}

function closeTransModal() {
  closeModal();
}

// ==================== CRUD ====================
function saveItem() {
  const name = document.getElementById('itemName').value.trim();
  const category = document.getElementById('itemCategory').value;
  const qty = parseInt(document.getElementById('itemQty').value) || 0;
  const unit = document.getElementById('itemUnit').value.trim() || 'pcs';
  const minStock = parseInt(document.getElementById('itemMin').value) || 0;
  const location = document.getElementById('itemLocation').value.trim() || '-';
  
  if (!name) {
    showToast('Nama barang wajib diisi!', 'error');
    return;
  }
  
  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], name, category, qty, unit, minStock, location };
      showToast('✅ Barang berhasil diperbarui', 'success');
    }
  } else {
    const newItem = {
      id: Date.now().toString(),
      name, category, qty, unit, minStock, location
    };
    items.push(newItem);
    showToast('✅ Barang berhasil ditambahkan', 'success');
  }
  
  saveToLocal();
  closeModal();
  renderItems();
  updateStats();
}

function deleteItem() {
  if (!editingId) return;
  if (!confirm('Yakin ingin menghapus barang ini? Data tidak bisa dikembalikan.')) return;
  
  items = items.filter(i => i.id !== editingId);
  // Also remove related history
  history = history.filter(h => h.itemId !== editingId);
  
  saveToLocal();
  closeModal();
  renderItems();
  updateStats();
  showToast('🗑️ Barang dihapus', 'warning');
}

function saveTransaction() {
  const qty = parseInt(document.getElementById('transQty').value) || 0;
  const type = document.getElementById('transType').value;
  const note = document.getElementById('transNote').value.trim() || '-';
  
  if (qty <= 0) {
    showToast('Jumlah harus lebih dari 0', 'error');
    return;
  }
  
  const item = items.find(i => i.id === transactingId);
  if (!item) return;
  
  if (type === 'out' && qty > item.qty) {
    showToast('Stok tidak mencukupi! Tersisa: ' + item.qty, 'error');
    return;
  }
  
  // Update stock
  item.qty = type === 'in' ? item.qty + qty : item.qty - qty;
  
  // Add history
  history.unshift({
    id: 'h' + Date.now(),
    itemId: transactingId,
    itemName: item.name,
    type,
    qty,
    note,
    date: new Date().toISOString(),
    user: currentUser ? currentUser.username : 'unknown'
  });
  
  saveToLocal();
  closeTransModal();
  renderItems();
  renderHistory();
  updateStats();
  showToast(type === 'in' ? '✅ Restock berhasil dicatat' : '✅ Penggunaan berhasil dicatat', 'success');
}

// ==================== STATS ====================
function updateStats() {
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const lowStock = items.filter(i => i.qty <= i.minStock).length;
  
  animateNumber('statTotal', totalQty);
  animateNumber('statItems', items.length);
  animateNumber('statLow', lowStock);
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  const duration = 400;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ==================== LOCAL STORAGE ====================
function saveToLocal() {
  localStorage.setItem('inv_items', JSON.stringify(items));
  localStorage.setItem('inv_history', JSON.stringify(history));
  updateSyncStatus('pending');
}

function loadFromLocal() {
  const savedItems = localStorage.getItem('inv_items');
  const savedHistory = localStorage.getItem('inv_history');
  const savedUser = localStorage.getItem('inv_user');
  const savedSettings = localStorage.getItem('inv_settings');
  
  if (savedItems) {
    try { items = JSON.parse(savedItems); } catch(e) { items = []; }
  }
  if (savedHistory) {
    try { history = JSON.parse(savedHistory); } catch(e) { history = []; }
  }
  if (savedUser) {
    try { currentUser = JSON.parse(savedUser); } catch(e) { currentUser = null; }
  }
  if (savedSettings) {
    try {
      const s = JSON.parse(savedSettings);
      document.getElementById('sheetId').value = s.sheetId || '';
      document.getElementById('apiKey').value = s.apiKey || '';
    } catch(e) {}
  }
}

function saveSettings() {
  const settings = {
    sheetId: document.getElementById('sheetId').value.trim(),
    apiKey: document.getElementById('apiKey').value.trim()
  };
  localStorage.setItem('inv_settings', JSON.stringify(settings));
  showToast('✅ Pengaturan disimpan', 'success');
}

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem('inv_settings') || '{}');
  } catch(e) { return {}; }
}

// ==================== GOOGLE DRIVE SYNC ====================
function updateSyncStatus(status) {
  const el = document.getElementById('syncStatus');
  const configs = {
    synced: { class: 'sync-badge synced', html: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Tersinkron' },
    pending: { class: 'sync-badge pending', html: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Belum Sinkron' },
    offline: { class: 'sync-badge offline', html: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> Offline' },
    syncing: { class: 'sync-badge syncing', html: '<div class="spinner"></div> Menyinkron...' }
  };
  const cfg = configs[status] || configs.offline;
  el.className = cfg.class;
  el.innerHTML = cfg.html;
}

function checkSyncStatus() {
  const status = document.getElementById('syncStatus').className;
  if (status.includes('pending')) {
    showToast('Data belum disinkronkan ke Google Drive. Tap menu profil > Sinkron.', 'warning');
  } else if (status.includes('offline')) {
    showToast('Anda sedang offline. Data tersimpan lokal.', 'warning');
  } else {
    showToast('Data sudah tersinkron dengan Google Drive ✅', 'success');
  }
}

async function syncToDrive() {
  const settings = getSettings();
  if (!settings.sheetId || !settings.apiKey) {
    showToast('Lengkapi pengaturan Google Drive terlebih dahulu!', 'error');
    switchTab('settings');
    return;
  }
  
  if (!isOnline) {
    showToast('Anda sedang offline. Sinkronisasi ditunda.', 'warning');
    updateSyncStatus('offline');
    return;
  }
  
  updateSyncStatus('syncing');
  showLoading('Menyinkronkan ke Google Drive...');
  
  try {
    // Prepare data for Google Sheets
    const itemsHeader = [['ID', 'Nama Barang', 'Kategori', 'Jumlah', 'Satuan', 'Min Stok', 'Lokasi', 'Terakhir Update']];
    const itemsData = items.map(i => [
      i.id, i.name, i.category, i.qty, i.unit, i.minStock, i.location, new Date().toISOString()
    ]);
    
    const historyHeader = [['ID', 'Item ID', 'Nama Barang', 'Jenis', 'Jumlah', 'Catatan', 'Tanggal', 'User']];
    const historyData = history.map(h => [
      h.id, h.itemId, h.itemName, h.type, h.qty, h.note, h.date, h.user
    ]);
    
    // Update Items sheet
    await updateSheet(settings.sheetId, settings.apiKey, 'Items', itemsHeader.concat(itemsData));
    
    // Update History sheet
    await updateSheet(settings.sheetId, settings.apiKey, 'History', historyHeader.concat(historyData));
    
    updateSyncStatus('synced');
    showToast('✅ Berhasil sinkron ke Google Drive!', 'success');
  } catch (e) {
    console.error('Sync error:', e);
    updateSyncStatus('offline');
    showToast('❌ Gagal sinkron: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function loadFromDrive() {
  const settings = getSettings();
  if (!settings.sheetId || !settings.apiKey) {
    showToast('Lengkapi pengaturan Google Drive terlebih dahulu!', 'error');
    switchTab('settings');
    return;
  }
  
  if (!isOnline) {
    showToast('Anda sedang offline. Tidak bisa memuat dari Drive.', 'warning');
    return;
  }
  
  showLoading('Memuat data dari Google Drive...');
  
  try {
    // Load Items
    const itemsData = await readSheet(settings.sheetId, settings.apiKey, 'Items');
    if (itemsData && itemsData.length > 1) {
      items = itemsData.slice(1).map(row => ({
        id: row[0] || Date.now().toString(),
        name: row[1] || '',
        category: row[2] || 'lainnya',
        qty: parseInt(row[3]) || 0,
        unit: row[4] || 'pcs',
        minStock: parseInt(row[5]) || 0,
        location: row[6] || '-'
      })).filter(i => i.name);
    }
    
    // Load History
    const historyData = await readSheet(settings.sheetId, settings.apiKey, 'History');
    if (historyData && historyData.length > 1) {
      history = historyData.slice(1).map(row => ({
        id: row[0] || 'h' + Date.now(),
        itemId: row[1] || '',
        itemName: row[2] || '',
        type: row[3] || 'out',
        qty: parseInt(row[4]) || 0,
        note: row[5] || '-',
        date: row[6] || new Date().toISOString(),
        user: row[7] || 'unknown'
      })).filter(h => h.itemName);
    }
    
    saveToLocal();
    renderItems();
    renderHistory();
    updateStats();
    updateSyncStatus('synced');
    showToast('✅ Data berhasil dimuat dari Google Drive', 'success');
  } catch (e) {
    console.error('Load error:', e);
    showToast('❌ Gagal memuat: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function updateSheet(sheetId, apiKey, range, values) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}!A1:H${values.length}?valueInputOption=RAW&key=${apiKey}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values })
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return await response.json();
}

async function readSheet(sheetId, apiKey, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}!A1:H1000?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const data = await response.json();
  return data.values || [];
}

async function testConnection() {
  const settings = getSettings();
  if (!settings.sheetId || !settings.apiKey) {
    showToast('Lengkapi ID Spreadsheet dan API Key terlebih dahulu!', 'error');
    return;
  }
  
  showLoading('Menguji koneksi...');
  try {
    const data = await readSheet(settings.sheetId, settings.apiKey, 'Items');
    hideLoading();
    showToast(`✅ Koneksi berhasil! Sheet "Items" memiliki ${data.length} baris.`, 'success');
  } catch (e) {
    hideLoading();
    showToast('❌ Koneksi gagal: ' + e.message, 'error');
  }
}

// ==================== EXPORT ====================
function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    user: currentUser,
    items: items,
    history: history
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventarisku-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Data berhasil di-export', 'success');
}

// ==================== LOADING ====================
function showLoading(text) {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ==================== PWA INSTALL ====================
function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        showToast('✅ Aplikasi berhasil di-install!', 'success');
      }
      deferredPrompt = null;
      dismissInstall();
    });
  }
}

function dismissInstall() {
  document.getElementById('installPrompt').classList.remove('show');
  localStorage.setItem('inv_install_dismissed', '1');
}

// ==================== EVENT LISTENERS ====================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('inv_install_dismissed')) {
    setTimeout(() => {
      document.getElementById('installPrompt').classList.add('show');
    }, 2000);
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  dismissInstall();
  showToast('🎉 Aplikasi berhasil di-install!', 'success');
});

window.addEventListener('online', () => {
  isOnline = true;
  updateSyncStatus('pending');
  showToast('🌐 Koneksi internet tersambung', 'success');
});

window.addEventListener('offline', () => {
  isOnline = false;
  updateSyncStatus('offline');
  showToast('📴 Anda sedang offline. Data tersimpan lokal.', 'warning');
});

document.addEventListener('click', function(e) {
  const menu = document.getElementById('profileMenu');
  const user = document.querySelector('.header-user');
  if (menu && !menu.contains(e.target) && user && !user.contains(e.target)) {
    menu.classList.remove('show');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('profileMenu').classList.remove('show');
  }
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    if (currentTab === 'dashboard') {
      document.getElementById('searchInput').focus();
    }
  }
});

// ==================== INIT ====================
window.onload = function() {
  loadFromLocal();
  
  if (currentUser) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = currentUser.name;
    if (items.length === 0) loadDemoData();
    renderItems();
    renderHistory();
    updateStats();
    
    if (!isOnline) updateSyncStatus('offline');
  }
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  }
};
'''

with open(f"{output_dir}/app.js", "w", encoding="utf-8") as f:
    f.write(app_js)

print("✅ app.js created")
