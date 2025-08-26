"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProgramList from "@/components/coach/ProgramList";
import SidebarNav from "@/components/ui/SidebarNavCoach";
import Link from "next/link";

// 🔹 import the availability manager
import CoachAvailability from "@/components/coach/CoachAvailability";

interface CoachProfile {
  name: string;
  email: string;
  profilePicture: string;
  specialization?: string;
  role: "coach";
}

interface Notification {
  isRead: boolean;
}

export default function DashboardCoachPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://kulvar-qb7t.onrender.com/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.role !== "coach") throw new Error("Not a coach profile");
        setProfile(data);
      } catch {
        console.error("Profil verisi alınamadı.");
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const unread = (data.notifications as Notification[]).filter((n) => !n.isRead);
        setUnreadCount(unread.length);
      } catch {
        // ignore silently for now
      }
    };

    fetchProfile();
    fetchUnreadCount();
  }, []);

  return (
    <div className="flex">
      <SidebarNav unreadCount={unreadCount} />

      <main className="ml-16 w-full p-8 space-y-8">
        <h1 className="text-2xl font-bold">Koç Paneli</h1>

        {profile && (
          <div className="flex items-center gap-4">
            <Image
              src={profile.profilePicture || "/images/default-user.jpg"}
              alt="Profil Fotoğrafı"
              width={80}
              height={80}
              className="rounded-full object-cover border"
              unoptimized
            />
            <div>
              <h2 className="text-xl font-semibold">Hoş Geldin, {profile.name}!</h2>
              <p className="text-gray-600 text-sm">{profile.email}</p>
              <p className="text-gray-600 text-sm">
                {profile.specialization || "Uzmanlık belirtilmemiş"}
              </p>
            </div>
          </div>
        )}

        <div>
          <Link href="/dashboard/coach/programs/create">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              ➕ Yeni Program Oluştur
            </button>
          </Link>
        </div>

        {/* 🔹 Availability manager section */}
        <section aria-label="Uygunluk">
          <h2 className="text-xl font-semibold mb-3">Uygunluk</h2>
          <CoachAvailability />
        </section>

        {/* Existing programs list */}
        <section aria-label="Programlar">
          <h2 className="text-xl font-semibold mb-3">Programlar</h2>
          <ProgramList />
        </section>
      </main>
    </div>
  );
}
