'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Camera, BrainCircuit, LineChart, ShieldCheck, Flame, Apple, Dumbbell } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 sm:pb-24 lg:pt-32">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-emerald-300 to-indigo-400">
              Transform Your Fitness Journey <br />
              With Gemini-Powered AI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Analyze meals instantly from photos, plan workouts with an expert AI coach, and monitor calories and macro breakdowns with interactive charts.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 px-6 py-3.5 text-base font-semibold text-slate-950 transition-all duration-200 shadow-lg shadow-red-500/20"
                >
                  Enter Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 px-6 py-3.5 text-base font-semibold text-slate-950 transition-all duration-200 shadow-lg shadow-red-500/20"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-semibold leading-6 text-white hover:text-red-400 transition-colors"
                  >
                    Sign in to your account <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-slate-900/40 border-y border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything You Need in One FitAI app
              </h2>
              <p className="mt-4 text-slate-400">
                A seamless integration of generative AI and traditional logs.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-red-500/30 hover:bg-slate-900 transition-all duration-300">
                  <dt className="flex flex-col items-center gap-4 text-base font-semibold leading-7 text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                      <Camera className="h-6 w-6" />
                    </div>
                    Meal Photo Analysis
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">
                      Snap or upload pictures of breakfast, lunch, or dinner. Gemini estimates food items, portion sizes, calories, and macros with precision.
                    </p>
                  </dd>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300">
                  <dt className="flex flex-col items-center gap-4 text-base font-semibold leading-7 text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <BrainCircuit className="h-6 w-6" />
                    </div>
                    AI Diet & Workout Coach
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">
                      Have a continuous chat with our AI chatbot. It stays synchronized with your daily intake and workout history, offering direct expert coaching.
                    </p>
                  </dd>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-900 transition-all duration-300">
                  <dt className="flex flex-col items-center gap-4 text-base font-semibold leading-7 text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <LineChart className="h-6 w-6" />
                    </div>
                    Interactive Calorie Charts
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">
                      Visualize your weekly calorie trends, net energy balances, and macronutrient distributions in stunning, interactive charts.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Security / Token features */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Secure JWT & Refresh Token System
                  </h2>
                  <p className="mt-6 text-lg text-slate-400">
                    Your session is protected with industry-standard JWT access tokens, rotated automatically by background refresh tokens.
                  </p>
                  <div className="mt-10 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-base font-semibold text-white">Secured HTTP-Only Cookies</h4>
                        <p className="text-sm text-slate-400">Refresh tokens are saved inside secure, HTTP-only client cookies preventing XSS token theft.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-base font-semibold text-white">Active Revocation List</h4>
                        <p className="text-sm text-slate-400">Sessions are tracked in MongoDB, enabling active token revocation when logging out or if reuse is detected.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl max-w-md w-full">
                    <div className="absolute -top-3 -right-3 rounded-full bg-red-500 text-slate-950 p-2 shadow-lg animate-bounce">
                      <Flame className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">Live Daily Summary Preview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5"><Apple className="h-4 w-4 text-emerald-400" /> Breakfast</span>
                        <span className="font-semibold text-emerald-400">+450 kcal</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5"><Apple className="h-4 w-4 text-emerald-400" /> Salad Lunch</span>
                        <span className="font-semibold text-emerald-400">+620 kcal</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-orange-400" /> Running (30m)</span>
                        <span className="font-semibold text-orange-400">-350 kcal</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-300">Net Calories</span>
                        <span className="text-lg font-bold text-red-400">720 kcal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} FitAI. Powered by Gemini Pro & Next.js.</p>
      </footer>
    </div>
  );
}
