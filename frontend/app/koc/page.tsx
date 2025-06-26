'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CoachCard from '@/components/CoachCard';

interface Coach {
  id: string;
  name: string;
  email?: string;
  role: 'coach';
  specialization?: string;
  profilePicture?: string;
}

export default function CoachesPage() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category') || 'all';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState(categoryQuery);

  useEffect(() => {
    fetch('https://kulvar-qb7t.onrender.com/users?role=coach')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((coach: Coach) => ({
          id: coach.id,
          name: coach.name,
          email: coach.email,
          role: coach.role,
          specialization: coach.specialization,
          profilePicture: coach.profilePicture,
        }));
        setCoaches(formatted);
      })
      
  }, []);

  const filteredCoaches = coaches.filter(coach => {
    const nameMatch = coach.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filter === 'all' || coach.specialization?.toLowerCase() === filter;
    return nameMatch && categoryMatch;
  });

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-zinc-800 dark:text-white">Koçlarımız</h1>
        <p className="text-zinc-600 dark:text-zinc-300">
          Alanında uzman koçlarımızla tanışın ve hedefinize ulaşın.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Koç ara..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
        >
          <option value="all">Tümü</option>
          <option value="fitness">Fitness</option>
          <option value="yoga">Yoga</option>
          <option value="nutrition">Beslenme</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredCoaches.length > 0 ? (
          filteredCoaches.map(coach => (
            <CoachCard
              key={coach.id}
              id={coach.id}
              name={coach.name}
              specialization={coach.specialization}
              profilePicture={coach.profilePicture}
            />
          ))
        ) : (
          <p className="text-center text-zinc-500 dark:text-zinc-400 col-span-full">
            Hiç koç bulunamadı.
          </p>
        )}
      </div>
    </main>
  );
}
