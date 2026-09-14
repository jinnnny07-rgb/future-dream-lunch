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
    .map((b) => `  • ${b.representativeName} 팀 (${b.headcount}명)`)
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
${booking.difference < 0 ? `⚠️ 초과액 ${formatKRW(Math.abs(booking.difference))} (개인부담)` : '✅ 한도 내 지원 충족'}
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
${booking.difference < 0 ? `(초과금액: ${formatKRW(Math.abs(booking.difference))})` : '(지원 충족)'}
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
