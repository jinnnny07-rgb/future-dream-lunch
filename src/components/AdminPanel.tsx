import React, { useState } from 'react';
import { 
  BarChart3, 
  Store, 
  Bell, 
  Palette, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Ticket, 
  PhoneCall, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  CheckCircle
} from 'lucide-react';
import { Restaurant, MenuItem, Booking, Notice, ThemeConfig, SeoConfig } from '../types';
import { formatKRW, generateRestaurantReservationText, copyToClipboard, getCurrentDateTimeString, formatDisplayCreatedAt } from '../utils';
import { EditBookingModal } from './EditBookingModal';
import { saveAdminSettingsToFirestore } from '../firebase';

interface AdminPanelProps {
  restaurants: Restaurant[];
  onUpdateRestaurants: (updated: Restaurant[]) => void;
  bookings: Booking[];
  onUpdateBookings: (updated: Booking[]) => void;
  onUpdateBooking?: (updated: Booking) => void;
  onDeleteBooking?: (id: string) => void;
  onAddBooking?: (newBooking: Booking) => void;
  onClearAllBookings?: () => Promise<void> | void;
  notices: Notice[];
  onUpdateNotices: (updated: Notice[]) => void;
  themeConfig: ThemeConfig;
  onUpdateThemeConfig: (updated: Partial<ThemeConfig>) => void;
  onResetTheme: () => void;
  seoConfig: SeoConfig;
  onUpdateSeoConfig: (updated: SeoConfig) => void;
  onCloseAdmin: () => void;
  onSaveAll?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  restaurants,
  onUpdateRestaurants,
  bookings,
  onUpdateBookings,
  onUpdateBooking,
  onDeleteBooking,
  onAddBooking,
  onClearAllBookings,
  notices,
  onUpdateNotices,
  themeConfig,
  onUpdateThemeConfig,
  onResetTheme,
  seoConfig,
  onUpdateSeoConfig,
  onCloseAdmin,
  onSaveAll,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'restaurants' | 'notices' | 'design' | 'seo'>('summary');
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  // Booking Edit Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState<boolean>(false);

  // Save Toast Feedback
  const [saveToast, setSaveToast] = useState<{
    show: boolean;
    message: string;
  } | null>(null);

  const triggerSaveNotification = (msg: string) => {
    setSaveToast({ show: true, message: msg });
    setTimeout(() => {
      setSaveToast(null);
    }, 4500);
  };

  // Direct localStorage helper so changes strictly survive page refresh (F5)
  const persistToStorage = (
    updatedRestaurants = restaurants,
    updatedTheme = themeConfig,
    updatedNotices = notices,
    updatedSeo = seoConfig,
    updatedBookings = bookings
  ) => {
    try {
      localStorage.setItem('app_restaurants', JSON.stringify(updatedRestaurants));
      localStorage.setItem('app_theme_config', JSON.stringify(updatedTheme));
      localStorage.setItem('app_notices', JSON.stringify(updatedNotices));
      localStorage.setItem('app_seo_config', JSON.stringify(updatedSeo));
      localStorage.setItem('app_bookings', JSON.stringify(updatedBookings));

      // Asynchronously broadcast to Firestore so all clients get the latest settings
      saveAdminSettingsToFirestore({
        restaurants: updatedRestaurants,
        themeConfig: updatedTheme,
        notices: updatedNotices,
        seoConfig: updatedSeo,
      }).catch((e) => console.warn('Firestore settings broadcast warning:', e));
    } catch (err) {
      console.error('Failed to write to localStorage:', err);
    }
  };

  const handleSaveAll = () => {
    persistToStorage();
    if (onSaveAll) onSaveAll();
    triggerSaveNotification('모든 관리자 수정사항(식당 정보, 메뉴, 디자인 테마, 공지사항)이 저장되었습니다.');
  };

  const handleSaveAndGoToForm = () => {
    persistToStorage();
    if (onSaveAll) onSaveAll();
    triggerSaveNotification('수정사항이 저장되었습니다. 신청 화면으로 이동합니다.');
    setTimeout(() => {
      onCloseAdmin();
    }, 300);
  };

  // Notice Form State
  const [noticeForm, setNoticeForm] = useState<{
    id?: string;
    title: string;
    content: string;
    type: 'notice' | 'warning' | 'info';
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    type: 'notice',
    isPinned: true,
  });
  const [isEditingNotice, setIsEditingNotice] = useState<boolean>(false);

  // Restaurant & Menu Form State
  const [selectedRestIdForMenuEdit, setSelectedRestIdForMenuEdit] = useState<string>(
    restaurants[0]?.id || ''
  );

  // Inline menu item editing state
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuForm, setEditMenuForm] = useState<{
    name: string;
    price: number;
    description: string;
    isPopular: boolean;
  }>({
    name: '',
    price: 9000,
    description: '',
    isPopular: false,
  });

  // Add new menu item form
  const [newMenuForm, setNewMenuForm] = useState<{
    name: string;
    price: number;
    description: string;
    isPopular: boolean;
  }>({
    name: '',
    price: 9000,
    description: '',
    isPopular: false,
  });

  // Add new restaurant modal/form state
  const [isAddingRestaurant, setIsAddingRestaurant] = useState<boolean>(false);
  const [newRestaurantForm, setNewRestaurantForm] = useState<{
    name: string;
    category: string;
    description: string;
    tel: string;
  }>({
    name: '',
    category: '한식 / 일반음식점',
    description: '',
    tel: '',
  });

  // SEO Form State
  const [seoForm, setSeoForm] = useState<SeoConfig>({ ...seoConfig });
  const [seoSavedNotice, setSeoSavedNotice] = useState<boolean>(false);

  // Reservation copy handler
  const handleCopyReservationForRestaurant = async (restId: string) => {
    const rest = restaurants.find((r) => r.id === restId);
    if (!rest) return;
    const restBookings = bookings.filter((b) => b.restaurantId === rest.id);
    const text = generateRestaurantReservationText(rest, restBookings);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSuccess(restId);
      setTimeout(() => setCopiedSuccess(null), 2500);
    }
  };

  // Booking Status Change
  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (target && onUpdateBooking) {
      onUpdateBooking({ ...target, status: newStatus });
    }
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
    onUpdateBookings(updated);
    persistToStorage(restaurants, themeConfig, notices, seoConfig, updated);
  };

  // Modal states for deleting bookings
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const confirmDeleteBooking = (bookingId: string) => {
    if (onDeleteBooking) {
      onDeleteBooking(bookingId);
    }
    const updated = bookings.filter((b) => b.id !== bookingId);
    onUpdateBookings(updated);
    setSelectedBookingIds((prev) => prev.filter((id) => id !== bookingId));
    persistToStorage(restaurants, themeConfig, notices, seoConfig, updated);
    triggerSaveNotification('점심 신청 내역이 안전하게 삭제되었습니다.');
    setBookingToDelete(null);
  };

  const confirmBulkDelete = () => {
    if (selectedBookingIds.length === 0) return;
    selectedBookingIds.forEach((id) => {
      if (onDeleteBooking) {
        onDeleteBooking(id);
      }
    });
    const updated = bookings.filter((b) => !selectedBookingIds.includes(b.id));
    onUpdateBookings(updated);
    persistToStorage(restaurants, themeConfig, notices, seoConfig, updated);
    triggerSaveNotification(`선택한 ${selectedBookingIds.length}개의 신청 내역이 일괄 삭제되었습니다.`);
    setSelectedBookingIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const toggleSelectAllBookings = () => {
    if (selectedBookingIds.length === bookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(bookings.map((b) => b.id));
    }
  };

  const toggleSelectBooking = (id: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Booking Modal Edit / Create Handlers
  const handleStartEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsEditBookingModalOpen(true);
  };

  const handleStartCreateBooking = () => {
    const newB: Booking = {
      id: 'book-' + Date.now(),
      representativeName: '',
      rawName: '',
      headcount: 4,
      companions: [],
      rawCompanions: [],
      memo: '',
      restaurantId: restaurants[0]?.id || '',
      restaurantName: restaurants[0]?.name || '',
      items: [],
      totalAmount: 0,
      totalBudget: 4 * (themeConfig.budgetPerPerson || 10000),
      difference: 4 * (themeConfig.budgetPerPerson || 10000),
      agreedToPolicy: true,
      createdAt: getCurrentDateTimeString(),
      status: '접수완료',
    };
    setEditingBooking(newB);
    setIsEditBookingModalOpen(true);
  };

  const handleSaveBookingModal = (updatedBooking: Booking) => {
    const exists = bookings.some((b) => b.id === updatedBooking.id);
    let newBookings: Booking[];
    if (exists) {
      newBookings = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
      if (onUpdateBooking) {
        onUpdateBooking(updatedBooking);
      }
    } else {
      newBookings = [updatedBooking, ...bookings];
      if (onAddBooking) {
        onAddBooking(updatedBooking);
      }
    }
    onUpdateBookings(newBookings);
    persistToStorage(restaurants, themeConfig, notices, seoConfig, newBookings);
    triggerSaveNotification(`[${updatedBooking.rawName || '신규'} 조] 예약 정보가 실시간 반영되었습니다.`);
  };

  // Notice Add / Edit
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;

    let updatedNotices: Notice[];
    if (isEditingNotice && noticeForm.id) {
      updatedNotices = notices.map((n) =>
        n.id === noticeForm.id
          ? {
              ...n,
              title: noticeForm.title,
              content: noticeForm.content,
              type: noticeForm.type,
              isPinned: noticeForm.isPinned,
            }
          : n
      );
    } else {
      const newNotice: Notice = {
        id: 'notice-' + Date.now(),
        title: noticeForm.title,
        content: noticeForm.content,
        type: noticeForm.type,
        isPinned: noticeForm.isPinned,
        date: '방금 전',
      };
      updatedNotices = [newNotice, ...notices];
    }

    onUpdateNotices(updatedNotices);
    persistToStorage(restaurants, themeConfig, updatedNotices);
    setNoticeForm({ title: '', content: '', type: 'notice', isPinned: true });
    setIsEditingNotice(false);
    triggerSaveNotification('공지사항이 안전하게 저장되었습니다.');
  };

  const handleEditNotice = (n: Notice) => {
    setNoticeForm({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
      isPinned: n.isPinned,
    });
    setIsEditingNotice(true);
  };

  const handleDeleteNotice = (id: string) => {
    const updated = notices.filter((n) => n.id !== id);
    onUpdateNotices(updated);
    persistToStorage(restaurants, themeConfig, updated);
    triggerSaveNotification('공지사항이 삭제 및 저장되었습니다.');
  };

  const handleClearAllBookingsClick = async () => {
    const ok = window.confirm(
      '⚠️ [전체 신청 내역 초기화]\n\n' +
      '현재 등록된 모든 점심 신청 내역을 데이터베이스(Firestore) 및 브라우저에서 완전히 삭제하시겠습니까?\n\n' +
      '• 기존의 모든 접수 내역이 즉시 0건으로 비워집니다.\n' +
      '• 새로고침 및 다른 기기에서도 다시 나타나지 않습니다.\n' +
      '• 이 작업은 되돌릴 수 없습니다.'
    );
    if (!ok) return;

    try {
      if (onClearAllBookings) {
        await onClearAllBookings();
      }
      onUpdateBookings([]);
      setSelectedBookingIds([]);
      persistToStorage(restaurants, themeConfig, notices, seoConfig, []);
      triggerSaveNotification('모든 점심 신청 내역이 데이터베이스(Firestore) 및 로컬에서 성공적으로 초기화(삭제)되었습니다.');
    } catch (e) {
      console.error('Failed to clear all bookings:', e);
      alert('신청 내역 초기화 중 오류가 발생했습니다.');
    }
  };

  // Restaurant Basic Info Field Update
  const handleUpdateRestaurantField = (
    restId: string,
    field: keyof Restaurant,
    value: string
  ) => {
    const updated = restaurants.map((r) =>
      r.id === restId ? { ...r, [field]: value } : r
    );
    onUpdateRestaurants(updated);
    persistToStorage(updated);
  };

  // Save Restaurant & Menus explicitly
  const handleSaveRestaurantChanges = (restName: string) => {
    persistToStorage(restaurants);
    if (onSaveAll) onSaveAll();
    triggerSaveNotification(`[${restName}] 식당 정보와 메뉴가 저장되었습니다. 새로고침해도 유지됩니다.`);
  };

  // Add Restaurant
  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantForm.name.trim()) return;

    const newRest: Restaurant = {
      id: 'rest-' + Date.now(),
      name: newRestaurantForm.name.trim(),
      category: newRestaurantForm.category.trim() || '일반음식점',
      description: newRestaurantForm.description.trim() || '신규 등록 식당',
      tel: newRestaurantForm.tel.trim() || '',
      voucherOnly: false,
      voucherNotice: '',
      iconName: 'Store',
      menus: [
        {
          id: 'm-' + Date.now(),
          name: '대표 메뉴',
          price: 10000,
          description: '기본 식사 메뉴',
          isPopular: true,
        },
      ],
    };

    const updated = [...restaurants, newRest];
    onUpdateRestaurants(updated);
    persistToStorage(updated);
    setSelectedRestIdForMenuEdit(newRest.id);
    setIsAddingRestaurant(false);
    setNewRestaurantForm({ name: '', category: '한식 / 일반음식점', description: '', tel: '' });
    triggerSaveNotification(`새 식당 '${newRest.name}'이 추가 및 저장되었습니다.`);
  };

  // Delete Restaurant
  const handleDeleteRestaurant = (restId: string) => {
    const target = restaurants.find((r) => r.id === restId);
    if (restaurants.length <= 1) {
      alert('최소 1개 이상의 식당이 유지되어야 합니다.');
      return;
    }
    if (!confirm(`'${target?.name}' 식당을 정말로 삭제하시겠습니까? 관련 메뉴도 함께 삭제됩니다.`)) {
      return;
    }

    const updated = restaurants.filter((r) => r.id !== restId);
    onUpdateRestaurants(updated);
    persistToStorage(updated);
    setSelectedRestIdForMenuEdit(updated[0].id);
    triggerSaveNotification(`'${target?.name}' 식당이 삭제 및 저장되었습니다.`);
  };

  // Start editing existing menu item
  const handleStartEditMenu = (item: MenuItem) => {
    setEditingMenuId(item.id);
    setEditMenuForm({
      name: item.name,
      price: item.price,
      description: item.description || '',
      isPopular: !!item.isPopular,
    });
  };

  // Save edited menu item
  const handleSaveEditedMenu = (restId: string, menuId: string) => {
    if (!editMenuForm.name.trim()) return;

    const updated = restaurants.map((r) => {
      if (r.id === restId) {
        return {
          ...r,
          menus: r.menus.map((m) =>
            m.id === menuId
              ? {
                  ...m,
                  name: editMenuForm.name.trim(),
                  price: Number(editMenuForm.price) || 0,
                  description: editMenuForm.description.trim(),
                  isPopular: editMenuForm.isPopular,
                }
              : m
          ),
        };
      }
      return r;
    });

    onUpdateRestaurants(updated);
    persistToStorage(updated);
    setEditingMenuId(null);
    triggerSaveNotification(`'${editMenuForm.name}' 메뉴가 수정 및 저장되었습니다.`);
  };

  // Menu Add
  const handleAddMenu = (e: React.FormEvent, restId: string) => {
    e.preventDefault();
    if (!newMenuForm.name.trim()) return;

    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      name: newMenuForm.name.trim(),
      price: Number(newMenuForm.price),
      description: newMenuForm.description.trim(),
      isPopular: newMenuForm.isPopular,
    };

    const targetRest = restaurants.find((r) => r.id === restId);
    const updated = restaurants.map((r) => {
      if (r.id === restId) {
        return { ...r, menus: [...r.menus, newItem] };
      }
      return r;
    });

    onUpdateRestaurants(updated);
    persistToStorage(updated);
    setNewMenuForm({ name: '', price: 9000, description: '', isPopular: false });
    triggerSaveNotification(`[${targetRest?.name || '식당'}]에 '${newItem.name}' 메뉴가 등록 및 저장되었습니다.`);
  };

  // Menu Delete
  const handleDeleteMenu = (restId: string, menuId: string) => {
    const targetRest = restaurants.find((r) => r.id === restId);
    const targetMenu = targetRest?.menus.find((m) => m.id === menuId);
    if (!confirm(`'${targetMenu?.name || '메뉴'}'를 정말로 삭제하시겠습니까?`)) return;

    const updated = restaurants.map((r) => {
      if (r.id === restId) {
        return { ...r, menus: r.menus.filter((m) => m.id !== menuId) };
      }
      return r;
    });
    onUpdateRestaurants(updated);
    persistToStorage(updated);
    triggerSaveNotification(`'${targetMenu?.name || '메뉴'}'가 삭제 및 저장되었습니다.`);
  };

  // Save Theme Config
  const handleSaveTheme = () => {
    persistToStorage(restaurants, themeConfig);
    if (onSaveAll) onSaveAll();
    triggerSaveNotification('디자인 테마 및 1인당 식대 지원 설정이 저장되었습니다. 새로고침해도 유지됩니다.');
  };

  // SEO Save
  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSeoConfig(seoForm);
    persistToStorage(restaurants, themeConfig, notices, seoForm);
    setSeoSavedNotice(true);
    triggerSaveNotification('SEO 메타태그 설정이 저장되었습니다.');
    setTimeout(() => setSeoSavedNotice(false), 3000);
  };

  return (
    <div 
      id="admin-dashboard-container"
      className="rounded-3xl border shadow-xl transition-all duration-200 overflow-hidden"
      style={{
        backgroundColor: themeConfig.isDark ? '#141c2e' : '#ffffff',
        borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      {/* Admin Header */}
      <div 
        className="px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4 border-b border-rose-900/40"
        style={{ backgroundColor: '#1e1b4b' }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold">통합 관리자 대시보드 (Admin CMS)</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                관리자 모드
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              수정한 내용(식당, 메뉴, 가격, 1인당 식대)은 저장버튼을 누르면 새로고침 후에도 신청폼에 100% 유지됩니다.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="admin-save-all-button"
            onClick={handleSaveAll}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
            title="현재까지 수정한 식당, 메뉴, 가격, 디자인 설정을 브라우저에 즉시 저장합니다"
          >
            <Save className="w-4 h-4" />
            <span>수정사항 저장하기 (F5 유지)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndGoToForm}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            title="저장 후 신청폼으로 이동하여 반영된 결과를 바로 확인합니다"
          >
            <span>저장 후 신청폼으로 이동</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onCloseAdmin}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Persistent Save Notification Toast Banner */}
      {saveToast && (
        <div className="mx-6 my-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="block text-sm font-black text-emerald-800 dark:text-emerald-200">
                {saveToast.message}
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                ✅ 브라우저 로컬 저장소에 안전하게 기록되었습니다. 새로고침(F5)을 하거나 신청폼으로 이동해도 수정한 내용이 그대로 적용됩니다!
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseAdmin}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <span>신청폼에서 바로 확인</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>실시간 점심 예약 집계 ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'restaurants'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>식당 및 메뉴 관리 ({restaurants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'notices'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>공지사항 관리 ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'design'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>디자인 &amp; 테마 커스텀</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'seo'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>SEO 설정 도구</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6 sm:p-8">
        {/* ==================================================== */}
        {/* TAB 1: 실시간 점심 예약 집계 & 요약 */}
        {/* ==================================================== */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {restaurants.map((r) => {
                const restBookings = bookings.filter((b) => b.restaurantId === r.id);
                const headcount = restBookings.reduce((sum, b) => sum + b.headcount, 0);
                const isCopied = copiedSuccess === r.id;

                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center">
                          <Store className="w-4 h-4 mr-1.5 text-indigo-500" />
                          {r.name}
                        </h4>
                        {r.voucherOnly && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            식권 {headcount}장 필요
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {headcount}명
                        </span>
                        <span className="text-xs text-slate-500">
                          ({restBookings.length}개 조 신청)
                        </span>
                      </div>
                    </div>

                    {/* 1-Click Reservation Text Copy Button */}
                    <button
                      onClick={() => handleCopyReservationForRestaurant(r.id)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>식당 통화/문자 요약문 복사됨!</span>
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{r.name} 예약문 1클릭 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Detailed Bookings Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      신청 조 목록 ({bookings.length}팀)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>실시간 동기화 (Firebase)</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    신청 내역 편집(대표자, 인원, 동행자, 식당, 메뉴), 상태 변경 및 개별/일괄 삭제 관리
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllBookingsClick}
                      className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      title="데이터베이스(Firestore) 및 로컬의 모든 점심 신청 내역을 즉시 일괄 삭제합니다"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>전체 신청 내역 초기화</span>
                    </button>
                  )}
                  {selectedBookingIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer animate-fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>선택한 {selectedBookingIds.length}개 일괄 삭제</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartCreateBooking}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>신규 조 수동 등록</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={bookings.length > 0 && selectedBookingIds.length === bookings.length}
                          onChange={toggleSelectAllBookings}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="전체 선택 / 해제"
                        />
                      </th>
                      <th className="p-3.5">접수 일시</th>
                      <th className="p-3.5">대표자</th>
                      <th className="p-3.5">인원 및 동행자</th>
                      <th className="p-3.5">식당</th>
                      <th className="p-3.5">주문 메뉴</th>
                      <th className="p-3.5">금액 / 한도</th>
                      <th className="p-3.5">상태</th>
                      <th className="p-3.5 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                          현재 등록된 점심 신청 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr 
                          key={b.id} 
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            selectedBookingIds.includes(b.id) ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedBookingIds.includes(b.id)}
                              onChange={() => toggleSelectBooking(b.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDisplayCreatedAt(b.createdAt)}
                          </td>
                          <td className="p-3.5">
                            <strong className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {b.rawName || b.representativeName}
                            </strong>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{b.headcount}명</span>
                            {((b.rawCompanions && b.rawCompanions.length > 0) || b.companions.length > 0) && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {(b.rawCompanions && b.rawCompanions.length > 0
                                  ? b.rawCompanions
                                  : b.companions
                                ).join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="p-3.5 font-medium">{b.restaurantName}</td>
                          <td className="p-3.5 max-w-xs">
                            <p className="line-clamp-1 text-slate-700 dark:text-slate-300">
                              {b.items.map((i) => `${i.name} ${i.quantity}`).join(', ')}
                            </p>
                            {b.memo && (
                              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded mt-0.5 truncate" title={b.memo}>
                                💬 {b.memo}
                              </p>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold">{formatKRW(b.totalAmount)}</span>
                            <span className={`block text-[11px] ${b.difference < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
                              {b.difference < 0 ? `초과 ${formatKRW(Math.abs(b.difference))}` : '한도 내'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={b.status}
                              onChange={(e) => handleStatusChange(b.id, e.target.value as Booking['status'])}
                              className="py-1 px-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              <option value="접수완료">접수완료</option>
                              <option value="식권수령완료">식권수령완료</option>
                              <option value="식당이동중">식당이동중</option>
                              <option value="식사완료">식사완료</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditBooking(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                                title="신청 정보(대표자, 인원, 동행자, 식당, 메뉴) 편집"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>수정</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setBookingToDelete(b)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                title="신청 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* In-app Safe Delete Confirmation Modal (Avoids native iframe alert/confirm issues) */}
            {bookingToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">신청 내역 삭제</h3>
                      <p className="text-xs text-slate-500">선택한 조의 점심 신청 내역을 영구 삭제합니다.</p>
                    </div>
                  </div>
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <p><strong className="text-slate-700 dark:text-slate-300">대표자:</strong> {bookingToDelete.rawName || bookingToDelete.representativeName} ({bookingToDelete.headcount}명)</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">식당:</strong> {bookingToDelete.restaurantName}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">주문 메뉴:</strong> {bookingToDelete.items.map((i) => `${i.name} ${i.quantity}개`).join(', ')}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">총 결제금액:</strong> {formatKRW(bookingToDelete.totalAmount)}</p>
                  </div>

                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    ⚠️ 삭제 시 로컬 저장소 및 Firestore 실시간 동기화에서 즉시 제거됩니다.
                  </p>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBookingToDelete(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteBooking(bookingToDelete.id)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제 확인</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* In-app Bulk Delete Modal */}
            {isBulkDeleteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">일괄 삭제 확인</h3>
                      <p className="text-xs text-slate-500">선택한 {selectedBookingIds.length}개의 신청 내역을 모두 삭제합니다.</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    ⚠️ 선택한 모든 팀의 예약 데이터가 완전히 삭제되며 복구할 수 없습니다. 계속 진행하시겠습니까?
                  </p>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={confirmBulkDelete}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{selectedBookingIds.length}개 모두 삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: 식당 및 메뉴 관리 (CMS) */}
        {/* ==================================================== */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar: Restaurant Switcher & Add Restaurant */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>식당 및 메뉴 관리 (CMS)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  식당 이름, 카테고리, 전화번호, 소개 및 메뉴/가격을 수정하고 저장할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRestIdForMenuEdit(r.id);
                      setEditingMenuId(null);
                      setIsAddingRestaurant(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedRestIdForMenuEdit === r.id && !isAddingRestaurant
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r.name} ({r.menus.length})
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsAddingRestaurant(!isAddingRestaurant)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                    isAddingRestaurant
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 식당 추가</span>
                </button>
              </div>
            </div>

            {/* Add New Restaurant Form Modal/Section */}
            {isAddingRestaurant && (
              <div className="p-5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-4 animate-fade-in shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center space-x-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    <span>신규 식당 등록</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingRestaurant(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddRestaurant} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        식당명 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.name}
                        onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, name: e.target.value })}
                        placeholder="예: 맛있는 연수원 식당"
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        업종 / 카테고리
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.category}
                        onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, category: e.target.value })}
                        placeholder="예: 한식 / 찌개 & 직화구이 전문"
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        전화번호 (선택)
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.tel}
                        onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, tel: e.target.value })}
                        placeholder="예: 031-123-4567"
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      식당 소개 및 위치 설명
                    </label>
                    <textarea
                      rows={2}
                      value={newRestaurantForm.description}
                      onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, description: e.target.value })}
                      placeholder="예: 연수원 도보 5분 거리, 단체석 완비"
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRestaurant(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>식당 등록 및 저장</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Active Restaurant Details & Menu CMS */}
            {(() => {
              const currentRest = restaurants.find((r) => r.id === selectedRestIdForMenuEdit) || restaurants[0];
              if (!currentRest) return null;

              return (
                <div className="space-y-6">
                  {/* Card 1: Restaurant Basic Info Editor */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          [{currentRest.name}] 기본 정보 수정
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSaveRestaurantChanges(currentRest.name)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>식당 정보 저장하기</span>
                        </button>

                        {restaurants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRestaurant(currentRest.id)}
                            className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                            title="이 식당을 삭제합니다"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>식당 삭제</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          식당 이름 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={currentRest.name}
                          onChange={(e) => handleUpdateRestaurantField(currentRest.id, 'name', e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                          placeholder="식당명"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          업종 / 카테고리
                        </label>
                        <input
                          type="text"
                          value={currentRest.category}
                          onChange={(e) => handleUpdateRestaurantField(currentRest.id, 'category', e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                          placeholder="예: 한식 / 찌개 & 직화구이 전문"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          대표 전화번호
                        </label>
                        <input
                          type="text"
                          value={currentRest.tel || ''}
                          onChange={(e) => handleUpdateRestaurantField(currentRest.id, 'tel', e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                          placeholder="예: 031-123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        식당 소개 및 특이사항 안내
                      </label>
                      <textarea
                        rows={2}
                        value={currentRest.description}
                        onChange={(e) => handleUpdateRestaurantField(currentRest.id, 'description', e.target.value)}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                        placeholder="식당 특징 및 신청 시 유의사항 등을 입력하세요"
                      />
                    </div>
                  </div>

                  {/* Card 2: Registered Menus List with Inline Edit */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                    <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          [{currentRest.name}] 메뉴 목록 및 가격 수정 ({currentRest.menus.length}개)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          수정 버튼을 누르면 메뉴명과 가격을 즉시 변경할 수 있습니다.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveRestaurantChanges(currentRest.name)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>메뉴 저장</span>
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentRest.menus.map((item) => (
                        <div key={item.id} className="p-4 transition-colors">
                          {editingMenuId === item.id ? (
                            /* Inline Edit Form for this Menu Item */
                            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  메뉴 정보 수정 중: {item.name}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    메뉴명
                                  </label>
                                  <input
                                    type="text"
                                    value={editMenuForm.name}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, name: e.target.value })}
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    가격 (원)
                                  </label>
                                  <input
                                    type="number"
                                    value={editMenuForm.price}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, price: Number(e.target.value) })}
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    메뉴 설명 (선택)
                                  </label>
                                  <input
                                    type="text"
                                    value={editMenuForm.description}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, description: e.target.value })}
                                    placeholder="예: 공기밥 포함"
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editMenuForm.isPopular}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, isPopular: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                  />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    인기 추천 메뉴로 강조 표시
                                  </span>
                                </label>

                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMenuId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedMenu(currentRest.id, item.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>수정 저장</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular Display of Menu Item */
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                    {item.name}
                                  </span>
                                  {item.isPopular && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                                      인기
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                                )}
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                                  {formatKRW(item.price)}
                                </span>

                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditMenu(item)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-300 transition-colors cursor-pointer"
                                    title="메뉴 및 가격 수정"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMenu(currentRest.id, item.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 transition-colors cursor-pointer"
                                    title="메뉴 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Add New Menu Form */}
                  <form
                    onSubmit={(e) => handleAddMenu(e, currentRest.id)}
                    className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3"
                  >
                    <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center">
                      <Plus className="w-4 h-4 mr-1 text-indigo-600" />
                      [{currentRest.name}] 신규 메뉴 추가하기
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          메뉴명 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="예: 치즈 돈까스 정식"
                          value={newMenuForm.name}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          가격 (원) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="가격(원)"
                          value={newMenuForm.price}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, price: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          간단 설명 (선택)
                        </label>
                        <input
                          type="text"
                          placeholder="예: 특제소스 포함"
                          value={newMenuForm.description}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, description: e.target.value })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuForm.isPopular}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, isPopular: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          인기 메뉴 뱃지 추가
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>메뉴 등록 및 저장</span>
                      </button>
                    </div>
                  </form>

                  {/* Big Save Button at bottom of Restaurant Tab */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">
                        [{currentRest.name}] 모든 수정내역 영구 저장
                      </span>
                      <p className="text-xs text-slate-500">
                        저장버튼을 누르면 브라우저에 안전하게 보관되어 새로고침(F5) 후에도 신청폼에 그대로 반영됩니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveRestaurantChanges(currentRest.name)}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
                    >
                      <Save className="w-4 h-4" />
                      <span>[{currentRest.name}] 식당 &amp; 메뉴 전체 저장</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: 공지사항 관리 System */}
        {/* ==================================================== */}
        {activeTab === 'notices' && (
          <div className="space-y-6 animate-fade-in">
            {/* Notice Create/Edit Form */}
            <form onSubmit={handleSaveNotice} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isEditingNotice ? '공지사항 수정' : '새 공지사항 등록'}
                </h4>
                {isEditingNotice && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNotice(false);
                      setNoticeForm({ title: '', content: '', type: 'notice', isPinned: true });
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    취소하고 새로 작성
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    공지 제목
                  </label>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    placeholder="예: [안내] 금일 점심 마감 11:30 안내"
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    공지 내용
                  </label>
                  <textarea
                    rows={3}
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    placeholder="공지 세부 내용을 입력하세요"
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">유형:</span>
                    <select
                      value={noticeForm.type}
                      onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value as Notice['type'] })}
                      className="py-1 px-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <option value="notice">필독 공지 (붉은색)</option>
                      <option value="warning">식권 안내 (노란색)</option>
                      <option value="info">일반 안내 (파란색)</option>
                    </select>
                  </div>

                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeForm.isPinned}
                      onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      상단 배너에 고정 표시
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="ml-auto py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                  >
                    {isEditingNotice ? '수정 완료' : '공지 등록하기'}
                  </button>
                </div>
              </div>
            </form>

            {/* Notice List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                게시된 공지 목록 ({notices.length}건)
              </h4>
              <div className="space-y-2.5">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {n.isPinned && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600">
                            상단고정
                          </span>
                        )}
                        <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {n.title}
                        </h5>
                        <span className="text-slate-400">{n.date}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{n.content}</p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleEditNotice(n)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: 디자인 & 테마 커스터마이징 */}
        {/* ==================================================== */}
        {activeTab === 'design' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  실시간 디자인 &amp; 테마 커스터마이징
                </h3>
                <p className="text-xs text-slate-500">
                  지정 색상(#2C2B70, #C6C4C3) 및 폰트, 다크모드, 문구를 즉시 변경하고 전체 화면에 적용합니다
                </p>
              </div>

              <button
                type="button"
                onClick={onResetTheme}
                className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본값으로 복원</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Text Customization */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  1. 타이틀 및 식대 기준 설정
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    웹사이트 메인 타이틀
                  </label>
                  <input
                    type="text"
                    value={themeConfig.siteTitle}
                    onChange={(e) => onUpdateThemeConfig({ siteTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    서브 타이틀 / 슬로건
                  </label>
                  <input
                    type="text"
                    value={themeConfig.siteSubtitle}
                    onChange={(e) => onUpdateThemeConfig({ siteSubtitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    1인당 식대 지원 한도 (현재: {formatKRW(themeConfig.budgetPerPerson || 10000)})
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={themeConfig.budgetPerPerson}
                    onChange={(e) => onUpdateThemeConfig({ budgetPerPerson: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                {/* Deadline Configuration */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      점심 신청 마감 시간 설정
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      현재: {themeConfig.deadlineTime || '10:30'} 마감
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={themeConfig.deadlineTime || '10:30'}
                      onChange={(e) => onUpdateThemeConfig({ deadlineTime: e.target.value })}
                      className="p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold w-36"
                    />
                    <div className="flex items-center gap-1.5">
                      {['10:20', '10:30', '10:40', '11:00', '11:30'].map((timePreset) => (
                        <button
                          key={timePreset}
                          type="button"
                          onClick={() => onUpdateThemeConfig({ deadlineTime: timePreset })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            (themeConfig.deadlineTime || '10:30') === timePreset
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {timePreset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 설정한 마감 시간은 상단 헤더 실시간 카운트다운, 메인 인트로 카드, 및 공지사항에 즉시 반영됩니다.
                  </p>
                </div>

                {/* Admin Password Configuration */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      관리자 대시보드 보안 비밀번호 (PIN)
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      현재 설정: {themeConfig.adminPassword || '9707'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={12}
                      value={themeConfig.adminPassword || '9707'}
                      onChange={(e) => onUpdateThemeConfig({ adminPassword: e.target.value })}
                      className="p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-bold w-36 font-mono tracking-widest"
                      placeholder="9707"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ adminPassword: '9707' })}
                      className="px-2.5 py-2 rounded-lg text-xs font-semibold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    >
                      기본값 (9707) 복원
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    🔒 설정한 비밀번호는 대시보드 접근 시 인증 창에 즉시 적용되며, 승인되지 않은 일반 사용자의 접근을 차단합니다.
                  </p>
                </div>
              </div>

              {/* Color & Font Customization */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. 메인/포인트 색상 &amp; 폰트
                </h4>

                {/* Primary Color */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      메인 브랜드 컬러 (기본: #2C2B70)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {themeConfig.primaryColor}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={themeConfig.primaryColor}
                      onChange={(e) => onUpdateThemeConfig({ primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    {/* Preset buttons */}
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ primaryColor: '#2C2B70' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-[#2C2B70] text-white font-bold"
                    >
                      지정색 #2C2B70
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ primaryColor: '#1e3a8a' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-blue-900 text-white font-bold"
                    >
                      로열블루
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ primaryColor: '#0f172a' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-slate-900 text-white font-bold"
                    >
                      다크슬레이트
                    </button>
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      포인트/세컨더리 컬러 (기본: #C6C4C3)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {themeConfig.secondaryColor}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={themeConfig.secondaryColor}
                      onChange={(e) => onUpdateThemeConfig({ secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ secondaryColor: '#C6C4C3' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-[#C6C4C3] text-slate-800 font-bold"
                    >
                      지정색 #C6C4C3
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ secondaryColor: '#3b82f6' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-blue-500 text-white font-bold"
                    >
                      스카이블루
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateThemeConfig({ secondaryColor: '#f59e0b' })}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-amber-500 text-white font-bold"
                    >
                      앰버오렌지
                    </button>
                  </div>
                </div>

                {/* Font Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    전체 사이트 폰트 스타일
                  </label>
                  <select
                    value={themeConfig.font}
                    onChange={(e) => onUpdateThemeConfig({ font: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="'Noto Sans KR', sans-serif">Noto Sans KR (기본 깔끔한 고딕)</option>
                    <option value="'Pretendard', sans-serif">Pretendard (모던 프리미엄 산세리프)</option>
                    <option value="'Gowun Batang', serif">고운바탕 (단아하고 우아한 명조)</option>
                    <option value="system-ui, -apple-system, sans-serif">시스템 기본 폰트 (System Sans)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: SEO 설정 도구 */}
        {/* ==================================================== */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                SEO 메타태그 설정 및 검색 결과 미리보기
              </h3>
              <p className="text-xs text-slate-500">
                포털 사이트 검색 최적화(SEO) 및 소셜 링크 공유 시 표시되는 메타 정보를 실시간으로 수정합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <form onSubmit={handleSaveSeo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    메타 타이틀 (Title Tag)
                  </label>
                  <input
                    type="text"
                    value={seoForm.metaTitle}
                    onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    권장 길이: 50~60자 (현재 {seoForm.metaTitle.length}자)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    메타 디스크립션 (Description Tag)
                  </label>
                  <textarea
                    rows={3}
                    value={seoForm.metaDescription}
                    onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    검색 결과 설명문 (현재 {seoForm.metaDescription.length}자)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    메타 키워드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={seoForm.keywords}
                    onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>SEO 설정 실시간 적용하기</span>
                </button>

                {seoSavedNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>브라우저 메타태그와 타이틀에 성공적으로 적용되었습니다!</span>
                  </div>
                )}
              </form>

              {/* Google Search Mockup Card */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  포털 검색 결과 노출 시뮬레이션
                </span>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5 font-sans">
                  <div className="flex items-center space-x-2 text-[12px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold">L</span>
                    <span>https://lunch.academy.internal &gt; group-order</span>
                  </div>
                  <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                    {seoForm.metaTitle || '그룹 점심 신청 & 관리자 대시보드'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {seoForm.metaDescription || '식대 한도 자동 계산 및 실시간 식당 사전 예약 집계 웹앱'}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1">
                    {seoForm.keywords.split(',').slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        #{kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Booking Edit Modal */}
      <EditBookingModal
        booking={editingBooking}
        restaurants={restaurants}
        themeConfig={themeConfig}
        isOpen={isEditBookingModalOpen}
        onClose={() => {
          setIsEditBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveBookingModal}
        onDelete={confirmDeleteBooking}
      />
    </div>
  );
};
