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
