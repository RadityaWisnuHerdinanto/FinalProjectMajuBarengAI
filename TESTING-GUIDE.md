# 🧪 Testing Guide - Image Upload Feature

## 📋 Test Scenarios

### ✅ Test 1: Upload Gambar Normal
1. Klik tombol 📷
2. Pilih gambar JPEG/PNG (< 5MB)
3. **Expected:** Preview muncul dengan tombol X
4. Tulis pertanyaan: "Jelaskan gambar ini"
5. Klik Kirim
6. **Expected:** Bot menganalisis dan memberikan respons

### ✅ Test 2: Validasi File Type
1. Klik tombol 📷
2. Coba upload file PDF/TXT
3. **Expected:** Error toast "Hanya file gambar yang diperbolehkan!"
4. File tidak ter-upload

### ✅ Test 3: Validasi File Size
1. Klik tombol 📷
2. Coba upload gambar > 5MB
3. **Expected:** Error toast "Ukuran gambar maksimal 5MB!"
4. File tidak ter-upload

### ✅ Test 4: Remove Image
1. Upload gambar
2. Preview muncul
3. Klik tombol X
4. **Expected:** Preview hilang, gambar ter-cancel
5. Toast "Gambar dihapus"

### ✅ Test 5: Chat Tanpa Gambar (Normal Chat)
1. **Jangan** upload gambar
2. Tulis pesan biasa: "Apa itu fotosintesis?"
3. Klik Kirim
4. **Expected:** Bot response normal (tanpa gambar)

### ✅ Test 6: Upload Soal Matematika
1. Screenshot/foto soal matematika
2. Upload gambar
3. Tulis: "Bantu jelaskan cara menyelesaikan soal ini"
4. **Expected:** Bot membaca soal dan memberikan solusi step-by-step

### ✅ Test 7: Upload Diagram
1. Upload diagram (sel, sirkuit, dll)
2. Tulis: "Jelaskan fungsi setiap bagian"
3. **Expected:** Bot mengidentifikasi dan menjelaskan bagian-bagian

### ✅ Test 8: Multiple Images (Sequential)
1. Upload gambar pertama + tanya
2. Bot response
3. Upload gambar kedua + tanya
4. **Expected:** Setiap gambar diproses terpisah
5. History mencatat keduanya

## 🔍 What to Check

### Frontend
- [ ] Upload button terlihat dan clickable
- [ ] File input ter-trigger saat klik button
- [ ] Preview muncul dengan benar
- [ ] Preview memiliki border dan shadow
- [ ] Remove button berfungsi
- [ ] Toast notifications muncul
- [ ] Loading state "Bot sedang menganalisis gambar..."

### Backend
- [ ] Endpoint `/api/chat-with-image` berfungsi
- [ ] Multer menerima file dengan benar
- [ ] Validasi file type berjalan
- [ ] Validasi file size berjalan
- [ ] Base64 conversion berhasil
- [ ] Gemini API menerima multimodal request
- [ ] Response kembali dengan sukses
- [ ] Session history menyimpan interaksi

### Network (DevTools)
- [ ] POST request ke `/api/chat-with-image`
- [ ] Content-Type: `multipart/form-data`
- [ ] Form data berisi: sessionId, message, image
- [ ] Response 200 OK
- [ ] Response body berisi `hasImage: true`

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot read property 'buffer' of undefined"
**Cause:** File tidak ter-upload dengan benar  
**Solution:** Check form encoding, pastikan `enctype="multipart/form-data"`

### Issue 2: "File size too large"
**Cause:** Gambar > 5MB  
**Solution:** Compress gambar atau resize

### Issue 3: Preview tidak muncul
**Cause:** FileReader error  
**Solution:** Check browser console, validate file type

### Issue 4: Bot tidak "melihat" gambar
**Cause:** Base64 encoding error atau Gemini API issue  
**Solution:** Check server logs, validate API key

### Issue 5: CORS error
**Cause:** Frontend dan backend berbeda origin  
**Solution:** Sudah di-handle dengan `cors()` middleware

## 📊 Test Checklist

```
[ ] Upload gambar JPG
[ ] Upload gambar PNG
[ ] Upload gambar WebP
[ ] Upload gambar GIF
[ ] Upload gambar > 5MB (should fail)
[ ] Upload file non-image (should fail)
[ ] Remove image sebelum kirim
[ ] Kirim gambar + text
[ ] Kirim text saja (tanpa gambar)
[ ] Multiple uploads dalam satu session
[ ] Check session history (gambar tercatat)
[ ] Test di Chrome
[ ] Test di Firefox
[ ] Test di Edge
[ ] Test di mobile browser
```

## 🎯 Success Criteria

Fitur dianggap berhasil jika:
1. ✅ User bisa upload gambar
2. ✅ Preview muncul dengan jelas
3. ✅ Bot bisa "membaca" dan memahami gambar
4. ✅ Response bot relevan dengan gambar
5. ✅ Validasi file berfungsi dengan baik
6. ✅ Error handling proper
7. ✅ UI/UX smooth dan intuitif
8. ✅ No memory leaks (gambar tidak tersimpan)

## 🚀 Quick Test Commands

### Start Server
```bash
cd "c:\Users\radit\Documents\FinalProjectMajuBarengAI"
node index.js
```

### Open Browser
```
http://localhost:3000
```

### Check Server Logs
Lihat console untuk:
- "Server running on port 3000"
- "POST /api/chat-with-image" ketika upload
- Error messages (jika ada)

## 📝 Test Report Template

```markdown
## Test Report - Image Upload Feature

**Date:** [Date]
**Tester:** [Name]
**Status:** ✅ PASS / ❌ FAIL

### Test Results
- [ ] Upload functionality: PASS/FAIL
- [ ] File validation: PASS/FAIL
- [ ] Preview display: PASS/FAIL
- [ ] Bot analysis: PASS/FAIL
- [ ] Error handling: PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
[Attach screenshots]

### Notes
[Additional observations]
```

---

**Happy Testing! 🎉**
