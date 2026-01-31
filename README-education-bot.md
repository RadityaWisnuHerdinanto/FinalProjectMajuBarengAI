# 🎓 Tidars - Education Bot

**Tidars** adalah Education Bot yang menggunakan Gemini AI dengan conversation history dan session management untuk pembelajaran interaktif semua mata pelajaran (Matematika, Fisika, Kimia, Biologi, Bahasa Inggris, dll).

## ✨ Fitur Utama

### 1. **Session Management**
- Setiap user punya session terpisah dengan conversation history
- Auto-cleanup session yang tidak aktif > 1 jam
- Tracking statistik per session
- ChatGPT-style sidebar untuk navigasi antar session

### 2. **System Instruction sebagai Tutor**
Bot dirancang sebagai tutor yang:
- Menggunakan metode Socratic (bertanya balik)
- Tidak langsung memberikan jawaban, tapi membimbing
- Step-by-step explanation
- Bahasa Indonesia yang santai & edukatif
- Positif dan memotivasi
- Mendukung semua mata pelajaran

### 3. **Modern UI/UX**
- Dark theme dengan blue gradient accents
- ChatGPT-style sidebar untuk session management
- Custom notifications dengan Toastify & SweetAlert2
- Responsive design untuk mobile & desktop
- Smooth animations dan transitions

### 4. **Conversation History**
- Semua percakapan tersimpan per session
- Bot ingat konteks percakapan sebelumnya
- Bisa ganti topik dalam session yang sama
- Lihat history kapan saja lewat UI atau API

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install express @google/generative-ai dotenv cors
```

### 2. Setup Environment
Buat file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Run Server
```bash
node index.js
```

Server akan jalan di `http://localhost:3000`

### 4. Akses Web Interface
Buka browser: `http://localhost:3000`

**Fitur UI:**
- Sidebar kiri untuk session management
- New Session, Stats, History, Clear chat
- Switch antar session dengan smooth transition
- Delete session langsung dari sidebar
- Dark theme konsisten

## 📡 API Endpoints

### Basic Flow
```
1. POST /session/new        → Dapat sessionId
2. POST /api/chat           → Mulai belajar (text-only)
3. GET /session/:id         → Lihat history
4. GET /session/:id/stats   → Lihat statistik
5. GET /sessions            → List semua session
6. DELETE /session/:id      → Hapus session
```

### Detail Endpoints

#### 1. Create Session
```http
POST /session/new
```
**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "message": "Session baru berhasil dibuat",
  "expiresIn": "1 jam sejak aktivitas terakhir"
}
```
 (Text-Only)
```http
POST /api/chat
Content-Type: application/json

{
  "sessionId": "uuid-here",
  "message": "Bagaimana cara menyelesaikan 2x + 5 = 15?"
}
```
**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "message": "Wah, soal persamaan linear! 📝 Coba pikirkan dulu, kalau 2x + 5 = 15, berarti 2x-nya sama dengan berapa ya? (Hint: kurangi kedua sisi dengan 5 dulu)",
  "messageCount": 1
}
```

**Alternative (Backward Compatible):**
```http
POST /api/chat
Content-Type: application/json

{
  "conversation": [
    { "role": "user", "parts": [{ "text": "Jelaskan fotosintesis" }] }
  ]
  "imageAnalyzed": true
}
```

#### 4. Get History
```http
GET /session/:sessionId
```
**Response:**
```json
{
  "success": true,
  "se3. Get History
```http
GET /session/:sessionId
```
**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "history": [
    {
      "id": 1,
      "role": "user",
      "text": "Bagaimana cara menyelesaikan 2x + 5 = 15?"
    },
    {
      "id": 2,
      "role": "model",
      "text": "Wah, soal persamaan linear!..."
    }
  ],
  "totalMessages": 2,
  "createdAt": "2026-01-27T...",
  "lastActivity": "2026-01-27T..."
}
```

#### 4. Get Session Stats
```http
GET /session/:sessionId/stats
```
**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "stats": {
    "messageCount": 5,
    "duration": "15 menit",
    "createdAt": "2026-01-29T10:00:00",
    "lastActivity": "2026-01-29T10:15:00"
  }
}

### Via Web Interface (Recommended)
1. Jalankan server: `node index.js`
2. Buka browser: `http://localhost:3000`
3. Klik "New Session" untuk memulai
4. Ketik pertanyaan di input box
5. Gunakan sidebar untuk switch antar session
6. Test fitur Stats, History, Clear, Delete

### Via Postman
1. **Import Collection:**
   - Buka Postman
   - Import `Education_Bot.postman_collection.json`

2. **Run Sequential:**
   - Test 1: Create Session (sessionId otomatis tersimpan)
   - Test 2-4: Chat berbagai topik (text-only)
   - Test 5-6: Lihat history & stats
   - Test 7-8: List sessions & delete session
   - Test 9: E
**Response:**
```json
{
  "success": true,
  "message": "Session berhasil dihapus"
}
2. **Run Sequential:**
   - Test 1: Create Session (sessionId otomatis tersimpan)
   - Test 2-4: Chat berbagai topik (lihat conversation history)
   - Test 5: Upload gambar soal
   - Test 6-7: Lihat history & stats
   - Test 8-10: Admin & error handling

3. **Run All Tests:**
   - Klik kanan collection → "Run collection"
   - Semua test otomatis jalan sequential

## 🎯 Contoh Use Case

### Scenario 1: Belajar Matematika
```
User: "Saya tidak paham cara faktorisasi x² + 5x + 6"
Bot: "Baik! Pertama, coba ingat-ingat: faktorisasi itu mencari dua bilangan yang kalau dikali hasilnya 6, dan kalau dijumlah hasilnya 5. Kira-kira dua bilangan apa ya? 🤔"

User: "2 dan 3?"
Bot: "Betul sekali! 🎉 Jadi x² + 5x + 6 bisa difaktorkan jadi (x + 2)(x + 3). Sekarang coba buktikan dengan mengalikan balik..."
```

### Scenario 2: Upload Soal Foto
```
User: [Upload foto diagram lingkaran]
     "Tolong jelaskan cara mencari luas daerah yang diarsir"

Bot: "Oke saya lihat gambarnya! 📷 Ini ada lingkaran dengan jari-jari 7 cm dan ada bagian yang diarsir ya...

     Untuk mencari luas daerah arsir, kita perlu:
     1. Hitung luas lingkaran penuh dulu
     2. Hitung luas bagian yang tidak diarsir
     3. Kurangkan

     Nah, coba kamu hitung dulu luas lingkaran penuhnya. Rumusnya apa? 😊"
```

### Scenario 3: Multi-Topik dalam 1 Session
```
User: "Tadi kita bahas matematika, sekarang saya mau tanya tentang fotosintesis"
Bot: "Oke, ganti ke Biologi ya! 🌱 Fotosintesis itu proses tumbuhan 'masak makanan' sendiri..."
[Bot masih ingat context matematika sebelumnya jika user balik lagi]
```

## 🔍 Perbedaan dengan Kode Lama

| Aspek | Kode Lama (index.js) | Kode Baru (education-bot.js) |
|-------|---------------------|------------------------------|
| **Session** | ❌ Tidak ada | ✅ Per-user session dengan UUID |
| **History** | ❌ Setiap request baru | ✅ Conversation tersimpan |
| *🎨 Tech Stack

### Backend
- **Node.js + Express.js** - Server framework
- **Google Gemini AI** (gemini-2.0-flash-exp) - AI engine
- **UUID** - Session ID generation
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 + CSS3** - Semantic markup & modern styling
- **Toastify.js** - Toast notifications (success/error/info)
- **SweetAlert2** - Beautiful confirmation dialogs
- **Dark Theme** - ChatGPT-inspired UI (#343541, #202123)
- **Blue Gradients** - Brand color (#4facfe → #00f2fe)

### Features
- **Session Management** - UUID-based with auto-cleanup
- **Conversation History** - Persistent per session
- **Sidebar Navigation** - ChatGPT-style session list
- **Responsive Design** - Mobile & desktop friendly
- **Custom Notifications** - Toastify + SweetAlert2
- **Smooth Animations** - CSS transitions & transforms

## 📂 File Structure

```
FinalProjectMajuBarengAI/
├── index.js                              # Backend server & AI logic
├── package.json                          # Dependencies
├── .env                                  # API keys (gitignored)
├── Education_Bot.postman_collection.json # API testing
├── README-education-bot.md               # Documentation
└── public/                               # Frontend files
    ├── index.html                        # Main UI structure
    ├── script.js                         # Frontend logic
    └── style.css                         # Dark theme styling
```
   - History bisa dilihat kapan saja

2. **Untuk Production:**
   - Implement database untuk persistent storage
   - Add user authentication
   - Rate limiting per session
   - Logging untuk analytics

3. **Best Practices:**
   - Buat session baru per user
   - Hapus session setelah selesai belajar
   - Gunakan image chat untuk soal visual
   - Manfaatkan conversation history

## 🎓 Philosophy Bot

Bot ini dirancang dengan prinsip:
- **Tidak spoon-feeding:** Membimbing, bukan memberikan jawaban mentah
### Backend (index.js)
Edit `SYSTEM_INSTRUCTION` untuk:
- Ubah personality bot
- Adjust teaching style (Socratic method)
- Add specific subject focus
- Change language (default: Bahasa Indonesia)
- Adjust temperature (default: 0.7 untuk konsistensi)

### Frontend (public/)
**index.html:**
- Ubah bot name dari "Tidars"
- Tambah/kurangi action buttons
- Modifikasi modal structure

**script.js:**
- Customize notification messages
- Adjust toast duration & position
- Modify SweetAlert2 styling
- Add new features (export chat, search, dll)

**style.css:**
- Change color scheme (default: blue gradient)
- Adjust sidebar width (default: 280px)
- Modify dark theme colors
- Update responsive breakpoints
## 📊 Monitoring

Lihat active sessions:
```http
GET /sessions
```
## 🎯 Notification System

### Toast Notifications (Toastify)
- **Success** (Blue Gradient): Session created, deleted, switched
- **Error** (Red Gradient): API errors, network issues
- **Info** (Purple Gradient): Stats, history opened
- **Duration**: 3 seconds with smooth fade
- **Position**: Top-right corner

### Confirmation Dialogs (SweetAlert2)
- **Dark Theme**: Matches app theme (#343541)
- **Custom Buttons**: Blue gradient confirm, gray cancel
- **Use Cases**: New session, clear chat, delete session
- **Keyboard Support**: Enter = confirm, Esc = cancel

## 📱 Responsive Design

### Desktop (>768px)
- Sidebar visible, 280px width
- Main container margin-left 280px
- Full feature access

### Mobile (≤768px)
- Sidebar hidden by default (slide-in on toggle)
- Main container full width
- Touch-friendly buttons
- Mobile-optimized inputs

## 🚀 Future Improvements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication & authorization
- [ ] Export chat history (PDF/TXT)
- [ ] Search functionality in history
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Rate limiting per user
- [ ] Image upload re-implementation
- [ ] Code syntax highlighting

## 📝 Notes

- **Text-Only**: Image upload fitur dihapus, fokus ke text chat
- **Session Cleanup**: Auto-delete session tidak aktif >1 jam
- **Temperature**: 0.7 untuk balance antara kreativitas & konsistensi
- **Backward Compatible**: Support format conversation array legacy
- **No Database**: Session stored in memory (restart = data hilang)

---

**Tidars Education Bot** - Learn smarter, not harder 🎓✨
GET /session/:id
GET /session/:id/stats
```

## 🔧 Customization

Edit `SYSTEM_INSTRUCTION` di [education-bot.js](education-bot.js#L11-L35) untuk:
- Ubah personality bot
- Adjust teaching style
- Add specific subject focus
- Change language

## 🐛 Error Handling

Semua error response format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details if available"
}
```

Common errors:
- 400: Bad request (missing sessionId, message, etc)
- 404: Session not found
- 500: Internal server error (Gemini API issue)

---

**Note:** Ini adalah improvement dari `index.js` yang fokus untuk chatbot edukatif dengan conversation memory. Untuk use case multimodal yang berbeda-beda tanpa perlu history, `index.js` tetap valid.
