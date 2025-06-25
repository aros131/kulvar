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
    enum: [
      "Kilo Kaybı", 
      "Kas Kazanımı", 
      "Dayanıklılık", 
      "Genel Fitness",
      "Genel Fitness ve Güç Geliştirme", // ✅ Eklenen değer
      "Hedefe Özel Gelişim"
    ], 
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
              duration: { type: String, default: "0 dakika" }, // **Süre (Örn: "30 dakika")**
              restTime: { type: Number, default: 0 }, // **Setler arası dinlenme süresi (saniye olarak)**
              videoUrls: [{ url: { type: String }, description: { type: String } }], // **Egzersiz video linkleri**
            },
          ],
        },
      ],
      notes: { type: String, default: "" } // **Koç Notları**
    },
  ],

  exercises: [
    {
      name: { type: String, required: true },
      sets: { type: Number },
      reps: { type: Number },
      duration: { type: String, default: "0 dakika" }, // **Süre metin olarak girilebilir**
      videoUrls: [{ url: { type: String }, description: { type: String } }] // **Egzersiz videoları**
    }
  ],

  nutritionPlan: {
    tips: [{ type: String }], // **Beslenme ipuçları**
    meals: [{ name: { type: String }, description: { type: String }, time: { type: String } }], // **Öğün bilgileri**
  },

  documents: [{ name: { type: String }, url: { type: String } }], // **Programla ilgili belgeler**

  announcements: [{ message: { type: String }, date: { type: Date, default: Date.now } }], // **Duyurular**

  progressTracking: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      progressPercentage: { type: Number, default: 0 },
      completedSessions: { type: Number, default: 0 },
    },
  ],

  feedback: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      session: { type: String }, // Optional: Add session details if session-specific.
      createdAt: { type: Date, default: Date.now },
    },
  ],
  

  missedWorkouts: [  // ✅ Track rescheduled workouts
    {
      missedDay: { type: Number, required: true },
      rescheduledTo: { type: Number, required: false }, // Nullable: Only set if rescheduled
      status: { 
        type: String, 
        enum: ["Kaçırıldı", "Yeniden Planlandı"], // Turkish: "Missed", "Rescheduled"
        default: "Kaçırıldı" // Default to "Missed" in Turkish
    },
  },
      
  ],


  status: { type: String, enum: ["Aktif", "Tamamlandı", "Durduruldu"], default: "Aktif"},
  createdAt: { type: Date, default: Date.now }, // **Oluşturulma tarihi**
});



// **Tamamlama yüzdesini otomatik hesapla**
ProgramSchema.pre("save", function (next) {
  const totalSessions = this.dailySchedule?.reduce(
    (sum, day) => sum + (day.sessions?.length || 0),
    0
  ) || 0;

  if (Array.isArray(this.progressTracking)) {
    this.progressTracking.forEach((entry) => {
      entry.progressPercentage =
        totalSessions > 0 ? (entry.completedSessions / totalSessions) * 100 : 0;
    });
  }
  next();
});

module.exports = mongoose.model("Program", ProgramSchema);
