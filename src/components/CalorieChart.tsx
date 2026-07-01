'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface WeeklyData {
  date: string;
  label: string;
  caloriesIn: number;
  caloriesOut: number;
  net: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function CalorieChart({ refreshTrigger }: { refreshTrigger: number }) {
  const { fetchWithAuth } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await fetchWithAuth('/api/summary?range=week');
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data.weekly || []);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [fetchWithAuth, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/20">
        <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    );
  }

  // Check if any macros are logged this week
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  weeklyData.forEach((d) => {
    totalProtein += d.protein;
    totalCarbs += d.carbs;
    totalFat += d.fat;
  });

  const hasMacros = totalProtein + totalCarbs + totalFat > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Area Chart: Calorie intake vs burn */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">7-Day Calorie Balance</h3>
        {weeklyData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            No history logs found.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  name="Calories In"
                  type="monotone"
                  dataKey="caloriesIn"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIn)"
                />
                <Area
                  name="Calories Burned"
                  type="monotone"
                  dataKey="caloriesOut"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOut)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stacked Bar Chart: Macronutrients Day-wise */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Daily Macronutrients</h3>
          <p className="text-xs text-slate-400 mb-4">Day-wise breakdown of protein, carbs, and fats</p>
        </div>
        {!hasMacros ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 min-h-[200px]">
            Log food items to view macro breakdown.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Bar dataKey="protein" name="Protein (g)" stackId="macros" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="carbs" name="Carbs (g)" stackId="macros" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fat" name="Fat (g)" stackId="macros" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
