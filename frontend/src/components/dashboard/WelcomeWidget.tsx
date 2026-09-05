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

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
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
    <div className="bg-card dark:bg-primary/90 rounded-xl shadow-md p-6 flex items-center gap-6">
      <Image
        src={profile?.profilePicture || "/images/default.jpg"}
        alt={profile?.name || "Kullanıcı"}
        width={80}
        height={80}
        className="rounded-2xl object-cover border-2 border-indigo-500"
      />
      <div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white">
          Hoş geldin, {profile?.name || "Kullanıcı"}!
        </h2>
        <p className="text-muted-foreground dark:text-zinc-300">
          Bugün de güçlü olmaya hazır mısın?
        </p>
      </div>
    </div>
  );
}
