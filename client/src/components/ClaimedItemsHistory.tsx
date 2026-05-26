import React from 'react';
import { Item, User, Claim } from '../types';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Archive, 
  CheckCircle, 
  Clock, 
  User as UserIcon, 
  Package, 
  ExternalLink,
  ChevronDown,
  Calendar,
  MoreVertical,
  Download,
  Trash2,
  AlertCircle,
  Zap,
  Shield
} from 'lucide-react';

interface ClaimedItemsHistoryProps {
  items: Item[];
  users: User[];
  claims: Claim[];
  onUpdateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  onViewItem: (item: Item) => void;
}

export default function ClaimedItemsHistory({ 
  items, 
  users, 
  claims, 
  onUpdateItem,
  onViewItem 
}: ClaimedItemsHistoryProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [dateFilter, setDateFilter] = React.useState('AllTime');
  const [selectedItemHistory, setSelectedItemHistory] = React.useState<Item | null>(null);

  const claimedItems = items.filter(item => item.status === 'claimed' || item.isArchived);

  const filteredItems = claimedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Archived' && item.isArchived) ||
                         (statusFilter === 'Claimed' && item.status === 'claimed' && !item.isArchived);
    
    // Simple date filtering
    let matchesDate = true;
    if (dateFilter !== 'AllTime' && item.claimedAt) {
      const claimedDate = new Date(item.claimedAt);
      const now = new Date();
      if (dateFilter === 'Today') {
        matchesDate = claimedDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'ThisWeek') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = claimedDate >= weekAgo;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  // Statistics
  const totalClaimed = claimedItems.filter(i => !i.isArchived).length;
  const historyTotal = claimedItems.length;
  const recoveryRate = items.length > 0 ? Math.round((claimedItems.length / items.length) * 100) : 0;
  
  const claimsThisWeek = claimedItems.filter(item => {
    if (!item.claimedAt) return false;
    const claimedDate = new Date(item.claimedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return claimedDate >= weekAgo;
  }).length;

  const handleArchive = async (item: Item) => {
    if (window.confirm('Archive this record? It will be moved to archived history.')) {
      await onUpdateItem(item.id, { isArchived: true });
    }
  };

  const handleDelete = async (item: Item) => {
    if (window.confirm('Permanently delete this claim record? This action cannot be undone.')) {
      // For now we just set a deleted flag or something, but usually admin dashboard has onUpdateItem
      // If we don't have a real delete in props, we could just alert or handle if provided
      alert('Delete functionality would be implemented via parent onUpdateItem or a dedicated onDeleteItem prop.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <CheckCircle size={24} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full  tracking-wider">
              Total Successful
            </span>
          </div>
          <p className="text-3xl font-bold text-fg">{historyTotal}</p>
          <p className="text-xs text-muted font-medium mt-1">Items returned to owners</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Zap size={24} />
            </div>
            <span className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-1 rounded-full  tracking-wider">
              Efficiency
            </span>
          </div>
          <p className="text-3xl font-bold text-fg">{recoveryRate}%</p>
          <p className="text-xs text-muted font-medium mt-1">Recovery rate from reports</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full  tracking-wider">
              Weekly Activity
            </span>
          </div>
          <p className="text-3xl font-bold text-fg">{claimsThisWeek}</p>
          <p className="text-xs text-muted font-medium mt-1">New claims this week</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by item name or ID..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-muted" />
              <select 
                className="bg-bg border ring-border rounded-lg px-3 py-2 text-xs font-bold text-muted focus:outline-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <select 
              className="bg-bg border ring-border rounded-lg px-3 py-2 text-xs font-bold text-muted focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Claimed">Active Claims</option>
              <option value="Archived">Archived</option>
            </select>
            <select 
              className="bg-bg border ring-border rounded-lg px-3 py-2 text-xs font-bold text-muted focus:outline-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="AllTime">All Time</option>
              <option value="Today">Today</option>
              <option value="ThisWeek">This Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg text-[10px] font-bold text-muted   border-b ring-border">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Claimed By</th>
                <th className="px-6 py-4">Reported / Claimed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredItems.map(item => {
                const claimer = users.find(u => u.id === item.claimedBy);
                const approver = users.find(u => u.id === item.approvedBy);
                
                return (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative">
                          <img 
                            src={item.imageUrl} 
                            alt="" 
                            className="w-12 h-12 rounded-xl object-cover border ring-border shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          {item.isArchived && (
                            <div className="absolute -top-1 -right-1 bg-success text-primary-fg rounded-full p-0.5 shadow-sm">
                              <Archive size={8} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-bold text-fg group-hover:text-primary transition-colors">{item.title}</p>
                          <div className="flex flex-col mt-1 space-y-0.5">
                            <div className="flex items-center">
                              <span className="text-[9px] text-muted  font-black tracking-tighter mr-2">Ref: {item.id.to()}</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-muted rounded text-[9px] font-bold  tracking-wider">{item.category}</span>
                            </div>
                            {item.claimedBy && (
                              <div className="flex items-center">
                                <span className="text-[9px] text-emerald-500 font-bold  tracking-tighter">
                                  Verif: {claims.find(c => c.itemId === item.id && c.userId === item.claimedBy && c.status === 'approved')?.verificationId || 'N/A'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {claimer ? (
                        <div className="flex items-center">
                          <img src={claimer.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-50" referrerPolicy="no-referrer" />
                          <div className="ml-3">
                            <p className="text-xs font-bold text-slate-800">{claimer.name}</p>
                            <p className="text-[10px] text-muted">{claimer.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">No record</span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center text-[10px] text-muted">
                        <Clock size={10} className="mr-1.5" />
                        <span className="font-medium mr-1.5 ">Reported:</span>
                        <span className="font-bold text-fg">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-primary">
                        <CheckCircle size={10} className="mr-1.5" />
                        <span className="font-medium mr-1.5 ">Claimed:</span>
                        <span className="font-bold">{item.claimedAt ? new Date(item.claimedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold   border ${
                          item.isArchived 
                            ? 'bg-slate-100 text-muted ring-border' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {item.isArchived ? 'Archived' : 'Successfully Claimed'}
                        </span>
                        <span className="inline-flex items-center text-[10px] text-green-600 font-bold ml-1">
                          <CheckCircle size={10} className="mr-1" />
                          Verified
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {approver ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Shield size={12} />
                          </div>
                          <span className="text-xs font-bold text-fg">{approver.name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted italic">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          onClick={() => onViewItem(item)}
                          className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          title="View Details"
                        >
                          <ExternalLink size={18} />
                        </button>
                        {!item.isArchived ? (
                          <button 
                            onClick={() => handleArchive(item)}
                            className="p-2 text-muted hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                            title="Archive Record"
                          >
                            <Archive size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDelete(item)}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete History"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-fg font-sans font-bold mb-1">No claimed history found</h3>
                      <p className="text-muted text-sm font-medium">Try adjusting your filters or search query to find specific records.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-bg border-t ring-border flex justify-between items-center">
          <p className="text-[10px] font-bold text-muted  ">
            Showing {filteredItems.length} of {claimedItems.length} records
          </p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-surface border ring-border rounded-lg text-[10px] font-bold text-muted hover:bg-bg transition-all   shadow-sm">
              <Download size={12} className="inline mr-2" /> Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
