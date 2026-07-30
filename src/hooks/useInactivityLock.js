import { useState, useEffect, useCallback, useRef } from 'react';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 daqiqa (300,000 ms)
const STORAGE_KEY_LAST_ACTIVE = 'kechbek_last_activity';
const STORAGE_KEY_LOCKED = 'kechbek_is_locked';

export function useInactivityLock(timeout = TIMEOUT_MS) {
  const [isLocked, setIsLocked] = useState(() => {
    // Sahifa yuklanganda localStoragedagi bloklanganlik holatini tekshirish
    const savedLocked = localStorage.getItem(STORAGE_KEY_LOCKED);
    if (savedLocked === 'true') return true;

    // Yoki so'nggi harakatdan berli 5 minutdan ko'p vaqt o'tgan bo'lsa
    const lastActiveStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (Date.now() - lastActive >= timeout) {
        localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        return true;
      }
    }
    return false;
  });

  const lastUpdateRef = useRef(Date.now());

  // Ekran va harakat timerini nollash
  const resetTimer = useCallback(() => {
    const now = Date.now();
    // Har 1 soniyada ko'p localStorage yozishni oldini olish uchun throttle
    if (now - lastUpdateRef.current > 1000) {
      lastUpdateRef.current = now;
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
    }
  }, []);

  // Tizimni majburiy/qo'lda bloklash
  const lock = useCallback(() => {
    setIsLocked(true);
    localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
  }, []);

  // Tizimni PIN-kod bilan ochish
  const unlock = useCallback(() => {
    const now = Date.now();
    setIsLocked(false);
    localStorage.setItem(STORAGE_KEY_LOCKED, 'false');
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
    lastUpdateRef.current = now;
  }, []);

  // Foydalanuvchi harakatlarini kuzatib borish
  useEffect(() => {
    if (isLocked) return;

    // Dastlabki faollik vaqtini saqlash
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    const handleActivity = () => {
      if (!isLocked) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 1 soniyada bir marta harakatsizlik vaqtini tekshirib boruvchi interval
    const intervalId = setInterval(() => {
      const savedLocked = localStorage.getItem(STORAGE_KEY_LOCKED);
      if (savedLocked === 'true') {
        setIsLocked(true);
        return;
      }

      const lastActiveStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
      const elapsed = Date.now() - lastActive;

      if (elapsed >= timeout) {
        lock();
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [isLocked, resetTimer, timeout, lock]);

  return {
    isLocked,
    lock,
    unlock
  };
}
