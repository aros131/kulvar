import React from "react";
import Link from "next/link";
import ProgramList from "@/components/coach/ProgramList";

const DashboardCoachPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Koç Paneli</h1>

      <div className="mb-4">
        <Link href="/dashboard/coach/programs/create">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            ➕ Yeni Program Oluştur
          </button>
        </Link>
      </div>

      <ProgramList />
    </div>
  );
};

export default DashboardCoachPage;
