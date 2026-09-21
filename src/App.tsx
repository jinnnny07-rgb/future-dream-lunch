/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_NOTICES, 
  DEFAULT_THEME_CONFIG, 
  DEFAULT_SEO_CONFIG 
} from './mockData';
import { Restaurant, Booking, Notice, ThemeConfig, SeoConfig } from './types';
import { 
  saveBookingToFirestore, 
  updateBookingInFirestore, 
  deleteBookingFromFirestore, 
  clearAllBookingsFromFirestore,
  subscribeBookingsFromFirestore, 
  saveAdminSettingsToFirestore, 
  subscribeAdminSettingsFromFirestore,
  subscribeQuotaStatus,
  isFirestoreQuotaExhausted,
  resetFirestoreQuotaCheck
} from './firebase';
import { 
  getKSTDateString, 
  isBookingFromTodayKST, 
  getCurrentDateTimeString 
} from './utils';
import { Navbar } from './components/Navbar';
import { NoticeBanner } from './components/NoticeBanner';
import { AcademyHero } from './components/AcademyHero';
import { BookingForm } from './components/BookingForm';
import { LiveSummaryWidget } from './components/LiveSummaryWidget';
import { AdminPanel } from './components/AdminPanel';
import { ShareModal } from './components/ShareModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ShieldCheck, User, Sparkles, Lock, Clock, AlertTriangle, CloudOff } from 'lucide-react';

const MENU_DATA_VERSION = 'v4_20260917_remove_chingmarei_voucher_notice';
const KST_RESET_DATE_KEY = 'app_bookings_last_reset_kst';

export default function App() {
  // Persistent State (localStorage with initial fallbacks)
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const version = localStorage.getItem('app_menu_version');
    if (version !== MENU_DATA_VERSION) {
      localStorage.setItem('app_restaurants', JSON.stringify(INITIAL_RESTAURANTS));
      localStorage.setItem('app_menu_version', MENU_DATA_VERSION);
      return INITIAL_RESTAURANTS;
    }

    const saved = localStorage.getItem('app_restaurants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: Partial<Restaurant>) => ({
            id: r.id || 'rest-' + Date.now(),
            name: r.name || '식당',
            category: r.category || '일반음식점',
            description: r.description || '',
            voucherOnly: false,
            voucherNotice: r.voucherNotice || '',
            iconName: r.iconName || 'Store',
            tel: r.tel || '',
            menus: Array.isArray(r.menus) ? r.menus : [],
          }));
        }
      } catch (e) {
        console.error('Error parsing stored restaurants:', e);
      }
    }
    return INITIAL_RESTAURANTS;
  });

  // 1. Single Source of Truth for bookings: Database (Firestore) only.
  // Never initialize from mock data or stale localStorage so deletions in DB are strictly respected across all devices and refreshes.
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isBookingsLoaded, setIsBookingsLoaded] = useState<boolean>(false);

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('app_notices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored notices:', e);
      }
    }
    return INITIAL_NOTICES;
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('app_theme_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      } catch (e) {
        console.error('Error parsing stored themeConfig:', e);
      }
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [seoConfig, setSeoConfig] = useState<SeoConfig>(() => {
    const saved = localStorage.getItem('app_seo_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SEO_CONFIG, ...parsed };
      } catch (e) {
        console.error('Error parsing stored seoConfig:', e);
      }
    }
    return DEFAULT_SEO_CONFIG;
  });

  // UI State & Admin Auth State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [sharingBooking, setSharingBooking] = useState<Booking | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() => isFirestoreQuotaExhausted());

  // Admin access handler protected with PIN
  const handleRequestAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      return;
    }

    if (isAdminAuthenticated) {
      setIsAdminMode(true);
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAdminAuthModalOpen(false);
    setIsAdminMode(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setIsAdminMode(false);
  };

  // Clean up any legacy localStorage bookings or quota flags on load
  useEffect(() => {
    try {
      localStorage.removeItem('app_bookings');
      localStorage.removeItem('firestore_quota_exhausted_timestamp');
    } catch (e) {}
  }, []);

  // Sync admin settings to localStorage for local fast preview
  useEffect(() => {
    localStorage.setItem('app_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem('app_notices', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  useEffect(() => {
    localStorage.setItem('app_seo_config', JSON.stringify(seoConfig));
  }, [seoConfig]);

  // 1. Automatic Midnight KST (00:00) Rollover Listener
  // Periodically checks if the KST calendar day has advanced to a new day.
  // When midnight passes, the displayed list resets cleanly for the new day.
  useEffect(() => {
    let lastDateKST = getKSTDateString();

    const intervalId = setInterval(() => {
      const currentDateKST = getKSTDateString();
      if (currentDateKST !== lastDateKST) {
        console.log(`[KST Midnight Rollover] New day detected in KST: ${lastDateKST} -> ${currentDateKST}`);
        lastDateKST = currentDateKST;
        setBookings((prev) => prev.filter((b) => isBookingFromTodayKST(b, currentDateKST)));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  // 2. Real-time Firestore synchronization for Bookings, Admin Settings, and Quota State
  useEffect(() => {
    // Listen for Firestore quota availability changes
    const unsubscribeQuota = subscribeQuotaStatus((exhausted) => {
      setIsQuotaExhausted(exhausted);
    });

    // 1. Subscribe to Bookings from Firestore with real-time multi-device sync
    const unsubscribeBookings = subscribeBookingsFromFirestore((remoteBookings) => {
      if (remoteBookings && Array.isArray(remoteBookings)) {
        const todayKST = getKSTDateString();
        const activeTodayBookings: Booking[] = [];

        // Strictly keep only bookings for today (KST)
        remoteBookings.forEach((b) => {
          if (isBookingFromTodayKST(b, todayKST)) {
            activeTodayBookings.push(b);
          }
        });

        // Sort active today bookings (newest first)
        activeTodayBookings.sort((a, b) => {
          const timeA = (a as any).updatedAt || parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const timeB = (b as any).updatedAt || parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return timeB - timeA;
        });

        setBookings(activeTodayBookings);
        setIsBookingsLoaded(true);
      }
    });

    // 2. Subscribe to Admin Settings from Firestore (restaurants, notices, theme, seo)
    const unsubscribeSettings = subscribeAdminSettingsFromFirestore((remoteSettings) => {
      if (remoteSettings) {
        if (Array.isArray(remoteSettings.restaurants) && remoteSettings.restaurants.length > 0) {
          setRestaurants(remoteSettings.restaurants);
          try {
            localStorage.setItem('app_restaurants', JSON.stringify(remoteSettings.restaurants));
          } catch (e) {
            console.error(e);
          }
        }
        if (Array.isArray(remoteSettings.notices) && remoteSettings.notices.length > 0) {
          setNotices(remoteSettings.notices);
          try {
            localStorage.setItem('app_notices', JSON.stringify(remoteSettings.notices));
          } catch (e) {
            console.error(e);
          }
        }
        if (remoteSettings.themeConfig) {
          setThemeConfig((prev) => ({ ...prev, ...remoteSettings.themeConfig }));
          try {
            localStorage.setItem('app_theme_config', JSON.stringify(remoteSettings.themeConfig));
          } catch (e) {
            console.error(e);
          }
        }
        if (remoteSettings.seoConfig) {
          setSeoConfig((prev) => ({ ...prev, ...remoteSettings.seoConfig }));
          try {
            localStorage.setItem('app_seo_config', JSON.stringify(remoteSettings.seoConfig));
          } catch (e) {
            console.error(e);
          }
        }
        if (remoteSettings.lastResetDateKST) {
          localStorage.setItem(KST_RESET_DATE_KEY, remoteSettings.lastResetDateKST);
        }
      }
    });

    return () => {
      unsubscribeQuota();
      unsubscribeBookings();
      unsubscribeSettings();
    };
  }, []);

  // Apply Theme CSS variables and dark mode to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeConfig.primaryColor);
    root.style.setProperty('--secondary-color', themeConfig.secondaryColor);
    root.style.setProperty('--accent-color', themeConfig.accentColor || '#3b82f6');
    root.style.setProperty('--font-family', themeConfig.font);

    if (themeConfig.isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
  }, [themeConfig]);

  // Apply SEO tags to document
  useEffect(() => {
    document.title = seoConfig.metaTitle || themeConfig.siteTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seoConfig.metaDescription);

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', seoConfig.keywords);
  }, [seoConfig, themeConfig.siteTitle]);

  // Handlers
  const handleToggleTheme = () => {
    setThemeConfig((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  const handleUpdateRestaurants = (updated: Restaurant[]) => {
    setRestaurants(updated);
    try {
      localStorage.setItem('app_restaurants', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    saveAdminSettingsToFirestore({ restaurants: updated }).catch((err) =>
      console.warn('Failed to sync updated restaurants to Firestore:', err)
    );
  };

  const handleUpdateNotices = (updated: Notice[]) => {
    setNotices(updated);
    try {
      localStorage.setItem('app_notices', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    saveAdminSettingsToFirestore({ notices: updated }).catch((err) =>
      console.warn('Failed to sync updated notices to Firestore:', err)
    );
  };

  const handleUpdateThemeConfig = (updated: Partial<ThemeConfig>) => {
    setThemeConfig((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('app_theme_config', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      saveAdminSettingsToFirestore({ themeConfig: next }).catch((err) =>
        console.warn('Failed to sync updated theme to Firestore:', err)
      );
      return next;
    });
  };

  const handleResetTheme = () => {
    setThemeConfig(DEFAULT_THEME_CONFIG);
    try {
      localStorage.setItem('app_theme_config', JSON.stringify(DEFAULT_THEME_CONFIG));
    } catch (e) {
      console.error(e);
    }
    saveAdminSettingsToFirestore({ themeConfig: DEFAULT_THEME_CONFIG }).catch(console.warn);
  };

  const handleUpdateSeoConfig = (updated: SeoConfig) => {
    setSeoConfig(updated);
    try {
      localStorage.setItem('app_seo_config', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    saveAdminSettingsToFirestore({ seoConfig: updated }).catch((err) =>
      console.warn('Failed to sync updated SEO config to Firestore:', err)
    );
  };

  const handleClearAllBookings = async () => {
    try {
      await clearAllBookingsFromFirestore();
      setBookings([]);
      console.log('[Firestore DB] All bookings successfully deleted from database.');
    } catch (err) {
      console.error('[Firestore DB] Failed to clear all bookings:', err);
      throw err;
    }
  };

  const handleAddBooking = async (newBooking: Booking) => {
    const now = new Date();
    const todayKST = getKSTDateString(now);
    const sanitizedBooking: Booking = {
      ...newBooking,
      bookingDateKST: newBooking.bookingDateKST || todayKST,
      createdAt: newBooking.createdAt || getCurrentDateTimeString(now),
      updatedAt: newBooking.updatedAt || Date.now(),
      memo: newBooking.memo ? newBooking.memo.trim() : '',
      companions: newBooking.companions || [],
      rawCompanions: newBooking.rawCompanions || [],
    };

    // 1. Optimistically update local state
    setBookings((prev) => [sanitizedBooking, ...prev.filter((b) => b.id !== sanitizedBooking.id)]);

    // 2. Persist to Firestore DB (Single Source of Truth)
    try {
      await saveBookingToFirestore(sanitizedBooking);
      console.log('[Firestore DB] Booking saved to DB:', sanitizedBooking.id);
    } catch (err) {
      console.error('[Firestore DB] Failed to save booking to DB:', err);
      throw err;
    }
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    const todayKST = getKSTDateString();
    const sanitized: Booking = {
      ...updatedBooking,
      bookingDateKST: updatedBooking.bookingDateKST || todayKST,
      updatedAt: Date.now(),
      memo: updatedBooking.memo ? updatedBooking.memo.trim() : '',
      companions: updatedBooking.companions || [],
      rawCompanions: updatedBooking.rawCompanions || [],
    };

    setBookings((prev) => prev.map((b) => (b.id === sanitized.id ? sanitized : b)));

    try {
      await updateBookingInFirestore(sanitized);
      console.log('[Firestore DB] Booking updated in DB:', sanitized.id);
    } catch (err) {
      console.error('[Firestore DB] Failed to update booking in DB:', err);
      throw err;
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    // 1. Optimistic UI update
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    // 2. Direct Firestore deleteDoc execution on database
    try {
      await deleteBookingFromFirestore(bookingId);
      console.log('[Firestore DB] Booking successfully deleted from DB:', bookingId);
    } catch (err) {
      console.error('[Firestore DB] Failed to delete booking from DB:', err);
      throw err;
    }
  };

  const handleSaveAllAdminData = async () => {
    try {
      localStorage.setItem('app_restaurants', JSON.stringify(restaurants));
      localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
      localStorage.setItem('app_notices', JSON.stringify(notices));
      localStorage.setItem('app_seo_config', JSON.stringify(seoConfig));
    } catch (e) {
      console.error(e);
    }

    // Sync admin configurations to Firestore
    try {
      await saveAdminSettingsToFirestore({
        restaurants,
        themeConfig,
        notices,
        seoConfig,
        lastResetDateKST: getKSTDateString(),
      });
      console.log('[Firestore DB] Admin settings saved to DB');
    } catch (err) {
      console.error('[Firestore DB] Failed to sync admin settings to DB:', err);
    }
  };

  const totalHeadcount = bookings.reduce((sum, b) => sum + b.headcount, 0);

  const scrollToForm = () => {
    const el = document.getElementById('student-lunch-booking-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToNotices = () => {
    const el = document.getElementById('notice-announcement-banner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Navigation Bar */}
      <Navbar
        isAdminMode={isAdminMode}
        isAdminAuthenticated={isAdminAuthenticated}
        onToggleAdmin={handleRequestAdminMode}
        onLogoutAdmin={handleAdminLogout}
        themeConfig={themeConfig}
        onToggleTheme={handleToggleTheme}
        totalBookings={bookings.length}
        totalHeadcount={totalHeadcount}
      />

      {/* 2. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Shinsegae Future & Dream Academy Intro Hero Section */}
        <AcademyHero
          themeConfig={themeConfig}
          totalHeadcount={totalHeadcount}
          totalBookings={bookings.length}
          onScrollToForm={scrollToForm}
          onScrollToNotices={scrollToNotices}
        />

        {/* Notice Announcement Banner */}
        <NoticeBanner
          notices={notices}
          themeConfig={themeConfig}
          onSelectAdminNoticeTab={handleRequestAdminMode}
        />

        {/* Firestore Quota Notice / Local Offline Fallback Banner */}
        {isQuotaExhausted && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs shadow-xs animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold">로컬 안전 저장 모드 작동 중:</span> Firebase 일일 무료 할당량(Quota) 일시 초과로 인해 안전한 로컬 저장 모드로 전환되었습니다. 점심 신청 및 관리 기능은 정상 작동하며, 입력하신 데이터는 안전하게 보존됩니다.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded">
                데이터 보호 활성
              </span>
              <button
                onClick={resetFirestoreQuotaCheck}
                className="px-2.5 py-0.5 text-[11px] font-bold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                title="Firebase 동기화 재연결 시도"
              >
                동기화 재시도
              </button>
            </div>
          </div>
        )}

        {/* View Mode Switching Notice Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              현재 모드:
            </span>
            <span 
              className="px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center shadow-xs"
              style={{
                backgroundColor: isAdminMode ? '#dc2626' : themeConfig.primaryColor,
                color: '#ffffff',
              }}
            >
              {isAdminMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  관리자 모드 (대시보드 CMS 활성화)
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 mr-1" />
                  교육생 점심 신청 모드
                </>
              )}
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <Clock className="w-3 h-3 mr-1 text-emerald-500" />
              매일 자정(00:00 KST) 신청 내역 자동 초기화
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isAdminMode && (
              <button
                onClick={handleAdminLogout}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline flex items-center"
              >
                관리자 로그아웃(잠금)
              </button>
            )}
            <button
              onClick={handleRequestAdminMode}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline flex items-center"
            >
              {isAdminMode ? '← 일반 사용자 신청 화면으로 전환' : '🔒 관리자 패널로 전환 (PIN 필요) →'}
            </button>
          </div>
        </div>

        {/* Conditional View or Split View */}
        {isAdminMode ? (
          /* ADMIN MODE VIEW */
          <div className="space-y-8 animate-fade-in">
            <AdminPanel
              restaurants={restaurants}
              onUpdateRestaurants={handleUpdateRestaurants}
              bookings={bookings}
              onUpdateBookings={setBookings}
              onUpdateBooking={handleUpdateBooking}
              onDeleteBooking={handleDeleteBooking}
              onAddBooking={handleAddBooking}
              onClearAllBookings={handleClearAllBookings}
              notices={notices}
              onUpdateNotices={handleUpdateNotices}
              themeConfig={themeConfig}
              onUpdateThemeConfig={handleUpdateThemeConfig}
              onResetTheme={handleResetTheme}
              seoConfig={seoConfig}
              onUpdateSeoConfig={handleUpdateSeoConfig}
              onCloseAdmin={() => setIsAdminMode(false)}
              onSaveAll={handleSaveAllAdminData}
            />

            {/* Also show summary widget underneath in admin mode for quick glance */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                현장 예약 현황 요약 미리보기
              </h3>
              <LiveSummaryWidget
                bookings={bookings}
                restaurants={restaurants}
                themeConfig={themeConfig}
                onOpenShareModal={(b) => setSharingBooking(b)}
              />
            </div>
          </div>
        ) : (
          /* USER MODE SPLIT VIEW (Left/Top: Application Form, Right/Bottom: Real-time Live Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: Student Lunch Booking Form (7 of 12 columns on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              <BookingForm
                restaurants={restaurants}
                themeConfig={themeConfig}
                onSubmitBooking={handleAddBooking}
                onOpenShareModal={(b) => setSharingBooking(b)}
              />
            </div>

            {/* Right Column: Real-time Live Summary & Reservation Copy (5 of 12 columns on desktop) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <LiveSummaryWidget
                bookings={bookings}
                restaurants={restaurants}
                themeConfig={themeConfig}
                onOpenShareModal={(b) => setSharingBooking(b)}
                onSelectAdminSummary={handleRequestAdminMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. Social Share Modal */}
      <ShareModal
        booking={sharingBooking}
        isOpen={!!sharingBooking}
        onClose={() => setSharingBooking(null)}
        themeConfig={themeConfig}
      />

      {/* 4. Admin PIN Authentication Lock Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        themeConfig={themeConfig}
        correctPin={themeConfig.adminPassword || '9707'}
      />

      {/* 4. Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {themeConfig.siteTitle} • {themeConfig.siteSubtitle}
          </p>
          <p className="text-[11px]">
            기본 지정 색상: 메인 (#2C2B70) / 서브 (#C6C4C3) | 1인당 기본 지원 식대: {themeConfig.budgetPerPerson?.toLocaleString()}원
          </p>
        </div>
      </footer>
    </div>
  );
}
