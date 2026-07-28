import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  DollarSign, 
  Phone, 
  CreditCard, 
  RefreshCw, 
  X, 
  Download,
  UserCheck
} from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // New User Form State
  const [newUser, setNewUser] = useState({
    full_name: '',
    phone: '+998',
    card_number: '',
    cashback_balance: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          full_name: newUser.full_name,
          name: newUser.full_name,
          phone: newUser.phone,
          card_number: newUser.card_number,
          cashback_balance: parseFloat(newUser.cashback_balance || 0),
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setShowAddModal(false);
      setNewUser({ full_name: '', phone: '+998', card_number: '', cashback_balance: 0 });
      fetchUsers();
    } catch (err) {
      alert("Foydalanuvchi qo'shishda xatolik: " + err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updatedBalance = parseFloat(newBalance);
      const cleanName = editingName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: cleanName,
          name: cleanName,
          cashback_balance: updatedBalance 
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert("Foydalanuvchi ma'lumotlarini yangilashda xatolik: " + err.message);
    }
  };

  // Filter users by search query (phone or name)
  const filteredUsers = users.filter((u) => {
    const userName = u.full_name || u.name || '';
    const nameMatch = userName.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const cardMatch = u.card_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || phoneMatch || cardMatch;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  const exportUsersCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ["ID", "Ism-Sharif", "Telefon", "Karta Raqam", "Keshbek Balans (so'm)"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.full_name || u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.card_number || ''}"`,
      u.cashback_balance || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `profiles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0f7b4c]" /> Foydalanuvchilar Boshqaruvi 
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ro'yxatdan o'tgan mijozlar, ularning karta va keshbek balanslarini boshqarish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportUsersCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Yangi Foydalanuvchi Qo'shish
          </button>
        </div>
      </div>

      {/* Search & Stats Filter Row */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Telefon raqami yoki Ism bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Jami topildi: <strong className="text-slate-900">{filteredUsers.length}</strong> ta mijoz</span>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Foydalanuvchi</th>
                <th className="p-3.5">Telefon Raqami</th>
                <th className="p-3.5">Karta Raqami</th>
                <th className="p-3.5 text-right">Keshbek Balans</th>
                <th className="p-3.5 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
                    Foydalanuvchilar ro'yxati yuklanmoqda...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const displayName = user.full_name || user.name || 'Noma\'lum Mijoz';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0f7b4c] font-bold flex items-center justify-center text-xs border border-emerald-200">
                            {displayName !== 'Noma\'lum Mijoz' ? displayName.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {displayName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {user.id ? String(user.id).substring(0, 8) : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium font-mono">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone || '—'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {user.card_number ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800 flex items-center gap-1.5 w-fit">
                            <CreditCard className="w-3.5 h-3.5 text-[#0f7b4c]" />
                            {user.card_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Karta biriktirilmagan</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-[#0f7b4c] text-sm">
                        {formatCurrency(user.cashback_balance)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditingName(user.full_name || user.name || '');
                            setNewBalance(user.cashback_balance || 0);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#0f7b4c] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Mos keluvchi foydalanuvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0f7b4c]" /> Mijoz Ma'lumotlarini Tahrirlash
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mijoz Ismi va Familiyasi:
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Mijoz ismini kiriting..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keshbek Balansi (so'm):
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-base font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 space-y-1">
                <p>Telefon: <strong className="text-slate-800">{editingUser.phone || '—'}</strong></p>
                <p>Karta: <strong className="text-slate-800">{editingUser.card_number || '—'}</strong></p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0f7b4c]" /> Yangi Foydalanuvchi Yaratish
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ism va Sharif:
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefon Raqami:
                </label>
                <input
                  type="text"
                  required
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karta Raqami (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={newUser.card_number}
                  onChange={(e) => setNewUser(prev => ({ ...prev, card_number: e.target.value }))}
                  placeholder="8600 **** **** ****"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boshlang'ich Keshbek Balans (so'm):
                </label>
                <input
                  type="number"
                  value={newUser.cashback_balance}
                  onChange={(e) => setNewUser(prev => ({ ...prev, cashback_balance: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
