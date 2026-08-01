import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle, KeyRound, Clock, Fuel } from 'lucide-react';

export default function AutoLockOverlay({ isLocked, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Read PIN code from .env environment variable (default: 123456)
  const EXPECTED_PIN = import.meta.env.VITE_SECURITY_CODE || '123456';

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setError('');
      setIsShaking(false);
    }
  }, [isLocked]);

  // Physical keyboard support
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePressDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pin]);

  if (!isLocked) return null;

  const handlePressDigit = (digit) => {
    if (pin.length >= 6) return;
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    // Auto verify when 6th digit is typed
    if (newPin.length === 6) {
      verifyPin(newPin);
    }
  };

  const handleDeleteDigit = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  const verifyPin = (codeToVerify) => {
    const code = codeToVerify || pin;
    if (code === EXPECTED_PIN) {
      setError('');
      onUnlock();
    } else {
      setError("❌ Noto'g'ri PIN-kod! Iltimos qaytadan kiriting.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn select-none overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950/80 to-slate-950 pointer-events-none" />

      <div 
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all relative z-10 ${
          isShaking ? 'animate-bounce border-rose-500 shadow-rose-900/40' : ''
        }`}
      >
        {/* Header Section */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white text-center relative overflow-hidden">
          {/* Subtle logo bg watermark */}
          <Fuel className="w-40 h-40 absolute -right-10 -bottom-10 opacity-5 text-emerald-400 pointer-events-none" />

          {/* Animated Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner relative group">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 animate-ping opacity-75" />
            <Lock className="w-8 h-8 relative z-10 text-emerald-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>5 Daqiqa Harakatsizlik Sababli Bloklandi</span>
          </div>

          <h2 className="text-xl font-black text-white tracking-wide">
            Tizim Qulflangan
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xs mx-auto">
            "KeshBak" SuperAdmin tizimiga qayta kirish va davom etish uchun 6 xonali maxfiy PIN-kodni kiriting.
          </p>
        </div>

        {/* PIN Display & Keypad Section */}
        <div className="p-6 space-y-6 bg-white">
          {/* PIN Digit Indicators */}
          <div className="flex justify-center items-center gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-11 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    isFilled
                      ? 'border-[#0f7b4c] bg-emerald-50 text-[#0f7b4c] shadow-md scale-105'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {isFilled ? '●' : ''}
                </div>
              );
            })}
          </div>

          {/* Error / Status Info */}
          {error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center justify-center gap-2 text-center animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tizim .env dagi 6 xonali maxfiy PIN-kod bilan himoyalangan</span>
            </div>
          )}

          {/* Numeric Touch Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePressDigit(num)}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-[#0f7b4c] text-xl font-extrabold transition-all shadow-sm active:scale-95 select-none flex items-center justify-center"
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all shadow-sm active:scale-95 select-none"
            >
              C
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handlePressDigit('0')}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-[#0f7b4c] text-xl font-extrabold transition-all shadow-sm active:scale-95 select-none flex items-center justify-center"
            >
              0
            </button>

            {/* Delete Backspace Button */}
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-all shadow-sm active:scale-95 select-none"
              title="O'chirish"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => verifyPin()}
              disabled={pin.length !== 6}
              className="w-full py-4 rounded-2xl bg-[#0f7b4c] hover:bg-[#0a5c39] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Qulfni Ochish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
