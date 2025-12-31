import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerContextType {
  time: number; // Remaining seconds (if countdown) or Elapsed (if stopwatch)
  mode: 'countdown' | 'stopwatch';
  isRunning: boolean;
  isPaused: boolean;
  startTimer: (initialTime?: number) => void; // If provided, starts countdown
  addTime: (seconds: number) => void;
  stopTimer: () => void; // Skip
  formatTime: (s: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setTime(prev => {
            if (mode === 'countdown') {
                return prev - 1; // Can go negative (overtime)
            } else {
                return prev + 1;
            }
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, mode]);

  const startTimer = (initialTime?: number) => {
      if (initialTime !== undefined) {
          setMode('countdown');
          setTime(initialTime);
      } else {
          setMode('stopwatch');
          setTime(0);
      }
      setIsRunning(true);
      setIsPaused(false);
  };

  const stopTimer = () => {
      setIsRunning(false);
      setIsPaused(false);
      setTime(0);
  };

  const addTime = (seconds: number) => {
      setTime(prev => prev + seconds);
  };

  const formatTime = (seconds: number) => {
    const absS = Math.abs(seconds);
    const mins = Math.floor(absS / 60);
    const secs = absS % 60;
    const sign = seconds < 0 ? "+" : ""; // Negative countdown means "overtime" -> "+"
    // Actually typically countdown: 30, 29... 0. Then stop? or go negative?
    // User wants "+15s". 
    // If it goes negative, it usually implies we passed the rest time.
    // Let's format negative as "00:00" or just show negative?
    // Hevy shows "Rest Timer" and if you exceed it, it starts counting UP.
    // Let's just show standard MM:SS. If negative, maybe show red?
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{ time, mode, isRunning, isPaused, startTimer, addTime, stopTimer, formatTime }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
