import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  FileDown, 
  ExternalLink, 
  Share2, 
  Folder, 
  Upload, 
  Eye, 
  CheckCircle,
  FileSpreadsheet,
  File,
  X,
  Plus
} from 'lucide-react';
import { MenuItem, AppSettings, DriveFile } from '../types';
import { storage } from '../services/storage';
import { exportModuleDetailToPdf } from '../utils/pdfExport';
import { renderIcon } from '../utils/iconMap';

interface InternalModuleViewProps {
  menu: MenuItem;
  settings: AppSettings;
  onBack: () => void;
  isAdminLoggedIn: boolean;
}

export const InternalModuleView: React.FC<InternalModuleViewProps> = ({
  menu,
  settings,
  onBack,
  isAdminLoggedIn
}) => {
  const [files, setFiles] = useState<DriveFile[]>(() => storage.getFilesByMenu(menu.menu_id));
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<DriveFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'sheet'>('pdf');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const mockId = '1' + Math.random().toString(36).substring(2, 12);
    const created = storage.addFile({
      nama_file: newFileName.endsWith(`.${newFileType}`) ? newFileName : `${newFileName}.${newFileType === 'sheet' ? 'xlsx' : newFileType}`,
      jenis_file: newFileType,
      drive_file_id: mockId,
      drive_folder_id: menu.drive_folder_id || 'FOLDER-MADRASAH-2026',
      url_file: `https://drive.google.com/file/d/${mockId}/view`,
      menu_id: menu.menu_id,
      keterangan: newFileDesc || 'Dokumen pendukung kegiatan PKKM MTs Suka',
      ukuran: '2.5 MB',
      status: 'aktif',
      created_by: isAdminLoggedIn ? 'admin@madrasah.sch.id' : 'kontributor@madrasah.sch.id'
    });

    setFiles(storage.getFilesByMenu(menu.menu_id));
    setShowUploadModal(false);
    setNewFileName('');
    setNewFileDesc('');
    showToast('Berkas berhasil ditambahkan ke modul ini!');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-rose-600" />;
      case 'sheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      default: return <File className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div 
      className="min-h-screen py-8 px-4 sm:px-6 relative"
      style={{ 
        backgroundColor: settings.background_color || '#d8e5dd',
        backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Dimmer/Overlay */}
      {settings.background_image_url && (
        <div className="fixed inset-0 bg-[#1b4332]/20 backdrop-blur-[0.5px] pointer-events-none z-0" />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-700/50">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1b4332] bg-white/80 hover:bg-white px-4 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportModuleDetailToPdf(menu, files, settings);
                showToast('Mengekspor laporan modul ke format PDF...');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b4332] bg-white/80 hover:bg-white px-3.5 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all"
              title="Ekspor PDF"
            >
              <FileDown className="w-4 h-4 text-emerald-800" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Tautan modul berhasil disalin!');
              }}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#1b4332] border border-emerald-900/15 flex items-center justify-center shadow-sm"
              title="Salin Tautan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Module Header Card */}
        <div 
          className="rounded-3xl p-6 sm:p-8 mb-6 border border-white/60 shadow-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #a4ded1 0%, #bce9de 100%)'
          }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md shrink-0">
              {renderIcon(menu.ikon, 'w-7 h-7')}
            </div>
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-white/70 backdrop-blur-xs text-[#1b4332] rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-900/10">
                {menu.badge || 'Modul Penilaian Kinerja'}
              </div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1b4332] leading-tight">
                {menu.nama_menu}
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#1b4332]/90 leading-relaxed bg-white/50 p-4 rounded-2xl border border-white/60 mb-4">
            {menu.deskripsi || 'Modul ini berisi instrumen, dokumen bukti fisik, dan laporan implementasi kegiatan madrasah berbasis pesantren.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#1b4332] font-medium">
            <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full border border-emerald-900/10">
              <Folder className="w-3.5 h-3.5 text-emerald-800" />
              <span>Drive Folder: {menu.drive_folder_id || 'Folder Utama Madrasah'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full border border-emerald-900/10">
              <span>{files.length} Berkas Bukti Fisik Terlampir</span>
            </div>
          </div>
        </div>

        {/* Action Bar for Adding Document */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-[#1b4332]">
            Daftar Berkas & Bukti Fisik Google Drive
          </h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-3.5 py-2 rounded-full shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Unggah Berkas Baru</span>
          </button>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {files.map((file) => (
            <div 
              key={file.file_id}
              className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                  {getFileIcon(file.jenis_file)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate mb-1" title={file.nama_file}>
                    {file.nama_file}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {file.keterangan || 'Tidak ada keterangan tambahan.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                <span className="font-mono text-[10px] text-gray-400">
                  {file.ukuran || '2.1 MB'} • {file.created_at.substring(0, 10)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedPreviewFile(file)}
                    className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Pratinjau Dokumen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={file.url_file}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Buka di Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white/60 rounded-3xl border border-dashed border-emerald-800/20 p-6">
              <FileText className="w-10 h-10 text-emerald-800/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-900">Belum ada dokumen yang dihubungkan ke modul ini.</p>
              <p className="text-xs text-gray-500 mt-1">Gunakan tombol "Unggah Berkas Baru" di atas untuk menambahkan dokumen bukti fisik.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setSelectedPreviewFile(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                {getFileIcon(selectedPreviewFile.jenis_file)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Format {selectedPreviewFile.jenis_file.toUpperCase()}
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900 truncate mt-1">
                  {selectedPreviewFile.nama_file}
                </h3>
              </div>
            </div>

            {/* Mock Google Drive Document Viewer Interface */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-5">
              <div className="max-w-md mx-auto py-8">
                <FileText className="w-16 h-16 text-emerald-800/30 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-gray-800 mb-1">
                  {selectedPreviewFile.nama_file}
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  {selectedPreviewFile.keterangan || 'Dokumen resmi terverifikasi tim pengembang madrasah.'}
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-100/70 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                  <span>Google Drive File ID: {selectedPreviewFile.drive_file_id}</span>
                </div>
                <div className="flex justify-center gap-2">
                  <a
                    href={selectedPreviewFile.url_file}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1b4332] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tampilan Penuh Google Drive</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Unggah Dokumen ke Modul Ini
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Simpan bukti fisik ke folder Google Drive modul {menu.nama_menu}.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama File Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK_Penetapan_Kurikulum_2026.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Dokumen *</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as any)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="pdf">Dokumen PDF (.pdf)</option>
                  <option value="sheet">Spreadsheet / Excel (.xlsx)</option>
                  <option value="doc">Dokumen Word / Teks (.docx)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Uraian</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai isi dokumen bukti fisik..."
                  value={newFileDesc}
                  onChange={(e) => setNewFileDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Simpan ke Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
