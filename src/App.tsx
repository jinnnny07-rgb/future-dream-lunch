/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_BOOKINGS, 
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
  subscribeAdminSettingsFromFirestore 
} from './firebase';
import { getKSTDateString, isBookingFromTodayKST } from './utils';
import { Navbar } from './components/Navbar';
import { NoticeBanner } from './components/NoticeBanner';
import { AcademyHero } from './components/AcademyHero';
import { BookingForm } from './components/BookingForm';
import { LiveSummaryWidget } from './components/LiveSummaryWidget';
import { AdminPanel } from './components/AdminPanel';
import { ShareModal } from './components/ShareModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ShieldCheck, User, Sparkles, Lock, Clock } from 'lucide-react';

const MENU_DATA_VERSION = 'v4_20260917_remove_chingmarei_voucher_notice';
const BOOKINGS_CLEARED_VERSION = 'v5_20260918_immediate_clear_bookings';
const KST_RESET_DATE_KEY = 'app_bookings_last_reset_kst';

const getDeletedBookingIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('app_deleted_booking_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.error(e);
  }
  return new Set();
};

const markBookingAsDeleted = (id: string) => {
  try {
    const set = getDeletedBookingIds();
    set.add(id);
    localStorage.setItem('app_deleted_booking_ids', JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(e);
  }
};

const unmarkBookingAsDeleted = (id: string) => {
  try {
    const set = getDeletedBookingIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem('app_deleted_booking_ids', JSON.stringify(Array.from(set)));
    }
  } catch (e) {
    console.error(e);
  }
};

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

  const [bookings, setBookings] = useState<Booking[]>(() => {
    // 1. One-time immediate clear version check (Requirement 1)
    if (localStorage.getItem('app_bookings_cleared_version') !== BOOKINGS_CLEARED_VERSION) {
      localStorage.setItem('app_bookings', '[]');
      localStorage.removeItem('app_deleted_booking_ids');
      localStorage.setItem('app_bookings_cleared_version', BOOKINGS_CLEARED_VERSION);
      return [];
    }

    // 2. Midnight check (Requirement 2)
    const todayKST = getKSTDateString();
    const lastReset = localStorage.getItem(KST_RESET_DATE_KEY);
    if (lastReset && lastReset !== todayKST) {
      localStorage.setItem('app_bookings', '[]');
      localStorage.setItem(KST_RESET_DATE_KEY, todayKST);
      return [];
    }

    // 3. Filter valid bookings for today KST
    const saved = localStorage.getItem('app_bookings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b: Booking) => isBookingFromTodayKST(b, todayKST));
        }
      } catch (e) {
        console.error('Error parsing stored bookings:', e);
      }
    }
    return [];
  });

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

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('app_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem('app_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('app_notices', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  useEffect(() => {
    localStorage.setItem('app_seo_config', JSON.stringify(seoConfig));
  }, [seoConfig]);

  // 1. One-time immediate cleanup of all legacy stored bookings from Firestore & localStorage (Requirement 1)
  useEffect(() => {
    const runImmediateClear = async () => {
      const alreadyCleared = sessionStorage.getItem('firestore_initial_clear_done_20260918');
      if (!alreadyCleared) {
        try {
          console.log('[Init] Executing requested immediate deletion of all legacy bookings...');
          await clearAllBookingsFromFirestore();
          setBookings([]);
          localStorage.setItem('app_bookings', '[]');
          localStorage.removeItem('app_deleted_booking_ids');
          sessionStorage.setItem('firestore_initial_clear_done_20260918', 'true');
        } catch (e) {
          console.warn('Initial clearAllBookingsFromFirestore warning:', e);
        }
      }
    };
    runImmediateClear();
  }, []);

  // 2. Automatic Midnight KST (00:00) Rollover Checker (Cron-like interval) (Requirement 2)
  useEffect(() => {
    const checkMidnightReset = async () => {
      const todayKST = getKSTDateString();
      const lastResetDate = localStorage.getItem(KST_RESET_DATE_KEY);

      if (lastResetDate && lastResetDate !== todayKST) {
        console.log(`[KST Midnight Reset] Rollover detected (${lastResetDate} -> ${todayKST}). Clearing all bookings.`);
        try {
          await clearAllBookingsFromFirestore();
          setBookings([]);
          localStorage.setItem('app_bookings', '[]');
          localStorage.removeItem('app_deleted_booking_ids');
          localStorage.setItem(KST_RESET_DATE_KEY, todayKST);
          await saveAdminSettingsToFirestore({ lastResetDateKST: todayKST });
        } catch (err) {
          console.error('[KST Midnight Reset] Failed to clear bookings:', err);
        }
      } else if (!lastResetDate) {
        localStorage.setItem(KST_RESET_DATE_KEY, todayKST);
      }
    };

    checkMidnightReset();
    const intervalId = setInterval(checkMidnightReset, 15000); // Check every 15s
    return () => clearInterval(intervalId);
  }, []);

  // 3. Real-time Firestore synchronization for Bookings and Admin Settings
  useEffect(() => {
    // 1. Subscribe to Bookings from Firestore with automatic KST day filter & zero-resurrection
    const unsubscribeBookings = subscribeBookingsFromFirestore((remoteBookings) => {
      if (remoteBookings && Array.isArray(remoteBookings)) {
        const todayKST = getKSTDateString();
        const activeTodayBookings: Booking[] = [];
        const staleBookingIds: string[] = [];

        remoteBookings.forEach((b) => {
          if (isBookingFromTodayKST(b, todayKST)) {
            activeTodayBookings.push(b);
          } else {
            staleBookingIds.push(b.id);
          }
        });

        // Automatically purge stale bookings from past days from Firestore in background
        if (staleBookingIds.length > 0) {
          console.log(`[Firestore] Purging ${staleBookingIds.length} stale bookings from previous days:`, staleBookingIds);
          staleBookingIds.forEach((id) => {
            deleteBookingFromFirestore(id).catch(() => {});
          });
        }

        // Sort active today bookings (newest first)
        activeTodayBookings.sort((a, b) => {
          const timeA = (a as any).updatedAt || parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const timeB = (b as any).updatedAt || parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return timeB - timeA;
        });

        setBookings(activeTodayBookings);
        try {
          localStorage.setItem('app_bookings', JSON.stringify(activeTodayBookings));
        } catch (e) {
          console.error('Failed to write bookings to localStorage:', e);
        }
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
      localStorage.setItem('app_bookings', '[]');
      localStorage.removeItem('app_deleted_booking_ids');
      console.log('[Firestore] All bookings cleared.');
    } catch (err) {
      console.error('Failed to clear all bookings:', err);
      setBookings([]);
      localStorage.setItem('app_bookings', '[]');
    }
  };

  const handleAddBooking = async (newBooking: Booking) => {
    unmarkBookingAsDeleted(newBooking.id);

    const sanitizedBooking: Booking = {
      ...newBooking,
      memo: newBooking.memo ? newBooking.memo.trim() : '',
      companions: newBooking.companions || [],
      rawCompanions: newBooking.rawCompanions || [],
    };

    // 1. Immediately update state and save to localStorage synchronously
    setBookings((prev) => {
      const updated = [sanitizedBooking, ...prev.filter((b) => b.id !== sanitizedBooking.id)];
      try {
        localStorage.setItem('app_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
      return updated;
    });

    // 2. Persist to Firestore so all students and admin browsers receive it in real-time
    try {
      await saveBookingToFirestore(sanitizedBooking);
    } catch (err) {
      console.warn('Failed to sync booking to Firestore, but preserved in localStorage:', err);
    }
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    const sanitized: Booking = {
      ...updatedBooking,
      memo: updatedBooking.memo ? updatedBooking.memo.trim() : '',
      companions: updatedBooking.companions || [],
      rawCompanions: updatedBooking.rawCompanions || [],
    };

    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === sanitized.id ? sanitized : b));
      try {
        localStorage.setItem('app_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage update error:', e);
      }
      return updated;
    });

    try {
      await updateBookingInFirestore(sanitized);
    } catch (err) {
      console.warn('Failed to update booking in Firestore, but preserved in localStorage:', err);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    markBookingAsDeleted(bookingId);

    setBookings((prev) => {
      const updated = prev.filter((b) => b.id !== bookingId);
      try {
        localStorage.setItem('app_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage delete error:', e);
      }
      return updated;
    });

    try {
      await deleteBookingFromFirestore(bookingId);
    } catch (err) {
      console.warn('Failed to delete booking from Firestore, but updated in localStorage:', err);
    }
  };

  const handleSaveAllAdminData = async () => {
    try {
      localStorage.setItem('app_restaurants', JSON.stringify(restaurants));
      localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
      localStorage.setItem('app_notices', JSON.stringify(notices));
      localStorage.setItem('app_seo_config', JSON.stringify(seoConfig));
      localStorage.setItem('app_bookings', JSON.stringify(bookings));
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
      console.log('Admin settings saved to Firestore');
    } catch (err) {
      console.error('Failed to sync admin settings to Firestore:', err);
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
