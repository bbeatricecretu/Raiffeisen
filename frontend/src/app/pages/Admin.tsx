// frontend/src/app/pages/Admin.tsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Search, X, ArrowLeft, CreditCard, Users as UsersIcon, Contact, ShieldCheck } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  iban: string;
  balance: number;
  balance_savings?: number;
  career?: string;
  location?: string;
}

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  city?: string;
  county?: string;
}

interface ContactItem {
  id: string;
  user_id: string;
  name: string;
  iban: string;
  phone: string;
}

interface Confirmation {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  city?: string;
  county?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

type Tab = 'users' | 'transactions' | 'contacts' | 'confirmations';

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // User form
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User> & { password?: string }>({});

  // Per-user detail view
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // Transactions for selected user
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Contacts for selected user
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [ctLoading, setCtLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<ContactItem>>({});

  // Confirmations for selected user
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [confLoading, setConfLoading] = useState(false);
  const [isCreatingConf, setIsCreatingConf] = useState(false);
  const [confForm, setConfForm] = useState<Partial<Confirmation>>({});

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setUsers(await api.getAllUsers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async (uid: string) => {
    setTxLoading(true);
    try { setTransactions(await api.getTransactions(uid, 1000)); }
    catch { setTransactions([]); }
    finally { setTxLoading(false); }
  };

  const fetchContacts = async (uid: string) => {
    setCtLoading(true);
    try { setContacts(await api.getUserContacts(uid)); }
    catch { setContacts([]); }
    finally { setCtLoading(false); }
  };

  const fetchConfirmations = async (uid: string) => {
    setConfLoading(true);
    try { setConfirmations(await api.getUserConfirmations(uid)); }
    catch { setConfirmations([]); }
    finally { setConfLoading(false); }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setActiveTab('transactions');
    fetchTransactions(user.id);
    fetchContacts(user.id);
    fetchConfirmations(user.id);
  };

  const goBack = () => {
    setSelectedUser(null);
    setActiveTab('users');
  };

  // --- User CRUD ---
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ ...user });
    setIsCreatingUser(false);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '', email: '', phone: '',
      iban: `RO${Math.floor(Math.random() * 100)}RAIF${Date.now().toString().slice(-14)}`,
      balance: 2500.00, balance_savings: 15420.50, password: 'Password123!', career: '', location: ''
    });
    setIsCreatingUser(true);
  };

  const handleSaveUser = async () => {
    try {
      if (isCreatingUser) {
        await api.createUser(userForm);
      } else if (editingUser) {
        const { id, ...data } = userForm as any;
        if (!data.password) delete data.password;
        await api.updateUser(editingUser.id, data);
      }
      setIsCreatingUser(false);
      setEditingUser(null);
      fetchUsers();
    } catch (e) { alert('Failed to save: ' + e); }
  };

  // --- Transaction delete ---
  const handleDeleteTx = async (txId: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.deleteTransaction(txId);
      if (selectedUser) fetchTransactions(selectedUser.id);
    } catch (e) { alert('Failed: ' + e); }
  };

  // --- Contact CRUD ---
  const handleCreateContact = () => {
    setEditingContact(null);
    setContactForm({ name: '', iban: '', phone: '' });
    setIsCreatingContact(true);
  };

  const handleEditContact = (c: ContactItem) => {
    setEditingContact(c);
    setContactForm({ ...c });
    setIsCreatingContact(false);
  };

  const handleSaveContact = async () => {
    try {
      if (isCreatingContact && selectedUser) {
        await api.createContact({ user_id: selectedUser.id, name: contactForm.name || '', iban: contactForm.iban, phone: contactForm.phone });
      } else if (editingContact) {
        await api.updateContact(editingContact.id, { name: contactForm.name || undefined, iban: contactForm.iban || undefined, phone: contactForm.phone || undefined });
      }
      setIsCreatingContact(false);
      setEditingContact(null);
      if (selectedUser) fetchContacts(selectedUser.id);
    } catch (e) { alert('Failed: ' + e); }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await api.deleteContact(id);
      if (selectedUser) fetchContacts(selectedUser.id);
    } catch (e) { alert('Failed: ' + e); }
  };

  // --- Confirmation CRUD ---
  const handleCreateConf = () => {
    setConfForm({ merchant: '', amount: 0, currency: 'RON', category: '', city: '', county: '' });
    setIsCreatingConf(true);
  };

  const handleSaveConf = async () => {
    try {
      if (selectedUser) {
        await api.createConfirmation({
          user_id: selectedUser.id,
          merchant: confForm.merchant || '',
          amount: confForm.amount || 0,
          currency: confForm.currency || 'RON',
          category: confForm.category,
          city: confForm.city,
          county: confForm.county,
        });
        fetchConfirmations(selectedUser.id);
      }
      setIsCreatingConf(false);
    } catch (e) { alert('Failed: ' + e); }
  };

  const handleDeleteConf = async (id: string) => {
    if (!confirm('Delete this confirmation?')) return;
    try {
      await api.deleteConfirmation(id);
      if (selectedUser) fetchConfirmations(selectedUser.id);
    } catch (e) { alert('Failed: ' + e); }
  };

  // ──────────── MODALS ────────────

  const renderUserModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isCreatingUser ? 'Create User' : 'Edit User'}</h2>
          <button onClick={() => { setIsCreatingUser(false); setEditingUser(null); }}><X size={20} /></button>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
            <input className="w-full border p-2 rounded" value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input className="w-full border p-2 rounded" value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{isCreatingUser ? 'Password' : 'New Password (leave blank to keep)'}</label>
            <input type="text" className="w-full border p-2 rounded" value={userForm.password || ''} placeholder={isCreatingUser ? 'Enter password' : 'Keep current'} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input className="w-full border p-2 rounded" value={userForm.phone || ''} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Cont Curent (RON)</label>
              <input type="number" className="w-full border p-2 rounded" value={userForm.balance ?? 0} onChange={e => setUserForm({ ...userForm, balance: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cont Economii (RON)</label>
            <input type="number" className="w-full border p-2 rounded" value={userForm.balance_savings ?? 0} onChange={e => setUserForm({ ...userForm, balance_savings: parseFloat(e.target.value) || 0 })} />
            </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">IBAN</label>
            <input className="w-full border p-2 rounded font-mono text-sm" value={userForm.iban || ''} onChange={e => setUserForm({ ...userForm, iban: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Career</label>
              <input className="w-full border p-2 rounded" value={userForm.career || ''} onChange={e => setUserForm({ ...userForm, career: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
              <input className="w-full border p-2 rounded" value={userForm.location || ''} onChange={e => setUserForm({ ...userForm, location: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => { setIsCreatingUser(false); setEditingUser(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSaveUser} className="px-4 py-2 bg-[#FFD100] text-[#1B2B4B] font-semibold rounded-lg hover:brightness-105">Save User</button>
        </div>
      </div>
    </div>
  );

  const renderContactModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isCreatingContact ? 'Add Contact' : 'Edit Contact'}</h2>
          <button onClick={() => { setIsCreatingContact(false); setEditingContact(null); }}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
            <input className="w-full border p-2 rounded" value={contactForm.name || ''} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">IBAN</label>
            <input className="w-full border p-2 rounded font-mono text-sm" value={contactForm.iban || ''} onChange={e => setContactForm({ ...contactForm, iban: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
            <input className="w-full border p-2 rounded" value={contactForm.phone || ''} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => { setIsCreatingContact(false); setEditingContact(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSaveContact} className="px-4 py-2 bg-[#FFD100] text-[#1B2B4B] font-semibold rounded-lg hover:brightness-105">Save Contact</button>
        </div>
      </div>
    </div>
  );

  // ──────────── USERS LIST VIEW ────────────

  const renderUsersView = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Admin Panel</h1>
          <p className="text-gray-500">Manage users, transactions, and contacts</p>
        </div>
        <button onClick={handleCreateUser} className="flex items-center gap-2 bg-[#1B2B4B] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all font-semibold">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#FFD100]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Cont Curent (RON)</th>
                <th className="px-6 py-3">Cont Economii (RON)</th>
                <th className="px-6 py-3">IBAN</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => selectUser(user)}>
                  <td className="px-6 py-3 font-medium text-[#1B2B4B]">{user.name}</td>
                  <td className="px-6 py-3 text-gray-500">{user.email}</td>
                  <td className="px-6 py-3 font-mono font-medium text-[#1B2B4B]">
                    {user.balance?.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-[#1B2B4B]">
                    {(user.balance_savings ?? 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{user.iban || '-'}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={e => { e.stopPropagation(); handleEditUser(user); }} className="p-2 text-gray-400 hover:text-[#1B2B4B] hover:bg-gray-100 rounded-lg transition-all">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ──────────── PER-USER DETAIL VIEW ────────────

  const renderUserDetail = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft size={20} className="text-[#1B2B4B]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1B2B4B]">{selectedUser!.name}</h1>
          <p className="text-gray-500 text-sm">
            {selectedUser!.email} &middot; Cont Curent: {selectedUser!.balance?.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON &middot; Cont Economii: {(selectedUser!.balance_savings ?? 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
          </p>
        </div>
        <button onClick={() => handleEditUser(selectedUser!)} className="flex items-center gap-2 text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          <Edit size={14} /> Edit Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'transactions' ? 'bg-white text-[#1B2B4B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CreditCard size={16} /> Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'contacts' ? 'bg-white text-[#1B2B4B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Contact size={16} /> Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('confirmations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'confirmations' ? 'bg-white text-[#1B2B4B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShieldCheck size={16} /> Confirmations ({confirmations.length})
        </button>
      </div>

      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'contacts' && renderContactsTab()}
      {activeTab === 'confirmations' && renderConfirmationsTab()}
    </>
  );

  // ──────────── TRANSACTIONS TAB ────────────

  const renderTransactionsTab = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">{transactions.length} transactions</span>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Merchant</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">City</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {txLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No transactions</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-2.5 text-gray-500 text-xs whitespace-nowrap">{tx.date?.slice(0, 10)}</td>
                <td className="px-5 py-2.5 font-medium text-[#1B2B4B]">{tx.merchant_name}</td>
                <td className="px-5 py-2.5 text-gray-500 capitalize">{tx.category || '-'}</td>
                <td className="px-5 py-2.5 text-gray-500">{tx.city || '-'}</td>
                <td className={`px-5 py-2.5 text-right font-mono font-medium ${tx.amount < 0 ? 'text-green-600' : 'text-[#1B2B4B]'}`}>
                  {tx.amount < 0 ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} {tx.currency || 'RON'}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ──────────── CONTACTS TAB ────────────

  const renderContactsTab = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">{contacts.length} contacts</span>
        <button onClick={handleCreateContact} className="flex items-center gap-2 bg-[#1B2B4B] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus size={16} /> Add Contact
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">IBAN</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ctLoading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">No contacts yet</td></tr>
            ) : contacts.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-[#1B2B4B]">{c.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.iban || '-'}</td>
                <td className="px-5 py-3 text-gray-500">{c.phone || '-'}</td>
                <td className="px-5 py-3 text-right flex justify-end gap-1">
                  <button onClick={() => handleEditContact(c)} className="p-1.5 text-gray-400 hover:text-[#1B2B4B] hover:bg-gray-100 rounded-lg transition-all">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDeleteContact(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ──────────── CONFIRMATIONS TAB ────────────

  const renderConfirmationsTab = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">{confirmations.length} confirmations</span>
        <button onClick={handleCreateConf} className="flex items-center gap-2 bg-[#1B2B4B] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus size={16} /> Add Confirmation
        </button>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
            <tr>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Merchant</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">County</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {confLoading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : confirmations.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500">No confirmations</td></tr>
            ) : confirmations.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.created_at?.slice(0, 10)}</td>
                <td className="px-5 py-2.5 font-medium text-[#1B2B4B]">{c.merchant}</td>
                <td className="px-5 py-2.5 text-gray-500 capitalize">{c.category || '-'}</td>
                <td className="px-5 py-2.5 text-gray-500">{c.county || '-'}</td>
                <td className="px-5 py-2.5 text-right font-mono font-medium text-[#1B2B4B]">
                  {c.amount.toFixed(2)} {c.currency || 'RON'}
                </td>
                <td className="px-5 py-2.5 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    c.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button onClick={() => handleDeleteConf(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Pending Confirmation</h2>
          <button onClick={() => setIsCreatingConf(false)}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Merchant</label>
            <input className="w-full border p-2 rounded" value={confForm.merchant || ''} onChange={e => setConfForm({ ...confForm, merchant: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
              <input type="number" step="0.01" className="w-full border p-2 rounded" value={confForm.amount || ''} onChange={e => setConfForm({ ...confForm, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Currency</label>
              <select className="w-full border p-2 rounded" value={confForm.currency || 'RON'} onChange={e => setConfForm({ ...confForm, currency: e.target.value })}>
                <option value="RON">RON</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
                <option value="HUF">HUF</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
            <select className="w-full border p-2 rounded" value={confForm.category || ''} onChange={e => setConfForm({ ...confForm, category: e.target.value })}>
              <option value="">Select...</option>
              <option value="Groceries">Groceries</option>
              <option value="Food">Food</option>
              <option value="Fuel">Fuel</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Shopping">Shopping</option>
              <option value="Transport">Transport</option>
              <option value="Health">Health</option>
              <option value="Utilities">Utilities</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
              <input className="w-full border p-2 rounded" value={confForm.city || ''} onChange={e => setConfForm({ ...confForm, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">County</label>
              <input className="w-full border p-2 rounded" value={confForm.county || ''} onChange={e => setConfForm({ ...confForm, county: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setIsCreatingConf(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSaveConf} className="px-4 py-2 bg-[#FFD100] text-[#1B2B4B] font-semibold rounded-lg hover:brightness-105">Create Confirmation</button>
        </div>
      </div>
    </div>
  );

  // ──────────── RENDER ────────────

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {selectedUser ? renderUserDetail() : renderUsersView()}
      </div>

      {(isCreatingUser || editingUser) && renderUserModal()}
      {(isCreatingContact || editingContact) && renderContactModal()}
      {isCreatingConf && renderConfirmationModal()}
    </div>
  );
}
