import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ReportForm from './components/ReportForm';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ItemCard from './components/ItemCard';
import ItemDetailsModal from './components/ItemDetailsModal';
import ChatbotWidget from './components/ChatbotWidget';
import ImageSearchModal from './components/ImageSearchModal';
import { Item, User, Notification, Claim, Comment } from './types';
import { MOCK_ITEMS, MOCK_USERS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowLeft, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType, setFirestoreOnline } from './lib/firestoreUtils';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  where,
  orderBy,
  limit,
  Timestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';

function AppContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const [isAdminPage] = React.useState(() => {
    return typeof window !== 'undefined' && window.location.pathname.includes('admin.html');
  });
  const [currentPage, setCurrentPage] = React.useState(() => {
    return (typeof window !== 'undefined' && window.location.pathname.includes('admin.html')) ? 'admin' : 'home';
  });

  React.useEffect(() => {
    if (authLoading) return;

    if (user) {
      const isUserAdmin = user.email === 'xanderjamesmata951@gmail.com' || user.role === 'admin' || user.email === 'admin@gmail.com';
      if (isUserAdmin) {
        if (!isAdminPage) {
          console.log('Redirecting admin to admin.html');
          window.location.href = '/admin.html';
        } else if (currentPage !== 'admin') {
          setCurrentPage('admin');
        }
      } else {
        // Normal logged-in user
        if (isAdminPage) {
          console.warn('Non-admin user on admin page. Redirecting to home...');
          window.location.href = '/';
        } else if (currentPage === 'admin' || currentPage === 'home' || currentPage === 'login-form') {
          setCurrentPage('dashboard');
        }
      }
    } else {
      // Logged out
      if (isAdminPage) {
        console.warn('Anonymous user on admin page. Redirecting to home...');
        window.location.href = '/';
      } else if (currentPage === 'admin' || currentPage === 'dashboard') {
        setCurrentPage('home');
      }
    }
  }, [user, authLoading, isAdminPage, currentPage]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showReportForm, setShowReportForm] = React.useState<'lost' | 'found' | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedStatus, setSelectedStatus] = React.useState('All');
  const [loginRole, setLoginRole] = React.useState<'student' | 'admin' | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);
  const [adminTab, setAdminTab] = React.useState('overview');
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isImageSearchOpen, setIsImageSearchOpen] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOfflineStatus = (e: any) => {
      setIsOffline(e.detail.offline);
    };
    window.addEventListener('firestore-offline-status', handleOfflineStatus);
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof window !== 'undefined' && (window as any).__firestore_offline__) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('firestore-offline-status', handleOfflineStatus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore Real-time Listeners
  React.useEffect(() => {
    // Only subscribe if user is logged in to avoid permission errors on initial mount
    if (authLoading || !user) {
      if (!authLoading) {
        setItems([]);
        setUsers([]);
        setClaims([]);
        setComments([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    // Items Listener
    const qItems = query(collection(db, 'items'), orderBy('date', 'desc'));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(itemsList);
      setLoading(false);
      if (!snapshot.metadata.fromCache) {
        setFirestoreOnline();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'items', false);
    });

    // Users Listener (Admin only fetches all, Students fetch themselves)
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
      if (!snapshot.metadata.fromCache) {
        setFirestoreOnline();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users', false);
    });

    // Claims Listener (Admin fetches all, Students fetch their own)
    const qClaims = user.role === 'admin'
      ? query(collection(db, 'claims'), orderBy('date', 'desc'))
      : query(collection(db, 'claims'), where('userId', '==', user.id));

    const unsubscribeClaims = onSnapshot(qClaims, (snapshot) => {
      let claimsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));
      if (user.role !== 'admin') {
        claimsList = claimsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setClaims(claimsList);
      if (!snapshot.metadata.fromCache) {
        setFirestoreOnline();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'claims', false);
    });

    // Comments Listener
    const qComments = query(collection(db, 'comments'), orderBy('date', 'desc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(commentsList);
      if (!snapshot.metadata.fromCache) {
        setFirestoreOnline();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'comments', false);
    });

    return () => {
      unsubscribeItems();
      unsubscribeUsers();
      unsubscribeClaims();
      unsubscribeComments();
    };
  }, [user, authLoading]);

  // Notifications Listener (User-specific)
  React.useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const qNotifs = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.id)
    );
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(notifsList);
      if (!snapshot.metadata.fromCache) {
        setFirestoreOnline();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications', false);
    });
    return () => unsubscribeNotifs();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', user.id));
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map(d => deleteDoc(d.ref).catch(e => handleFirestoreError(e, OperationType.DELETE, d.ref.path)));
      await Promise.all(batchPromises);
    } catch (error) {
      if (error instanceof Error && error.message.includes('{"error"')) throw error;
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!user) return;

    if (user.role === 'admin') {
      setCurrentPage('admin');
      if (notification.message.toLowerCase().includes('pending')) {
        setAdminTab('pending-reports');
      } else if (notification.message.toLowerCase().includes('claim')) {
        setAdminTab('claims');
      } else if (notification.message.toLowerCase().includes('match')) {
        setAdminTab('overview');
      }
    } else {
      if (notification.type === 'match') {
        setCurrentPage('search');
        if (notification.itemId) {
          const item = items.find(i => i.id === notification.itemId);
          if (item) setSelectedItem(item);
        }
      } else if (notification.itemId) {
        const item = items.find(i => i.id === notification.itemId);
        if (item) setSelectedItem(item);
      }
    }
    handleMarkAsRead(notification.id);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const handlePostComment = async (itemId: string, content: string, parentId?: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'comments'), {
        itemId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content,
        date: new Date().toISOString(),
        parentId: parentId || null,
        isDeleted: false,
        isFlagged: false,
        isHidden: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'comments');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await updateDoc(doc(db, 'comments', commentId), { isDeleted: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleUpdateComment = async (commentId: string, updates: Partial<Comment>) => {
    try {
      await updateDoc(doc(db, 'comments', commentId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      handleLogout();
    } else {
      setCurrentPage(page);
    }
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = () => {
    if (user?.email === 'xanderjamesmata951@gmail.com' || user?.role === 'admin' || user?.email === 'admin@gmail.com') {
      window.location.href = '/admin.html';
    } else {
      setCurrentPage('dashboard');
      showToast('Successfully logged in!', 'success');
      window.scrollTo(0, 0);
    }
  };

  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
    window.scrollTo(0, 0);
  };

  const handleReportClick = (type: 'lost' | 'found') => {
    if (!user) {
      setLoginRole('student');
      setCurrentPage('login-form');
      return;
    }
    setShowReportForm(type);
  };

  const handleReportSubmit = async (data: any) => {
    if (!user) return;

    try {
      const newItem = {
        ...data,
        reporterId: user.id,
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title}/400/300`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'items'), newItem);
      setShowReportForm(null);
      
      // Notify admin about new pending report
      const adminUsers = users.filter(u => u.role === 'admin');
      for (const admin of adminUsers) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: admin.id,
            message: `New pending ${data.type} report: "${data.title}" submitted by ${user.name}.`,
            type: 'system',
            date: new Date().toISOString(),
            read: false,
            itemId: docRef.id
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'notifications');
        }
      }

      showToast('Your report has been submitted for approval.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('{"error"')) {
        const parsed = JSON.parse(error.message);
        showToast(`Database Error: ${parsed.error}`, 'error');
      } else {
        console.error('Error submitting report:', error);
        showToast('Failed to submit report. Please try again.', 'error');
      }
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<Item>) => {
    try {
      await updateDoc(doc(db, 'items', id), updates);
      
      // Handle notifications for status changes
      const oldItem = items.find(i => i.id === id);
      if (oldItem?.status === 'pending' && (updates.status === 'lost' || updates.status === 'found')) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: oldItem.reporterId,
            message: `Your report for "${oldItem.title}" has been approved!`,
            type: 'status-update',
            date: new Date().toISOString(),
            read: false,
            itemId: id
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'notifications');
        }
      } else if (oldItem?.status === 'pending' && updates.status === 'declined') {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: oldItem.reporterId,
            message: `Your report for "${oldItem.title}" was declined.`,
            type: 'status-update',
            date: new Date().toISOString(),
            read: false,
            itemId: id
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'notifications');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
    }
  };

  const handleClaim = async (itemId: string, message: string, proofImageUrl?: string) => {
    if (!user) return;

    try {
      const verificationId = `VER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await addDoc(collection(db, 'claims'), {
        itemId,
        userId: user.id,
        status: 'pending',
        date: new Date().toISOString(),
        message,
        proofImageUrl: proofImageUrl || null,
        verificationId
      });

      // Update item status to under-review
      await handleUpdateItem(itemId, { status: 'under-review' });

      // Notify reporter
      const item = items.find(i => i.id === itemId);
      if (item) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: item.reporterId,
            message: `Someone has submitted a claim for your ${item.status} item: "${item.title}".`,
            type: 'status-update',
            date: new Date().toISOString(),
            read: false,
            itemId: itemId
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'notifications');
        }

        // Notify admins
        const adminUsers = users.filter(u => u.role === 'admin');
        for (const admin of adminUsers) {
          try {
            await addDoc(collection(db, 'notifications'), {
              userId: admin.id,
              message: `New claim submitted for item: "${item.title}" by ${user.name}.`,
              type: 'system',
              date: new Date().toISOString(),
              read: false,
              itemId: itemId
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'notifications');
          }
        }
      }

      showToast('Your claim has been submitted and is under review.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('{"error"')) {
        const parsed = JSON.parse(error.message);
        showToast(`Database Error: ${parsed.error}`, 'error');
      } else {
        console.error('Error submitting claim:', error);
        showToast('Failed to submit claim.', 'error');
      }
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      await updateDoc(doc(db, 'claims', claimId), { status: 'approved' });
      await handleUpdateItem(claim.itemId, { 
        status: 'claimed',
        claimedAt: new Date().toISOString(),
        claimedBy: claim.userId,
        approvedBy: user?.id
      });

      // Notify claimer
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: claim.userId,
          message: `Your claim for item #${claim.itemId.slice(-6)} has been approved!`,
          type: 'status-update',
          date: new Date().toISOString(),
          read: false,
          itemId: claim.itemId
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'notifications');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `claims/${claimId}`);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      await updateDoc(doc(db, 'claims', claimId), { status: 'rejected' });
      // Reset status back to 'found' (assumption)
      await handleUpdateItem(claim.itemId, { status: 'found' });

      // Notify claimer
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: claim.userId,
          message: `Your claim for item #${claim.itemId.slice(-6)} was declined.`,
          type: 'status-update',
          date: new Date().toISOString(),
          read: false,
          itemId: claim.itemId
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'notifications');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `claims/${claimId}`);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };


  const filteredItems = items.filter(item => {
    // Only show approved items on homepage/search
    if (item.status === 'pending') return false;

    const query = searchQuery.toLowerCase().trim();
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus.toLowerCase();

    if (!query) return matchesCategory && matchesStatus;

    const keywords = query.split(/\s+/).filter(k => k.length > 1);
    const itemText = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
    
    // Broad search: match if ANY keyword is present (OR logic)
    // This allows "related reports" to show up even if not all keywords match
    const matchesSearch = keywords.length > 0 
      ? keywords.some(keyword => itemText.includes(keyword))
      : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // Optional: sort by relevance (number of matching keywords)
    const query = searchQuery.toLowerCase().trim();
    if (!query) return 0;
    
    const keywords = query.split(/\s+/).filter(k => k.length > 1);
    const aText = `${a.title} ${a.description} ${a.location} ${a.category}`.toLowerCase();
    const bText = `${b.title} ${b.description} ${b.location} ${b.category}`.toLowerCase();
    
    const aMatches = keywords.filter(k => aText.includes(k)).length;
    const bMatches = keywords.filter(k => bText.includes(k)).length;
    
    return bMatches - aMatches;
  });

  const categories = ['All', 'Electronics', 'Personal Items', 'Accessories', 'Books', 'Clothing', 'Other'];
  const statuses = ['All', 'Lost', 'Found', 'Claimed', 'Under-Review'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Verifying Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/10 selection:text-primary">
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onNotificationClick={handleNotificationClick}
      />

      {isOffline && (
        <div className="bg-amber-500 text-white text-xs px-4 py-2.5 text-center font-medium shadow-sm flex items-center justify-center gap-2 select-none animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>Offline Mode: Showing cached campus listings. Actions requiring database contact will automatically retry when reconnected.</span>
        </div>
      )}

      <main>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <Hero 
              onReportLost={() => handleReportClick('lost')}
              onReportFound={() => handleReportClick('found')}
              onSearch={() => handleNavigate('search')}
              onOpenImageSearch={() => setIsImageSearchOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {currentPage === 'login-form' && (
            <LoginForm 
              onSuccess={handleLoginSuccess} 
              onBack={() => handleNavigate('home')}
              onSignup={() => handleNavigate('signup')}
              initialRole={loginRole}
            />
          )}

          {currentPage === 'signup' && (
            <SignupForm 
              onSuccess={() => {
                handleNavigate('login-form');
                showToast('Registration successful! Please sign in.', 'success');
              }} 
              onBack={() => handleNavigate('home')}
              onLogin={() => handleNavigate('login-form')}
            />
          )}

          {currentPage === 'dashboard' && user && user.role === 'student' && (
            <Dashboard 
              user={user}
              items={items}
              users={users}
              claims={claims}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              onLogout={handleLogout}
              onReportLost={() => handleReportClick('lost')}
              onReportFound={() => handleReportClick('found')}
              onViewItem={setSelectedItem}
              setIsImageSearchOpen={setIsImageSearchOpen}
            />
          )}

          {currentPage === 'admin' && user && user.role === 'admin' && (
            <AdminDashboard 
              user={user}
              items={items}
              users={users}
              claims={claims}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              onLogout={handleLogout}
              onUpdateItem={handleUpdateItem}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              onViewItem={setSelectedItem}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              initialTab={adminTab}
            />
          )}

          {currentPage === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                <div>
                  <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight mb-2">Search Items</h1>
                  <p className="text-slate-500 font-medium">Browse all reported lost and found items on campus.</p>
                </div>
                <div className="w-full md:w-96 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name, location, or description..." 
                    className="input-field pl-12 py-3.5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6 mb-12">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Filter by Category</h3>
                  <div className="flex flex-wrap gap-3">
                    {categories.map(category => (
                      <button 
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`text-[10px] py-2 px-5 flex items-center uppercase tracking-widest font-bold rounded-xl transition-all ${
                          selectedCategory === category 
                            ? 'btn-primary' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {category === 'All' && <Filter size={12} className="mr-2" />}
                        {category === 'All' ? 'All Categories' : category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Filter by Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {statuses.map(status => (
                      <button 
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`text-[10px] py-2 px-5 flex items-center uppercase tracking-widest font-bold rounded-xl transition-all ${
                          selectedStatus === status 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      reporterName={users.find(u => u.id === item.reporterId)?.name}
                      onClick={setSelectedItem}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 glass-card bg-white/50">
                  <Search size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-400 mb-2">No items found matching your search.</h3>
                  <p className="text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </motion.div>
          )}

          {currentPage === 'report' && (
            <motion.div
              key="report-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 py-24 text-center"
            >
              <h1 className="text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">What would you like to report?</h1>
              <p className="text-xl text-slate-500 mb-16 font-medium">Choose an option below to start your report process.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <button 
                  onClick={() => handleReportClick('lost')}
                  className="glass-card p-12 hover:border-primary/30 transition-all group bg-white/80 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-sm">
                    <Search size={48} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">I Lost Something</h3>
                  <p className="text-slate-500 font-medium">Report an item you've lost so our AI can help you find it.</p>
                </button>
                
                <button 
                  onClick={() => handleReportClick('found')}
                  className="glass-card p-12 hover:border-accent/30 transition-all group bg-white/80 hover:shadow-2xl hover:shadow-accent/5"
                >
                  <div className="w-24 h-24 bg-accent/5 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-sm">
                    <CheckCircle size={48} className="text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">I Found Something</h3>
                  <p className="text-slate-500 font-medium">Report an item you've found to help it get back to its owner.</p>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {currentPage !== 'dashboard' && currentPage !== 'admin' && (
        <footer className="bg-white border-t border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-primary/20">
                    <Package size={22} />
                  </div>
                  <span className="text-slate-900 font-display font-bold text-2xl tracking-tight">
                    Campus E-Lost and Found
                  </span>
                </div>
                <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
                  The official AI-powered Lost and Found system for the university campus. Helping students recover lost items with technology.
                </p>
                <div className="flex items-center space-x-6">
                  <button 
                    onClick={() => handleNavigate('login-form')}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                  >
                    Admin Access
                  </button>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                    Privacy Policy
                  </button>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                    Contact Security
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-widest">Quick Links</h4>
                <ul className="space-y-4 text-sm text-slate-500 font-medium">
                  <li><button onClick={() => setCurrentPage('home')} className="hover:text-primary transition-colors">Home</button></li>
                  <li><button onClick={() => setCurrentPage('search')} className="hover:text-primary transition-colors">Search Items</button></li>
                  <li><button onClick={() => handleReportClick('lost')} className="hover:text-primary transition-colors">Report Lost</button></li>
                  <li><button onClick={() => handleReportClick('found')} className="hover:text-primary transition-colors">Report Found</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-widest">Support</h4>
                <ul className="space-y-4 text-sm text-slate-500 font-medium">
                  <li><button className="hover:text-primary transition-colors">Help Center</button></li>
                  <li><button className="hover:text-primary transition-colors">FAQs</button></li>
                  <li><button className="hover:text-primary transition-colors">User Guide</button></li>
                  <li><button className="hover:text-primary transition-colors">Safety Tips</button></li>
                </ul>
              </div>
            </div>
            <div className="mt-20 pt-8 border-t border-slate-50 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              &copy; {new Date().getFullYear()} Campus AI Lost & Found System. All rights reserved.
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showReportForm && (
          <ReportForm 
            type={showReportForm} 
            user={user!}
            onClose={() => setShowReportForm(null)} 
            onSubmit={handleReportSubmit}
          />
        )}
      </AnimatePresence>

      <ItemDetailsModal 
        item={selectedItem} 
        reporter={selectedItem ? users.find(u => u.id === selectedItem.reporterId) : null}
        currentUser={user}
        comments={comments.filter(c => c.itemId === selectedItem?.id)}
        onClose={() => setSelectedItem(null)} 
        onClaim={handleClaim}
        onUpdateItem={handleUpdateItem}
        onPostComment={handlePostComment}
        onDeleteComment={handleDeleteComment}
        onUpdateComment={handleUpdateComment}
        onLoginRedirect={() => {
          setSelectedItem(null);
          setLoginRole('student');
          setCurrentPage('login-form');
          window.scrollTo(0, 0);
        }}
      />

      <ImageSearchModal 
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSearch={handleImageSearch}
        items={items}
      />

      <ChatbotWidget 
        user={user} 
        onNavigate={handleNavigate} 
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
              toast.type === 'success' 
                ? 'bg-white border-green-100 text-green-900' 
                : 'bg-white border-red-100 text-red-900'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
