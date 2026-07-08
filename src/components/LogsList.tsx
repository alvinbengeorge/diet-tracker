'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Apple, Dumbbell, Calendar, Loader2, Pencil, X } from 'lucide-react';

interface LogItem {
  _id: string;
  type: 'food' | 'workout';
  name: string;
  date: string;
  caloriesIn?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
  caloriesOut?: number;
  duration?: number;
  image?: string;
}

export default function LogsList({
  selectedDate,
  setSelectedDate,
  refreshTrigger,
  onLogDeleted,
}: {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  refreshTrigger: number;
  onLogDeleted: () => void;
}) {
  const { fetchWithAuth } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingLog, setEditingLog] = useState<LogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editFat, setEditFat] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editMealType, setEditMealType] = useState('breakfast');
  const [updating, setUpdating] = useState(false);

  const startEdit = (log: LogItem) => {
    setEditingLog(log);
    setEditName(log.name);
    setEditCalories(log.type === 'food' ? log.caloriesIn || 0 : log.caloriesOut || 0);
    setEditProtein(log.protein || 0);
    setEditCarbs(log.carbs || 0);
    setEditFat(log.fat || 0);
    setEditDuration(log.duration || 0);
    setEditMealType(log.mealType || 'breakfast');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setUpdating(true);

    try {
      const body: any = {
        id: editingLog._id,
        name: editName,
      };

      if (editingLog.type === 'food') {
        body.caloriesIn = editCalories;
        body.protein = editProtein;
        body.carbs = editCarbs;
        body.fat = editFat;
        body.mealType = editMealType;
      } else {
        body.caloriesOut = editCalories;
        body.duration = editDuration;
      }

      const res = await fetchWithAuth('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditingLog(null);
        onLogDeleted();
      }
    } catch (err) {
      console.error('Failed to edit log:', err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`/api/logs?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [fetchWithAuth, refreshTrigger, selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const res = await fetchWithAuth(`/api/logs?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLogs((prev) => prev.filter((item) => item._id !== id));
        onLogDeleted();
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/20">
        <Loader2 className="h-6 w-6 text-red-400 animate-spin" />
      </div>
    );
  }

  // Generate last 7 days starting from today going back
  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isTodaySelected = selectedDate === new Date().toLocaleDateString('en-CA');
  const titleLabel = isTodaySelected ? "Today's Log Entries" : `${formattedSelectedDate} Logs`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-red-400" />
        {titleLabel}
      </h3>

      {/* 7-Day Date Slider */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {getDaysOfWeek().map((day) => {
          const dayStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD local format
          const isToday = dayStr === new Date().toLocaleDateString('en-CA');
          const isSelected = selectedDate === dayStr;
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = day.getDate();

          return (
            <button
              key={dayStr}
              onClick={() => {
                setSelectedDate(dayStr);
              }}
              className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 rounded-xl border transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-red-500 border-red-500 text-slate-950 font-bold shadow-md shadow-red-500/10'
                  : 'bg-slate-955/50 border-slate-900 text-slate-400 hover:text-white hover:border-slate-800'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-85">{dayName}</span>
              <span className="text-sm font-extrabold mt-0.5">{dayNum}</span>
              {isToday && !isSelected && (
                <span className="h-1 w-1 rounded-full bg-red-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          No logs recorded on this day. Use the photo scanner or manual logger above to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isFood = log.type === 'food';
            return (
              <div
                key={log._id}
                className={`flex items-center justify-between gap-4 rounded-xl border border-slate-900 border-l-4 bg-slate-950/20 p-4 hover:border-slate-800/80 hover:bg-slate-950/50 transition-all duration-200 group ${
                  isFood ? 'border-l-emerald-500/80' : 'border-l-orange-500/80'
                }`}
              >
                {/* Details info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    isFood
                      ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                      : 'bg-orange-950/40 border-orange-900/30 text-orange-400'
                  }`}>
                    {isFood ? <Apple className="h-4.5 w-4.5" /> : <Dumbbell className="h-4.5 w-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-100 truncate pr-2" title={log.name}>{log.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 capitalize">
                      <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                        {isFood ? log.mealType : `${log.duration} mins`}
                      </span>
                    </div>
                    {isFood && (log.protein || log.carbs || log.fat) ? (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/20 text-emerald-400 text-[10px] font-medium border border-emerald-900/30">P: {log.protein || 0}g</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-955/20 text-amber-400 text-[10px] font-medium border border-amber-900/30">C: {log.carbs || 0}g</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/20 text-rose-400 text-[10px] font-medium border border-rose-950/30">F: {log.fat || 0}g</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Right controls: Calories & Delete */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-bold ${isFood ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {isFood ? `+${log.caloriesIn}` : `-${log.caloriesOut}`} kcal
                    </span>
                  </div>
                  
                  {/* Actions (visible always on mobile, reveals on hover on desktop) */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => startEdit(log)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white border border-transparent hover:border-slate-700 transition-all duration-200"
                      title="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(log._id)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-900/30 transition-all duration-200"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-red-500" />
                Edit Log Entry
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-all duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Name / Description
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>

              {editingLog.type === 'food' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Meal Category
                      </label>
                      <select
                        value={editMealType}
                        onChange={(e) => setEditMealType(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editCalories}
                        onChange={(e) => setEditCalories(Number(e.target.value))}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editProtein}
                        onChange={(e) => setEditProtein(Number(e.target.value))}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editCarbs}
                        onChange={(e) => setEditCarbs(Number(e.target.value))}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Fat (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFat}
                        onChange={(e) => setEditFat(Number(e.target.value))}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Calories Burned (kcal)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editCalories}
                      onChange={(e) => setEditCalories(Number(e.target.value))}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-955 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 px-6 py-2.5 text-sm font-bold text-slate-955 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
