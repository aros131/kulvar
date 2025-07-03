export interface Video {
  name: string;
  url: string;
  description?: string;
}

export interface PDF {
  name: string;
  url: string;
  description?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration: string;
  restTime: number;
  videoUrls: Video[];
}

export interface Session {
  name: string;
  exercises: Exercise[];
}

export interface Day {
  day: string;
  sessions: Session[];
  notes?: string;
}

export interface Meal {
  name: string;
  description: string;
  time: string;
}

export interface Announcement {
  message: string;
  date: string; // ISO string
}

export interface ProgressTracking {
  user: string;
  progressPercentage: number;
  completedSessions: number;
}

export interface Feedback {
  userId: string;
  comment: string;
  rating: number;
  session?: string;
  createdAt: string; // ISO string
}

export interface MissedWorkout {
  missedDay: number;
  rescheduledTo?: number;
  status: "Kaçırıldı" | "Yeniden Planlandı";
}

export interface Program {
  _id: string;
  name: string;
  description: string;
  duration: number;
  coachId: string;
  coachName?: string; // ✅ add this
  completionPercentage?: number; // ✅ add this
  assignedClients: string[];
  difficulty: "Başlangıç" | "Orta Düzey" | "İleri Seviye";
  fitnessGoal:
    | "Kilo Kaybı"
    | "Kas Kazanımı"
    | "Dayanıklılık"
    | "Genel Fitness"
    | "Genel Fitness ve Güç Geliştirme"
    | "Hedefe Özel Gelişim";
  dailySchedule: Day[];
  exercises: Exercise[];
  nutritionPlan: {
    tips: string[];
    meals: Meal[];
  };
  videos: Video[];
  pdfs: PDF[];
  announcements: Announcement[];
  progressTracking: ProgressTracking[];
  feedback: Feedback[];
  missedWorkouts: MissedWorkout[];
  status: "Aktif" | "Tamamlandı" | "Durduruldu";
  createdAt: string; // ISO string
}
