# 🎓 Education Bot API

Education Bot yang menggunakan Gemini AI dengan conversation history dan session management untuk pembelajaran interaktif.

## ✨ Fitur Utama

### 1. **Session Management**
- Setiap user punya session terpisah dengan conversation history
- Auto-cleanup session yang tidak aktif > 1 jam
- Tracking statistik per session

### 2. **System Instruction sebagai Tutor**
Bot dirancang sebagai tutor yang:
- Menggunakan metode Socratic (bertanya balik)
- Tidak langsung memberikan jawaban, tapi membimbing
- Step-by-step explanation
- Bahasa Indonesia yang santai & edukatif
- Positif dan memotivasi

### 3. **Image Analysis**
- Upload foto soal/diagram/grafik
- Bot membantu memahami visual
- Context tetap tersimpan dalam conversation

### 4. **Conversation History**
- Semua percakapan tersimpan per session
- Bot ingat konteks percakapan sebelumnya
- Bisa ganti topik dalam session yang sama

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install express @google/generative-ai dotenv multer
```

### 2. Setup Environment
Buat file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Server
```bash
node index.js
```

Server akan jalan di `http://localhost:3000`

## 📡 API Endpoints

### Basic Flow
```
1. POST /session/new        → Dapat sessionId
2. POST /chat               → Mulai belajar
3. POST /chat/image         → Upload soal foto (optional)
4. GET /session/:id         → Lihat history
5. DELETE /session/:id      → Hapus session
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

#### 2. Chat
```http
POST /chat
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

#### 3. Chat with Image
```http
POST /chat/image
Content-Type: multipart/form-data

sessionId: uuid-here
image: [file]
question: "Tolong jelaskan cara menyelesaikan soal ini"
```
**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "message": "Oke saya lihat soalnya... [analisis gambar]",
  "messageCount": 2,
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

#### 5. Get Session Stats
```http
GET /session/:sessionId/stats
```

#### 6. List All Sessions
```http
GET /sessions
```

#### 7. Delete Session
```http
DELETE /session/:sessionId
```

## 🧪 Testing dengan Postman

1. **Import Collection:**
   - Buka Postman
   - Import `Education_Bot.postman_collection.json`

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
| **System Instruction** | ❌ Generic | ✅ Tutor edukatif dengan metode Socratic |
| **Image** | ✅ Ada tapi terpisah | ✅ Terintegrasi dalam conversation |
| **Error Handling** | ⚠️ Basic | ✅ Comprehensive dengan validation |
| **Response Format** | ⚠️ Tidak konsisten | ✅ Konsisten (success, error fields) |
| **Endpoints** | 5 endpoint media | 8 endpoint dengan management |
| **Cleanup** | ❌ Tidak ada | ✅ Auto-cleanup session lama |
| **Documentation** | ❌ Minimal | ✅ API info di root endpoint |

## 💡 Tips Penggunaan

1. **Untuk Development:**
   - Gunakan 1 session untuk testing
   - Cek `/sessions` untuk monitoring
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
- **Socratic method:** Bertanya balik untuk merangsang pemikiran
- **Step-by-step:** Pecah masalah kompleks jadi langkah kecil
- **Encouraging:** Positif dan memotivasi siswa
- **Context-aware:** Ingat percakapan sebelumnya

## 📊 Monitoring

Lihat active sessions:
```http
GET /sessions
```

Lihat detail session:
```http
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
