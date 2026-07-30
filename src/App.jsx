import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './pages/DashboardOverview';
import StationSettings from './pages/StationSettings';
import UsersManagement from './pages/UsersManagement';
import TransactionsHistory from './pages/TransactionsHistory';
import AutoLockOverlay from './components/AutoLockOverlay';
import { useInactivityLock } from './hooks/useInactivityLock';
import { supabase } from './lib/supabase';

export default function App() {
  const { isLocked, lock, unlock } = useInactivityLock(5 * 60 * 1000); // 5 minut harakatsizlik
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stationStatus, setStationStatus] = useState({
    is_open: true,
    cashback_percent: 5.0
  });

  useEffect(() => {
    fetchInitialStation();
    subscribeStationStatus();
  }, []);

  const fetchInitialStation = async () => {
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isLive={isLive}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
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
    </div>
  );
}
