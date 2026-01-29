import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PORT = 3000;

// Storage untuk conversation history per session
const sessions = new Map();

// System instruction untuk education bot
const SYSTEM_INSTRUCTION = `Kamu adalah Education Bot, asisten pembelajaran yang ramah dan sabar.

Peranmu:
- Membantu siswa memahami konsep, bukan hanya memberikan jawaban langsung
- Menggunakan metode Socratic (bertanya balik) untuk merangsang pemikiran kritis
- Memberikan penjelasan step-by-step yang mudah dipahami
- Menyesuaikan bahasa dengan tingkat pemahaman siswa
- Mendorong siswa untuk berpikir sendiri dengan hints dan clues
- Bersikap positif dan memotivasi siswa

Gaya mengajar:
- Gunakan bahasa Indonesia yang santai namun edukatif
- Berikan analogi atau contoh kehidupan sehari-hari
- Jika siswa bertanya soal, tanyakan dulu "Apa yang sudah kamu coba?" atau "Bagian mana yang membingungkan?"
- Pecah masalah kompleks menjadi langkah-langkah kecil
- Berikan emoji untuk membuat pembelajaran lebih menyenangkan 📚✨

Jangan:
- Langsung memberikan jawaban lengkap tanpa proses pembelajaran
- Menggunakan bahasa yang terlalu teknis atau rumit
- Membuat siswa merasa bodoh atau gagal
- Menolak pertanyaan di luar akademik, tapi arahkan kembali ke pembelajaran`;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS untuk development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ==================== HELPER FUNCTIONS ====================

// Generate session ID
function generateSessionId() {
  return crypto.randomUUID();
}

// Get or create session
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      history: [],
    });
    
    sessions.set(sessionId, {
      chat,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
    });
  }
  
  // Update last activity
  const session = sessions.get(sessionId);
  session.lastActivity = new Date();
  
  return session;
}

// Clean old sessions (lebih dari 1 jam tidak aktif)
function cleanOldSessions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity.getTime() < oneHourAgo) {
      sessions.delete(sessionId);
      console.log(`Session ${sessionId} cleaned up`);
    }
  }
}

// Jalankan cleanup setiap 15 menit
setInterval(cleanOldSessions, 15 * 60 * 1000);

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Education Bot API',
    version: '1.0.0',
    endpoints: {
      'POST /session/new': 'Buat session baru',
      'POST /chat': 'Kirim pesan (body: sessionId, message)',
      'POST /chat/image': 'Analisis gambar/soal (multipart: sessionId, image, question)',
      'GET /session/:sessionId': 'Lihat riwayat chat',
      'GET /session/:sessionId/stats': 'Statistik session',
      'DELETE /session/:sessionId': 'Hapus session',
      'GET /sessions': 'List semua session aktif',
    },
    activeSessions: sessions.size,
  });
});

// Buat session baru
app.post('/session/new', (req, res) => {
  const sessionId = generateSessionId();
  getSession(sessionId); // Inisialisasi session
  
  res.json({
    success: true,
    sessionId,
    message: 'Session baru berhasil dibuat. Gunakan sessionId ini untuk semua request chat.',
    expiresIn: '1 jam sejak aktivitas terakhir',
  });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  
  // Validasi input
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId diperlukan. Buat session baru di POST /session/new',
    });
  }
  
  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'message tidak boleh kosong',
    });
  }
  
  try {
    const session = getSession(sessionId);
    const result = await session.chat.sendMessage(message);
    const response = result.response.text();
    
    session.messageCount++;
    
    res.json({
      success: true,
      sessionId,
      message: response,
      messageCount: session.messageCount,
    });
    
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal memproses pesan',
      details: error.message,
    });
  }
});

// Chat dengan gambar (untuk soal foto, diagram, dll)
app.post('/chat/image', upload.single('image'), async (req, res) => {
  const { sessionId, question } = req.body;
  
  // Validasi input
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId diperlukan',
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'image file diperlukan',
    });
  }
  
  try {
    const session = getSession(sessionId);
    
    // Convert image buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: req.file.mimetype,
      },
    };
    
    // Buat prompt dengan atau tanpa pertanyaan tambahan
    const prompt = question 
      ? `${question}\n\n[Gambar dilampirkan di atas]`
      : 'Tolong bantu saya memahami gambar ini. Apa yang perlu dijelaskan?';
    
    const result = await session.chat.sendMessage([imagePart, prompt]);
    const response = result.response.text();
    
    session.messageCount++;
    
    res.json({
      success: true,
      sessionId,
      message: response,
      messageCount: session.messageCount,
      imageAnalyzed: true,
    });
    
  } catch (error) {
    console.error('Error in image chat:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menganalisis gambar',
      details: error.message,
    });
  }
});

// Get chat history
app.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session tidak ditemukan',
    });
  }
  
  const session = sessions.get(sessionId);
  const history = session.chat._history || [];
  
  // Format history untuk response
  const formattedHistory = history.map((item, index) => ({
    id: index + 1,
    role: item.role,
    text: item.parts[0]?.text || '[Media content]',
    timestamp: null, // Gemini tidak menyimpan timestamp per message
  }));
  
  res.json({
    success: true,
    sessionId,
    history: formattedHistory,
    totalMessages: session.messageCount,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
  });
});

// Get session stats
app.get('/session/:sessionId/stats', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session tidak ditemukan',
    });
  }
  
  const session = sessions.get(sessionId);
  const duration = Date.now() - session.createdAt.getTime();
  const durationMinutes = Math.floor(duration / (60 * 1000));
  
  res.json({
    success: true,
    sessionId,
    stats: {
      totalMessages: session.messageCount,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      durationMinutes,
      isActive: true,
    },
  });
});

// Delete session
app.delete('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session tidak ditemukan',
    });
  }
  
  sessions.delete(sessionId);
  
  res.json({
    success: true,
    message: 'Session berhasil dihapus',
  });
});

// List all active sessions (untuk admin/debugging)
app.get('/sessions', (req, res) => {
  const sessionList = Array.from(sessions.entries()).map(([id, session]) => ({
    sessionId: id,
    messageCount: session.messageCount,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
  }));
  
  res.json({
    success: true,
    totalSessions: sessions.size,
    sessions: sessionList,
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan',
    availableEndpoints: {
      'POST /session/new': 'Buat session baru',
      'POST /chat': 'Kirim pesan',
      'POST /chat/image': 'Analisis gambar',
      'GET /session/:sessionId': 'Lihat riwayat',
      'DELETE /session/:sessionId': 'Hapus session',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🎓 Education Bot API running on http://localhost:${PORT}`);
  console.log(`📚 Ready to help students learn!`);
  console.log(`\n💡 Quick start:`);
  console.log(`   1. POST http://localhost:${PORT}/session/new`);
  console.log(`   2. POST http://localhost:${PORT}/chat dengan body: { sessionId, message }`);
});
