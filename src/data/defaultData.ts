import { MenuItem, AppSettings, AdminUser, DriveFile, AuditLog } from '../types';

export const MADRASAH_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="gradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231b4332" />
      <stop offset="100%" stop-color="%232d6a4f" />
    </linearGradient>
    <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23e9c46a" />
      <stop offset="100%" stop-color="%23f4a261" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="94" fill="url(%23gradEmerald)" stroke="url(%23gradGold)" stroke-width="6" />
  <circle cx="100" cy="100" r="82" fill="%23ffffff" opacity="0.08" />
  <circle cx="100" cy="100" r="76" fill="none" stroke="url(%23gradGold)" stroke-width="1.5" stroke-dasharray="4,3" />
  <!-- Crescent & Star -->
  <path d="M 98,35 A 40,40 0 1,0 138,75 A 32,32 0 1,1 98,35 Z" fill="url(%23gradGold)" />
  <polygon points="126,52 129,60 137,60 130,65 133,73 126,68 119,73 122,65 115,60 123,60" fill="url(%23gradGold)" />
  <!-- Quran / Book Emblem -->
  <path d="M 60,115 Q 100,105 140,115 L 140,145 Q 100,135 60,145 Z" fill="%23ffffff" />
  <path d="M 100,107 L 100,143" stroke="%231b4332" stroke-width="2.5" />
  <!-- Pesantren Dome -->
  <path d="M 85,92 C 85,78 100,68 100,68 C 100,68 115,78 115,92 Z" fill="url(%23gradGold)" />
  <rect x="97" y="60" width="6" height="8" fill="url(%23gradGold)" />
  <!-- Text Badge -->
  <text x="100" y="166" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23ffffff" text-anchor="middle" letter-spacing="1">MTS SUKA 2026</text>
  <text x="100" y="180" font-family="Arial, sans-serif" font-size="7.5" fill="%23e9c46a" text-anchor="middle" letter-spacing="0.5">PENDIDIKAN PESANTREN</text>
</svg>`;

export const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'PKKMMTSSUKA26',
  subtitle: 'Pendidikan Berbasis Pesantren',
  logo_url: MADRASAH_LOGO_SVG,
  primary_color: '#1b4332',
  secondary_color: '#83c5be',
  background_color: '#d6e5dd',
  background_image_url: '',
  footer_text: '© 2026 MTs Suka - Portal Penilaian Kinerja Kepala Madrasah (PKKM) Berbasis Pesantren',
  contact_email: 'apk.mts2026@gmail.com',
  contact_phone: '+62 812-3456-7890',
  academic_year: 'Tahun Ajaran 2026/2027',
  drive_root_folder_id: '1aB2cD3eF4gH5iJ6kL7mN8oP9qR_MTsSuka2026',
  spreadsheet_id: '1sPrEaDshEeT_iD_pKKMMTsSuKa2026_GoOgLeShEeT',
  gas_web_app_url: '',
  email_notifications_enabled: true,
  notification_recipient_email: 'apk.mts2026@gmail.com'
};

export const INITIAL_MENUS: MenuItem[] = [
  {
    menu_id: 'menu-usaha-pengembangan',
    nama_menu: 'A. USAHA PENGEMBANGAN MADRASAH',
    deskripsi: 'Program kerja pengembangan madrasah berbasis pesantren, kurikulum integratif, kemitraan lembaga, dan inovasi pendidikan.',
    ikon: 'TrendingUp',
    jenis_menu: 'internal',
    target_url: '/modul/usaha-pengembangan',
    drive_folder_id: '1-DRIVE-FOLDER-PENGEMBANGAN-2026',
    urutan: 1,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 08:00:00',
    updated_at: '2026-10-15 10:30:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Prioritas I'
  },
  {
    menu_id: 'menu-tugas-manajerial',
    nama_menu: 'B. PELAKSANAAN TUGAS MANAJERIAL',
    deskripsi: 'Pengelolaan administrasi madrasah, SIM, RKM/RKAM, tata pamong kepesantrenan, sarana prasarana, dan pemenuhan SNP.',
    ikon: 'Briefcase',
    jenis_menu: 'internal',
    target_url: '/modul/tugas-manajerial',
    drive_folder_id: '2-DRIVE-FOLDER-MANAJERIAL-2026',
    urutan: 2,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 08:15:00',
    updated_at: '2026-10-18 14:20:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Prioritas II'
  },
  {
    menu_id: 'menu-kewirausahaan',
    nama_menu: 'C. PENGEMBANGAN KEWIRAUSAHAAN',
    deskripsi: 'Unit produksi madrasah, koperasi santri, program kemandirian ekonomi pesantren, serta kewirausahaan santri.',
    ikon: 'Coins',
    jenis_menu: 'internal',
    target_url: '/modul/kewirausahaan',
    drive_folder_id: '3-DRIVE-FOLDER-KEWIRAUSAHAAN-2026',
    urutan: 3,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 08:30:00',
    updated_at: '2026-10-20 09:10:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Kemandirian'
  },
  {
    menu_id: 'menu-supervisi-guru',
    nama_menu: 'D. SUPERVISI GURU DAN TENDIK',
    deskripsi: 'Program PKG (Penilaian Kinerja Guru), supervisi klinis, monitoring pembelajaran asrama/kelas, dan peningkatan kompetensi tendik.',
    ikon: 'GraduationCap',
    jenis_menu: 'internal',
    target_url: '/modul/supervisi-guru',
    drive_folder_id: '4-DRIVE-FOLDER-SUPERVISI-2026',
    urutan: 4,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 08:45:00',
    updated_at: '2026-10-22 11:45:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Evaluasi'
  },
  {
    menu_id: 'menu-berita-acara',
    nama_menu: 'BERITA ACARA KEGIATAN',
    deskripsi: 'Daftar dokumen berita acara rapat madrasah, penetapan kurikulum, pleno asesmen, dan kegiatan resmi kelembagaan.',
    ikon: 'FileText',
    jenis_menu: 'document_list',
    target_url: '/modul/berita-acara',
    drive_folder_id: '5-DRIVE-FOLDER-BERITA-ACARA-2026',
    urutan: 5,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 09:00:00',
    updated_at: '2026-10-25 16:00:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Dokumen Resmi'
  },
  {
    menu_id: 'menu-dokumentasi-foto',
    nama_menu: 'DOKUMENTASI FOTO KEGIATAN',
    deskripsi: 'Galeri foto dokumentasi program madrasah, kegiatan belajar santri, upacara, ekstrakurikuler, dan kegiatan kepesantrenan.',
    ikon: 'Image',
    jenis_menu: 'photo_gallery',
    target_url: '/modul/foto-kegiatan',
    drive_folder_id: '6-DRIVE-FOLDER-FOTO-2026',
    urutan: 6,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 09:15:00',
    updated_at: '2026-10-28 13:10:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Galeri'
  },
  {
    menu_id: 'menu-dokumentasi-video',
    nama_menu: 'DOKUMENTASI VIDEO KEGIATAN',
    deskripsi: 'Kumpulan video rekaman kegiatan madrasah, profil pesantren, tutorial pembelajaran, dan liputan hari besar Islam.',
    ikon: 'Video',
    jenis_menu: 'video_gallery',
    target_url: '/modul/video-kegiatan',
    drive_folder_id: '7-DRIVE-FOLDER-VIDEO-2026',
    urutan: 7,
    status: 'aktif',
    open_mode: 'current_tab',
    created_at: '2026-07-01 09:30:00',
    updated_at: '2026-10-30 15:40:00',
    created_by: 'admin@madrasah.sch.id',
    badge: 'Multimedia'
  }
];

export const INITIAL_DRIVE_FILES: DriveFile[] = [
  {
    file_id: 'DF-001',
    nama_file: 'SK_Tim_Pengembang_Madrasah_2026.pdf',
    jenis_file: 'pdf',
    drive_file_id: '1xYz987_SK_Pengembang_Madrasah_PDF',
    drive_folder_id: '1-DRIVE-FOLDER-PENGEMBANGAN-2026',
    url_file: 'https://drive.google.com/file/d/1xYz987_SK_Pengembang_Madrasah_PDF/preview',
    menu_id: 'menu-usaha-pengembangan',
    keterangan: 'Surat Keputusan Kepala Madrasah tentang Penetapan Tim Pengembang Madrasah Tahun 2026',
    ukuran: '2.4 MB',
    status: 'aktif',
    created_at: '2026-07-10 10:00:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-002',
    nama_file: 'Rencana_Kerja_Madrasah_RKM_2026_2030.pdf',
    jenis_file: 'pdf',
    drive_file_id: '2aBc876_RKM_Madrasah_2026_PDF',
    drive_folder_id: '1-DRIVE-FOLDER-PENGEMBANGAN-2026',
    url_file: 'https://drive.google.com/file/d/2aBc876_RKM_Madrasah_2026_PDF/preview',
    menu_id: 'menu-usaha-pengembangan',
    keterangan: 'Dokumen Renstra dan Rencana Kerja Jangka Menengah MTs Suka',
    ukuran: '5.1 MB',
    status: 'aktif',
    created_at: '2026-07-12 11:30:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-003',
    nama_file: 'RKAM_Anggaran_Madrasah_Tahun_2026.xlsx',
    jenis_file: 'sheet',
    drive_file_id: '3cDe765_RKAM_Anggaran_2026_XLS',
    drive_folder_id: '2-DRIVE-FOLDER-MANAJERIAL-2026',
    url_file: 'https://docs.google.com/spreadsheets/d/3cDe765_RKAM_Anggaran_2026_XLS/preview',
    menu_id: 'menu-tugas-manajerial',
    keterangan: 'Rencana Kerja Anggaran Madrasah (RKAM) Terintegrasi EDM',
    ukuran: '3.8 MB',
    status: 'aktif',
    created_at: '2026-07-15 09:45:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-004',
    nama_file: 'Laporan_Unit_Usaha_Koperasi_Santri_Q3.pdf',
    jenis_file: 'pdf',
    drive_file_id: '4dEf654_Laporan_Koperasi_Santri_PDF',
    drive_folder_id: '3-DRIVE-FOLDER-KEWIRAUSAHAAN-2026',
    url_file: 'https://drive.google.com/file/d/4dEf654_Laporan_Koperasi_Santri_PDF/preview',
    menu_id: 'menu-kewirausahaan',
    keterangan: 'Laporan Keuangan & Hasil Produksi Kemandirian Usaha Santri',
    ukuran: '1.9 MB',
    status: 'aktif',
    created_at: '2026-08-20 14:15:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-005',
    nama_file: 'Instrumen_Supervisi_Guru_Tendik_2026.pdf',
    jenis_file: 'pdf',
    drive_file_id: '5eFg543_Instrumen_Supervisi_2026_PDF',
    drive_folder_id: '4-DRIVE-FOLDER-SUPERVISI-2026',
    url_file: 'https://drive.google.com/file/d/5eFg543_Instrumen_Supervisi_2026_PDF/preview',
    menu_id: 'menu-supervisi-guru',
    keterangan: 'Format Penilaian Kinerja Guru (PKG) dan Evaluasi Supervisi Akademik',
    ukuran: '1.5 MB',
    status: 'aktif',
    created_at: '2026-09-05 08:30:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-006',
    nama_file: 'Berita_Acara_Pleno_Kurikulum_Pesantren.pdf',
    jenis_file: 'pdf',
    drive_file_id: '6fGh432_BA_Pleno_Kurikulum_PDF',
    drive_folder_id: '5-DRIVE-FOLDER-BERITA-ACARA-2026',
    url_file: 'https://drive.google.com/file/d/6fGh432_BA_Pleno_Kurikulum_PDF/preview',
    menu_id: 'menu-berita-acara',
    keterangan: 'Berita Acara Rapat Penetapan Kurikulum Integrasi Madrasah & Kitab Kuning',
    ukuran: '1.2 MB',
    status: 'aktif',
    created_at: '2026-09-18 13:00:00',
    created_by: 'admin@madrasah.sch.id'
  },
  {
    file_id: 'DF-007',
    nama_file: 'Berita_Acara_Asesmen_Madrasah_2026.pdf',
    jenis_file: 'pdf',
    drive_file_id: '7gHi321_BA_Asesmen_Madrasah_PDF',
    drive_folder_id: '5-DRIVE-FOLDER-BERITA-ACARA-2026',
    url_file: 'https://drive.google.com/file/d/7gHi321_BA_Asesmen_Madrasah_PDF/preview',
    menu_id: 'menu-berita-acara',
    keterangan: 'Berita Acara Pelaksanaan Asesmen Madrasah Berbasis Komputer & Tahfidz',
    ukuran: '1.4 MB',
    status: 'aktif',
    created_at: '2026-10-02 11:20:00',
    created_by: 'admin@madrasah.sch.id'
  }
];

export const INITIAL_PHOTOS = [
  {
    id: 'photo-1',
    title: 'Apel Pagi Santri & Doa Bersama',
    category: 'Kegiatan Pembiasaan',
    date: '2026-08-10',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    caption: 'Pembiasaan akhlak mulia dan doa bersama santri sebelum kegiatan belajar mengajar dimulai.'
  },
  {
    id: 'photo-2',
    title: 'Pembelajaran Kajian Kitab Kuning & Amtsilati',
    category: 'Kurikulum Pesantren',
    date: '2026-08-25',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    caption: 'Santri mendalami ilmu alat gramatika nahwu-shorof di serambi madrasah.'
  },
  {
    id: 'photo-3',
    title: 'Supervisi Akademik & Guru Mengajar Digital',
    category: 'Supervisi Akademik',
    date: '2026-09-12',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    caption: 'Kepala Madrasah melaksanakan supervisi pembelajaran multimedia interaktif.'
  },
  {
    id: 'photo-4',
    title: 'Praktik Kewirausahaan Budidaya & Produksi Santri',
    category: 'Kewirausahaan',
    date: '2026-09-28',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
    caption: 'Kemandirian santri dalam mengelola kebun hidroponik dan mini market koperasi madrasah.'
  },
  {
    id: 'photo-5',
    title: 'Rapat Kerja & Pleno Tim Penjamin Mutu Madrasah',
    category: 'Manajerial',
    date: '2026-10-05',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    caption: 'Penyusunan indikator kinerja madrasah dan evaluasi ketercapaian 8 Standar Nasional Pendidikan.'
  },
  {
    id: 'photo-6',
    title: 'Wisuda Tahfidz Al-Qur\'an Juz 30 & 5 Juz',
    category: 'Prestasi Santri',
    date: '2026-10-22',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    caption: 'Penganugerahan syahadah tahfidz kepada santri berprestasi MTs Suka.'
  }
];

export const INITIAL_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Profil Lengkap MTs Suka 2026: Harmoni Tradisi & Teknologi',
    duration: '08:45',
    date: '2026-08-15',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder embed
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    desc: 'Video profil madrasah menampilkan kurikulum pesantren, fasilitas sains, laboratorium bahasa, dan asrama santri.'
  },
  {
    id: 'vid-2',
    title: 'Dokumentasi PKKM & Paparan Kinerja Kepala Madrasah',
    duration: '15:20',
    date: '2026-10-18',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    desc: 'Presentasi capaian kinerja 4 tahunan kepala madrasah di hadapan tim penilai pengawas Kementerian Agama.'
  },
  {
    id: 'vid-3',
    title: 'Kemandirian Pesantren: Liputan Usaha Koperasi Berkah Santri',
    duration: '06:10',
    date: '2026-10-24',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    desc: 'Wawancara dengan pembina kewirausahaan santri mengenai strategi kemandirian ekonomi pesantren.'
  }
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    admin_id: 'ADM-001',
    nama: 'H. Muhammad Fadhil, S.Pd.I, M.Pd.',
    email: 'admin@madrasah.sch.id',
    // hash of "AdminPass2026!"
    password_hash: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
    role: 'Super Admin',
    status: 'aktif',
    created_at: '2026-01-01 00:00:00',
    last_login: '2026-11-01 20:15:33'
  },
  {
    admin_id: 'ADM-002',
    nama: 'Ust. Ahmad Fauzan, S.Kom.',
    email: 'apk.mts2026@gmail.com',
    password_hash: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
    role: 'Admin Madrasah',
    status: 'aktif',
    created_at: '2026-02-15 09:30:00',
    last_login: '2026-11-01 19:40:12'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    log_id: 'LOG-1001',
    waktu: '2026-11-01 22:15:10',
    email_admin: 'admin@madrasah.sch.id',
    aktivitas: 'LOGIN_ADMIN',
    detail: 'Autentikasi admin berhasil via portal web',
    status: 'SUKSES'
  },
  {
    log_id: 'LOG-1002',
    waktu: '2026-11-01 21:50:44',
    email_admin: 'admin@madrasah.sch.id',
    aktivitas: 'UPDATE_MENU',
    detail: 'Memperbarui rincian menu D. SUPERVISI GURU DAN TENDIK',
    status: 'SUKSES'
  },
  {
    log_id: 'LOG-1003',
    waktu: '2026-11-01 20:30:19',
    email_admin: 'apk.mts2026@gmail.com',
    aktivitas: 'UPLOAD_FILE_DRIVE',
    detail: 'Mengunggah dokumen Berita_Acara_Asesmen_Madrasah_2026.pdf ke Google Drive',
    status: 'SUKSES'
  },
  {
    log_id: 'LOG-1004',
    waktu: '2026-11-01 19:12:05',
    email_admin: 'admin@madrasah.sch.id',
    aktivitas: 'SINKRONISASI_SPREADSHEET',
    detail: 'Sinkronisasi 7 entri menu dengan Google Spreadsheet berhasil',
    status: 'SUKSES'
  }
];
