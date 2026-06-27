'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
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

  // Calculate overall weekly macros sum for the Pie Chart
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  weeklyData.forEach((d) => {
    totalProtein += d.protein;
    totalCarbs += d.carbs;
    totalFat += d.fat;
  });

  const macroPieData = [
    { name: 'Protein (g)', value: totalProtein, color: '#38bdf8' }, // sky-400
    { name: 'Carbs (g)', value: totalCarbs, color: '#fbbf24' },   // amber-400
    { name: 'Fat (g)', value: totalFat, color: '#f43f5e' },       // rose-500
  ];

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

      {/* Pie Chart: Macros distribution */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Weekly Macronutrients</h3>
          <p className="text-xs text-slate-400 mb-4">Total breakdown of consumed macros</p>
        </div>
        {!hasMacros ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 min-h-[180px]">
            Log food items to view macro ratios.
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-36 w-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {macroPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400">Total Macros</span>
                <span className="text-sm font-bold text-white">{totalProtein + totalCarbs + totalFat}g</span>
              </div>
            </div>
            {/* Legend info */}
            <div className="space-y-2 w-full">
              {macroPieData.map((m) => {
                const total = totalProtein + totalCarbs + totalFat;
                const percentage = total > 0 ? Math.round((m.value / total) * 100) : 0;
                return (
                  <div key={m.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      {m.name.split(' ')[0]}
                    </span>
                    <span className="font-semibold text-white">
                      {m.value}g ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
