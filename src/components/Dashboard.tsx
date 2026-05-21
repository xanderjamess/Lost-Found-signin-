import React from 'react';
import { LayoutDashboard, Package, CheckCircle, Bell, Camera, Search, AlertCircle, Zap, Settings, HelpCircle, FileText, Clock, LogOut, ShieldCheck, ArrowRight, Menu } from 'lucide-react';
import { Item, User, Notification, Claim } from '../types';
import ItemCard from './ItemCard';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: User;
  items: Item[];
  users: User[];
  claims: Claim[];
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onNotificationClick: (notification: Notification) => void;
  onLogout: () => void;
  onReportLost: () => void;
  onReportFound: () => void;
  onViewItem: (item: Item) => void;
  setIsImageSearchOpen: (isOpen: boolean) => void;
}

export default function Dashboard({ 
  user, 
  items, 
  users, 
  claims, 
  notifications, 
  onMarkAsRead,
  onClearAllNotifications,
  onNotificationClick,
  onLogout, 
  onReportLost, 
  onReportFound, 
  onViewItem, 
  setIsImageSearchOpen 
}: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const userLostItems = items.filter(i => i.reporterId === user.id && (i.status === 'lost' || (i.status === 'pending' && i.type === 'lost')));
  const userFoundItems = items.filter(i => i.reporterId === user.id && (i.status === 'found' || (i.status === 'pending' && i.type === 'found')));
  const userClaims = claims.filter(c => c.userId === user.id);
  
  const studentGroups = [
    {
      title: 'Main',
      tabs: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Reports & Claims',
      tabs: [
        { id: 'lost', label: 'My Lost Reports', icon: AlertCircle },
        { id: 'found', label: 'My Found Reports', icon: Package },
        { id: 'claims', label: 'My Claims', icon: FileText },
      ]
    },
    {
      title: 'Account & Support',
      tabs: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'help', label: 'Help Center', icon: HelpCircle },
      ]
    }
  ];

  const stats = [
    { label: 'Active Reports', value: userLostItems.length, icon: <AlertCircle className="text-red-500" size={20} /> },
    { label: 'Found Items', value: userFoundItems.length, icon: <Package className="text-primary" size={20} /> },
    { label: 'My Claims', value: userClaims.length, icon: <FileText className="text-blue-500" size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6 flex items-center"
                >
                  <div className="p-3 bg-gray-50 rounded-lg mr-4">{stat.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-bold text-neutral-dark">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-10">
                {/* My Lost Items Preview */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-neutral-dark flex items-center">
                      <AlertCircle className="mr-2 text-red-500" size={20} />
                      Recent Lost Reports
                    </h2>
                    <button onClick={() => setActiveTab('lost')} className="text-primary text-sm font-bold hover:underline">View All</button>
                  </div>
                  {userLostItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {userLostItems.slice(0, 2).map(item => (
                        <ItemCard 
                          key={item.id} 
                          item={item} 
                          reporterName={users.find(u => u.id === item.reporterId)?.name}
                          onClick={onViewItem}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-10 text-center border-dashed border-2 border-slate-200 bg-transparent">
                      <Package className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500">You haven't reported any lost items yet.</p>
                      <button 
                        onClick={onReportLost}
                        className="mt-4 text-primary font-bold hover:underline"
                      >
                        Report a lost item
                      </button>
                    </div>
                  )}
                </section>

                {/* AI Matching Suggestions */}
                {notifications.some(n => n.type === 'match') && (
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-neutral-dark flex items-center">
                        <Zap className="mr-2 text-primary" size={20} />
                        AI-Powered Matches
                      </h2>
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">New Matches</span>
                    </div>
                    {notifications.filter(n => n.type === 'match').map((matchNotif, idx) => {
                      const matchedItem = items.find(i => i.id === matchNotif.itemId);
                      return (
                        <div key={matchNotif.id} className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                              <img 
                                src={matchedItem?.imageUrl || "https://picsum.photos/seed/laptop/100/100"} 
                                alt="Lost Item" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                            <div className="flex-grow">
                              <h3 className="font-bold text-primary mb-1">Potential Match Found!</h3>
                              <p className="text-sm text-slate-600 mb-3">{matchNotif.message}</p>
                              <div className="flex items-center space-x-3">
                                {matchedItem && (
                                  <button 
                                    onClick={() => onViewItem(matchedItem)}
                                    className="btn-primary text-xs py-1.5 px-4"
                                  >
                                    View Match
                                  </button>
                                )}
                                <button 
                                  onClick={() => onMarkAsRead(matchNotif.id)}
                                  className="text-slate-400 text-xs font-bold hover:text-slate-600 uppercase tracking-wider"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-primary">92%</span>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Confidence</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}
              </div>

              {/* Quick Tools */}
              <div className="space-y-10">
                <section className="glass-card p-6 bg-accent text-white">
                  <h2 className="text-lg font-bold mb-4 flex items-center">
                    <Camera className="mr-2" size={20} />
                    Image Search
                  </h2>
                  <p className="text-sm text-white/80 mb-6">
                    Upload a photo to instantly find matching items in our database using AI technology.
                  </p>
                  <button 
                    onClick={() => setIsImageSearchOpen(true)}
                    className="w-full bg-white text-accent font-bold py-3 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <Camera size={20} className="mr-2" />
                    Search by Image
                  </button>
                </section>
              </div>
            </div>
          </div>
        );
      case 'lost':
        return (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-dark">My Lost Reports</h2>
              <button 
                onClick={onReportLost}
                className="btn-primary text-sm py-2 px-4"
              >
                New Report
              </button>
            </div>
            {userLostItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userLostItems.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        reporterName={users.find(u => u.id === item.reporterId)?.name}
                        onClick={onViewItem}
                      />
                    ))}
                  </div>
            ) : (
              <div className="glass-card p-20 text-center border-dashed border-2 border-gray-200 bg-transparent">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">You haven't reported any lost items yet.</p>
                <button 
                  onClick={onReportLost}
                  className="mt-6 btn-primary px-8"
                >
                  Report a lost item
                </button>
              </div>
            )}
          </section>
        );
      case 'found':
        return (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-dark">My Found Reports</h2>
              <button 
                onClick={onReportFound}
                className="btn-accent text-sm py-2 px-4"
              >
                New Report
              </button>
            </div>
            {userFoundItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userFoundItems.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        reporterName={users.find(u => u.id === item.reporterId)?.name}
                        onClick={onViewItem}
                      />
                    ))}
                  </div>
            ) : (
              <div className="glass-card p-20 text-center border-dashed border-2 border-gray-200 bg-transparent">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">You haven't reported any found items yet.</p>
                <button 
                  onClick={onReportFound}
                  className="mt-6 btn-accent px-8"
                >
                  Report a found item
                </button>
              </div>
            )}
          </section>
        );
      case 'claims':
        return (
          <section className="max-w-4xl">
            <h2 className="text-2xl font-bold text-neutral-dark mb-6">My Claims</h2>
            <div className="space-y-6">
              {userClaims.length > 0 ? (
                userClaims.map(claim => {
                  const item = items.find(i => i.id === claim.itemId);
                  return (
                    <div key={claim.id} className="glass-card p-6 bg-white border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-xl overflow-hidden mr-4 bg-gray-100">
                          <img 
                            src={item?.imageUrl || 'https://picsum.photos/seed/item/100/100'} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-dark">{item?.title || 'Unknown Item'}</h3>
                          <p className="text-xs text-gray-400 mb-2">Claimed on {new Date(claim.date).toLocaleDateString()}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <Clock size={12} className="mr-1" />
                            {claim.message.slice(0, 60)}{claim.message.length > 60 ? '...' : ''}
                          </div>
                          {claim.proofImageUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proof:</span>
                              <img 
                                src={claim.proofImageUrl} 
                                alt="Proof" 
                                className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                          claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {claim.status}
                        </span>
                        {item && (
                          <button 
                            onClick={() => onViewItem(item)}
                            className="text-primary font-bold text-xs hover:underline"
                          >
                            View Item
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 glass-card bg-white/50">
                  <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400">You haven't submitted any claims yet.</p>
                </div>
              )}
            </div>
          </section>
        );
      case 'notifications':
        return (
          <section className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-dark">Notifications</h2>
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
                  <p className="text-gray-400">No new notifications.</p>
                </div>
              )}
            </div>
          </section>
        );
      case 'settings':
        return (
          <section className="max-w-3xl space-y-8">
            {/* Profile Settings */}
            <div className="glass-card p-8 bg-white">
              <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                <Settings className="mr-2 text-primary" size={20} />
                Profile Settings
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
                  <button className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Save Changes</button>
                </div>
              </div>
            </div>

            {/* System Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 bg-white">
                <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                  <Zap className="mr-2 text-accent" size={20} />
                  System Preferences
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Language</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium bg-white">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Filipino</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Dark Mode</p>
                      <p className="text-xs text-gray-400">Reduce eye strain in low light.</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-pointer">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Compact View</p>
                      <p className="text-xs text-gray-400">Show more items on the screen.</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary cursor-pointer">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 bg-white">
                <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                  <ShieldCheck className="mr-2 text-emerald-500" size={20} />
                  Security & Privacy
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Two-Factor Auth</p>
                      <p className="text-xs text-gray-400">Add an extra layer of security.</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary cursor-pointer">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">Public Profile</p>
                      <p className="text-xs text-gray-400">Allow others to see your profile.</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-pointer">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                    </div>
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest flex items-center">
                    Manage Trusted Devices
                    <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="glass-card p-8 bg-white">
              <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center">
                <Bell className="mr-2 text-accent" size={20} />
                Notification Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'email-matches', label: 'Email for AI matches', desc: 'Get notified when our AI finds a potential match for your lost item.' },
                  { id: 'email-claims', label: 'Email for claim updates', desc: 'Stay updated on the status of your item claims.' },
                  { id: 'push-notifs', label: 'Browser push notifications', desc: 'Receive real-time alerts while you are on the platform.' }
                ].map(pref => (
                  <div key={pref.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">{pref.label}</p>
                      <p className="text-xs text-gray-400">{pref.desc}</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-pointer">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Actions */}
            <div className="glass-card p-8 bg-red-50 border-red-100">
              <h2 className="text-xl font-bold text-red-700 mb-2">Account Actions</h2>
              <p className="text-sm text-red-600/70 mb-6 font-medium">Manage your session and account security.</p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={onLogout}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout from Account
                </button>
                <button className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400 italic">
            This feature is coming soon.
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50/50">
      <Sidebar 
        groups={studentGroups} 
        activeTab={activeTab} 
        onTabChange={(id) => {
          setActiveTab(id);
          setIsSidebarOpen(false);
        }} 
        userName={user.name}
        userEmail={user.email}
        userRole="Student"
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
                {studentGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {activeTab === 'overview' 
                  ? `Welcome back, ${user.name}. Here's what's happening with your reports.`
                  : `Manage your ${activeTab} and stay updated.`}
              </p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-colors self-end sm:self-auto"
            >
              <Menu size={20} />
            </button>
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
    </div>
  );
}
