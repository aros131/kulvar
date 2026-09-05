async function chat(systemPrompt, userPrompt, maxTokens = 800) {
  const BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const API_KEY  = process.env.NVIDIA_API_KEY;
  const MODEL    = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA API hatası: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Check-in Analizi ────────────────────────────────────────────────────────
export async function analyzeCheckIn(checkIn, clientName) {
  const system = `Sen deneyimli bir fitness koçu asistanısın. Danışanın haftalık check-in verilerini analiz edip koça kısa, öz ve eyleme dönüştürülebilir Türkçe içgörüler sunuyorsun. Samimi, profesyonel bir dil kullan.`;

  const user = `
Danışan: ${clientName}
Hafta: ${checkIn.week}. hafta
Tarih: ${new Date(checkIn.date).toLocaleDateString('tr-TR')}

Veriler:
- Kilo: ${checkIn.weight ? checkIn.weight + ' kg' : 'belirtilmedi'}
- Enerji seviyesi: ${checkIn.energyLevel ? checkIn.energyLevel + '/5' : 'belirtilmedi'}
- Uyku kalitesi: ${checkIn.sleepQuality ? checkIn.sleepQuality + '/5' : 'belirtilmedi'}
- Stres seviyesi: ${checkIn.stressLevel ? checkIn.stressLevel + '/5' : 'belirtilmedi'}
- Tamamlanan antrenman: ${checkIn.completedWorkouts ?? 'belirtilmedi'}
- Not: ${checkIn.note || 'yok'}

Bu verilere göre:
1. En dikkat çekici 2-3 içgörüyü listele
2. Koça 1-2 somut öneri ver
3. Danışana moral mesajı yaz (1 cümle)

Kısa tut, madde madde yaz.`;

  return chat(system, user, 600);
}

// ─── Check-in Yanıtı ─────────────────────────────────────────────────────────
export async function generateCheckInReply(checkIn, clientName, coachName) {
  const system = `Sen fitness koçu ${coachName || 'Koç'} adına danışanlara haftalık check-in yanıtı yazıyorsun. Sıcak, motive edici, kişisel bir Türkçe mesaj yaz. Veriyi referans al ama klişe olma.`;

  const user = `
Danışan: ${clientName}
Hafta: ${checkIn.week}. hafta
Enerji: ${checkIn.energyLevel ?? '?'}/5 | Uyku: ${checkIn.sleepQuality ?? '?'}/5 | Stres: ${checkIn.stressLevel ?? '?'}/5
Antrenman: ${checkIn.completedWorkouts ?? '?'} tamamlandı
Kilo: ${checkIn.weight ? checkIn.weight + ' kg' : 'belirtilmedi'}
Not: ${checkIn.note || 'yok'}

Bu danışana 3-5 cümlelik, motive edici, kişisel bir yanıt yaz. Selamlama ile başla, veriyi referans al, haftaya dair bir öneri ile bitir.`;

  return chat(system, user, 400);
}

// ─── Program Üretici ─────────────────────────────────────────────────────────
export async function generateProgram(params) {
  const { goal, level, daysPerWeek, equipment, age, gender, notes } = params;

  const system = `Sen uzman bir fitness programı hazırlayan koçsun. Verilen bilgilere göre yapılandırılmış, gerçekçi ve uygulanabilir Türkçe haftalık antrenman programı oluşturuyorsun. JSON formatında çıktı ver.`;

  const user = `
Danışan Bilgileri:
- Yaş: ${age || 'belirtilmedi'}
- Cinsiyet: ${gender || 'belirtilmedi'}
- Hedef: ${goal}
- Seviye: ${level}
- Haftada ${daysPerWeek} gün antrenman
- Ekipman: ${equipment || 'spor salonu'}
- Ek notlar: ${notes || 'yok'}

Aşağıdaki JSON formatında ${daysPerWeek} günlük program oluştur:
{
  "programAdi": "...",
  "aciklama": "...",
  "gunler": [
    {
      "gun": "Pazartesi",
      "seansAdi": "...",
      "egzersizler": [
        { "ad": "...", "set": 3, "tekrar": 10, "dinlenme": 60, "tip": "strength" }
      ]
    }
  ]
}

Sadece JSON döndür, başka açıklama ekleme.`;

  const raw = await chat(system, user, 1200);
  // JSON'u ayıkla
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI geçerli JSON üretmedi');
  return JSON.parse(match[0]);
}

// ─── Egzersiz Alternatifleri ─────────────────────────────────────────────────
export async function suggestAlternatives(exerciseName, reason, equipment) {
  const system = `Sen fitness uzmanısın. Bir egzersizi yapamayan danışana uygun alternatifler öneriyorsun. Türkçe yanıt ver, liste formatında.`;

  const user = `
Egzersiz: ${exerciseName}
Neden yapamıyor: ${reason || 'belirtilmedi'}
Mevcut ekipman: ${equipment || 'spor salonu'}

Bu egzersizin 3 alternatifini öner. Her biri için:
- Egzersiz adı
- Neden iyi bir alternatif olduğu (1 cümle)
- Set/tekrar önerisi`;

  return chat(system, user, 400);
}

// ─── Beslenme Planı ──────────────────────────────────────────────────────────
export async function generateNutritionPlan(params) {
  const { goal, weight, activityLevel, preferences } = params;

  const system = `Sen beslenme uzmanısın. Fitness hedeflerine uygun, gerçekçi ve uygulanabilir Türkçe beslenme önerileri sunuyorsun.`;

  const user = `
Danışan Bilgileri:
- Hedef: ${goal}
- Kilo: ${weight ? weight + ' kg' : 'belirtilmedi'}
- Aktivite seviyesi: ${activityLevel || 'orta'}
- Tercihler/kısıtlar: ${preferences || 'yok'}

Şunları ver:
1. Günlük kalori hedefi (tahmini)
2. Makro dağılımı (protein/karb/yağ gram)
3. Örnek günlük 4 öğün (kahvaltı, öğle, akşam, ara öğün)
4. 3 pratik beslenme ipucu

Kısa ve pratik tut.`;

  return chat(system, user, 700);
}

// ─── Onboarding Planı ────────────────────────────────────────────────────────
export async function generateOnboardingPlan(params) {
  const { goal, level, age, gender, availableDays, notes } = params;

  const system = `Sen yeni kullanıcıların fitness yolculuğuna başlamasına yardımcı olan bir koç asistanısın. Kısa, motive edici ve uygulanabilir bir başlangıç planı oluşturuyorsun. Türkçe yaz, sıcak ve teşvik edici bir dil kullan.`;

  const user = `
Yeni kullanıcı bilgileri:
- Hedef: ${goal}
- Seviye: ${level || 'Başlangıç'}
- Yaş: ${age || 'belirtilmedi'}
- Cinsiyet: ${gender || 'belirtilmedi'}
- Haftada kaç gün müsait: ${availableDays || '3'}
- Ek notlar: ${notes || 'yok'}

Bu kullanıcı için şunları oluştur:
1. Kişiselleştirilmiş bir karşılama mesajı (1-2 cümle, isme göre değil hedefe göre)
2. İlk 2 hafta için 3 somut adım (madde madde, kısa)
3. Dikkat etmesi gereken 1 altın kural
4. Motivasyon cümlesi

JSON formatında dön:
{
  "karsilama": "...",
  "adimlar": ["...", "...", "..."],
  "altinKural": "...",
  "motivasyon": "..."
}

Sadece JSON döndür.`;

  const raw = await chat(system, user, 600);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI geçerli JSON üretmedi');
  return JSON.parse(match[0]);
}

// ─── Koç Eşleştirme ──────────────────────────────────────────────────────────
export async function matchCoach(params) {
  const { goal, level, preferences, budget, city } = params;

  const system = `Sen bir fitness danışmanlık platformunun AI asistanısın. Kullanıcının hedeflerine ve tercihlerine göre hangi tür koç araması gerektiği konusunda rehberlik ediyorsun. Türkçe yanıt ver, somut ve kişiselleştirilmiş ol.`;

  const user = `
Kullanıcı Bilgileri:
- Hedef: ${goal}
- Fitness seviyesi: ${level || 'belirtilmedi'}
- Tercihler: ${preferences || 'yok'}
- Bütçe: ${budget || 'belirtilmedi'}
- Şehir: ${city || 'belirtilmedi'}

Şunları söyle:
1. Bu hedefe uygun koç uzmanlık alanı (örn. "Fitness ve güç antrenmanı uzmanı")
2. Bu koçtan beklenmesi gereken 3 özellik
3. İlk görüşmede sorulması gereken 2 soru
4. Kısa bir motivasyon mesajı

Kısa, sıcak ve pratik bir dil kullan.`;

  return chat(system, user, 500);
}

// ─── Churn Risk Analizi ──────────────────────────────────────────────────────
export async function analyzeChurnRisk(clientName, checkIns, workoutLogs) {
  const system = `Sen bir fitness platformunun danışan kayıp risk analistissin. Verilen verilere göre danışanın platformu terk etme riskini değerlendirip JSON formatında kısa bir analiz üret. Türkçe yaz.`;

  const now = Date.now();
  const lastCheckIn = checkIns.length ? checkIns[checkIns.length - 1] : null;
  const daysSinceLastCheckIn = lastCheckIn
    ? Math.floor((now - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24))
    : 99;

  const recentCheckIns = checkIns.slice(-6);
  const avgEnergy = recentCheckIns.length
    ? (recentCheckIns.reduce((s, c) => s + (c.energyLevel || 3), 0) / recentCheckIns.length).toFixed(1)
    : null;
  const energyTrend = recentCheckIns.length >= 3
    ? recentCheckIns.slice(-3).reduce((s, c) => s + (c.energyLevel || 3), 0) / 3
    : null;
  const energyTrendOld = recentCheckIns.length >= 3
    ? recentCheckIns.slice(0, 3).reduce((s, c) => s + (c.energyLevel || 3), 0) / 3
    : null;

  const user = `
Danışan: ${clientName}
Son check-in'den bu yana geçen gün: ${daysSinceLastCheckIn}
Toplam check-in sayısı (son 8 hafta): ${checkIns.length}
Son 6 check-in ortalama enerji: ${avgEnergy ?? 'yok'}/5
Enerji trendi: ${energyTrend ? energyTrend.toFixed(1) : '?'} (son 3 hafta) vs ${energyTrendOld ? energyTrendOld.toFixed(1) : '?'} (önceki 3 hafta)
Son antrenman logları sayısı (bu ay): ${workoutLogs?.length ?? 0}
Son notlar: ${recentCheckIns.map(c => c.note).filter(Boolean).slice(-3).join(' | ') || 'yok'}

Bu verilere göre danışanın platformu terk etme riskini değerlendir. Sadece şu JSON formatını dön:
{
  "level": "high" veya "medium" veya "low",
  "reasons": ["kısa neden 1", "kısa neden 2"],
  "action": "Koça tek cümlelik öneri"
}
Sadece JSON dön.`;

  const raw = await chat(system, user, 400);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { level: 'low', reasons: ['Veri yetersiz'], action: 'Düzenli takip edin.' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { level: 'low', reasons: ['Analiz yapılamadı'], action: 'Manuel kontrol edin.' };
  }
}

// ─── Program Adaptasyon Önerisi ──────────────────────────────────────────────
export async function suggestProgramAdaptation(clientName, checkIn, programInfo) {
  const system = `Sen uzman bir fitness koçusun. Danışanın son check-in verilerine ve mevcut programına bakarak koça somut, uygulanabilir program düzenleme önerileri sunuyorsun. Türkçe, kısa ve net yaz.`;

  const user = `
Danışan: ${clientName}
Son check-in (Hafta ${checkIn.week}):
- Enerji: ${checkIn.energyLevel ?? '?'}/5
- Uyku: ${checkIn.sleepQuality ?? '?'}/5
- Stres: ${checkIn.stressLevel ?? '?'}/5
- Tamamlanan antrenman: ${checkIn.completedWorkouts ?? '?'}
- Kilo: ${checkIn.weight ? checkIn.weight + ' kg' : 'belirtilmedi'}
- Not: ${checkIn.note || 'yok'}

Mevcut program:
- Hedef: ${programInfo?.fitnessGoal || 'belirtilmedi'}
- Zorluk: ${programInfo?.difficulty || 'belirtilmedi'}
- Program: ${programInfo?.name || 'belirtilmedi'}

Bu verilere göre koça 2-3 somut program düzenleme önerisi ver. Örneğin: yoğunluk azaltma, dinlenme haftası, egzersiz değişikliği, kalori ayarı. Her öneri 1-2 cümle olsun.`;

  return chat(system, user, 500);
}

// ─── Yaralanma Risk Tespiti ──────────────────────────────────────────────────
export async function assessInjuryRisk(clientName, checkIns) {
  const system = `Sen bir fitness koçu asistanısın. Danışanın check-in notlarını ve enerji/stres verilerini analiz edip yaralanma riskini değerlendiriyorsun. Türkçe, kısa ve eyleme dönüştürülebilir yaz.`;

  const recentCheckIns = checkIns.slice(-8);
  const painKeywords = ['ağrı', 'acı', 'yanma', 'tutulma', 'yaralanma', 'sakatlık', 'şişlik', 'kramp', 'bölge ağrı'];
  const notesWithPain = recentCheckIns.filter(c =>
    c.note && painKeywords.some(k => c.note.toLowerCase().includes(k))
  );
  const avgStress = recentCheckIns.length
    ? (recentCheckIns.reduce((s, c) => s + (c.stressLevel || 0), 0) / recentCheckIns.length).toFixed(1)
    : 0;
  const lowEnergyWeeks = recentCheckIns.filter(c => (c.energyLevel || 3) <= 2).length;

  const user = `
Danışan: ${clientName}
Son ${recentCheckIns.length} hafta analizi:
- Ağrı/şikayet içeren check-in sayısı: ${notesWithPain.length}
- Ağrı notları: ${notesWithPain.map(c => `Hafta ${c.week}: "${c.note}"`).join(' | ') || 'yok'}
- Ortalama stres: ${avgStress}/5
- Düşük enerji (≤2/5) olan hafta sayısı: ${lowEnergyWeeks}

Bu bilgilere göre:
1. Yaralanma riski var mı? (Yok / Düşük / Orta / Yüksek)
2. Varsa hangi bölge veya durumda?
3. Koça 1-2 somut önlem önerisi

Kısa tut, 4-6 cümle.`;

  return chat(system, user, 400);
}

// ─── Sosyal Medya İçerik Üretici ─────────────────────────────────────────────
export async function generateSocialContent(clientName, achievements) {
  const system = `Sen bir fitness koçunun sosyal medya asistanısın. Danışanın başarılarına dayanarak ilham verici, özgün Türkçe sosyal medya içerikleri yazıyorsun. Emoji kullanabilirsin. Kişisel bilgileri gizli tut (isim yok).`;

  const user = `
Danışan başarıları:
${achievements}

Şunları yaz:
1. Instagram gönderisi: 3-4 cümle, motivasyon odaklı, 3-4 ilgili hashtag ile biten
2. WhatsApp durum mesajı: 1-2 cümle, daha kısa

JSON formatında dön:
{
  "instagram": "...",
  "whatsapp": "..."
}
Sadece JSON dön.`;

  const raw = await chat(system, user, 500);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI içerik üretemedi');
  return JSON.parse(match[0]);
}

// ─── Koç Performans Öngörüleri ───────────────────────────────────────────────
export async function generateCoachInsights(coachName, analyticsData) {
  const system = `Sen bir fitness koçluk platformunun AI danışmanısın. Koçun performans verilerini analiz edip somut, eyleme dönüştürülebilir Türkçe öneriler sunuyorsun.`;

  const {
    totalClients, totalPrograms, completedSessions, upcomingSessions,
    avgClientProgress, avgRating, reviewCount, totalRevenue, pendingRevenue,
  } = analyticsData;

  const collectionRate = totalRevenue > 0
    ? Math.round(((totalRevenue - pendingRevenue) / totalRevenue) * 100)
    : 0;

  const user = `
Koç: ${coachName || 'Koç'}
Mevcut veriler:
- Aktif danışan: ${totalClients}
- Toplam program: ${totalPrograms}
- Tamamlanan seans: ${completedSessions}
- Yaklaşan seans: ${upcomingSessions}
- Ortalama danışan ilerleme: ${avgClientProgress ? avgClientProgress.toFixed(0) + '%' : 'veri yok'}
- Ortalama puan: ${avgRating ? avgRating.toFixed(1) + '/5' : 'yok'} (${reviewCount} yorum)
- Toplam gelir: ₺${totalRevenue?.toLocaleString('tr-TR') || 0}
- Tahsilat oranı: ${collectionRate}%

Bu verileri değerlendir:
1. En güçlü 1-2 nokta
2. Geliştirilmesi gereken 2-3 alan (somut öneri ile)
3. Önümüzdeki ay için 2 öncelikli aksiyon
4. Kısa bir motivasyon notu

Profesyonel ama samimi bir dil kullan, 200-250 kelime.`;

  return chat(system, user, 600);
}

// ─── Haftalık Danışan Raporu ──────────────────────────────────────────────────
export async function generateWeeklyClientReport(clientName, checkIn, workoutCount) {
  const system = `Sen bir fitness koçluk platformunun AI asistanısın. Danışana bu haftaki performansı hakkında kişiselleştirilmiş, motive edici bir haftalık özet raporu yazıyorsun. Türkçe, sıcak ve teşvik edici yaz.`;

  const user = `
Danışan: ${clientName}
Bu haftanın verileri:
- Enerji seviyesi: ${checkIn?.energyLevel ?? '?'}/5
- Uyku kalitesi: ${checkIn?.sleepQuality ?? '?'}/5
- Stres seviyesi: ${checkIn?.stressLevel ?? '?'}/5
- Tamamlanan antrenman: ${workoutCount ?? checkIn?.completedWorkouts ?? 0}
- Kilo: ${checkIn?.weight ? checkIn.weight + ' kg' : 'kaydedilmedi'}
- Danışan notu: ${checkIn?.note || 'yok'}

Bu haftanın özet raporunu yaz:
1. Haftanın genel değerlendirmesi (2 cümle)
2. En iyi yaptığın şey
3. Gelecek hafta odaklanma önerisi
4. Kısa bir motivasyon mesajı

Samimi, kişisel ve motive edici bir dil kullan. Toplam 4-6 cümle.`;

  return chat(system, user, 400);
}

// ─── İlerleme Raporu ─────────────────────────────────────────────────────────
export async function generateProgressReport(clientName, checkIns, workoutLogs) {
  const system = `Sen bir fitness koçu asistanısın. Danışanın aylık verilerini analiz edip güzel yazılmış Türkçe bir ilerleme raporu oluşturuyorsun.`;

  const lastWeight  = checkIns.filter(c => c.weight).at(-1)?.weight;
  const firstWeight = checkIns.filter(c => c.weight).at(0)?.weight;
  const avgEnergy   = checkIns.length ? (checkIns.reduce((s, c) => s + (c.energyLevel || 0), 0) / checkIns.length).toFixed(1) : null;
  const totalWorkouts = workoutLogs?.length ?? 0;

  const user = `
Danışan: ${clientName}
Dönem: Son ${checkIns.length} hafta
Kilo: ${firstWeight ?? '?'} kg → ${lastWeight ?? '?'} kg
Ortalama enerji: ${avgEnergy ?? '?'}/5
Tamamlanan antrenman: ${totalWorkouts}
Check-in notları: ${checkIns.map(c => c.note).filter(Boolean).join(' | ') || 'yok'}

Bu verilerle:
1. Dönemin özet değerlendirmesi (2-3 cümle)
2. En güçlü yönler
3. Geliştirilmesi gereken alanlar
4. Önümüzdeki dönem için 2-3 öneri
5. Motivasyon mesajı

Profesyonel ama sıcak bir dil kullan.`;

  return chat(system, user, 700);
}
