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

/**
 * 점심 예약 실시간 Firestore 저장 (학생 신청 시 즉시 저장)
 */
export const saveBookingToFirestore = async (booking: Booking): Promise<void> => {
  try {
    const bookingDoc = doc(db, "bookings", booking.id);
    await setDoc(bookingDoc, {
      ...booking,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Firestore saveBookingToFirestore error:", error);
    throw error;
  }
};

/**
 * 점심 예약 수정 (관리자 모드에서 편집 시 즉시 저장)
 */
export const updateBookingInFirestore = async (booking: Booking): Promise<void> => {
  try {
    const bookingDoc = doc(db, "bookings", booking.id);
    await setDoc(bookingDoc, {
      ...booking,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Firestore updateBookingInFirestore error:", error);
    throw error;
  }
};

/**
 * 점심 예약 삭제
 */
export const deleteBookingFromFirestore = async (bookingId: string): Promise<void> => {
  try {
    const bookingDoc = doc(db, "bookings", bookingId);
    await deleteDoc(bookingDoc);
  } catch (error) {
    console.error("Firestore deleteBookingFromFirestore error:", error);
    throw error;
  }
};

/**
 * 실시간 전체 점심 예약 구독 (학생/관리자 모든 기기 실시간 동기화)
 */
export const subscribeBookingsFromFirestore = (
  onSuccess: (bookings: Booking[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(collection(db, "bookings"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Booking);
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
