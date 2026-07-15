'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Trash2, Plus, Sparkles, Loader2, Clock } from 'lucide-react';

interface TaskItem {
  _id: string;
  text: string;
  completed: boolean;
  completedDates: string[];
  isRecurring: boolean;
  time: string;
  date: string;
}

interface TaskChecklistProps {
  selectedDate: string;
  refreshTrigger: number;
  onTaskChanged: () => void;
}

export default function TaskChecklist({ selectedDate, refreshTrigger, onTaskChanged }: TaskChecklistProps) {
  const { fetchWithAuth } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`/api/tasks?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [fetchWithAuth, selectedDate, refreshTrigger]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          date: selectedDate,
          isRecurring,
          time: time || '',
        }),
      });

      if (res.ok) {
        setText('');
        setIsRecurring(false);
        setTime('');
        onTaskChanged();
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (id: string, currentlyCompleted: boolean) => {
    try {
      const res = await fetchWithAuth('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          completed: !currentlyCompleted,
          dateStr: selectedDate,
        }),
      });

      if (res.ok) {
        onTaskChanged();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this checklist task?')) return;

    try {
      const res = await fetchWithAuth(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onTaskChanged();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => 
    t.isRecurring ? t.completedDates.includes(selectedDate) : t.completed
  ).length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-red-400" />
          Daily Checklist
        </h3>
        {totalTasks > 0 && (
          <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            {completedCount} / {totalTasks} Completed
          </span>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-5 w-5 text-red-400 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-800/60 rounded-xl bg-slate-950/10 text-xs text-slate-500">
          No habits or tasks defined for this day.
        </div>
      ) : (
        <div className="space-y-2 mb-6 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
          {tasks.map((task) => {
            const isCompleted = task.isRecurring
              ? task.completedDates.includes(selectedDate)
              : task.completed;

            return (
              <div
                key={task._id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 group ${
                  isCompleted
                    ? 'bg-slate-950/30 border-slate-900/60 opacity-60'
                    : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleTask(task._id, isCompleted)}
                    className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-red-400" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <span
                    className={`text-sm truncate font-medium text-slate-200 ${
                      isCompleted ? 'line-through text-slate-500 font-normal' : ''
                    }`}
                  >
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.time && (
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isCompleted 
                        ? 'bg-slate-900 border border-slate-800 text-slate-500'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}>
                      <Clock className={`h-3 w-3 ${isCompleted ? 'text-slate-500' : 'text-red-400'}`} />
                      {task.time}
                    </span>
                  )}
                  
                  {task.isRecurring && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-slate-900 px-1 py-0.5 rounded border border-slate-850">
                      Habit
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200 p-0.5 rounded hover:bg-slate-900"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Add checklist item..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 text-xs rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 rounded-xl flex items-center justify-center transition-all duration-200"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-red-500 focus:ring-offset-slate-950"
            />
            <span>Daily Recurring Habit</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span>Time:</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white focus:border-red-500 focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
