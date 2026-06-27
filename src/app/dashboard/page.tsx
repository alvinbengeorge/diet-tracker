'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import CalorieChart from '@/components/CalorieChart';
import ImageEstimator from '@/components/ImageEstimator';
import Chatbot from '@/components/Chatbot';
import LogForm from '@/components/LogForm';
import LogsList from '@/components/LogsList';
import { Flame, Utensils, Zap, Loader2, User as UserIcon } from 'lucide-react';

interface DailySummary {
  date: string;
  caloriesIn: number;
  caloriesOut: number;
  net: number;
  protein: number;
  carbs: number;
  fat: number;
  mealBreakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  targetCalories?: number;
  profile?: {
    weight: number | null;
    height: number | null;
    age: number | null;
    gender: string;
    activityLevel: string;
  };
}

export default function Dashboard() {
  const { user, loading, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracker' | 'chat'>('tracker');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchSummary = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetchWithAuth(`/api/summary?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user, fetchSummary, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    );
  }

  // Calculate target progress based on user profile settings
  const targetCalories = summary?.targetCalories || 2000;
  const calPercent = summary ? Math.min(Math.round((summary.caloriesIn / targetCalories) * 100), 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {activeTab === 'tracker' ? (
          <>
            {/* Dashboard Title */}
            <div className="border-b border-slate-900 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-white">Daily Dashboard</h1>
              <p className="text-sm text-slate-400">Track stats, analyze food photos, and coach your progress.</p>
            </div>
            {/* Quick Summary Card Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calories Consumed */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-36 hover:border-emerald-500/30 hover:bg-slate-900/50 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.12)] transition-all duration-300 group">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-400">Calories Ingested</span>
                  <Utensils className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingSummary ? '...' : summary?.caloriesIn || 0}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">/ {targetCalories} kcal</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${calPercent}%` }}
                  />
                </div>
              </div>

              {/* Calories Burned */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-36 hover:border-orange-500/30 hover:bg-slate-900/50 hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.12)] transition-all duration-300 group">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-400">Calories Burned</span>
                  <Flame className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingSummary ? '...' : summary?.caloriesOut || 0}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">kcal</span>
                </div>
                <p className="text-xs mt-3 text-slate-400">
                  Active exercises & workouts logged today.
                </p>
              </div>

              {/* Net Calorie Balance */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-36 hover:border-red-500/30 hover:bg-slate-900/50 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.12)] transition-all duration-300 group">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-400">Net Balance</span>
                  <Zap className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingSummary ? '...' : summary?.net || 0}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">kcal</span>
                </div>
                <p className="text-xs mt-3 text-slate-400">
                  Current energy status (In - Out).
                </p>
              </div>
            </section>

            {/* Dynamic Charts component */}
            <section>
              <CalorieChart refreshTrigger={refreshTrigger} />
            </section>

            {/* Balanced 3-Column Layout Grid for Laptop/Tablet */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              
              {/* Column 1: Profile & Manual Log */}
              <div className="space-y-6">
                {/* Profile Metrics Panel */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-red-400" />
                    Profile Metrics
                  </h3>
                  {summary?.profile?.weight || summary?.profile?.height ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 text-center">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Weight</span>
                        <span className="text-lg font-bold text-white">{summary.profile.weight || '-'} <span className="text-xs text-slate-400 font-normal">kg</span></span>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 text-center">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Height</span>
                        <span className="text-lg font-bold text-white">{summary.profile.height || '-'} <span className="text-xs text-slate-400 font-normal">cm</span></span>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 text-center">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age & Gender</span>
                        <span className="text-xs font-bold text-white capitalize">{summary.profile.age || '-'} yrs, {summary.profile.gender || '-'}</span>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 text-center">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Activity</span>
                        <span className="text-xs font-bold text-white capitalize">{summary.profile.activityLevel?.replace('_', ' ') || '-'}</span>
                      </div>
                      <div className="col-span-2 text-[11px] text-red-400/80 bg-red-950/15 border border-red-900/30 rounded-lg p-2.5 text-center">
                        Daily target is calculated at <strong>{targetCalories} kcal</strong>.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                      <p className="text-xs text-slate-400 px-4">
                        No physical metrics logged yet. 
                      </p>
                      <p className="text-[11px] text-red-400/80 mt-1 px-4 leading-relaxed">
                        Tell the AI Coach: <strong>"I am 78kg, 180cm, age 25, male, active"</strong> to calculate your BMR and set up!
                      </p>
                    </div>
                  )}
                </div>

                <LogForm onLogSaved={handleRefresh} />
              </div>

              {/* Column 2: Image Calorie Scanner */}
              <div>
                <ImageEstimator onLogSaved={handleRefresh} />
              </div>

              {/* Column 3: Log Entries List */}
              <div className="lg:col-span-1">
                <LogsList refreshTrigger={refreshTrigger} onLogDeleted={handleRefresh} />
              </div>
            </section>
          </>
        ) : (
          /* Full Screen AI Chatbot Tab view taking up the whole viewport height minus headers */
          <section className="h-[calc(100vh-8.5rem)] min-h-[660px] w-full">
            <Chatbot refreshLogsTrigger={refreshTrigger} onDataUpdated={handleRefresh} />
          </section>
        )}

      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-sm text-slate-500 mt-12">
        <p>&copy; {new Date().getFullYear()} FitAI. Powered by Gemini Pro & Next.js.</p>
      </footer>
    </div>
  );
}
