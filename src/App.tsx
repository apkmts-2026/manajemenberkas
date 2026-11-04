import React, { useState, useEffect } from 'react';
import { MenuItem, AppSettings } from './types';
import { storage } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { InternalModuleView } from './components/InternalModuleView';
import { GalleryView } from './components/GalleryView';
import { DocumentListView } from './components/DocumentListView';
import { AdminPortal } from './components/AdminPortal';
import { GASDeploymentHub } from './components/GASDeploymentHub';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [menus, setMenus] = useState<MenuItem[]>(() => storage.getMenus());
  const [currentView, setCurrentView] = useState<'dashboard' | 'module' | 'admin' | 'gas_hub'>('dashboard');
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => !!storage.getCurrentAdmin());

  // Listen to storage events for real-time reactivity across all components
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(storage.getSettings());
      setMenus(storage.getMenus());
      setIsAdminLoggedIn(!!storage.getCurrentAdmin());
    };

    window.addEventListener('pkkm_storage_updated', handleStorageChange);

    // Check URL parameters for direct menu or page opening
    const urlParams = new URLSearchParams(window.location.search);
    const menuParam = urlParams.get('menu');
    const pageParam = urlParams.get('page');

    if (pageParam === 'admin' || pageParam === 'login') {
      setCurrentView('admin');
    } else if (pageParam === 'gas' || pageParam === 'deployment') {
      setCurrentView('gas_hub');
    } else if (menuParam) {
      const allMenus = storage.getMenus();
      const found = allMenus.find(m => m.menu_id === menuParam);
      if (found) {
        setSelectedMenu(found);
        setCurrentView('module');
      }
    }

    // Automatically attempt remote cloud sync from Google Drive & Spreadsheet on load
    storage.syncWithRemote();

    return () => {
      window.removeEventListener('pkkm_storage_updated', handleStorageChange);
    };
  }, []);

  const handleSelectMenu = (menu: MenuItem) => {
    // Check menu type for external link or drive folder
    if (menu.jenis_menu === 'external' && menu.target_url) {
      if (menu.open_mode === 'new_tab') {
        window.open(menu.target_url, '_blank');
      } else {
        window.location.href = menu.target_url;
      }
      return;
    }

    if (menu.jenis_menu === 'drive_folder') {
      const driveUrl = menu.target_url || `https://drive.google.com/drive/folders/${menu.drive_folder_id || settings.drive_root_folder_id}`;
      window.open(driveUrl, '_blank');
      return;
    }

    // For internal modules, galleries, document lists, info pages
    setSelectedMenu(menu);
    setCurrentView('module');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setSelectedMenu(null);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshData = () => {
    setSettings(storage.getSettings());
    setMenus(storage.getMenus());
    setIsAdminLoggedIn(!!storage.getCurrentAdmin());
  };

  // Render view based on state
  if (currentView === 'gas_hub') {
    return <GASDeploymentHub onBack={handleBackToDashboard} />;
  }

  if (currentView === 'admin') {
    return (
      <AdminPortal
        settings={settings}
        menus={menus}
        onBackToPortal={handleBackToDashboard}
        onRefresh={refreshData}
        onOpenGasHub={() => setCurrentView('gas_hub')}
      />
    );
  }

  if (currentView === 'module' && selectedMenu) {
    if (selectedMenu.jenis_menu === 'photo_gallery' || selectedMenu.jenis_menu === 'video_gallery') {
      return (
        <GalleryView
          menu={selectedMenu}
          settings={settings}
          onBack={handleBackToDashboard}
        />
      );
    }

    if (selectedMenu.jenis_menu === 'document_list') {
      return (
        <DocumentListView
          menu={selectedMenu}
          settings={settings}
          onBack={handleBackToDashboard}
          isAdminLoggedIn={isAdminLoggedIn}
        />
      );
    }

    // Default internal module / info page
    return (
      <InternalModuleView
        menu={selectedMenu}
        settings={settings}
        onBack={handleBackToDashboard}
        isAdminLoggedIn={isAdminLoggedIn}
      />
    );
  }

  // Main Dashboard View (Sage green background & mint green centerpiece)
  return (
    <Dashboard
      settings={settings}
      menus={menus}
      onSelectMenu={handleSelectMenu}
      onOpenAdmin={() => setCurrentView('admin')}
      onOpenGasHub={() => setCurrentView('gas_hub')}
      isAdminLoggedIn={isAdminLoggedIn}
    />
  );
}
