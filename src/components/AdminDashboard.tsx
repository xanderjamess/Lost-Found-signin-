import React from 'react';
import { Item, User, Claim, Notification } from '../types';
import Sidebar from './Sidebar';
import ClaimedItemsHistory from './ClaimedItemsHistory';
import ClaimVerificationModal from './ClaimVerificationModal';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Users, Package, ShieldAlert, CheckCircle, XCircle, ArrowUpRight, Search, LayoutDashboard, AlertCircle, Settings, FileText, Zap, Clock, Check, X, Download, Copy, RefreshCw, Bell, UserPlus, UserMinus, Shield, UserCheck, Trash2, MoreVertical, LogOut, Menu } from 'lucide-react';
import { analyzeReportWithAI } from '../services/aiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AdminDashboardProps {
  user: User;
  items: Item[];
  users: User[];
  claims: Claim[];
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onNotificationClick: (notification: Notification) => void;
  onLogout: () => void;
  onUpdateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string) => void;
  onViewItem: (item: Item) => void;
  onUpdateUser?: (id: string, updates: Partial<User>) => void;
  onDeleteUser?: (id: string) => void;
  initialTab?: string;
}

export default function AdminDashboard({ 
  user, 
  items, 
  users, 
  claims, 
  notifications,
  onMarkAsRead,
  onClearAllNotifications,
  onNotificationClick,
  onLogout, 
  onUpdateItem, 
  onApproveClaim, 
  onRejectClaim, 
  onViewItem, 
  onUpdateUser,
  onDeleteUser,
  initialTab
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = React.useState(initialTab || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [filterQuery, setFilterQuery] = React.useState('');
  const [userFilterQuery, setUserFilterQuery] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [analyzingId, setAnalyzingId] = React.useState<string | null>(null);
  const [verificationItem, setVerificationItem] = React.useState<Item | null>(null);
  const [settingsTab, setSettingsTab] = React.useState('profile');
  
  // System Settings State
  const [categories, setCategories] = React.useState(['Electronics', 'Personal Items', 'Accessories', 'Books', 'Clothing', 'Others']);
  const [locations, setLocations] = React.useState(['Main Library', 'Student Union Cafe', 'Gym', 'Science Building', 'Outdoor Track', 'Dormitory A', 'Dormitory B']);
  const [retentionDays, setRetentionDays] = React.useState(90);
  const [newCategory, setNewCategory] = React.useState('');
  const [newLocation, setNewLocation] = React.useState('');
  const [allowPublicReports, setAllowPublicReports] = React.useState(true);
  const [autoMatchEnabled, setAutoMatchEnabled] = React.useState(true);
  const [require2FA, setRequire2FA] = React.useState(true);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleAddLocation = () => {
    if (newLocation && !locations.includes(newLocation)) {
      setLocations([...locations, newLocation]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(locations.filter(l => l !== loc));
  };

  const handleAnalyze = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    setAnalyzingId(id);
    try {
      const result = await analyzeReportWithAI(item, items);
      setAnalysisResult({ ...result, itemId: id });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const reportsToApprove = items.filter(i => i.status === 'pending');
  const pendingItems = items.filter(i => i.status === 'found' || i.status === 'under-review');
  const lostItems = items.filter(i => i.status === 'lost');
  const foundItems = items.filter(i => i.status === 'found');
  const pendingClaims = claims.filter(c => c.status === 'pending');
  const claimedCount = items.filter(i => i.status === 'claimed').length;
  const recoveryStat = items.length > 0 ? Math.round((claimedCount / items.length) * 100) : 0;

  const adminGroups = [
    {
      title: 'Dashboard',
      tabs: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Management',
      tabs: [
        { id: 'pending-reports', label: 'Pending Approval', icon: Clock, count: reportsToApprove.length },
        { id: 'all-items', label: 'All Reports', icon: FileText },
        { id: 'claims', label: 'Claims Management', icon: ShieldAlert },
        { id: 'claimed-history', label: 'Claimed Items', icon: CheckCircle },
      ]
    },
    {
      title: 'Reports',
      tabs: [
        { id: 'lost', label: 'Lost Reports', icon: AlertCircle },
        { id: 'found', label: 'Found Reports', icon: Package },
      ]
    },
    {
      title: 'System',
      tabs: [
        { id: 'notifications', label: 'System Alerts', icon: Bell },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ]
    }
  ];

  const stats = [
    { label: 'Total Reports', value: items.length, icon: <Package className="text-primary" size={20} />, trend: '+12%' },
    { label: 'Pending Approval', value: reportsToApprove.length, icon: <Clock className="text-amber-500" size={20} />, trend: reportsToApprove.length > 0 ? `+${reportsToApprove.length}` : '0' },
    { label: 'Pending Claims', value: pendingClaims.length, icon: <ShieldAlert className="text-red-500" size={20} />, trend: '+3' },
    { label: 'Recovery Rate', value: `${recoveryStat}%`, icon: <CheckCircle className="text-accent" size={20} />, trend: '+2.4%' },
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userFilterQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userFilterQuery.toLowerCase())
  );

  // Analytics Data
  const itemsByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const itemsByStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const monthlyTrends = React.useMemo(() => {
    // Mocking some monthly data based on current items
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      lost: Math.floor(Math.random() * 20) + 5,
      found: Math.floor(Math.random() * 25) + 10,
    }));
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark">User Management</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            value={userFilterQuery}
            onChange={(e) => setUserFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reports</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredUsers.map(u => {
                const userReports = items.filter(i => i.reporterId === u.id).length;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-100" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-bold text-neutral-dark">{u.name}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Package size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{userReports}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {onUpdateUser && (
                          <button 
                            onClick={() => onUpdateUser(u.id, { role: u.role === 'admin' ? 'student' : 'admin' })}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title={u.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                          >
                            <Shield size={18} />
                          </button>
                        )}
                        {onDeleteUser && (
                          <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Deactivate User"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark">System Analytics</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Last 30 Days</button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Reports by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemsByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Monthly Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20 }} />
                <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="found" stroke="#0047AB" strokeWidth={3} dot={{ r: 4, fill: '#0047AB' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Item Status Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={itemsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {itemsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 bg-primary text-white flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Efficiency Report</h3>
            <p className="text-white/70 text-sm">Your campus lost and found system is performing 24% better than last semester.</p>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>Average Return Time</span>
                <span>3.2 Days</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent w-[85%] h-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>User Satisfaction</span>
                <span>4.8 / 5.0</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-400 w-[96%] h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = (itemsToDisplay: Item[]) => {
    const sortedItems = [...itemsToDisplay].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Item];
      const bValue = b[sortConfig.key as keyof Item];
      
      if (!aValue || !bValue) return 0;
      
      if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    const handleSort = (key: string) => {
      setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
      }));
    };

    return (
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-neutral-dark">Report Management</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sort by Date Reported:</span>
              <button 
                onClick={() => handleSort('createdAt')}
                className={`p-2 rounded-lg transition-all flex items-center space-x-1 ${sortConfig.key === 'createdAt' ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                <Clock size={16} />
                {sortConfig.key === 'createdAt' && (
                  <ArrowUpRight size={12} className={`transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                )}
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                placeholder="Search reports..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Possession</th>
                <th className="px-6 py-4">Location</th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    <span>Date Reported</span>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RefreshCw size={10} className={sortConfig.key === 'createdAt' ? 'text-primary' : ''} />
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedItems.map(item => {
              const reporter = users.find(u => u.id === item.reporterId);
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg mr-3 object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-sm font-bold text-neutral-dark">{item.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {reporter ? (
                        <>
                          <img src={reporter.avatar} alt="" className="w-6 h-6 rounded-full mr-2 object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-xs font-bold text-neutral-dark">{reporter.name}</p>
                            <p className="text-[10px] text-gray-400">{reporter.email}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Unknown Reporter</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${
                      item.status === 'found' ? 'bg-primary/10 text-primary' : 
                      item.status === 'lost' ? 'bg-red-100 text-red-700' : 
                      item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'declined' ? 'bg-gray-200 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.type === 'found' ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        item.currentPossession === 'csc-office' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {item.currentPossession === 'csc-office' ? 'CSC Office' : 'With Finder'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.createdAt || item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {activeTab === 'pending-reports' && item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => onUpdateItem(item.id, { status: item.type === 'found' ? 'found' : 'lost' })}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Report"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => onUpdateItem(item.id, { status: 'declined' })}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Report"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {item.type === 'found' && (
                        <button 
                          onClick={() => onUpdateItem(item.id, { 
                            currentPossession: item.currentPossession === 'reporter' ? 'csc-office' : 'reporter' 
                          })}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Toggle Possession"
                        >
                          <AlertCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleAnalyze(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${analyzingId === item.id ? 'text-primary animate-pulse' : 'text-accent hover:bg-accent/10'}`}
                        title="AI Analyze"
                        disabled={analyzingId === item.id}
                      >
                        <Zap size={18} />
                      </button>
                      <button 
                        onClick={() => onViewItem(item)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-neutral-dark">Recent Activity</h2>
                  <button onClick={() => setActiveTab('all-items')} className="text-primary text-sm font-bold hover:underline">View All</button>
                </div>
                {renderTable(items.slice(0, 5))}
              </div>

              <div className="space-y-8">
                {notifications.some(n => n.type === 'match') && (
                  <section className="glass-card p-6">
                    <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                      <Zap className="mr-2 text-primary" size={20} />
                      AI Match Review
                    </h2>
                    <div className="space-y-4">
                      {notifications.filter(n => n.type === 'match').map(matchNotif => (
                        <div key={matchNotif.id} className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">High Confidence (94%)</span>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(matchNotif.date).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm font-bold text-neutral-dark mb-1">Potential Match</p>
                          <p className="text-xs text-gray-500 mb-4">{matchNotif.message}</p>
                          <div className="flex space-x-2">
                            {matchNotif.itemId && (
                              <button 
                                onClick={() => {
                                  const item = items.find(i => i.id === matchNotif.itemId);
                                  if (item) onViewItem(item);
                                }}
                                className="flex-grow btn-primary text-[10px] py-2"
                              >
                                View Match
                              </button>
                            )}
                            <button 
                              onClick={() => onMarkAsRead(matchNotif.id)}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-50 uppercase tracking-wider"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab('notifications')} className="w-full py-2 text-sm text-primary font-bold hover:underline">View all AI suggestions</button>
                    </div>
                  </section>
                )}

                <section className="glass-card p-6 bg-neutral-dark text-white">
                  <h2 className="text-lg font-bold mb-4 flex items-center">
                    <ShieldAlert className="mr-2 text-red-400" size={20} />
                    Security Panel
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium uppercase tracking-wider">2FA Enforcement</span>
                      <span className="text-primary font-bold">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium uppercase tracking-wider">Fraud Detection</span>
                      <span className="text-primary font-bold">MONITORING</span>
                    </div>
                  </div>
                  <button className="w-full bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                    View Security Logs
                  </button>
                </section>
              </div>
            </div>
          </div>
        );
      case 'pending-reports':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-neutral-dark">Pending Reports</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {reportsToApprove.length} Awaiting Review
              </span>
            </div>
            {renderTable(reportsToApprove)}
          </div>
        );
      case 'all-items':
        return renderTable(filteredItems);
      case 'claims':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-dark">Claims Management</h2>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Item & Ref ID</th>
                      <th className="px-6 py-4">Claimer</th>
                      <th className="px-6 py-4">Verif. ID</th>
                      <th className="px-6 py-4">Proof</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {claims.map(claim => {
                      const item = items.find(i => i.id === claim.itemId);
                      const claimer = users.find(u => u.id === claim.userId);
                      return (
                        <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img src={item?.imageUrl} alt="" className="w-10 h-10 rounded-lg mr-3 object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-sm font-bold text-neutral-dark">{item?.title}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Ref: {item?.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img src={claimer?.avatar} alt="" className="w-8 h-8 rounded-full mr-2 object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-sm font-bold text-neutral-dark">{claimer?.name}</p>
                                <p className="text-[10px] text-gray-400">{claimer?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded inline-block">{claim.verificationId}</p>
                          </td>
                          <td className="px-6 py-4">
                            {claim.proofImageUrl ? (
                              <div className="group relative">
                                <img 
                                  src={claim.proofImageUrl} 
                                  alt="Proof" 
                                  className="w-10 h-10 rounded-lg object-cover cursor-zoom-in border border-gray-100"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-48 h-48 rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                                  <img src={claim.proofImageUrl} alt="Proof Large" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic">No proof</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">{new Date(claim.date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                              claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {claim.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => onApproveClaim(claim.id)}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  title="Approve Claim"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => onRejectClaim(claim.id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Reject Claim"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => item && onViewItem(item)}
                                className="text-primary font-bold text-xs hover:underline"
                              >
                                View Item
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {claims.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                          No claims found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'lost':
        return renderTable(items.filter(i => i.status === 'lost'));
      case 'found':
        return renderTable(items.filter(i => i.status === 'found'));
      case 'claimed-history':
        return (
          <ClaimedItemsHistory 
            items={items} 
            users={users} 
            claims={claims}
            onUpdateItem={onUpdateItem}
            onViewItem={(item) => setVerificationItem(item)}
          />
        );
      case 'users':
        return renderUsers();
      case 'notifications':
        return (
          <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-dark">System Alerts</h2>
              {notifications.length > 0 && (
                <button 
                  onClick={onClearAllNotifications}
                  className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      onNotificationClick(notif);
                    }}
                    className={`p-6 rounded-2xl border transition-all flex items-start space-x-4 cursor-pointer hover:shadow-md ${notif.read ? 'bg-white border-gray-100 opacity-70' : 'bg-primary/5 border-primary/10 shadow-sm'}`}
                  >
                    <div className={`p-2 rounded-lg ${notif.type === 'match' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {notif.type === 'match' ? <Zap size={20} /> : <Bell size={20} />}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-neutral-dark mb-1 ${notif.read ? 'font-medium' : 'font-bold'}`}>{notif.message}</p>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{new Date(notif.date).toLocaleString()}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 glass-card bg-white/50">
                  <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400">No new alerts.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Sidebar */}
            <div className="w-full lg:w-64 space-y-1">
              {[
                { id: 'profile', label: 'Admin Profile', icon: Shield },
                { id: 'system', label: 'System Config', icon: Settings },
                { id: 'categories', label: 'Item Categories', icon: Package },
                { id: 'locations', label: 'Campus Locations', icon: AlertCircle },
                { id: 'security', label: 'Security & Auth', icon: ShieldAlert },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative ${
                    settingsTab === tab.id 
                      ? 'bg-primary/5 text-primary' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {settingsTab === tab.id && (
                    <motion.div
                      layoutId="activeSettingsTab"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    />
                  )}
                  <tab.icon size={18} className={settingsTab === tab.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span>{tab.label}</span>
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={onLogout}
                  className="group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={18} className="text-red-400 group-hover:text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-grow max-w-3xl">
              <AnimatePresence mode="wait">
                {settingsTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-8 bg-white">
                      <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                        <Shield className="mr-2 text-primary" size={20} />
                        Admin Profile Settings
                      </h2>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-gray-50 shadow-sm" referrerPolicy="no-referrer" />
                          <div>
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Change Avatar</button>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-medium">JPG, PNG or GIF. Max 2MB.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                            <input type="text" defaultValue={user.name} className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                            <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed" />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-50">
                          <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Save Profile</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'system' && (
                  <motion.div
                    key="system"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-8 bg-white">
                      <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                        <Settings className="mr-2 text-primary" size={20} />
                        System Configuration
                      </h2>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-neutral-dark">Public Reporting</p>
                              <p className="text-xs text-gray-400">Allow unauthenticated users to report found items.</p>
                            </div>
                            <button 
                              onClick={() => setAllowPublicReports(!allowPublicReports)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowPublicReports ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${allowPublicReports ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-neutral-dark">Auto-Match Processing</p>
                              <p className="text-xs text-gray-400">Automatically run AI matching when new items are reported.</p>
                            </div>
                            <button 
                              onClick={() => setAutoMatchEnabled(!autoMatchEnabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoMatchEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${autoMatchEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Retention Period (Days)</label>
                          <div className="flex items-center space-x-4">
                            <input 
                              type="range" 
                              min="30" 
                              max="365" 
                              step="30"
                              value={retentionDays}
                              onChange={(e) => setRetentionDays(Number(e.target.value))}
                              className="flex-grow h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-sm font-bold text-primary w-16 text-right">{retentionDays} Days</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Items older than this will be automatically archived.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                          <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Save Configuration</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'categories' && (
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-8 bg-white">
                      <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                        <Package className="mr-2 text-primary" size={20} />
                        Item Categories
                      </h2>
                      <div className="space-y-6">
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            placeholder="Add new category..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="flex-grow px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                          />
                          <button 
                            onClick={handleAddCategory}
                            className="btn-primary px-6 py-3 rounded-xl"
                          >
                            <UserPlus size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                              <span className="text-sm font-bold text-slate-700">{cat}</span>
                              <button 
                                onClick={() => handleRemoveCategory(cat)}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'locations' && (
                  <motion.div
                    key="locations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-8 bg-white">
                      <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                        <AlertCircle className="mr-2 text-primary" size={20} />
                        Campus Locations
                      </h2>
                      <div className="space-y-6">
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            placeholder="Add new location..."
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            className="flex-grow px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                          />
                          <button 
                            onClick={handleAddLocation}
                            className="btn-primary px-6 py-3 rounded-xl"
                          >
                            <UserPlus size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {locations.map(loc => (
                            <div key={loc} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-sm font-bold text-slate-700">{loc}</span>
                              <button 
                                onClick={() => handleRemoveLocation(loc)}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-8 bg-white">
                      <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                        <ShieldAlert className="mr-2 text-red-500" size={20} />
                        Security & Authentication
                      </h2>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-neutral-dark">Enforce 2FA for Claims</p>
                              <p className="text-xs text-gray-400">Require students to verify identity via email/SMS before claiming items.</p>
                            </div>
                            <button 
                              onClick={() => setRequire2FA(!require2FA)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${require2FA ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${require2FA ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-neutral-dark">Admin Session Timeout</p>
                              <p className="text-xs text-gray-400">Automatically logout admins after 30 minutes of inactivity.</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary cursor-pointer">
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Danger Zone</h4>
                          <button className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
                            Purge Archived Data
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50/50">
      <Sidebar 
        groups={adminGroups} 
        activeTab={activeTab} 
        onTabChange={(id) => {
          setActiveTab(id);
          setIsSidebarOpen(false);
        }} 
        userName={user.name}
        userEmail={user.email}
        userRole="Administrator"
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Analysis Result Modal */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary text-white">
                    <div className="flex items-center">
                      <Zap className="mr-2 text-accent" size={20} />
                      <h3 className="font-bold">AI Report Analysis</h3>
                    </div>
                    <button onClick={() => setAnalysisResult(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <XCircle size={24} />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-neutral-dark">Confidence Score</span>
                        <span className="text-2xl font-bold text-accent">{analysisResult.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent h-full transition-all duration-1000" 
                          style={{ width: `${analysisResult.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Summary</h4>
                      <p className="text-sm text-neutral-dark leading-relaxed">{analysisResult.summary}</p>
                    </div>

                    {analysisResult.potentialMatches?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Potential Matches</h4>
                        <div className="space-y-2">
                          {analysisResult.potentialMatches.map((match: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-sm font-bold text-neutral-dark">{match.title}</p>
                              <p className="text-xs text-gray-500">{match.matchReason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Recommendation</h4>
                      <p className="text-sm text-blue-800">{analysisResult.recommendation}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex space-x-3">
                    <button 
                      onClick={() => {
                        onUpdateItem(analysisResult.itemId, { status: 'found' });
                        setAnalysisResult(null);
                      }}
                      className="flex-grow btn-accent py-2.5"
                    >
                      Confirm & Accept
                    </button>
                    <button 
                      onClick={() => setAnalysisResult(null)}
                      className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold hover:bg-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex justify-between items-start w-full">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
                  {adminGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {activeTab === 'overview' 
                    ? 'System overview and item management.' 
                    : `Managing ${activeTab} and system data.`}
                </p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {/* Claim Verification Modal */}
      {verificationItem && (
        <ClaimVerificationModal
          item={verificationItem}
          users={users}
          claims={claims}
          isOpen={!!verificationItem}
          onClose={() => setVerificationItem(null)}
        />
      )}
    </div>
  );
}
