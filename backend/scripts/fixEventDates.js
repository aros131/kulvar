import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Program from '../models/Program.js';
import ProgramAssignment from '../models/ProgramAssignment.js';
import Event from '../models/Event.js';

const toInt = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const parseHHmm = (hhmm = '18:00') => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!m) return { h: 18, m: 0 };
  return { h: Math.min(23, Math.max(0, Number(m[1]))), m: Math.min(59, Math.max(0, Number(m[2]))) };
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB bağlantısı kuruldu');

  // Tüm assignment'ları userId+programId bazında grupla
  const all = await ProgramAssignment.find({}).sort({ createdAt: 1 }).lean();

  // userId:programId → [assignments] (oldest first)
  const groups = {};
  for (const a of all) {
    const key = `${a.userId}:${a.programId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  let totalFixed = 0;
  let totalDeleted = 0;

  for (const [key, assignments] of Object.entries(groups)) {
    const original = assignments[0]; // en eski = doğru olan

    // Yeni assignment varsa sil
    if (assignments.length > 1) {
      const newerIds = assignments.slice(1).map(a => a._id);
      const del = await Event.deleteMany({ assignmentId: { $in: newerIds } });
      await ProgramAssignment.deleteMany({ _id: { $in: newerIds } });
      totalDeleted += del.deletedCount;
      console.log(`[${key}] ${assignments.length - 1} yeni assignment silindi, ${del.deletedCount} event silindi`);
    }

    // Orijinal assignment'ın eventlerini doğru tarihlerle rebuild et
    const program = await Program.findById(original.programId).lean();
    if (!program) continue;

    const days = Array.isArray(program.dailySchedule) ? program.dailySchedule : [];
    const startDate = new Date(original.startDate); startDate.setHours(0, 0, 0, 0);
    const fallbackTime = original.defaultTimeOfDay || program.defaultTimeOfDay || '18:00';
    const { h: defH, m: defM } = parseHHmm(fallbackTime);
    const programDefaultDur = toInt(program.defaultDurationMin, 60);

    const ops = [];
    for (let d = 0; d < days.length; d++) {
      const sessions = Array.isArray(days[d]?.sessions) ? days[d].sessions : [];
      const baseDate = new Date(startDate); baseDate.setDate(baseDate.getDate() + d);
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i] || {};
        const sid = String(s.sessionId || s._id || s.id || `${d}-${i}`);
        const title = s.name || `Seans ${i + 1}`;
        const t = typeof s.timeOfDay === 'string' ? parseHHmm(s.timeOfDay) : { h: defH, m: defM };
        const dur = toInt(s.durationMin, programDefaultDur);
        const st = new Date(baseDate); st.setHours(toInt(t.h, defH), toInt(t.m, defM), 0, 0);
        const en = new Date(st); en.setMinutes(en.getMinutes() + dur);
        const externalKey = `${original._id}:${d}:${i}`;
        ops.push({
          updateOne: {
            filter: { userId: original.userId, programId: original.programId, assignmentId: original._id, externalKey },
            update: {
              $setOnInsert: { userId: original.userId, programId: original.programId, assignmentId: original._id, externalKey, source: 'program', status: 'planned' },
              $set: { sessionId: sid, title, start: st, end: en, timezone: 'Europe/Istanbul' },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length) {
      await Event.bulkWrite(ops, { ordered: false });
      totalFixed += ops.length;
      console.log(`[${key}] startDate: ${original.startDate.toISOString().slice(0,10)}, ${ops.length} event güncellendi`);
    }
  }

  console.log(`\nTamamlandı: ${totalFixed} event düzeltildi, ${totalDeleted} yanlış event silindi`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
