"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProgramList from "@/components/coach/ProgramList";
import SidebarNav from "@/components/ui/SidebarNavCoach";

interface Notification {
  isRead: boolean;
}

const DashboardCoachPage = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const unread = (data.notifications as Notification[])?.filter((n) => !n.isRead) || [];
      setUnreadCount(unread.length);
    };

    fetchUnreadCount();
  }, []);

  return (
    <div className="flex">
      <SidebarNav unreadCount={unreadCount} />

      <main className="ml-16 w-full p-8">
        <h1 className="text-2xl font-bold mb-6">Koç Paneli</h1>

        <div className="mb-4">
          <Link href="/dashboard/coach/programs/create">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              ➕ Yeni Program Oluştur
            </button>
          </Link>
        </div>

        <ProgramList />
      </main>
    </div>
  );
};

export default DashboardCoachPage;
