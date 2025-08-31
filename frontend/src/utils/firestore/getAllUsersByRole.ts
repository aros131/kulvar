// src/utils/firestore/getAllUsersByRole.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const getAllUsersByRole = async (role: string) => {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as { id: string; name: string; role: string }[];
};
