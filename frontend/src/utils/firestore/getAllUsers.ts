import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as { name: string; role: string })
  }));
}
