import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

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

// 관리자 데이터 저장 함수
export const saveAdminData = async (data: any) => {
  await setDoc(doc(db, "lunchData", "settings"), data);
};

// 실시간 데이터 불러오기 함수
export const subscribeAdminData = (callback: (data: any) => void) => {
  return onSnapshot(doc(db, "lunchData", "settings"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};
