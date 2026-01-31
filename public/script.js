const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const statusText = document.getElementById('status');

// Sidebar elements
const sidebar = document.getElementById('sidebar');
const sessionsList = document.getElementById('sessions-list');
const toggleSidebar = document.getElementById('toggle-sidebar');
const toggleSidebarMobile = document.getElementById('toggle-sidebar-mobile');
const sidebarOpenBtn = document.getElementById('sidebar-open-btn');
const mainContainer = document.querySelector('.main-container');

// Image upload elements
const imageInput = document.getElementById('image-input');
const uploadBtn = document.getElementById('upload-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

// Buttons
const btnStats = document.getElementById('btn-stats');
const btnHistory = document.getElementById('btn-history');
const btnNewSession = document.getElementById('btn-new-session');
const btnClear = document.getElementById('btn-clear');

// Modals
const modalStats = document.getElementById('modal-stats');
const modalHistory = document.getElementById('modal-history');

// Image lightbox elements
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

let sessionId = null;
let isLoading = false;
let allSessions = [];
let selectedImage = null; // Store selected image file
let selectedImageBase64 = null; // Store base64 for display in chat

// API Base URL
const API_BASE = 'http://localhost:3000';

// ==================== NOTIFICATION HELPERS ====================

// Show success toast
function showSuccess(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  }).showToast();
}

// Show error toast
function showError(message) {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "right",
    style: {
      background: "linear-gradient(to right, #ff6b6b, #ee5a6f)",
    },
  }).showToast();
}

// Show info toast
function showInfo(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: "linear-gradient(to right, #667eea, #764ba2)",
    },
  }).showToast();
}

// Show confirmation dialog
async function showConfirm(title, text, confirmText = 'Ya', cancelText = 'Batal') {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#4facfe',
    cancelButtonColor: '#6c757d',
    background: '#343541',
    color: '#ececf1',
    customClass: {
      popup: 'swal-dark',
    }
  });
  return result.isConfirmed;
}

// ==================== SIDEBAR FUNCTIONS ====================

// Toggle sidebar
function toggleSidebarFunction() {
  sidebar.classList.toggle('collapsed');
  mainContainer.classList.toggle('sidebar-collapsed');
  sidebarOpenBtn.classList.toggle('visible');
}

toggleSidebar.addEventListener('click', toggleSidebarFunction);
toggleSidebarMobile.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});
sidebarOpenBtn.addEventListener('click', toggleSidebarFunction);

// Load all sessions
async function loadSessions() {
  try {
    const response = await fetch(`${API_BASE}/sessions`);
    const data = await response.json();
    
    if (data.success && data.sessions) {
      allSessions = data.sessions;
      renderSessions();
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
    sessionsList.innerHTML = '<div class="empty-state"><p>Gagal memuat sessions</p></div>';
    showError('Gagal memuat daftar sessions');
  }
}

// Render sessions list
function renderSessions() {
  if (allSessions.length === 0) {
    sessionsList.innerHTML = '<div class="empty-state"><p>Belum ada session</p></div>';
    return;
  }
  
  sessionsList.innerHTML = '';
  allSessions.forEach(session => {
    const sessionItem = document.createElement('div');
    sessionItem.classList.add('session-item');
    if (session.sessionId === sessionId) {
      sessionItem.classList.add('active');
    }
    
    const createdAt = new Date(session.createdAt).toLocaleString('id-ID', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    sessionItem.innerHTML = `
      <div class="session-info">
        <div class="session-title">Chat Session</div>
        <div class="session-meta">${session.messageCount} pesan • ${createdAt}</div>
      </div>
      <button class="session-delete" data-session-id="${session.sessionId}">×</button>
    `;
    
    // Click to switch session
    sessionItem.querySelector('.session-info').addEventListener('click', () => {
      switchSession(session.sessionId);
    });
    
    // Delete session
    sessionItem.querySelector('.session-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirm(
        'Hapus Session?',
        'Session ini akan dihapus permanen',
        'Hapus',
        'Batal'
      );
      if (confirmed) {
        await deleteSessionById(session.sessionId);
      }
    });
    
    sessionsList.appendChild(sessionItem);
  });
}

// Switch to different session
async function switchSession(newSessionId) {
  if (newSessionId === sessionId) return;
  
  sessionId = newSessionId;
  chatBox.innerHTML = '';
  
  // Load history for this session
  try {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);
    const data = await response.json();
    
    if (data.success && data.history) {
      data.history.forEach(item => {
        appendMessage(item.role === 'user' ? 'user' : 'bot', item.text);
      });
      statusText.textContent = `Session dimuat (${data.totalMessages} pesan) 📚`;
      showSuccess('Session berhasil dimuat!');
    }
    
    renderSessions(); // Update active state
  } catch (error) {
    console.error('Error switching session:', error);
    showError('Gagal memuat session');
  }
}

// Delete session by ID
async function deleteSessionById(sid) {
  try {
    const response = await fetch(`${API_BASE}/session/${sid}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Session berhasil dihapus');
      
      // If deleted current session, create new one
      if (sid === sessionId) {
        chatBox.innerHTML = '';
        sessionId = null;
        await initializeSession();
      }
      
      // Reload sessions list
      await loadSessions();
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    showError('Gagal menghapus session');
  }
}

// Initialize session when page loads
async function initializeSession() {
  try {
    statusText.textContent = 'Memulai session...';
    const response = await fetch(`${API_BASE}/session/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (data.success && data.sessionId) {
      sessionId = data.sessionId;
      statusText.textContent = 'Siap membantu belajar! 📚';
      appendMessage('bot', 'Halo! Saya Tidars, siap membantu kamu belajar berbagai mata pelajaran seperti Matematika, Sains, Bahasa Inggris, dan lainnya. Ada yang bisa saya bantu? 😊');
      
      // Reload sessions list
      await loadSessions();
    } else {
      statusText.textContent = 'Gagal memulai session';
      console.error('Failed to create session:', data);
    }
  } catch (error) {
    statusText.textContent = 'Error: Tidak dapat terhubung ke server';
    console.error('Error initializing session:', error);
    appendMessage('bot', 'Maaf, terjadi kesalahan saat memulai session. Pastikan server berjalan di http://localhost:3000');
  }
}

// Send message to API
async function sendMessage(message) {
  if (!sessionId) {
    appendMessage('bot', 'Mohon tunggu, session sedang diinisialisasi...');
    await initializeSession();
    if (!sessionId) return;
  }

  isLoading = true;
  statusText.textContent = 'Bot sedang berpikir...';

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        message: message,
      }),
    });

    const data = await response.json();

    if (data.success && data.result) {
      appendMessage('bot', data.result);
      statusText.textContent = `Siap membantu belajar! (${data.messageCount} pesan) 📚`;
    } else {
      appendMessage('bot', `Error: ${data.error || 'Terjadi kesalahan'}`);
      statusText.textContent = 'Error';
    }
  } catch (error) {
    console.error('Error sending message:', error);
    appendMessage('bot', 'Maaf, terjadi kesalahan saat mengirim pesan. Coba lagi ya!');
    statusText.textContent = 'Error';
  } finally {
    isLoading = false;
  }
}

// Send message with image to API (NEW!)
async function sendMessageWithImage(message, imageFile) {
  if (!sessionId) {
    appendMessage('bot', 'Mohon tunggu, session sedang diinisialisasi...');
    await initializeSession();
    if (!sessionId) return;
  }

  isLoading = true;
  statusText.textContent = 'Bot sedang menganalisis gambar...';

  try {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('message', message);
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE}/api/chat-with-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.result) {
      appendMessage('bot', data.result);
      statusText.textContent = `Siap membantu belajar! (${data.messageCount} pesan) 📚`;
      showSuccess('Gambar berhasil dianalisis! 📸');
    } else {
      appendMessage('bot', `Error: ${data.error || 'Terjadi kesalahan'}`);
      statusText.textContent = 'Error';
      showError('Gagal menganalisis gambar');
    }
  } catch (error) {
    console.error('Error sending message with image:', error);
    appendMessage('bot', 'Maaf, terjadi kesalahan saat mengirim gambar. Coba lagi ya!');
    statusText.textContent = 'Error';
    showError('Gagal mengirim gambar');
  } finally {
    isLoading = false;
  }
}


// ==================== IMAGE UPLOAD HANDLERS ====================

// Handle upload button click
uploadBtn.addEventListener('click', () => {
  imageInput.click();
});

// Handle image selection
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Hanya file gambar yang diperbolehkan!');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Ukuran gambar maksimal 5MB!');
      return;
    }
    
    selectedImage = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImageBase64 = e.target.result; // Save for chat display
      imagePreview.src = e.target.result;
      imagePreviewContainer.style.display = 'block';
      showInfo('Gambar dipilih! Tulis pertanyaan tentang gambar ini.');
    };
    reader.readAsDataURL(file);
  }
});

// Handle remove image
removeImageBtn.addEventListener('click', () => {
  selectedImage = null;
  selectedImageBase64 = null;
  imagePreview.src = '';
  imagePreviewContainer.style.display = 'none';
  imageInput.value = '';
  showInfo('Gambar dihapus');
});

// Handle form submission
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage || isLoading) return;

  // Check if there's an image
  if (selectedImage && selectedImageBase64) {
    appendMessage('user', userMessage, selectedImageBase64); // Show text + image
    input.value = '';
    input.disabled = true;
    await sendMessageWithImage(userMessage, selectedImage);
    // Clear image after sending
    selectedImage = null;
    selectedImageBase64 = null;
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
    imageInput.value = '';
  } else {
    appendMessage('user', userMessage); // Show text only
    input.value = '';
    input.disabled = true;
    await sendMessage(userMessage);
  }
  
  input.disabled = false;
  input.focus();
});

// Append message to chat box
function appendMessage(sender, text, imageDataUrl = null) {
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('message-wrapper', sender);

  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  // If there's an image, add it first
  if (imageDataUrl) {
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('message-image-container');
    
    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.classList.add('message-image');
    img.alt = 'Uploaded image';
    
    // Add click handler to open lightbox
    img.addEventListener('click', () => {
      openImageLightbox(imageDataUrl);
    });
    
    imgContainer.appendChild(img);
    msg.appendChild(imgContainer);
  }
  
  // Add text content
  const textContent = document.createElement('div');
  textContent.classList.add('message-text');
  const formattedText = formatMessage(text);
  textContent.innerHTML = formattedText;
  msg.appendChild(textContent);
  
  msgWrapper.appendChild(msg);
  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Simple text formatting
function formatMessage(text) {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

// ==================== STATS FEATURE ====================
btnStats.addEventListener('click', async () => {
  if (!sessionId) {
    showInfo('Session belum dimulai!');
    return;
  }

  openModal(modalStats);
  document.getElementById('stats-content').innerHTML = '<div class="loading">Memuat...</div>';

  try {
    const response = await fetch(`${API_BASE}/session/${sessionId}/stats`);
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      const createdAt = new Date(stats.createdAt).toLocaleString('id-ID');
      const lastActivity = new Date(stats.lastActivity).toLocaleString('id-ID');

      document.getElementById('stats-content').innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Total Pesan</span>
          <span class="stat-value">${stats.totalMessages} pesan</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Durasi</span>
          <span class="stat-value">${stats.durationMinutes} menit</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Dibuat</span>
          <span class="stat-value">${createdAt}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Aktivitas Terakhir</span>
          <span class="stat-value">${lastActivity}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Status</span>
          <span class="stat-value" style="color: #4caf50;">✓ Aktif</span>
        </div>
      `;
    } else {
      document.getElementById('stats-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p>Gagal memuat statistik</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    document.getElementById('stats-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p>Terjadi kesalahan saat memuat statistik</p>
      </div>
    `;
  }
});

// ==================== HISTORY FEATURE ====================
btnHistory.addEventListener('click', async () => {
  if (!sessionId) {
    showInfo('Session belum dimulai!');
    return;
  }

  openModal(modalHistory);
  document.getElementById('history-content').innerHTML = '<div class="loading">Memuat...</div>';

  try {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);
    const data = await response.json();

    if (data.success && data.history && data.history.length > 0) {
      let historyHtml = '';
      data.history.forEach((item) => {
        const roleLabel = item.role === 'user' ? '👤 Kamu' : '🤖 Tidars';
        historyHtml += `
          <div class="history-item ${item.role}">
            <div class="history-label">${roleLabel}</div>
            <div class="history-text">${formatMessage(item.text)}</div>
          </div>
        `;
      });
      document.getElementById('history-content').innerHTML = historyHtml;
    } else {
      document.getElementById('history-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>Belum ada percakapan</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    document.getElementById('history-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p>Terjadi kesalahan saat memuat riwayat</p>
      </div>
    `;
  }
});

// ==================== NEW SESSION FEATURE ====================
btnNewSession.addEventListener('click', async () => {
  const confirmed = await showConfirm(
    'Session Baru?',
    'Chat saat ini akan tetap tersimpan di sidebar',
    'Ya, Buat Baru',
    'Batal'
  );
  
  if (confirmed) {
    chatBox.innerHTML = '';
    sessionId = null;
    await initializeSession();
  }
});

// ==================== CLEAR/DELETE SESSION FEATURE ====================
btnClear.addEventListener('click', async () => {
  if (!sessionId) {
    showInfo('Tidak ada session aktif!');
    return;
  }

  const confirmed = await showConfirm(
    'Hapus Chat?',
    'Semua percakapan akan dihapus permanen',
    'Hapus',
    'Batal'
  );
  
  if (confirmed) {
    await deleteSessionById(sessionId);
  }
});

// ==================== MODAL CONTROLS ====================
function openModal(modal) {
  modal.classList.add('show');
}

function closeModal(modal) {
  modal.classList.remove('show');
}

// Close buttons
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modalId = e.target.getAttribute('data-modal');
    closeModal(document.getElementById(modalId));
  });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal(e.target);
  }
});

// ==================== IMAGE LIGHTBOX ====================

// Open image lightbox
function openImageLightbox(imageUrl) {
  lightboxImage.src = imageUrl;
  imageLightbox.style.display = 'flex';
}

// Close image lightbox
function closeImageLightbox() {
  imageLightbox.style.display = 'none';
  lightboxImage.src = '';
}

// Close lightbox on close button click
if (lightboxClose) {
  lightboxClose.addEventListener('click', closeImageLightbox);
}

// Close lightbox on background click
if (imageLightbox) {
  imageLightbox.addEventListener('click', (e) => {
    if (e.target === imageLightbox) {
      closeImageLightbox();
    }
  });
}

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && imageLightbox.style.display === 'flex') {
    closeImageLightbox();
  }
});

// Initialize session on page load
initializeSession();
loadSessions();
