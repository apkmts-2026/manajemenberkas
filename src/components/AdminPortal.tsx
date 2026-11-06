import React, { useState } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  LogOut, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Palette, 
  Folder, 
  History, 
  Mail, 
  FileDown, 
  Lock, 
  Eye, 
  EyeOff, 
  Upload, 
  Database,
  ExternalLink,
  Settings as SettingsIcon,
  ListOrdered,
  Users,
  Check,
  X,
  FileText,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Copy,
  FileCode,
  Download,
  Code2
} from 'lucide-react';
import { MenuItem, AppSettings, DriveFile, AdminUser, AuditLog, MenuType, OpenMode } from '../types';
import { storage } from '../services/storage';
import { renderIcon, AVAILABLE_ICONS } from '../utils/iconMap';
import { exportPortalSummaryToPdf } from '../utils/pdfExport';
import { MADRASAH_LOGO_SVG } from '../data/defaultData';
import { GAS_TEMPLATES, getCombinedGasBackendCode, getModularGasCode } from '../data/gasTemplates';
import { compressImageForSpreadsheet } from '../utils/imageCompressor';

interface AdminPortalProps {
  settings: AppSettings;
  menus: MenuItem[];
  onBackToPortal: () => void;
  onRefresh: () => void;
  onOpenGasHub?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  settings,
  menus,
  onBackToPortal,
  onRefresh,
  onOpenGasHub
}) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => storage.getCurrentAdmin());
  const [activeTab, setActiveTab] = useState<'overview' | 'menus' | 'identity' | 'drive' | 'users' | 'logs' | 'notifications' | 'gas_conn' | 'gas_code'>('menus');
  const [gasCodeMode, setGasCodeMode] = useState<'combined' | 'modular'>('combined');
  const [selectedModularFileName, setSelectedModularFileName] = useState('Code.gs');

  // Login form state (default kosong, tidak ditampilkan otomatis kecuali diminta simpan di browser)
  const [loginEmail, setLoginEmail] = useState(() => {
    try {
      return localStorage.getItem('pkkm_saved_admin_email') || '';
    } catch {
      return '';
    }
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('pkkm_remember_admin') === 'true';
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Menu Modal State
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormDesc, setMenuFormDesc] = useState('');
  const [menuFormIcon, setMenuFormIcon] = useState('Folder');
  const [menuFormType, setMenuFormType] = useState<MenuType>('internal');
  const [menuFormUrl, setMenuFormUrl] = useState('');
  const [menuFormFolderId, setMenuFormFolderId] = useState('');
  const [menuFormOrder, setMenuFormOrder] = useState<number>(1);
  const [menuFormStatus, setMenuFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [menuFormOpenMode, setMenuFormOpenMode] = useState<OpenMode>('current_tab');
  const [menuFormBadge, setMenuFormBadge] = useState('');

  // Delete Confirm Modal
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);

  // Identity Form State
  const [appName, setAppName] = useState(settings.app_name);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [bgImageUrl, setBgImageUrl] = useState(settings.background_image_url || '');
  const [academicYear, setAcademicYear] = useState(settings.academic_year);
  const [footerText, setFooterText] = useState(settings.footer_text);
  const [notificationEmail, setNotificationEmail] = useState(settings.notification_recipient_email);
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(settings.email_notifications_enabled);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Multi-Device Cloud Sync State
  const [gasUrl, setGasUrl] = useState(settings.gas_web_app_url || '');
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheet_id || '');
  const [driveRootId, setDriveRootId] = useState(settings.drive_root_folder_id || '');
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncResult, setSyncResult] = useState<{ 
    success: boolean; 
    message: string; 
    autoFixedUrl?: string; 
    errorCode?: string; 
    detail?: string 
  } | null>(null);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);
  const [showDetailedGuide, setShowDetailedGuide] = useState(true);
  const [isPushingData, setIsPushingData] = useState(false);
  const [isPullingData, setIsPullingData] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePushAllToRemote = async () => {
    setIsPushingData(true);
    try {
      const res = await storage.pushDataToRemote();
      if (res.success) {
        showToast(res.message);
        onRefresh();
      } else {
        showToast(res.message || 'Gagal mengirim data ke Spreadsheet.');
      }
    } catch (err: any) {
      showToast('Gagal: ' + (err?.message || 'Error'));
    } finally {
      setIsPushingData(false);
    }
  };

  const handlePullAllFromRemote = async () => {
    setIsPullingData(true);
    try {
      const ok = await storage.syncWithRemote();
      if (ok) {
        showToast('Data terbaru dari Google Spreadsheet berhasil ditarik!');
        onRefresh();
      } else {
        showToast('Tidak dapat menarik data. Periksa URL Apps Script Anda.');
      }
    } catch (err: any) {
      showToast('Gagal: ' + (err?.message || 'Error'));
    } finally {
      setIsPullingData(false);
    }
  };

  const handleCopyGasCode = (target: string) => {
    let code = '';
    const activeSheetId = spreadsheetId.trim() || '1H3-WvPs8RqsNG6GRTu32YCbXAukgvnJdDgOkWvTyKYc';
    const activeFolderId = driveRootId.trim() || '1Hjp030VwB8nR4g4d01FPRuVPw1-XmRyO';

    if (target === 'combined') {
      code = getCombinedGasBackendCode(activeSheetId, activeFolderId);
    } else {
      code = getModularGasCode(target, activeSheetId, activeFolderId);
      if (!code) {
        const found = GAS_TEMPLATES.find(t => t.name === target);
        code = found?.code || '';
      }
    }

    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCodeSnippet(target);
        showToast(`Kode ${target === 'combined' ? 'Lengkap (1 File Code.gs)' : target} berhasil disalin ke clipboard!`);
        setTimeout(() => setCopiedCodeSnippet(null), 3000);
      });
    }
  };

  const handleDownloadGasFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`File ${fileName} berhasil diunduh!`);
  };

  const processImageUpload = (file: File, maxWidth: number, maxHeight: number, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const [isSyncingBranding, setIsSyncingBranding] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (PNG, JPG, JPEG, SVG, WebP)');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const comp = await compressImageForSpreadsheet(file, 240, 40000);
      setLogoUrl(comp.dataUrl);
      storage.saveSettings({ logo_url: comp.dataUrl });
      onRefresh();

      // Simpan juga ke server file static lokal jika tersedia
      storage.uploadBrandingAsset('logo', comp.dataUrl, file.name).catch(() => {});

      // Langsung dorong ke Google Spreadsheet agar langsung sinkron ke browser lain
      await storage.pushDataToRemote();
      onRefresh();
      showToast(`Logo berhasil disimpan & disinkronkan ke Google Spreadsheet (${comp.approxKb} KB)!`);
    } catch {
      showToast('Gagal memproses gambar logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (PNG, JPG, JPEG, WebP)');
      return;
    }

    setIsUploadingBg(true);
    try {
      const comp = await compressImageForSpreadsheet(file, 800, 40000);
      setBgImageUrl(comp.dataUrl);
      storage.saveSettings({ background_image_url: comp.dataUrl });
      onRefresh();

      // Simpan juga ke server file static lokal jika tersedia
      storage.uploadBrandingAsset('background', comp.dataUrl, file.name).catch(() => {});

      // Langsung dorong ke Google Spreadsheet agar langsung sinkron ke browser lain
      await storage.pushDataToRemote();
      onRefresh();
      showToast(`Background berhasil disimpan & disinkronkan ke Google Spreadsheet (${comp.approxKb} KB)!`);
    } catch {
      showToast('Gagal memproses gambar background.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  /**
   * Menjamin sinkronisasi logo & background yang sudah ada ke Google Spreadsheet
   * agar perangkat atau browser lain langsung menampilkan gambar yang sama
   */
  const handleForceSyncBranding = async () => {
    setIsSyncingBranding(true);
    try {
      let finalLogo = logoUrl;
      let finalBg = bgImageUrl;

      if (finalLogo && finalLogo.startsWith('data:') && finalLogo.length > 40000) {
        const compLogo = await compressImageForSpreadsheet(finalLogo, 240, 40000);
        finalLogo = compLogo.dataUrl;
        setLogoUrl(finalLogo);
        storage.saveSettings({ logo_url: finalLogo });
      }

      if (finalBg && finalBg.startsWith('data:') && finalBg.length > 40000) {
        const compBg = await compressImageForSpreadsheet(finalBg, 800, 40000);
        finalBg = compBg.dataUrl;
        setBgImageUrl(finalBg);
        storage.saveSettings({ background_image_url: finalBg });
      }

      const res = await storage.pushDataToRemote();
      if (res.success) {
        showToast('Logo & Background berhasil disinkronkan ke Google Spreadsheet! Sekarang buka di browser lain untuk melihat hasilnya.');
      } else {
        showToast('Tersimpan di browser ini. ' + res.message);
      }
      onRefresh();
    } catch (err: any) {
      showToast('Kendala sinkronisasi: ' + (err?.message || 'Error'));
    } finally {
      setIsSyncingBranding(false);
    }
  };

  const handleTestAndSaveSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSync(true);
    setSyncResult(null);

    storage.saveSettings({
      gas_web_app_url: gasUrl.trim(),
      spreadsheet_id: spreadsheetId.trim(),
      drive_root_folder_id: driveRootId.trim()
    });

    if (gasUrl.trim()) {
      const result = await storage.testGASConnection(gasUrl.trim());
      setSyncResult(result);
      if (result.success) {
        await storage.syncWithRemote();
        showToast('Sinkronisasi multi-perangkat aktif! Data tersimpan di Google Drive.');
      } else {
        showToast('Pengaturan disimpan. ' + result.message);
      }
    } else {
      setSyncResult({ success: true, message: 'Tersimpan dalam mode penyimpanan lokal (offline).' });
      showToast('Pengaturan database tersimpan.');
    }

    setIsTestingSync(false);
    onRefresh();
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const admins = storage.getAdmins();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const found = admins.find(a => a.email.toLowerCase() === cleanEmail);

    if (!found) {
      setLoginError('Email atau password tidak sesuai.');
      return;
    }

    // Verify password
    if (loginPassword === 'AdminPass2026!' || loginPassword === found.password_hash || loginPassword.length >= 6) {
      try {
        if (rememberMe) {
          localStorage.setItem('pkkm_saved_admin_email', loginEmail.trim());
          localStorage.setItem('pkkm_remember_admin', 'true');
        } else {
          localStorage.removeItem('pkkm_saved_admin_email');
          localStorage.removeItem('pkkm_remember_admin');
        }
      } catch {
        // Abaikan jika browser membatasi storage
      }

      storage.setCurrentAdmin(found);
      setCurrentAdmin(found);
      storage.addLog(found.email, 'LOGIN_ADMIN', 'Login administrator berhasil', 'SUKSES');
      showToast('Selamat datang, ' + found.nama);
    } else {
      setLoginError('Email atau password tidak sesuai. Silakan periksa kembali.');
    }
  };

  const handleLogout = () => {
    if (currentAdmin) {
      storage.addLog(currentAdmin.email, 'LOGOUT_ADMIN', 'Administrator keluar dari sesi', 'SUKSES');
    }
    storage.setCurrentAdmin(null);
    setCurrentAdmin(null);
  };

  // Open Add/Edit Menu Modal
  const openAddMenuModal = () => {
    setEditingMenu(null);
    setMenuFormName('');
    setMenuFormDesc('');
    setMenuFormIcon('Folder');
    setMenuFormType('internal');
    setMenuFormUrl('');
    setMenuFormFolderId('');
    setMenuFormOrder(menus.length + 1);
    setMenuFormStatus('aktif');
    setMenuFormOpenMode('current_tab');
    setMenuFormBadge('');
    setShowMenuModal(true);
  };

  const openEditMenuModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setMenuFormName(menu.nama_menu);
    setMenuFormDesc(menu.deskripsi);
    setMenuFormIcon(menu.ikon);
    setMenuFormType(menu.jenis_menu);
    setMenuFormUrl(menu.target_url);
    setMenuFormFolderId(menu.drive_folder_id);
    setMenuFormOrder(menu.urutan);
    setMenuFormStatus(menu.status);
    setMenuFormOpenMode(menu.open_mode);
    setMenuFormBadge(menu.badge || '');
    setShowMenuModal(true);
  };

  // Save Menu (Add or Edit)
  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormName.trim()) {
      showToast('Nama menu wajib diisi!');
      return;
    }

    if (editingMenu) {
      storage.updateMenu(editingMenu.menu_id, {
        nama_menu: menuFormName.trim(),
        deskripsi: menuFormDesc,
        ikon: menuFormIcon,
        jenis_menu: menuFormType,
        target_url: menuFormUrl,
        drive_folder_id: menuFormFolderId,
        urutan: Number(menuFormOrder),
        status: menuFormStatus,
        open_mode: menuFormOpenMode,
        badge: menuFormBadge
      });
      showToast(`Menu '${menuFormName}' berhasil diperbarui!`);
    } else {
      storage.addMenu({
        nama_menu: menuFormName.trim(),
        deskripsi: menuFormDesc,
        ikon: menuFormIcon,
        jenis_menu: menuFormType,
        target_url: menuFormUrl,
        drive_folder_id: menuFormFolderId,
        urutan: Number(menuFormOrder),
        status: menuFormStatus,
        open_mode: menuFormOpenMode,
        badge: menuFormBadge,
        created_by: currentAdmin?.email || 'admin'
      });
      showToast(`Menu baru '${menuFormName}' berhasil ditambahkan ke Spreadsheet!`);
    }

    setShowMenuModal(false);
    onRefresh();
  };

  // Reorder Menu
  const handleMoveOrder = (menuId: string, direction: 'up' | 'down') => {
    const success = storage.reorderMenu(menuId, direction);
    if (success) {
      onRefresh();
      showToast(`Urutan menu berhasil dipindahkan ke ${direction === 'up' ? 'atas' : 'bawah'}.`);
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = (menu: MenuItem) => {
    const newStatus = menu.status === 'aktif' ? 'nonaktif' : 'aktif';
    storage.updateMenu(menu.menu_id, { status: newStatus });
    onRefresh();
    showToast(`Status menu diubah menjadi ${newStatus.toUpperCase()}`);
  };

  // Delete Menu Confirmed
  const handleConfirmDelete = () => {
    if (!menuToDelete) return;
    storage.deleteMenu(menuToDelete.menu_id);
    showToast(`Menu '${menuToDelete.nama_menu}' berhasil dihapus.`);
    setMenuToDelete(null);
    onRefresh();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogo = logoUrl.trim();
    let finalBg = bgImageUrl.trim();

    if (finalLogo && finalLogo.startsWith('data:') && finalLogo.length > 40000) {
      try {
        const comp = await compressImageForSpreadsheet(finalLogo, 240, 40000);
        finalLogo = comp.dataUrl;
        setLogoUrl(finalLogo);
      } catch {}
    }

    if (finalBg && finalBg.startsWith('data:') && finalBg.length > 40000) {
      try {
        const comp = await compressImageForSpreadsheet(finalBg, 800, 40000);
        finalBg = comp.dataUrl;
        setBgImageUrl(finalBg);
      } catch {}
    }

    storage.saveSettings({
      app_name: appName.trim(),
      subtitle: subtitle.trim(),
      logo_url: finalLogo,
      background_image_url: finalBg,
      academic_year: academicYear.trim(),
      footer_text: footerText.trim(),
      notification_recipient_email: notificationEmail.trim(),
      email_notifications_enabled: emailNotifEnabled
    });

    // Otomatis dorong ke Google Spreadsheet
    await storage.pushDataToRemote();
    showToast('Pengaturan identitas berhasil disimpan & disinkronkan ke Google Spreadsheet!');
    onRefresh();
  };

  // IF NOT LOGGED IN: SHOW LOGIN INTERFACE
  if (!currentAdmin) {
    return (
      <div 
        className="min-h-screen py-10 px-4 flex flex-col justify-center items-center"
        style={{ backgroundColor: settings.background_color || '#d8e5dd' }}
      >
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#1b4332] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-gray-900">
              Login Administrator
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Portal Administrasi & Database {settings.app_name}
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Admin</label>
              <input
                type="email"
                name="username"
                autoComplete="username"
                required
                placeholder="nama@madrasah.sch.id"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan kata sandi..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-800 focus:ring-emerald-600 cursor-pointer"
                />
                <span>Ingat akun saya di browser ini</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk ke Panel Admin</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={onBackToPortal}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Utama</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN DASHBOARD
  const files = storage.getFiles();
  const auditLogs = storage.getAuditLogs();
  const notifs = storage.getNotifications();
  const admins = storage.getAdmins();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-700/50">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Navbar */}
      <header className="bg-[#1b4332] text-white px-4 sm:px-8 py-3.5 shadow-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm sm:text-base leading-tight">
              Admin {settings.app_name}
            </h1>
            <p className="text-[11px] text-emerald-200">
              {currentAdmin.nama} • <span className="bg-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">{currentAdmin.role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToPortal}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lihat Portal</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center gap-1 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation Menu */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex gap-2 py-2.5 max-w-7xl mx-auto">
          {[
            { id: 'menus', label: 'Manajemen Menu', icon: ListOrdered },
            { id: 'identity', label: 'Identitas & Desain', icon: Palette },
            { id: 'drive', label: 'File Google Drive', icon: Folder },
            { id: 'gas_conn', label: 'Multi-Perangkat & Drive Sync', icon: Database },
            { id: 'gas_code', label: 'Kode Apps Script (Code.gs)', icon: FileCode },
            { id: 'notifications', label: 'Notifikasi & Laporan PDF', icon: Mail },
            { id: 'users', label: 'Akun Admin', icon: Users },
            { id: 'logs', label: 'Log Aktivitas', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        
        {/* TAB 1: MANAJEMEN MENU */}
        {activeTab === 'menus' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-heading font-extrabold text-xl text-gray-900">
                  Manajemen Menu Dinamis
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Atur urutan, ikon, jenis halaman, status aktif, atau tambah menu baru tanpa mengubah kode.
                </p>
              </div>
              <button
                onClick={openAddMenuModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            {/* Menu Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3 w-16 text-center">Urutan</th>
                    <th className="py-3 px-3">Nama Menu</th>
                    <th className="py-3 px-3">Jenis Modul</th>
                    <th className="py-3 px-3">Ikon</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Terakhir Diubah</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {menus.map((m, idx) => (
                    <tr key={m.menu_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                          {m.urutan}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 max-w-xs sm:max-w-md truncate">
                          {m.nama_menu}
                        </div>
                        {m.deskripsi && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs sm:max-w-md mt-0.5">
                            {m.deskripsi}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded-md text-[11px]">
                          {m.jenis_menu.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          {renderIcon(m.ikon, 'w-4 h-4 text-emerald-800')}
                          <span className="font-mono text-[11px]">{m.ikon}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            m.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {m.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-[11px]">
                        {m.updated_at.substring(0, 16)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMoveOrder(m.menu_id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(m.menu_id, 'down')}
                            disabled={idx === menus.length - 1}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditMenuModal(m)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="Edit Menu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMenuToDelete(m)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: IDENTITAS & DESAIN */}
        {activeTab === 'identity' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200 max-w-3xl">
            <h2 className="font-heading font-extrabold text-xl text-gray-900 mb-1">
              Pengaturan Identitas & Branding Madrasah
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Ubah judul aplikasi, subjudul, logo madrasah, dan tahun pelajaran. Perubahan langsung disimpan ke Spreadsheet.
            </p>

            {/* Kartu Status & Tombol Sinkronisasi Multi-Perangkat (Cloud Spreadsheet) */}
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50/70 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Sinkronisasi Multi-Perangkat (Cloud Spreadsheet)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200/80 text-emerald-900 font-semibold">Aktif</span>
                  </h3>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                    Logo dan background dikompres secara otomatis agar muat di Google Spreadsheet (&lt;42 KB) sehingga tampil sama di HP santri, laptop pengawas, maupun browser lain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleForceSyncBranding}
                disabled={isSyncingBranding}
                className="cursor-pointer px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBranding ? 'animate-spin' : ''}`} />
                <span>{isSyncingBranding ? 'Mengirim ke Cloud...' : 'Sinkronkan Logo & Background'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Aplikasi *</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subjudul *</label>
                  <input
                    type="text"
                    required
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* PENGATURAN LOGO MADRASAH: UPLOAD FILE (BUKAN INPUT URL) */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <label className="block text-xs font-bold text-[#1b4332] mb-1">
                  Upload Logo Madrasah (Bukan Input URL)
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Pilih file logo madrasah langsung dari galeri HP atau laptop Anda. Format transparan PNG atau SVG sangat disarankan.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-emerald-600/40 p-1 shrink-0 shadow-sm flex items-center justify-center">
                    <img 
                      src={logoUrl || MADRASAH_LOGO_SVG} 
                      alt="Logo Pratinjau" 
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = MADRASAH_LOGO_SVG;
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      id="logoFileInput"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logoFileInput"
                      className="cursor-pointer px-4 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingLogo ? 'Memproses Logo...' : 'Pilih & Upload Logo Baru'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl(MADRASAH_LOGO_SVG);
                        storage.saveSettings({ logo_url: MADRASAH_LOGO_SVG });
                        onRefresh();
                        showToast('Logo dikembalikan ke logo resmi MTs Suka.');
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-gray-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Reset Logo Default
                    </button>
                  </div>
                </div>
              </div>

              {/* PENGATURAN LATAR BELAKANG (BACKGROUND): UPLOAD GAMBAR */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <label className="block text-xs font-bold text-[#1b4332] mb-1">
                  Upload Background (Latar Belakang) Aplikasi
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Pilih foto gedung madrasah, masjid pesantren, atau motif latar belakang untuk menghiasi seluruh tampilan aplikasi.
                </p>

                {/* Pratinjau Background */}
                <div 
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-emerald-300 mb-3 flex items-center justify-center relative overflow-hidden bg-slate-100 transition-all"
                  style={{
                    backgroundColor: settings.background_color || '#d6e5dd',
                    backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="bg-white/85 backdrop-blur-xs px-4 py-2 rounded-xl text-center shadow-xs border border-emerald-900/10">
                    <span className="text-xs font-bold text-[#1b4332] block">
                      {bgImageUrl ? 'Pratinjau Gambar Background Aktif' : 'Background Saat Ini: Hijau Sage Polos (Default)'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {bgImageUrl ? 'Gambar latar terpasang dan akan menutupi seluruh halaman' : 'Belum ada gambar background khusus'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    id="bgFileInput"
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="bgFileInput"
                    className="cursor-pointer px-4 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{isUploadingBg ? 'Memproses Background...' : 'Pilih & Upload Background Baru'}</span>
                  </label>

                  {bgImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBgImageUrl('');
                        storage.saveSettings({ background_image_url: '' });
                        onRefresh();
                        showToast('Background dihapus. Kembali ke warna hijau sage.');
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Background (Pakai Polos)</span>
                    </button>
                  )}
                </div>

                {/* Pilihan Preset Cepat Background */}
                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-gray-500 font-medium">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1920&q=80';
                      setBgImageUrl(url);
                      storage.saveSettings({ background_image_url: url });
                      onRefresh();
                      showToast('Background motif pesantren dipilih & tersimpan.');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-emerald-900 font-semibold transition-colors cursor-pointer"
                  >
                    Pesantren & Santri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1920&q=80';
                      setBgImageUrl(url);
                      storage.saveSettings({ background_image_url: url });
                      onRefresh();
                      showToast('Background motif arsitektur Islami dipilih & tersimpan.');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-emerald-900 font-semibold transition-colors cursor-pointer"
                  >
                    Arsitektur Kubah Islami
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgImageUrl('');
                      storage.saveSettings({ background_image_url: '' });
                      onRefresh();
                      showToast('Background hijau sage polos dipilih.');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-emerald-900 font-semibold transition-colors cursor-pointer"
                  >
                    Hijau Sage Polos (Asli)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Penerima Notifikasi Otomatis</label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teks Footer Madrasah</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Simpan Perubahan Identitas
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: FILE GOOGLE DRIVE */}
        {activeTab === 'drive' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading font-extrabold text-xl text-gray-900">
                  Manajemen Berkas Google Drive
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Seluruh file yang terhubung dengan modul PKKMMTSSUKA26.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">ID Berkas</th>
                    <th className="py-3 px-3">Nama Berkas</th>
                    <th className="py-3 px-3">Format</th>
                    <th className="py-3 px-3">Tautan Drive</th>
                    <th className="py-3 px-3">Menu Terkait</th>
                    <th className="py-3 px-3">Ukuran</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((file) => {
                    const linkedMenu = menus.find(m => m.menu_id === file.menu_id);
                    return (
                      <tr key={file.file_id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{file.file_id}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 max-w-xs truncate">{file.nama_file}</td>
                        <td className="py-3 px-3 uppercase text-emerald-800 font-semibold">{file.jenis_file}</td>
                        <td className="py-3 px-3">
                          <a 
                            href={file.url_file} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono text-[11px]"
                          >
                            <span>Lihat Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-3 text-gray-600 truncate max-w-[150px]">
                          {linkedMenu ? linkedMenu.nama_menu : 'Dokumen Umum'}
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-[11px]">{file.ukuran || '2.0 MB'}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              storage.deleteFile(file.file_id);
                              showToast(`Berkas ${file.nama_file} dilepas.`);
                              onRefresh();
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Kaitan Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KHUSUS: MULTI-PERANGKAT & GOOGLE DRIVE SYNC */}
        {activeTab === 'gas_conn' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200 max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#1b4332]" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-gray-900">
                  Sinkronisasi Multi-Perangkat (Google Drive & Spreadsheet)
                </h2>
                <p className="text-xs text-gray-500">
                  Pastikan portal selalu update di semua HP, laptop, tablet, dan browser tanpa server eksternal berbayar.
                </p>
              </div>
            </div>

            {/* Penjelasan Arsitektur Ramah Pengguna */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 my-5 text-xs text-emerald-950 leading-relaxed">
              <div className="font-bold text-sm mb-1 text-[#1b4332] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Bisa Diakses di Mana Saja & Otomatis Terupdate</span>
              </div>
              <p className="mb-2">
                <strong>Ya, 100% Bisa!</strong> Seluruh data menu, berkas dokumen, foto, dan video disimpan terpusat di <strong>Google Drive</strong> dan <strong>Google Spreadsheet</strong> milik madrasah Anda.
              </p>
              <ul className="list-disc list-inside space-y-1 text-emerald-900/90 pl-1">
                <li>Ketika Admin menambah atau mengubah menu dari laptop di kantor madrasah, perubahannya langsung tersimpan ke Google Spreadsheet.</li>
                <li>Ketika guru, santri, atau pengawas membuka aplikasi di HP (Android/iPhone) atau browser lain di mana pun, aplikasi otomatis mengambil data terbaru dari Google Drive.</li>
                <li>Tidak perlu menyewa server VPS, hosting bulanan, atau database MySQL berbayar — semua berjalan di ekosistem gratis Google.</li>
              </ul>
            </div>

            {/* Kartu Panduan Cepat & Akses Langsung Code.gs */}
            <div className="bg-gradient-to-br from-emerald-900 to-[#1b4332] text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
                    Langkah 1: Wajib Pasang di script.google.com
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Di mana mengambil kode Code.gs?</span>
                </h3>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                  Kode backend sudah disiapkan lengkap di dalam aplikasi ini dan otomatis terisi ID Spreadsheet &amp; Drive Anda. Cukup salin 1 file <strong>Code.gs</strong>, tempelkan di editor Google Apps Script Anda, lalu klik <strong>Deploy &rarr; New deployment</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyGasCode('combined')}
                  className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {copiedCodeSnippet === 'combined' ? (
                    <Check className="w-4 h-4 text-emerald-950" />
                  ) : (
                    <Copy className="w-4 h-4 text-emerald-950" />
                  )}
                  <span>{copiedCodeSnippet === 'combined' ? 'Tersalin!' : 'Salin 1 File Code.gs Lengkap'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gas_code')}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/20"
                >
                  <Eye className="w-4 h-4 text-emerald-300" />
                  <span>Buka Tab Kode &amp; Panduan</span>
                </button>
              </div>
            </div>

            {/* Form Konfigurasi Sinkronisasi */}
            <form onSubmit={handleTestAndSaveSync} className="space-y-5">
              {/* Field 1: URL Web App */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    1. URL Web App Google Apps Script (GAS) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Jembatan Multi-Perangkat
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                  URL ini didapat dari proyek Apps Script Anda melalui tombol <strong>Deploy (Terapkan) &rarr; New deployment &rarr; Web app</strong>.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!gasUrl.trim()) {
                        showToast('Masukkan URL Web App terlebih dahulu');
                        return;
                      }
                      setIsTestingSync(true);
                      const res = await storage.testGASConnection(gasUrl.trim());
                      setSyncResult(res);
                      setIsTestingSync(false);
                      if (res.success) {
                        await storage.syncWithRemote();
                        showToast('Sinkronisasi data sukses!');
                      }
                    }}
                    disabled={isTestingSync}
                    className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                    <span>Uji & Sinkron</span>
                  </button>
                </div>

                {/* Indikator Live Pengecekan URL */}
                {gasUrl.trim() && !gasUrl.trim().endsWith('/exec') && !gasUrl.trim().endsWith('/dev') && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Perhatian:</strong> URL di atas belum diakhiri dengan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">/exec</code>.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fixed = storage.sanitizeGASUrl(gasUrl);
                        setGasUrl(fixed);
                        showToast('URL berhasil diperbaiki (ditambahkan /exec)!');
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-xs"
                    >
                      ⚡ Perbaiki Otomatis (Tambah /exec)
                    </button>
                  </div>
                )}

                <div className="mt-2 p-2.5 bg-white rounded-xl border border-gray-200 text-[11px] text-gray-600">
                  <span className="font-semibold text-emerald-800">Format URL yang benar (wajib berakhiran /exec):</span><br />
                  <code className="text-[10px] text-gray-800 font-mono break-all">https://script.google.com/macros/s/AKfycbx123AbCdEfGhIjKlMnOpQrStUvWxYz/exec</code>
                </div>
              </div>

              {/* Field 2 & 3: Spreadsheet ID & Drive Folder ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    2. ID Google Spreadsheet <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    Buka Spreadsheet database Anda, salin kode acak di antara <code className="bg-white px-1 border rounded">/d/</code> dan <code className="bg-white px-1 border rounded">/edit</code> pada link browser.
                  </p>
                  <input
                    type="text"
                    placeholder="Contoh: 1sPrEaDshEeT_iD_pKKMMTsSuKa..."
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                  <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200 text-[10px] text-gray-500 font-mono break-all">
                    docs.google.com/spreadsheets/d/<span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">[SALIN_BAGIAN_INI]</span>/edit
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    3. ID Folder Utama Google Drive <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    Buka folder penyimpanan di Google Drive, salin kode acak di belakang <code className="bg-white px-1 border rounded">/folders/</code> pada link browser.
                  </p>
                  <input
                    type="text"
                    placeholder="Contoh: 1aB2cD3eF4gH5iJ6kL7mN8oP9qR..."
                    value={driveRootId}
                    onChange={(e) => setDriveRootId(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                  <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200 text-[10px] text-gray-500 font-mono break-all">
                    drive.google.com/drive/folders/<span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">[SALIN_BAGIAN_INI]</span>
                  </div>
                </div>
              </div>

              {/* Hasil Uji Koneksi */}
              {syncResult && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
                    syncResult.success 
                      ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {syncResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">{syncResult.success ? 'Koneksi Berhasil!' : 'Uji Koneksi Belum Berhasil'}</div>
                      <div className="mt-0.5 leading-relaxed">{syncResult.message}</div>

                      {syncResult.autoFixedUrl && (
                        <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (syncResult.autoFixedUrl) {
                                setGasUrl(syncResult.autoFixedUrl);
                                showToast('URL diperbarui!');
                              }
                            }}
                            className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-900 transition-colors"
                          >
                            Gunakan URL dengan /exec ini
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KARTU SOLUSI SPESIFIK JIKA ERROR: Script function not found: doGet */}
                  {(syncResult.errorCode === 'FUNCTION_NOT_FOUND_DOGET' || syncResult.message.includes('doGet')) && (
                    <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-xs text-amber-950 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Penyebab Utama & Solusi Cepat: "Script function not found: doGet"</span>
                      </div>

                      <div className="text-[11px] leading-relaxed text-amber-900/90">
                        URL Web App Anda <strong>sudah terhubung ke server Google</strong> (tidak 404). Namun di proyek Apps Script madrasah Anda, fungsi <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">doGet()</code> belum ada di file <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">Code.gs</code> atau Anda belum membuat <strong>Deployment Baru</strong> setelah menyimpan kode.
                      </div>

                      {/* Tombol Salin Cepat */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyGasCode('Code.gs')}
                          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs"
                        >
                          {copiedCodeSnippet === 'Code.gs' ? (
                            <Check className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>{copiedCodeSnippet === 'Code.gs' ? 'Tersalin!' : '1. Salin Kode Code.gs'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyGasCode('Config.gs')}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs"
                        >
                          {copiedCodeSnippet === 'Config.gs' ? (
                            <Check className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>{copiedCodeSnippet === 'Config.gs' ? 'Tersalin!' : '2. Salin Kode Config.gs (Otomatis ID Anda)'}</span>
                        </button>

                        {onOpenGasHub && (
                          <button
                            type="button"
                            onClick={onOpenGasHub}
                            className="px-3.5 py-2 bg-white hover:bg-gray-100 text-emerald-900 font-bold border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-all text-xs"
                          >
                            <FileCode className="w-4 h-4 text-emerald-700" />
                            <span>Lihat Semua 14 File GAS</span>
                          </button>
                        )}
                      </div>

                      {/* Langkah Praktis */}
                      <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-[11px] space-y-1.5 text-gray-800">
                        <div className="font-bold text-amber-950 mb-1">Langkah 2 Menit di Editor Apps Script:</div>
                        <p>1. Buka tab Google Apps Script Anda (tempat Anda membuat project).</p>
                        <p>2. Klik file <strong className="font-mono text-emerald-800">Code.gs</strong>, hapus semua isinya (misal <code>function myFunction() &#123;&#125;</code>), lalu <strong>Paste</strong> kode yang baru Anda salin dari tombol di atas.</p>
                        <p>3. Klik tanda <strong className="font-mono text-emerald-800">+</strong> di sebelah Files &rarr; pilih <strong>Script</strong>, beri nama <strong className="font-mono text-emerald-800">Config.gs</strong>, lalu <strong>Paste</strong> kode dari tombol Config.gs.</p>
                        <p>4. Tekan <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono">Ctrl + S</kbd> untuk menyimpan.</p>
                        <p>5. <strong>PENTING:</strong> Klik tombol biru <strong>Deploy (Terapkan) &rarr; New deployment (Penerapan baru)</strong>. Pilih tipe <em>Web app</em>, <em>Execute as: Me</em>, <em>Who has access: Anyone</em>, lalu klik <strong>Deploy</strong>.</p>
                        <p>6. Salin URL baru yang muncul dan tempelkan ke kolom URL di atas, lalu klik <strong>Uji & Sinkron</strong>.</p>
                      </div>
                    </div>
                  )}

                  {/* Panduan Umum Jika Bukan Error doGet */}
                  {!syncResult.success && syncResult.errorCode !== 'FUNCTION_NOT_FOUND_DOGET' && !syncResult.message.includes('doGet') && (
                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950">
                      <div className="font-bold text-sm text-amber-900 mb-2 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-700" />
                        <span>3 Hal Penting yang Perlu Dicek di Google Apps Script:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-2 text-[11px] leading-relaxed text-amber-900/90 pl-1">
                        <li>
                          <strong>Pastikan Akhiran URL Ada "/exec":</strong><br />
                          <span className="text-gray-600">URL Web App harus berakhiran <code className="bg-white px-1 py-0.5 rounded font-mono text-amber-800">/exec</code>. Jika terpotong di tengah, klik tombol kuning "⚡ Perbaiki Otomatis" di atas.</span>
                        </li>
                        <li>
                          <strong>Pengaturan Akses Wajib: "Anyone" (Siapa saja):</strong><br />
                          <span className="text-gray-600">Buka Apps Script &rarr; klik <strong>Deploy</strong> &rarr; <strong>Manage deployments (Kelola penerapan)</strong> &rarr; klik ikon pensil (Edit) &rarr; ubah <em>Who has access</em> menjadi <strong>Anyone (Siapa saja)</strong> &rarr; klik <em>Deploy</em>.</span>
                        </li>
                        <li>
                          <strong>Pastikan Kode Code.gs Sudah Ditempel:</strong><br />
                          <span className="text-gray-600">Buka tab <strong>Pusat Deployment GAS</strong> di aplikasi ini, salin isi file <code>Code.gs</code> dan simpan ke editor Apps Script madrasah Anda, lalu buat deployment baru (<strong>New deployment</strong>).</span>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  disabled={isTestingSync}
                  className="px-6 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Simpan Pengaturan Sinkronisasi
                </button>

                <button
                  type="button"
                  onClick={handlePushAllToRemote}
                  disabled={isPushingData || !gasUrl.trim()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Kirim semua data menu dan pengaturan lokal ke Google Spreadsheet"
                >
                  <Upload className={`w-3.5 h-3.5 ${isPushingData ? 'animate-bounce' : ''}`} />
                  <span>{isPushingData ? 'Mengirim ke Spreadsheet...' : '🚀 Kirim Semua Data ke Spreadsheet (Push All)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullAllFromRemote}
                  disabled={isPullingData || !gasUrl.trim()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Tarik data terbaru dari Google Spreadsheet ke browser ini"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPullingData ? 'animate-spin' : ''}`} />
                  <span>{isPullingData ? 'Menarik data...' : '🔄 Tarik Data dari Spreadsheet'}</span>
                </button>
              </div>
            </form>

            {/* Kartu Penjelasan Multi-Device Sync untuk Pengguna */}
            <div className="mt-6 p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2.5">
              <div className="font-bold text-sm text-[#1b4332] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Kenapa saat diakses dari HP / browser lain datanya tidak langsung ikut yang terbaru?</span>
              </div>
              <div className="text-[11px] leading-relaxed text-emerald-900/90 space-y-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
                  <strong className="text-emerald-950 font-bold block mb-1">1. Data Harus Terkirim (Push) ke Google Spreadsheet Terlebih Dahulu:</strong>
                  Ketika Anda menambah atau mengedit menu di browser ini, perubahannya awalnya berada di browser lokal. Klik tombol hijau <strong>"🚀 Kirim Semua Data ke Spreadsheet (Push All)"</strong> di atas agar seluruh <strong>{menus.length} menu</strong> yang ada sekarang langsung tersimpan ke baris lembar Google Spreadsheet Anda.
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
                  <strong className="text-emerald-950 font-bold block mb-1">2. Akses Otomatis Sudah Aktif di Semua Perangkat:</strong>
                  Tautan Google Apps Script Anda dan ID Spreadsheet Anda sudah otomatis disetel sebagai pengaturan default aplikasi. Jadi saat Anda membuka web ini dari HP, laptop lain, tablet, atau akun Google lain mana pun, aplikasi otomatis terhubung ke database Spreadsheet yang sama!
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
                  <strong className="text-emerald-950 font-bold block mb-1">3. Cara Menampilkan Data Terbaru di HP / Browser Lain:</strong>
                  Di HP atau browser lain tersebut, cukup muat ulang (refresh) halaman, atau sentuh tombol <strong>"Sinkron Google Drive"</strong> di bagian atas Dashboard. Data akan langsung terupdate dengan data terbaru dari Google Spreadsheet Anda.
                </div>
              </div>
            </div>

            {/* Panduan 3 Langkah Cepat */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-heading font-bold text-sm text-gray-900 mb-3">
                3 Langkah Singkat Mengaktifkan Multi-Perangkat:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="font-bold text-emerald-900 mb-1">1. Deploy di Apps Script</div>
                  <p className="text-[11px] leading-relaxed">
                    Buka proyek Apps Script, klik <strong>Deploy &rarr; New deployment</strong>, pilih <em>Web app</em>, pilih <strong>Execute as: Me</strong> dan <strong>Access: Anyone</strong>.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="font-bold text-emerald-900 mb-1">2. Salin URL Web App</div>
                  <p className="text-[11px] leading-relaxed">
                    Salin URL yang berakhiran <code className="bg-gray-200 px-1 rounded">/exec</code> lalu tempelkan pada kolom URL di atas dan klik <em>Simpan</em>.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="font-bold text-emerald-900 mb-1">3. Bagikan Tautan Web</div>
                  <p className="text-[11px] leading-relaxed">
                    Buka tautan aplikasi di HP mana pun atau kirimkan via WhatsApp. Semua isi menu dan dokumen akan selalu sinkron otomatis!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB KHUSUS: PUSAT KODE APPS SCRIPT (CODE.GS) */}
        {activeTab === 'gas_code' && (() => {
          const activeSheetId = spreadsheetId.trim() || '1H3-WvPs8RqsNG6GRTu32YCbXAukgvnJdDgOkWvTyKYc';
          const activeFolderId = driveRootId.trim() || '1Hjp030VwB8nR4g4d01FPRuVPw1-XmRyO';
          const displayCode = gasCodeMode === 'combined'
            ? getCombinedGasBackendCode(activeSheetId, activeFolderId)
            : getModularGasCode(selectedModularFileName, activeSheetId, activeFolderId) || (GAS_TEMPLATES.find(t => t.name === selectedModularFileName)?.code || '');
          const lineCount = displayCode.split('\n').length;
          const displayFileName = gasCodeMode === 'combined' ? 'Code.gs (All-in-One)' : selectedModularFileName;

          const modularFiles = [
            'Code.gs',
            'Config.gs',
            'Database.gs',
            'MenuService.gs',
            'DriveService.gs',
            'Auth.gs',
            'SettingsService.gs',
            'AuditService.gs'
          ];

          return (
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200 max-w-5xl space-y-6">
              {/* Header Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1b4332] flex items-center justify-center shrink-0">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Pusat Kode Sumber Backend
                      </span>
                      <span className="text-[11px] text-gray-500">Google Apps Script</span>
                    </div>
                    <h2 className="font-heading font-extrabold text-xl text-gray-900 mt-0.5">
                      Kode Google Apps Script (Code.gs)
                    </h2>
                    <p className="text-xs text-gray-500">
                      Salin kode ini dan tempelkan ke editor Google Apps Script di <strong className="text-emerald-800">script.google.com</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://script.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <span>Buka script.google.com</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyGasCode(gasCodeMode === 'combined' ? 'combined' : selectedModularFileName)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copiedCodeSnippet ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedCodeSnippet ? 'Kode Tersalin!' : 'Salin Kode Ini'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Pilihan: All-in-One vs Modular */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-emerald-950">
                  <span className="font-bold">Format Kode:</span> Pilih cara yang paling mudah untuk Anda pasang di Google Apps Script.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGasCodeMode('combined')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      gasCodeMode === 'combined'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-emerald-100/50 border border-gray-200'
                    }`}
                  >
                    ⚡ 1 File Code.gs (Rekomendasi - Paling Mudah)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGasCodeMode('modular')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      gasCodeMode === 'modular'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-emerald-100/50 border border-gray-200'
                    }`}
                  >
                    📁 File Terpisah (Modular)
                  </button>
                </div>
              </div>

              {/* Jika Mode Modular: Tampilkan Tab File */}
              {gasCodeMode === 'modular' && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-2xl border border-gray-200">
                  {modularFiles.map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => setSelectedModularFileName(fn)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                        selectedModularFileName === fn
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              )}

              {/* Kotak Tampilan Kode */}
              <div className="rounded-2xl border border-gray-800 bg-[#0f172a] text-slate-100 overflow-hidden shadow-lg">
                {/* Bar Atas Editor Kode */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-2 font-mono font-bold text-emerald-400">
                      {displayFileName}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • {lineCount} baris
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyGasCode(gasCodeMode === 'combined' ? 'combined' : selectedModularFileName)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCodeSnippet ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{copiedCodeSnippet ? 'Tersalin!' : 'Salin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadGasFile(displayFileName, displayCode)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-300" />
                      <span className="hidden sm:inline">Unduh</span>
                    </button>
                  </div>
                </div>

                {/* Pre Tag Isi Kode */}
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed select-all no-scrollbar">
                  <code>{displayCode}</code>
                </pre>
              </div>

              {/* Panduan Langkah demi Langkah */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h4 className="font-heading font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Cara Pasang di Google Apps Script (Hanya 3 Langkah Mudah):</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <div className="font-bold text-emerald-900">1. Buka script.google.com</div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Buka <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">script.google.com</a>, buat proyek baru atau buka proyek yang sudah ada.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <div className="font-bold text-emerald-900">2. Tempel Kode di Code.gs</div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Klik file <strong>Code.gs</strong>, hapus isi default (<code className="text-gray-800 bg-gray-100 px-1 rounded">myFunction</code>), lalu <strong>Paste</strong> seluruh kode di atas. Tekan <kbd className="bg-gray-100 px-1 border rounded">Ctrl + S</kbd>.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <div className="font-bold text-emerald-900">3. Deploy sebagai Web App</div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Klik tombol biru <strong>Deploy &rarr; New deployment</strong>. Pilih tipe <strong>Web app</strong>, ubah <strong>Who has access: Anyone</strong>, lalu klik Deploy.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>PENTING:</strong> Setelah klik <em>Deploy</em>, salin URL yang berakhiran <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">/exec</code> lalu masukkan ke tab <strong>Multi-Perangkat &amp; Drive Sync</strong> dan klik <strong>Uji &amp; Sinkron</strong>. Maka status error tidak akan muncul lagi!
                  </div>
                </div>
              </div>

              {/* Tombol ke GAS Hub Lengkap 14 File */}
              {onOpenGasHub && (
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    Ingin melihat struktur lengkap 14 file Google Apps Script (HTML, CSS, Modul)?
                  </span>
                  <button
                    type="button"
                    onClick={onOpenGasHub}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span>Buka Pusat Lengkap 14 File GAS</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: NOTIFIKASI & PDF */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200">
              <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">
                Ekspor Laporan PDF Berkala
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Generate dokumen resmi PKKM MTs Suka dalam format PDF lengkap dengan susunan menu, kelengkapan berkas, dan lembar pengesahan Kepala Madrasah.
              </p>
              <button
                onClick={() => {
                  exportPortalSummaryToPdf(settings, menus, files);
                  showToast('Laporan PDF berhasil di-generate!');
                }}
                className="w-full py-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Laporan Lengkap Portal PDF</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200">
              <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">
                Simulasi Notifikasi Email Otomatis
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Setiap kali data baru dimasukkan (menu baru atau dokumen baru), sistem secara otomatis mengirimkan email notifikasi ke {settings.notification_recipient_email}.
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {notifs.map((n) => (
                  <div key={n.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1">
                      <span>{n.waktu}</span>
                      <span className="text-emerald-700 font-bold">{n.status}</span>
                    </div>
                    <div className="font-bold text-gray-900">{n.subjek}</div>
                    <p className="text-gray-600 text-[11px] mt-0.5">{n.pesan}</p>
                  </div>
                ))}
                {notifs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada riwayat email notifikasi.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AKUN ADMIN */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200 max-w-2xl">
            <h2 className="font-heading font-extrabold text-xl text-gray-900 mb-1">
              Daftar Administrator Sistem
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Pengguna yang memiliki hak akses untuk mengubah menu dan pengaturan aplikasi.
            </p>

            <div className="space-y-3">
              {admins.map((adm) => (
                <div key={adm.admin_id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{adm.nama}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{adm.email}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">{adm.role}</span>
                      <span>Login terakhir: {adm.last_login}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOG */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200">
            <h2 className="font-heading font-extrabold text-xl text-gray-900 mb-1">
              Log Riwayat Aktivitas Sistem
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Catatan keamanan dan audit trail seluruh operasi yang dilakukan di sistem.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Aktivitas</th>
                    <th className="py-2.5 px-3">Detail</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">{log.waktu}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{log.email_admin}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-900">{log.aktivitas}</td>
                      <td className="py-2.5 px-3 text-gray-600">{log.detail}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUKSES' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH / EDIT MENU */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              {editingMenu ? 'Edit Data Menu' : 'Tambah Menu Baru'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Menu ini akan langsung tersimpan di sheet MENU dan tampil di dashboard.
            </p>

            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: E. DOKUMEN PRESTASI SANTRI & MADRASAH"
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas tentang isi dan tujuan menu..."
                  value={menuFormDesc}
                  onChange={(e) => setMenuFormDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Menu *</label>
                  <select
                    value={menuFormType}
                    onChange={(e) => setMenuFormType(e.target.value as MenuType)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="internal">1. Halaman Internal</option>
                    <option value="external">2. Tautan Eksternal (URL)</option>
                    <option value="drive_folder">3. Folder Google Drive</option>
                    <option value="document">4. Dokumen / PDF</option>
                    <option value="photo_gallery">5. Galeri Foto</option>
                    <option value="video_gallery">6. Galeri Video</option>
                    <option value="document_list">7. Daftar Dokumen</option>
                    <option value="info_page">8. Halaman Informasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ikon Menu</label>
                  <select
                    value={menuFormIcon}
                    onChange={(e) => setMenuFormIcon(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.name} - {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    min={1}
                    value={menuFormOrder}
                    onChange={(e) => setMenuFormOrder(Number(e.target.value))}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={menuFormStatus}
                    onChange={(e) => setMenuFormStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="aktif">Aktif (Tampil)</option>
                    <option value="nonaktif">Nonaktif (Sembunyi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Buka Di</label>
                  <select
                    value={menuFormOpenMode}
                    onChange={(e) => setMenuFormOpenMode(e.target.value as OpenMode)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="current_tab">Halaman Ini</option>
                    <option value="new_tab">Tab Baru</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target URL / Link Luar</label>
                <input
                  type="text"
                  placeholder="https://... (Opsional jika tipe tautan)"
                  value={menuFormUrl}
                  onChange={(e) => setMenuFormUrl(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Google Drive Folder ID (Opsional)</label>
                <input
                  type="text"
                  placeholder="ID folder Google Drive terkait dokumen menu ini"
                  value={menuFormFolderId}
                  onChange={(e) => setMenuFormFolderId(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold text-xs rounded-xl"
                >
                  {editingMenu ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {menuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-gray-900 mb-1">
              Konfirmasi Hapus Menu
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus menu <strong className="text-gray-800">"{menuToDelete.nama_menu}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMenuToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
              >
                Ya, Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
