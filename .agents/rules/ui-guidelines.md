# KitaAtur UI & Brand Guidelines (Anti-AI Slop)

Setiap kontributor, pengembang, dan AI Assistant **DILARANG KERAS** melenceng dari standar identitas visual, token warna, tipografi, dan prinsip kebersihan desain berikut:

## 1. Identitas Brand & Token Warna Resmi
- **Brand Primary (Blue)**: `#0087FF` / `brand-blue` (Aksi utama, tombol primer, link aktif)
- **Brand Secondary (Cyan)**: `#01C4FB` / `brand-cyan` (Aksen gradien halus)
- **Brand Soft (Light Cyan)**: `#E0F4FE` / `brand-light` (Background item aktif, badge info)
- **Brand Dark**: `#006BD1` / `brand-dark` (State hover tombol utama)
- **Page Canvas (Background)**: `#F8FAFC` (`bg-slate-50`)
- **Card / Surface**: `#FFFFFF` (`bg-white`)
- **Border**: `border-slate-200` atau `border-slate-200/80` (1px)
- **Text**: `text-slate-900` (utama), `text-slate-600`/`text-slate-500` (sekunder), `text-slate-400` (muted)
- **DILARANG**: Warna kuning/amber neon, emas, ungu cyberpunk, atau tema gaming discord gelap yang tidak relevan.

## 2. Tipografi & Font
- **Font Wajib**: Hanya gunakan **`Inter`** (`font-sans`).
- **DILARANG** mengimpor font lain.

## 3. Aturan Anti "AI Slop"
- **DILARANG** membuat badge gaming murahan/alay seperti `"GOD MODE"`, `"SUPERADMIN ACCESS"` (dengan glow neon), `"ULTRA"`. Gunakan teks biasa atau badge minimalis: `bg-blue-50 text-[#007AE6] border border-blue-200/60 font-semibold text-xs px-2 py-0.5 rounded-full`.
- **DILARANG** menyematkan emoji/emotikon pada heading, tombol, atau label (misal: ⚡, 🔥, 🚀, 👑, ✨, ⚠️). Gunakan SVG Icon resmi dari `lucide-react` atau `@phosphor-icons/react`.
- **Gunakan Logo Resmi**: Selalu gunakan `<img src="/logo.png" alt="KitaAtur" />`, dilarang mengganti logo dengan icon petir, mahkota, atau bentuk arbitrary lainnya.
- **Konsistensi Radius**: Kartu menggunakan `rounded-2xl` atau `rounded-3xl` dengan `border border-slate-200/80`. Tombol menggunakan `rounded-xl` atau `rounded-2xl`.
