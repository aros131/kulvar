import User from '../models/User.js';
import CheckIn from '../models/CheckIn.js';
import WorkoutLog from '../models/WorkoutLog.js';
import Notification from '../models/Notification.js';
import { generateWeeklyClientReport } from './aiService.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // check every hour

async function runWeeklyReports() {
  const now = new Date();
  // Run on Mondays between 09:00–10:00 UTC
  if (now.getUTCDay() !== 1 || now.getUTCHours() !== 9) return;

  console.log('[weeklyReport] Running Monday morning reports...');

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find all clients (role='user') who had a check-in in the last 7 days
  const recentCheckIns = await CheckIn.find({ date: { $gte: oneWeekAgo } }).lean();
  const clientIds = [...new Set(recentCheckIns.map(c => String(c.userId)))];

  if (clientIds.length === 0) {
    console.log('[weeklyReport] No active clients this week.');
    return;
  }

  let sent = 0;
  for (const clientId of clientIds) {
    try {
      const client = await User.findById(clientId).select('name role').lean();
      if (!client || client.role !== 'user') continue;

      // Skip if they already got a report this Monday (avoid double-send on restart)
      const alreadySent = await Notification.findOne({
        recipientId: clientId,
        type: 'weekly_report',
        createdAt: { $gte: new Date(now.toDateString()) },
      }).lean();
      if (alreadySent) continue;

      const weekCheckIn = recentCheckIns
        .filter(c => String(c.userId) === clientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      const workoutLogs = await WorkoutLog.find({
        userId: clientId,
        date: { $gte: oneWeekAgo },
      }).lean();

      const reportText = await generateWeeklyClientReport(
        client.name,
        weekCheckIn,
        workoutLogs.length,
      );

      await Notification.create({
        recipientId: clientId,
        message: `📊 Haftalık Raporum: ${reportText}`,
        type: 'weekly_report',
      });

      sent++;
    } catch (err) {
      console.error('[weeklyReport] Error for client', clientId, err.message);
    }
  }

  console.log(`[weeklyReport] Done — sent ${sent} reports.`);
}

export function startWeeklyReportJob() {
  runWeeklyReports().catch(err => console.error('[weeklyReport] initial run error:', err.message));
  setInterval(() => {
    runWeeklyReports().catch(err => console.error('[weeklyReport] interval error:', err.message));
  }, CHECK_INTERVAL_MS);
  console.log('📋 Weekly report job started (checks every hour, fires Mondays 09:00)');
}
