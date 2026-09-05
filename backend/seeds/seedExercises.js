import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.js';

dotenv.config();

const BODY_PART_TR = {
  'back': 'Sırt',
  'cardio': 'Kardiyo',
  'chest': 'Göğüs',
  'lower arms': 'Ön Kol',
  'lower legs': 'Alt Bacak',
  'neck': 'Boyun',
  'shoulders': 'Omuz',
  'upper arms': 'Üst Kol',
  'upper legs': 'Üst Bacak',
  'waist': 'Karın / Core',
};

const EQUIPMENT_TR = {
  'assisted': 'Destekli',
  'band': 'Direnç Bandı',
  'barbell': 'Halter',
  'body weight': 'Vücut Ağırlığı',
  'bosu ball': 'Bosu Topu',
  'cable': 'Kablo Makine',
  'dumbbell': 'Dambıl',
  'elliptical machine': 'Eliptik Bisiklet',
  'ez barbell': 'EZ Bar',
  'hammer': 'Hammer',
  'kettlebell': 'Kettlebell',
  'leverage machine': 'Kaldıraç Makine',
  'medicine ball': 'Sağlık Topu',
  'olympic barbell': 'Olimpik Halter',
  'resistance band': 'Direnç Bandı',
  'roller': 'Foam Rulo',
  'rope': 'Halat',
  'skierg machine': 'SkiErg',
  'sled machine': 'Kızak Makine',
  'smith machine': 'Smith Makinesi',
  'stability ball': 'Denge Topu',
  'stationary bike': 'Sabit Bisiklet',
  'stepmill machine': 'Step Makinesi',
  'tire': 'Lastik',
  'trap bar': 'Trap Bar',
  'upper body ergometer': 'Üst Vücut Ergometre',
  'weighted': 'Ağırlıklı',
  'wheel roller': 'Ab Wheel',
};

const TARGET_TR = {
  'abductors': 'Abduktörler',
  'abs': 'Karın Kasları',
  'adductors': 'Adduktörler',
  'biceps': 'Biseps',
  'calves': 'Baldır',
  'cardiovascular system': 'Kardiyo Sistemi',
  'delts': 'Deltoid',
  'forearms': 'Ön Kol',
  'glutes': 'Gluteus',
  'hamstrings': 'Hamstring',
  'lats': 'Latissimus Dorsi',
  'levator scapulae': 'Omuz Kaldırıcı',
  'pectorals': 'Pektoral',
  'quads': 'Kuadriseps',
  'serratus anterior': 'Serratus',
  'spine': 'Omurga',
  'traps': 'Trapez',
  'triceps': 'Triseps',
  'upper back': 'Üst Sırt',
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB bağlandı');

  const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  if (!res.ok) throw new Error('Veri çekilemedi');
  const data = await res.json();
  console.log(`${data.length} egzersiz bulundu`);

  const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

  const docs = data.map((ex) => {
    const imageRelPath = Array.isArray(ex.images) && ex.images[0] ? ex.images[0] : null;
    const gifUrl = imageRelPath ? `${IMAGE_BASE}${imageRelPath}` : null;

    return {
      externalId: ex.id,
      name: ex.name,
      nameTR: ex.name,
      bodyPart: ex.category || ex.bodyPart,
      bodyPartTR: BODY_PART_TR[ex.category] || BODY_PART_TR[ex.bodyPart] || ex.category || ex.bodyPart,
      target: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles[0] : ex.target,
      targetTR: TARGET_TR[Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles[0] : ex.target] || (Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles[0] : ex.target),
      equipment: ex.equipment,
      equipmentTR: EQUIPMENT_TR[ex.equipment] || ex.equipment,
      level: ex.level,
      gifUrl,
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
    };
  });

  await Exercise.deleteMany({});
  await Exercise.insertMany(docs, { ordered: false });
  console.log(`✅ ${docs.length} egzersiz yüklendi`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
