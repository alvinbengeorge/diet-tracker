'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function LogForm({ onLogSaved, selectedDate }: { onLogSaved: () => void; selectedDate?: string }) {
  const { fetchWithAuth } = useAuth();
  const [type, setType] = useState<'food' | 'workout'>('food');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  
  // Food-specific state
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Workout-specific state
  const [duration, setDuration] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    setLoading(true);
    setError(null);

    const body: any = {
      type,
      name: name.trim(),
      date: selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date(),
    };

    if (type === 'food') {
      body.caloriesIn = Number(calories);
      body.mealType = mealType;
      body.protein = protein ? Number(protein) : 0;
      body.carbs = carbs ? Number(carbs) : 0;
      body.fat = fat ? Number(fat) : 0;
    } else {
      body.caloriesOut = Number(calories);
      body.duration = duration ? Number(duration) : 0;
    }

    try {
      const res = await fetchWithAuth('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to create manual log');
      }

      // Reset
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setDuration('');
      onLogSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-red-400" />
        Manual Logger
      </h3>

      {/* Select log type */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setType('food')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
            type === 'food'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Food Intake
        </button>
        <button
          type="button"
          onClick={() => setType('workout')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
            type === 'workout'
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Workout / Exercise
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && <p className="text-xs text-red-400 bg-red-955/20 border border-red-900/30 p-2.5 rounded-lg">{error}</p>}

        {/* Common: Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {type === 'food' ? 'Food / Meal Name' : 'Activity Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            placeholder={type === 'food' ? 'e.g., Oatmeal with fruits' : 'e.g., Running'}
          />
        </div>

        {/* Common: Calories */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {type === 'food' ? 'Calories In (kcal)' : 'Calories Burned (kcal)'}
          </label>
          <input
            type="number"
            required
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            placeholder="e.g., 350"
          />
        </div>

        {type === 'food' ? (
          <>
            {/* Meal Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none capitalize"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1.5 text-center text-white focus:border-red-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1.5 text-center text-white focus:border-red-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1.5 text-center text-white focus:border-red-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </>
        ) : (
          /* Duration */
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
              placeholder="e.g., 30"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`flex w-full justify-center items-center rounded-xl py-2.5 text-xs font-semibold text-slate-955 transition-all duration-200 shadow-md ${
            type === 'food'
              ? 'bg-red-500 hover:bg-red-400 shadow-red-500/10'
              : 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/10 text-white'
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Entry'}
        </button>
      </form>
    </div>
  );
}
