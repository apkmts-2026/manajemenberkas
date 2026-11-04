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
  AUTH: 'pkkm_current_admin_v1'
};

class StorageService {
  private notifyListeners() {
    window.dispatchEvent(new Event('pkkm_storage_updated'));
  }

  // === SETTINGS ===
  getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.addLog('SYSTEM', 'UPDATE_PENGATURAN', 'Pengaturan identitas aplikasi diperbarui');
    this.notifyListeners();
    return updated;
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

  async testGASConnection(rawUrl: string): Promise<{ success: boolean; message: string; autoFixedUrl?: string; data?: any }> {
    if (!rawUrl || !rawUrl.trim()) {
      return { success: false, message: 'URL Web App tidak boleh kosong.' };
    }

    const url = this.sanitizeGASUrl(rawUrl);
    const wasFixed = url !== rawUrl.trim();

    try {
      const endpoint = url + (url.includes('?') ? '&' : '?') + 'action=get_data';
      const res = await fetch(endpoint, { method: 'GET' });
      
      if (!res.ok) {
        if (res.status === 404) {
          return { 
            success: false, 
            message: 'Error 404: Web App tidak ditemukan. Pastikan saat Deploy memilih tipe "Web app" (Aplikasi Web), bukan Library/API, dan URL berakhiran /exec.',
            autoFixedUrl: wasFixed ? url : undefined
          };
        }
        return { 
          success: false, 
          message: `Gagal menghubungi server Google (Status HTTP: ${res.status})`,
          autoFixedUrl: wasFixed ? url : undefined
        };
      }

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
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
        message: data.error || 'Server Apps Script merespons gagal. Periksa ID Spreadsheet di Config.gs.',
        autoFixedUrl: wasFixed ? url : undefined
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: 'Tidak dapat menjangkau URL. Kemungkinan penyebab: 1) Akhiran URL belum /exec, 2) Akses di Apps Script belum diset "Anyone" (Siapa saja), atau 3) Kode Code.gs belum tersimpan di Apps Script.',
        autoFixedUrl: wasFixed ? url : undefined
      };
    }
  }

  async syncWithRemote(): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      this.syncStatus = 'offline';
      this.syncMessage = 'Mode Offline (Penyimpanan Lokal)';
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const url = this.sanitizeGASUrl(settings.gas_web_app_url);
      const endpoint = url + (url.includes('?') ? '&' : '?') + 'action=get_data';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          if (data.menus && Array.isArray(data.menus)) {
            localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(data.menus));
          }
          if (data.settings) {
            const merged = { ...settings, ...data.settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          }
          this.syncStatus = 'connected';
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.syncMessage = `Sinkronisasi Live Aktif (Update: ${this.lastSyncTime})`;
          this.isSyncing = false;
          this.notifyListeners();
          return true;
        }
      }
    } catch (err) {
      console.warn('Sync gagal:', err);
      this.syncStatus = 'error';
      this.syncMessage = 'Sinkronisasi tertunda (menggunakan cache lokal)';
    }

    this.isSyncing = false;
    this.notifyListeners();
    return false;
  }
}

export const storage = new StorageService();
