'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Apple, Dumbbell, Calendar, Loader2 } from 'lucide-react';

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

export default function LogsList({ refreshTrigger, onLogDeleted }: { refreshTrigger: number; onLogDeleted: () => void }) {
  const { fetchWithAuth } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetchWithAuth(`/api/logs?date=${todayStr}`);
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
  }, [fetchWithAuth, refreshTrigger]);

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

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-red-400" />
        Today's Log Entries
      </h3>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          No logs recorded today yet. Use the photo scanner or manual logger above to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isFood = log.type === 'food';
            return (
              <div
                key={log._id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 hover:border-slate-800 hover:bg-slate-950/70 transition-all duration-200"
              >
                {/* Details info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isFood
                      ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                      : 'bg-orange-950/40 border-orange-900/30 text-orange-400'
                  }`}>
                    {isFood ? <Apple className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-100 truncate pr-2" title={log.name}>{log.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-400 mt-1 capitalize">
                      <span>{isFood ? log.mealType : `${log.duration} mins`}</span>
                      {isFood && (log.protein || log.carbs || log.fat) ? (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>P: {log.protein || 0}g</span>
                          <span className="text-slate-600">•</span>
                          <span>C: {log.carbs || 0}g</span>
                          <span className="text-slate-600">•</span>
                          <span>F: {log.fat || 0}g</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right controls: Calories & Delete */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-bold ${isFood ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {isFood ? `+${log.caloriesIn}` : `-${log.caloriesOut}`} kcal
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log._id)}
                    className="p-2 rounded-lg hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-900/30 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
