// components/dashboard/WelcomeWidget.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface UserProfile {
  name: string;
  profilePicture?: string;
}

export default function WelcomeWidget() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found");
    return;
  }

  fetch("https://kulvar-qb7t.onrender.com/auth/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => setProfile(data))
    .catch((err) => console.error("Profile fetch error:", err));
}, []);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md p-6 flex items-center gap-6">
      <Image
        src={profile?.profilePicture || "/images/default.jpg"}
        alt={profile?.name || "Kullanıcı"}
        width={80}
        height={80}
        className="rounded-full object-cover border-2 border-indigo-500"
      />
      <div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">
          Hoş geldin, {profile?.name || "Kullanıcı"}!
        </h2>
        <p className="text-zinc-600 dark:text-zinc-300">
          Bugün de güçlü olmaya hazır mısın?
        </p>
      </div>
    </div>
  );
}
