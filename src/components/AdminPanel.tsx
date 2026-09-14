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
  AlertCircle
} from 'lucide-react';
import { Restaurant, MenuItem, Booking, Notice, ThemeConfig, SeoConfig } from '../types';
import { formatKRW, generateRestaurantReservationText, copyToClipboard } from '../utils';

interface AdminPanelProps {
  restaurants: Restaurant[];
  onUpdateRestaurants: (updated: Restaurant[]) => void;
  bookings: Booking[];
  onUpdateBookings: (updated: Booking[]) => void;
  notices: Notice[];
  onUpdateNotices: (updated: Notice[]) => void;
  themeConfig: ThemeConfig;
  onUpdateThemeConfig: (updated: Partial<ThemeConfig>) => void;
  onResetTheme: () => void;
  seoConfig: SeoConfig;
  onUpdateSeoConfig: (updated: SeoConfig) => void;
  onCloseAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  restaurants,
  onUpdateRestaurants,
  bookings,
  onUpdateBookings,
  notices,
  onUpdateNotices,
  themeConfig,
  onUpdateThemeConfig,
  onResetTheme,
  seoConfig,
  onUpdateSeoConfig,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'restaurants' | 'notices' | 'design' | 'seo'>('summary');
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

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

  // Restaurant Form State
  const [selectedRestIdForMenuEdit, setSelectedRestIdForMenuEdit] = useState<string>(
    restaurants[0]?.id || ''
  );
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
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
    onUpdateBookings(updated);
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('정말로 이 점심 신청 내역을 삭제하시겠습니까?')) {
      onUpdateBookings(bookings.filter((b) => b.id !== bookingId));
    }
  };

  // Notice Add / Edit
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;

    if (isEditingNotice && noticeForm.id) {
      onUpdateNotices(
        notices.map((n) =>
          n.id === noticeForm.id
            ? {
                ...n,
                title: noticeForm.title,
                content: noticeForm.content,
                type: noticeForm.type,
                isPinned: noticeForm.isPinned,
              }
            : n
        )
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
      onUpdateNotices([newNotice, ...notices]);
    }

    setNoticeForm({ title: '', content: '', type: 'notice', isPinned: true });
    setIsEditingNotice(false);
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
    onUpdateNotices(notices.filter((n) => n.id !== id));
  };

  // Menu Add
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuForm.name.trim()) return;

    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      name: newMenuForm.name.trim(),
      price: Number(newMenuForm.price),
      description: newMenuForm.description.trim(),
      isPopular: newMenuForm.isPopular,
    };

    const updated = restaurants.map((r) => {
      if (r.id === selectedRestIdForMenuEdit) {
        return { ...r, menus: [...r.menus, newItem] };
      }
      return r;
    });

    onUpdateRestaurants(updated);
    setNewMenuForm({ name: '', price: 9000, description: '', isPopular: false });
  };

  const handleDeleteMenu = (restId: string, menuId: string) => {
    const updated = restaurants.map((r) => {
      if (r.id === restId) {
        return { ...r, menus: r.menus.filter((m) => m.id !== menuId) };
      }
      return r;
    });
    onUpdateRestaurants(updated);
  };

  // SEO Save
  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSeoConfig(seoForm);
    setSeoSavedNotice(true);
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
                관리자 권한
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              실시간 예약 집계, 1클릭 통화/문자 요약문 복사, 식당 및 메뉴 관리, 공지사항, 테마 및 SEO 설정
            </p>
          </div>
        </div>

        <button
          onClick={onCloseAdmin}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          신청 화면으로 돌아가기
        </button>
      </div>

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
              <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  신청 조 목록 ({bookings.length}팀)
                </span>
                <span className="text-xs text-slate-500">
                  상태 변경 및 예약 취소/삭제 관리
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">접수시각</th>
                      <th className="p-3.5">대표자 (실명)</th>
                      <th className="p-3.5">인원 및 동행</th>
                      <th className="p-3.5">식당</th>
                      <th className="p-3.5">주문 메뉴</th>
                      <th className="p-3.5">금액 / 한도</th>
                      <th className="p-3.5">상태</th>
                      <th className="p-3.5 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-slate-500">{b.createdAt}</td>
                        <td className="p-3.5">
                          <strong className="font-bold text-slate-900 dark:text-slate-100">
                            {b.representativeName}
                          </strong>
                          <span className="text-[11px] text-slate-400 ml-1">
                            ({b.rawName})
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{b.headcount}명</span>
                          {b.companions.length > 0 && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {b.companions.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="p-3.5 font-medium">{b.restaurantName}</td>
                        <td className="p-3.5 max-w-xs">
                          <p className="line-clamp-1 text-slate-700 dark:text-slate-300">
                            {b.items.map((i) => `${i.name} ${i.quantity}`).join(', ')}
                          </p>
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
                            className="py-1 px-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-semibold"
                          >
                            <option value="접수완료">접수완료</option>
                            <option value="식권수령완료">식권수령완료</option>
                            <option value="식당이동중">식당이동중</option>
                            <option value="식사완료">식사완료</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: 식당 및 메뉴 관리 (CMS) */}
        {/* ==================================================== */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6 animate-fade-in">
            {/* Restaurant Selector for Menu CMS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  식당 선택 및 메뉴/가격 편집
                </h3>
                <p className="text-xs text-slate-500">
                  선택한 식당의 메뉴 목록을 실시간으로 추가, 수정, 삭제할 수 있습니다
                </p>
              </div>

              <div className="flex gap-2">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRestIdForMenuEdit(r.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedRestIdForMenuEdit === r.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Restaurant Details & Voucher Settings */}
            {(() => {
              const currentRest = restaurants.find((r) => r.id === selectedRestIdForMenuEdit) || restaurants[0];
              if (!currentRest) return null;

              return (
                <div className="space-y-5">
                  {/* Restaurant Details Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Store className="w-5 h-5 text-indigo-500" />
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {currentRest.name} 설정
                        </h4>
                      </div>

                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentRest.voucherOnly}
                          onChange={(e) => {
                            const updated = restaurants.map((r) =>
                              r.id === currentRest.id ? { ...r, voucherOnly: e.target.checked } : r
                            );
                            onUpdateRestaurants(updated);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-slate-800 dark:text-slate-200">
                          식권 전용 식당으로 지정
                        </span>
                      </label>
                    </div>

                    {/* Voucher Notice custom text if voucherOnly */}
                    {currentRest.voucherOnly && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          식권 전용 자동 노출 안내 문구:
                        </label>
                        <input
                          type="text"
                          value={currentRest.voucherNotice || ''}
                          onChange={(e) => {
                            const updated = restaurants.map((r) =>
                              r.id === currentRest.id ? { ...r, voucherNotice: e.target.value } : r
                            );
                            onUpdateRestaurants(updated);
                          }}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                          placeholder="식권 전용 식당 안내 문구를 입력하세요"
                        />
                      </div>
                    )}
                  </div>

                  {/* Add New Menu Form */}
                  <form onSubmit={handleAddMenu} className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                    <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center">
                      <Plus className="w-4 h-4 mr-1 text-indigo-600" />
                      [{currentRest.name}] 신규 메뉴 추가하기
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="메뉴명 (예: 치즈 돈까스)"
                          value={newMenuForm.name}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="가격(원)"
                          value={newMenuForm.price}
                          onChange={(e) => setNewMenuForm({ ...newMenuForm, price: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                        >
                          메뉴 등록
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Menu Items List */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 font-bold text-xs text-slate-700 dark:text-slate-300">
                      등록된 메뉴 목록 ({currentRest.menus.length}개)
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentRest.menus.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {item.name}
                            </span>
                            {item.isPopular && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600">
                                인기
                              </span>
                            )}
                            {item.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              {formatKRW(item.price)}
                            </span>
                            <button
                              onClick={() => handleDeleteMenu(currentRest.id, item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
    </div>
  );
};
