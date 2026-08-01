import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './pages/DashboardOverview';
import StationSettings from './pages/StationSettings';
import UsersManagement from './pages/UsersManagement';
import TransactionsHistory from './pages/TransactionsHistory';
import AutoLockOverlay from './components/AutoLockOverlay';
import AccountSettingsModal from './components/AccountSettingsModal';
import LoginPage from './pages/LoginPage';
import { useInactivityLock } from './hooks/useInactivityLock';
import { AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainLayout() {
  const { user, loading } = useAuth();
  const { isLocked, lock, unlock } = useInactivityLock(5 * 60 * 1000); // 5 minut harakatsizlik
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [stationStatus, setStationStatus] = useState({
    is_open: true,
    cashback_percent: 5.0
  });

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchInitialStation();
      const unsub = subscribeStationStatus();
      return () => {
        if (unsub) unsub();
      };
    }
  }, [user]);

  const fetchInitialStation = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase
        .from('station_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setStationStatus({
          is_open: Boolean(data.is_open),
          cashback_percent: Number(data.cashback_percent || 5.0)
        });
      }
    } catch (err) {
      console.warn('Initial station load info:', err);
    }
  };

  const subscribeStationStatus = () => {
    if (!isSupabaseConfigured) return () => {};
    const channelTopic = `header_station_status_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelTopic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'station_settings' }, (payload) => {
        if (payload.new) {
          setStationStatus({
            is_open: Boolean(payload.new.is_open),
            cashback_percent: Number(payload.new.cashback_percent || 5.0)
          });
        }
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsLive(true);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    fetchInitialStation();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const pageTitles = {
    dashboard: 'Bosh Sahifa & Analitika',
    station: 'Stansiya va Xarita Sozlamalari',
    users: 'Foydalanuvchilar Boshqaruvi',
    transactions: 'Tranzaksiyalar Tarixi'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wider">Yuklanmoqda...</p>
      </div>
    );
  }

  // Show login screen if user is not logged in
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Vercel Environment Variables Warning Banner */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-extrabold text-center flex items-center justify-center gap-2 shrink-0 z-50">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>DIQQAT: Vercel sozlamalarida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY hali o'rnatilmagan! Vercel -> Settings -> Environment Variables da ularni kiritib, Redeploy bosing.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isLive={isLive && isSupabaseConfigured}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onOpenAccountSettings={() => setIsAccountModalOpen(true)}
        />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header 
          title={pageTitles[activeTab]} 
          stationStatus={stationStatus}
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
          isCollapsed={isCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onLock={lock}
          onOpenAccountSettings={() => setIsAccountModalOpen(true)}
        />

        {/* Page Views Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'station' && (
            <StationSettings 
              onStationUpdated={(updated) => {
                setStationStatus({
                  is_open: Boolean(updated.is_open),
                  cashback_percent: Number(updated.cashback_percent || 5.0)
                });
              }} 
            />
          )}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'transactions' && <TransactionsHistory />}
        </main>
      </div>

      {/* Auto Lock Screen Overlay (5 Min Inactivity) */}
      <AutoLockOverlay 
        isLocked={isLocked} 
        onUnlock={unlock} 
      />

      {/* Account Profile & Security Settings Modal (Email & Password change) */}
      <AccountSettingsModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
      />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
