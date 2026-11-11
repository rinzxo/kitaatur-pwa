export interface ReleaseSection {
  category: string
  items: string[]
}

export interface Release {
  version: string
  date: string
  title: string
  description?: string
  sections: ReleaseSection[]
}

export const changelogData: Release[] = [
  {
    version: 'v2.6.0',
    date: '11 November 2026',
    title: 'Aplikasi Android (.APK), Desktop Windows (.EXE) & Tampilan Hero Interaktif',
    description: 'Peluncuran aplikasi mandiri Android dan Windows desktop, animasi mockup hero dinamis, desain baru FAQ interaktif modern, dan sertifikasi standar keamanan AES-256.',
    sections: [
      {
        category: 'Fitur Baru',
        items: [
          'Aplikasi Android Mandiri (.apk): pasang langsung di smartphone tanpa browser. Dilengkapi pemindai kamera QR presensi instan dan login Google terintegrasi.',
          'Aplikasi Desktop Windows (.exe): installer resmi untuk PC dan laptop oleh RINZ GROUP INOVASI untuk mempermudah ketua dan bendahara mengelola pembukuan di layar penuh.',
          'Pusat Unduhan Aplikasi: bagian baru di halaman utama (#unduh) untuk mengunduh installer APK Android (3.8 MB) dan Windows EXE (81 MB) secara langsung.',
          'FAQ Modern Interaktif: desain baru berbasis accordion yang ringkas dan responsif, dilengkapi tombol bantuan langsung via WhatsApp dan Email.'
        ]
      },
      {
        category: 'Peningkatan',
        items: [
          'Animasi Mockup Hero Dinamis: tampilan aplikasi Dasbor Kas dan Kartu Presensi QR kini bertukar posisi depan dan belakang secara otomatis dan mulus.',
          'Efek Shine Glass Elegan: aksen kilau kaca profesional pada judul utama "Lebih Modern & Praktis".',
          'Sertifikasi Standar Keamanan AES-256: lencana segel emas resmi enkripsi tingkat tinggi perbankan pada footer situs.',
          'Tautan Instagram Ekosistem: akses langsung ke akun Instagram resmi @kitaekosistem.id pada footer.',
          'Tipografi Mobile Proporsional: penataan ulang ukuran heading dan teks agar tidak menumpuk di layar ponsel.'
        ]
      },
      {
        category: 'Perbaikan',
        items: [
          'Stabilitas Login Google di Android: mengatasi kendala sesi OAuth yang sempat terputus pada aplikasi Android WebView.',
          'Ikon Peluncur Aplikasi Android: menyematkan ikon resmi KitaAtur adaptif beresolusi tinggi di layar utama ponsel.'
        ]
      }
    ]
  },
  {
    version: 'v2.5.1',
    date: '4 November 2026',
    title: 'Stabilitas Login Google & Pemulihan Sesi Akun',
    description: 'Pembaruan untuk memastikan proses masuk dengan Google berjalan mulus tanpa kendala sesi atau cookie di seluruh peramban.',
    sections: [
      {
        category: 'Perbaikan',
        items: [
          'Stabilitas Login Google: menyelesaikan kendala pengguna yang terpental kembali ke halaman login saat masuk menggunakan akun Google.',
          'Pembersihan Cookie Otomatis: sistem otomatis membersihkan sisa cookie lama dari browser tanpa mengharuskan pengguna menghapus data situs manual.',
          'Sinkronisasi Pengalihan OAuth: memastikan token autentikasi diproses langsung ke dasbor saat pengalihan selesai.',
          'Pemilihan Akun Google: menampilkan dialog pemilihan akun Google agar pengguna dapat memilih email yang tepat dengan mudah.'
        ]
      }
    ]
  },
  {
    version: 'v2.5.0',
    date: '1 November 2026',
    title: 'Sistem Voucher Diskon & Notifikasi Siaran',
    description: 'Pembaruan untuk mendukung potongan harga langganan menggunakan kode voucher dan sistem pengumuman yang lebih terintegrasi.',
    sections: [
      {
        category: 'Fitur Baru',
        items: [
          'Voucher Diskon Langganan: masukkan kode voucher saat ingin bayar langganan untuk mendapatkan potongan diskon persen maupun nominal rupiah.',
          'Aktivasi Gratis Instan: voucher dengan diskon 100% langsung mengaktifkan langganan tanpa perlu pembayaran.',
          'Kelola Voucher Admin: panel untuk membuat voucher, mengatur kuota pemakaian, masa berlaku, dan memilih paket langganan yang berlaku.',
          'Pesan Siaran ke Notifikasi: pengumuman dari admin otomatis masuk ke daftar notifikasi seluruh anggota.'
        ]
      },
      {
        category: 'Peningkatan',
        items: [
          'Pemberitahuan Lebih Nyaman: spanduk pengumuman di aplikasi kini hanya muncul satu kali agar tidak mengganggu navigasi.',
          'Halaman Catatan Pembaruan: akses langsung riwayat pembaruan sistem melalui halaman utama.'
        ]
      },
      {
        category: 'Perbaikan',
        items: [
          'Konsistensi nama organisasi pada menu samping.',
          'Sapaan nama pengguna di bagian atas layar kini lebih rapi dan bersih.',
          'Akses rute menu voucher di panel admin.'
        ]
      }
    ]
  },
  {
    version: 'v2.4.0',
    date: '28 Oktober 2026',
    title: 'Dasbor Sekolah & Keluarga Organisasi',
    description: 'Ruang kendali khusus institusi pendidikan dan pengelolaan banyak cabang dalam satu akun.',
    sections: [
      {
        category: 'Fitur Baru',
        items: [
          'Dasbor Khusus Sekolah: pemantauan kehadiran siswa dan guru serta rekapitulasi keuangan dalam satu layar terpadu.',
          'Paket Keluarga Organisasi: hubungkan cabang organisasi tanpa biaya tambahan menggunakan Kode Keluarga dan tombol cepat pindah cabang.'
        ]
      },
      {
        category: 'Peningkatan',
        items: [
          'Panduan Kilat Pengurus Baru: panduan 1 menit untuk membantu organisasi baru langsung siap pakai mengatur uang kas dan jadwal presensi.',
          'Menu navigasi bawah di ponsel kini lebih rapi, minimalis, dan nyaman digunakan.'
        ]
      }
    ]
  },
  {
    version: 'v2.3.0',
    date: '15 Oktober 2026',
    title: 'Pemeriksaan Foto Presensi AI & Ekspor Excel',
    description: 'Peningkatan akurasi presensi menggunakan kecerdasan buatan dan kemudahan unduh laporan keuangan.',
    sections: [
      {
        category: 'Fitur Baru',
        items: [
          'Pemeriksaan Foto Presensi dengan AI: mendeteksi keaslian foto kehadiran anggota secara otomatis untuk mencegah kecurangan.',
          'Ekspor Laporan ke Excel: unduh rekapitulasi uang kas, pembayaran iuran, dan kehadiran anggota ke lembar kerja Excel siap cetak.'
        ]
      },
      {
        category: 'Peningkatan',
        items: [
          'Peningkatan akurasi titik lokasi GPS saat presensi dan perlindungan dari aplikasi lokasi palsu.',
          'Pengaturan hak akses yang lebih aman dan teratur untuk Bendahara, Sekretaris, dan Anggota.'
        ]
      }
    ]
  },
  {
    version: 'v2.0.0',
    date: '1 Oktober 2026',
    title: 'Peluncuran Aplikasi KitaAtur Baru',
    description: 'Rilis versi baru yang lebih cepat, ringan, dan mendukung pemasangan langsung di ponsel.',
    sections: [
      {
        category: 'Fitur Baru',
        items: [
          'Dapat dipasang langsung di layar utama ponsel Android maupun iPhone layaknya aplikasi biasa.',
          'Kode QR Presensi Cerdas: berganti otomatis secara berkala agar tidak bisa difoto atau dibagikan ke orang lain.',
          'Pencatatan Keuangan Lengkap: kelola kas tunai, rekening bank, dan dompet digital organisasi dalam satu sistem yang transparan.'
        ]
      }
    ]
  }
]
