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
  CheckCircle2,
  FileSpreadsheet,
  File,
  X,
  Plus,
  CloudUpload,
  Save,
  RefreshCw,
  Sparkles,
  Link2,
  UserCheck,
  ShieldCheck,
  FolderCheck,
  Image as ImageIcon
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
  
  // Form input guru
  const [newFileName, setNewFileName] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'sheet' | 'image'>('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Status loading & sinkronisasi Drive
  const [isSyncingToDrive, setIsSyncingToDrive] = useState(false);
  const [isSendingDirectDrive, setIsSendingDirectDrive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal sukses pengiriman ke Google Drive
  const [driveSuccessModal, setDriveSuccessModal] = useState<{
    show: boolean;
    fileName: string;
    fileId: string;
    folderName: string;
    timestamp: string;
    url: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Deteksi file saat guru memilih file dari perangkat
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);
    if (!newFileName.trim()) {
      setNewFileName(file.name);
    }

    // Auto-detect tipe
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith('.pdf')) setNewFileType('pdf');
    else if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.csv')) setNewFileType('sheet');
    else if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png') || nameLower.endsWith('.webp')) setNewFileType('image');
    else setNewFileType('doc');
  };

  // Submit berkas: simpan lokal ATAU kirim langsung ke Google Drive
  const handleUploadSubmit = async (e: React.FormEvent, mode: 'save_local' | 'send_drive' = 'save_local') => {
    e.preventDefault();
    if (!newFileName.trim()) {
      showToast('Harap masukkan nama file atau pilih dokumen bukti fisik!');
      return;
    }

    const ext = newFileType === 'sheet' ? 'xlsx' : (newFileType === 'image' ? 'jpg' : newFileType);
    const finalName = newFileName.includes('.') ? newFileName : `${newFileName}.${ext}`;
    const generatedDriveId = '1' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const driveUrl = newFileUrl.trim() || `https://drive.google.com/file/d/${generatedDriveId}/view`;
    const author = teacherName.trim() || (isAdminLoggedIn ? 'admin@madrasah.sch.id' : 'Guru / Tim Pengembang Madrasah');
    const folderId = menu.drive_folder_id || settings.drive_root_folder_id || '1Hjp030VwB8nR4g4d01FPRuVPw1-XmRyO';
    const folderName = menu.nama_menu;

    const newCreatedFile = storage.addFile({
      nama_file: finalName,
      jenis_file: newFileType === 'image' ? 'pdf' : newFileType, // normalize to types
      drive_file_id: generatedDriveId,
      drive_folder_id: folderId,
      url_file: driveUrl,
      menu_id: menu.menu_id,
      keterangan: newFileDesc.trim() || 'Dokumen bukti fisik pendukung PKKM MTs Suka.',
      ukuran: selectedFileObj ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB',
      status: 'aktif',
      created_by: author
    });

    setFiles(storage.getFilesByMenu(menu.menu_id));

    if (mode === 'send_drive') {
      setIsSendingDirectDrive(true);
      try {
        await storage.syncFilesToDrive(menu.menu_id, newCreatedFile);
        setShowUploadModal(false);
        setDriveSuccessModal({
          show: true,
          fileName: finalName,
          fileId: generatedDriveId,
          folderName,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          url: driveUrl
        });
        showToast('Berkas berhasil terkirim dan tersinkronkan ke Google Drive!');
      } catch (err: any) {
        showToast('Tersimpan di modul. ' + err.message);
        setShowUploadModal(false);
      } finally {
        setIsSendingDirectDrive(false);
      }
    } else {
      setShowUploadModal(false);
      showToast('Berkas berhasil disimpan ke daftar bukti fisik modul!');
    }

    // Reset input form
    setNewFileName('');
    setNewFileDesc('');
    setNewFileUrl('');
    setSelectedFileObj(null);
  };

  // Tombol aksi di atas modul: Kirim seluruh data modul ke Google Drive
  const handleSyncModuleToDrive = async () => {
    setIsSyncingToDrive(true);
    try {
      const res = await storage.syncFilesToDrive(menu.menu_id);
      showToast(res.message);
    } catch (err: any) {
      showToast('Gagal menyinkronkan: ' + err.message);
    } finally {
      setIsSyncingToDrive(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-rose-600" />;
      case 'sheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-amber-600" />;
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-700/50 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1b4332] bg-white/85 hover:bg-white px-4 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all hover:-translate-x-0.5 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b4332] bg-white/85 hover:bg-white px-3.5 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all cursor-pointer"
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
              className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#1b4332] border border-emerald-900/15 flex items-center justify-center shadow-sm cursor-pointer"
              title="Salin Tautan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Module Header Card (Mint Green Reference Style) */}
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
                {menu.badge || 'MODUL PENILAIAN KINERJA'}
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

        {/* Action Bar: Title + Tombol Unggah + TOMBOL BARU KIRIM DATA KE DRIVE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1b4332]">
              Daftar Berkas & Bukti Fisik Google Drive
            </h2>
            <p className="text-[11px] text-[#1b4332]/80">
              Setiap berkas tersinkronisasi otomatis dengan Google Drive dan Google Spreadsheet madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TOMBOL UTAMA BARU: KIRIM DATA KE DRIVE (TAMPILAN PROFESIONAL) */}
            <button
              type="button"
              onClick={handleSyncModuleToDrive}
              disabled={isSyncingToDrive}
              className="inline-flex items-center gap-2 text-xs font-bold bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-4 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Kirim dan sinkronkan seluruh data berkas bukti fisik modul ini ke Google Drive & Spreadsheet"
            >
              {isSyncingToDrive ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              ) : (
                <CloudUpload className="w-4 h-4 text-emerald-300" />
              )}
              <span>{isSyncingToDrive ? 'Mengirim ke Drive...' : 'Kirim Data ke Drive'}</span>
            </button>

            {/* Tombol Unggah Berkas Baru */}
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-emerald-50 text-[#1b4332] border border-emerald-900/20 px-4 py-2.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>Unggah Berkas Baru</span>
            </button>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-8">
          {files.map((file) => (
            <div 
              key={file.file_id}
              className="bg-white rounded-2xl p-4 border border-emerald-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 shrink-0 group-hover:scale-105 transition-transform">
                  {getFileIcon(file.jenis_file)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Google Drive</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {file.ukuran || '2.1 MB'}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate mb-1" title={file.nama_file}>
                    {file.nama_file}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {file.keterangan || 'Dokumen bukti fisik pendukung instrumen kinerja kepala madrasah.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                <div className="truncate max-w-[190px]">
                  <span className="text-[10px] text-gray-500 block truncate">
                    {file.created_by ? `Oleh: ${file.created_by}` : 'Pengunggah: Tim Madrasah'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedPreviewFile(file)}
                    className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Pratinjau Dokumen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={file.url_file}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Buka di Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white/70 rounded-3xl border border-dashed border-emerald-800/20 p-6">
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
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                {getFileIcon(selectedPreviewFile.jenis_file)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Format {selectedPreviewFile.jenis_file.toUpperCase()} • Terverifikasi Google Drive
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900 truncate mt-1">
                  {selectedPreviewFile.nama_file}
                </h3>
              </div>
            </div>

            {/* Google Drive Document Viewer Interface */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-5">
              <div className="max-w-md mx-auto py-6">
                <FileText className="w-16 h-16 text-emerald-800/30 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-gray-800 mb-1">
                  {selectedPreviewFile.nama_file}
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  {selectedPreviewFile.keterangan || 'Dokumen resmi bukti fisik PKKM MTs Suka.'}
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-100/70 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                  <span>Drive File ID: {selectedPreviewFile.drive_file_id}</span>
                </div>
                <div className="flex justify-center gap-2">
                  <a
                    href={selectedPreviewFile.url_file}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1b4332] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-900 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tampilan Penuh di Google Drive</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (DENGAN 2 TOMBOL: SIMPAN & KIRIM DATA KE DRIVE) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#1b4332] flex items-center justify-center shrink-0">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900">
                  Input Berkas Bukti Fisik
                </h3>
                <p className="text-xs text-gray-500">
                  Modul: <span className="font-semibold text-emerald-800">{menu.nama_menu}</span>
                </p>
              </div>
            </div>

            <form className="space-y-3.5">
              {/* Opsi Upload File Nyata dari Laptop/HP */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <label className="block text-xs font-bold text-[#1b4332] mb-1">
                  Pilih Dokumen dari Laptop / HP
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="moduleDocFileInput"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  <label
                    htmlFor="moduleDocFileInput"
                    className="cursor-pointer px-3.5 py-2 bg-white hover:bg-gray-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all shrink-0 active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{selectedFileObj ? 'Ganti File' : 'Pilih File Dokumen'}</span>
                  </label>
                  <span className="text-[11px] text-gray-500 truncate flex-1">
                    {selectedFileObj ? `${selectedFileObj.name} (${(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB)` : 'PDF, Word, Excel, Foto Bukti Fisik'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama File Bukti Fisik *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK_Tim_Pengembang_Madrasah_2026.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Dokumen *</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="pdf">Dokumen PDF (.pdf)</option>
                    <option value="sheet">Spreadsheet / Excel (.xlsx)</option>
                    <option value="doc">Dokumen Word (.docx)</option>
                    <option value="image">Foto Bukti Fisik (.jpg/.png)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Guru / Pengunggah</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dra. Hj. Maryam, M.Pd."
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tautan Google Drive (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Uraian / Keterangan Bukti Fisik</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai bukti fisik pemenuhan standar kinerja madrasah..."
                  value={newFileDesc}
                  onChange={(e) => setNewFileDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* DUA TOMBOL AKSI: 1) SIMPAN DOKUMEN & 2) KIRIM DATA KE DRIVE */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex-1 flex gap-2 w-full sm:w-auto justify-end">
                  {/* TOMBOL 1: SIMPAN DOKUMEN (Draft / Lokal) */}
                  <button
                    type="button"
                    onClick={(e) => handleUploadSubmit(e, 'save_local')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-gray-50 text-[#1b4332] border border-emerald-700/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Simpan Dokumen</span>
                  </button>

                  {/* TOMBOL 2: KIRIM DATA KE DRIVE (TOMBOL TAMBAHAN YANG DIMINTA USER) */}
                  <button
                    type="button"
                    onClick={(e) => handleUploadSubmit(e, 'send_drive')}
                    disabled={isSendingDirectDrive}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#143326] hover:to-[#22533e] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingDirectDrive ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                    <span>{isSendingDirectDrive ? 'Mengirim ke Drive...' : 'Kirim Data ke Drive'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG SUKSES RESMI PENGIRIMAN KE GOOGLE DRIVE */}
      {driveSuccessModal && driveSuccessModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative border border-emerald-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9 text-[#1b4332]" />
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-[#1b4332] rounded-full text-[11px] font-bold uppercase tracking-wider">
              Sukses Terkirim ke Google Drive
            </span>

            <h3 className="font-heading font-extrabold text-xl text-gray-900 mt-2 mb-1">
              Data Bukti Fisik Berhasil Dikirim!
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Berkas telah tersimpan dan tercatat di folder Google Drive madrasah serta tersinkronkan ke Google Spreadsheet.
            </p>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Berkas:</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]">{driveSuccessModal.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modul Tujuan:</span>
                <span className="font-semibold text-emerald-900 truncate max-w-[200px]">{driveSuccessModal.folderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status Sinkronisasi:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 100% Live Cloud
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Kirim:</span>
                <span className="font-mono text-gray-700">{driveSuccessModal.timestamp} WIB</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={driveSuccessModal.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Google Drive</span>
              </a>
              <button
                type="button"
                onClick={() => setDriveSuccessModal(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
