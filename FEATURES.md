# Fitur Aplikasi KitaAtur

KitaAtur adalah sebuah platform *Software as a Service* (SaaS) berbasis *web* yang difokuskan pada manajemen kehadiran dan pengelolaan finansial baik dalam konteks individu (Personal) maupun komunitas/kelompok (Organisasi). Aplikasi ini memanfaatkan konsep **Multi-Tenancy** untuk memastikan isolasi data dan privasi pengguna.

Berikut adalah rincian fitur-fitur yang tersedia dalam aplikasi KitaAtur:

## 1. Modul Manajemen Personal
Setiap pengguna memiliki akses ke ruang pribadinya (*Personal Space*) yang tidak bisa diakses oleh orang lain.
* **Pencatatan Keuangan Pribadi**: Pengguna dapat mencatat arus kas (Pemasukan dan Pengeluaran) secara *real-time*.
* **Dashboard Statistik Finansial**: Memantau grafik keuangan pribadi beserta riwayat kas masuk dan keluar secara terstruktur dengan dukungan pengelompokkan kategori.
* **Target & Pengingat Finansial (Goals & Reminders)**: Pengguna dapat menetapkan target tabungan/finansial (misalnya: Liburan, Beli Kendaraan), beserta tenggat waktunya (*deadline*). Sistem akan memberikan peringatan visual (*reminder*) ketika tenggat waktu semakin dekat atau jika terlewat.
* **Unggah Bukti Struk/Nota**: Pengguna dapat mengunggah bukti transaksi dalam bentuk gambar (didukung oleh infrastruktur Cloudinary).

## 2. Modul Manajemen Organisasi (Workspace)
Pengguna dapat membuat atau bergabung dengan banyak organisasi/komunitas tanpa harus membuat akun baru. Setiap organisasi memiliki *workspace*-nya sendiri.
* **Manajemen Peran & Anggota (Role-Based Access Control)**:
  * **Head (Ketua)**: Memiliki hak penuh untuk menambah anggota, mengubah peran/jabatan, serta memodifikasi organisasi.
  * **Bendahara**: Bertanggung jawab penuh atas modul keuangan organisasi.
  * **Sekretaris**: Bertanggung jawab untuk pengelolaan administrasi, di antaranya modul absensi.
  * **Member**: Anggota biasa yang bisa mengakses dashboard, melihat laporan keuangan publik (jika diizinkan), dan memindai QR absen.

* **Modul Keuangan Organisasi**:
  * **Pencatatan Kas Organisasi**: Dikelola oleh Ketua atau Bendahara. Tersedia pencatatan arus masuk dan arus keluar kas organisasi.
  * **Ekspor Laporan**: Fitur untuk mengekspor riwayat transaksi kas ke format Excel (`.xlsx`).
  * **Bukti Transaksi Organisasi**: Sama seperti modul personal, pengurus dapat melampirkan *receipt* (foto/nota kas) pada setiap entri arus kas.
  * **Goals Organisasi**: Target organisasi atau agenda terdekat dapat dilacak, memudahkan pengurus memantau keberhasilan penggalangan dana atau *timeline* program kerja.

* **Modul Absensi QR Dinamis (Attendance)**:
  * Pengurus (Sekretaris/Head) dapat men-*generate* kode QR dinamis berisi _token_ aman yang dienkripsi.
  * Anggota cukup memindai (*scan*) QR code tersebut dari ponsel masing-masing melalui fitur pemindai kamera (HTML5-QR).
  * Data absensi akan masuk secara *real-time* ke sistem *database* dengan validasi JWT untuk mencegah kecurangan.

## 3. Sistem & Infrastruktur Pendukung
* **Otentikasi Aman**: Didukung oleh ekosistem otentikasi *Supabase* untuk menjamin sesi pengguna berjalan dengan aman (mendukung proteksi *middleware* Next.js).
* **Media Storage Cloudinary**: Fitur *upload* gambar bukti menggunakan integrasi *widget* Cloudinary secara *unsigned* di sisi *client* tanpa membebani *server backend*.
* **Arsitektur Skalabel**: Menggunakan arsitektur *Monorepo* yang memisahkan *Frontend* (Next.js App Router) dan *Backend* API (Node.js/Express + Prisma ORM) demi skalabilitas di masa depan.
* **Desain UI/UX Premium**: Memanfaatkan Tailwind CSS yang menjamin interaktivitas _micro-animations_ dan mode gelap (*dark mode*) dengan palet warna yang premium dan modern.

---

> Dokumen ini disusun untuk memberikan gambaran fungsionalitas menyeluruh terkait cakupan proyek **KitaAtur**, yang dapat digunakan baik sebagai referensi pengembangan (*roadmap*) maupun materi *pitching*/marketing SaaS Anda.
