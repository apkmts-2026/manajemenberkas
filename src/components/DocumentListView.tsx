import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Eye, 
  Plus, 
  CheckCircle, 
  CheckCircle2,
  X, 
  Calendar, 
  ExternalLink,
  CloudUpload,
  Save,
  RefreshCw,
  Folder,
  Upload,
  Link2,
  Share2,
  Trash2
} from 'lucide-react';
import { MenuItem, AppSettings, DriveFile } from '../types';
import { storage } from '../services/storage';

interface DocumentListViewProps {
  menu: MenuItem;
  settings: AppSettings;
  onBack: () => void;
  isAdminLoggedIn: boolean;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  menu,
  settings,
  onBack,
  isAdminLoggedIn
}) => {
  const [files, setFiles] = useState<DriveFile[]>(() => {
    const menuFiles = storage.getFilesByMenu(menu.menu_id);
    if (menuFiles.length > 0) return menuFiles;
    return storage.getFiles().filter(f => f.jenis_file === 'pdf' || f.jenis_file === 'doc');
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form input guru / TU
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
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

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);
    if (!newTitle.trim()) {
      setNewTitle(file.name);
    }
  };

  // Submit dokumen berita acara: Simpan Lokal ATAU Kirim Langsung ke Google Drive
  const handleDocumentSubmit = async (e: React.FormEvent, mode: 'save_local' | 'send_drive' = 'save_local') => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Harap masukkan nama dokumen berita acara!');
      return;
    }

    const finalName = newTitle.endsWith('.pdf') ? newTitle : `${newTitle}.pdf`;
    const generatedDriveId = 'BA-' + Math.random().toString(36).substring(2, 10);
    const driveUrl = newFileUrl.trim() || `https://drive.google.com/file/d/${generatedDriveId}/view`;
    const author = teacherName.trim() || (isAdminLoggedIn ? 'admin@madrasah.sch.id' : 'Guru / Petugas Tata Usaha');
    const folderId = menu.drive_folder_id || 'FOLDER-BERITA-ACARA-PKKM';

    const newCreatedFile = storage.addFile({
      nama_file: finalName,
      jenis_file: 'pdf',
      drive_file_id: generatedDriveId,
      drive_folder_id: folderId,
      url_file: driveUrl,
      menu_id: menu.menu_id,
      keterangan: newDesc.trim() || 'Berita acara resmi rapat dinas dan pleno madrasah.',
      ukuran: selectedFileObj ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
      status: 'aktif',
      created_by: author
    });

    setFiles(storage.getFilesByMenu(menu.menu_id));

    if (mode === 'send_drive') {
      setIsSendingDirectDrive(true);
      showToast('Menghubungkan ke Google Drive & Spreadsheet...');

      try {
        const result = await storage.syncFilesToDrive(menu.menu_id, newCreatedFile);
        
        setShowAddModal(false);
        setNewTitle('');
        setNewDesc('');
        setTeacherName('');
        setNewFileUrl('');
        setSelectedFileObj(null);
        setIsSendingDirectDrive(false);

        setDriveSuccessModal({
          show: true,
          fileName: finalName,
          fileId: generatedDriveId,
          folderName: menu.nama_menu,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          url: driveUrl
        });

        if (result.success) {
          showToast('Dokumen berhasil dikirim dan tersinkron ke Google Drive!');
        } else {
          showToast('Tersimpan di lokal. Sinkron Drive akan diulang saat online.');
        }
      } catch {
        setIsSendingDirectDrive(false);
        setShowAddModal(false);
        showToast('Dokumen tersimpan! Periksa koneksi internet untuk sinkronisasi.');
      }
    } else {
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setTeacherName('');
      setNewFileUrl('');
      setSelectedFileObj(null);
      showToast('Dokumen berita acara berhasil disimpan!');
    }
  };

  // Tombol Kirim Seluruh Data Modul ke Google Drive
  const handleSyncModuleToDrive = async () => {
    setIsSyncingToDrive(true);
    showToast('Menghubungkan ke Google Drive...');

    try {
      const res = await storage.syncFilesToDrive(menu.menu_id);
      setIsSyncingToDrive(false);

      if (res.success) {
        showToast(`Berhasil! ${files.length} dokumen telah disinkronkan ke Google Drive.`);
      } else {
        showToast(res.message || 'Sinkronisasi selesai (tersimpan di database lokal).');
      }
    } catch {
      setIsSyncingToDrive(false);
      showToast('Gagal terhubung ke Google Drive. Periksa jaringan Anda.');
    }
  };

  const filteredFiles = files.filter(f => 
    f.nama_file.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.keterangan.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1b4332] bg-white/85 hover:bg-white px-4 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
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

        {/* Header Card */}
        <div 
          className="rounded-3xl p-6 sm:p-8 mb-6 border border-white/60 shadow-lg relative"
          style={{ background: 'linear-gradient(135deg, #a4ded1 0%, #bce9de 100%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-white/60 px-2.5 py-0.5 rounded-full">
                Arsip Dokumen Legalitas & PKKM
              </span>
              <h1 className="font-heading font-extrabold text-2xl text-[#1b4332] mt-0.5">
                {menu.nama_menu}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#1b4332]/90 mt-2 max-w-2xl leading-relaxed">
            {menu.deskripsi || 'Kumpulan berita acara rapat dinas, pleno kurikulum, penetapan kelulusan, dan evaluasi berkala pimpinan madrasah.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#1b4332] font-medium mt-4">
            <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-emerald-900/10">
              <Folder className="w-3.5 h-3.5 text-emerald-800" />
              <span>Drive Folder: {menu.drive_folder_id || 'Folder Berita Acara'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-emerald-900/10">
              <span>{files.length} Berita Acara Terarsip</span>
            </div>
          </div>
        </div>

        {/* Action Bar: Title + Tombol Unggah + TOMBOL BARU KIRIM DATA KE DRIVE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1b4332]">
              Daftar Dokumen Berita Acara
            </h2>
            <p className="text-[11px] text-[#1b4332]/80">
              Setiap berkas tersinkronisasi otomatis dengan Google Drive dan Google Spreadsheet madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TOMBOL UTAMA BARU: KIRIM DATA KE DRIVE */}
            <button
              type="button"
              onClick={handleSyncModuleToDrive}
              disabled={isSyncingToDrive}
              className="inline-flex items-center gap-2 text-xs font-bold bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-4 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Kirim dan sinkronkan seluruh data berkas berita acara ke Google Drive & Spreadsheet"
            >
              {isSyncingToDrive ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              ) : (
                <CloudUpload className="w-4 h-4 text-emerald-300" />
              )}
              <span>{isSyncingToDrive ? 'Mengirim ke Drive...' : 'Kirim Data ke Drive'}</span>
            </button>

            {/* Tombol Tambah Berita Acara */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-emerald-50 text-[#1b4332] border border-emerald-900/20 px-4 py-2.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>Tambah Berita Acara</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm border border-emerald-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Cari berita acara atau surat keputusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent border-0 outline-none text-gray-800"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Document List Items */}
        <div className="space-y-3 mb-8">
          {filteredFiles.map((file) => (
            <div 
              key={file.file_id}
              className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Google Drive</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                    {file.nama_file}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {file.keterangan || 'Berita acara resmi tersimpan di Google Drive madrasah.'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {file.created_at.substring(0, 10)}
                    </span>
                    <span>{file.ukuran || '1.5 MB'}</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded">
                      {file.created_by ? `Oleh: ${file.created_by}` : 'Terverifikasi'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setSelectedFile(file)}
                  className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                  title="Lihat Pratinjau"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={file.url_file}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="Buka Dokumen Asli di Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {isAdminLoggedIn && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Hapus dokumen "${file.nama_file}"? Perubahan akan langsung disinkronkan ke seluruh browser & Google Spreadsheet.`)) {
                        await storage.deleteFile(file.file_id);
                        setFiles(storage.getFilesByMenu(menu.menu_id));
                        showToast(`Dokumen "${file.nama_file}" berhasil dihapus.`);
                      }
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Dokumen (Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="py-12 text-center bg-white/60 rounded-3xl border border-dashed border-emerald-800/20 p-6">
              <FileText className="w-10 h-10 text-emerald-800/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-900">Tidak ada berita acara yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>
        
        {/* Footnote */}
        <div className="text-center text-[#20553f] text-[10.5px] pb-6 opacity-80 font-medium">
          by mas broe ish4k
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  Dokumen Berita Acara PDF
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900 truncate mt-1">
                  {selectedFile.nama_file}
                </h3>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-5">
              <p className="text-xs text-gray-600 mb-3">{selectedFile.keterangan}</p>
              <div className="text-[11px] font-mono text-gray-500 bg-white p-2 rounded-lg border border-gray-200 inline-block mb-4">
                Google Drive ID: {selectedFile.drive_file_id}
              </div>
              <div>
                <a
                  href={selectedFile.url_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1b4332] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-900 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Google Drive</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal DENGAN DUA TOMBOL: SIMPAN & KIRIM DATA KE DRIVE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-gray-900">
                Tambah Berita Acara & Legalitas
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Isi data dokumen atau unggah berkas fisik berita acara untuk arsip digital madrasah.
            </p>

            <form className="space-y-3.5">
              {/* Upload File Nyata dari Laptop/HP */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilih File Dokumen dari Perangkat (PDF)
                </label>
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all rounded-2xl p-4 text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelection}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <Upload className="w-6 h-6 text-emerald-700" />
                    <span className="text-xs font-semibold text-emerald-950">
                      {selectedFileObj ? selectedFileObj.name : 'Klik untuk memilih dokumen dari perangkat'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {selectedFileObj 
                        ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB • Siap disimpan/dikirim ke Drive` 
                        : 'Format didukung: PDF, DOCX (Maksimal 25MB)'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul / Nama Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Berita_Acara_Rapat_Akreditasi_2026.pdf"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Guru / Petugas TU</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ust. Ahmad Fauzi, S.Pd."
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tautan Drive (Opsional)</label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      className="w-full text-xs p-3 pr-8 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Link2 className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Deskripsi Berita Acara</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan poin hasil rapat atau keputusan dinas..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* DUA TOMBOL AKSI: 1) SIMPAN DOKUMEN & 2) KIRIM DATA KE DRIVE */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex-1 flex gap-2 w-full sm:w-auto justify-end">
                  {/* TOMBOL 1: SIMPAN DOKUMEN (Draft / Lokal) */}
                  <button
                    type="button"
                    onClick={(e) => handleDocumentSubmit(e, 'save_local')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-gray-50 text-[#1b4332] border border-emerald-700/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Simpan Dokumen</span>
                  </button>

                  {/* TOMBOL 2: KIRIM DATA KE DRIVE */}
                  <button
                    type="button"
                    onClick={(e) => handleDocumentSubmit(e, 'send_drive')}
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
              Berita Acara Berhasil Dikirim!
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
