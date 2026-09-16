import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  query
} from "firebase/firestore";
import { Booking, Restaurant, Notice, ThemeConfig, SeoConfig } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyAw7xQ8FxX0qwyN_XBx9GAq1nq7jIziWqE",
  authDomain: "future-dream-lunch.firebaseapp.com",
  projectId: "future-dream-lunch",
  storageBucket: "future-dream-lunch.firebasestorage.app",
  messagingSenderId: "104172650549",
  appId: "1:104172650549:web:e66bac8c0c2ccdcd03717c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
    status: booking.status || '접수완료',
    updatedAt: Date.now(),
  };
};

/**
 * 점심 예약 실시간 Firestore 저장 (학생 신청 시 즉시 저장)
 */
export const saveBookingToFirestore = async (booking: Booking): Promise<void> => {
  try {
    const cleaned = cleanBookingForFirestore(booking);
    const bookingDoc = doc(db, "bookings", cleaned.id);
    await setDoc(bookingDoc, cleaned, { merge: true });
    console.log("Firestore successfully saved booking:", cleaned.id);
  } catch (error) {
    console.error("Firestore saveBookingToFirestore error:", error);
  }
};

/**
 * 점심 예약 수정 (관리자 모드에서 편집 시 즉시 저장)
 */
export const updateBookingInFirestore = async (booking: Booking): Promise<void> => {
  try {
    const cleaned = cleanBookingForFirestore(booking);
    const bookingDoc = doc(db, "bookings", cleaned.id);
    await setDoc(bookingDoc, cleaned, { merge: true });
    console.log("Firestore successfully updated booking:", cleaned.id);
  } catch (error) {
    console.error("Firestore updateBookingInFirestore error:", error);
  }
};

/**
 * 점심 예약 삭제
 */
export const deleteBookingFromFirestore = async (bookingId: string): Promise<void> => {
  try {
    const bookingDoc = doc(db, "bookings", bookingId);
    await deleteDoc(bookingDoc);
    console.log("Firestore successfully deleted booking:", bookingId);
  } catch (error) {
    console.error("Firestore deleteBookingFromFirestore error:", error);
  }
};

/**
 * 실시간 전체 점심 예약 구독 (학생/관리자 모든 기기 실시간 동기화)
 */
export const subscribeBookingsFromFirestore = (
  onSuccess: (bookings: Booking[]) => void,
  onError?: (error: any) => void
) => {
  try {
    const q = query(collection(db, "bookings"));
    return onSnapshot(
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
        console.warn("Firestore bookings subscription notice:", err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn("Firestore bookings subscription error:", err);
    return () => {};
  }
};

/**
 * 관리자 설정 저장 함수 (식당, 메뉴, 공지사항, 테마, SEO)
 */
export const saveAdminSettingsToFirestore = async (data: {
  restaurants?: Restaurant[];
  notices?: Notice[];
  themeConfig?: ThemeConfig;
  seoConfig?: SeoConfig;
}): Promise<void> => {
  try {
    await setDoc(doc(db, "lunchData", "settings"), data, { merge: true });
  } catch (error) {
    console.error("Firestore saveAdminSettingsToFirestore error:", error);
    throw error;
  }
};

/**
 * 관리자 설정 실시간 구독 함수
 */
export const subscribeAdminSettingsFromFirestore = (
  callback: (data: any) => void,
  onError?: (error: any) => void
) => {
  return onSnapshot(
    doc(db, "lunchData", "settings"),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    },
    (err) => {
      console.warn("Firestore settings subscription notice:", err);
      if (onError) onError(err);
    }
  );
};

// 기존 함수와의 호환성 유지
export const saveAdminData = async (data: any) => {
  await setDoc(doc(db, "lunchData", "settings"), data, { merge: true });
};

export const subscribeAdminData = (callback: (data: any) => void) => {
  return onSnapshot(doc(db, "lunchData", "settings"), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
};
