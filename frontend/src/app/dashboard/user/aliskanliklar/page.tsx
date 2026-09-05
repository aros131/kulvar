"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface Habit {
  _id: string;
  name: string;
  emoji: string;
}

interface HabitLog {
  _id: string;
  habitId: string;
  date: string;
  done: boolean;
}

const TR_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function formatDate(ymd: string) {
  const d = new Date(ymd + "T12:00:00");
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

function shiftDay(ymd: string, delta: number) {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

const EMOJI_PRESETS = ["💧", "🏃", "🧘", "😴", "🥗", "📖", "💊", "🚴", "🧘‍♂️", "🍎", "✅", "⭐"];

export default function AliskanliklarPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");
  const [adding, setAdding] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  useEffect(() => {
    loadHabits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (habits.length > 0) loadLogs(date);
  }, [date, habits]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHabits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/habits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const list: Habit[] = Array.isArray(data.habits) ? data.habits : [];
      setHabits(list);
      if (list.length > 0) {
        await Promise.all([loadLogs(date), loadStreaks(list)]);
      }
    } catch {
      toast.error("Alışkanlıklar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (d: string) => {
    try {
      const res = await fetch(`${API}/habits/logs?date=${d}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {}
  };

  const loadStreaks = async (list: Habit[]) => {
    const entries = await Promise.all(
      list.map(async (h) => {
        try {
          const res = await fetch(`${API}/habits/streak?habitId=${h._id}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          return [h._id, data.streak ?? 0] as [string, number];
        } catch {
          return [h._id, 0] as [string, number];
        }
      })
    );
    setStreaks(Object.fromEntries(entries));
  };

  const isDone = (habitId: string) => logs.some(l => l.habitId === habitId && l.done);

  const toggleHabit = async (habitId: string) => {
    const currentlyDone = isDone(habitId);
    // Optimistic update
    if (currentlyDone) {
      setLogs(prev => prev.filter(l => !(l.habitId === habitId && l.date === date)));
    } else {
      setLogs(prev => [...prev, { _id: Math.random().toString(), habitId, date, done: true }]);
    }
    try {
      await fetch(`${API}/habits/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ habitId, date, done: !currentlyDone }),
      });
      // Refresh streak for this habit
      const res = await fetch(`${API}/habits/streak?habitId=${habitId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStreaks(prev => ({ ...prev, [habitId]: data.streak ?? 0 }));
    } catch {
      toast.error("Kaydedilemedi.");
    }
  };

  const addHabit = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
      });
      const data = await res.json();
      setHabits(prev => [...prev, data.habit]);
      setStreaks(prev => ({ ...prev, [data.habit._id]: 0 }));
      setNewName("");
      setNewEmoji("✅");
      setShowAdd(false);
      toast.success("Alışkanlık eklendi.");
    } catch {
      toast.error("Eklenemedi.");
    } finally {
      setAdding(false);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm("Bu alışkanlığı silmek istiyor musun?")) return;
    try {
      await fetch(`${API}/habits/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setHabits(prev => prev.filter(h => h._id !== id));
      setLogs(prev => prev.filter(l => l.habitId !== id));
      toast.success("Silindi.");
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const doneCount = habits.filter(h => isDone(h._id)).length;
  const isToday = date === today;

  return (
    <UserPageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Alışkanlıklar</h1>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Ekle
          </Button>
        </div>

        {/* Date nav */}
        <div className="flex items-center justify-between gap-2 bg-card border rounded-2xl px-4 py-3">
          <button
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => setDate(shiftDay(date, -1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold">{formatDate(date)}</p>
            {isToday && <p className="text-xs text-primary font-medium">Bugün</p>}
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => setDate(shiftDay(date, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary */}
        {habits.length > 0 && (
          <div className="bg-card border rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Günlük İlerleme</span>
              <span className="tabular-nums text-muted-foreground">{doneCount}/{habits.length}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: habits.length > 0 ? `${Math.round((doneCount / habits.length) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        )}

        {/* Add habit form */}
        {showAdd && (
          <div className="bg-card border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Yeni Alışkanlık</h2>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PRESETS.map(e => (
                <button
                  key={e}
                  className={`w-9 h-9 text-xl rounded-lg border-2 transition-colors ${newEmoji === e ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                  onClick={() => setNewEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addHabit()}
              placeholder="örn. 2 litre su iç"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button onClick={addHabit} disabled={adding || !newName.trim()} className="flex-1">
                {adding ? "Ekleniyor..." : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); setNewEmoji("✅"); }}>
                İptal
              </Button>
            </div>
          </div>
        )}

        {/* Habits list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🎯</p>
            <p className="font-semibold text-lg">Henüz alışkanlık yok</p>
            <p className="text-sm text-muted-foreground">Küçük adımlar büyük fark yaratır.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = isDone(habit._id);
              const streak = streaks[habit._id] ?? 0;
              return (
                <div
                  key={habit._id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer select-none transition-colors ${
                    done ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-muted/50"
                  }`}
                  onClick={() => toggleHabit(habit._id)}
                >
                  <span className="text-2xl shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                      {habit.name}
                    </p>
                    {streak > 0 && (
                      <p className="text-xs text-orange-500 flex items-center gap-0.5 mt-0.5">
                        <Flame className="w-3 h-3" />
                        {streak} günlük seri
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      done ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {done && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <button
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    onClick={e => { e.stopPropagation(); deleteHabit(habit._id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
