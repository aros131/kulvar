import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Firebase Storage asset metadata (images & videos) */
const AssetSchema = new Schema({
  kind: { type: String, enum: ['image', 'video'], required: true },
  title: { type: String },
  url: { type: String, required: true },
  storagePath: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  width: { type: Number },
  height: { type: Number },
  durationMs: { type: Number },
  thumbnailUrl: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

const ProgramSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // Program süresi (hafta)
  coachId: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
  assignedClients: [{ type: Schema.Types.ObjectId, ref: "User" }], 
  difficulty: { type: String, enum: ["Başlangıç", "Orta Düzey", "İleri Seviye"], default: "Başlangıç" },

  fitnessGoal: { 
    type: String, 
    enum: [
      "Kilo Kaybı", 
      "Kas Kazanımı", 
      "Dayanıklılık", 
      "Genel Fitness",
      "Genel Fitness ve Güç Geliştirme",
      "Hedefe Özel Gelişim"
    ], 
    required: true 
  },

  /**
   * Fallback saat/süre — bir seans kendi saatini/süresini belirtmezse kullanılır.
   * (Atama başlatırken seçilen saat yine önceliklidir.)
   */
  defaultTimeOfDay: { type: String, default: "18:00" },      // "HH:mm"
  defaultDurationMin: { type: Number, default: 60, min: 0 }, // dakika

  dailySchedule: [
    {
      day: { type: String, required: true }, // Gün adı (Pazartesi, Salı vb.)
      sessions: [
        {
          /**
           * NEW: Stabil kimlik (program içinde değişmeyen) — event üretiminde eşlemek için süper yararlı.
           * Boş bırakırsanız generator otomatik bir fallback kullanır.
           */
          sessionId: { type: String },

          name: { type: String, required: true }, // Antrenman adı

          /**
           * NEW (opsiyonel): Seans saati ve süresi.
           * timeOfDay "HH:mm" formatında, durationMin dakika cinsinden.
           */
          timeOfDay: {
            type: String,
            validate: {
              validator: (v) => !v || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v),
              message: 'timeOfDay "HH:mm" formatında olmalı'
            }
          },
          durationMin: { type: Number, min: 0 }, // dakika (belirtilmezse program.defaultDurationMin)

          exercises: [
            {
              name: { type: String, required: true }, // Egzersiz adı
              sets: { type: Number, default: 0 },
              reps: { type: Number, default: 0 },
              duration: { type: String, default: "0 dakika" },
              restTime: { type: Number, default: 0 },
              videoUrls: [{ url: { type: String }, description: { type: String } }],
            },
          ],
        },
      ],
      notes: { type: String, default: "" } // Koç Notları
    },
  ],

  exercises: [
    {
      name: { type: String, required: true },
      sets: { type: Number },
      reps: { type: Number },
      duration: { type: String, default: "0 dakika" },
      videoUrls: [{ url: { type: String }, description: { type: String } }]
    }
  ],

  /** Yeni: Firebase Storage için birleşik medya alanı */
  assets: { type: [AssetSchema], default: [] },

  // 💡 Nutrition and media content
  nutritionPlan: {
    tips: [{ type: String }],
    meals: [
      { name: { type: String }, description: { type: String }, time: { type: String } }
    ],
  },

  /** Legacy alanlar — dokunmuyoruz; UI’nız bunları kullanıyorsa çalışmaya devam eder */
  videos: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
      description: { type: String }
    }
  ],

  pdfs: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
      description: { type: String }
    }
  ],

  announcements: [{ message: { type: String }, date: { type: Date, default: Date.now } }], // Duyurular

  progressTracking: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      progressPercentage: { type: Number, default: 0 },
      completedSessions: { type: Number, default: 0 },
    },
  ],

  feedback: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      comment: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      session: { type: String }, // Optional: seans detayları
      createdAt: { type: Date, default: Date.now },
    },
  ],
  
  missedWorkouts: [
    {
      missedDay: { type: Number, required: true },
      rescheduledTo: { type: Number }, // Nullable
      status: { 
        type: String, 
        enum: ["Kaçırıldı", "Yeniden Planlandı"],
        default: "Kaçırıldı"
      },
    },
  ],

  status: { type: String, enum: ["Aktif", "Tamamlandı", "Durduruldu"], default: "Aktif"},
  createdAt: { type: Date, default: Date.now },
});

// Not: progress hesapları Progress modelinde yönetildiği için pre-save hook kaldırıldı.

export default mongoose.model("Program", ProgramSchema);
