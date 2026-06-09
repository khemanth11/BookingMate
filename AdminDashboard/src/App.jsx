import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Users, MapPin, Calendar,
  CheckCircle2, XCircle, Trash2, Search,
  Bell, Settings, LogOut, TrendingUp,
  ShieldCheck, AlertTriangle, RefreshCw,
  CreditCard, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

const API_BASE = 'http://localhost:5000/api/admin';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, listings: 0, bookings: 0, revenue: 0, netProfit: 0 });
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [kycPending, setKycPending] = useState([]);
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('all');
  const [config, setConfig] = useState({ commissionRate: 10, maintenanceMode: false });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailedBooking, setSelectedDetailedBooking] = useState(null);
  const [selectedKycImage, setSelectedKycImage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, listingsRes, bookingsRes, configRes, payoutsRes, reviewsRes, kycRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/listings`),
        axios.get(`${API_BASE}/bookings`),
        axios.get(`${API_BASE}/settings`),
        axios.get(`${API_BASE}/payouts`),
        axios.get(`${API_BASE}/reviews`),
        axios.get(`${API_BASE}/kyc-pending`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setListings(listingsRes.data);
      setBookings(bookingsRes.data);
      setConfig(configRes.data);
      setPayouts(payoutsRes.data);
      setReviews(reviewsRes.data);
      setKycPending(kycRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveKyc = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this KYC request?`)) return;
    try {
      await axios.put(`${API_BASE}/verify-kyc/${userId}`, { action });
      alert(`KYC request successfully ${action}ed.`);
      fetchData();
    } catch (err) {
      alert('Failed to resolve KYC: ' + (err.response?.data?.message || err.message));
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

  const handleResolveBooking = async (bookingId, action) => {
    if (!window.confirm(`Are you sure you want to resolve this booking with action: ${action}?`)) return;
    try {
      await axios.put(`${API_BASE}/bookings/${bookingId}/resolve`, { action });
      fetchData();
    } catch (err) {
      alert('Failed to resolve booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResolvePayout = async (walletId, transactionId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this payout request?`)) return;
    try {
      await axios.put(`${API_BASE}/payouts/${walletId}/transaction/${transactionId}/resolve`, { action });
      alert(`Payout request successfully ${action}ed.`);
      fetchData();
    } catch (err) {
      alert('Failed to resolve payout: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await axios.delete(`${API_BASE}/reviews/${reviewId}`);
      alert('Review deleted successfully.');
      fetchData();
    } catch (err) {
      alert('Failed to delete review: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateConfig = async (commissionRate, maintenanceMode) => {
    try {
      const res = await axios.put(`${API_BASE}/settings`, { commissionRate, maintenanceMode });
      setConfig(res.data);
      alert('Settings updated successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to update settings');
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

  const filteredBookings = bookings.filter(b =>
    b.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.providerId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.listingId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
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
          <SidebarItem id="payouts" icon={CreditCard} label="Payout Approvals" />
          <SidebarItem id="kyc" icon={ShieldCheck} label="KYC Approvals" />
          <SidebarItem id="reviews" icon={Star} label="Review Moderation" />
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
                    activeTab === 'payouts' ? 'Payout Approvals' :
                      activeTab === 'reviews' ? 'Review Moderation' :
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', value: stats.users, trend: 'Database Live', color: 'blue' },
                { label: 'Live Services', value: stats.listings, trend: 'Active Now', color: 'emerald' },
                { label: 'Total Bookings', value: stats.bookings, trend: 'All Time', color: 'purple' },
                { label: 'Gross Volume', value: `₹${stats.revenue}`, trend: 'Completed', color: 'amber' },
                { label: 'Platform Profit', value: `₹${stats.netProfit || 0}`, trend: `${config?.commissionRate || 10}% Fee`, color: 'emerald' },
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
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${u.role === 'provider' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'
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
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${u.isVerified
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
                  <span className="text-lg font-bold text-white tracking-tighter">{l.price}</span>
                </div>
              </div>
            ))}
            {filteredListings.length === 0 && (
              <div className="col-span-full p-20 text-center text-slate-500 font-medium glass-card">No service listings found.</div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass-card overflow-hidden p-0 animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Booking Info</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Consumer</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Provider</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{b.listingId?.name || 'Deleted Listing'}</p>
                          <p className="text-sm text-slate-500">{b.date} | {b.startTime} - {b.endTime}</p>
                          {b.isAiVerified && (
                            <span className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400">
                              🤖 AI Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-300">{b.userId?.name || 'Deleted Consumer'}</p>
                          <p className="text-sm text-slate-500">{b.userId?.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-300">{b.providerId?.name || 'Deleted Provider'}</p>
                          <p className="text-sm text-slate-500">{b.providerId?.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${b.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                          b.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                            b.status === 'confirmed' ? 'bg-indigo-500/10 text-indigo-400' :
                              b.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                b.status === 'disputed' ? 'bg-amber-500/10 text-amber-400 animate-pulse border border-amber-500/20' :
                                  'bg-slate-500/10 text-slate-400'
                          }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDetailedBooking(b)}
                            className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all border border-slate-700/50 mr-auto whitespace-nowrap"
                          >
                            View All Details
                          </button>
                          {['pending', 'confirmed', 'completed', 'disputed'].includes(b.status) && (
                            <>
                              <button
                                onClick={() => handleResolveBooking(b._id, 'complete')}
                                className="bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                              >
                                Force Release
                              </button>
                              <button
                                onClick={() => handleResolveBooking(b._id, 'cancel')}
                                className="bg-red-600 text-white hover:bg-red-500 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-lg shadow-red-500/20 whitespace-nowrap"
                              >
                                Cancel & Refund
                              </button>
                            </>
                          )}
                          {b.status === 'verified' && (
                            <span className="text-xs text-emerald-500 font-bold whitespace-nowrap">Payout Settled</span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="text-xs text-red-400 font-bold whitespace-nowrap">Cancelled / Refunded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings.length === 0 && (
              <div className="p-20 text-center text-slate-500 font-medium">No bookings found matching search.</div>
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 max-w-md">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'completed', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPayoutStatusFilter(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs capitalize transition-all ${
                    payoutStatusFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="glass-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Provider Info</th>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Bank / UPI Details</th>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Requested Payout</th>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Request Date</th>
                      <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {payouts
                      .filter((p) => payoutStatusFilter === 'all' || p.status === payoutStatusFilter)
                      .map((p) => (
                        <tr key={p.transactionId} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{p.provider?.name || 'Unknown Provider'}</p>
                              <p className="text-sm text-slate-500">{p.provider?.email || 'No Email'}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{p.provider?.phone || 'No Phone'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {p.provider?.bankDetails?.accountNumber || p.provider?.bankDetails?.upiId ? (
                              <div className="space-y-1 text-xs">
                                {p.provider.bankDetails.upiId ? (
                                  <p className="text-white"><span className="text-slate-500">UPI:</span> <span className="font-mono font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">{p.provider.bankDetails.upiId}</span></p>
                                ) : null}
                                {p.provider.bankDetails.accountNumber ? (
                                  <>
                                    <p className="text-white"><span className="text-slate-500">A/C Holder:</span> <span className="font-semibold">{p.provider.bankDetails.accountHolderName}</span></p>
                                    <p className="text-white"><span className="text-slate-500">A/C No:</span> <span className="font-mono font-semibold text-slate-300">{p.provider.bankDetails.accountNumber}</span></p>
                                    <p className="text-white"><span className="text-slate-500">IFSC:</span> <span className="font-mono font-semibold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{p.provider.bankDetails.ifscCode}</span></p>
                                  </>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md">⚠️ No Details Found</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-extrabold text-emerald-400">₹{p.amount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                              p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                              p.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {p.status === 'completed' ? 'approved' : p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(p.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {p.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleResolvePayout(p.walletId, p.transactionId, 'approve')}
                                    className="bg-emerald-600 text-white hover:bg-emerald-500 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                                  >
                                    Approve Transfer
                                  </button>
                                  <button
                                    onClick={() => handleResolvePayout(p.walletId, p.transactionId, 'reject')}
                                    className="bg-red-600 text-white hover:bg-red-500 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-500/20"
                                  >
                                    Reject & Refund
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500 font-bold uppercase italic bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">Processed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {payouts.filter((p) => payoutStatusFilter === 'all' || p.status === payoutStatusFilter).length === 0 && (
                <div className="p-20 text-center text-slate-500 font-medium">No payout requests found matching the filter.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <div key={r._id} className="glass-card flex flex-col justify-between gap-4 p-6 hover:border-slate-700 transition-colors">
                  <div>
                    {/* Header: Reviewer & Stars */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-bold">{r.reviewerId?.name || 'Anonymous User'}</h4>
                        <p className="text-xs text-slate-500">Reviewed Listing: <span className="text-blue-400 font-semibold">{r.listingId?.name || 'Deleted Listing'}</span></p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                        <Star className="text-amber-400 fill-amber-400" size={14} />
                        <span className="text-xs text-white font-bold">{r.rating}</span>
                      </div>
                    </div>
                    {/* Review text */}
                    <p className="text-xs text-slate-300 italic bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl mt-2 leading-relaxed">
                      "{r.reviewText || 'No comment provided'}"
                    </p>
                  </div>
                  {/* Bottom: Reviewee & Delete Button */}
                  <div className="flex justify-between items-center border-t border-slate-800/50 pt-3 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Reviewee: {r.revieweeId?.name || 'Local Expert'}
                    </span>
                    <button
                      onClick={() => handleDeleteReview(r._id)}
                      className="text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {reviews.length === 0 && (
              <div className="p-20 text-center text-slate-500 font-medium glass-card">No reviews found on the platform.</div>
            )}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 max-w-md">
              {['all', 'pending', 'verified', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setKycStatusFilter(status)}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs capitalize transition-all ${
                    kycStatusFilter === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kycPending
                .filter((u) => kycStatusFilter === 'all' || (u.kycDocument?.status || 'pending') === kycStatusFilter)
                .map((u) => (
                  <div key={u._id} className="glass-card flex flex-col justify-between gap-4 p-6 hover:border-slate-700 transition-colors">
                    <div>
                      {/* Header: Name & Role */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-bold text-lg">{u.name}</h4>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          <p className="text-xs text-slate-500">{u.phone}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400">
                            {u.kycDocument?.idType || 'ID Document'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            u.kycDocument?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                            u.kycDocument?.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {u.kycDocument?.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {u.kycDocument?.base64Data ? (
                        <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-950 mt-3" onClick={() => setSelectedKycImage({ name: u.name, base64: u.kycDocument.base64Data, idType: u.kycDocument.idType })}>
                          <img 
                            src={u.kycDocument.base64Data} 
                            className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" 
                            alt="KYC Document Preview" 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="bg-slate-950/80 border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Click to Enlarge</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-slate-900/50 border border-dashed border-slate-800 rounded-xl mt-3 text-slate-500 text-xs">
                          No image uploaded
                        </div>
                      )}

                      {/* Bank info linked to this provider */}
                      <div className="mt-4 bg-slate-950/30 border border-slate-800/80 p-3 rounded-xl">
                        <h5 className="text-xs font-bold text-slate-400 mb-2">Linked Bank Account</h5>
                        {u.bankDetails?.accountNumber || u.bankDetails?.upiId ? (
                          <div className="space-y-1 text-[11px]">
                            {u.bankDetails.upiId ? (
                              <p className="text-slate-300"><span className="text-slate-500">UPI:</span> <span className="font-mono font-bold text-indigo-400">{u.bankDetails.upiId}</span></p>
                            ) : null}
                            {u.bankDetails.accountNumber ? (
                              <>
                                <p className="text-slate-300"><span className="text-slate-500">Holder:</span> <span className="font-semibold">{u.bankDetails.accountHolderName}</span></p>
                                <p className="text-slate-300"><span className="text-slate-500">Account No:</span> <span className="font-mono text-slate-400">{u.bankDetails.accountNumber}</span></p>
                                <p className="text-slate-300"><span className="text-slate-500">IFSC:</span> <span className="font-mono text-emerald-400">{u.bankDetails.ifscCode}</span></p>
                              </>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">No bank account linked yet</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 border-t border-slate-800/50 pt-3 mt-2">
                      {u.kycDocument?.status !== 'verified' && (
                        <button
                          onClick={() => handleResolveKyc(u._id, 'approve')}
                          className="bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Approve KYC
                        </button>
                      )}
                      {u.kycDocument?.status !== 'rejected' && (
                        <button
                          onClick={() => handleResolveKyc(u._id, 'reject')}
                          className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-500/20"
                        >
                          {u.kycDocument?.status === 'verified' ? 'Revoke & Reject' : 'Reject KYC'}
                        </button>
                      )}
                    </div>
                  </div>
              ))}
            </div>
            {kycPending.filter((u) => kycStatusFilter === 'all' || (u.kycDocument?.status || 'pending') === kycStatusFilter).length === 0 && (
              <div className="p-20 text-center text-slate-500 font-medium glass-card">No KYC requests found matching the filter.</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-card max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Global Platform Configurations</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              const rate = e.target.commissionRate.value;
              const mode = e.target.maintenanceMode.checked;
              handleUpdateConfig(rate, mode);
            }} className="space-y-6">
              <div>
                <label className="block text-slate-400 font-medium mb-2">Platform Commission Cut (%)</label>
                <div className="relative">
                  <input
                    name="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={config.commissionRate}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">The percentage of each booking payout deducted by EverythingBooking.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-white font-bold">Maintenance Mode</label>
                  <p className="text-xs text-slate-500">Block all incoming requests and show offline message to clients.</p>
                </div>
                <input
                  name="maintenanceMode"
                  type="checkbox"
                  defaultChecked={config.maintenanceMode}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-500 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Save Configurations
              </button>
            </form>
          </div>
        )}

        {selectedDetailedBooking && (
          <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/20">
                <div>
                  <h3 className="text-lg font-bold text-white">Booking Details</h3>
                  <p className="text-xs text-slate-400 mt-1">ID: {selectedDetailedBooking._id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${selectedDetailedBooking.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                    selectedDetailedBooking.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                      selectedDetailedBooking.status === 'confirmed' ? 'bg-indigo-500/10 text-indigo-400' :
                        selectedDetailedBooking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                          selectedDetailedBooking.status === 'disputed' ? 'bg-amber-500/10 text-amber-400 animate-pulse border border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400'
                    }`}>
                    {selectedDetailedBooking.status}
                  </span>
                  <button
                    onClick={() => setSelectedDetailedBooking(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {/* Column 1: Parties */}
                <div className="space-y-6">
                  {/* Consumer Details */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">🧑‍💻 Consumer Profile</h4>
                    <p className="text-sm text-white font-bold">{selectedDetailedBooking.userId?.name || 'Anonymous User'}</p>
                    <p className="text-xs text-slate-400 mt-1">Email: {selectedDetailedBooking.userId?.email || 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-1">Phone: {selectedDetailedBooking.userId?.phone || 'N/A'}</p>
                  </div>

                  {/* Provider Details */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">🧑‍🔧 Service Provider</h4>
                    <p className="text-sm text-white font-bold">{selectedDetailedBooking.providerId?.name || 'Local Expert'}</p>
                    <p className="text-xs text-slate-400 mt-1">Email: {selectedDetailedBooking.providerId?.email || 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-1">Phone: {selectedDetailedBooking.providerId?.phone || 'N/A'}</p>
                  </div>

                  {/* Service Details */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">📋 Service Portfolio</h4>
                    <p className="text-sm text-white font-bold">{selectedDetailedBooking.listingId?.name || 'Deleted Service'}</p>
                    <p className="text-xs text-slate-400 mt-1">Category: {selectedDetailedBooking.listingId?.category || 'General'}</p>
                    <p className="text-xs text-white mt-1 font-bold">Standard Price: {selectedDetailedBooking.listingId?.price || 'N/A'}</p>
                  </div>
                </div>

                {/* Column 2: Status & Payment */}
                <div className="space-y-6">
                  {/* Schedule Details */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">📅 Schedule Information</h4>
                    <p className="text-sm text-white font-bold">Date: {selectedDetailedBooking.date}</p>
                    <p className="text-xs text-slate-400 mt-1">Time Window: {selectedDetailedBooking.startTime} - {selectedDetailedBooking.endTime}</p>
                    <p className="text-xs text-slate-400 mt-2 italic">Created At: {new Date(selectedDetailedBooking.createdAt).toLocaleString()}</p>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">💰 Escrow Payment Details</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Payment Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedDetailedBooking.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                        selectedDetailedBooking.paymentStatus === 'refunded' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                        {selectedDetailedBooking.paymentStatus}
                      </span>
                    </div>
                    {selectedDetailedBooking.razorpayOrderId && (
                      <p className="text-xs text-slate-500 mt-2 font-mono">Order ID: {selectedDetailedBooking.razorpayOrderId}</p>
                    )}
                    {selectedDetailedBooking.razorpayPaymentId && (
                      <p className="text-xs text-slate-500 mt-1 font-mono">Payment ID: {selectedDetailedBooking.razorpayPaymentId}</p>
                    )}
                  </div>

                  {/* Dual Verification Escrow */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl space-y-2.5">
                    <h4 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">🔑 Escrow Release Status</h4>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/50 pb-2">
                      <span>Groq AI Completion Image:</span>
                      <span className={selectedDetailedBooking.providerVerified ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                        {selectedDetailedBooking.providerVerified ? '✓ VERIFIED' : '○ PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/50 pb-2">
                      <span>Consumer Handshake:</span>
                      <span className={selectedDetailedBooking.consumerVerified ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                        {selectedDetailedBooking.consumerVerified ? '✓ VERIFIED' : '○ PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/50 pb-2">
                      <span>Secure Handshake OTP:</span>
                      <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded font-bold">
                        {selectedDetailedBooking.payoutOtp || 'NONE'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Escrow Released to Provider:</span>
                      <span className={selectedDetailedBooking.payoutReleased ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-500 font-bold'}>
                        {selectedDetailedBooking.payoutReleased ? '✓ RELEASED' : '○ LOCKED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Timeline Section */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-800/60 pt-6 mt-2">
                  <h4 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">⏱️ Booking Lifecycle & Audit Timeline</h4>
                  <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                    
                    {/* Step 1: Requested */}
                    <div className="relative">
                      <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold">✓</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Booking Initialized</h5>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(selectedDetailedBooking.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Consumer requested service booking with initial status set to pending.</p>
                      </div>
                    </div>

                    {/* Step 2: Provider Response */}
                    <div className="relative">
                      {selectedDetailedBooking.confirmedAt || selectedDetailedBooking.rejectedAt || selectedDetailedBooking.cancelledAt ? (
                        <>
                          <div className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedDetailedBooking.rejectedAt || selectedDetailedBooking.status === 'rejected' ? 'bg-red-500/10 border-2 border-red-500 text-red-400' :
                            selectedDetailedBooking.cancelledAt ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-400' :
                            'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400'
                          }`}>
                            {selectedDetailedBooking.rejectedAt || selectedDetailedBooking.status === 'rejected' || selectedDetailedBooking.cancelledAt ? '✗' : '✓'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                {selectedDetailedBooking.rejectedAt || selectedDetailedBooking.status === 'rejected' ? 'Request Rejected' :
                                 selectedDetailedBooking.cancelledAt ? 'Request Cancelled' : 'Request Confirmed'}
                              </h5>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(selectedDetailedBooking.confirmedAt || selectedDetailedBooking.rejectedAt || selectedDetailedBooking.cancelledAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedDetailedBooking.rejectedAt || selectedDetailedBooking.status === 'rejected' ? 'Provider rejected the booking request.' :
                               selectedDetailedBooking.cancelledAt ? 'Booking cancelled by consumer/admin.' :
                               'Provider accepted the booking request and locked the slot.'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">○</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Provider Acceptance</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">The provider has not yet accepted or rejected this request.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 3: Payment */}
                    <div className="relative">
                      {selectedDetailedBooking.paymentStatus === 'paid' || selectedDetailedBooking.paymentStatus === 'refunded' ? (
                        <>
                          <div className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedDetailedBooking.paymentStatus === 'refunded' ? 'bg-red-500/10 border-2 border-red-500 text-red-400' :
                            'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400'
                          }`}>
                            {selectedDetailedBooking.paymentStatus === 'refunded' ? '✗' : '✓'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                {selectedDetailedBooking.paymentStatus === 'refunded' ? 'Payment Refunded' : 'Payment Deposited'}
                              </h5>
                              {selectedDetailedBooking.paymentDoneAt && (
                                <span className="text-[10px] text-slate-500 font-mono">{new Date(selectedDetailedBooking.paymentDoneAt).toLocaleString()}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedDetailedBooking.paymentStatus === 'refunded' ? 
                                `Escrow payment of ₹${selectedDetailedBooking.amountPaid || '...'} was refunded to the consumer.` : 
                                `Escrow payment of ₹${selectedDetailedBooking.amountPaid || '...'} deposited successfully via Razorpay.`}
                            </p>
                            {selectedDetailedBooking.razorpayPaymentId && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Transaction ID: {selectedDetailedBooking.razorpayPaymentId}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">○</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Payment Deposit</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Consumer must complete the payment to hold and verify this booking slot.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 4: Verification */}
                    <div className="relative">
                      {selectedDetailedBooking.providerVerified || selectedDetailedBooking.consumerVerified || selectedDetailedBooking.status === 'disputed' ? (
                        <>
                          <div className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedDetailedBooking.status === 'disputed' ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-400' :
                            selectedDetailedBooking.providerVerified && selectedDetailedBooking.consumerVerified ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400' :
                            'bg-blue-500/10 border-2 border-blue-500 text-blue-400'
                          }`}>
                            {selectedDetailedBooking.status === 'disputed' ? '!' : 
                             selectedDetailedBooking.providerVerified && selectedDetailedBooking.consumerVerified ? '✓' : '○'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                {selectedDetailedBooking.status === 'disputed' ? 'Dispute Raised' : 'Completion Handshake'}
                              </h5>
                              {selectedDetailedBooking.disputedAt && selectedDetailedBooking.status === 'disputed' && (
                                <span className="text-[10px] text-slate-500 font-mono">{new Date(selectedDetailedBooking.disputedAt).toLocaleString()}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 space-y-1">
                              {selectedDetailedBooking.status === 'disputed' ? (
                                <>
                                  <p className="text-amber-400 font-semibold">⚠️ Provider raised an escrow dispute. Awaiting admin intervention.</p>
                                  {selectedDetailedBooking.disputeReason && (
                                    <div className="mt-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-xs text-amber-300 font-medium">
                                      <span className="font-bold block mb-1">Reason provided by Provider:</span>
                                      "{selectedDetailedBooking.disputeReason}"
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p>AI image check: <span className={selectedDetailedBooking.providerVerified ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{selectedDetailedBooking.providerVerified ? '✓ Verified' : '○ Pending'}</span></p>
                                  <p>Consumer handshake: <span className={selectedDetailedBooking.consumerVerified ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{selectedDetailedBooking.consumerVerified ? '✓ Verified' : '○ Pending'}</span></p>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">○</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Verification Pending</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Waiting for provider's completion photo and consumer's OTP validation.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 5: Funds Released */}
                    <div className="relative">
                      {selectedDetailedBooking.payoutReleased || selectedDetailedBooking.status === 'verified' || selectedDetailedBooking.status === 'cancelled' ? (
                        <>
                          <div className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedDetailedBooking.status === 'cancelled' ? 'bg-red-500/10 border-2 border-red-500 text-red-400' :
                            'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400'
                          }`}>
                            {selectedDetailedBooking.status === 'cancelled' ? '✗' : '✓'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                {selectedDetailedBooking.status === 'cancelled' ? 'Escrow Cancelled' : 'Payout Settlement'}
                              </h5>
                              {selectedDetailedBooking.completedAt && (
                                <span className="text-[10px] text-slate-500 font-mono">{new Date(selectedDetailedBooking.completedAt).toLocaleString()}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedDetailedBooking.status === 'cancelled' ? 
                                'Escrow terminated. Funds are not released to provider.' : 
                                'Funds released successfully. Platforms commission deducted and net earnings transferred.'}
                            </p>
                            
                            {/* Fee breakdown details */}
                            {selectedDetailedBooking.amountPaid > 0 && !selectedDetailedBooking.cancelledAt && (
                              <div className="mt-3 bg-slate-950/40 border border-slate-800 p-3 rounded-xl max-w-md text-xs space-y-1.5 font-medium">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Total Booking Price:</span>
                                  <span className="text-white">₹{selectedDetailedBooking.amountPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-1.5">
                                  <span>Platform Fee ({config?.commissionRate || 10}%):</span>
                                  <span className="text-red-400">- ₹{(selectedDetailedBooking.amountPaid * (config?.commissionRate || 10) / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm pt-0.5">
                                  <span className="text-emerald-400">Net Provider Earnings:</span>
                                  <span className="text-emerald-400">₹{(selectedDetailedBooking.amountPaid - (selectedDetailedBooking.amountPaid * (config?.commissionRate || 10) / 100)).toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">○</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payout Locked in Escrow</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Payout will be automatically released when verification requirements are satisfied.</p>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-[#1e293b]/20 flex justify-between items-center">
                <div className="flex gap-2">
                  {['pending', 'confirmed', 'completed', 'disputed'].includes(selectedDetailedBooking.status) && (
                    <>
                      <button
                        onClick={() => {
                          handleResolveBooking(selectedDetailedBooking._id, 'complete');
                          setSelectedDetailedBooking(null);
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Force Release Escrow
                      </button>
                      <button
                        onClick={() => {
                          handleResolveBooking(selectedDetailedBooking._id, 'cancel');
                          setSelectedDetailedBooking(null);
                        }}
                        className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-500/20"
                      >
                        Cancel & Refund
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDetailedBooking(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold text-xs border border-slate-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedKycImage && (
          <div className="fixed inset-0 z-50 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedKycImage(null)}>
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/20">
                <div>
                  <h3 className="text-lg font-bold text-white">KYC Document: {selectedKycImage.idType}</h3>
                  <p className="text-xs text-slate-400 mt-1">Provider: {selectedKycImage.name}</p>
                </div>
                <button
                  onClick={() => setSelectedKycImage(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-slate-950">
                <img 
                  src={selectedKycImage.base64} 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl" 
                  alt="KYC Zoomed Document" 
                />
              </div>
              <div className="px-6 py-4 border-t border-slate-800 bg-[#1e293b]/20 flex justify-end">
                <button
                  onClick={() => setSelectedKycImage(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold text-xs border border-slate-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
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
