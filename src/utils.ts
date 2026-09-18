import { Booking, Restaurant } from './types';

/**
 * Korean name masking function
 * e.g. "홍길동" -> "홍*동", "김철" -> "김*", "남궁민수" -> "남**수"
 */
export function maskKoreanName(name: string): string {
  if (!name || name.trim().length === 0) return '';
  const trimmed = name.trim();
  const len = trimmed.length;
  if (len === 1) return trimmed;
  if (len === 2) return trimmed[0] + '*';
  if (len === 3) return trimmed[0] + '*' + trimmed[2];
  if (len === 4) return trimmed[0] + '**' + trimmed[3];
  return trimmed[0] + '*'.repeat(len - 2) + trimmed[len - 1];
}

export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 한국 표준시(KST, UTC+9) 기준 날짜 문자열 ('YYYY-MM-DD') 반환
 */
export function getKSTDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Format: YYYY-MM-DD
  } catch (e) {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const kstDate = new Date(utc + 9 * 60 * 60 * 1000);
    const yyyy = kstDate.getFullYear();
    const mm = String(kstDate.getMonth() + 1).padStart(2, '0');
    const dd = String(kstDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * 특정 신청 내역이 오늘(KST 기준) 생성된 유효한 신청인지 판별
 */
export function isBookingFromTodayKST(booking: Booking, todayKST = getKSTDateString()): boolean {
  if (!booking) return false;

  // 1. createdAt 형식 확인: e.g. "2026.09.18 10:42" or "2026-09-18 10:42"
  const rawDate = booking.createdAt || '';
  const normalized = rawDate.replace(/\./g, '-').trim();
  if (normalized.startsWith(todayKST)) {
    return true;
  }

  // 2. ID에 타임스탬프가 포함된 경우: e.g. "book-1726651234567"
  const match = booking.id.match(/\d{12,}/);
  if (match) {
    const ts = parseInt(match[0], 10);
    if (!isNaN(ts) && ts > 0) {
      const bookingDateKST = getKSTDateString(new Date(ts));
      return bookingDateKST === todayKST;
    }
  }

  // 3. updatedAt 필드가 숫자로 있는 경우
  const updatedAt = (booking as any).updatedAt;
  if (typeof updatedAt === 'number' && updatedAt > 0) {
    const bookingDateKST = getKSTDateString(new Date(updatedAt));
    return bookingDateKST === todayKST;
  }

  // 4. 날짜 없이 시간만 있고(e.g. "10:42"), createdAt에 연도 정보가 없는 옛 레거시 데이터는 오늘이 아님
  return false;
}

/**
 * Formats current date and time into 'YYYY.MM.DD HH:mm'
 */
export function getCurrentDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * Formats existing createdAt string for display.
 * If it's already full datetime (e.g. '2026.09.17 12:30'), keeps it.
 * If it's only time (e.g. '10:42'), prepends today's date for display consistency.
 */
export function formatDisplayCreatedAt(createdAt: string): string {
  if (!createdAt) return '';
  const trimmed = createdAt.trim();
  // Already contains date (contains dot or dash or slash)
  if (trimmed.includes('.') || trimmed.includes('-') || trimmed.includes('/')) {
    return trimmed;
  }
  // Otherwise it's likely just time e.g. "10:42" -> prefix today's date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day} ${trimmed}`;
}

/**
 * Builds polite restaurant phone call / SMS reservation text
 */
export function generateRestaurantReservationText(
  restaurant: Restaurant,
  bookingsForRestaurant: Booking[],
  visitTime = '12:00'
): string {
  const totalPeople = bookingsForRestaurant.reduce((sum, b) => sum + b.headcount, 0);
  
  // Aggregate menu counts
  const menuSummaryMap: Record<string, number> = {};
  bookingsForRestaurant.forEach((b) => {
    b.items.forEach((item) => {
      menuSummaryMap[item.name] = (menuSummaryMap[item.name] || 0) + item.quantity;
    });
  });

  const menuLines = Object.entries(menuSummaryMap).map(([name, qty]) => `  - ${name}: ${qty}개`);

  const groupsSummary = bookingsForRestaurant
    .map((b) => `  • ${b.rawName || b.representativeName} 팀 (${b.headcount}명)${b.memo ? ` [메모: ${b.memo}]` : ''}`)
    .join('\n');

  return `[점심 단체 사전 예약 요청 - ${restaurant.name}]
안녕하세요 사장님, 오늘 점심 단체 예약 및 사전 주문 내용 전달드립니다.

• 방문 식당: ${restaurant.name} (${restaurant.category})
• 방문 예정 시각: 오늘 ${visitTime}
• 총 예약 인원: 총 ${totalPeople}명 (${bookingsForRestaurant.length}개 조)
${groupsSummary}

• 주문 메뉴 합계:
${menuLines.length > 0 ? menuLines.join('\n') : '  (현장 주문 예정)'}

※ 현장 결제 예정입니다.
도착 시 바로 식사할 수 있도록 사전 준비 부탁드립니다. 감사합니다!`;
}

/**
 * Slack sharing format
 */
export function generateSlackShareText(booking: Booking): string {
  const itemsText = booking.items.map((i) => `${i.name} ${i.quantity}개`).join(', ');
  return `🍱 *[점심 그룹 신청 완료]*
• *대표 신청자:* ${booking.representativeName} (총 ${booking.headcount}명)
• *동행 인원:* ${booking.companions.length > 0 ? booking.companions.join(', ') : '단독'}
• *선택 식당:* ${booking.restaurantName}
• *주문 메뉴:* ${itemsText}
• *총 주문액:* ${formatKRW(booking.totalAmount)} (지원 한도 ${formatKRW(booking.totalBudget)})
${booking.difference < 0 ? `⚠️ 초과액 ${formatKRW(Math.abs(booking.difference))} (개인부담)` : '✅ 한도 내 지원 충족'}${booking.memo ? `\n• *전달 메모:* "${booking.memo}"` : ''}
함께 즐거운 점심 시간 되세요! ✨`;
}

/**
 * KakaoTalk sharing format
 */
export function generateKakaoShareText(booking: Booking): string {
  const itemsText = booking.items.map((i) => `${i.name} ${i.quantity}개`).join(', ');
  return `[점심 신청 확인]
대표자: ${booking.representativeName}
식당: ${booking.restaurantName} (총 ${booking.headcount}명)
동행: ${booking.companions.length > 0 ? booking.companions.join(', ') : '단독'}
메뉴: ${itemsText}
합계: ${formatKRW(booking.totalAmount)} / 지원한도: ${formatKRW(booking.totalBudget)}
${booking.difference < 0 ? `(초과금액: ${formatKRW(Math.abs(booking.difference))})` : '(지원 충족)'}${booking.memo ? `\n메모: ${booking.memo}` : ''}
오늘 점심 맛있게 드세요!`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
}
