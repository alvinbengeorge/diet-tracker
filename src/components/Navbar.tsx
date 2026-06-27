'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Activity, LogOut, LayoutDashboard, Bot } from 'lucide-react';

interface NavbarProps {
  activeTab?: 'tracker' | 'chat';
  setActiveTab?: (tab: 'tracker' | 'chat') => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps = {}) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-xl text-red-400">
              <Activity className="h-6 w-6 text-red-400 animate-pulse shrink-0" />
              <span className="hidden xs:inline sm:inline">Fit<span className="text-white">AI</span></span>
            </Link>
          </div>

          {/* Toggle Pills in Top Bar */}
          {activeTab && setActiveTab && (
            <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-0.5 shrink-0 mx-2">
              <button
                onClick={() => setActiveTab('tracker')}
                className={`rounded-lg px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'tracker'
                    ? 'bg-red-500 text-slate-950 shadow-md shadow-red-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`rounded-lg px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-red-500 text-slate-950 shadow-md shadow-red-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="AI Coach"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">AI Coach</span>
              </button>
            </div>
          )}

          {/* Navigation & Auth */}
          <nav className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-4">
                <Link
                  href="/dashboard"
                  className="hidden md:inline text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs text-slate-400">Logged in as</span>
                  <span className="text-sm font-semibold text-red-400">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-red-950/40 hover:border-red-900/50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-red-500 hover:bg-red-400 active:bg-red-600 px-3.5 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 shadow-md shadow-red-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
