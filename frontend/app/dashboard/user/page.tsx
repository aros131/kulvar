"use client";


import Navbar from "@/components/Navbar";
import WelcomeWidget from "@/components/dashboard/WelcomeWidget";



export default function UserDashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <WelcomeWidget />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            Yaklaşan Antrenman
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            Program İlerlemesi
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            Takvim
          </div>
        </div>
      </section>
    </main>
  );
}
