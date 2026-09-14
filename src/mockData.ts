import { Restaurant, Notice, Booking, ThemeConfig, SeoConfig } from './types';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: '임방식당',
    category: '한식 / 찌개 / 볶음류',
    description: '정갈한 밑반찬과 깊은 육수의 찌개, 불맛 가득한 제육볶음 맛집',
    voucherOnly: false,
    tel: '02-555-1284',
    iconName: 'Utensils',
    menus: [
      { id: 'm-101', name: '돼지고기 김치찌개', price: 9000, description: '국내산 암퇘지와 묵은지의 칼칼한 조화', isPopular: true },
      { id: 'm-102', name: '해물 순두부찌개', price: 9000, description: '신선한 바지락과 부드러운 순두부' },
      { id: 'm-103', name: '전통 얼큰 육개장', price: 9500, description: '푹 고아낸 사골 육수와 푸짐한 소고기', isPopular: true },
      { id: 'm-104', name: '바지락 손칼국수', price: 8500, description: '직접 반죽한 쫄깃한 면발과 시원한 국물' },
      { id: 'm-105', name: '직화 제육볶음 (밥 포함)', price: 10000, description: '불향 가득한 매콤달콤 양념 제육', isPopular: true },
      { id: 'm-106', name: '뚝배기 소불고기', price: 10000, description: '달콤 짭조름한 양념과 당면이 듬뿍' },
    ],
  },
  {
    id: 'rest-2',
    name: '칭마레이',
    category: '중식',
    description: '빠르고 깔끔한 정통 중화요리 전문점',
    voucherOnly: false,
    tel: '02-555-8930',
    iconName: 'Soup',
    menus: [
      { id: 'm-201', name: '명품 짜장면', price: 7000, description: '직접 볶은 고소한 춘장과 쫄깃한 수타면', isPopular: true },
      { id: 'm-202', name: '얼큰 해물 짬뽕', price: 8500, description: '오징어, 홍합, 꽃게가 듬뿍 들어간 불맛 국물', isPopular: true },
      { id: 'm-203', name: '통새우 볶음밥 (짜장소스+짬뽕국물)', price: 9000, description: '탱글탱글한 통새우와 고슬고슬한 볶음밥' },
      { id: 'm-204', name: '찹쌀 탕수육 (미니 사이즈)', price: 12000, description: '바삭하고 쫀득한 찹쌀 튀김옷과 과일 소스' },
      { id: 'm-205', name: '바삭 군만두 (8개)', price: 5500, description: '육즙 가득 바삭하게 튀겨낸 사이드 만두' },
    ],
  },
  {
    id: 'rest-3',
    name: '고릴라쿡',
    category: '분식 / 덮밥 / 퓨전',
    description: '돈까스, 덮밥, 찌개부터 김밥까지 다양한 메뉴를 신속하게 즐기는 곳',
    voucherOnly: false,
    tel: '02-555-4421',
    iconName: 'Sandwich',
    menus: [
      { id: 'm-301', name: '수제 등심 돈까스', price: 9000, description: '두툼한 국내산 생등심과 특제 브라운 소스', isPopular: true },
      { id: 'm-302', name: '매콤 제육덮밥', price: 8500, description: '아삭한 채소와 매콤한 양념 덮밥' },
      { id: 'm-303', name: '든든 햄듬뿍 부대찌개 (1인)', price: 9500, description: '스팸과 소시지, 라면사리가 들어간 칼칼한 찌개', isPopular: true },
      { id: 'm-304', name: '진한 비프 카레덮밥', price: 8000, description: '오랜 시간 뭉근하게 끓여낸 일본식 비프 카레' },
      { id: 'm-305', name: '고소한 참치마요 김밥', price: 4500, description: '참치와 마요네즈, 깻잎이 꽉 찬 프리미엄 김밥' },
      { id: 'm-306', name: '얼큰 신라면 + 공깃밥 세트', price: 5000, description: '계란과 파를 송송 썰어 넣은 라면 & 밥' },
      { id: 'm-307', name: '고소한 치즈라면', price: 4500, description: '체다치즈를 얹어 풍미를 더한 고소한 라면' },
    ],
  },
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: '📢 [공지] 오늘 점심 신청 마감 및 식대 지원 안내',
    content: '금일 점심 신청은 식당 준비 및 주문 집계를 위해 오전 10:30에 마감됩니다. 인당 10,000원 기준을 준수해 주시기 바랍니다.',
    isPinned: true,
    date: '오늘 09:30',
    type: 'notice',
  },
  {
    id: 'notice-2',
    title: '💡 [점심 안내] 식당별 이동 및 예약 준수 안내',
    content: '각 조별 대표자께서는 11:45까지 식당으로 이동해 주시기 바라며, 변동 사항이 있을 경우 대시보드를 통해 확인해 주세요.',
    isPinned: false,
    date: '오늘 09:50',
    type: 'info',
  },
  {
    id: 'notice-3',
    title: '🚗 [안내] 이동 매너 및 변경 사항 접수',
    content: '식당 사전 예약 후 불가피하게 인원 변동이나 취소가 발생하는 경우 실시간 대시보드에서 수정 또는 관리자에게 즉시 알려주세요.',
    isPinned: false,
    date: '오늘 10:45',
    type: 'info',
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    representativeName: '홍*동',
    rawName: '홍길동',
    headcount: 4,
    companions: ['김철수', '이영희', '박지민'],
    restaurantId: 'rest-1',
    restaurantName: '임방식당',
    items: [
      { menuItemId: 'm-101', name: '돼지고기 김치찌개', price: 9000, quantity: 2 },
      { menuItemId: 'm-105', name: '직화 제육볶음 (밥 포함)', price: 10000, quantity: 2 },
    ],
    totalAmount: 38000,
    totalBudget: 40000,
    difference: 2000, // remaining
    agreedToPolicy: true,
    createdAt: '10:42',
    status: '접수완료',
  },
  {
    id: 'book-2',
    representativeName: '이*수',
    rawName: '이진수',
    headcount: 3,
    companions: ['최수아', '강현우'],
    restaurantId: 'rest-2',
    restaurantName: '칭마레이',
    items: [
      { menuItemId: 'm-201', name: '명품 짜장면', price: 7000, quantity: 1 },
      { menuItemId: 'm-202', name: '얼큰 해물 짬뽕', price: 8500, quantity: 2 },
      { menuItemId: 'm-205', name: '바삭 군만두 (8개)', price: 5500, quantity: 1 },
    ],
    totalAmount: 29500,
    totalBudget: 30000,
    difference: 500,
    agreedToPolicy: true,
    createdAt: '10:55',
    status: '접수완료',
  },
  {
    id: 'book-3',
    representativeName: '박*민',
    rawName: '박상민',
    headcount: 2,
    companions: ['정다은'],
    restaurantId: 'rest-3',
    restaurantName: '고릴라쿡',
    items: [
      { menuItemId: 'm-301', name: '수제 등심 돈까스', price: 9000, quantity: 1 },
      { menuItemId: 'm-302', name: '매콤 제육덮밥', price: 8500, quantity: 1 },
    ],
    totalAmount: 17500,
    totalBudget: 20000,
    difference: 2500,
    agreedToPolicy: true,
    createdAt: '11:05',
    status: '식당이동중',
  },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primaryColor: '#2C2B70',
  secondaryColor: '#C6C4C3',
  accentColor: '#3b82f6',
  bgColor: '#f8fafc',
  font: 'Noto Sans KR',
  isDark: false,
  siteTitle: '신세계 Future & Dream Academy',
  siteSubtitle: '교육생 실시간 점심 예약 & 식대 관리 시스템',
  budgetPerPerson: 10000,
  deadlineTime: '10:30',
  adminPassword: '9707',
};

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  metaTitle: '신세계 Future & Dream Academy - 교육생 실시간 점심 예약 & 식대 관리 시스템',
  metaDescription: '신세계 Future & Dream Academy 교육생 실시간 점심 예약 & 식대 관리 시스템',
  keywords: '신세계, Future & Dream Academy, 퓨쳐앤드림아카데미, 점심신청, 교육생식대, 식대계산기, 식당예약, 관리자대시보드, 임방식당, 칭마레이, 고릴라쿡',
};
