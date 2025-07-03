// components/program/RestartButton.tsx

import React from "react";
import { Button } from "@/components/ui/button";

interface RestartButtonProps {
  onRestart: () => void;
}

const RestartButton: React.FC<RestartButtonProps> = ({ onRestart }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2">Programı Sıfırla</h2>
      <Button variant="destructive" onClick={onRestart}>
        Programı Sıfırla
      </Button>
    </div>
  );
};

export default RestartButton;
