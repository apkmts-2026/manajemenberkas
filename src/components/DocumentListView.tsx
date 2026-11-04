import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Search, 
  Eye, 
  Plus, 
  CheckCircle, 
  X, 
  Calendar, 
  ExternalLink,
  Printer
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
    // Return files associated with this menu or all official documents
    const menuFiles = storage.getFilesByMenu(menu.menu_id);
    if (menuFiles.length > 0) return menuFiles;
    return storage.getFiles().filter(f => f.jenis_file === 'pdf' || f.jenis_file === 'doc');
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const mockId = 'BA-' + Math.random().toString(36).substring(2, 9);
    const created = storage.addFile({
      nama_file: newTitle.endsWith('.pdf') ? newTitle : `${newTitle}.pdf`,
      jenis_file: 'pdf',
      drive_file_id: mockId,
      drive_folder_id: menu.drive_folder_id || 'FOLDER-BERITA-ACARA',
      url_file: `https://drive.google.com/file/d/${mockId}/view`,
      menu_id: menu.menu_id,
      keterangan: newDesc || 'Berita acara resmi kegiatan madrasah.',
      ukuran: '1.8 MB',
      status: 'aktif',
      created_by: isAdminLoggedIn ? 'admin@madrasah.sch.id' : 'tata_usaha@madrasah.sch.id'
    });

    setFiles(storage.getFilesByMenu(menu.menu_id));
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    showToast('Berita Acara berhasil ditambahkan!');
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

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-700/50">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1b4332] bg-white/80 hover:bg-white px-4 py-2 rounded-full border border-emerald-900/15 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1b4332] hover:bg-[#2d6a4f] text-white px-4 py-2 rounded-full shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Berita Acara</span>
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
                Arsip Dokumen Legalitas
              </span>
              <h1 className="font-heading font-extrabold text-2xl text-[#1b4332] mt-0.5">
                {menu.nama_menu}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#1b4332]/90 mt-2 max-w-2xl leading-relaxed">
            {menu.deskripsi || 'Kumpulan berita acara rapat dinas, pleno kurikulum, penetapan kelulusan, dan evaluasi berkala pimpinan madrasah.'}
          </p>
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
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Document List Items */}
        <div className="space-y-3 mb-8">
          {filteredFiles.map((file, idx) => (
            <div 
              key={file.file_id}
              className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
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
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded">Terverifikasi</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setSelectedFile(file)}
                  className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
                  title="Lihat Pratinjau"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={file.url_file}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Buka Dokumen Asli"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
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
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
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
              <div className="text-[11px] font-mono text-gray-400 bg-white p-2 rounded-lg border border-gray-200 inline-block mb-4">
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
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Tambah Berita Acara Baru
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Catatan berita acara akan dicatat dan diarsipkan ke Google Drive.
            </p>

            <form onSubmit={handleAddDocument} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Deskripsi Berita Acara</label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan poin hasil rapat atau keputusan dinas..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold text-xs rounded-xl"
                >
                  Simpan Berita Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
