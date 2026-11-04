import React, { useState } from 'react';
import { 
  Share2, 
  MoreVertical, 
  ExternalLink, 
  Copy, 
  Info, 
  FileDown, 
  Shield, 
  Code2, 
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  School,
  RefreshCw,
  Globe
} from 'lucide-react';
import { MenuItem, AppSettings } from '../types';
import { renderIcon } from '../utils/iconMap';
import { exportPortalSummaryToPdf } from '../utils/pdfExport';
import { storage } from '../services/storage';

interface DashboardProps {
  settings: AppSettings;
  menus: MenuItem[];
  onSelectMenu: (menu: MenuItem) => void;
  onOpenAdmin: () => void;
  onOpenGasHub: () => void;
  isAdminLoggedIn: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  menus,
  onSelectMenu,
  onOpenAdmin,
  onOpenGasHub,
  isAdminLoggedIn
}) => {
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);
  const [detailModalMenu, setDetailModalMenu] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${settings.app_name} - ${settings.subtitle}`,
      text: `Portal Administrasi dan Dokumentasi Kegiatan ${settings.app_name} (${settings.subtitle})`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Berhasil membagikan dashboard!');
      } catch (err) {
        // User canceled or failed, fallback to modal
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = (text: string, label = 'Tautan') => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} berhasil disalin ke clipboard!`);
    }).catch(() => {
      showToast(`${label}: ${text}`);
    });
  };

  const activeMenus = menus.filter(m => m.status === 'aktif');

  return (
    <div 
      className="min-h-screen py-6 px-3 sm:px-6 flex flex-col justify-center items-center relative overflow-x-hidden"
      style={{ 
        backgroundColor: settings.background_color || '#d8e5dd',
        backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Dimmer/Overlay if custom background image is active */}
      {settings.background_image_url && (
        <div className="fixed inset-0 bg-[#1b4332]/20 backdrop-blur-[0.5px] pointer-events-none z-0" />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 animate-bounce bg-emerald-950 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Mint Green Centerpiece Panel */}
      <div 
        className="w-full max-w-xl mx-auto rounded-[32px] sm:rounded-[36px] p-5 sm:p-7 relative z-10 shadow-[0_20px_50px_rgba(27,67,50,0.14)] border border-white/60 transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #a4ded1 0%, #bce9de 100%)'
        }}
      >
        {/* Top Header Bar inside Panel */}
        <div className="flex items-center justify-between mb-5">
          {/* Left: School Emblem Icon Button */}
          <button 
            type="button"
            onClick={() => showToast(`${settings.app_name} - ${settings.subtitle}`)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/70 hover:bg-white text-emerald-900 border border-emerald-900/15 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Profil Madrasah"
          >
            <School className="w-5 h-5 text-[#1b4332]" />
          </button>

          {/* Center Navigation Shortcuts */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/50 backdrop-blur-md p-1 rounded-full border border-emerald-900/10">
            <button
              onClick={onOpenAdmin}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                isAdminLoggedIn 
                  ? 'bg-emerald-900 text-white shadow-sm' 
                  : 'text-emerald-900 hover:bg-white/80'
              }`}
              title="Panel Administrasi"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Admin Aktif' : 'Login Admin'}</span>
            </button>

            <button
              onClick={onOpenGasHub}
              className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full text-emerald-900 hover:bg-white/80 transition-all flex items-center gap-1"
              title="Lihat Kode Google Apps Script & Deployment"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-800" />
              <span className="hidden sm:inline">Kode GAS</span>
            </button>
          </div>

          {/* Right: Share Button */}
          <button 
            type="button"
            onClick={handleShare}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/70 hover:bg-white text-emerald-900 border border-emerald-900/15 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Bagikan Portal"
          >
            <Share2 className="w-5 h-5 text-[#1b4332]" />
          </button>
        </div>

        {/* Identity & Madrasah Profile Badge */}
        <div className="text-center mb-6">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-white shadow-md border-2 border-emerald-700/30 overflow-hidden group">
              <img 
                src={settings.logo_url} 
                alt="Logo Madrasah"
                className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-800 text-amber-300 p-1 rounded-full shadow border border-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1b4332] tracking-wide mb-1 drop-shadow-sm">
            {settings.app_name}
          </h1>
          <p className="font-semibold text-xs sm:text-sm text-[#20553f] mb-2">
            {settings.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/10 text-[#1b4332] text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-800" />
              <span>{settings.academic_year || 'Tahun Ajaran 2026/2027'}</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (settings.gas_web_app_url) {
                  showToast('Menghubungi Google Drive & Spreadsheet...');
                  const ok = await storage.syncWithRemote();
                  if (ok) {
                    showToast('Data berhasil diperbarui dari Google Drive!');
                  } else {
                    showToast('Sinkronisasi selesai (menggunakan data terbaru).');
                  }
                } else {
                  showToast('Mode Cloud Multi-Perangkat siap! Atur URL di menu Admin.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 hover:bg-white text-[#1b4332] text-xs font-semibold shadow-xs border border-emerald-900/10 transition-all hover:scale-102 cursor-pointer"
              title="Periksa pembaruan data dari Google Drive & Spreadsheet"
            >
              <RefreshCw className="w-3 h-3 text-emerald-800" />
              <span>{settings.gas_web_app_url ? 'Sinkron Google Drive' : 'Multi-Perangkat Aktif'}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Card Menu Buttons (Reference Layout) */}
        <div className="space-y-3 mb-6">
          {activeMenus.map((menu) => {
            const isDropdownOpen = activeMenuDropdown === menu.menu_id;

            return (
              <div 
                key={menu.menu_id}
                className="relative group"
              >
                <div 
                  onClick={() => onSelectMenu(menu)}
                  className="w-full bg-white/85 hover:bg-white border-2 border-[#134e4a] rounded-2xl sm:rounded-2xl px-4 py-3 sm:py-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_3px_8px_rgba(19,78,74,0.06)] hover:shadow-[0_8px_20px_rgba(19,78,74,0.14)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                >
                  {/* Left: Icon with Soft Background Badge */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-900/10 text-[#1b4332] flex items-center justify-center shrink-0">
                      {renderIcon(menu.ikon, 'w-5 h-5')}
                    </div>

                    {/* Centered Elongated Title */}
                    <div className="flex-1 text-center min-w-0 px-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1b4332] tracking-wider block truncate">
                        {menu.nama_menu}
                      </span>
                      {menu.badge && (
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 mt-0.5">
                          {menu.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Three Dots Action Button */}
                  <div 
                    className="relative shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuDropdown(isDropdownOpen ? null : menu.menu_id);
                    }}
                  >
                    <button 
                      type="button"
                      className="w-8 h-8 rounded-full hover:bg-emerald-900/10 text-[#1b4332] flex items-center justify-center transition-colors"
                      title="Opsi Menu"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div 
                        className="absolute right-0 top-10 z-30 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 py-1.5 animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuDropdown(null);
                            onSelectMenu(menu);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Buka Menu</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuDropdown(null);
                            const url = `${window.location.origin}${window.location.pathname}?menu=${menu.menu_id}`;
                            copyToClipboard(url, 'Tautan menu');
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Salin Tautan</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuDropdown(null);
                            setDetailModalMenu(menu);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                        >
                          <Info className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Lihat Detail</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          onClick={() => {
                            setActiveMenuDropdown(null);
                            const files = storage.getFiles();
                            exportPortalSummaryToPdf(settings, menus, files);
                            showToast('Mengunduh ringkasan PDF...');
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ekspor PDF Portal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {activeMenus.length === 0 && (
            <div className="text-center py-8 bg-white/40 rounded-2xl border border-dashed border-emerald-800/20">
              <p className="text-sm text-emerald-900 font-medium">Belum ada menu yang diaktifkan.</p>
              <button 
                onClick={onOpenAdmin}
                className="mt-2 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
              >
                Buka Pengaturan Admin untuk menambah menu
              </button>
            </div>
          )}
        </div>

        {/* Quick Action Bar for PDF & Report */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-emerald-900/15 mb-3">
          <button
            onClick={() => {
              const files = storage.getFiles();
              exportPortalSummaryToPdf(settings, menus, files);
              showToast('Laporan PDF sedang diunduh...');
            }}
            className="text-xs font-semibold text-[#1b4332] hover:text-emerald-900 bg-white/60 hover:bg-white px-3.5 py-1.5 rounded-full border border-emerald-900/15 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Unduh Laporan PKKM (PDF)</span>
          </button>
        </div>

        {/* Footer Text */}
        <div className="text-center text-[#20553f] text-[11px] leading-relaxed">
          <p>{settings.footer_text}</p>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative">
            <button
              onClick={() => setDetailModalMenu(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1b4332] flex items-center justify-center">
                {renderIcon(detailModalMenu.ikon, 'w-6 h-6')}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {detailModalMenu.jenis_menu.replace('_', ' ')}
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900 leading-snug mt-1">
                  {detailModalMenu.nama_menu}
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              {detailModalMenu.deskripsi || 'Tidak ada deskripsi detail untuk menu ini.'}
            </p>

            <div className="space-y-2 text-xs text-gray-500 mb-6">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Status Menu:</span>
                <span className="font-semibold text-emerald-700 uppercase">{detailModalMenu.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Google Drive Folder:</span>
                <span className="font-mono text-gray-700 truncate max-w-[180px]">
                  {detailModalMenu.drive_folder_id || 'Folder Utama Madrasah'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Terakhir Diperbarui:</span>
                <span className="text-gray-700">{detailModalMenu.updated_at}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDetailModalMenu(null);
                  onSelectMenu(detailModalMenu);
                }}
                className="flex-1 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Modul Ini</span>
              </button>
              <button
                onClick={() => setDetailModalMenu(null)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Fallback */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Bagikan Portal
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Salin tautan atau bagikan ke media sosial madrasah.
            </p>

            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl mb-4">
              <input 
                type="text" 
                readOnly 
                value={window.location.href}
                className="w-full text-xs bg-transparent border-0 outline-none text-gray-700 font-mono"
              />
              <button
                onClick={() => {
                  copyToClipboard(window.location.href, 'Tautan portal');
                  setShowShareModal(false);
                }}
                className="shrink-0 bg-[#1b4332] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-900"
              >
                Salin
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${settings.app_name} - ${settings.subtitle}: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <span>WhatsApp</span>
              </a>
              <a
                href={`https://telegram.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`${settings.app_name} - ${settings.subtitle}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-50 text-sky-800 rounded-xl text-xs font-semibold hover:bg-sky-100 transition-colors"
              >
                <span>Telegram</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
