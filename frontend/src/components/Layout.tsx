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
        <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 border-r border-white/5 bg-black z-50">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Dumbbell className="text-black" size={18} strokeWidth={2.5} />
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
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-neutral-900 text-white shadow-sm shadow-white/5"
                          : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
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
                  "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200",
                  location.pathname === "/profile"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-white"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden">
                  <User size={16} />
                </div>
                <span className="text-sm font-semibold">Profile</span>
              </Link>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-transparent relative">
        {/* Mobile Top Header - Hide during workout */}
        {!isWorkoutSession && (
          <header className="md:hidden bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100] px-6 py-4 flex justify-between items-center">
              <span className="text-lg font-bold tracking-tighter italic">FITNESS BUDDY</span>
              <div className="flex items-center gap-4">
                  {isRunning && (
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-mono font-bold">{formatTime(time)}</span>
                      </div>
                  )}
                  <Link to="/profile" className="w-9 h-9 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center">
                      <User size={18} className="text-neutral-400" />
                  </Link>
              </div>
          </header>
        )}

        {/* Content Area */}
        <div className={clsx(
          "px-4 py-8 md:px-12 md:py-12 max-w-5xl mx-auto animate-fade-in",
          !isWorkoutSession ? "pb-40 md:pb-12" : "pb-12"
        )}>
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Hide during workout */}
      {!isWorkoutSession && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center px-2 z-[150] pb-safe">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 w-16 h-14 transition-all duration-300",
                  isActive ? "text-white" : "text-neutral-500"
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Modern Floating Timer - Adjusted bottom spacing for mobile */}
      {isRunning && (
        <div className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-10 z-[160] animate-fade-in-up">
            <div className="bg-neutral-900 border border-white/10 p-4 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] flex flex-col items-center md:w-72">
                <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-2">
                        {mode === 'countdown' ? "Recovery" : "Stopwatch"}
                    </span>
                    <button onClick={stopTimer} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                        <X size={14} className="text-neutral-500" />
                    </button>
                </div>
                
                <div className={clsx(
                    "text-5xl font-mono font-bold tracking-tighter tabular-nums mb-4", 
                    time < 0 ? "text-red-500" : "text-white"
                )}>
                    {formatTime(time)}
                </div>
                
                <div className="w-full grid grid-cols-3 gap-2">
                    <button onClick={() => addTime(-15)} className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all active:scale-95 font-bold text-xs">
                        -15s
                    </button>
                    <button onClick={stopTimer} className="bg-white text-black hover:bg-neutral-200 py-3 rounded-xl transition-all active:scale-95 font-bold text-xs uppercase">
                        Skip
                    </button>
                    <button onClick={() => addTime(15)} className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all active:scale-95 font-bold text-xs">
                        +15s
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}