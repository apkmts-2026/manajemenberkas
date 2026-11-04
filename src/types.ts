export type MenuType = 
  | 'internal' 
  | 'external' 
  | 'drive_folder' 
  | 'document' 
  | 'photo_gallery' 
  | 'video_gallery' 
  | 'document_list' 
  | 'info_page';

export type OpenMode = 'current_tab' | 'new_tab';

export interface MenuItem {
  menu_id: string;
  nama_menu: string;
  deskripsi: string;
  ikon: string;
  jenis_menu: MenuType;
  target_url: string;
  drive_folder_id: string;
  urutan: number;
  status: 'aktif' | 'nonaktif';
  open_mode: OpenMode;
  created_at: string;
  updated_at: string;
  created_by: string;
  badge?: string;
}

export interface AppSettings {
  app_name: string;
  subtitle: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  background_image_url: string;
  footer_text: string;
  contact_email: string;
  contact_phone: string;
  academic_year: string;
  drive_root_folder_id: string;
  spreadsheet_id: string;
  gas_web_app_url: string;
  email_notifications_enabled: boolean;
  notification_recipient_email: string;
}

export interface DriveFile {
  file_id: string;
  nama_file: string;
  jenis_file: 'pdf' | 'doc' | 'image' | 'video' | 'sheet';
  drive_file_id: string;
  drive_folder_id: string;
  url_file: string;
  menu_id: string;
  keterangan: string;
  ukuran?: string;
  status: 'aktif' | 'arsip';
  created_at: string;
  created_by: string;
}

export interface AdminUser {
  admin_id: string;
  nama: string;
  email: string;
  password_hash: string;
  role: 'Super Admin' | 'Admin Madrasah' | 'Operator';
  status: 'aktif' | 'nonaktif';
  created_at: string;
  last_login: string;
}

export interface AuditLog {
  log_id: string;
  waktu: string;
  email_admin: string;
  aktivitas: string;
  detail: string;
  status: 'SUKSES' | 'GAGAL' | 'PERINGATAN';
}

export interface NotificationLog {
  id: string;
  waktu: string;
  penerima: string;
  subjek: string;
  pesan: string;
  status: 'Terkirim' | 'Gagal';
}
