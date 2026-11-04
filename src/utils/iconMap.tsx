import React from 'react';
import { 
  TrendingUp, 
  Briefcase, 
  Coins, 
  GraduationCap, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Folder, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Calendar,
  Layers,
  Settings,
  FileCheck,
  Building,
  HelpCircle
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { name: 'TrendingUp', label: 'Pengembangan / Grafik', icon: TrendingUp },
  { name: 'Briefcase', label: 'Manajerial / Tugas', icon: Briefcase },
  { name: 'Coins', label: 'Kewirausahaan / Keuangan', icon: Coins },
  { name: 'GraduationCap', label: 'Supervisi / Akademik', icon: GraduationCap },
  { name: 'FileText', label: 'Berita Acara / Dokumen', icon: FileText },
  { name: 'Image', label: 'Galeri Foto / Dokumentasi', icon: ImageIcon },
  { name: 'Video', label: 'Galeri Video / Multimedia', icon: VideoIcon },
  { name: 'Folder', label: 'Folder Google Drive', icon: Folder },
  { name: 'Award', label: 'Prestasi & Penghargaan', icon: Award },
  { name: 'BookOpen', label: 'Kurikulum & Kitab', icon: BookOpen },
  { name: 'ShieldCheck', label: 'Penjamin Mutu / Audit', icon: ShieldCheck },
  { name: 'Users', label: 'Santri & Guru / Komite', icon: Users },
  { name: 'Calendar', label: 'Agenda & Kalender', icon: Calendar },
  { name: 'Layers', label: 'Struktur Organisasi', icon: Layers },
  { name: 'FileCheck', label: 'Asesmen & Akreditasi', icon: FileCheck },
  { name: 'Building', label: 'Sarana & Asrama', icon: Building }
];

export function renderIcon(iconName: string, className = 'w-5 h-5') {
  const item = AVAILABLE_ICONS.find(i => i.name === iconName);
  if (item) {
    const IconComp = item.icon;
    return <IconComp className={className} />;
  }
  return <Folder className={className} />;
}
