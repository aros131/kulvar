"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function FirestoreTestPage() {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const loadTestData = async () => {
      const querySnapshot = await getDocs(collection(db, "test"));
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocs(fetched);
      console.log("📄 Firestore test docs:", fetched);
    };

    loadTestData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">🧪 Firestore Test</h1>
      <ul className="mt-2 list-disc pl-4">
        {docs.map((doc) => (
          <li key={doc.id}>{JSON.stringify(doc)}</li>
        ))}
      </ul>
    </div>
  );
}
