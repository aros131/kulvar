import React from "react";
import Link from "next/link";
import ProgramList from "@/components/coach/ProgramList";
import SidebarNav from "@/components/ui/SidebarNav";

const DashboardCoachPage = () => {
  return (
    <div className="flex">
      <SidebarNav />

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
