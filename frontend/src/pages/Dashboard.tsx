import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DailySummary, WorkoutSession, User } from '../lib/api';
import { Card } from '../components/Card';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Activity, Flame, Trophy, Dumbbell, Zap } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DailySummary | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [summaries, sessions, userData] = await Promise.all([
            api.analytics.daily(today, today),
            api.resistance.listSessions(),
            api.identity.get()
        ]);

        if (summaries.length > 0) setStats(summaries[0]);
        setRecentWorkouts(sessions.slice(0, 3));
        setUser(userData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium text-xs tracking-widest uppercase">Loading...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Refined Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Performance Status: Active</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">
            Hi, {user?.name || "Athlete"}
        </h2>
        <p className="text-neutral-500 font-medium text-lg">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Grid: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
            label="Calories" 
            value={stats?.total_calories || 0} 
            unit="kcal" 
            icon={<Zap size={16} />}
        />
        <StatCard 
            label="Protein" 
            value={stats?.total_protein.toFixed(0) || 0} 
            unit="g" 
            icon={<Flame size={16} />} 
        />
        <StatCard 
            label="Volume" 
            value={stats?.workout_volume_kg.toLocaleString() || 0} 
            unit="kg" 
            icon={<Trophy size={16} />} 
        />
        <StatCard 
            label="Running" 
            value={stats?.run_distance.toFixed(1) || 0} 
            unit="km" 
            icon={<Activity size={16} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Activity Feed */}
        <section className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Recent Activity</h3>
                <Link to="/log/workout" className="text-[10px] font-bold text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all tracking-widest uppercase">History</Link>
            </div>
            
            <div className="space-y-3">
                {recentWorkouts.map(s => (
                    <Card key={s.id} className="!p-0 border-white/[0.03] group overflow-hidden">
                        <Link to={`/log/workout/${s.id}`} className="flex items-center p-5 justify-between transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:scale-110 transition-transform">
                                    <Dumbbell size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:underline decoration-white/20 underline-offset-4 transition-all">
                                        {s.notes || "Training Session"}
                                    </div>
                                    <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                                        {new Date(s.start_time).toLocaleDateString()} • {s.sets?.length || 0} Sets
                                    </div>
                                </div>
                            </div>
                            <ArrowUpRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                        </Link>
                    </Card>
                ))}
                {recentWorkouts.length === 0 && (
                    <div className="p-12 border border-dashed border-white/10 rounded-[2rem] text-center">
                        <p className="text-neutral-600 mb-6 font-medium">No activity logged.</p>
                        <Link to="/log/workout" className="bg-white text-black px-8 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity">Record Workout</Link>
                    </div>
                )}
            </div>
        </section>
        
        {/* Logging Shortcuts */}
        <section className="lg:col-span-5 space-y-6">
             <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 px-2">Quick Log</h3>
             <div className="grid gap-4">
                 <Link to="/log/meal" className="group flex items-center justify-between p-6 bg-neutral-900/40 border border-white/5 rounded-[2rem] hover:bg-white transition-all duration-500">
                    <span className="text-xl font-bold text-white group-hover:text-black transition-colors italic">Log Meal</span>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <Plus size={20} className="text-white group-hover:text-black transition-colors" />
                    </div>
                 </Link>
                 
                 <Link to="/log/run" className="group flex items-center justify-between p-6 bg-neutral-900/40 border border-white/5 rounded-[2rem] hover:bg-white transition-all duration-500">
                    <span className="text-xl font-bold text-white group-hover:text-black transition-colors italic">Log Run</span>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <Plus size={20} className="text-white group-hover:text-black transition-colors" />
                    </div>
                 </Link>
            </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon }: { label: string, value: string | number, unit: string, icon: React.ReactNode }) {
    return (
        <Card className="!p-6 group flex flex-col justify-between min-h-[140px] hover:scale-[1.02]">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors">{label}</span>
                <div className="text-neutral-700 group-hover:text-white transition-colors">{icon}</div>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-4xl font-bold tracking-tighter tabular-nums">{value}</span>
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{unit}</span>
            </div>
        </Card>
    );
}
