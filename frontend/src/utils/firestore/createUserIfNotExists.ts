import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function createUserIfNotExists(
  userId: string,
  name: string,
  role: "coach" | "client"
) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, { name, role });
    console.log(`✅ Created user ${name} (${role}) in Firestore`);
  } else {
    console.log("ℹ️ User already exists");
  }
}
