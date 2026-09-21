import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  query, 
  getDocs, 
  writeBatch,
  setLogLevel
} from "firebase/firestore";
import { Booking, Restaurant, Notice, ThemeConfig, SeoConfig } from "./types";
import { getKSTDateString } from "./utils";

// Suppress excessive internal Firestore connection retry logs
try {
  setLogLevel('silent');
} catch (e) {}

// Support Vite environment variables (Vercel, Netlify, GitHub Pages) with robust default fallback
const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyAw7xQ8FxX0qwyN_XBx9GAq1nq7jIziWqE",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "future-dream-lunch.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "future-dream-lunch",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "future-dream-lunch.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "104172650549",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:104172650549:web:e66bac8c0c2ccdcd03717c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to sanitize booking object before writing to Firestore
export const cleanBookingForFirestore = (booking: Booking): Record<string, any> => {
  return {
    id: booking.id || `book-${Date.now()}`,
    representativeName: booking.representativeName || '',
    rawName: booking.rawName || '',
    headcount: Number(booking.headcount) || 1,
    companions: Array.isArray(booking.companions) ? booking.companions : [],
    rawCompanions: Array.isArray(booking.rawCompanions) ? booking.rawCompanions : [],
    memo: booking.memo ? booking.memo.trim() : '',
    restaurantId: booking.restaurantId || '',
    restaurantName: booking.restaurantName || '',
    items: Array.isArray(booking.items)
      ? booking.items.map((i) => ({
          menuItemId: i.menuItemId || '',
          name: i.name || '',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
        }))
      : [],
    totalAmount: Number(booking.totalAmount) || 0,
    totalBudget: Number(booking.totalBudget) || 0,
    difference: Number(booking.difference) || 0,
    agreedToPolicy: Boolean(booking.agreedToPolicy),
    createdAt: booking.createdAt || '',
    bookingDateKST: booking.bookingDateKST || getKSTDateString(booking.updatedAt ? new Date(booking.updatedAt) : new Date()),
    status: booking.status || '접수완료',
    updatedAt: typeof booking.updatedAt === 'number' ? booking.updatedAt : Date.now(),
  };
};

/**
 * 1. 점심 예약 실시간 Firestore 저장 (학생 신청 시 즉시 저장)
 */
export const saveBookingToFirestore = async (booking: Booking): Promise<void> => {
  const cleaned = cleanBookingForFirestore(booking);
  const bookingDoc = doc(db, "bookings", cleaned.id);
  await setDoc(bookingDoc, cleaned, { merge: true });
  console.log("[Firestore DB] Successfully saved booking:", cleaned.id);
};

/**
 * 2. 점심 예약 수정 (관리자 모드에서 편집 시 즉시 저장)
 */
export const updateBookingInFirestore = async (booking: Booking): Promise<void> => {
  const cleaned = cleanBookingForFirestore(booking);
  const bookingDoc = doc(db, "bookings", cleaned.id);
  await setDoc(bookingDoc, cleaned, { merge: true });
  console.log("[Firestore DB] Successfully updated booking:", cleaned.id);
};

/**
 * 3. [진짜 DB 삭제] 개별 점심 예약 삭제 (Firestore deleteDoc 직접 호출)
 * - 단순 로컬 상태 삭제가 아닌, Firestore 데이터베이스 원본 문서를 삭제합니다.
 */
export const deleteBookingFromFirestore = async (bookingId: string): Promise<void> => {
  if (!bookingId) return;
  const bookingDoc = doc(db, "bookings", bookingId);
  await deleteDoc(bookingDoc);
  console.log("[Firestore DB] Document successfully deleted from DB:", bookingId);
};

/**
 * 4. [진짜 DB 일괄 삭제] 다중 선택 점심 예약 일괄 삭제 (Firestore writeBatch 사용)
 */
export const deleteMultipleBookingsFromFirestore = async (bookingIds: string[]): Promise<void> => {
  if (!bookingIds || bookingIds.length === 0) return;
  const batch = writeBatch(db);
  bookingIds.forEach((id) => {
    batch.delete(doc(db, "bookings", id));
  });
  await batch.commit();
  console.log(`[Firestore DB] Successfully batch-deleted ${bookingIds.length} bookings from DB.`);
};

/**
 * 5. [진짜 DB 전체 초기화] 모든 점심 신청 내역 일괄 삭제 (Firestore writeBatch)
 */
export const clearAllBookingsFromFirestore = async (): Promise<number> => {
  const q = query(collection(db, "bookings"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("[Firestore DB] No bookings to clear in DB.");
    return 0;
  }
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
  console.log(`[Firestore DB] Successfully cleared ${snapshot.size} bookings from DB.`);
  return snapshot.size;
};

/**
 * 6. [실시간 리스너] 전체 점심 예약 구독 (onSnapshot)
 * - DB에서 삭제되면 onSnapshot을 통해 연결된 모든 기기, 브라우저, 새로고침 시에도 동일하게 즉시 삭제 반영
 */
export const subscribeBookingsFromFirestore = (
  onSuccess: (bookings: Booking[]) => void,
  onError?: (error: any) => void
): (() => void) => {
  try {
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            list.push({
              id: data.id,
              representativeName: data.representativeName || '',
              rawName: data.rawName || '',
              headcount: Number(data.headcount) || 1,
              companions: Array.isArray(data.companions) ? data.companions : [],
              rawCompanions: Array.isArray(data.rawCompanions) ? data.rawCompanions : [],
              memo: data.memo || '',
              restaurantId: data.restaurantId || '',
              restaurantName: data.restaurantName || '',
              items: Array.isArray(data.items) ? data.items : [],
              totalAmount: Number(data.totalAmount) || 0,
              totalBudget: Number(data.totalBudget) || 0,
              difference: Number(data.difference) || 0,
              agreedToPolicy: Boolean(data.agreedToPolicy),
              createdAt: data.createdAt || '',
              bookingDateKST: data.bookingDateKST || (data.createdAt ? data.createdAt.split(' ')[0].replace(/\./g, '-') : ''),
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
              status: data.status || '접수완료',
            });
          }
        });

        // 최신 접수순 정렬 (ID 또는 timestamp 기준 내림차순)
        list.sort((a, b) => {
          const timeA = (a as any).updatedAt || parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const timeB = (b as any).updatedAt || parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return timeB - timeA;
        });

        onSuccess(list);
      },
      (err) => {
        console.warn("[Firestore DB] Bookings onSnapshot notice:", err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("[Firestore DB] Bookings subscription error:", err);
    return () => {};
  }
};

/**
 * 7. 관리자 설정 저장 함수 (식당, 메뉴, 공지사항, 테마, SEO)
 */
export const saveAdminSettingsToFirestore = async (data: {
  restaurants?: Restaurant[];
  notices?: Notice[];
  themeConfig?: ThemeConfig;
  seoConfig?: SeoConfig;
  lastResetDateKST?: string;
  [key: string]: any;
}): Promise<void> => {
  try {
    await setDoc(doc(db, "lunchData", "settings"), data, { merge: true });
    console.log("[Firestore DB] Admin settings successfully synchronized.");
  } catch (error) {
    console.error("[Firestore DB] saveAdminSettingsToFirestore error:", error);
    throw error;
  }
};

/**
 * 8. 관리자 설정 실시간 구독 함수 (onSnapshot)
 */
export const subscribeAdminSettingsFromFirestore = (
  callback: (data: any) => void,
  onError?: (error: any) => void
): (() => void) => {
  try {
    const unsubscribe = onSnapshot(
      doc(db, "lunchData", "settings"),
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        }
      },
      (err) => {
        console.warn("[Firestore DB] settings onSnapshot notice:", err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("[Firestore DB] settings subscription error:", err);
    return () => {};
  }
};

// 호환성 인터페이스 유지
export const isFirestoreQuotaExhausted = (): boolean => false;
export const setFirestoreQuotaExhausted = (_val: boolean) => {};
export const resetFirestoreQuotaCheck = () => {};
export const subscribeQuotaStatus = (_cb: (exhausted: boolean) => void) => {
  return () => {};
};
export const saveAdminData = saveAdminSettingsToFirestore;
export const subscribeAdminData = subscribeAdminSettingsFromFirestore;
