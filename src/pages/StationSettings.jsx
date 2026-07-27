import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StationMapPicker from '../components/StationMapPicker';
import { 
  Save, 
  CheckCircle2, 
  Phone, 
  Clock, 
  MapPin, 
  Percent, 
  Plus, 
  RefreshCw, 
  Sliders,
  Fuel
} from 'lucide-react';

export default function StationSettings({ onStationUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newFuelInput, setNewFuelInput] = useState('');

  // Station Form State matching Supabase station_settings table
  const [form, setForm] = useState({
    id: 'main',
    name: 'Lukoil — Yunusobod',
    is_open: true,
    cashback_percent: 5.0,
    phone: '+998 71 234 56 78',
    work_hours: '07:00 – 23:00',
    address: 'Yunusobod tumani, 14-mavze, 7-uy',
    fuel_types: ['AI-80', 'AI-91', 'AI-95', 'Dizel'],
    lat: 41.3253226,
    lng: 69.2870051
  });

  const availablePresetFuels = ['AI-80', 'AI-91', 'AI-92', 'AI-95', 'AI-98', 'Dizel', 'Metan', 'Propan'];

  useEffect(() => {
    fetchStationSettings();
    subscribeToStationChanges();
  }, []);

  const fetchStationSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('station_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setForm({
          id: data.id || 'main',
          name: data.name || 'Zapravka Stansiyasi',
          is_open: Boolean(data.is_open),
          cashback_percent: Number(data.cashback_percent || 5.0),
          phone: data.phone || '',
          work_hours: data.work_hours || '',
          address: data.address || '',
          fuel_types: Array.isArray(data.fuel_types) ? data.fuel_types : ['AI-80', 'AI-91', 'AI-95'],
          lat: Number(data.lat || 41.3253226),
          lng: Number(data.lng || 69.2870051)
        });
        if (onStationUpdated) onStationUpdated(data);
      }
    } catch (err) {
      console.error('Error fetching station settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToStationChanges = () => {
    const channelTopic = `station_settings_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelTopic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'station_settings' }, (payload) => {
        if (payload.new) {
          setForm((prev) => ({
            ...prev,
            ...payload.new
          }));
          if (onStationUpdated) onStationUpdated(payload.new);
        }
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        id: form.id,
        name: form.name,
        is_open: form.is_open,
        cashback_percent: parseFloat(form.cashback_percent),
        phone: form.phone,
        work_hours: form.work_hours,
        address: form.address,
        fuel_types: form.fuel_types,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('station_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      setSaveSuccess(true);
      if (onStationUpdated) onStationUpdated(data || payload);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error updating station settings:', err);
      alert('Sozlamalarni saqlashda xatolik yuz berdi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleFuelTag = (fuel) => {
    setForm((prev) => {
      const exists = prev.fuel_types.includes(fuel);
      const updated = exists 
        ? prev.fuel_types.filter(f => f !== fuel)
        : [...prev.fuel_types, fuel];
      return { ...prev, fuel_types: updated };
    });
  };

  const addCustomFuel = () => {
    if (!newFuelInput.trim()) return;
    const cleanTag = newFuelInput.trim();
    if (!form.fuel_types.includes(cleanTag)) {
      setForm(prev => ({
        ...prev,
        fuel_types: [...prev.fuel_types, cleanTag]
      }));
    }
    setNewFuelInput('');
  };

  const handleMapLocationChange = (newLat, newLng) => {
    setForm(prev => ({
      ...prev,
      lat: newLat,
      lng: newLng
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
        Stansiya sozlamalari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#0f7b4c] flex items-center justify-center border border-emerald-200">
            <Fuel className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Stansiya Sozlamalari (`station_settings`)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              O'zgarishlar mijoz ilovasida va QR skanerdagi keshbekda REAL-TIME o'zgaradi
            </p>
          </div>
        </div>

        {/* Live Status Switch */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-500">Stansiya Holati:</div>
            <div className={`text-sm font-bold ${form.is_open ? 'text-[#0f7b4c]' : 'text-rose-600'}`}>
              {form.is_open ? 'OCHIQ (Ishlayapti)' : 'YOPIQ (Hozir yopiq)'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, is_open: !prev.is_open }))}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
              form.is_open ? 'bg-[#0f7b4c] justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300"></span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-[#0f7b4c] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Asosiy Parametrlar
            </h3>

            {/* Stansiya Nomi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Zapravka Stansiyasi Nomi:
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Lukoil Yunusobod"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c] font-medium"
              />
            </div>

            {/* Keshbek Foizi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#0f7b4c]" /> Standard Keshbek Foizi (`cashback_percent`):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.cashback_percent}
                  onChange={(e) => setForm(prev => ({ ...prev, cashback_percent: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c] pr-12"
                />
                <span className="absolute right-4 top-2.5 font-bold text-[#0f7b4c] text-sm">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Mijoz har bir yoqilg'i quyish tranzaksiyasidan oladigan standart keshbek foizi.
              </p>
            </div>

            {/* Telefon & Ish Vaqti */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0f7b4c]" /> Telefon Raqami (`phone`):
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+998 71 234 56 78"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0f7b4c]" /> Ish Vaqti (`work_hours`):
                </label>
                <input
                  type="text"
                  value={form.work_hours}
                  onChange={(e) => setForm(prev => ({ ...prev, work_hours: e.target.value }))}
                  placeholder="07:00 – 23:00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>
            </div>

            {/* Manzil */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0f7b4c]" /> Manzil (`address`):
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Masalan: Yunusobod tumani, 14-mavze, 7-uy"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
              />
            </div>
          </div>

          {/* Yoqilg'i turlari (Fuel Types Tags) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f7b4c] uppercase tracking-wider flex items-center gap-2">
              <Fuel className="w-4 h-4" /> Mavjud Yoqilg'i Turlari (`fuel_types`)
            </h3>
            
            {/* Presets badges */}
            <div className="space-y-2">
              <span className="text-xs text-slate-500">Tezkor tanlash:</span>
              <div className="flex flex-wrap gap-2">
                {availablePresetFuels.map((fuel) => {
                  const selected = form.fuel_types.includes(fuel);
                  return (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => toggleFuelTag(fuel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selected
                          ? 'bg-[#0f7b4c] text-white border-[#0f7b4c] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-500'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{fuel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom tag input */}
            <div className="pt-2 flex gap-2">
              <input
                type="text"
                value={newFuelInput}
                onChange={(e) => setNewFuelInput(e.target.value)}
                placeholder="Yangi yoqilg'i turi (Masalan: Eco-Propan)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={addCustomFuel}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Qo'shish
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Leaflet Map & Save Action */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <StationMapPicker
              lat={form.lat}
              lng={form.lng}
              onChangeLocation={handleMapLocationChange}
            />
          </div>

          {/* Submit Save Button & Toast */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0f7b4c] text-xs font-semibold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Stansiya sozlamalari Supabase-ga muvaffaqiyatli saqlandi!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white font-bold text-sm shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Sozlamalarni Real-Time Saqlash
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              ⚡️ O'zgarishlar darhol mijozlar mobil ilovalarida namoyon bo'ladi.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
