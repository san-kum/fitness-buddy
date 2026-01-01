import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Footprints, Utensils, BarChart2, User, X } from 'lucide-react';
import clsx from 'clsx';
import { useTimer } from '../context/TimerContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { time, isRunning, mode, stopTimer, addTime, formatTime } = useTimer();

  const isWorkoutSession = location.pathname.startsWith('/log/workout/');

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/log/workout", icon: Dumbbell, label: "Train" },
    { to: "/log/run", icon: Footprints, label: "Run" },
    { to: "/log/meal", icon: Utensils, label: "Eat" },
    { to: "/analytics", icon: BarChart2, label: "Stats" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-white">
      {/* Desktop Sidebar */}
      {!isWorkoutSession && (
        <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 border-r border-white/5 bg-black/50 backdrop-blur-xl z-50">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
                <Dumbbell className="text-black" size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Fitness Buddy</h1>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group min-h-[48px]",
                      isActive
                        ? "bg-white text-black shadow-lg shadow-white/5"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6">
            <Link
              to="/profile"
              className={clsx(
                "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200 min-h-[56px]",
                location.pathname === "/profile"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
                location.pathname === "/profile" ? "bg-black/10" : "bg-neutral-800 border border-white/10"
              )}>
                <User size={18} />
              </div>
              <span className="text-sm font-semibold">Profile</span>
            </Link>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-transparent relative">
        {/* Mobile Top Header */}
        {!isWorkoutSession && (
          <header className="md:hidden bg-black/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100] px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Dumbbell className="text-black" size={16} strokeWidth={3} />
              </div>
              <span className="text-base font-bold tracking-tight">Fitness Buddy</span>
            </div>
            <div className="flex items-center gap-3">
              {isRunning && (
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-mono font-bold tabular-nums">{formatTime(time)}</span>
                </div>
              )}
              <Link to="/profile" className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center">
                <User size={18} className="text-neutral-400" />
              </Link>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className={clsx(
          "px-5 py-8 md:px-12 md:py-12 max-w-5xl mx-auto animate-fade-in",
          !isWorkoutSession ? "pb-32 md:pb-12" : "pb-12"
        )}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isWorkoutSession && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center px-2 z-[150] pb-safe pt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 w-16 py-3 transition-all duration-200 min-h-[56px]",
                  isActive ? "text-white" : "text-neutral-500"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                  isActive && "bg-white text-black"
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Floating Timer */}
      {isRunning && (
        <div className="fixed bottom-28 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-[160] animate-slide-up">
          <div className="bg-neutral-950 border border-white/10 p-5 rounded-3xl shadow-2xl shadow-black/50 flex flex-col items-center md:w-80 backdrop-blur-xl">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 ml-1">
                {mode === 'countdown' ? "Recovery" : "Stopwatch"}
              </span>
              <button onClick={stopTimer} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X size={16} className="text-neutral-500" />
              </button>
            </div>

            <div className={clsx(
              "text-5xl font-mono font-black tracking-tighter tabular-nums mb-4",
              time < 0 ? "text-red-500" : "text-white"
            )}>
              {formatTime(time)}
            </div>

            <div className="w-full grid grid-cols-3 gap-2">
              <button
                onClick={() => addTime(-15)}
                className="bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl transition-all active:scale-95 font-bold text-xs min-h-[48px]"
              >
                -15s
              </button>
              <button
                onClick={stopTimer}
                className="bg-white text-black hover:bg-neutral-100 py-3.5 rounded-xl transition-all active:scale-95 font-bold text-xs uppercase min-h-[48px]"
              >
                Skip
              </button>
              <button
                onClick={() => addTime(15)}
                className="bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl transition-all active:scale-95 font-bold text-xs min-h-[48px]"
              >
                +15s
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}