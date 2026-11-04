import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Play, 
  Plus, 
  X, 
  Calendar, 
  Tag, 
  Share2, 
  Maximize2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { MenuItem, AppSettings } from '../types';
import { INITIAL_PHOTOS, INITIAL_VIDEOS } from '../data/defaultData';
import { storage } from '../services/storage';

interface GalleryViewProps {
  menu: MenuItem;
  settings: AppSettings;
  onBack: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  menu,
  settings,
  onBack
}) => {
  const isVideo = menu.jenis_menu === 'video_gallery';

  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [videos, setVideos] = useState(INITIAL_VIDEOS);

  const [selectedPhoto, setSelectedPhoto] = useState<typeof INITIAL_PHOTOS[0] | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<typeof INITIAL_VIDEOS[0] | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New item form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Kegiatan Pembiasaan');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = isVideo
    ? ['all', 'Profil', 'PKKM', 'Kewirausahaan']
    : ['all', 'Kegiatan Pembiasaan', 'Kurikulum Pesantren', 'Supervisi Akademik', 'Kewirausahaan', 'Manajerial', 'Prestasi Santri'];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const nowStr = new Date().toISOString().substring(0, 10);

    if (isVideo) {
      const newVid = {
        id: 'vid-' + Date.now(),
        title: newTitle,
        duration: '05:30',
        date: nowStr,
        videoUrl: newUrl,
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        desc: newDesc || 'Video dokumentasi kegiatan madrasah dan santri.'
      };
      setVideos([newVid, ...videos]);
      storage.addLog('admin', 'TAMBAH_VIDEO', `Menambahkan dokumentasi video: ${newTitle}`);
    } else {
      const newPic = {
        id: 'photo-' + Date.now(),
        title: newTitle,
        category: newCategory,
        date: nowStr,
        url: newUrl,
        caption: newDesc || 'Dokumentasi kegiatan santri madrasah berbasis pesantren.'
      };
      setPhotos([newPic, ...photos]);
      storage.addLog('admin', 'TAMBAH_FOTO', `Menambahkan dokumentasi foto: ${newTitle}`);
    }

    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    showToast(`${isVideo ? 'Video' : 'Foto'} dokumentasi berhasil ditambahkan!`);
  };

  const filteredPhotos = filterCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category === filterCategory);

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

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Top Navigation */}
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
            <span>Tambah {isVideo ? 'Video' : 'Foto'} Baru</span>
          </button>
        </div>

        {/* Gallery Header Card */}
        <div 
          className="rounded-3xl p-6 sm:p-8 mb-6 border border-white/60 shadow-lg relative"
          style={{ background: 'linear-gradient(135deg, #a4ded1 0%, #bce9de 100%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md">
              {isVideo ? <VideoIcon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-white/60 px-2.5 py-0.5 rounded-full">
                {isVideo ? 'Galeri Video Resmi' : 'Dokumentasi Visual Kegiatan'}
              </span>
              <h1 className="font-heading font-extrabold text-2xl text-[#1b4332] mt-0.5">
                {menu.nama_menu}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#1b4332]/90 mt-2 max-w-2xl leading-relaxed">
            {menu.deskripsi || 'Arsip multimedia kegiatan pembelajaran, pembiasaan akhlak santri, supervisi, dan akreditasi madrasah.'}
          </p>

          {/* Categories Filter Tabs */}
          {!isVideo && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mt-4 pt-3 border-t border-emerald-900/15 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-[#1b4332] text-white shadow-sm'
                      : 'bg-white/60 text-[#1b4332] hover:bg-white'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {isVideo ? (
          /* Video Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setSelectedVideo(vid)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-emerald-100 flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-gray-900 overflow-hidden">
                  <img 
                    src={vid.thumbnail} 
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#1b4332] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                    {vid.duration}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-gray-900 line-clamp-2 mb-1.5 group-hover:text-emerald-800 transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                      {vid.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {vid.date}
                    </span>
                    <span className="font-semibold text-emerald-700">Putar Video</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Photo Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-emerald-100"
              >
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#1b4332] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                    {photo.category}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-md">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-heading font-bold text-sm text-gray-900 line-clamp-1 mb-1">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                    {photo.caption}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {photo.date}
                    </span>
                    <span className="text-emerald-700 font-medium">Buka Foto</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-16/10 bg-black max-h-[60vh] flex items-center justify-center overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {selectedPhoto.category}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedPhoto.date}
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                {selectedPhoto.caption}
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b4332] text-white text-xs font-semibold rounded-xl hover:bg-emerald-900"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Resolusi Penuh</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                controls 
                autoPlay 
                className="w-full h-full"
                src={selectedVideo.videoUrl}
              >
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Durasi: {selectedVideo.duration}</span>
                <span>Diunggah: {selectedVideo.date}</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
                {selectedVideo.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                {selectedVideo.desc}
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200"
                >
                  Tutup Pemutar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Media Modal */}
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
              Tambah {isVideo ? 'Video' : 'Foto'} Baru
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Dokumentasi akan disimpan dan ditampilkan pada galeri madrasah.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Dokumentasi *</label>
                <input
                  type="text"
                  required
                  placeholder={isVideo ? "Contoh: Profil Kurikulum Tahfidz 2026" : "Contoh: Pembiasaan Sholat Dhuha Berjamaah"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {!isVideo && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Kegiatan *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isVideo ? 'URL Video (MP4 / Web Video / Drive link) *' : 'URL Gambar / Foto (Link Web / Drive) *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... atau https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi / Catatan Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang kegiatan..."
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
                  Simpan ke Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
