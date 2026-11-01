# KitaAtur UI & Brand Guidelines (Anti-AI Slop)

Dokumen ini adalah aturan mutlak (**Zero-Tolerance Rules**) dalam perancangan dan implementasi antarmuka pengguna (UI/UX) di seluruh ekosistem **KitaAtur** (Aplikasi Utama, Portal Publik, dan Panel Admin).

Setiap kontributor, pengembang, dan AI Assistant **DILARANG KERAS** melenceng dari standar identitas visual, token warna, tipografi, dan prinsip kebersihan desain yang tertulis di bawah ini.

---

## 1. Identitas Brand & Token Warna Resmi

KitaAtur mengusung estetika **Clean, Modern, Trustworthy B2B SaaS**. Gunakan hanya token warna yang telah didefinisikan dalam `frontend/tailwind.config.ts` dan `globals.css`:

| Token | Nilai Hex / Tailwind | Penggunaan |
| :--- | :--- | :--- |
| **Brand Primary (Blue)** | `#0087FF` / `brand-blue` | Aksi utama, link aktif, tombol primer, aksen fokus |
| **Brand Secondary (Cyan)** | `#01C4FB` / `brand-cyan` | Gradien aksen halus, indikator sekunder |
| **Brand Soft (Light Cyan)**| `#E0F4FE` / `brand-light` | Background item aktif, badge info, hover state lembut |
| **Brand Dark** | `#006BD1` / `brand-dark` | State hover untuk tombol `#0087FF` |
| **Page Canvas (Background)** | `#F8FAFC` (`bg-slate-50`) | Latar belakang seluruh halaman |
| **Card / Surface** | `#FFFFFF` (`bg-white`) | Kartu konten, modal, dropdown |
| **Border Utama** | `border-slate-200` / `border-slate-200/80` | Garis tepi kartu, tabel, dan input (1px) |
| **Teks Utama** | `text-slate-900` | Judul, heading, teks dengan penekanan tinggi |
| **Teks Sekunder** | `text-slate-600` / `text-slate-500` | Paragraf pendukung, subtitle, label form |
| **Teks Muted** | `text-slate-400` | Timestamp, keterangan non-kritis, placeholder |

### ❌ Larangan Keras Terkait Warna:
- **DILARANG** menggunakan warna kuning/amber neon, emas, ungu cyberpunk, atau tema gelap ala gamer/discord yang tidak ada hubungannya dengan KitaAtur.
- **DILARANG** menggunakan warna random di luar palet Tailwind Slate & KitaAtur Brand.
- Warna status harus semantik:
  - Sukses: `emerald-600` / `emerald-50`
  - Bahaya/Error: `rose-600` / `rose-50`
  - Peringatan: `amber-600` / `amber-50`
  - Info: `blue-600` / `blue-50`

---

## 2. Tipografi & Font

- **Font Wajib**: Hanya gunakan **`Inter`** (`font-sans`).
- **DILARANG** mengimpor atau mengganti font keluarga lain (seperti Roboto, Poppins, Montserrat, atau font dekoratif/gaming).
- **Hirarki Ukuran Standar**:
  - H1 / Judul Halaman: `text-2xl font-bold tracking-tight text-slate-900`
  - H2 / Judul Kartu: `text-lg font-bold text-slate-900`
  - H3 / Sub-judul: `text-base font-semibold text-slate-800`
  - Label Input: `text-xs font-semibold text-slate-700` atau `text-xs font-bold uppercase tracking-wider text-slate-400`
  - Body Text: `text-sm text-slate-600 leading-relaxed`
  - Keterangan Kecil: `text-xs text-slate-400`

---

## 3. Aturan Anti "AI Slop" (Kualitas Desain Premium)

AI sering kali secara spontan menghasilkan elemen visual norak atau berlebihan ("AI Slop"). Seluruh UI KitaAtur dilindungi dari hal-hal berikut:

### ❌ 1. Hentikan Badge & Label Alay / Gaming
- **DILARANG** menyematkan badge seperti:
  - `"GOD MODE"`
  - `"SUPERADMIN ACCESS"` (dengan border neon/glow)
  - `"ULTRA / HYPER"`
  - Badge pill melayang dengan efek blur atau glow pelangi berlebihan.
- **Penyelesaian yang Benar**: Cukup gunakan teks bersih atau badge profesional sederhana, contoh: `<span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#007AE6] border border-blue-200/60 font-semibold">Admin</span>`.

### ❌ 2. Dilarang Menyebar Emotikon / Emojis Sembarangan
- **DILARANG** menyisipkan emoji pada heading, tombol, atau label form (contoh: ⚡ Dashboard, 🔥 Fitur Baru, 👑 Superadmin, 🚀 Masuk Sekarang, ⚠️ Perhatian, 💥 Boom).
- **Penyelesaian yang Benar**: Gunakan **icon SVG resmi** dari library `@phosphor-icons/react` atau `lucide-react` dengan stroke bersih (`w-4 h-4` atau `w-5 h-5`) dan warna yang terkalibrasi (`text-slate-400` atau `text-[#0087FF]`).

### ❌ 3. Gunakan Logo Asli KitaAtur, Bukan Ikon Random
- Setiap kali menampilkan branding KitaAtur, **WAJIB** menggunakan file aset logo resmi:
  ```tsx
  <img src="/logo.png" alt="KitaAtur" className="w-8 h-8 object-contain" />
  ```
- **DILARANG** menggantikan logo KitaAtur dengan icon petir (⚡), mahkota (👑), bintang (⭐), perisai sembarangan, atau kotak warna kuning/emas.

### ❌ 4. Bentuk Komponen & Radius Konsisten
- Kartu Kontainer: `rounded-2xl` atau `rounded-3xl` dengan `border border-slate-200/80 shadow-xs`.
- Tombol & Form Input: `rounded-xl` atau `rounded-2xl` dengan transisi halus (`transition-all active:scale-[0.98]`).
- Jangan gunakan bayangan gelap berat (`shadow-2xl` hitam pekat) kecuali untuk modal dialog overlay di atas backdrop.

---

## 4. Standar Desain Tombol (Buttons)

1. **Tombol Utama (Primary)**:
   - `bg-[#0087FF] hover:bg-[#0077E6] text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition shadow-2xs`
   - Atau untuk hero CTA: `bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold`
2. **Tombol Sekunder (Secondary/Outline)**:
   - `bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl px-4 py-2.5 transition`
3. **Tombol Netral/Subtle**:
   - `bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-1.5 transition`
4. **Tombol Bahaya (Destructive)**:
   - `bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm rounded-xl px-3 py-1.5 transition` (atau solid `bg-rose-600 text-white` untuk aksi permanen).

---

## 5. Checklist Verifikasi Sebelum Menyimpan Kode UI

Sebelum menyelesaikan pengerjaan halaman/komponen:
- [ ] Apakah warna primer konsisten dengan `#0087FF` dan canvas `bg-slate-50`?
- [ ] Apakah ada badge norak bergaya "gamer" atau glow yang tidak pantas? (Jika ada, hapus segera).
- [ ] Apakah ada emoji yang diselipkan di judul/tombol? (Jika ada, ganti dengan Lucide/Phosphor icon).
- [ ] Apakah menggunakan logo resmi `/logo.png`?
- [ ] Apakah font tetap `Inter` tanpa ada inline style font aneh?
- [ ] Apakah tampilan rapi, bersih, profesional, dan responsif pada layar ponsel?
