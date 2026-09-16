import React, { useState, useMemo } from 'react';
import { 
  X, 
  Save, 
  Users, 
  Store, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Utensils,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { Booking, Restaurant, OrderItem, ThemeConfig } from '../types';
import { formatKRW, maskKoreanName } from '../utils';

interface EditBookingModalProps {
  booking: Booking | null;
  restaurants: Restaurant[];
  themeConfig: ThemeConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBooking: Booking) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  restaurants,
  themeConfig,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !booking) return null;

  // Local editable state
  const [rawName, setRawName] = useState<string>(booking.rawName || '');
  const [headcount, setHeadcount] = useState<number>(booking.headcount || 1);
  const [companions, setCompanions] = useState<string[]>(
    booking.rawCompanions || booking.companions || []
  );
  const [memo, setMemo] = useState<string>(booking.memo || '');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    booking.restaurantId || restaurants[0]?.id || ''
  );
  // Items map: menuItemId -> quantity
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    booking.items.forEach((item) => {
      map[item.menuItemId] = item.quantity;
    });
    return map;
  });
  const [status, setStatus] = useState<Booking['status']>(booking.status || '접수완료');
  const [error, setError] = useState<string | null>(null);

  // Selected Restaurant
  const activeRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
  }, [restaurants, selectedRestaurantId]);

  // Headcount change
  const handleHeadcountChange = (count: number) => {
    const valid = Math.max(1, count);
    setHeadcount(valid);
    const needed = Math.max(0, valid - 1);
    setCompanions((prev) => {
      const next = [...prev];
      if (next.length < needed) {
        while (next.length < needed) next.push('');
      } else if (next.length > needed) {
        return next.slice(0, needed);
      }
      return next;
    });
  };

  const handleCompanionChange = (index: number, val: string) => {
    setCompanions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleAddCompanion = () => {
    setCompanions((prev) => [...prev, '']);
    setHeadcount((h) => h + 1);
  };

  const handleRemoveCompanion = (index: number) => {
    setCompanions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setHeadcount((h) => Math.max(1, h - 1));
      return next;
    });
  };

  // Quantity change
  const handleQuantityChange = (menuId: string, delta: number) => {
    setItemQuantities((prev) => {
      const curr = prev[menuId] || 0;
      const next = Math.max(0, curr + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: next };
    });
  };

  // Switch restaurant
  const handleRestaurantChange = (newRestId: string) => {
    setSelectedRestaurantId(newRestId);
    setItemQuantities({}); // reset quantities when changing restaurant
  };

  // Calculate totals
  const totalAmount = useMemo(() => {
    if (!activeRestaurant) return 0;
    return (Object.entries(itemQuantities) as [string, number][]).reduce((sum, [menuId, qty]) => {
      const menu = activeRestaurant.menus.find((m) => m.id === menuId);
      return sum + (menu ? menu.price * Number(qty) : 0);
    }, 0);
  }, [activeRestaurant, itemQuantities]);

  const budgetPerPerson = themeConfig.budgetPerPerson || 10000;
  const totalBudget = headcount * budgetPerPerson;
  const difference = totalBudget - totalAmount;

  // Save changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rawName.trim()) {
      setError('대표자 실명을 입력해 주세요.');
      return;
    }

    if (!activeRestaurant) {
      setError('선택된 식당이 없습니다.');
      return;
    }

    // Build OrderItem[]
    const items: OrderItem[] = (Object.entries(itemQuantities) as [string, number][])
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([menuId, qty]) => {
        const menu = activeRestaurant.menus.find((m) => m.id === menuId);
        return {
          menuItemId: menuId,
          name: menu?.name || '선택 메뉴',
          price: menu?.price || 0,
          quantity: Number(qty),
        };
      });

    const validRawCompanions = companions.map((c) => c.trim()).filter((c) => c.length > 0);
    const maskedCompanions = validRawCompanions.map((name) => maskKoreanName(name));

    const updatedBooking: Booking = {
      ...booking,
      rawName: rawName.trim(),
      representativeName: maskKoreanName(rawName.trim()),
      headcount,
      companions: maskedCompanions,
      rawCompanions: validRawCompanions,
      memo: memo.trim() ? memo.trim() : '',
      restaurantId: activeRestaurant.id,
      restaurantName: activeRestaurant.name,
      items,
      totalAmount,
      totalBudget,
      difference,
      status,
    };

    onSave(updatedBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">점심 신청 내역 편집</h3>
              <p className="text-xs text-slate-300">
                신청 조 ID: <span className="font-mono text-indigo-300">{booking.id}</span> (접수 {booking.createdAt})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Basic Info: Name, Headcount, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                대표 신청자 (실명) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={rawName}
                onChange={(e) => setRawName(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 홍길동"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                공개 표시: {maskKoreanName(rawName) || '-'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                총 인원수 (명)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleHeadcountChange(headcount - 1)}
                  disabled={headcount <= 1}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={(e) => handleHeadcountChange(Number(e.target.value))}
                  className="w-16 p-2 rounded-xl border text-center font-bold bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => handleHeadcountChange(headcount + 1)}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                진행 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Booking['status'])}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="접수완료">접수완료</option>
                <option value="식권수령완료">식권수령완료</option>
                <option value="식당이동중">식당이동중</option>
                <option value="식사완료">식사완료</option>
              </select>
            </div>
          </div>

          {/* 2. Companions List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>함께 식사하는 팀원 ({companions.length}명)</span>
              </label>
              <button
                type="button"
                onClick={handleAddCompanion}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>팀원 추가</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {companions.map((comp, idx) => (
                <div key={idx} className="relative flex items-center">
                  <input
                    type="text"
                    value={comp}
                    onChange={(e) => handleCompanionChange(idx, e.target.value)}
                    placeholder={`동행자 ${idx + 1}`}
                    className="w-full pl-2.5 pr-16 py-2 rounded-lg border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs font-medium"
                  />
                  {comp.trim() && (
                    <span className="absolute right-7 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 pointer-events-none">
                      {maskKoreanName(comp.trim())}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveCompanion(idx)}
                    className="absolute right-1 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Restaurant Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
              <Store className="w-3.5 h-3.5 text-indigo-500" />
              <span>신청 식당 변경</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRestaurantChange(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeRestaurant?.id === r.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{r.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Menu Items Selection & Quantities */}
          {activeRestaurant && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Utensils className="w-3.5 h-3.5 text-indigo-500" />
                <span>[{activeRestaurant.name}] 주문 메뉴 및 수량 수정</span>
              </label>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-1">
                {activeRestaurant.menus.map((menu) => {
                  const qty = itemQuantities[menu.id] || 0;
                  return (
                    <div key={menu.id} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {menu.name}
                        </span>
                        <span className="ml-2 font-mono text-indigo-600 dark:text-indigo-400">
                          {formatKRW(menu.price)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(menu.id, -1)}
                          disabled={qty <= 0}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900 dark:text-slate-100">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(menu.id, 1)}
                          className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Memo Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>요청사항 및 전달 메모</span>
            </label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={200}
              className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* 5. Budget Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">인원 {headcount}명 기준 지원 식대:</span>
              <strong className="ml-1 text-slate-800 dark:text-slate-200 font-bold">
                {formatKRW(totalBudget)}
              </strong>
              <span className="text-slate-400 ml-2">
                (1인 {formatKRW(budgetPerPerson)})
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <span className="text-slate-500">주문 총액:</span>
                <strong className="ml-1 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                  {formatKRW(totalAmount)}
                </strong>
              </div>

              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  difference < 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {difference < 0 ? `초과 ${formatKRW(Math.abs(difference))}` : `잔여 ${formatKRW(difference)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>수정사항 저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
