﻿# Aplikasi Chat Real-time

Aplikasi chat real-time ini dibangun menggunakan React untuk frontend dan Node.js untuk backend.

## Fitur Utama

- Pesan real-time menggunakan Socket.IO
- Percakapan individu dan grup
- Autentikasi dan registrasi pengguna
- Unggah gambar untuk profil pengguna dan avatar grup
- Meneruskan pesan dan membalas pesan
- Pemilih emoji
- Fungsi pencarian untuk pengguna dan pesan

## Frontend (React)

### Komponen Utama

- Antarmuka chat
- Daftar pengguna
- Daftar percakapan
- Input pesan dengan pemilih emoji
- Fungsi unggah gambar

### Library Utama

- Socket.IO client
- React Hooks (useState, useEffect)
- Tailwind CSS untuk styling

## Backend (Node.js)

### Endpoint API

- `/register` - Registrasi pengguna
- `/login` - Autentikasi pengguna
- `/conversations` - Membuat dan mendapatkan percakapan
- `/messages` - Mengirim dan mengambil pesan
- `/users` - Mendapatkan daftar pengguna
- `/createGroup` - Membuat percakapan grup
- `/updateImg` - Memperbarui avatar pengguna atau grup

### Model

- User
- Conversations
- Messages

### Library Utama

- Express.js
- MongoDB dengan Mongoose
- Socket.IO
- bcrypt untuk hashing password
- jsonwebtoken untuk autentikasi

## Cara Instalasi

1. Clone repositori ini

```bash
git clone https://github.com/Motherbloods/Chatmessage.git
cd Chatmessage
```
2. Instal dependensi untuk backend (NodeJS)

```bash
cd server
npm install
```

3. Instal dependensi untuk frontend (React JS)

```bash
cd ../client
npm install
```

4. Siapkan database MongoDB
- Pastikan MongoDB terinstal dan berjalan di sistem Anda
- Buat database baru untuk aplikasi ini

5. Konfigurasi variabel lingkungan
- Buat file `.env` di folder server
- Tambahkan variabel berikut:

  ```
  PORT=8000
  MONGODB_URI=mongodb://localhost:27017/chat_app_db
  JWT_SECRET=rahasia_jwt_anda
  ```

6. Jalankan server backend

```bash
cd server
node app.js
```

7. Jalankan server development React

```bash
cd client
npm start
```

## Cara Penggunaan

1. Buka aplikasi di browser (biasanya di `http://localhost:3000`)
2. Daftar akun baru atau masuk dengan akun yang ada
3. Mulai percakapan dengan pengguna atau buat grup
4. Kirim pesan, emoji, dan gambar
5. Gunakan fungsi pencarian untuk menemukan pengguna atau pesan

## Pengembangan Masa Depan

- Enkripsi end-to-end
- Panggilan suara dan video
- Berbagi file
- Pengeditan dan penghapusan pesan

## Kontribusi

Kontribusi sangat diterima! Silakan ajukan Pull Request.
