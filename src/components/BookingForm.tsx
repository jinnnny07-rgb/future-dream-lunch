import React, { useState, useMemo } from 'react';
import { 
  User, 
  Users, 
  UserPlus,
  X,
  Store, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Share2, 
  Flame, 
  ShieldCheck,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Restaurant, MenuItem, Booking, ThemeConfig, OrderItem } from '../types';
import { maskKoreanName, formatKRW, getCurrentDateTimeString } from '../utils';
import { BudgetCalculator } from './BudgetCalculator';

interface BookingFormProps {
  restaurants: Restaurant[];
  themeConfig: ThemeConfig;
  onSubmitBooking: (newBooking: Booking) => void;
  onOpenShareModal: (booking: Booking) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  restaurants,
  themeConfig,
  onSubmitBooking,
  onOpenShareModal,
}) => {
  // Form State
  const [rawName, setRawName] = useState<string>('');
  const [headcount, setHeadcount] = useState<number>(4);
  const [companions, setCompanions] = useState<string[]>(['김철수', '이영희', '박민수']);
  const [memo, setMemo] = useState<string>('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    restaurants[0]?.id || ''
  );
  // Menu quantities: { menuItemId: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastSubmittedBooking, setLastSubmittedBooking] = useState<Booking | null>(null);

  // Active Restaurant
  const activeRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
  }, [restaurants, selectedRestaurantId]);

  // Handle headcount change
  const handleHeadcountChange = (count: number) => {
    setHeadcount(count);
    const needed = Math.max(0, count - 1);
    setCompanions((prev) => {
      const next = [...prev];
      if (next.length < needed) {
        while (next.length < needed) {
          next.push('');
        }
      } else if (next.length > needed) {
        return next.slice(0, needed);
      }
      return next;
    });
  };

  const handleCompanionChange = (index: number, value: string) => {
    setCompanions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddCompanion = () => {
    setCompanions((prev) => [...prev, '']);
    setHeadcount((prev) => prev + 1);
  };

  const handleRemoveCompanion = (index: number) => {
    setCompanions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setHeadcount((h) => Math.max(1, h - 1));
      return next;
    });
  };

  // Menu quantity update
  const handleQuantityChange = (menuId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[menuId] || 0;
      const nextVal = Math.max(0, current + delta);
      if (nextVal === 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: nextVal };
    });
  };

  // Calculate total amount
  const totalOrderAmount = useMemo(() => {
    if (!activeRestaurant) return 0;
    return Object.entries(cart).reduce((sum, [menuId, qty]) => {
      const item = activeRestaurant.menus.find((m) => m.id === menuId);
      const quantity = Number(qty);
      return sum + (item ? item.price * quantity : 0);
    }, 0);
  }, [cart, activeRestaurant]);

  const totalBudget = headcount * (themeConfig.budgetPerPerson || 10000);
  const difference = totalBudget - totalOrderAmount;

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!rawName.trim()) {
      setFormError('대표 신청자 이름을 입력해 주세요.');
      return;
    }

    if (Object.keys(cart).length === 0) {
      setFormError('최소 1개 이상의 메뉴를 선택해 주세요.');
      return;
    }

    if (!agreedToPolicy) {
      setFormError('식대 초과 및 팀 점심 규정 동의 체크가 필요합니다.');
      return;
    }

    // Build OrderItem array
    const items: OrderItem[] = Object.entries(cart).map(([menuId, qty]) => {
      const found = activeRestaurant.menus.find((m) => m.id === menuId);
      return {
        menuItemId: menuId,
        name: found?.name || '선택 메뉴',
        price: found?.price || 0,
        quantity: Number(qty),
      };
    });

    const masked = maskKoreanName(rawName);
    const timeStr = getCurrentDateTimeString();

    // Filter valid companion names and mask them
    const validRawCompanions = companions.map((c) => c.trim()).filter((c) => c.length > 0);
    const maskedCompanions = validRawCompanions.map((name) => maskKoreanName(name));

    const newBooking: Booking = {
      id: 'book-' + Date.now(),
      representativeName: masked,
      rawName: rawName.trim(),
      headcount,
      companions: maskedCompanions,
      rawCompanions: validRawCompanions,
      memo: memo.trim() ? memo.trim() : '',
      restaurantId: activeRestaurant.id,
      restaurantName: activeRestaurant.name,
      items,
      totalAmount: totalOrderAmount,
      totalBudget,
      difference,
      agreedToPolicy: true,
      createdAt: timeStr,
      status: '접수완료',
    };

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [themeConfig.primaryColor, '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // Ignore if canvas-confetti is not loaded
    }

    onSubmitBooking(newBooking);
    setLastSubmittedBooking(newBooking);

    // Reset some cart states or keep ready
    // Scroll smoothly to success summary or open share modal
  };

  const handleResetForm = () => {
    setRawName('');
    setCart({});
    handleHeadcountChange(4);
    setMemo('');
    setLastSubmittedBooking(null);
    setFormError(null);
  };

  return (
    <div 
      id="student-lunch-booking-form"
      className="rounded-3xl border shadow-sm transition-colors duration-200 overflow-hidden"
      style={{
        backgroundColor: themeConfig.isDark ? '#141c2e' : '#ffffff',
        borderColor: themeConfig.isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      {/* Form Header */}
      <div 
        className="px-6 py-5 border-b flex flex-wrap items-center justify-between gap-3 text-white"
        style={{ backgroundColor: themeConfig.primaryColor }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">교육생 점심 신청 &amp; 메뉴 선택</h2>
            <p className="text-xs text-white/80">
              대표자 이름, 인원수, 식당을 선택하고 실시간 식대 한도를 확인하세요
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 transition-colors flex items-center space-x-1"
          title="새로 입력하기"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>초기화</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* SECTION 1: Representative Name & Masking Guide */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            1. 대표 신청자 이름 <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="input-representative-name"
                type="text"
                value={rawName}
                onChange={(e) => setRawName(e.target.value)}
                placeholder="예: 홍길동 (대표자 본명 입력)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Live Masking Notice Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">대시보드 표시:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                {rawName ? maskKoreanName(rawName) : '홍*동'}
              </strong>
              <span className="text-[11px] text-slate-400">
                (자동 마스킹 보호)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
            💡 개인정보 보호를 위해 대시보드와 공용 집계 화면에는 이름이 가운데 마스킹 처리되어 노출됩니다.
          </p>
        </div>

        {/* SECTION 2: Headcount & Companions */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. 총 이동 인원수 선택 &amp; 동행자 작성
            </label>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              현재 인원: {headcount}명 (지원 한도 {formatKRW(totalBudget)})
            </span>
          </div>

          {/* Headcount Pills - Buttons up to 6 people */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-headcount-${num}`}
                onClick={() => handleHeadcountChange(num)}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  headcount === num
                    ? 'text-white shadow-md transform scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                style={{
                  backgroundColor: headcount === num ? themeConfig.primaryColor : undefined,
                  borderColor: headcount === num ? themeConfig.primaryColor : undefined,
                }}
              >
                {num}명
              </button>
            ))}
          </div>

          {/* If headcount > 6 */}
          {headcount > 6 && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                단체/대규모 인원 선택 중: <strong>총 {headcount}명</strong>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleHeadcountChange(Math.max(1, headcount - 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="font-bold px-1">{headcount}명</span>
                <button
                  type="button"
                  onClick={() => handleHeadcountChange(headcount + 1)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Companions Section (Flexible Add & Remove) */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                함께 식사할 동행자 명단 ({companions.length}명)
              </span>

              <button
                type="button"
                onClick={handleAddCompanion}
                id="btn-add-companion"
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>+ 동행자 추가</span>
              </button>
            </div>

            {companions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {companions.map((comp, idx) => (
                  <div key={idx} className="relative flex items-center">
                    <span className="absolute left-2.5 text-[11px] text-slate-400 font-medium pointer-events-none">
                      동행 {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={comp}
                      onChange={(e) => handleCompanionChange(idx, e.target.value)}
                      placeholder="이름 입력"
                      className="w-full pl-14 pr-16 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                    {comp.trim() && (
                      <span className="absolute right-7 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 pointer-events-none">
                        {maskKoreanName(comp.trim())}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveCompanion(idx)}
                      className="absolute right-1 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="동행자 삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                현재 대표자 1인 신청 상태입니다. 동행자가 있다면 상단의 <strong>[+ 동행자 추가]</strong> 버튼 또는 <strong>인원수 버튼(2~6명)</strong>을 눌러주세요.
              </p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span>💡 동행자 이름도 대표자와 동일하게 대시보드와 공유 메시지에 <strong>'홍*동' 형식으로 자동 마스킹</strong>되어 표시됩니다.</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Restaurant Selection */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              3. 식당 선택 <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              {restaurants.length}개 식당 등록됨
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {restaurants.map((rest) => {
              const isSelected = rest.id === activeRestaurant.id;
              return (
                <button
                  key={rest.id}
                  type="button"
                  id={`btn-select-restaurant-${rest.id}`}
                  onClick={() => {
                    setSelectedRestaurantId(rest.id);
                    setCart({}); // clear cart when switching restaurant
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-offset-1 shadow-md'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.primaryColor : undefined,
                    ringColor: isSelected ? themeConfig.primaryColor : undefined,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center">
                        <Store className="w-4 h-4 mr-1.5 text-indigo-500" />
                        {rest.name}
                      </h4>
                    </div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block mb-1">
                      {rest.category}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {rest.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                    <span>메뉴 {rest.menus.length}종류</span>
                    {isSelected && (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                        선택됨 <CheckCircle className="w-3.5 h-3.5 ml-1 text-emerald-500" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: Dynamic Menu List for Selected Restaurant */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              4. 메뉴 선택 ({activeRestaurant.name}) <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              수량을 + / - 버튼으로 담아주세요
            </span>
          </div>

          {activeRestaurant.voucherNotice && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold shrink-0">📌 식권 안내:</span>
              <span>{activeRestaurant.voucherNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRestaurant.menus.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    qty > 0
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {formatKRW(item.price)}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={qty === 0}
                        className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-slate-100">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: Memo & Special Requests Area */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>5. 교육생 요청사항 및 전달 메모 (선택)</span>
          </label>
          <div className="relative">
            <textarea
              id="input-booking-memo"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={200}
              className="w-full p-3 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all resize-none"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
              {memo.length}/200자
            </span>
          </div>
        </div>

        {/* SECTION 6: Embedded Real-time Budget Calculator */}
        <BudgetCalculator
          headcount={headcount}
          totalOrderAmount={totalOrderAmount}
          themeConfig={themeConfig}
        />

        {/* SECTION 6: Policy Agreement Checkbox */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              id="checkbox-policy-agreement"
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                [필수] 식대 지원 한도 준수 및 초과액 개인부담 원칙에 동의합니다.
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                인당 {formatKRW(themeConfig.budgetPerPerson || 10000)}원을 초과하는 금액은 신청 조에서 현장 자부담하며, 신청 후 불가피한 변동 시 대표자가 운영진에게 알리는 규정에 동의합니다.
              </p>
            </div>
          </label>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            id="btn-submit-lunch-booking"
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl text-white font-bold text-base shadow-lg transition-all transform active:scale-98 flex items-center justify-center space-x-2.5"
            style={{
              backgroundColor: themeConfig.primaryColor,
            }}
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>
              점심 신청 완료하기 (총 {headcount}명 / {formatKRW(totalOrderAmount)})
            </span>
          </button>
        </div>

        {/* POST-SUBMISSION SUCCESS BANNER WITH SOCIAL SHARE BUTTONS */}
        {lastSubmittedBooking && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">
                  점심 신청이 정상 접수되었습니다! ({lastSubmittedBooking.representativeName} 팀)
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold">
                접수완료
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              선택 식당: <strong>{lastSubmittedBooking.restaurantName}</strong> ({lastSubmittedBooking.headcount}명) | 
              총 결제액: <strong>{formatKRW(lastSubmittedBooking.totalAmount)}</strong>
              {lastSubmittedBooking.companions.length > 0 && (
                <span> | 동행자: {lastSubmittedBooking.companions.join(', ')}</span>
              )}
              {lastSubmittedBooking.memo && (
                <span className="block mt-1">📝 메모: "{lastSubmittedBooking.memo}"</span>
              )}
            </p>

            {/* Social Share Buttons */}
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 mr-1">
                팀원들에게 알리기:
              </span>
              <button
                type="button"
                onClick={() => onOpenShareModal(lastSubmittedBooking)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold border border-emerald-300 dark:border-emerald-700 shadow-xs hover:bg-slate-50 flex items-center space-x-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>슬랙 / 카카오톡 포맷 복사</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
