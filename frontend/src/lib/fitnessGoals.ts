// Shared between the profile page and the onboarding modal so the two
// pickers never drift apart.
export const GOAL_TYPES = ["Kilo Kaybı", "Kas Kazanımı", "Dayanıklılık", "Esneklik", "Genel Fitness"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

// Only weight-based goals have a natural numeric target we can track against
// logged check-in weight. The rest (Dayanıklılık, Esneklik, Genel Fitness)
// show as a plain label — a fabricated percentage for those wouldn't mean anything.
export const WEIGHT_GOALS: GoalType[] = ["Kilo Kaybı", "Kas Kazanımı"];

export function weightGoalProgress(
  goalType: string | undefined | null,
  start: number | null | undefined,
  target: number | null | undefined,
  current: number | null | undefined
): number | null {
  if (!goalType || !WEIGHT_GOALS.includes(goalType as GoalType)) return null;
  if (start == null || target == null) return null;
  if (start === target) return null;
  const now = current ?? start;
  const pct = ((now - start) / (target - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
