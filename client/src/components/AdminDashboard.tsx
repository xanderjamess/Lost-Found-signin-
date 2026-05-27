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
  onNotifyPotentialMatch: (foundItemId: string, lostItemId: string) => Promise<void> | void;
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
  onNotifyPotentialMatch,
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
  const [matchModalItem, setMatchModalItem] = React.useState<Item | null>(null);
  
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
    // Deterministic monthly aggregation (last 6 months) from item dates
    const now = new Date();
    const monthStarts = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return d;
    });

    const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

    const initial = monthStarts.map((d) => ({
      name: d.toLocaleDateString(undefined, { month: 'short' }),
      key: keyFor(d),
      lost: 0,
      found: 0,
    }));

    const indexByKey = new Map(initial.map((m) => [m.key, m]));

    for (const item of items) {
      const raw = item.createdAt || item.date;
      if (!raw) continue;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) continue;

      // Only count already-approved items
      if (item.status === 'pending' || item.status === 'declined') continue;

      const slot = indexByKey.get(keyFor(new Date(dt.getFullYear(), dt.getMonth(), 1)));
      if (!slot) continue;

      if (item.type === 'lost') slot.lost += 1;
      if (item.type === 'found') slot.found += 1;
    }

    return initial.map(({ name, lost, found }) => ({ name, lost, found }));
  }, [items]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-fg">User Management</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search users..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            value={userFilterQuery}
            onChange={(e) => setUserFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-raised text-[10px] font-bold text-muted  ">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reports</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-surface">
              {filteredUsers.map(u => {
                const userReports = items.filter(i => i.reporterId === u.id).length;
                return (
                  <tr key={u.id} className="hover:bg-surface-raised transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={u.avatar}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-full mr-3 object-cover border ring-border"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-bold text-fg">{u.name}</p>
                          <p className="text-[10px] text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold  tracking-wider ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-raised text-muted border ring-border'
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
                        <Package size={14} className="text-muted" />
                        <span className="text-xs font-bold text-fg">{userReports}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {onUpdateUser && (
                          <button 
                            onClick={() => onUpdateUser(u.id, { role: u.role === 'admin' ? 'student' : 'admin' })}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title={u.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                          >
                            <Shield size={18} />
                          </button>
                        )}
                        {onDeleteUser && (
                          <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Deactivate User"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                        <button className="p-2 text-muted hover:text-muted hover:bg-surface-raised rounded-lg transition-all">
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
        <h2 className="text-2xl font-bold text-fg">System Analytics</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-surface border ring-border rounded-xl text-xs font-bold text-muted hover:bg-bg transition-all">Last 30 Days</button>
          <button className="px-4 py-2 bg-primary text-primary-fg rounded-xl text-xs font-bold  shadow-primary/20">Export Report</button>
        </div>
      </div>

      {/* Live-ish insights from current Firestore data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-[10px] font-bold text-muted mb-2">Approved Lost Reports</p>
          <p className="text-2xl font-bold text-fg">
            {items.filter((i) => i.type === 'lost' && i.status === 'lost').length}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-[10px] font-bold text-muted mb-2">Approved Found Reports</p>
          <p className="text-2xl font-bold text-fg">
            {items.filter(
              (i) => i.type === 'found' && (i.status === 'found' || i.status === 'claimed' || i.status === 'under-review')
            ).length}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-[10px] font-bold text-muted mb-2">Most Reported Category</p>
          <p className="text-lg font-bold text-fg">
            {[...itemsByCategory].sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
          </p>
          <p className="text-[10px] text-muted mt-1">
            {[...itemsByCategory].sort((a, b) => b.value - a.value)[0]?.value || 0} total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-muted   mb-6">Reports by Category</h3>
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

        <div className="card p-6">
          <h3 className="text-sm font-bold text-muted   mb-6">Monthly Trends</h3>
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

        <div className="card p-6">
          <h3 className="text-sm font-bold text-muted   mb-6">Item Status Distribution</h3>
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

        <div className="card p-8 bg-primary text-primary-fg flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Efficiency Report</h3>
            <p className="text-primary-fg/70 text-sm">Your campus lost and found system is performing 24% better than last semester.</p>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold  tracking-wider mb-2">
                <span>Average Return Time</span>
                <span>3.2 Days</span>
              </div>
              <div className="w-full bg-surface/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent w-[85%] h-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold  tracking-wider mb-2">
                <span>User Satisfaction</span>
                <span>4.8 / 5.0</span>
              </div>
              <div className="w-full bg-surface/10 h-1.5 rounded-full overflow-hidden">
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

    const handleApproveReport = async (item: Item) => {
      await onUpdateItem(item.id, { status: item.type === 'found' ? 'found' : 'lost' });
      if (item.type === 'found') {
        setMatchModalItem(item);
      }
    };

    return (
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-surface">
          <h2 className="text-xl font-bold text-fg">Report Management</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-muted  ">Sort by Date Reported:</span>
              <button 
                onClick={() => handleSort('createdAt')}
                className={`p-2 rounded-lg transition-all flex items-center space-x-1 ${sortConfig.key === 'createdAt' ? 'bg-primary/10 text-primary' : 'bg-surface-raised text-muted hover:bg-surface-raised'}`}
              >
                <Clock size={16} />
                {sortConfig.key === 'createdAt' && (
                  <ArrowUpRight size={12} className={`transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                )}
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                className="pl-9 pr-4 py-2 text-sm rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                placeholder="Search reports..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-raised text-[10px] font-bold text-muted  ">
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
            <tbody className="divide-y divide-slate-200/40 bg-surface">
                      {sortedItems.map(item => {
              const reporter = users.find(u => u.id === item.reporterId);
              return (
                <tr key={item.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-lg mr-3 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-sm font-bold text-fg">{item.title}</p>
                        <p className="text-[10px] text-muted  font-medium tracking-wider">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {reporter ? (
                        <>
                          <img
                            src={reporter.avatar}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs font-bold text-fg">{reporter.name}</p>
                            <p className="text-[10px] text-muted">{reporter.email}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted italic">Unknown Reporter</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`status-badge whitespace-nowrap inline-flex items-center ${
                        item.status === 'found'
                          ? 'bg-primary/10 text-primary'
                          : item.status === 'lost'
                            ? 'bg-red-500/15 text-red-300'
                            : item.status === 'claimed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : item.status === 'under-review'
                                ? 'bg-blue-500/15 text-blue-300'
                                : item.status === 'pending'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : item.status === 'declined'
                                    ? 'bg-surface-raised text-muted border border-slate-200/10'
                                    : 'bg-blue-500/15 text-blue-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.type === 'found' ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full tracking-wider whitespace-nowrap inline-flex items-center justify-center ${
                          item.currentPossession === 'csc-office'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                            : 'bg-surface-raised text-muted border border-slate-200/10'
                        }`}
                      >
                        {item.currentPossession === 'csc-office' ? 'CSC Office' : 'With Finder'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{item.location}</td>
                  <td className="px-6 py-4 text-sm text-muted">{new Date(item.createdAt || item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {activeTab === 'pending-reports' && item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveReport(item)}
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
                        className="p-1.5 text-muted hover:bg-surface-raised rounded-lg transition-colors" 
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
                  className="card p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-surface-raised rounded-lg">{stat.icon}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded  tracking-wider ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-muted   mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-fg">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-fg">Recent Activity</h2>
                  <button onClick={() => setActiveTab('all-items')} className="text-primary text-sm font-bold hover:underline">View All</button>
                </div>
                {renderTable(items.slice(0, 5))}
              </div>

              <div className="space-y-8">
                {notifications.some(n => n.type === 'match') && (
                  <section className="card p-6">
                    <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
                      <Zap className="mr-2 text-primary" size={20} />
                      AI Match Review
                    </h2>
                    <div className="space-y-4">
                      {notifications.filter(n => n.type === 'match').map(matchNotif => (
                        <div key={matchNotif.id} className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-primary  tracking-wider">High Confidence (94%)</span>
                            <span className="text-[10px] text-muted font-medium">{new Date(matchNotif.date).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm font-bold text-fg mb-1">Potential Match</p>
                          <p className="text-xs text-muted mb-4">{matchNotif.message}</p>
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
                              className="px-3 py-2 border ring-border rounded-lg text-[10px] font-bold text-muted hover:bg-surface-raised  tracking-wider"
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

                <section className="card p-6 bg-neutral-dark text-primary-fg">
                  <h2 className="text-lg font-bold mb-4 flex items-center">
                    <ShieldAlert className="mr-2 text-red-400" size={20} />
                    Security Panel
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted font-medium  tracking-wider">2FA Enforcement</span>
                      <span className="text-primary font-bold">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted font-medium  tracking-wider">Fraud Detection</span>
                      <span className="text-primary font-bold">MONITORING</span>
                    </div>
                  </div>
                  <button className="w-full bg-surface/10 text-primary-fg font-bold py-3 rounded-xl flex items-center justify-center hover:bg-surface/20 transition-colors">
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
              <h2 className="text-2xl font-bold text-fg">Pending Reports</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold  ">
                {reportsToApprove.length} Awaiting Review
              </span>
            </div>
            {renderTable(reportsToApprove)}
          </div>
        );
      case 'all-items':
        return renderTable(filteredItems);
      case 'analytics':
        return renderAnalytics();
      case 'claims':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-fg">Claims Management</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-raised text-[10px] font-bold text-muted  ">
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
                  <tbody className="divide-y divide-slate-200/40 bg-surface">
                    {claims.map(claim => {
                      const item = items.find(i => i.id === claim.itemId);
                      const claimer = users.find(u => u.id === claim.userId);
                      return (
                        <tr key={claim.id} className="hover:bg-surface-raised transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img src={item?.imageUrl} alt="" className="w-10 h-10 rounded-lg mr-3 object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-sm font-bold text-fg">{item?.title}</p>
                                <p className="text-[10px] text-muted   font-mono">Ref: {item?.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img
                                src={claimer?.avatar}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-8 h-8 rounded-full mr-2 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="text-sm font-bold text-fg">{claimer?.name}</p>
                                <p className="text-[10px] text-muted">{claimer?.email}</p>
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
                                  className="w-10 h-10 rounded-lg object-cover cursor-zoom-in border ring-border"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-48 h-48 rounded-xl overflow-hidden  border-4 border-primary-fg">
                                  <img src={claim.proofImageUrl} alt="Proof Large" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic">No proof</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-muted">{new Date(claim.date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold   ${
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
                        <td colSpan={6} className="px-6 py-20 text-center text-muted italic">
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
              <h2 className="text-2xl font-bold text-fg">System Alerts</h2>
              {notifications.length > 0 && (
                <button 
                  onClick={onClearAllNotifications}
                  className="text-xs font-bold text-red-500 hover:text-red-700  "
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
                    className={`p-6 rounded-2xl border transition-all flex items-start space-x-4 cursor-pointer hover:shadow-md ${notif.read ? 'bg-surface ring-border opacity-70' : 'bg-primary/5 border-primary/10 shadow-sm'}`}
                  >
                    <div className={`p-2 rounded-lg ${notif.type === 'match' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {notif.type === 'match' ? <Zap size={20} /> : <Bell size={20} />}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-fg mb-1 ${notif.read ? 'font-medium' : 'font-bold'}`}>{notif.message}</p>
                      <p className="text-xs text-muted font-medium  tracking-wider">{new Date(notif.date).toLocaleString()}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 card bg-surface/50">
                  <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-muted">No new alerts.</p>
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
                      : 'text-muted hover:bg-bg hover:text-fg'
                  }`}
                >
                  {settingsTab === tab.id && (
                    <motion.div
                      layoutId="activeSettingsTab"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    />
                  )}
                  <tab.icon size={18} className={settingsTab === tab.id ? 'text-primary' : 'text-muted group-hover:text-muted'} />
                  <span>{tab.label}</span>
                </button>
              ))}
              <div className="pt-4 mt-4 border-t ring-border">
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
                    <div className="card p-8 bg-surface">
                      <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
                        <Shield className="mr-2 text-primary" size={20} />
                        Admin Profile Settings
                      </h2>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <img
                            src={user.avatar}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-gray-50 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <button className="text-xs font-bold text-primary hover:underline  ">Change Avatar</button>
                            <p className="text-[10px] text-muted mt-1   font-medium">JPG, PNG or GIF. Max 2MB.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted  ">Full Name</label>
                            <input type="text" defaultValue={user.name} className="w-full px-4 py-3 rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted  ">Email Address</label>
                            <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-3 rounded-xl border ring-border bg-surface-raised text-muted text-sm font-medium cursor-not-allowed" />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-50">
                          <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold  shadow-primary/20">Save Profile</button>
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
                    <div className="card p-8 bg-surface">
                      <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
                        <Settings className="mr-2 text-primary" size={20} />
                        System Configuration
                      </h2>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-fg">Public Reporting</p>
                              <p className="text-xs text-muted">Allow unauthenticated users to report found items.</p>
                            </div>
                            <button 
                              onClick={() => setAllowPublicReports(!allowPublicReports)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowPublicReports ? 'bg-primary' : 'bg-surface-raised'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition ${allowPublicReports ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-fg">Auto-Match Processing</p>
                              <p className="text-xs text-muted">Automatically run AI matching when new items are reported.</p>
                            </div>
                            <button 
                              onClick={() => setAutoMatchEnabled(!autoMatchEnabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoMatchEnabled ? 'bg-primary' : 'bg-surface-raised'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition ${autoMatchEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted  ">Data Retention Period (Days)</label>
                          <div className="flex items-center space-x-4">
                            <input 
                              type="range" 
                              min="30" 
                              max="365" 
                              step="30"
                              value={retentionDays}
                              onChange={(e) => setRetentionDays(Number(e.target.value))}
                              className="flex-grow h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-sm font-bold text-primary w-16 text-right">{retentionDays} Days</span>
                          </div>
                          <p className="text-[10px] text-muted">Items older than this will be automatically archived.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                          <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold  shadow-primary/20">Save Configuration</button>
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
                    <div className="card p-8 bg-surface">
                      <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
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
                            className="flex-grow px-4 py-3 rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
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
                            <div key={cat} className="flex items-center justify-between p-4 bg-surface-raised rounded-xl border ring-border group">
                              <span className="text-sm font-bold text-fg">{cat}</span>
                              <button 
                                onClick={() => handleRemoveCategory(cat)}
                                className="p-1 text-muted hover:text-red-500 transition-colors"
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
                    <div className="card p-8 bg-surface">
                      <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
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
                            className="flex-grow px-4 py-3 rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
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
                            <div key={loc} className="flex items-center justify-between p-4 bg-surface-raised rounded-xl border ring-border">
                              <span className="text-sm font-bold text-fg">{loc}</span>
                              <button 
                                onClick={() => handleRemoveLocation(loc)}
                                className="p-1 text-muted hover:text-red-500 transition-colors"
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
                    <div className="card p-8 bg-surface">
                      <h2 className="text-xl font-bold text-fg mb-6 flex items-center">
                        <ShieldAlert className="mr-2 text-red-500" size={20} />
                        Security & Authentication
                      </h2>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-fg">Enforce 2FA for Claims</p>
                              <p className="text-xs text-muted">Require students to verify identity via email/SMS before claiming items.</p>
                            </div>
                            <button 
                              onClick={() => setRequire2FA(!require2FA)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${require2FA ? 'bg-primary' : 'bg-surface-raised'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition ${require2FA ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-bold text-fg">Admin Session Timeout</p>
                              <p className="text-xs text-muted">Automatically logout admins after 30 minutes of inactivity.</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary cursor-pointer">
                              <span className="inline-block h-4 w-4 transform rounded-full bg-surface transition translate-x-6" />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                          <h4 className="text-xs font-bold text-red-600  tracking-wider mb-2">Danger Zone</h4>
                          <button className="w-full py-3 bg-surface border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
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
    <div className="flex min-h-[calc(100vh-4rem)] bg-bg">
      <Sidebar 
        groups={adminGroups} 
        activeTab={activeTab} 
        onTabChange={(id) => {
          setActiveTab(id);
          setIsSidebarOpen(false);
        }} 
        userName={user.name}
        userRole="Administrator"
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-grow overflow-y-auto p-6 sm:p-10 lg:p-12">
        <div className="mx-auto max-w-5xl">
          {/* Analysis Result Modal */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 "
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-surface rounded-2xl  max-w-lg w-full overflow-hidden"
                >
                  <div className="p-6 border-b ring-border flex justify-between items-center bg-primary text-primary-fg">
                    <div className="flex items-center">
                      <Zap className="mr-2 text-accent" size={20} />
                      <h3 className="font-bold">AI Report Analysis</h3>
                    </div>
                    <button onClick={() => setAnalysisResult(null)} className="p-1 hover:bg-surface/10 rounded-full transition-colors">
                      <XCircle size={24} />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-fg">Confidence Score</span>
                        <span className="text-2xl font-bold text-accent">{analysisResult.confidence}%</span>
                      </div>
                      <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent h-full transition-all duration-1000" 
                          style={{ width: `${analysisResult.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-muted  tracking-wider mb-2">AI Summary</h4>
                      <p className="text-sm text-fg leading-relaxed">{analysisResult.summary}</p>
                    </div>

                    {analysisResult.potentialMatches?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-muted  tracking-wider mb-2">Potential Matches</h4>
                        <div className="space-y-2">
                          {analysisResult.potentialMatches.map((match: any, idx: number) => (
                            <div key={idx} className="p-3 bg-surface-raised rounded-xl border ring-border">
                              <p className="text-sm font-bold text-fg">{match.title}</p>
                              <p className="text-xs text-muted">{match.matchReason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-600  tracking-wider mb-1">Recommendation</h4>
                      <p className="text-sm text-blue-800">{analysisResult.recommendation}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-surface-raised border-t ring-border flex space-x-3">
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
                      className="px-6 py-2.5 border ring-border rounded-xl text-sm font-bold hover:bg-surface transition-colors"
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
                <h1 className="text-2xl sm:text-3xl font-sans font-bold text-primary">
                  {adminGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs sm:text-sm text-muted">
                  {activeTab === 'overview' 
                    ? 'System overview and item management.' 
                    : `Managing ${activeTab} and system data.`}
                </p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-surface border ring-border rounded-xl text-muted hover:text-primary transition-colors shadow-sm"
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
      {/* Found Item Match Modal */}
      <AnimatePresence>
        {matchModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-3xl max-w-xl w-full overflow-hidden"
            >
              <div className="p-6 border-b ring-border flex justify-between items-center bg-primary text-primary-fg">
                <div>
                  <h3 className="font-bold text-sm">Notify Matching Lost Report</h3>
                  <p className="text-[11px] text-primary-fg/80">
                    Select a matching lost report to notify the student.
                  </p>
                </div>
                <button
                  onClick={() => setMatchModalItem(null)}
                  className="p-1 hover:bg-surface/10 rounded-full transition-colors"
                >
                  <XCircle size={22} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="text-xs text-muted">
                  <span className="font-bold text-fg">Found item:</span>{" "}
                  {matchModalItem.title} • {matchModalItem.category} • {matchModalItem.location}
                </div>
                {items.filter(i =>
                  i.type === 'lost' &&
                  (i.status === 'pending' || i.status === 'lost')
                ).length === 0 ? (
                  <div className="p-4 bg-surface-raised rounded-2xl border ring-border text-xs text-muted">
                    No lost reports are available to notify yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.filter(i =>
                      i.type === 'lost' &&
                      (i.status === 'pending' || i.status === 'lost')
                    ).map(lost => {
                      const student = users.find(u => u.id === lost.reporterId);
                      return (
                        <div
                          key={lost.id}
                          className="p-4 bg-surface-raised rounded-2xl border ring-border flex justify-between items-start gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-fg">{lost.title}</p>
                            <p className="text-[11px] text-muted">
                              {lost.location} • reported on{" "}
                              {new Date(lost.createdAt || lost.date).toLocaleDateString()}
                            </p>
                            {student && (
                              <p className="text-[11px] text-muted">
                                Student: <span className="font-semibold">{student.name}</span> ({student.email})
                              </p>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              await onNotifyPotentialMatch(matchModalItem.id, lost.id);
                              setMatchModalItem(null);
                            }}
                            className="px-3 py-2 text-[11px] font-bold rounded-xl bg-primary text-primary-fg hover:bg-primary/90 whitespace-nowrap"
                          >
                            Notify Student
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-4 border-t ring-border flex justify-end">
                <button
                  onClick={() => setMatchModalItem(null)}
                  className="px-4 py-2 text-xs font-bold text-muted hover:text-fg"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
