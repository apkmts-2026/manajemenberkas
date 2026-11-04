/**
 * PKKMMTSSUKA26 - Google Apps Script (GAS) Complete Template Suite
 * 100% Complete, Production-Ready Code for Apps Script deployment.
 */

export interface GasFileTemplate {
  name: string;
  type: 'gs' | 'html';
  description: string;
  code: string;
}

export const GAS_TEMPLATES: GasFileTemplate[] = [
  {
    name: 'Code.gs',
    type: 'gs',
    description: 'Entry point, Web App routing, dan fungsi include untuk file parsial HTML.',
    code: `/**
 * @file Code.gs
 * @description Entry point, Web App routing, dan Multi-Device REST API
 * Aplikasi: PKKMMTSSUKA26 - Pendidikan Berbasis Pesantren
 */

/**
 * Handler HTTP GET untuk menyajikan antarmuka pengguna ATAU endpoint JSON API
 * @param {Object} e - Event parameter dari request HTTP
 * @return {HtmlOutput|TextOutput} Tampilan HTML atau JSON response
 */
function doGet(e) {
  // Jika ada parameter ?action=, sajikan data JSON untuk sinkronisasi multi-device
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'dashboard';
  var template;

  if (page === 'admin') {
    template = HtmlService.createTemplateFromFile('Admin');
  } else if (page === 'login') {
    template = HtmlService.createTemplateFromFile('Login');
  } else {
    template = HtmlService.createTemplateFromFile('Index');
  }

  // Inject metadata dinamis ke template
  template.appSettings = getAppSettingsPublic();
  template.initialMenus = getActiveMenusPublic();
  template.activePage = page;

  return template.evaluate()
    .setTitle(template.appSettings.app_name + ' - ' + template.appSettings.subtitle)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handler HTTP POST untuk menyimpan data dari perangkat mana pun via API
 */
function doPost(e) {
  var response = { success: false };
  try {
    var rawText = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(rawText);
    var action = payload.action;

    if (action === 'save_menu') {
      var saved = createMenu(payload.sessionToken, payload.menuData);
      response = { success: true, data: saved };
    } else if (action === 'update_settings') {
      updateAppSettings(payload.sessionToken, payload.settings);
      response = { success: true };
    } else if (action === 'reorder_menu') {
      reorderMenu(payload.sessionToken, payload.menuId, payload.direction);
      response = { success: true };
    } else if (action === 'delete_menu') {
      deleteMenu(payload.sessionToken, payload.menuId);
      response = { success: true };
    } else if (action === 'upload_file') {
      var uploaded = uploadFileToDrive(payload.sessionToken, payload.uploadPayload);
      response = { success: true, data: uploaded };
    } else {
      response = { success: false, message: 'Action tidak dikenal' };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handler GET API untuk menyajikan data terbaru ke berbagai perangkat/browser
 */
function handleApiGet(e) {
  var action = e.parameter.action;
  var response = { success: false };

  try {
    if (action === 'get_data' || action === 'get_all_data') {
      response = {
        success: true,
        settings: getAppSettingsPublic(),
        menus: getActiveMenusPublic(),
        timestamp: getCurrentTimestamp()
      };
    } else if (action === 'get_menus') {
      response = { success: true, menus: getActiveMenusPublic() };
    } else if (action === 'ping') {
      response = { success: true, status: 'ONLINE', app: 'PKKMMTSSUKA26' };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi helper untuk menyertakan file HTML parsial di GAS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mengambil URL Web App yang sedang aktif
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}
`
  },
  {
    name: 'Config.gs',
    type: 'gs',
    description: 'Konfigurasi Spreadsheet ID, Drive Folder ID, zona waktu, dan konstanta aplikasi.',
    code: `/**
 * @file Config.gs
 * @description Konfigurasi utama Google Apps Script
 */

var CONFIG = {
  // Ganti dengan ID Spreadsheet Anda (lihat petunjuk di tab Panduan)
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

  // Ganti dengan ID Folder Google Drive induk Anda
  DRIVE_ROOT_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE',

  // Zona Waktu Indonesia Barat
  TIMEZONE: 'Asia/Jakarta',

  // Format Waktu Standar
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',

  // Nama Sheet Database
  SHEETS: {
    PENGATURAN: 'PENGATURAN',
    MENU: 'MENU',
    ADMIN: 'ADMIN',
    FILE_DRIVE: 'FILE_DRIVE',
    AUDIT_LOG: 'AUDIT_LOG'
  },

  // Pengaturan Email Notifikasi
  NOTIFICATION_EMAIL: 'apk.mts2026@gmail.com',
  ENABLE_EMAIL_NOTIFICATION: true,

  // Versi Aplikasi
  VERSION: '1.0.0-PROD'
};

/**
 * Mendapatkan referensi Google Spreadsheet aktif
 * @return {Spreadsheet} Objek Spreadsheet
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Mendapatkan folder Google Drive utama
 * @return {Folder} Objek Folder Drive
 */
function getDriveRootFolder() {
  if (CONFIG.DRIVE_ROOT_FOLDER_ID && CONFIG.DRIVE_ROOT_FOLDER_ID !== 'YOUR_DRIVE_FOLDER_ID_HERE') {
    return DriveApp.getFolderById(CONFIG.DRIVE_ROOT_FOLDER_ID);
  }
  return DriveApp.getRootFolder();
}

/**
 * Format tanggal dan waktu sekarang dalam format Asia/Jakarta
 * @return {string} String waktu terformat
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
}
`
  },
  {
    name: 'Database.gs',
    type: 'gs',
    description: 'Inisialisasi otomatis sheet, struktur kolom, dan data awal tanpa menimpa data lama.',
    code: `/**
 * @file Database.gs
 * @description Inisialisasi sheet dan operasi dasar database Google Spreadsheet
 */

/**
 * Jalankan fungsi ini SATU KALI dari editor Apps Script
 * Membuat semua sheet yang diperlukan dan memasukkan data default secara aman
 */
function inisialisasiDatabase() {
  var ss = getSpreadsheet();

  // 1. Inisialisasi Sheet PENGATURAN
  initSheet(ss, CONFIG.SHEETS.PENGATURAN, ['KEY', 'VALUE', 'UPDATED_AT'], [
    ['APP_NAME', 'PKKMMTSSUKA26', getCurrentTimestamp()],
    ['SUBTITLE', 'Pendidikan Berbasis Pesantren', getCurrentTimestamp()],
    ['LOGO_URL', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80', getCurrentTimestamp()],
    ['PRIMARY_COLOR', '#1b4332', getCurrentTimestamp()],
    ['SECONDARY_COLOR', '#83c5be', getCurrentTimestamp()],
    ['BACKGROUND_COLOR', '#d8e5dd', getCurrentTimestamp()],
    ['BACKGROUND_IMAGE_URL', '', getCurrentTimestamp()],
    ['FOOTER_TEXT', '© 2026 MTs Suka - Portal Penilaian Kinerja Kepala Madrasah (PKKM) Berbasis Pesantren', getCurrentTimestamp()],
    ['ADMIN_EMAIL_NOTIF', CONFIG.NOTIFICATION_EMAIL, getCurrentTimestamp()],
    ['ACADEMIC_YEAR', 'Tahun Pelajaran 2026/2027', getCurrentTimestamp()]
  ]);

  // 2. Inisialisasi Sheet MENU dengan 7 menu awal sesuai spesifikasi
  initSheet(ss, CONFIG.SHEETS.MENU, [
    'MENU_ID', 'NAMA_MENU', 'DESKRIPSI', 'IKON', 'JENIS_MENU',
    'TARGET_URL', 'DRIVE_FOLDER_ID', 'URUTAN', 'STATUS',
    'OPEN_MODE', 'CREATED_AT', 'UPDATED_AT', 'CREATED_BY'
  ], [
    [
      'menu-usaha-pengembangan',
      'A. USAHA PENGEMBANGAN MADRASAH',
      'Program kerja pengembangan madrasah, kurikulum integratif, kemitraan, dan inovasi pendidikan pesantren.',
      'TrendingUp', 'internal', '/modul/usaha-pengembangan', '', 1, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-tugas-manajerial',
      'B. PELAKSANAAN TUGAS MANAJERIAL',
      'Pengelolaan administrasi madrasah, SIM, RKM/RKAM, sarana prasarana, dan pemenuhan Standar Nasional Pendidikan.',
      'Briefcase', 'internal', '/modul/tugas-manajerial', '', 2, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-kewirausahaan',
      'C. PENGEMBANGAN KEWIRAUSAHAAN',
      'Unit produksi madrasah, koperasi santri, dan program kemandirian ekonomi pesantren.',
      'Coins', 'internal', '/modul/kewirausahaan', '', 3, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-supervisi-guru',
      'D. SUPERVISI GURU DAN TENDIK',
      'Penilaian Kinerja Guru (PKG), supervisi klinis, monitoring asrama/kelas, dan pembinaan kompetensi tendik.',
      'GraduationCap', 'internal', '/modul/supervisi-guru', '', 4, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-berita-acara',
      'BERITA ACARA KEGIATAN',
      'Daftar dokumen berita acara rapat madrasah, penetapan kurikulum, pleno asesmen, dan kegiatan resmi.',
      'FileText', 'document_list', '/modul/berita-acara', '', 5, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-dokumentasi-foto',
      'DOKUMENTASI FOTO KEGIATAN',
      'Galeri dokumentasi foto kegiatan madrasah, upacara, pembiasaan santri, dan ekstrakurikuler.',
      'Image', 'photo_gallery', '/modul/foto-kegiatan', '', 6, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ],
    [
      'menu-dokumentasi-video',
      'DOKUMENTASI VIDEO KEGIATAN',
      'Kumpulan liputan video kegiatan madrasah, video profil pesantren, dan rekaman PKKM.',
      'Video', 'video_gallery', '/modul/video-kegiatan', '', 7, 'aktif', 'current_tab',
      getCurrentTimestamp(), getCurrentTimestamp(), 'SYSTEM'
    ]
  ]);

  // 3. Inisialisasi Sheet ADMIN dengan admin default pertama
  // Password default: "AdminPass2026!" di-hash dengan SHA-256
  var initialPasswordHash = hashPassword('AdminPass2026!');
  initSheet(ss, CONFIG.SHEETS.ADMIN, [
    'ADMIN_ID', 'NAMA', 'EMAIL', 'PASSWORD_HASH', 'ROLE', 'STATUS', 'CREATED_AT', 'LAST_LOGIN'
  ], [
    [
      'ADM-001',
      'H. Muhammad Fadhil, S.Pd.I, M.Pd.',
      'admin@madrasah.sch.id',
      initialPasswordHash,
      'Super Admin',
      'aktif',
      getCurrentTimestamp(),
      getCurrentTimestamp()
    ],
    [
      'ADM-002',
      'Ust. Ahmad Fauzan, S.Kom.',
      CONFIG.NOTIFICATION_EMAIL,
      initialPasswordHash,
      'Admin Madrasah',
      'aktif',
      getCurrentTimestamp(),
      getCurrentTimestamp()
    ]
  ]);

  // 4. Inisialisasi Sheet FILE_DRIVE
  initSheet(ss, CONFIG.SHEETS.FILE_DRIVE, [
    'FILE_ID', 'NAMA_FILE', 'JENIS_FILE', 'DRIVE_FILE_ID', 'DRIVE_FOLDER_ID',
    'URL_FILE', 'MENU_ID', 'KETERANGAN', 'STATUS', 'CREATED_AT', 'CREATED_BY'
  ], []);

  // 5. Inisialisasi Sheet AUDIT_LOG
  initSheet(ss, CONFIG.SHEETS.AUDIT_LOG, [
    'LOG_ID', 'WAKTU', 'EMAIL_ADMIN', 'AKTIVITAS', 'DETAIL', 'STATUS'
  ], [
    [
      'LOG-001',
      getCurrentTimestamp(),
      'SYSTEM',
      'INISIALISASI_DATABASE',
      'Inisialisasi struktur sheet PKKMMTSSUKA26 berhasil',
      'SUKSES'
    ]
  ]);

  Logger.log('Inisialisasi database PKKMMTSSUKA26 berhasil diselesaikan.');
  return 'Inisialisasi database berhasil!';
}

/**
 * Helper untuk membuat atau melengkapi sheet tanpa menimpa data yang sudah ada
 */
function initSheet(ss, sheetName, headers, defaultRows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Format header baris pertama
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1b4332').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Tambahkan data awal jika ada
    if (defaultRows && defaultRows.length > 0) {
      for (var i = 0; i < defaultRows.length; i++) {
        sheet.appendRow(defaultRows[i]);
      }
    }
  } else {
    // Jika sheet sudah ada, pastikan header ada
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#1b4332').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
      if (defaultRows && defaultRows.length > 0) {
        for (var j = 0; j < defaultRows.length; j++) {
          sheet.appendRow(defaultRows[j]);
        }
      }
    }
  }
  return sheet;
}
`
  },
  {
    name: 'MenuService.gs',
    type: 'gs',
    description: 'Layanan CRUD menu, validasi input, pengurutan naik/turun, dan notifikasi email.',
    code: `/**
 * @file MenuService.gs
 * @description Layanan CRUD dan pengelolaan menu madrasah
 */

/**
 * Mengambil menu aktif untuk pengguna umum (diurutkan berdasarkan urutan)
 * @return {Array<Object>} Daftar menu aktif
 */
function getActiveMenusPublic() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.MENU);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var menus = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = String(row[8]).toLowerCase().trim();
      if (status === 'aktif') {
        menus.push(rowToMenuObject(row));
      }
    }

    // Urutkan berdasarkan urutan numerik
    menus.sort(function(a, b) {
      return a.urutan - b.urutan;
    });

    return menus;
  } catch (err) {
    Logger.log('Error getActiveMenusPublic: ' + err.toString());
    return [];
  }
}

/**
 * Mengambil semua menu (termasuk nonaktif) untuk Admin
 * @param {string} sessionToken - Token sesi admin
 * @return {Array<Object>} Semua daftar menu
 */
function getAllMenusAdmin(sessionToken) {
  validateAdminSession(sessionToken);

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MENU);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var menus = [];

  for (var i = 1; i < data.length; i++) {
    menus.push(rowToMenuObject(data[i]));
  }

  menus.sort(function(a, b) {
    return a.urutan - b.urutan;
  });

  return menus;
}

/**
 * Tambah menu baru oleh Admin
 * @param {string} sessionToken - Token sesi
 * @param {Object} menuData - Data menu baru
 * @return {Object} Menu yang berhasil dibuat
 */
function createMenu(sessionToken, menuData) {
  var admin = validateAdminSession(sessionToken);

  if (!menuData.nama_menu || !menuData.jenis_menu) {
    throw new Error('Nama menu dan jenis menu wajib diisi.');
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MENU);
  var menuId = 'menu-' + Utilities.getUuid().substring(0, 8);
  var now = getCurrentTimestamp();

  // Hitung urutan tertinggi berikutnya
  var nextOrder = getNextMenuOrder(sheet);

  var newRow = [
    menuId,
    menuData.nama_menu.trim(),
    menuData.deskripsi || '',
    menuData.ikon || 'Folder',
    menuData.jenis_menu,
    menuData.target_url || '',
    menuData.drive_folder_id || '',
    menuData.urutan ? Number(menuData.urutan) : nextOrder,
    menuData.status === 'nonaktif' ? 'nonaktif' : 'aktif',
    menuData.open_mode || 'current_tab',
    now,
    now,
    admin.email
  ];

  sheet.appendRow(newRow);

  // Catat ke Audit Log
  logActivity(admin.email, 'TAMBAH_MENU', 'Menambahkan menu: ' + menuData.nama_menu, 'SUKSES');

  // Kirim notifikasi email otomatis ke Admin
  sendNotificationEmail(
    'Menu Baru Ditambahkan: ' + menuData.nama_menu,
    'Halo Admin,\\n\\nMenu baru telah berhasil ditambahkan ke Portal PKKMMTSSUKA26.\\n\\n' +
    'Nama Menu: ' + menuData.nama_menu + '\\n' +
    'Jenis: ' + menuData.jenis_menu + '\\n' +
    'Ditambahkan oleh: ' + admin.email + '\\n' +
    'Waktu: ' + now + '\\n\\n' +
    'Silakan periksa di portal administrasi.'
  );

  return rowToMenuObject(newRow);
}

/**
 * Update menu yang sudah ada
 */
function updateMenu(sessionToken, menuId, menuData) {
  var admin = validateAdminSession(sessionToken);
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MENU);
  var data = sheet.getDataRange().getValues();

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(menuId)) {
      rowIndex = i + 1; // 1-indexed baris sheet
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Menu dengan ID ' + menuId + ' tidak ditemukan.');
  }

  var now = getCurrentTimestamp();

  // Update kolom
  if (menuData.nama_menu !== undefined) sheet.getRange(rowIndex, 2).setValue(menuData.nama_menu.trim());
  if (menuData.deskripsi !== undefined) sheet.getRange(rowIndex, 3).setValue(menuData.deskripsi);
  if (menuData.ikon !== undefined) sheet.getRange(rowIndex, 4).setValue(menuData.ikon);
  if (menuData.jenis_menu !== undefined) sheet.getRange(rowIndex, 5).setValue(menuData.jenis_menu);
  if (menuData.target_url !== undefined) sheet.getRange(rowIndex, 6).setValue(menuData.target_url);
  if (menuData.drive_folder_id !== undefined) sheet.getRange(rowIndex, 7).setValue(menuData.drive_folder_id);
  if (menuData.urutan !== undefined) sheet.getRange(rowIndex, 8).setValue(Number(menuData.urutan));
  if (menuData.status !== undefined) sheet.getRange(rowIndex, 9).setValue(menuData.status);
  if (menuData.open_mode !== undefined) sheet.getRange(rowIndex, 10).setValue(menuData.open_mode);
  sheet.getRange(rowIndex, 12).setValue(now);

  logActivity(admin.email, 'UPDATE_MENU', 'Mengubah data menu ID: ' + menuId, 'SUKSES');
  return { success: true, menu_id: menuId };
}

/**
 * Hapus menu berdasarkan ID
 */
function deleteMenu(sessionToken, menuId) {
  var admin = validateAdminSession(sessionToken);
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MENU);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(menuId)) {
      var namaMenu = data[i][1];
      sheet.deleteRow(i + 1);
      logActivity(admin.email, 'HAPUS_MENU', 'Menghapus menu: ' + namaMenu + ' (' + menuId + ')', 'SUKSES');
      return { success: true };
    }
  }

  throw new Error('Menu tidak ditemukan untuk dihapus.');
}

/**
 * Pindahkan urutan menu (naik atau turun)
 */
function reorderMenu(sessionToken, menuId, direction) {
  var admin = validateAdminSession(sessionToken);
  var menus = getAllMenusAdmin(sessionToken);
  
  var currentIndex = -1;
  for (var i = 0; i < menus.length; i++) {
    if (menus[i].menu_id === menuId) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === -1) throw new Error('Menu tidak ditemukan');

  var targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= menus.length) {
    return { success: false, message: 'Sudah berada di batas urutan' };
  }

  // Tukar urutan
  var currentMenu = menus[currentIndex];
  var targetMenu = menus[targetIndex];

  var tempOrder = currentMenu.urutan;
  currentMenu.urutan = targetMenu.urutan;
  targetMenu.urutan = tempOrder;

  updateMenu(sessionToken, currentMenu.menu_id, { urutan: currentMenu.urutan });
  updateMenu(sessionToken, targetMenu.menu_id, { urutan: targetMenu.urutan });

  return { success: true };
}

function rowToMenuObject(row) {
  return {
    menu_id: String(row[0]),
    nama_menu: String(row[1]),
    deskripsi: String(row[2] || ''),
    ikon: String(row[3] || 'Folder'),
    jenis_menu: String(row[4] || 'internal'),
    target_url: String(row[5] || ''),
    drive_folder_id: String(row[6] || ''),
    urutan: Number(row[7]) || 1,
    status: String(row[8] || 'aktif'),
    open_mode: String(row[9] || 'current_tab'),
    created_at: String(row[10] || ''),
    updated_at: String(row[11] || ''),
    created_by: String(row[12] || '')
  };
}

function getNextMenuOrder(sheet) {
  var data = sheet.getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < data.length; i++) {
    var val = Number(data[i][7]);
    if (val > max) max = val;
  }
  return max + 1;
}
`
  },
  {
    name: 'DriveService.gs',
    type: 'gs',
    description: 'Pengelolaan file Google Drive, unggah dokumen/foto/video, dan integrasi folder menu.',
    code: `/**
 * @file DriveService.gs
 * @description Layanan integrasi Google Drive untuk PKKMMTSSUKA26
 */

/**
 * Unggah file baru ke Google Drive dan simpan metadata di Spreadsheet
 * @param {string} sessionToken - Token sesi admin
 * @param {Object} uploadPayload - Data file { name, mimeType, base64Data, menuId, keterangan }
 * @return {Object} Metadata file yang berhasil disimpan
 */
function uploadFileToDrive(sessionToken, uploadPayload) {
  var admin = validateAdminSession(sessionToken);

  if (!uploadPayload.base64Data || !uploadPayload.name) {
    throw new Error('Data file atau nama file tidak valid.');
  }

  var decodedBytes = Utilities.base64Decode(uploadPayload.base64Data);
  var blob = Utilities.newBlob(decodedBytes, uploadPayload.mimeType || 'application/octet-stream', uploadPayload.name);

  var targetFolder = getDriveRootFolder();

  // Jika ada folder ID spesifik dari menu
  if (uploadPayload.driveFolderId && uploadPayload.driveFolderId.trim() !== '') {
    try {
      targetFolder = DriveApp.getFolderById(uploadPayload.driveFolderId.trim());
    } catch (e) {
      Logger.log('Gagal membuka subfolder, menyimpan ke folder utama: ' + e.message);
    }
  }

  // Buat file di Drive
  var createdDriveFile = targetFolder.createFile(blob);
  var fileId = createdDriveFile.getId();
  var fileUrl = createdDriveFile.getUrl();
  var now = getCurrentTimestamp();

  // Tentukan jenis file sederhana
  var jenisFile = 'doc';
  var mime = uploadPayload.mimeType || '';
  if (mime.indexOf('pdf') !== -1) jenisFile = 'pdf';
  else if (mime.indexOf('image') !== -1) jenisFile = 'image';
  else if (mime.indexOf('video') !== -1) jenisFile = 'video';
  else if (mime.indexOf('sheet') !== -1 || mime.indexOf('excel') !== -1) jenisFile = 'sheet';

  // Catat ke Sheet FILE_DRIVE
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.FILE_DRIVE);
  var customFileId = 'DF-' + Utilities.getUuid().substring(0, 8);

  var rowData = [
    customFileId,
    uploadPayload.name,
    jenisFile,
    fileId,
    targetFolder.getId(),
    fileUrl,
    uploadPayload.menuId || '',
    uploadPayload.keterangan || '',
    'aktif',
    now,
    admin.email
  ];

  sheet.appendRow(rowData);

  logActivity(admin.email, 'UPLOAD_FILE_DRIVE', 'Unggah file ' + uploadPayload.name + ' ke Drive', 'SUKSES');

  return {
    file_id: customFileId,
    drive_file_id: fileId,
    nama_file: uploadPayload.name,
    url_file: fileUrl,
    jenis_file: jenisFile
  };
}

/**
 * Mengambil file yang terkait dengan suatu menu
 * @param {string} menuId - ID menu
 * @return {Array<Object>} Daftar file
 */
function getFilesByMenuId(menuId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.FILE_DRIVE);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var files = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[6]) === String(menuId) && String(row[8]) === 'aktif') {
      files.push({
        file_id: String(row[0]),
        nama_file: String(row[1]),
        jenis_file: String(row[2]),
        drive_file_id: String(row[3]),
        drive_folder_id: String(row[4]),
        url_file: String(row[5]),
        menu_id: String(row[6]),
        keterangan: String(row[7]),
        created_at: String(row[9]),
        created_by: String(row[10])
      });
    }
  }

  return files;
}
`
  },
  {
    name: 'Auth.gs',
    type: 'gs',
    description: 'Autentikasi admin aman, hashing SHA-256, session token, dan validasi server-side.',
    code: `/**
 * @file Auth.gs
 * @description Sistem autentikasi admin aman dengan SHA-256 dan CacheService
 */

/**
 * Hash password menggunakan SHA-256 dan salt tetap
 * @param {string} password - Password mentah
 * @return {string} Password hash heksadesimal
 */
function hashPassword(password) {
  var salt = 'MTSSUKA_PKKM_SECURE_SALT_2026';
  var rawBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt,
    Utilities.Charset.UTF_8
  );
  var hash = '';
  for (var i = 0; i < rawBytes.length; i++) {
    var byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    var hexByte = byteVal.toString(16);
    if (hexByte.length === 1) hexByte = '0' + hexByte;
    hash += hexByte;
  }
  return hash;
}

/**
 * Proses login Admin dari frontend
 * @param {string} email - Email admin
 * @param {string} password - Password admin
 * @return {Object} Sesi admin dan data profil
 */
function loginAdmin(email, password) {
  if (!email || !password) {
    throw new Error('Email dan password wajib diisi.');
  }

  var normalizedEmail = email.trim().toLowerCase();
  var inputHash = hashPassword(password);

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
  if (!sheet || sheet.getLastRow() <= 1) {
    throw new Error('Database admin belum diinisialisasi.');
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var adminEmail = String(row[2]).trim().toLowerCase();
    var storedHash = String(row[3]).trim();
    var status = String(row[5]).trim().toLowerCase();

    if (adminEmail === normalizedEmail) {
      if (status !== 'aktif') {
        logActivity(normalizedEmail, 'LOGIN_DITOLAK', 'Akun admin nonaktif', 'GAGAL');
        throw new Error('Akun admin Anda sedang dinonaktifkan.');
      }

      if (storedHash === inputHash) {
        // Buat token sesi baru
        var sessionToken = Utilities.getUuid() + '-' + Utilities.getUuid();
        var cache = CacheService.getUserCache() || CacheService.getScriptCache();
        
        var sessionData = {
          admin_id: String(row[0]),
          nama: String(row[1]),
          email: adminEmail,
          role: String(row[4])
        };

        // Simpan sesi selama 6 jam (21600 detik)
        cache.put(sessionToken, JSON.stringify(sessionData), 21600);

        // Update timestamp last login di Sheet
        sheet.getRange(i + 1, 8).setValue(getCurrentTimestamp());

        logActivity(adminEmail, 'LOGIN_BERHASIL', 'Admin berhasil login', 'SUKSES');

        return {
          success: true,
          sessionToken: sessionToken,
          user: sessionData
        };
      } else {
        logActivity(normalizedEmail, 'LOGIN_GAGAL', 'Password salah', 'GAGAL');
        throw new Error('Password salah. Silakan coba kembali.');
      }
    }
  }

  logActivity(normalizedEmail, 'LOGIN_GAGAL', 'Email admin tidak terdaftar', 'GAGAL');
  throw new Error('Email tidak terdaftar sebagai admin.');
}

/**
 * Validasi token sesi admin di sisi server
 * @param {string} sessionToken - Token sesi
 * @return {Object} Data admin
 */
function validateAdminSession(sessionToken) {
  if (!sessionToken) {
    throw new Error('Akses ditolak: Token sesi tidak ditemukan. Silakan login kembali.');
  }

  var cache = CacheService.getUserCache() || CacheService.getScriptCache();
  var cached = cache.get(sessionToken);

  if (!cached) {
    throw new Error('Sesi telah kedaluwarsa. Silakan login ulang.');
  }

  return JSON.parse(cached);
}

/**
 * Logout admin dan hapus token sesi dari cache
 */
function logoutAdmin(sessionToken) {
  if (sessionToken) {
    var cache = CacheService.getUserCache() || CacheService.getScriptCache();
    cache.remove(sessionToken);
  }
  return { success: true };
}
`
  },
  {
    name: 'SettingsService.gs',
    type: 'gs',
    description: 'Pengaturan identitas aplikasi, warna, logo, dan footer yang langsung tersimpan di Sheet.',
    code: `/**
 * @file SettingsService.gs
 * @description Layanan pengelolaan identitas dan konfigurasi aplikasi
 */

/**
 * Mengambil semua pengaturan publik untuk ditampilkan di dashboard
 * @return {Object} Pengaturan aplikasi
 */
function getAppSettingsPublic() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
    var settings = {
      app_name: 'PKKMMTSSUKA26',
      subtitle: 'Pendidikan Berbasis Pesantren',
      logo_url: '',
      primary_color: '#1b4332',
      secondary_color: '#83c5be',
      background_color: '#d8e5dd',
      background_image_url: '',
      footer_text: '© 2026 MTs Suka - Portal Penilaian Kinerja Kepala Madrasah (PKKM)',
      academic_year: 'Tahun Pelajaran 2026/2027',
      admin_email_notif: CONFIG.NOTIFICATION_EMAIL
    };

    if (!sheet || sheet.getLastRow() <= 1) return settings;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0]).toLowerCase().trim();
      var value = String(data[i][1]);
      if (key === 'app_name') settings.app_name = value;
      else if (key === 'subtitle') settings.subtitle = value;
      else if (key === 'logo_url') settings.logo_url = value;
      else if (key === 'primary_color') settings.primary_color = value;
      else if (key === 'secondary_color') settings.secondary_color = value;
      else if (key === 'background_color') settings.background_color = value;
      else if (key === 'background_image_url') settings.background_image_url = value;
      else if (key === 'footer_text') settings.footer_text = value;
      else if (key === 'academic_year') settings.academic_year = value;
      else if (key === 'admin_email_notif') settings.admin_email_notif = value;
    }

    return settings;
  } catch (err) {
    Logger.log('Error getAppSettingsPublic: ' + err.toString());
    return {
      app_name: 'PKKMMTSSUKA26',
      subtitle: 'Pendidikan Berbasis Pesantren',
      logo_url: '',
      primary_color: '#1b4332',
      secondary_color: '#83c5be',
      background_color: '#d8e5dd',
      footer_text: '© 2026 MTs Suka'
    };
  }
}

/**
 * Memperbarui pengaturan aplikasi oleh Admin
 */
function updateAppSettings(sessionToken, updatedSettings) {
  var admin = validateAdminSession(sessionToken);
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  var now = getCurrentTimestamp();

  var data = sheet.getDataRange().getValues();
  var keyRowMap = {};

  for (var i = 1; i < data.length; i++) {
    keyRowMap[String(data[i][0]).toUpperCase().trim()] = i + 1;
  }

  for (var key in updatedSettings) {
    var upperKey = key.toUpperCase();
    var val = updatedSettings[key];
    if (keyRowMap[upperKey]) {
      sheet.getRange(keyRowMap[upperKey], 2).setValue(val);
      sheet.getRange(keyRowMap[upperKey], 3).setValue(now);
    } else {
      sheet.appendRow([upperKey, val, now]);
    }
  }

  logActivity(admin.email, 'UPDATE_PENGATURAN', 'Memperbarui identitas dan pengaturan aplikasi', 'SUKSES');
  return { success: true };
}
`
  },
  {
    name: 'AuditService.gs',
    type: 'gs',
    description: 'Pencatatan riwayat aktivitas sistem, log keamanan, dan notifikasi email otomatis.',
    code: `/**
 * @file AuditService.gs
 * @description Pencatatan aktivitas audit log dan pengiriman email notifikasi
 */

/**
 * Catat aktivitas ke Sheet AUDIT_LOG
 */
function logActivity(emailAdmin, aktivitas, detail, status) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
    if (!sheet) return;

    var logId = 'LOG-' + Utilities.getUuid().substring(0, 6);
    sheet.appendRow([
      logId,
      getCurrentTimestamp(),
      emailAdmin || 'SISTEM',
      aktivitas,
      detail,
      status || 'SUKSES'
    ]);
  } catch (err) {
    Logger.log('Gagal mencatat audit log: ' + err.toString());
  }
}

/**
 * Mengambil daftar audit log untuk admin
 */
function getAuditLogsAdmin(sessionToken, limit) {
  validateAdminSession(sessionToken);
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var logs = [];
  var max = limit || 50;

  for (var i = data.length - 1; i >= 1 && logs.length < max; i--) {
    logs.push({
      log_id: String(data[i][0]),
      waktu: String(data[i][1]),
      email_admin: String(data[i][2]),
      aktivitas: String(data[i][3]),
      detail: String(data[i][4]),
      status: String(data[i][5])
    });
  }

  return logs;
}

/**
 * Mengirim notifikasi email otomatis saat ada data baru masuk
 */
function sendNotificationEmail(subject, bodyText) {
  if (!CONFIG.ENABLE_EMAIL_NOTIFICATION) return;

  try {
    var recipient = CONFIG.NOTIFICATION_EMAIL;
    MailApp.sendEmail({
      to: recipient,
      subject: '[PKKMMTSSUKA26] ' + subject,
      body: bodyText
    });
  } catch (err) {
    Logger.log('Gagal mengirim email notifikasi: ' + err.toString());
  }
}
`
  },
  {
    name: 'Index.html',
    type: 'html',
    description: 'Dashboard utama web app bernuansa sage & mint green dengan kartu menu memanjang.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= appSettings.app_name ?> - <?= appSettings.subtitle ?></title>
  <!-- Bootstrap 5 CSS via CDN -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">

  <?!= include('Styles'); ?>
</head>
<body class="dashboard-body" style="<?= appSettings.background_image_url ? 'background-image: url(' + appSettings.background_image_url + '); background-size: cover; background-position: center; background-attachment: fixed;' : '' ?>">

  <div class="container py-4 min-vh-100 d-flex flex-column justify-content-center align-items-center">
    
    <!-- Panel Utama Mint Green -->
    <div class="main-card-panel shadow-lg p-4 p-md-5 w-100 position-relative">
      
      <!-- Bar Navigasi Atas -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <!-- Ikon Aplikasi Kiri Atas -->
        <a href="<?= getAppUrl() ?>" class="top-nav-btn" title="Dashboard Utama">
          <i class="bi bi-mortarboard-fill fs-5"></i>
        </a>

        <!-- Status & Login Admin -->
        <div class="d-flex align-items-center gap-2">
          <a href="<?= getAppUrl() ?>?page=login" class="btn btn-sm btn-outline-dark-emerald rounded-pill px-3 py-1">
            <i class="bi bi-shield-lock me-1"></i> Admin
          </a>
          <!-- Tombol Bagikan Kanan Atas -->
          <button type="button" class="top-nav-btn" id="btnShareDashboard" title="Bagikan Dashboard" onclick="handleShareDashboard()">
            <i class="bi bi-share-fill fs-5"></i>
          </button>
        </div>
      </div>

      <!-- Area Logo & Identitas Madrasah -->
      <div class="text-center mb-4 pb-2">
        <div class="logo-wrapper mx-auto mb-3">
          <img src="<?= appSettings.logo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' ?>" 
               alt="Logo Madrasah" 
               class="madrasah-logo-img rounded-circle shadow-sm"
               onerror="this.src='https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'">
        </div>
        <h1 class="app-title mb-1"><?= appSettings.app_name ?></h1>
        <p class="app-subtitle mb-2"><?= appSettings.subtitle ?></p>
        <span class="badge badge-academic rounded-pill px-3 py-1">
          <i class="bi bi-calendar-check me-1"></i> <?= appSettings.academic_year || 'Tahun Ajaran 2026/2027' ?>
        </span>
      </div>

      <!-- Loading State -->
      <div id="loadingIndicator" class="text-center py-4 d-none">
        <div class="spinner-border text-emerald" role="status">
          <span class="visually-hidden">Memuat data menu...</span>
        </div>
        <p class="mt-2 text-dark-emerald fw-semibold">Memuat menu dari Google Spreadsheet...</p>
      </div>

      <!-- Daftar Menu Dinamis (Horizontal Cards) -->
      <div id="menuContainer" class="d-flex flex-column gap-3 mb-4">
        <!-- Menu akan dirender secara dinamis melalui JavaScript & Templating GAS -->
        <? if (initialMenus && initialMenus.length > 0) { ?>
          <? for (var i = 0; i < initialMenus.length; i++) { 
               var m = initialMenus[i]; ?>
            <div class="menu-pill-card d-flex align-items-center justify-content-between p-3" 
                 onclick="handleMenuClick('<?= m.menu_id ?>', '<?= m.jenis_menu ?>', '<?= m.target_url ?>', '<?= m.open_mode ?>')">
              
              <div class="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                <div class="menu-icon-circle flex-shrink-0">
                  <i class="bi <?= getBootstrapIconClass(m.ikon) ?>"></i>
                </div>
                <div class="menu-text-wrap text-truncate text-center flex-grow-1">
                  <span class="menu-title-text"><?= m.nama_menu ?></span>
                </div>
              </div>

              <!-- Tombol Tiga Titik -->
              <div class="dropdown flex-shrink-0 ms-2" onclick="event.stopPropagation();">
                <button class="three-dots-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Opsi Menu">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                  <li>
                    <a class="dropdown-item py-2" href="#" onclick="handleMenuClick('<?= m.menu_id ?>', '<?= m.jenis_menu ?>', '<?= m.target_url ?>', '<?= m.open_mode ?>'); return false;">
                      <i class="bi bi-box-arrow-up-right me-2 text-emerald"></i> Buka Menu
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item py-2" href="#" onclick="copyMenuLink('<?= m.menu_id ?>'); return false;">
                      <i class="bi bi-link-45deg me-2 text-emerald"></i> Salin Tautan
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item py-2" href="#" onclick="showMenuDetails('<?= m.menu_id ?>', '<?= m.nama_menu ?>', '<?= m.deskripsi ?>'); return false;">
                      <i class="bi bi-info-circle me-2 text-emerald"></i> Lihat Detail
                    </a>
                  </li>
                </ul>
              </div>

            </div>
          <? } ?>
        <? } else { ?>
          <div class="text-center py-4 bg-white bg-opacity-50 rounded-4">
            <i class="bi bi-inbox fs-2 text-muted"></i>
            <p class="text-muted mt-2">Belum ada menu aktif. Silakan tambahkan menu di halaman Admin.</p>
          </div>
        <? } ?>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-muted small mt-4 pt-3 border-top border-emerald-subtle">
        <p class="mb-0"><?= appSettings.footer_text ?></p>
      </div>

    </div>

  </div>

  <!-- Modal Detail Menu -->
  <div class="modal fade" id="menuDetailModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header bg-emerald text-white border-0 rounded-top-4">
          <h5 class="modal-title fw-bold" id="modalDetailTitle">Detail Menu</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <p id="modalDetailDesc" class="text-secondary leading-relaxed"></p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notifikasi -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="appToast" class="toast align-items-center text-bg-dark border-0 rounded-3 shadow" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body" id="toastMessage">Tautan berhasil disalin.</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  </div>

  <!-- Bootstrap 5 JS Bundle via CDN -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <?!= include('Scripts'); ?>
</body>
</html>
`
  },
  {
    name: 'Admin.html',
    type: 'html',
    description: 'Halaman administrasi lengkap untuk manajemen menu, identitas madrasah, drive, dan log.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - <?= appSettings.app_name ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
  <?!= include('Styles'); ?>
</head>
<body class="admin-body">

  <nav class="navbar navbar-expand-lg admin-navbar shadow-sm px-3 sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold text-white d-flex align-items-center gap-2" href="<?= getAppUrl() ?>?page=admin">
        <i class="bi bi-shield-check fs-4"></i>
        <span>Admin <?= appSettings.app_name ?></span>
      </a>
      <div class="d-flex align-items-center gap-3">
        <a href="<?= getAppUrl() ?>" class="btn btn-sm btn-outline-light rounded-pill px-3">
          <i class="bi bi-eye me-1"></i> Lihat Portal
        </a>
        <button class="btn btn-sm btn-danger rounded-pill px-3" onclick="handleLogout()">
          <i class="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </div>
  </nav>

  <div class="container py-4">
    <!-- Tab Navigasi Admin -->
    <ul class="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm" id="adminTabs" role="tablist">
      <li class="nav-item">
        <button class="nav-link active rounded-pill px-4 fw-semibold" id="tab-menus-tab" data-bs-toggle="tab" data-bs-target="#tab-menus" type="button">
          <i class="bi bi-list-task me-1"></i> Manajemen Menu
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link rounded-pill px-4 fw-semibold" id="tab-identity-tab" data-bs-toggle="tab" data-bs-target="#tab-identity" type="button">
          <i class="bi bi-palette me-1"></i> Identitas & Desain
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link rounded-pill px-4 fw-semibold" id="tab-drive-tab" data-bs-toggle="tab" data-bs-target="#tab-drive" type="button">
          <i class="bi bi-google-play me-1"></i> File Google Drive
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link rounded-pill px-4 fw-semibold" id="tab-logs-tab" data-bs-toggle="tab" data-bs-target="#tab-logs" type="button">
          <i class="bi bi-journal-text me-1"></i> Log Aktivitas
        </button>
      </li>
    </ul>

    <div class="tab-content" id="adminTabsContent">
      
      <!-- TAB 1: MANAJEMEN MENU -->
      <div class="tab-pane fade show active" id="tab-menus" role="tabpanel">
        <div class="card border-0 shadow-sm rounded-4 p-4">
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 class="fw-bold mb-1 text-dark-emerald">Daftar Menu Dashboard</h4>
              <p class="text-muted small mb-0">Menu diurutkan sesuai urutan tampilan di dashboard publik.</p>
            </div>
            <button class="btn btn-emerald rounded-pill px-4" onclick="openCreateMenuModal()">
              <i class="bi bi-plus-circle me-2"></i> Tambah Menu Baru
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle" id="menuAdminTable">
              <thead class="table-light">
                <tr>
                  <th style="width: 60px;">Urutan</th>
                  <th>Nama Menu</th>
                  <th>Jenis Menu</th>
                  <th>Ikon</th>
                  <th>Status</th>
                  <th>Terakhir Diperbarui</th>
                  <th class="text-center" style="width: 200px;">Aksi</th>
                </tr>
              </thead>
              <tbody id="menuTableBody">
                <tr><td colspan="7" class="text-center py-4">Memuat data dari Google Spreadsheet...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: IDENTITAS APLIKASI -->
      <div class="tab-pane fade" id="tab-identity" role="tabpanel">
        <div class="card border-0 shadow-sm rounded-4 p-4">
          <h4 class="fw-bold mb-3 text-dark-emerald">Pengaturan Identitas & Branding</h4>
          <form id="formIdentity" onsubmit="handleSaveIdentity(event)">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Nama Aplikasi</label>
                <input type="text" class="form-control rounded-3" id="inputAppName" required value="<?= appSettings.app_name ?>">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Subjudul</label>
                <input type="text" class="form-control rounded-3" id="inputSubtitle" required value="<?= appSettings.subtitle ?>">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Upload Logo Madrasah (Bukan URL)</label>
                <input type="file" class="form-control rounded-3" id="inputLogoFile" accept="image/*">
                <small class="text-muted">Pilih berkas gambar PNG atau JPG dari perangkat Anda.</small>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Upload Background Aplikasi</label>
                <input type="file" class="form-control rounded-3" id="inputBgFile" accept="image/*">
                <small class="text-muted">Pilih foto gedung madrasah atau gambar latar belakang.</small>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Teks Footer</label>
                <input type="text" class="form-control rounded-3" id="inputFooterText" value="<?= appSettings.footer_text ?>">
              </div>
              <div class="col-12 mt-4">
                <button type="submit" class="btn btn-emerald rounded-pill px-5">
                  <i class="bi bi-check-circle me-2"></i> Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB 3: FILE GOOGLE DRIVE -->
      <div class="tab-pane fade" id="tab-drive" role="tabpanel">
        <div class="card border-0 shadow-sm rounded-4 p-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold mb-0 text-dark-emerald">Manajemen File & Berkas Google Drive</h4>
            <button class="btn btn-emerald rounded-pill px-4" onclick="openUploadModal()">
              <i class="bi bi-cloud-arrow-up me-2"></i> Unggah File Baru
            </button>
          </div>
          <div id="driveFilesContainer">
            <p class="text-muted">Pilih atau unggah berkas PDF, SK, foto kegiatan, dan video yang akan dihubungkan ke menu.</p>
          </div>
        </div>
      </div>

      <!-- TAB 4: AUDIT LOG -->
      <div class="tab-pane fade" id="tab-logs" role="tabpanel">
        <div class="card border-0 shadow-sm rounded-4 p-4">
          <h4 class="fw-bold mb-3 text-dark-emerald">Catatan Aktivitas Sistem (Audit Log)</h4>
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Admin</th>
                  <th>Aktivitas</th>
                  <th>Detail</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="auditLogBody">
                <tr><td colspan="5" class="text-center">Memuat riwayat aktivitas...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <?!= include('Scripts'); ?>
</body>
</html>
`
  },
  {
    name: 'Login.html',
    type: 'html',
    description: 'Halaman login admin dengan validasi aman dan penanganan error.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Admin - <?= appSettings.app_name ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <?!= include('Styles'); ?>
</head>
<body class="dashboard-body d-flex align-items-center justify-content-center min-vh-100">

  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white position-relative">
          
          <div class="text-center mb-4">
            <div class="logo-wrapper mx-auto mb-3" style="width: 72px; height: 72px;">
              <img src="<?= appSettings.logo_url ?>" alt="Logo" class="rounded-circle w-100 h-100 object-fit-cover shadow-sm">
            </div>
            <h3 class="fw-bold text-dark-emerald mb-1">Login Admin</h3>
            <p class="text-muted small"><?= appSettings.app_name ?> - <?= appSettings.subtitle ?></p>
          </div>

          <div id="loginAlert" class="alert alert-danger d-none rounded-3 small py-2"></div>

          <form id="adminLoginForm" onsubmit="handleLoginSubmit(event)">
            <div class="mb-3">
              <label class="form-label fw-semibold text-secondary small">Email Administrator</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 rounded-start-3"><i class="bi bi-envelope"></i></span>
                <input type="email" class="form-control rounded-end-3" id="loginEmail" required placeholder="admin@madrasah.sch.id">
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary small">Password</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 rounded-start-3"><i class="bi bi-key"></i></span>
                <input type="password" class="form-control rounded-end-3" id="loginPassword" required placeholder="••••••••">
              </div>
            </div>

            <button type="submit" id="btnLoginSubmit" class="btn btn-emerald w-100 rounded-pill py-2 fw-semibold shadow-sm">
              <span id="loginSpinner" class="spinner-border spinner-border-sm me-2 d-none"></span>
              Masuk ke Panel Admin
            </button>
          </form>

          <div class="text-center mt-4 pt-3 border-top">
            <a href="<?= getAppUrl() ?>" class="text-decoration-none text-muted small">
              <i class="bi bi-arrow-left me-1"></i> Kembali ke Dashboard Utama
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <?!= include('Scripts'); ?>
</body>
</html>
`
  },
  {
    name: 'Styles.html',
    type: 'html',
    description: 'Seluruh CSS styling untuk dashboard sage green, mint green, dan kartu menu horizontal.',
    code: `<style>
:root {
  --color-sage-bg: #d8e5dd;
  --color-mint-panel: #98d8c8;
  --color-mint-gradient: linear-gradient(135deg, #a2ded0 0%, #b8e6db 100%);
  --color-dark-emerald: #1b4332;
  --color-forest-hover: #2d6a4f;
  --color-card-border: #134e4a;
}

body.dashboard-body {
  background-color: var(--color-sage-bg);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  color: #1b4332;
  min-height: 100vh;
}

/* Panel Besar Hijau Mint */
.main-card-panel {
  background: var(--color-mint-gradient);
  border-radius: 36px;
  max-width: 680px;
  margin: 0 auto;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 20px 40px rgba(27, 67, 50, 0.08), 0 4px 12px rgba(27, 67, 50, 0.04);
}

/* Tombol Navigasi Atas */
.top-nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(27, 67, 50, 0.15);
  color: var(--color-dark-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.top-nav-btn:hover {
  background: #ffffff;
  color: var(--color-forest-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

/* Logo Madrasah Tengah */
.logo-wrapper {
  width: 92px;
  height: 92px;
  position: relative;
}

.madrasah-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 3.5px solid #ffffff;
  background-color: #ffffff;
}

/* Judul & Subjudul */
.app-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.85rem;
  letter-spacing: 0.5px;
  color: var(--color-dark-emerald);
}

.app-subtitle {
  font-weight: 600;
  font-size: 0.95rem;
  color: #245842;
}

.badge-academic {
  background-color: rgba(27, 67, 50, 0.12);
  color: var(--color-dark-emerald);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.3px;
}

/* Kartu / Tombol Menu Horizontal Memanjang */
.menu-pill-card {
  background: rgba(255, 255, 255, 0.82);
  border: 2px solid var(--color-card-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 3px 8px rgba(19, 78, 74, 0.05);
}

.menu-pill-card:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(19, 78, 74, 0.12);
  border-color: #0f3d3a;
}

.menu-pill-card:active {
  transform: scale(0.99);
}

.menu-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(27, 67, 50, 0.09);
  color: var(--color-dark-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.menu-title-text {
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  color: var(--color-dark-emerald);
  text-transform: uppercase;
}

/* Tombol Tiga Titik */
.three-dots-btn {
  background: transparent;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--color-dark-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.three-dots-btn:hover {
  background: rgba(27, 67, 50, 0.12);
}

/* Tombol Emerald Kustom */
.btn-emerald {
  background-color: var(--color-dark-emerald);
  border-color: var(--color-dark-emerald);
  color: #ffffff;
}

.btn-emerald:hover {
  background-color: var(--color-forest-hover);
  border-color: var(--color-forest-hover);
  color: #ffffff;
}

.btn-outline-dark-emerald {
  color: var(--color-dark-emerald);
  border-color: var(--color-dark-emerald);
  background: transparent;
}

.btn-outline-dark-emerald:hover {
  background-color: var(--color-dark-emerald);
  color: #ffffff;
}

.text-dark-emerald {
  color: var(--color-dark-emerald) !important;
}

.text-emerald {
  color: #2d6a4f !important;
}

.bg-emerald {
  background-color: var(--color-dark-emerald) !important;
}

.admin-navbar {
  background-color: var(--color-dark-emerald);
}

@media (max-width: 576px) {
  .main-card-panel {
    border-radius: 28px;
    padding: 1.25rem !important;
  }
  .app-title {
    font-size: 1.55rem;
  }
  .menu-title-text {
    font-size: 0.85rem;
  }
}
</style>
`
  },
  {
    name: 'Scripts.html',
    type: 'html',
    description: 'JavaScript frontend untuk google.script.run, share API, modal, dan operasi menu.',
    code: `<script>
/**
 * Logika Frontend Google Apps Script untuk PKKMMTSSUKA26
 */

// Handle klik menu di dashboard
function handleMenuClick(menuId, jenisMenu, targetUrl, openMode) {
  if (jenisMenu === 'external' && targetUrl) {
    if (openMode === 'new_tab') {
      window.open(targetUrl, '_blank');
    } else {
      window.location.href = targetUrl;
    }
  } else if (jenisMenu === 'drive_folder' && targetUrl) {
    window.open(targetUrl, '_blank');
  } else {
    // Navigasi ke modul internal
    var baseUrl = '<?= getAppUrl() ?>';
    window.location.href = baseUrl + '?page=' + encodeURIComponent(menuId);
  }
}

// Salin tautan menu
function copyMenuLink(menuId) {
  var url = window.location.origin + window.location.pathname + '?page=' + encodeURIComponent(menuId);
  navigator.clipboard.writeText(url).then(function() {
    showToast('Tautan menu berhasil disalin ke papan klip!');
  }).catch(function() {
    showToast('Tautan: ' + url);
  });
}

// Bagikan Dashboard utama
function handleShareDashboard() {
  var shareData = {
    title: '<?= appSettings.app_name ?>',
    text: '<?= appSettings.subtitle ?> - Portal Madrasah MTs Suka',
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(function(err) {
      console.log('Share dibatalkan:', err);
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(function() {
      showToast('Tautan dashboard berhasil disalin!');
    });
  }
}

// Tampilkan detail menu di modal
function showMenuDetails(menuId, namaMenu, deskripsi) {
  document.getElementById('modalDetailTitle').textContent = namaMenu;
  document.getElementById('modalDetailDesc').textContent = deskripsi || 'Tidak ada deskripsi tambahan untuk menu ini.';
  var modalEl = document.getElementById('menuDetailModal');
  var modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// Tampilkan Toast Notifikasi
function showToast(message) {
  var toastEl = document.getElementById('appToast');
  if (!toastEl) return;
  document.getElementById('toastMessage').textContent = message;
  var toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
}

// Login Admin via google.script.run
function handleLoginSubmit(event) {
  event.preventDefault();
  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  var alertEl = document.getElementById('loginAlert');
  var spinner = document.getElementById('loginSpinner');
  var btn = document.getElementById('btnLoginSubmit');

  alertEl.classList.add('d-none');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  google.script.run
    .withSuccessHandler(function(response) {
      spinner.classList.add('d-none');
      btn.disabled = false;
      if (response && response.success) {
        sessionStorage.setItem('admin_token', response.sessionToken);
        sessionStorage.setItem('admin_user', JSON.stringify(response.user));
        window.location.href = '<?= getAppUrl() ?>?page=admin';
      }
    })
    .withFailureHandler(function(err) {
      spinner.classList.add('d-none');
      btn.disabled = false;
      alertEl.textContent = err.message || 'Login gagal. Periksa kembali email dan password Anda.';
      alertEl.classList.remove('d-none');
    })
    .loginAdmin(email, password);
}

// Logout Admin
function handleLogout() {
  var token = sessionStorage.getItem('admin_token');
  if (token) {
    google.script.run.logoutAdmin(token);
  }
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_user');
  window.location.href = '<?= getAppUrl() ?>';
}
</script>
`
  },
  {
    name: 'Components.html',
    type: 'html',
    description: 'Komponen modal form tambah/edit menu, konfirmasi hapus, dan file uploader.',
    code: `<!-- Modal Tambah / Edit Menu Dinamis -->
<div class="modal fade" id="menuFormModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content rounded-4 border-0 shadow">
      <div class="modal-header bg-emerald text-white rounded-top-4">
        <h5 class="modal-title fw-bold" id="menuModalTitle">Tambah Menu Baru</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <form id="menuForm" onsubmit="handleSaveMenu(event)">
        <div class="modal-body p-4">
          <input type="hidden" id="editMenuId" value="">
          
          <div class="row g-3">
            <div class="col-md-8">
              <label class="form-label fw-semibold">Nama Menu <span class="text-danger">*</span></label>
              <input type="text" class="form-control rounded-3" id="inputMenuName" required placeholder="Contoh: E. DOKUMEN PRESTASI SANTRI">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Jenis Menu <span class="text-danger">*</span></label>
              <select class="form-select rounded-3" id="inputMenuType" required>
                <option value="internal">Halaman Internal</option>
                <option value="external">Tautan Eksternal (URL)</option>
                <option value="drive_folder">Folder Google Drive</option>
                <option value="document">Dokumen / PDF</option>
                <option value="photo_gallery">Galeri Foto</option>
                <option value="video_gallery">Galeri Video</option>
                <option value="document_list">Daftar Dokumen</option>
                <option value="info_page">Halaman Informasi</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Deskripsi Menu</label>
              <textarea class="form-control rounded-3" id="inputMenuDesc" rows="2" placeholder="Uraian singkat tentang menu ini..."></textarea>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Ikon (Bootstrap Icons)</label>
              <input type="text" class="form-control rounded-3" id="inputMenuIcon" value="bi-folder" placeholder="bi-folder, bi-star, bi-book">
            </div>

            <div class="col-md-3">
              <label class="form-label fw-semibold">Urutan</label>
              <input type="number" class="form-control rounded-3" id="inputMenuOrder" value="1" min="1">
            </div>

            <div class="col-md-3">
              <label class="form-label fw-semibold">Status</label>
              <select class="form-select rounded-3" id="inputMenuStatus">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div class="col-md-8">
              <label class="form-label fw-semibold">Target URL / Link Eksternal</label>
              <input type="text" class="form-control rounded-3" id="inputMenuUrl" placeholder="https://... atau /modul/nama-modul">
            </div>

            <div class="col-md-4">
              <label class="form-label fw-semibold">Buka Di</label>
              <select class="form-select rounded-3" id="inputMenuOpenMode">
                <option value="current_tab">Halaman Ini (Tab Sama)</option>
                <option value="new_tab">Tab Baru (_blank)</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Google Drive Folder ID (Opsional)</label>
              <input type="text" class="form-control rounded-3" id="inputMenuFolderId" placeholder="ID folder Google Drive terkait dokumen menu ini">
            </div>
          </div>

        </div>
        <div class="modal-footer border-0 p-4 pt-0">
          <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
          <button type="submit" class="btn btn-emerald rounded-pill px-5">Simpan Data Menu</button>
        </div>
      </form>
    </div>
  </div>
</div>
`
  }
];

export function getBootstrapIconClass(iconName: string): string {
  const map: Record<string, string> = {
    TrendingUp: 'bi-graph-up-arrow',
    Briefcase: 'bi-briefcase-fill',
    Coins: 'bi-cash-coin',
    GraduationCap: 'bi-mortarboard-fill',
    FileText: 'bi-file-earmark-text-fill',
    Image: 'bi-images',
    Video: 'bi-camera-video-fill',
    Folder: 'bi-folder-fill',
    Award: 'bi-award-fill',
    BookOpen: 'bi-book-fill',
    Shield: 'bi-shield-check',
    Users: 'bi-people-fill',
    Calendar: 'bi-calendar-event'
  };
  return map[iconName] || 'bi-folder-fill';
}
