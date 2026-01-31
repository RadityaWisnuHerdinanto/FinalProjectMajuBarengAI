import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';
const PORT = 3000;

// Storage untuk conversation history per session
const sessions = new Map();

// System instruction untuk education bot
const SYSTEM_INSTRUCTION = `Kamu adalah Education Bot, asisten pembelajaran yang ramah dan sabar untuk semua mata pelajaran.

Peranmu:
- Membantu siswa memahami konsep di berbagai mata pelajaran (Matematika, Sains, Bahasa Inggris, IPA, IPS, dll)
- Menggunakan metode Socratic (bertanya balik) untuk merangsang pemikiran kritis
- Memberikan penjelasan step-by-step yang mudah dipahami
- Menyesuaikan bahasa dengan tingkat pemahaman siswa
- Mendorong siswa untuk berpikir sendiri dengan hints dan clues
- Bersikap positif dan memotivasi siswa dalam belajar

Gaya mengajar:
- Gunakan bahasa Indonesia yang santai namun edukatif
- Berikan analogi atau contoh kehidupan sehari-hari untuk mempermudah pemahaman
- Jika siswa bertanya soal, tanyakan dulu "Apa yang sudah kamu coba?" atau "Bagian mana yang membingungkan?"
- Pecah masalah kompleks menjadi langkah-langkah kecil yang mudah diikuti
- Berikan emoji untuk membuat pembelajaran lebih menyenangkan 📚✨
- Puji usaha dan progress siswa untuk meningkatkan motivasi

Mata pelajaran yang bisa dibantu:
- Matematika (Aljabar, Geometri, Kalkulus, Statistika, dll)
- Sains (Fisika, Kimia, Biologi)
- Bahasa Inggris (Grammar, Vocabulary, Reading Comprehension, Writing)
- Bahasa Indonesia
- Ilmu Pengetahuan Alam (IPA)
- Ilmu Pengetahuan Sosial (IPS)
- Dan mata pelajaran lainnya

Jangan:
- Langsung memberikan jawaban lengkap tanpa proses pembelajaran
- Menggunakan bahasa yang terlalu teknis atau rumit tanpa penjelasan
- Membuat siswa merasa bodoh atau gagal
- Menolak pertanyaan di luar akademik, tapi arahkan kembali ke pembelajaran dengan lembut

Selalu tanyakan di akhir apakah siswa sudah paham atau butuh penjelasan lebih lanjut.`;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// Configure multer untuk upload gambar (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  }
});

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
    sessions.set(sessionId, {
      history: [],
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

// Convert image buffer to base64 untuk Gemini
function imageToBase64(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType
    }
  };
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
      'POST /api/chat': 'Kirim pesan (body: sessionId, message) atau conversation array',
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

// Chat endpoint (support both old format with conversation array and new format with sessionId)
app.post('/api/chat', async (req, res) => {
    const { conversation, sessionId, message } = req.body;
    
    try {
        // Format baru dengan session management
        if (sessionId && message) {
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'message tidak boleh kosong',
                });
            }
            
            const session = getSession(sessionId);
            
            // Tambahkan pesan user ke history
            session.history.push({
                role: 'user',
                parts: [{ text: message }]
            });
            
            // Buat contents dengan system instruction
            const contents = [
                ...session.history
            ];
            
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config: {
                    temperature: 0.7,
                    systemInstruction: SYSTEM_INSTRUCTION,
                }
            });
            
            const responseText = response.text;
            
            // Tambahkan response ke history
            session.history.push({
                role: 'model',
                parts: [{ text: responseText }]
            });
            
            session.messageCount++;
            
            return res.status(200).json({
                success: true,
                sessionId,
                result: responseText,
                messageCount: session.messageCount,
            });
        }
        
        // Format lama dengan conversation array (backward compatibility)
        if (conversation) {
            if (!Array.isArray(conversation)) throw new Error('Messages must be an array');

            const contents = conversation.map(({ role, text }) => ({
                role,
                parts: [{ text }]
            }));

            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config: {
                    temperature: 0.7,
                    systemInstruction: SYSTEM_INSTRUCTION,
                }
            });
            
            return res.status(200).json({ result: response.text });
        }
        
        // Jika tidak ada format yang cocok
        return res.status(400).json({
            success: false,
            error: 'Kirim dengan format: { sessionId, message } atau { conversation: [...] }',
        });
        
    } catch (e) {
        res.status(500).json({ 
            success: false,
            error: e.message 
        });
    }
});

// Chat dengan gambar - ENDPOINT BARU!
app.post('/api/chat-with-image', upload.single('image'), async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const imageFile = req.file;
        
        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'sessionId dan message wajib diisi'
            });
        }
        
        if (!imageFile) {
            return res.status(400).json({
                success: false,
                error: 'Gambar tidak ditemukan'
            });
        }
        
        const session = getSession(sessionId);
        
        // Konversi gambar ke format Gemini
        const imageData = imageToBase64(imageFile.buffer, imageFile.mimetype);
        
        // Tambahkan pesan user dengan gambar ke history
        session.history.push({
            role: 'user',
            parts: [
                { text: message },
                imageData
            ]
        });
        
        // Generate response dengan vision
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: session.history,
            config: {
                temperature: 0.7,
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });
        
        const responseText = response.text;
        
        // Tambahkan response ke history
        session.history.push({
            role: 'model',
            parts: [{ text: responseText }]
        });
        
        session.messageCount++;
        
        return res.status(200).json({
            success: true,
            sessionId,
            result: responseText,
            messageCount: session.messageCount,
            hasImage: true
        });
        
    } catch (e) {
        console.error('Error chat with image:', e);
        res.status(500).json({ 
            success: false,
            error: e.message 
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
  
  // Format history untuk response
  const formattedHistory = session.history.map((item, index) => ({
    id: index + 1,
    role: item.role,
    text: item.parts[0]?.text || '[Media content]',
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
      'POST /api/chat': 'Kirim pesan',
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
  console.log(`📚 Education Bot API running on http://localhost:${PORT}`);
  console.log(`✨ Ready to help students learn all subjects!`);
  console.log(`\n💡 Quick start:`);
  console.log(`   1. POST http://localhost:${PORT}/session/new`);
  console.log(`   2. POST http://localhost:${PORT}/api/chat dengan body: { sessionId, message }`);
});