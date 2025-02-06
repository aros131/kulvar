const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // **Program süresi (hafta olarak)**
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  difficulty: { type: String, enum: ["Başlangıç", "Orta Düzey", "İleri Seviye"], default: "Başlangıç" },

  fitnessGoal: { 
    type: String, 
    enum: ["Kilo Kaybı", "Kas Kazanımı", "Dayanıklılık", "Genel Fitness"], 
    required: true 
  },

  dailySchedule: [
    {
      day: { type: String, required: true }, // **Gün adı (Pazartesi, Salı vb.)**
      sessions: [
        {
          name: { type: String, required: true }, // **Antrenman adı**
          exercises: [
            {
              name: { type: String, required: true }, // **Egzersiz adı**
              sets: { type: Number, default: 0 }, // **Set sayısı**
              reps: { type: Number, default: 0 }, // **Tekrar sayısı**
              duration: { type: Number, default: 0 }, // **Egzersiz süresi (saniye olarak)**
              restTime: { type: Number, default: 0 }, // **Setler arası dinlenme süresi (saniye olarak)**
              videoUrls: [{ url: { type: String }, description: { type: String } }], // **Egzersiz video linkleri**
            },
          ],
        },
      ],
    },
  ],

  nutritionPlan: {
    tips: [{ type: String }], // **Beslenme ipuçları**
    meals: [{ name: { type: String }, description: { type: String }, time: { type: String } }], // **Öğün bilgileri**
  },

  documents: [{ name: { type: String }, url: { type: String } }], // **Programla ilgili belgeler**

  announcements: [{ message: { type: String }, date: { type: Date, default: Date.now } }], // **Duyurular**

  progressTracking: {
    totalSessions: { type: Number, default: 0 }, // **Toplam antrenman sayısı**
    completedSessions: { type: Number, default: 0 }, // **Tamamlanan antrenman sayısı**
    completionRate: { type: Number, default: 0 }, // **Tamamlama yüzdesi**
  },

  feedback: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // **Geri bildirimi yapan kullanıcı**
      comment: { type: String }, // **Yorum**
      rating: { type: Number, min: 1, max: 5 }, // **Puan (1-5)**
      createdAt: { type: Date, default: Date.now },
    },
  ],

  sessionFeedback: [  // ✅ Store feedback per session
    {
      session: { type: String }, // "Day 1 - Bench Press"
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      feedback: { type: String },
      date: { type: Date, default: Date.now },
    }
  ],

  missedWorkouts: [  // ✅ Track rescheduled workouts
    {
      missedDay: { type: Number, required: true },
      rescheduledTo: { type: Number, required: false }, // Nullable: Only set if rescheduled
    }
  ],

  status: { type: String, enum: ["Aktif", "Tamamlandı", "Durduruldu"], default: "Aktif" },

  createdAt: { type: Date, default: Date.now }, // **Oluşturulma tarihi**
});

// **Tamamlama yüzdesini otomatik hesapla**
ProgramSchema.pre("save", function (next) {
  if (this.progressTracking.totalSessions > 0) {
    this.progressTracking.completionRate =
      (this.progressTracking.completedSessions / this.progressTracking.totalSessions) * 100;
  }
  next();
});

module.exports = mongoose.model("Program", ProgramSchema);
