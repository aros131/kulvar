const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // **Kullanıcı ID'si**
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true }, // **Bağlı olunan program**

  completedSessions: [
    {
      sessionId: { type: String }, // **Antrenman ID'si veya adı**
      completed: { type: Boolean, default: false }, // **Antrenman tamamlandı mı?**
      dateCompleted: { type: Date }, // **Tamamlanma tarihi**
      fatigueLevel: { type: String, enum: ["Düşük", "Normal", "Yüksek"], default: "Normal" }, // **Yorgunluk seviyesi**
    },
  ],

  progressMetrics: [
    {
      metricName: { type: String }, // **Ölçüm adı (Örn: "Kaldırılan Ağırlık")**
      unit: { type: String }, // **Ölçü birimi (Örn: "kg")**
      values: [{ value: { type: Number }, date: { type: Date, default: Date.now } }], // **Değerler ve tarihleri**
    },
  ],

  progressiveOverload: [
    {
      exerciseName: { type: String }, // **Egzersiz adı**
      initialWeight: { type: Number }, // **Başlangıç ağırlığı**
      currentWeight: { type: Number }, // **Güncel ağırlık**
      improvement: { type: Number }, // **Gelişim oranı**
    },
  ],

  missedWorkouts: [
    {
      missedDay: { type: Date }, // **Kaçırılan antrenman günü**
      rescheduledDay: { type: Date }, // **Yeni planlanan gün**
    }
  ],

  adaptiveAdjustments: [
    {
      exerciseName: { type: String }, // **Egzersiz adı**
      fatigueLevel: { type: String, enum: ["Düşük", "Normal", "Yüksek"] }, // **Yorgunluk seviyesi**
      suggestedWeightIncrease: { type: Number, default: 0 }, // **Önerilen ağırlık artışı**
      suggestedRepsIncrease: { type: Number, default: 0 }, // **Önerilen tekrar artışı**
    }
  ],

  goalTracking: {
    initialMetric: { type: Number }, // **Başlangıç değeri**
    targetMetric: { type: Number }, // **Hedeflenen değer**
    currentMetric: { type: Number, default: 0 }, // **Mevcut durum**
    progressPercentage: { type: Number, default: 0 }, // **İlerleme yüzdesi**
  },

  achievementBadges: [
    {
      badge: { type: String }, // **Başarı rozeti adı**
      dateEarned: { type: Date, default: Date.now }, // **Alınma tarihi**
    }
  ],

  sessionNotes: [
    {
      sessionId: { type: String }, // **Antrenman ID'si**
      note: { type: String }, // **Antrenman notu**
      createdAt: { type: Date, default: Date.now }, // **Notun eklenme tarihi**
    }
  ],

  streakTracking: {
    currentStreak: { type: Number, default: 0 }, // **Şu anki kesintisiz antrenman serisi**
    longestStreak: { type: Number, default: 0 }, // **En uzun antrenman serisi**
  },

  lastUpdated: { type: Date, default: Date.now }, // **Son güncelleme tarihi**
  completedDays: [{ type: Number }],  // ✅ Tracks completed days

  progressiveOverload: [  // ✅ NEW: Track strength progression
    {
      exerciseName: String,
      initialWeight: Number,
      currentWeight: Number,
      repsCompleted: Number,
      date: { type: Date, default: Date.now },
    }
  ],

  sessionTracking: [  // ✅ Tracks which workouts are completed
    {
      sessionName: String,
      completed: Boolean,
      fatigueLevel: Number,
      dateCompleted: Date,
    }
  ],
});

module.exports = mongoose.model("Progress", ProgressSchema);
