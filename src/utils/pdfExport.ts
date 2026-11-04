import jsPDF from 'jspdf';
import { MenuItem, AppSettings, DriveFile, AuditLog } from '../types';

/**
 * Ekspor Dokumen Laporan Lengkap PKKMMTSSUKA26 ke format PDF
 */
export function exportPortalSummaryToPdf(settings: AppSettings, menus: MenuItem[], files: DriveFile[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header / Kop Surat Madrasah
  doc.setFillColor(27, 67, 50); // Dark emerald
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.app_name.toUpperCase(), pageWidth / 2, 12, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(settings.subtitle + ' | ' + settings.academic_year, pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Laporan Resmi Portal Penilaian Kinerja Kepala Madrasah (PKKM)', pageWidth / 2, 23, { align: 'center' });

  // Tanggal & Info Dokumen
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Tanggal Cetak: ${nowStr}`, 15, 36);
  doc.text(`Total Menu Aktif: ${menus.filter(m => m.status === 'aktif').length} Menu`, pageWidth - 15, 36, { align: 'right' });

  // Garis Pemisah
  doc.setDrawColor(200, 220, 210);
  doc.setLineWidth(0.5);
  doc.line(15, 39, pageWidth - 15, 39);

  let currentY = 46;

  // Judul Bagian
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(27, 67, 50);
  doc.text('DAFTAR MENU & STRUKTUR PORTAL KEGIATAN MADRASAH', 15, currentY);
  currentY += 8;

  // Header Tabel
  doc.setFillColor(240, 248, 244);
  doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text('NO', 18, currentY);
  doc.text('NAMA MENU & PROGRAM', 30, currentY);
  doc.text('JENIS', 130, currentY);
  doc.text('STATUS', 160, currentY);
  doc.text('BERKAS', pageWidth - 20, currentY, { align: 'right' });
  currentY += 8;

  // Isi Tabel Menu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  menus.forEach((menu, index) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    const menuFiles = files.filter(f => f.menu_id === menu.menu_id);

    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}.`, 18, currentY);
    doc.text(menu.nama_menu, 30, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(menu.jenis_menu.replace('_', ' ').toUpperCase(), 130, currentY);
    
    // Status text
    if (menu.status === 'aktif') {
      doc.setTextColor(45, 106, 79);
      doc.text('AKTIF', 160, currentY);
    } else {
      doc.setTextColor(180, 80, 80);
      doc.text('NONAKTIF', 160, currentY);
    }
    
    doc.setTextColor(40, 40, 40);
    doc.text(`${menuFiles.length} File`, pageWidth - 20, currentY, { align: 'right' });

    currentY += 5;
    // Deskripsi singkat
    if (menu.deskripsi) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      const splitDesc = doc.splitTextToSize(menu.deskripsi, pageWidth - 55);
      doc.text(splitDesc, 30, currentY);
      currentY += (splitDesc.length * 4) + 2;
    } else {
      currentY += 3;
    }

    // Border line tipis
    doc.setDrawColor(230, 240, 235);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 4;
  });

  // Tanda Tangan Pengesahan
  if (currentY > 230) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY += 15;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const ttdX = pageWidth - 65;
  doc.text('Mengetahui & Mengesahkan,', ttdX, currentY);
  currentY += 5;
  doc.text('Kepala Madrasah MTs Suka', ttdX, currentY);
  currentY += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('H. Muhammad Fadhil, S.Pd.I, M.Pd.', ttdX, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP. 19780512 200501 1 004', ttdX, currentY);

  // Footer Dokumen
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Dokumen PKKM MTs Suka 2026 | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  doc.save(`${settings.app_name}_Laporan_Portal_${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * Ekspor Detail Modul Spesifik ke PDF
 */
export function exportModuleDetailToPdf(menu: MenuItem, files: DriveFile[], settings: AppSettings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Kop
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.app_name, pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Modul: ' + menu.nama_menu, pageWidth / 2, 18, { align: 'center' });

  let y = 38;
  doc.setTextColor(27, 67, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(menu.nama_menu, 15, y);
  y += 7;

  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const descLines = doc.splitTextToSize(menu.deskripsi || 'Tidak ada deskripsi rinci.', pageWidth - 30);
  doc.text(descLines, 15, y);
  y += (descLines.length * 5) + 6;

  // Metadata Modul
  doc.setFillColor(242, 247, 244);
  doc.rect(15, y, pageWidth - 30, 22, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Jenis Modul: ${menu.jenis_menu.toUpperCase()}`, 20, y + 7);
  doc.text(`Status: ${menu.status.toUpperCase()}`, 20, y + 14);
  doc.text(`Folder Drive: ${menu.drive_folder_id || 'Folder Utama'}`, 100, y + 7);
  doc.text(`Terakhir Diperbarui: ${menu.updated_at}`, 100, y + 14);
  y += 30;

  // Daftar Dokumen Terlampir
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 67, 50);
  doc.text(`DAFTAR DOKUMEN & BUKTI FISIK (${files.length} Berkas)`, 15, y);
  y += 8;

  files.forEach((f, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`${idx + 1}. ${f.nama_file}`, 18, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Keterangan: ${f.keterangan || '-'} | Format: ${f.jenis_file.toUpperCase()}`, 24, y);
    y += 6;
  });

  doc.save(`${menu.nama_menu.replace(/[^a-zA-Z0-9]/g, '_')}_Laporan.pdf`);
}
