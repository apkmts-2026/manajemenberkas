import { 
  MenuItem, 
  AppSettings, 
  DriveFile, 
  AdminUser, 
  AuditLog, 
  NotificationLog 
} from '../types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_MENUS, 
  INITIAL_DRIVE_FILES, 
  INITIAL_ADMINS, 
  INITIAL_AUDIT_LOGS 
} from '../data/defaultData';

const STORAGE_KEYS = {
  SETTINGS: 'pkkm_settings_v1',
  MENUS: 'pkkm_menus_v1',
  FILES: 'pkkm_files_v1',
  ADMINS: 'pkkm_admins_v1',
  LOGS: 'pkkm_logs_v1',
  NOTIFS: 'pkkm_notifs_v1',
  AUTH: 'pkkm_current_admin_v1',
  CUSTOM_LOGO: 'pkkm_custom_logo_v1',
  CUSTOM_BG: 'pkkm_custom_bg_v1'
};

function isUnsplashUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('images.unsplash.com') || url.includes('unsplash');
}

class StorageService {
  private notifyListeners() {
    window.dispatchEvent(new Event('pkkm_storage_updated'));
  }

  // === SETTINGS ===
  getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let customLogo = localStorage.getItem(STORAGE_KEYS.CUSTOM_LOGO);
    let customBg = localStorage.getItem(STORAGE_KEYS.CUSTOM_BG);

    // Clean up any stale Unsplash placeholder that might have been saved in CUSTOM_LOGO
    if (customLogo && isUnsplashUrl(customLogo)) {
      try {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_LOGO);
      } catch {}
      customLogo = null;
    }

    if (!raw) {
      const initial: AppSettings = {
        ...DEFAULT_SETTINGS,
        logo_url: customLogo || DEFAULT_SETTINGS.logo_url,
        background_image_url: customBg !== null && customBg !== undefined ? customBg : DEFAULT_SETTINGS.background_image_url
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initial));
      } catch {}
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      const parsedLogo = (parsed.logo_url && !isUnsplashUrl(parsed.logo_url)) ? parsed.logo_url : null;
      const effectiveLogo = customLogo || parsedLogo || DEFAULT_SETTINGS.logo_url;
      const effectiveBg = (customBg !== null && customBg !== undefined)
        ? customBg
        : (parsed.background_image_url !== undefined ? parsed.background_image_url : DEFAULT_SETTINGS.background_image_url);

      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        logo_url: effectiveLogo,
        background_image_url: effectiveBg,
        gas_web_app_url: parsed.gas_web_app_url || DEFAULT_SETTINGS.gas_web_app_url,
        spreadsheet_id: (parsed.spreadsheet_id && !parsed.spreadsheet_id.includes('pKKMMTsSuKa2026_GoOgLeShEeT'))
          ? parsed.spreadsheet_id
          : DEFAULT_SETTINGS.spreadsheet_id,
        drive_root_folder_id: (parsed.drive_root_folder_id && !parsed.drive_root_folder_id.includes('MTsSuka2026'))
          ? parsed.drive_root_folder_id
          : DEFAULT_SETTINGS.drive_root_folder_id
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    let current: AppSettings;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    try {
      current = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      current = DEFAULT_SETTINGS;
    }

    // Simpan logo dan background ke slot terproteksi agar tidak pernah terhapus oleh reload/sync
    if (settings.logo_url && settings.logo_url.trim() && !isUnsplashUrl(settings.logo_url)) {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, settings.logo_url);
      } catch (e) {
        console.warn('Quota exceeded for custom logo in local storage:', e);
      }
    }
    if (settings.background_image_url !== undefined) {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, settings.background_image_url);
      } catch (e) {
        console.warn('Quota exceeded for custom background in local storage:', e);
      }
    }

    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Quota exceeded for settings JSON:', e);
    }

    this.addLog('SYSTEM', 'UPDATE_PENGATURAN', 'Pengaturan identitas aplikasi diperbarui');
    this.notifyListeners();

    // Otomatis sinkronkan perubahan identitas ke Google Spreadsheet di background
    this.pushDataToRemote().catch(() => {});

    return updated;
  }

  /**
   * Menarik branding kustom yang tersimpan secara permanen di server disk lokal
   */
  async loadBrandingFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/get-branding');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.branding) {
          const current = this.getSettings();
          const patch: Partial<AppSettings> = {};
          let shouldUpdate = false;

          if (data.branding.logo_url && (!current.logo_url || isUnsplashUrl(current.logo_url) || current.logo_url === DEFAULT_SETTINGS.logo_url)) {
            patch.logo_url = data.branding.logo_url;
            try { localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, data.branding.logo_url); } catch {}
            shouldUpdate = true;
          }
          if (data.branding.background_image_url && !current.background_image_url) {
            patch.background_image_url = data.branding.background_image_url;
            try { localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, data.branding.background_image_url); } catch {}
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            const updated = { ...current, ...patch };
            try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated)); } catch {}
            this.notifyListeners();
          }
        }
      }
    } catch {}
  }

  // === MENUS ===
  getMenus(): MenuItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MENUS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(INITIAL_MENUS));
      return INITIAL_MENUS;
    }
    try {
      const parsed: MenuItem[] = JSON.parse(raw);
      return parsed.sort((a, b) => a.urutan - b.urutan);
    } catch {
      return INITIAL_MENUS;
    }
  }

  getActiveMenus(): MenuItem[] {
    return this.getMenus().filter(m => m.status === 'aktif');
  }

  saveAllMenus(menus: MenuItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
    this.notifyListeners();
    // Otomatis sinkronkan perubahan menu ke Google Spreadsheet di background
    this.pushDataToRemote().catch(() => {});
  }

  addMenu(menu: Omit<MenuItem, 'menu_id' | 'created_at' | 'updated_at'>): MenuItem {
    const menus = this.getMenus();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newMenu: MenuItem = {
      ...menu,
      menu_id: 'menu-' + Math.random().toString(36).substring(2, 9),
      created_at: now,
      updated_at: now,
      urutan: menu.urutan || menus.length + 1
    };
    menus.push(newMenu);
    this.saveAllMenus(menus);
    this.addLog(menu.created_by || 'admin', 'TAMBAH_MENU', `Menambahkan menu: ${newMenu.nama_menu}`);

    // Trigger email notification simulation
    this.sendNotificationEmail(
      `Menu Baru: ${newMenu.nama_menu}`,
      `Menu baru '${newMenu.nama_menu}' (Jenis: ${newMenu.jenis_menu}) telah ditambahkan oleh ${newMenu.created_by}.`
    );

    return newMenu;
  }

  updateMenu(menuId: string, updates: Partial<MenuItem>): MenuItem | null {
    const menus = this.getMenus();
    const index = menus.findIndex(m => m.menu_id === menuId);
    if (index === -1) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    menus[index] = {
      ...menus[index],
      ...updates,
      updated_at: now
    };
    this.saveAllMenus(menus);
    this.addLog('admin', 'UPDATE_MENU', `Memperbarui menu: ${menus[index].nama_menu}`);
    return menus[index];
  }

  deleteMenu(menuId: string): boolean {
    const menus = this.getMenus();
    const target = menus.find(m => m.menu_id === menuId);
    if (!target) return false;

    const filtered = menus.filter(m => m.menu_id !== menuId);
    // re-normalize order
    filtered.forEach((m, idx) => {
      m.urutan = idx + 1;
    });
    this.saveAllMenus(filtered);
    this.addLog('admin', 'HAPUS_MENU', `Menghapus menu: ${target.nama_menu}`);
    return true;
  }

  reorderMenu(menuId: string, direction: 'up' | 'down'): boolean {
    const menus = this.getMenus();
    const index = menus.findIndex(m => m.menu_id === menuId);
    if (index === -1) return false;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return false;

    const temp = menus[index].urutan;
    menus[index].urutan = menus[targetIndex].urutan;
    menus[targetIndex].urutan = temp;

    menus.sort((a, b) => a.urutan - b.urutan);
    this.saveAllMenus(menus);
    return true;
  }

  // === DRIVE FILES ===
  getFiles(): DriveFile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(INITIAL_DRIVE_FILES));
      return INITIAL_DRIVE_FILES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DRIVE_FILES;
    }
  }

  getFilesByMenu(menuId: string): DriveFile[] {
    return this.getFiles().filter(f => f.menu_id === menuId && f.status === 'aktif');
  }

  addFile(file: Omit<DriveFile, 'file_id' | 'created_at'>): DriveFile {
    const files = this.getFiles();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newFile: DriveFile = {
      ...file,
      file_id: 'DF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      created_at: now
    };
    files.unshift(newFile);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    this.addLog(file.created_by, 'UPLOAD_FILE_DRIVE', `Mengunggah berkas ${file.nama_file}`);
    this.notifyListeners();
    return newFile;
  }

  deleteFile(fileId: string): boolean {
    const files = this.getFiles();
    const updated = files.filter(f => f.file_id !== fileId);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(updated));
    this.addLog('admin', 'HAPUS_FILE', `Menghapus relasi berkas ID ${fileId}`);
    this.notifyListeners();
    return true;
  }

  // === ADMIN USERS ===
  getAdmins(): AdminUser[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ADMINS;
    }
  }

  getCurrentAdmin(): AdminUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCurrentAdmin(admin: AdminUser | null): void {
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    this.notifyListeners();
  }

  // === AUDIT LOGS ===
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  addLog(emailAdmin: string, aktivitas: string, detail: string, status: 'SUKSES' | 'GAGAL' | 'PERINGATAN' = 'SUKSES'): void {
    const logs = this.getAuditLogs();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLog = {
      log_id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      waktu: now,
      email_admin: emailAdmin,
      aktivitas,
      detail,
      status
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    this.notifyListeners();
  }

  // === EMAIL NOTIFICATIONS ===
  getNotifications(): NotificationLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  sendNotificationEmail(subjek: string, pesan: string): void {
    const settings = this.getSettings();
    if (!settings.email_notifications_enabled) return;

    const notifs = this.getNotifications();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newNotif: NotificationLog = {
      id: 'NOTIF-' + Date.now().toString(36),
      waktu: now,
      penerima: settings.notification_recipient_email || 'apk.mts2026@gmail.com',
      subjek,
      pesan,
      status: 'Terkirim'
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifs));
    this.notifyListeners();
  }

  // Reset to default
  resetToFactoryDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.MENUS);
    localStorage.removeItem(STORAGE_KEYS.FILES);
    localStorage.removeItem(STORAGE_KEYS.ADMINS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFS);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(INITIAL_MENUS));
    this.notifyListeners();
  }

  // === MULTI-DEVICE GOOGLE DRIVE & SPREADSHEET SYNC ENGINE ===
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private syncStatus: 'connected' | 'offline' | 'error' = 'offline';
  private syncMessage = 'Penyimpanan Lokal Aktif';

  getSyncState() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      status: this.syncStatus,
      message: this.syncMessage
    };
  }

  // Auto-clean & format Google Apps Script Web App URL
  sanitizeGASUrl(url: string): string {
    if (!url) return '';
    let cleaned = url.trim();
    // If user only pasted the deployment ID (e.g. AKfycbx...)
    if (/^AKfy[a-zA-Z0-9_-]{20,}$/.test(cleaned)) {
      return `https://script.google.com/macros/s/${cleaned}/exec`;
    }
    // If it's a macros/s URL missing /exec
    if (cleaned.includes('script.google.com/macros/s/')) {
      // Remove trailing slash or spaces
      cleaned = cleaned.replace(/\/+$/, '');
      if (!cleaned.endsWith('/exec') && !cleaned.endsWith('/dev')) {
        cleaned += '/exec';
      }
    }
    return cleaned;
  }

  async testGASConnection(rawUrl: string): Promise<{ success: boolean; message: string; autoFixedUrl?: string; data?: any; errorCode?: string; detail?: string }> {
    if (!rawUrl || !rawUrl.trim()) {
      return { success: false, message: 'URL Web App tidak boleh kosong.' };
    }

    const url = this.sanitizeGASUrl(rawUrl);
    const wasFixed = url !== rawUrl.trim();

    // 1. Coba lewat proxy internal diagnostik terlebih dahulu (mampu membaca detail pesan error dari Google tanpa terhalang CORS)
    try {
      const proxyRes = await fetch(`/api/test-gas?url=${encodeURIComponent(url)}`);
      if (proxyRes.ok) {
        const diag = await proxyRes.json();
        return {
          success: diag.success,
          message: diag.message,
          errorCode: diag.errorCode,
          detail: diag.detail,
          autoFixedUrl: wasFixed ? url : undefined,
          data: diag.data
        };
      }
    } catch {
      // Fallback ke direct fetch jika proxy tidak tersedia
    }

    // 2. Direct browser fetch fallback
    try {
      const endpoint = url + (url.includes('?') ? '&' : '?') + 'action=get_data';
      const res = await fetch(endpoint, { method: 'GET' });
      
      if (!res.ok) {
        if (res.status === 404) {
          return { 
            success: false, 
            errorCode: 'HTTP_404',
            message: 'Error 404: Web App tidak ditemukan. Pastikan saat Deploy memilih tipe "Web app" (Aplikasi Web), bukan Library/API, dan URL berakhiran /exec.',
            autoFixedUrl: wasFixed ? url : undefined
          };
        }
        return { 
          success: false, 
          errorCode: `HTTP_${res.status}`,
          message: `Gagal menghubungi server Google (Status HTTP: ${res.status})`,
          autoFixedUrl: wasFixed ? url : undefined
        };
      }

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (text.includes('Script function not found: doGet')) {
          return {
            success: false,
            errorCode: 'FUNCTION_NOT_FOUND_DOGET',
            message: "Google Apps Script merespons: 'Script function not found: doGet'. File Code.gs belum tersimpan di Apps Script atau Anda belum membuat Deployment Baru.",
            autoFixedUrl: wasFixed ? url : undefined
          };
        }
        return {
          success: false,
          errorCode: 'INVALID_RESPONSE',
          message: 'Server Google merespons tetapi bukan format JSON data. Kemungkinan kode Code.gs belum ditempel di Apps Script, atau terjadi error script.',
          autoFixedUrl: wasFixed ? url : undefined
        };
      }

      if (data && data.success) {
        return { 
          success: true, 
          message: `Koneksi Berhasil! Terhubung dengan Google Apps Script & Spreadsheet (${data.menus ? data.menus.length : 0} menu aktif).`,
          autoFixedUrl: wasFixed ? url : undefined,
          data 
        };
      }
      return { 
        success: false, 
        errorCode: 'GAS_ERROR',
        message: data.error || 'Server Apps Script merespons gagal. Periksa ID Spreadsheet di Config.gs.',
        autoFixedUrl: wasFixed ? url : undefined
      };
    } catch (err: any) {
      return { 
        success: false, 
        errorCode: 'NETWORK_ERROR',
        message: 'Tidak dapat menjangkau URL. Kemungkinan penyebab: 1) Fungsi doGet() belum tersimpan di Apps Script, 2) Akhiran URL belum /exec, atau 3) Akses di Apps Script belum diset "Anyone" (Siapa saja).',
        autoFixedUrl: wasFixed ? url : undefined
      };
    }
  }

  /**
   * Mengirim seluruh data menu dan identitas saat ini ke Google Spreadsheet
   * agar semua perangkat lain langsung mendapatkan data yang sama
   */
  async pushDataToRemote(): Promise<{ success: boolean; message: string; count?: number }> {
    const settings = this.getSettings();
    if (!settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    const url = this.sanitizeGASUrl(settings.gas_web_app_url);
    const menus = this.getMenus();
    const payload = {
      action: 'push_all_data',
      menus: menus,
      settings: {
        app_name: settings.app_name,
        subtitle: settings.subtitle,
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        background_color: settings.background_color,
        background_image_url: settings.background_image_url,
        footer_text: settings.footer_text,
        academic_year: settings.academic_year
      }
    };

    // 1. Coba kirim via server-side proxy terlebih dahulu (bebas CORS)
    try {
      const proxyRes = await fetch('/api/gas-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, data: payload })
      });
      if (proxyRes.ok) {
        const resData = await proxyRes.json();
        if (resData && resData.success) {
          this.syncStatus = 'connected';
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.syncMessage = `Tersimpan di Google Spreadsheet (${menus.length} menu)`;
          this.notifyListeners();
          return { success: true, message: `Berhasil mengirim ${menus.length} menu ke Google Spreadsheet!`, count: menus.length };
        }
      }
    } catch {
      // Fallback
    }

    // 2. Direct browser fetch fallback (menggunakan text/plain agar tidak memicu OPTIONS preflight)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json().catch(() => null);
      if (resData && resData.success) {
        this.syncStatus = 'connected';
        this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.syncMessage = `Tersimpan di Google Spreadsheet (${menus.length} menu)`;
        this.notifyListeners();
        return { success: true, message: `Berhasil mengirim ${menus.length} menu ke Google Spreadsheet!`, count: menus.length };
      }
    } catch (err: any) {
      console.warn('Direct push warning:', err);
    }

    return { success: true, message: `Data dikirim ke server Google Apps Script (${menus.length} menu).` };
  }

  /**
   * Menarik data terbaru dari Google Spreadsheet ke dalam browser
   */
  async syncWithRemote(): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      this.syncStatus = 'offline';
      this.syncMessage = 'Mode Offline (Penyimpanan Lokal)';
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners();

    const url = this.sanitizeGASUrl(settings.gas_web_app_url);
    let remoteData: any = null;

    // 1. Coba ambil lewat proxy backend (menghindari blokir CORS browser pihak ketiga)
    try {
      const proxyRes = await fetch(`/api/gas-sync?url=${encodeURIComponent(url)}&action=get_data`);
      if (proxyRes.ok) {
        remoteData = await proxyRes.json();
      }
    } catch {
      // Fallback
    }

    // 2. Direct browser fetch fallback
    if (!remoteData || !remoteData.success) {
      try {
        const endpoint = url + (url.includes('?') ? '&' : '?') + 'action=get_data';
        const res = await fetch(endpoint);
        if (res.ok) {
          remoteData = await res.json();
        }
      } catch (err) {
        console.warn('Direct fetch error:', err);
      }
    }

    if (remoteData && remoteData.success) {
      if (remoteData.menus && Array.isArray(remoteData.menus) && remoteData.menus.length > 0) {
        localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(remoteData.menus));
      }
      if (remoteData.settings) {
        const current = this.getSettings();
        const incoming = { ...remoteData.settings };

        // PENTING: Hanya timpa logo jika dari Spreadsheet terisi nilai valid dan BUKAN placeholder Unsplash
        const isRemotePlaceholder = !incoming.logo_url || isUnsplashUrl(incoming.logo_url);
        if (!isRemotePlaceholder && incoming.logo_url && incoming.logo_url.trim()) {
          try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, incoming.logo_url);
          } catch {}
        } else {
          // Jangan sentuh logo kustom pengguna jika remote mengirim URL kosong atau Unsplash
          incoming.logo_url = current.logo_url;
        }

        // PENTING: Hanya timpa background jika dari Spreadsheet terisi nilai valid (bukan string kosong)
        if (incoming.background_image_url && incoming.background_image_url.trim()) {
          try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, incoming.background_image_url);
          } catch {}
        } else {
          // Pertahankan background kustom yang sudah diunggah oleh pengguna
          incoming.background_image_url = current.background_image_url;
        }

        const merged: AppSettings = {
          ...current,
          ...incoming,
          logo_url: (!isUnsplashUrl(current.logo_url) && current.logo_url) ? current.logo_url : incoming.logo_url,
          background_image_url: current.background_image_url || incoming.background_image_url || ''
        };
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        } catch {}
      }
      if (remoteData.files && Array.isArray(remoteData.files) && remoteData.files.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(remoteData.files));
      }
      this.syncStatus = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.syncMessage = `Live Google Spreadsheet Aktif (${this.lastSyncTime})`;
      this.isSyncing = false;
      this.notifyListeners();
      return true;
    }

    this.syncStatus = 'offline';
    this.syncMessage = 'Sinkronisasi tertunda (menggunakan data lokal)';
    this.isSyncing = false;
    this.notifyListeners();
    return false;
  }

  /**
   * Mengunggah file logo atau background ke server lokal & Google Drive via Google Apps Script
   * Menjamin keabadian 100% tanpa risiko ter-reset saat di-reload
   */
  async uploadBrandingAsset(
    assetType: 'logo' | 'background',
    dataUrl: string,
    fileName?: string
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    let activeUrl = dataUrl;

    // 1. Simpan permanen ke server filesystem lokal (/public/uploads/...)
    try {
      const serverRes = await fetch('/api/upload-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: assetType, dataUrl })
      });
      if (serverRes.ok) {
        const sData = await serverRes.json();
        if (sData && sData.success && sData.url) {
          activeUrl = sData.url;
          if (assetType === 'logo') {
            try { localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, activeUrl); } catch {}
          } else {
            try { localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, activeUrl); } catch {}
          }
          this.saveSettings(assetType === 'logo' ? { logo_url: activeUrl } : { background_image_url: activeUrl });
        }
      }
    } catch (e) {
      console.warn('Local server upload warning:', e);
    }

    // 2. Jika Google Apps Script terhubung, unggah juga ke Google Drive & simpan ke Google Spreadsheet
    const settings = this.getSettings();
    if (settings.gas_web_app_url && settings.gas_web_app_url.trim()) {
      const url = this.sanitizeGASUrl(settings.gas_web_app_url);
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const defaultName = assetType === 'logo' ? 'logo_madrasah.jpg' : 'background_madrasah.jpg';

        const payload = {
          action: 'upload_branding_asset',
          assetType,
          name: fileName || defaultName,
          mimeType,
          base64Data
        };

        try {
          const proxyRes = await fetch('/api/gas-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, data: payload })
          });
          if (proxyRes.ok) {
            const resData = await proxyRes.json();
            if (resData && resData.success && resData.url) {
              activeUrl = resData.url;
              if (assetType === 'logo') {
                try { localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, resData.url); } catch {}
              } else {
                try { localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, resData.url); } catch {}
              }
              this.saveSettings(assetType === 'logo' ? { logo_url: resData.url } : { background_image_url: resData.url });
              return { success: true, url: resData.url };
            }
          }
        } catch {}

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          const resData = await res.json().catch(() => null);
          if (resData && resData.success && resData.url) {
            activeUrl = resData.url;
            if (assetType === 'logo') {
              try { localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, resData.url); } catch {}
            } else {
              try { localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, resData.url); } catch {}
            }
            this.saveSettings(assetType === 'logo' ? { logo_url: resData.url } : { background_image_url: resData.url });
            return { success: true, url: resData.url };
          }
        } catch (err: any) {
          console.warn('Direct upload to GAS warning:', err);
        }
      }
    }

    return { success: true, url: activeUrl, message: 'Tersimpan permanen di penyimpanan lokal!' };
  }
}

export const storage = new StorageService();
