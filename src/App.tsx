import React, { useState, useEffect } from 'react';
import { 
  Film, Tv, Link as LinkIcon, Eye, Trash2, Edit3, Plus, 
  Search, LogOut, Copy, Check, Power, ShieldAlert, AlertTriangle, Play, BarChart3, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem, ShareToken, DashboardStats } from './types';
import AdminLogin from './components/AdminLogin';
import CinemaPlayer from './components/CinemaPlayer';
import ItemFormModal from './components/ItemFormModal';
import TokenGeneratorModal from './components/TokenGeneratorModal';
import Sidebar from './components/Sidebar';

export default function App() {
  const [view, setView] = useState<'loading' | 'watch' | 'dashboard' | 'login' | 'watch_error'>('loading');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [watchData, setWatchData] = useState<{
    token: { id: string; title: string; views: number; maxViews: number | null; expiresAt: string | null };
    item: MediaItem;
    episode?: { id: string; episodeNumber: number; seasonNumber: number; title: string; videoUrl: string; videoType: any };
  } | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);

  // Admin Dashboard State
  const [adminPassword, setAdminPassword] = useState<string | null>(localStorage.getItem('admin_pass'));
  const [activeTab, setActiveTab] = useState<'library' | 'links'>('library');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalItems: 0, totalTokens: 0, totalViews: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sidebar Navigation & Filter State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenPreselectedItem, setTokenPreselectedItem] = useState<MediaItem | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Check URL pathname for routing on mount
  useEffect(() => {
    const path = window.location.pathname;
    const watchMatch = path.match(/^\/watch\/([a-zA-Z0-9]+)/);
    
    if (watchMatch) {
      const id = watchMatch[1];
      setTokenId(id);
      loadWatchItem(id);
    } else {
      // Direct access to home/management
      if (adminPassword) {
        verifyAdminAndLoad(adminPassword);
      } else {
        setView('login');
      }
    }
  }, []);

  // Public Viewer: Load Secret Video Details
  const loadWatchItem = async (tid: string) => {
    try {
      const res = await fetch(`/api/watch/${tid}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setWatchData(data);
        setView('watch');
      } else {
        setWatchError(data.error || 'عذراً، الرابط الخاص بك غير صالح أو انتهت صلاحيته.');
        setView('watch_error');
      }
    } catch (err) {
      setWatchError('حدث خطأ أثناء الاتصال بالخادم. يرجى إعادة المحاولة.');
      setView('watch_error');
    }
  };

  // Admin Authenticate Verification
  const verifyAdminAndLoad = async (password: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        setAdminPassword(password);
        localStorage.setItem('admin_pass', password);
        await loadDashboardData(password);
        setView('dashboard');
      } else {
        localStorage.removeItem('admin_pass');
        setAdminPassword(null);
        setView('login');
      }
    } catch (err) {
      setView('login');
    }
  };

  const handleLoginSuccess = (password: string) => {
    verifyAdminAndLoad(password);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_pass');
    setAdminPassword(null);
    setView('login');
  };

  // Load Admin Dashboard Metrics & Content
  const loadDashboardData = async (password: string) => {
    const headers = { 'Authorization': `Bearer ${password}` };
    try {
      const [itemsRes, tokensRes, statsRes] = await Promise.all([
        fetch('/api/items', { headers }),
        fetch('/api/tokens', { headers }),
        fetch('/api/stats', { headers })
      ]);

      if (itemsRes.ok && tokensRes.ok && statsRes.ok) {
        const itemsData = await itemsRes.json();
        const tokensData = await tokensRes.json();
        const statsData = await statsRes.json();

        setItems(itemsData);
        setTokens(tokensData);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Add / Edit movie or series
  const handleSaveItem = async (itemData: MediaItem) => {
    if (!adminPassword) return;
    const isEdit = !!itemData.id;
    const url = isEdit ? `/api/items/${itemData.id}` : '/api/items';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify(itemData)
      });

      if (res.ok) {
        setIsItemModalOpen(false);
        setEditingItem(null);
        await loadDashboardData(adminPassword);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'فشلت عملية الحفظ');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  // Delete movie/series
  const handleDeleteItem = (itemId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المادة',
      message: `هل أنت متأكد تماماً من حذف "${title}"؟ سيؤدي ذلك أيضاً لإلغاء جميع روابط المشاهدة النشطة المرتبطة بها نهائياً.`,
      onConfirm: async () => {
        if (!adminPassword) return;
        try {
          const res = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminPassword}` }
          });

          if (res.ok) {
            await loadDashboardData(adminPassword);
          }
        } catch (err) {
          console.error(err);
        }
        setConfirmModal(null);
      }
    });
  };

  // Generate secret token callback
  const handleGenerateToken = async (tokenConfig: any) => {
    if (!adminPassword) return null;
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify(tokenConfig)
      });

      if (res.ok) {
        const newToken = await res.json();
        await loadDashboardData(adminPassword);
        return newToken;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Toggle sharing link status
  const handleToggleToken = async (tokenId: string) => {
    if (!adminPassword) return;
    try {
      const res = await fetch(`/api/tokens/${tokenId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });

      if (res.ok) {
        await loadDashboardData(adminPassword);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke / Delete sharing link
  const handleDeleteToken = (tokenId: string, label: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'إلغاء وحذف رابط المشاهدة',
      message: `هل أنت متأكد من إلغاء وحذف رابط المشاهدة "${label}" نهائياً؟ لن يتمكن أي شخص من استخدامه بعد الآن.`,
      onConfirm: async () => {
        if (!adminPassword) return;
        try {
          const res = await fetch(`/api/tokens/${tokenId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminPassword}` }
          });

          if (res.ok) {
            await loadDashboardData(adminPassword);
          }
        } catch (err) {
          console.error(err);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleCopyTokenUrl = (tid: string) => {
    const fullUrl = `${window.location.origin}/watch/${tid}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedTokenId(tid);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Filter items in library
  const filteredItems = items.filter(item => {
    // 1. Text Search query
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Section (أفلام، أنمي، أنميشن، مسلسلات)
    if (activeSection) {
      // For backward compatibility, fallback to general defaults if item doesn't have a custom section
      const itemSection = item.section || (item.type === 'movie' ? 'أفلام' : 'مسلسلات');
      if (itemSection !== activeSection) {
        return false;
      }
    }

    // 3. Category (أكشن، رعب، الخ)
    if (activeCategory) {
      if (item.category !== activeCategory) {
        return false;
      }
    }

    return true;
  });

  // Get human friendly target name for token list
  const getTokenTargetName = (token: ShareToken) => {
    const item = items.find(i => i.id === token.itemId);
    if (!item) return 'مادة محذوفة';
    if (token.episodeId && item.episodes) {
      const ep = item.episodes.find(e => e.id === token.episodeId);
      return `${item.title} - الموسم ${ep?.seasonNumber} - حلقة ${ep?.episodeNumber}`;
    }
    return item.title;
  };

  // Helper: Find item target details
  const getTargetPoster = (token: ShareToken) => {
    const item = items.find(i => i.id === token.itemId);
    return item?.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80';
  };

  // --- RENDERING VIEWS ---

  // 1. Loading screen
  if (view === 'loading') {
    return (
      <div id="loading-spinner" className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center text-zinc-400">
        <span className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-light tracking-wide animate-pulse text-zinc-500">جاري تأمين البوابة والاتصال بالخادم...</p>
      </div>
    );
  }

  // 2. Watch Cinema Player View (Public View, Passwordless)
  if (view === 'watch' && watchData) {
    const videoUrl = watchData.episode ? watchData.episode.videoUrl : (watchData.item.videoUrl || '');
    const videoType = watchData.episode ? watchData.episode.videoType : (watchData.item.videoType || 'direct');
    const displayTitle = watchData.episode 
      ? `${watchData.item.title} - الموسم ${watchData.episode.seasonNumber} (الحلقة ${watchData.episode.episodeNumber}: ${watchData.episode.title})`
      : watchData.item.title;

    return (
      <div id="cinema-watch-view" className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col items-center justify-start p-4 md:p-8" dir="rtl">
        {/* Anti-index meta injected via side effect */}
        <div className="w-full max-w-5xl mb-6 flex justify-between items-center border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Private Stream Gate</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 bg-zinc-900/60 px-3.5 py-1.5 rounded-xl border border-zinc-800/60">
            بوابة العرض السينمائي المغلقة
          </span>
        </div>

        <div className="w-full max-w-5xl space-y-6">
          <CinemaPlayer
            videoUrl={videoUrl}
            videoType={videoType}
            title={displayTitle}
            posterUrl={watchData.item.posterUrl}
          />
          
          <div className="p-6 bg-[#0c0c0e]/80 border border-zinc-900 rounded-2xl shadow-xl">
            <h2 className="text-xs font-bold text-zinc-400 mb-3.5 uppercase tracking-wider">قصة وتفاصيل العرض</h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-light">{watchData.item.description || 'لا يوجد وصف متاح لهذا العرض.'}</p>
          </div>
        </div>

        <p className="text-zinc-800 text-[10px] mt-16 font-mono tracking-wider uppercase">
          Private Stream Server • Secured Link • Encrypted Node
        </p>
      </div>
    );
  }

  // 3. Watch Link Error / Expired View
  if (view === 'watch_error') {
    return (
      <div id="watch-error-view" className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a0a0b] p-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-red-950/20 border border-red-900/30 rounded-3xl flex items-center justify-center text-red-500 shadow-2xl mb-6">
          <AlertTriangle className="w-9 h-9" />
        </div>
        
        <h1 className="text-xl font-bold text-zinc-200">الرابط غير متاح أو منتهي الصلاحية</h1>
        <p className="text-zinc-400 text-xs mt-3 max-w-md leading-relaxed font-light">
          {watchError || 'رابط المشاهدة السري هذا غير فعال حالياً. قد يكون منشئ المحتوى قد عطله، أو انتهت مدة صلاحيته المحددة، أو وصل للحد الأقصى للمشاهدات.'}
        </p>

        <div className="mt-8 p-4 bg-[#0c0c0e] border border-zinc-900 rounded-2xl text-[11px] text-zinc-500 max-w-sm">
          <span>هذا الموقع مخصص للمشاهدات المحدودة والخاصة كلياً، ويتم إخفاء روابطه وصفحاته عن محركات البحث لحماية الخصوصية.</span>
        </div>

        <p className="text-zinc-800 text-[10px] mt-16 font-mono tracking-widest uppercase">
          ERROR_CODE: SEC_TOKEN_INVALID
        </p>
      </div>
    );
  }

  // 4. Admin Login Portal Screen
  if (view === 'login') {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 5. Admin Control Dashboard (Fully Verified Access)
  return (
    <div id="admin-dashboard-view" className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col font-sans animate-fade-in" dir="rtl">
      
      {/* Top Navigation Bar */}
      <nav id="dashboard-navbar" className="bg-[#0c0c0e]/85 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="w-11 h-11 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white rounded-xl flex items-center justify-center transition cursor-pointer active:scale-95 shadow-md shadow-black/40 hover:border-red-600/30"
            title="فتح القائمة الجانبية"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          {/* Active Filter Indicators */}
          {(activeSection || activeCategory) && (
            <div className="flex items-center gap-2 py-1.5 px-3 bg-red-600/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 animate-fade-in">
              <span>تصفية: {activeSection} {activeCategory ? `‹ ${activeCategory}` : ''}</span>
              <button
                onClick={() => {
                  setActiveSection(null);
                  setActiveCategory(null);
                }}
                className="hover:text-red-300 font-extrabold pr-1.5 mr-1.5 border-r border-red-500/15 cursor-pointer leading-none text-base"
                title="إلغاء التصفية"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#050507] hover:bg-[#121215] border border-zinc-850 hover:text-red-400 text-zinc-400 text-[11px] font-semibold rounded-xl transition cursor-pointer"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Collapsible Sidebar component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectCategory={(section, category) => {
          setActiveSection(section || null);
          setActiveCategory(category);
        }}
        activeSection={activeSection}
        activeCategory={activeCategory}
      />

      {/* Primary Dashboard Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Metric Summary Widgets */}
        <div id="dashboard-widgets" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c0c0e]/80 border border-zinc-800/80 p-6 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-350 hover:border-zinc-700/80">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">المواد بالمكتبة</p>
              <h3 className="text-3xl font-extrabold text-zinc-100 font-sans">{stats.totalItems}</h3>
              <p className="text-[10px] text-zinc-600 mt-1.5">أفلام ومسلسلات تم تخزينها</p>
            </div>
            <div className="w-12 h-12 bg-[#050507] rounded-2xl flex items-center justify-center border border-zinc-800 text-zinc-400 shadow-inner">
              <Tv className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c0c0e]/80 border border-zinc-800/80 p-6 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-350 hover:border-zinc-700/80">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">روابط المشاهدة المولدة</p>
              <h3 className="text-3xl font-extrabold text-red-500 font-sans">{stats.totalTokens}</h3>
              <p className="text-[10px] text-zinc-600 mt-1.5">روابط مشفرة آمنة تم تداولها</p>
            </div>
            <div className="w-12 h-12 bg-[#050507] rounded-2xl flex items-center justify-center border border-zinc-800 text-red-500 shadow-inner">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c0c0e]/80 border border-zinc-800/80 p-6 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-350 hover:border-zinc-700/80">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">إجمالي الزيارات والمشاهدات</p>
              <h3 className="text-3xl font-extrabold text-emerald-500 font-sans">{stats.totalViews}</h3>
              <p className="text-[10px] text-zinc-600 mt-1.5">إجمالي نقرات المستخدمين الفعالة</p>
            </div>
            <div className="w-12 h-12 bg-[#050507] rounded-2xl flex items-center justify-center border border-zinc-800 text-emerald-500 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Quick Search Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex gap-2.5">
            <button
              id="tab-library"
              onClick={() => { setActiveTab('library'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                  : 'bg-[#0c0c0e]/80 hover:bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              مكتبة الأفلام والمسلسلات
            </button>
            <button
              id="tab-links"
              onClick={() => { setActiveTab('links'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 relative cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                  : 'bg-[#0c0c0e]/80 hover:bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              الروابط النشطة والسرية
              {tokens.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 bg-red-600 border border-zinc-950 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {tokens.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'library' && (
              <button
                id="add-new-item-btn"
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-950/20 shrink-0 cursor-pointer transition-all active:scale-95"
              >
                <span>إضافة فيلم أو مسلسل جديد</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="relative w-full md:w-64">
              <input
                id="dashboard-search-input"
                type="text"
                placeholder={activeTab === 'library' ? "بحث عن فيلم أو مسلسل..." : "بحث عن اسم الرابط..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-[#0c0c0e] border border-zinc-800 focus:border-red-600 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition duration-150"
              />
              <Search className="w-3.5 h-3.5 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* TAB CONTENTS */}
        
        {/* TAB 1: LIBRARY LISTINGS */}
        {activeTab === 'library' && (
          <div id="library-tab-content">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-[#0c0c0e]/40 border border-dashed border-zinc-800 rounded-2xl">
                <Film className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-zinc-300">لا توجد مواد عرض مضافة بالمواصفات</h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  قم بإضافة أفلام أو مسلسلات جديدة لتبدأ في توليد الروابط المشفرة لها ومشاركتها مع المتابعين بسرية كاملة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-[#0c0c0e]/80 hover:bg-[#121215]/90 border border-zinc-800/80 rounded-2xl overflow-hidden p-5 flex flex-col sm:flex-row gap-5 transition-all duration-300 group shadow-md"
                  >
                    {/* Media Cover Image */}
                    <div className="w-full sm:w-28 h-40 bg-[#050507] rounded-xl overflow-hidden shrink-0 border border-zinc-800/60 relative shadow-inner">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-bold rounded-lg tracking-wide ${
                        item.type === 'movie' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {item.type === 'movie' ? 'فيلم' : 'مسلسل'}
                      </span>
                    </div>

                    {/* Media Meta details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-zinc-200 text-sm group-hover:text-red-500 transition-colors duration-200">{item.title}</h3>
                        <p className="text-xs text-zinc-500 font-light mt-2 line-clamp-3 leading-relaxed">{item.description || 'لا يوجد ملخص أو قصة مضافة حالياً.'}</p>
                        
                        {item.type === 'series' && item.episodes && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-lg">
                              {item.episodes.length} حلقات مضافة
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Control panel buttons per item */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/60 flex-wrap">
                        <button
                          id={`quick-generate-token-${item.id}`}
                          onClick={() => {
                            setTokenPreselectedItem(item);
                            setIsTokenModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/15 text-red-400 hover:text-white text-[11px] font-bold rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>توليد رابط مخصص</span>
                        </button>
                        
                        <button
                          id={`edit-item-${item.id}`}
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#050507] hover:bg-[#121215] border border-zinc-850 hover:border-zinc-750 text-zinc-300 text-[11px] font-medium rounded-xl transition cursor-pointer active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>تعديل</span>
                        </button>

                        <button
                          id={`delete-item-${item.id}`}
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#050507] hover:bg-red-950/20 border border-zinc-850 hover:border-red-900/40 text-zinc-500 hover:text-red-400 text-[11px] font-medium rounded-xl transition mr-auto cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE SHARING TOKENS LIST */}
        {activeTab === 'links' && (
          <div id="links-tab-content">
            {tokens.length === 0 ? (
              <div className="text-center py-20 bg-[#0c0c0e]/40 border border-dashed border-zinc-800 rounded-2xl">
                <LinkIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4 animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-300">لا توجد روابط سرية مولدة حالياً</h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  قم بإنشاء رابط سري من تبويب "مكتبة الوسائط" أو انقر الزر أدناه لتوليد رابط مشاهدة آمن لفيلم أو حلقة محددة ومشاركته فوراً.
                </p>
                <button
                  id="tab-links-generate-btn"
                  onClick={() => {
                    setTokenPreselectedItem(null);
                    setIsTokenModalOpen(true);
                  }}
                  className="mt-6 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/20 active:scale-95 transition-all"
                >
                  <span>توليد رابط مشاهدة خاص الآن</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-[#0c0c0e]/85 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#050507] border-b border-zinc-800 text-zinc-400 text-[11px] font-bold">
                        <th className="p-4">اسم الرابط / المادة المستهدفة</th>
                        <th className="p-4 text-center">الزيارات / الحد الأقصى</th>
                        <th className="p-4 text-center">حالة الصلاحية</th>
                        <th className="p-4 text-center">التفعيل المؤقت</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-xs">
                      {tokens.map(token => {
                        const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();
                        const isOverLimit = token.maxViews !== null && token.views >= token.maxViews;
                        
                        return (
                          <tr key={token.id} className="hover:bg-[#121215]/50 transition">
                            {/* Token Identity */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-14 bg-[#050507] rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                                  <img
                                    src={getTargetPoster(token)}
                                    alt="Target"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-zinc-200 text-xs">
                                    {token.title || 'رابط سري بدون عنوان'}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                                    <span className="shrink-0 text-red-400 font-bold text-[10px]">العرض:</span>
                                    <span className="truncate max-w-xs">{getTokenTargetName(token)}</span>
                                  </div>
                                  <div className="text-[10px] text-zinc-600 font-mono mt-1 truncate max-w-xs" dir="ltr">
                                    id: {token.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Views */}
                            <td className="p-4 text-center font-mono">
                              <div className="font-bold text-zinc-200 text-sm">{token.views}</div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                حد أقصى: {token.maxViews !== null ? `${token.maxViews} مرات` : 'مفتوح'}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4 text-center">
                              {isExpired ? (
                                <span className="px-2.5 py-1 bg-red-950/20 text-red-500 border border-red-900/30 rounded-lg text-[10px] font-bold">
                                  منتهي المدة
                                </span>
                              ) : isOverLimit ? (
                                <span className="px-2.5 py-1 bg-amber-950/20 text-amber-500 border border-amber-900/30 rounded-lg text-[10px] font-bold">
                                  تجاوز الحد
                                </span>
                              ) : !token.isActive ? (
                                <span className="px-2.5 py-1 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-lg text-[10px] font-bold">
                                  معطل يدوياً
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded-lg text-[10px] font-bold animate-pulse">
                                  نشط ومتاح
                                </span>
                              )}
                            </td>

                            {/* Enable / Disable toggle button */}
                            <td className="p-4 text-center">
                              <button
                                id={`toggle-token-${token.id}`}
                                onClick={() => handleToggleToken(token.id)}
                                className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
                                  token.isActive 
                                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/30' 
                                    : 'bg-[#050507] text-zinc-600 border-zinc-800 hover:text-zinc-400'
                                }`}
                                title={token.isActive ? 'تعطيل الرابط مؤقتاً' : 'تفعيل الرابط'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* Copy & Revoke actions */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  id={`copy-token-${token.id}`}
                                  onClick={() => handleCopyTokenUrl(token.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                                    copiedTokenId === token.id
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#050507] hover:bg-[#121215] border border-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  {copiedTokenId === token.id ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>تم!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>نسخ الرابط</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  id={`delete-token-${token.id}`}
                                  onClick={() => handleDeleteToken(token.id, token.title)}
                                  className="p-1.5 bg-[#050507] hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg transition cursor-pointer active:scale-95"
                                  title="حذف وإلغاء الرابط نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#050507] py-6 text-center text-[11px] text-zinc-600">
        بوابة العرض السينمائي السرية • تتبع جميع الروابط المشتركة خاضع لرقابة الخادم
      </footer>

      {/* ALL MODAL DIALOGS */}
      
      {/* 1. Add / Edit Media Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <ItemFormModal
            isOpen={isItemModalOpen}
            onClose={() => {
              setIsItemModalOpen(false);
              setEditingItem(null);
            }}
            onSave={handleSaveItem}
            editingItem={editingItem}
          />
        )}
      </AnimatePresence>

      {/* 2. Generate sharing Token Modal */}
      <AnimatePresence>
        {isTokenModalOpen && (
          <TokenGeneratorModal
            isOpen={isTokenModalOpen}
            onClose={() => {
              setIsTokenModalOpen(false);
              setTokenPreselectedItem(null);
            }}
            onGenerate={handleGenerateToken}
            items={items}
            preselectedItem={tokenPreselectedItem}
          />
        )}
      </AnimatePresence>

      {/* 3. Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <div id="confirm-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <motion.div
              id="confirm-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c0c0e] border border-zinc-850 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-right"
              dir="rtl"
            >
              {/* Icon & Title */}
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-zinc-100">{confirmModal.title}</h3>
                  <p className="text-xs text-zinc-400 font-light leading-relaxed px-2">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#050507] border-t border-zinc-800/60 flex gap-3 text-xs font-bold">
                <button
                  id="confirm-cancel-btn"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition border border-zinc-800/80 cursor-pointer active:scale-95 text-center"
                >
                  إلغاء
                </button>
                <button
                  id="confirm-ok-btn"
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition shadow-md shadow-red-950/20 cursor-pointer active:scale-95 text-center"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
