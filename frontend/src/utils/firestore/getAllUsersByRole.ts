import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function getAllUsersByRole(role: "coach" | "client") {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as { name: string; role: string })
  }));
}
