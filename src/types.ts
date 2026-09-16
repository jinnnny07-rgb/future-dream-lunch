export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  isPopular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  description: string;
  voucherOnly: boolean;
  voucherNotice?: string;
  iconName?: string;
  tel?: string;
  menus: MenuItem[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  representativeName: string; // masked for public display (e.g. 홍*동)
  rawName: string; // real name
  headcount: number;
  companions: string[]; // masked for public display (e.g. ['이*영', '박*수'])
  rawCompanions?: string[]; // real names for admin view
  memo?: string; // special request or note from students (e.g. "오이 빼주세요", "11:50 도착 예정")
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  totalBudget: number;
  difference: number;
  agreedToPolicy: boolean;
  createdAt: string;
  status: '접수완료' | '식권수령완료' | '식당이동중' | '식사완료';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  date: string;
  type: 'notice' | 'warning' | 'info';
}

export interface ThemeConfig {
  primaryColor: string; // default #2C2B70
  secondaryColor: string; // default #C6C4C3
  accentColor: string; // default #3b82f6
  bgColor: string;
  font: string; // 'Noto Sans KR' | 'Pretendard' | 'Gowun Batang' | 'sans-serif'
  isDark: boolean;
  siteTitle: string;
  siteSubtitle: string;
  budgetPerPerson: number; // default 10,000 KRW
  deadlineTime?: string; // e.g. '11:30'
  adminPassword?: string; // e.g. '9707'
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}
