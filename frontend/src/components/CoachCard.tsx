'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CoachCardProps {
  id: string;
  name: string;
  specialization?: string;
  profilePicture?: string;
}

export default function CoachCard({
  id,
  name,
  specialization,
  profilePicture,
}: CoachCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden transition duration-300"
    >
      <Link href={`/coach/${id}`}>
        <div className="p-4 text-center">
          <div className="w-28 h-28 mx-auto mb-4 relative">
            <Image
              src={profilePicture || '/images/default-avatar.jpg'}
              alt={name}
              fill
              className="rounded-full object-cover border-2 border-indigo-500"
            />
          </div>
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">{name}</h3>
          {specialization && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{specialization}</p>
          )}
          <span className="inline-block mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
            Profili Gör
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
