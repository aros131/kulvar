// components/ProgramHeader.tsx

import React from "react";

interface ProgramHeaderProps {
  name: string;
  description: string;
  coachName?: string;
  completionPercentage?: number;
}

const ProgramHeader: React.FC<ProgramHeaderProps> = ({
  name,
  description,
  coachName,
  completionPercentage
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
      <h1 className="text-2xl font-bold mb-2">{name}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-2">{description}</p>

      {coachName && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Koç: {coachName}</p>
      )}

      {completionPercentage !== undefined && (
        <div className="mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Tamamlanma Oranı:
          </span>
          <span className="ml-2 font-semibold">{completionPercentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgramHeader;
