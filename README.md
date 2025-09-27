# Accify – Voucher & Akun Premium

Frontend toko digital untuk penjualan voucher & langganan premium (YouTube, Spotify, Netflix, CapCut, ChatGPT, Discord Nitro).

## Fitur
- Katalog produk + varian durasi/tipe + kalkulasi harga
- Keranjang & checkout (form email/WA)
- Payment modal **dummy**: QRIS, VA (BCA/BNI), Transfer, E-Wallet
- Kode transaksi otomatis
- Notifikasi Telegram ketika “Saya sudah bayar”
- Halaman statis: FAQ, S&K, Privasi, Kontak
- Tema gelap/terang (toggle) & desain responsive

## Stack
HTML + CSS (custom) + JavaScript vanilla (tanpa framework).

## Menjalankan
Cukup buka `index.html` di browser.
Untuk Telegram, edit `script.js` → isi `botToken` & `chatId`.

## Catatan
Ini demo edukasi; integrasi pembayaran masih dummy.
Untuk produksi, gunakan gateway resmi & proxy serverless untuk menyembunyikan token bot.

## Lisensi
MIT
