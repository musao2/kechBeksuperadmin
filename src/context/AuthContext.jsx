import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const DEFAULT_ADMIN = {
  email: 'admin@keshbak.uz',
  password: 'admin123',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load custom saved admin credentials if offline/local admin mode is used
  const getStoredAdminCredentials = () => {
    try {
      const saved = localStorage.getItem('keshbak_admin_creds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved admin creds:', e);
    }
    return DEFAULT_ADMIN;
  };

  useEffect(() => {
    // 1. Check active Supabase Auth session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          // Check local stored session fallback
          const savedSession = localStorage.getItem('keshbak_admin_session');
          if (savedSession) {
            setUser(JSON.parse(savedSession));
          }
        }
      } catch (err) {
        console.warn('Auth init check error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('keshbak_admin_session', JSON.stringify(session.user));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login handler with Supabase Auth + Fallback
  const login = async (email, password) => {
    setErrorState(null);

    // Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);
        localStorage.setItem('keshbak_admin_session', JSON.stringify(data.user));
        return { success: true };
      }
    } catch (supabaseErr) {
      console.warn('Supabase auth login attempt:', supabaseErr);
    }

    // Fallback to stored local admin credentials
    const localCreds = getStoredAdminCredentials();
    if (email.trim().toLowerCase() === localCreds.email.toLowerCase() && password === localCreds.password) {
      const fallbackUser = {
        id: 'local-admin',
        email: localCreds.email,
        user_metadata: { role: 'SuperAdmin' },
      };
      setUser(fallbackUser);
      localStorage.setItem('keshbak_admin_session', JSON.stringify(fallbackUser));
      return { success: true };
    }

    return { 
      success: false, 
      error: "Noto'g'ri email yoki parol! Iltimos qaytadan tekshirib kiriting." 
    };
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase logout:', e);
    }
    setUser(null);
    localStorage.removeItem('keshbak_admin_session');
  };

  // Update Email
  const updateEmail = async (newEmail, currentPassword) => {
    // 1. If logged in via Supabase Auth
    if (user?.id !== 'local-admin') {
      try {
        const { data, error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('keshbak_admin_session', JSON.stringify(data.user));
          return { success: true, message: "Email muvaffaqiyatli o'zgartirildi!" };
        }
      } catch (err) {
        return { success: false, error: err.message || "Emailni o'zgartirishda xatolik." };
      }
    }

    // 2. Local Admin Mode
    const creds = getStoredAdminCredentials();
    if (currentPassword && currentPassword !== creds.password) {
      return { success: false, error: "Joriy parol noto'g'ri!" };
    }

    const updatedCreds = { ...creds, email: newEmail };
    localStorage.setItem('keshbak_admin_creds', JSON.stringify(updatedCreds));
    
    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);
    localStorage.setItem('keshbak_admin_session', JSON.stringify(updatedUser));

    return { success: true, message: "Email muvaffaqiyatli o'zgartirildi!" };
  };

  // Update Password
  const updatePassword = async (currentPassword, newPassword) => {
    if (newPassword.length < 6) {
      return { success: false, error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!" };
    }

    // 1. If logged in via Supabase Auth
    if (user?.id !== 'local-admin') {
      try {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return { success: true, message: "Parol muvaffaqiyatli o'zgartirildi!" };
      } catch (err) {
        return { success: false, error: err.message || "Parolni o'zgartirishda xatolik." };
      }
    }

    // 2. Local Admin Mode
    const creds = getStoredAdminCredentials();
    if (currentPassword !== creds.password) {
      return { success: false, error: "Joriy parol noto'g'ri!" };
    }

    const updatedCreds = { ...creds, password: newPassword };
    localStorage.setItem('keshbak_admin_creds', JSON.stringify(updatedCreds));

    return { success: true, message: "Parol muvaffaqiyatli o'zgartirildi!" };
  };

  const [errorState, setErrorState] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
