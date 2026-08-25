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
              name: { type: String, required: true },
              sets: { type: Number, default: 3 },
              reps: { type: Number, default: 10 },
              weight: { type: Number, default: null },
              restTime: { type: Number, default: 60 },
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
/* ===== Add fields ===== */
ProgramSchema.add({
  // Identity & visibility
  slug: { type: String, unique: true, sparse: true, trim: true },
  visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public", index: true },
  publishedAt: { type: Date },

  // Pricing (multi-currency safe) & capacity
  priceCents: { type: Number, min: 0 },             // e.g., 149900 = ₺1.499,00
  compareAtPriceCents: { type: Number, min: 0 },
  currency: { type: String, default: "TRY" },       // ISO 4217
  creditCost: { type: Number, min: 0 },             // if you use credits
  capacity: { type: Number, min: 0 },               // max concurrent clients
  requiresApproval: { type: Boolean, default: false },

  // Discovery / filtering
  tags: { type: [String], default: [], index: true },
  equipment: { type: [String], default: [] },       // e.g., "Dumbbell","Barbell","Bands"
  environment: { type: String, enum: ["Gym","Home","Outdoor","Hybrid"], default: "Gym", index: true },
  shortDescription: { type: String, maxlength: 180 },
  coverImageUrl: { type: String },                  // explicit card/hero cover

  // i18n (optional)
  locale: { type: String, default: "tr" },
  translations: {
    type: Map,                                       // key: "en","de",...
    of: new Schema(
      {
        name: String,
        shortDescription: String,
        description: String,
      },
      { _id: false }
    ),
    default: undefined,
  },

  // Lifecycle / versioning
  isTemplate: { type: Boolean, default: false },     // base template to clone
  sourceProgramId: { type: Schema.Types.ObjectId, ref: "Program" },
  version: { type: Number, default: 1 },
  archivedAt: { type: Date },
  deletedAt: { type: Date },

  // Engagement (denormalized; update via app logic)
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 },
  enrollmentCount: { type: Number, min: 0, default: 0 },
  favoritesCount: { type: Number, min: 0, default: 0 },
  viewsCount: { type: Number, min: 0, default: 0 },

  // Schedule meta (for booking later)
  timezone: { type: String, default: "Europe/Istanbul" },
  startDate: { type: Date },
  endDate: { type: Date },
  blackoutDates: { type: [Date], default: [] },
  rrule: { type: String },                           // e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  
  // Commerce integration
  stripePriceId: { type: String },
  vatRate: { type: Number, min: 0, max: 1 },         // 0.20 for 20%
  refundPolicy: { type: String },
  cancellationPolicy: { type: String },
});

/* ===== Helpful indexes ===== */
ProgramSchema.index({ coachId: 1, status: 1, createdAt: -1 });
ProgramSchema.index({ visibility: 1, publishedAt: -1 });
ProgramSchema.index({ tags: 1 });
ProgramSchema.index({ equipment: 1 });
ProgramSchema.index({ name: "text", shortDescription: "text", description: "text" }, { weights: { name: 5, shortDescription: 3, description: 1 } });

/* ===== Tiny utilities (optional) ===== */
// Virtual: price in major units (e.g., ₺ as string)
// Use on read only; keep cents in DB for accuracy.
ProgramSchema.virtual("price").get(function () {
  if (typeof this.priceCents !== "number") return undefined;
  const v = this.priceCents / 100;
  try {
    return new Intl.NumberFormat(this.locale || "tr", { style: "currency", currency: this.currency || "TRY" }).format(v);
  } catch {
    return v.toFixed(2);
  }
});

// Pre-validate slug if not set (safe)
ProgramSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = String(this.name)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 80);
  }
  next();
});


// Not: progress hesapları Progress modelinde yönetildiği için pre-save hook kaldırıldı.

export default mongoose.model("Program", ProgramSchema);
