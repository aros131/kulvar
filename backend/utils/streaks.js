const ymd = (d) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

/**
 * Builds the set of ISO (YYYY-MM-DD) dates, from the program's assignment
 * start date through today, that are scheduled "rest days" — days whose
 * dailySchedule entry has no sessions at all. These days shouldn't require
 * a completion to keep a streak alive; there was nothing to do.
 */
export function buildRestDaySet(dailySchedule, startDate) {
  const rest = new Set();
  if (!startDate || !Array.isArray(dailySchedule)) return rest;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);

  for (let d = 0; d < dailySchedule.length; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    if (date > today) break; // don't count rest days that haven't happened yet

    const sessions = Array.isArray(dailySchedule[d]?.sessions) ? dailySchedule[d].sessions : [];
    if (sessions.length === 0) rest.add(ymd(date));
  }
  return rest;
}

/**
 * Current/longest streak over a set of completed-workout dates, where a
 * scheduled rest day (in restDays) keeps the streak alive on its own —
 * only a scheduled workout day with nothing completed breaks it.
 */
export function computeStreaksFromDates(completedDates, restDays = new Set()) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active = new Set([...completedDates, ...restDays]);

  let current = 0;
  const cur = new Date(today);
  while (active.has(ymd(cur))) {
    current += 1;
    cur.setDate(cur.getDate() - 1);
  }

  const all = Array.from(active).sort();
  let longest = 0, run = 0, prev = null;
  for (const ds of all) {
    if (prev) {
      const p = new Date(prev); p.setDate(p.getDate() + 1);
      run = (ymd(p) === ds) ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = ds;
  }
  return { currentStreak: current, longestStreak: longest };
}
