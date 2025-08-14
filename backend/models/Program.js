import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Firebase Storage asset metadata (images & videos) */
const AssetSchema = new Schema({
  kind: { type: String, enum: ['image', 'video'], required: true }, // dosya türü
  title: { type: String },
  url: { type: String, required: true },          // indirme URL’i (signed/token)
  storagePath: { type: String, required: true },  // örn: programs/{id}/images/{uuid}.jpg
  mimeType: { type: String },
  size: { type: Number },                          // byte
  width: { type: Number },                         // opsiyonel (görseller)
  height: { type: Number },                        // opsiyonel (görseller)
  durationMs: { type: Number },                    // opsiyonel (videolar)
  thumbnailUrl: { type: String },                  // opsiyonel
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

const ProgramSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // **Program süresi (hafta olarak)**
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
              restTime: { type: Number, default: 0 }, // **Setler arası dinlenme (sn)**
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

  announcements: [{ message: { type: String }, date: { type: Date, default: Date.now } }], // **Duyurular**

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
  
  missedWorkouts: [  // ✅ Kaçırılan/yeniden planlanan antrenmanlar
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
  createdAt: { type: Date, default: Date.now }, // **Oluşturulma tarihi**
});

// Not: progress hesapları Progress modelinde yönetildiği için pre-save hook kaldırıldı.

export default mongoose.model("Program", ProgramSchema);
