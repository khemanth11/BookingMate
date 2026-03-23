import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, MapPin, Calendar, 
  CheckCircle2, XCircle, Trash2, Search,
  Bell, Settings, LogOut, TrendingUp,
  ShieldCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const API_BASE = 'http://localhost:5000/api/admin';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, listings: 0, bookings: 0, revenue: 0 });
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, listingsRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/listings`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setListings(listingsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyUser = async (userId) => {
    try {
      await axios.put(`${API_BASE}/verify-user/${userId}`);
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to verify user');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${API_BASE}/listings/${listingId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  // Mock chart data based on real stats for visual flair
  const chartData = [
    { name: 'Jan', bookings: Math.floor(stats.bookings * 0.1), revenue: Math.floor(stats.revenue * 0.08) },
    { name: 'Feb', bookings: Math.floor(stats.bookings * 0.2), revenue: Math.floor(stats.revenue * 0.15) },
    { name: 'Mar', bookings: Math.floor(stats.bookings * 0.4), revenue: Math.floor(stats.revenue * 0.35) },
    { name: 'Apr', bookings: stats.bookings, revenue: stats.revenue },
  ];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = listings.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  if (loading && stats.users === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-500 animate-spin" size={40} />
          <p className="text-slate-400 font-medium">Loading EverythingBooking Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 p-6 flex flex-col gap-8 bg-[#0f172a]/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AdminHub</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem id="overview" icon={TrendingUp} label="Overview" />
          <SidebarItem id="users" icon={Users} label="User Directory" />
          <SidebarItem id="listings" icon={MapPin} label="Service Listings" />
          <SidebarItem id="bookings" icon={Calendar} label="All Bookings" />
          <div className="my-4 border-t border-slate-800" />
          <SidebarItem id="settings" icon={Settings} label="Settings" />
        </nav>

        <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors mt-auto">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {activeTab === 'overview' ? 'Platform Overview' : 
               activeTab === 'users' ? 'User Management' : 
               activeTab === 'listings' ? 'Listing Audit' : 
               activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-400 mt-1">Real-time platform control and analytics.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                placeholder="Search everything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all w-72"
              />
            </div>
            <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900" />
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.users, trend: 'Database Live', color: 'blue' },
                { label: 'Live Services', value: stats.listings, trend: 'Active Now', color: 'emerald' },
                { label: 'Total Bookings', value: stats.bookings, trend: 'All Time', color: 'purple' },
                { label: 'Total Revenue', value: `₹${stats.revenue}`, trend: 'Completed', color: 'amber' },
              ].map((s, idx) => (
                <div key={idx} className="glass-card flex flex-col gap-3 group hover:border-blue-500/50 transition-all cursor-default">
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{s.label}</span>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-white tracking-tighter">{s.value}</span>
                    <span className={`text-${s.color}-400 text-[10px] font-black uppercase tracking-tighter bg-${s.color}-500/10 px-2 py-1 rounded-md`}>{s.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6 h-[400px]">
                <h3 className="text-xl font-bold text-white mb-6">Revenue Scaling</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-6 h-[400px]">
                <h3 className="text-xl font-bold text-white mb-6">Market Adoption</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Bar dataKey="bookings" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden p-0 animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">User Profile</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Verification</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center font-bold text-slate-300 border border-slate-700 group-hover:border-blue-500/50 transition-all">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{u.name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                          u.role === 'provider' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 size={16} /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                            <AlertTriangle size={16} /> Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleVerifyUser(u._id)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                              u.isVerified 
                              ? 'bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400' 
                              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                            }`}
                          >
                            {u.isVerified ? 'Revoke KYC' : 'Verify (KYC)'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="p-20 text-center text-slate-500 font-medium">No users found matching your search.</div>
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {filteredListings.map((l) => (
              <div key={l._id} className="glass-card group hover:border-red-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                      {l.category}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{l.name}</h3>
                  </div>
                  <button 
                    onClick={() => handleDeleteListing(l._id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">{l.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                       {l.providerId?.name.charAt(0)}
                     </div>
                     <span className="text-xs text-slate-400 font-medium">{l.providerId?.name}</span>
                   </div>
                   <span className="text-lg font-bold text-white tracking-tighter">₹{l.price}</span>
                </div>
              </div>
            ))}
            {filteredListings.length === 0 && (
              <div className="col-span-full p-20 text-center text-slate-500 font-medium glass-card">No service listings found.</div>
            )}
          </div>
        )}

        {/* Generic View for unimplemented tabs */}
        {(activeTab === 'bookings' || activeTab === 'settings') && (
           <div className="glass-card flex flex-col items-center justify-center p-20 gap-4 opacity-50">
             <Settings className="text-slate-600 animate-pulse" size={48} />
             <p className="text-slate-400 font-medium text-lg">Admin module for {activeTab} coming soon.</p>
           </div>
        )}
      </main>

      <style jsx>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0f172a;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

export default App;
