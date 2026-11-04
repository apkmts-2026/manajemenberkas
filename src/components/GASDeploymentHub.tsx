import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Code2, 
  Copy, 
  Check, 
  FileCode, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Download,
  AlertTriangle,
  FileSpreadsheet,
  FolderGit2
} from 'lucide-react';
import { GAS_TEMPLATES } from '../data/gasTemplates';

interface GASDeploymentHubProps {
  onBack: () => void;
}

export const GASDeploymentHub: React.FC<GASDeploymentHubProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'checklist'>('guide');
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const selectedTemplate = GAS_TEMPLATES[selectedFileIdx];

  const handleCopyCode = (name: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedFile(name);
      setTimeout(() => setCopiedFile(null), 2500);
    });
  };

  const handleDownloadAll = () => {
    const fullBundle = GAS_TEMPLATES.map(t => `// ==========================================\n// FILE: ${t.name}\n// ${t.description}\n// ==========================================\n\n${t.code}`).join('\n\n\n');
    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PKKMMTSSUKA26_GAS_Source_Suite.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                  GAS COMPONENT SUITE
                </span>
                <span className="text-slate-400 text-xs">14 Files • 100% Ready</span>
              </div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white mt-0.5">
                Pusat Kode Google Apps Script & Panduan Deployment
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Seluruh Kode (.txt)</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Petunjuk Langkah demi Langkah (Bahasa Indonesia)</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Kode Lengkap 14 File (.gs & .html)</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'checklist'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>3. Checklist Pengujian 14 Kriteria</span>
          </button>
        </div>

        {/* TAB 1: PANDUAN LANGKAH DEMI LANGKAH */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
              <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                <span>Langkah 1: Membuat Google Spreadsheet & Mengambil ID-nya</span>
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                <li>Buka peramban Anda dan kunjungi <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">sheets.new</a> untuk membuat Spreadsheet kosong baru.</li>
                <li>Beri nama spreadsheet Anda, misalnya: <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300">DATABASE_PKKM_MTSSUKA26</code>.</li>
                <li>Lihat URL pada bilah alamat browser Anda. Format URL-nya adalah:<br />
                  <code className="block bg-slate-950 p-2.5 rounded-xl text-emerald-300 font-mono text-xs my-2 overflow-x-auto">
                    https://docs.google.com/spreadsheets/d/<span className="text-amber-400 font-bold underline">1sPrEaDshEeT_iD_pKKMMTsSuKa2026_GoOgLeShEeT</span>/edit#gid=0
                  </code>
                </li>
                <li>Bagian teks panjang antara <code className="text-emerald-400">/d/</code> dan <code className="text-emerald-400">/edit</code> adalah <strong>Spreadsheet ID</strong> Anda. Salin ID tersebut untuk dimasukkan ke <code className="text-amber-300">Config.gs</code>.</li>
              </ol>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
              <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2 flex items-center gap-2">
                <FolderGit2 className="w-6 h-6" />
                <span>Langkah 2: Menyiapkan Folder Google Drive</span>
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                <li>Buka <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">drive.google.com</a>.</li>
                <li>Klik tombol <strong>+ Baru</strong> &rarr; <strong>Folder baru</strong>, beri nama misalnya: <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300">BERKAS_PKKM_MTSSUKA_2026</code>.</li>
                <li>Buka folder tersebut. Salin ID foldernya dari URL browser Anda (teks setelah <code className="text-emerald-400">folders/</code>):<br />
                  <code className="block bg-slate-950 p-2.5 rounded-xl text-emerald-300 font-mono text-xs my-2 overflow-x-auto">
                    https://drive.google.com/drive/folders/<span className="text-amber-400 font-bold underline">1aB2cD3eF4gH5iJ6kL7mN8oP9qR_MTsSuka2026</span>
                  </code>
                </li>
                <li>Pastikan hak akses folder diatur sesuai kebutuhan (misal: "Siapa saja yang memiliki tautan dapat melihat" agar penilai PKKM dapat membuka dokumen bukti fisik).</li>
              </ol>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
              <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                <span>Langkah 3: Membuka Google Apps Script & Membuat 14 File</span>
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                <li>Dari Google Spreadsheet yang tadi dibuat, klik menu <strong>Ekstensi (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</li>
                <li>Ganti nama proyek di kiri atas menjadi: <strong className="text-white">PKKMMTSSUKA26-WebApp</strong>.</li>
                <li>Buka tab <strong>"2. Kode Lengkap 14 File"</strong> di atas.</li>
                <li>Buat file satu per satu dengan mengklik tanda <strong>+ (Tambah file)</strong> di panel sebelah kiri Apps Script:
                  <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-slate-400">
                    <li>Pilih jenis <strong>Script (.gs)</strong> untuk: <code className="text-emerald-300">Code.gs</code>, <code className="text-emerald-300">Config.gs</code>, <code className="text-emerald-300">Database.gs</code>, <code className="text-emerald-300">MenuService.gs</code>, <code className="text-emerald-300">DriveService.gs</code>, <code className="text-emerald-300">Auth.gs</code>, <code className="text-emerald-300">SettingsService.gs</code>, <code className="text-emerald-300">AuditService.gs</code>.</li>
                    <li>Pilih jenis <strong>HTML</strong> untuk: <code className="text-amber-300">Index.html</code>, <code className="text-amber-300">Admin.html</code>, <code className="text-amber-300">Login.html</code>, <code className="text-amber-300">Styles.html</code>, <code className="text-amber-300">Scripts.html</code>, <code className="text-amber-300">Components.html</code>.</li>
                  </ul>
                </li>
                <li>Buka file <code className="text-emerald-300">Config.gs</code>, ganti nilai <code className="text-amber-300">CONFIG.SPREADSHEET_ID</code> dan <code className="text-amber-300">CONFIG.DRIVE_ROOT_FOLDER_ID</code> dengan ID milik Anda.</li>
                <li>Klik tombol <strong>Simpan proyek (Ctrl + S)</strong>.</li>
              </ol>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
              <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                <span>Langkah 4: Menjalankan inisialisasiDatabase() & Memberikan Izin</span>
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                <li>Pada toolbar atas editor Apps Script, pilih fungsi: <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300">inisialisasiDatabase</code>.</li>
                <li>Klik tombol <strong>Jalankan (Run)</strong>.</li>
                <li>Akan muncul jendela permintaan izin: <em>"Otorisasi Diperlukan"</em>. Klik <strong>Tinjau Izin (Review Permissions)</strong>.</li>
                <li>Pilih akun Google Anda. Jika muncul peringatan <em>"Google belum memverifikasi aplikasi ini"</em>:
                  <ul className="list-disc list-inside pl-4 mt-1 text-slate-400">
                    <li>Klik tautan kecil <strong>Lanjutan (Advanced)</strong> di kiri bawah.</li>
                    <li>Klik <strong>Buka PKKMMTSSUKA26-WebApp (tidak aman) / Go to PKKMMTSSUKA26-WebApp</strong>.</li>
                    <li>Klik tombol <strong>Izinkan (Allow)</strong>.</li>
                  </ul>
                </li>
                <li>Tunggu beberapa detik hingga log eksekusi menyatakan: <em>"Inisialisasi database PKKMMTSSUKA26 berhasil diselesaikan"</em>.</li>
                <li>Buka Google Spreadsheet Anda; sekarang 5 sheet (<code className="text-emerald-300">PENGATURAN</code>, <code className="text-emerald-300">MENU</code>, <code className="text-emerald-300">ADMIN</code>, <code className="text-emerald-300">FILE_DRIVE</code>, <code className="text-emerald-300">AUDIT_LOG</code>) beserta 7 menu awal telah otomatis terisi!</li>
              </ol>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
              <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2 flex items-center gap-2">
                <ExternalLink className="w-6 h-6" />
                <span>Langkah 5: Menerapkan sebagai Aplikasi Web (Deployment Web App)</span>
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
                <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &rarr; <strong>Penerapan baru (New deployment)</strong>.</li>
                <li>Klik ikon gerigi di sebelah kiri &rarr; Pilih <strong>Aplikasi web (Web app)</strong>.</li>
                <li>Isi konfigurasi berikut dengan teliti:
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-700 text-xs font-mono my-2 space-y-1.5">
                    <div><span className="text-slate-400">Deskripsi:</span> <span className="text-white">Versi Produksi PKKMMTSSUKA26</span></div>
                    <div><span className="text-slate-400">Jalankan sebagai (Execute as):</span> <span className="text-amber-400 font-bold">Saya (akun Anda)</span></div>
                    <div><span className="text-slate-400">Siapa yang memiliki akses (Who has access):</span> <span className="text-emerald-400 font-bold">Siapa saja (Anyone)</span></div>
                  </div>
                </li>
                <li>Klik tombol <strong>Terapkan (Deploy)</strong>.</li>
                <li>Salin <strong>URL Aplikasi Web (Web App URL)</strong> yang berakhiran <code className="text-emerald-300">/exec</code>.</li>
                <li>Buka URL tersebut di browser apa pun: Portal madrasah Anda telah aktif, responsif di HP, dan siap digunakan resmi!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 2: CODE BROWSER & VIEWER */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* File List */}
            <div className="lg:col-span-4 bg-slate-800/90 rounded-3xl p-4 border border-slate-700 h-fit">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400 px-3 py-2">
                Daftar File Aplikasi ({GAS_TEMPLATES.length})
              </h3>
              <div className="space-y-1 mt-1 max-h-[70vh] overflow-y-auto pr-1">
                {GAS_TEMPLATES.map((tmpl, idx) => {
                  const isSelected = idx === selectedFileIdx;
                  return (
                    <button
                      key={tmpl.name}
                      onClick={() => setSelectedFileIdx(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md'
                          : 'text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className={`w-4 h-4 shrink-0 ${tmpl.type === 'gs' ? 'text-amber-400' : 'text-sky-400'}`} />
                        <span className="truncate">{tmpl.name}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase ${
                        tmpl.type === 'gs' ? 'bg-amber-400/20 text-amber-300' : 'bg-sky-400/20 text-sky-300'
                      }`}>
                        {tmpl.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Content Box */}
            <div className="lg:col-span-8 bg-slate-950 rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-mono font-bold text-sm text-emerald-400">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(selectedTemplate.name, selectedTemplate.code)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedFile === selectedTemplate.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-slate-900/90 rounded-2xl text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[58vh] leading-relaxed border border-slate-800">
                    <code>{selectedTemplate.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHECKLIST PENGUJIAN */}
        {activeTab === 'checklist' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700">
            <h2 className="font-heading font-extrabold text-xl text-emerald-400 mb-2">
              Checklist Kesiapan Operasional (14 Poin Pengujian)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Seluruh butir ini telah diverifikasi dan diimplementasikan secara komprehensif pada arsitektur aplikasi:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: '1. Inisialisasi Database Otomatis', desc: 'Fungsi inisialisasiDatabase() membuat 5 sheet tanpa menimpa data lama.' },
                { title: '2. Pembacaan Dinamis dari Spreadsheet', desc: 'Menu di dashboard ditarik dari sheet MENU, bukan hardcoded HTML.' },
                { title: '3. Tambah Menu Baru oleh Admin', desc: 'Formulir tambah menu lengkap dengan validasi dan langsung tampil.' },
                { title: '4. Pengubahan Nama & Jenis Menu', desc: '8 jenis menu (internal, external, drive folder, dokumen, galeri foto, galeri video, daftar dokumen, info).' },
                { title: '5. Pengurutan Menu Naik/Turun', desc: 'Tombol pemindah urutan yang langsung mengubah posisi kartu.' },
                { title: '6. Aktivasi & Penonaktifan Menu', desc: 'Menu nonaktif disembunyikan dari publik namun tetap terlihat di admin.' },
                { title: '7. Penghapusan Menu dengan Konfirmasi', desc: 'Dialog konfirmasi aman untuk mencegah ketidaksengajaan penghapusan.' },
                { title: '8. Pengubahan Logo & Identitas', desc: 'Nama aplikasi, subjudul, logo madrasah, dan teks footer dapat diubah sewaktu-waktu.' },
                { title: '9. Pembukaan Tautan, Dokumen & Galeri', desc: 'Pratinjau dokumen Google Drive, lightbox foto, dan pemutar video interaktif.' },
                { title: '10. Keamanan Hak Akses Admin', desc: 'Password di-hash dengan SHA-256 dan token sesi disimpan di server cache.' },
                { title: '11. Tampilan Responsif HP & Desktop', desc: 'Sesuai dengan gambar referensi berlatar sage green dan panel mint green.' },
                { title: '12. Penanganan Error & Nilai Kosong', desc: 'Pesan informatif jika data kosong atau URL belum diatur.' },
                { title: '13. Fitur Notifikasi Email Otomatis', desc: 'Email otomatis dikirimkan ke admin saat data/menu baru ditambahkan.' },
                { title: '14. Ekspor Data Laporan ke PDF Berkala', desc: 'Dokumen PDF siap cetak dengan kop surat, tabel menu, dan tanda tangan resmi.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
