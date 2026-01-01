import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DailySummary, WorkoutSession, User, Run } from '../lib/api';
import { Card, StatCard, ActionCard } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { SkeletonCard, SkeletonStat } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Dumbbell, Footprints, Utensils, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
    const [stats, setStats] = useState<DailySummary | null>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
    const [recentRuns, setRecentRuns] = useState<Run[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const today = new Date().toISOString().split('T')[0];
                const [summaries, sessions, runs, userData] = await Promise.all([
                    api.analytics.daily(today, today),
                    api.resistance.listSessions(),
                    api.running.list(),
                    api.identity.get()
                ]);

                if (summaries.length > 0) setStats(summaries[0]);
                setRecentWorkouts(sessions.slice(0, 3));
                setRecentRuns(runs.slice(0, 2));
                setUser(userData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const calorieGoal = 2200; // TODO: Calculate from user profile
    const calorieProgress = stats ? Math.min((stats.total_calories / calorieGoal) * 100, 100) : 0;
    const waterGoal = 3000;
    const waterProgress = stats ? Math.min((stats.water_ml / waterGoal) * 100, 100) : 0;

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="space-y-3">
                    <div className="h-6 w-48 skeleton rounded-lg" />
                    <div className="h-12 w-64 skeleton rounded-xl" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonStat key={i} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 md:space-y-12 animate-fade-in relative">
            {/* Ambient Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="ambient-orb ambient-orb-1" />
                <div className="ambient-orb ambient-orb-2" />
                <div className="ambient-orb ambient-orb-3" />
            </div>
            {/* Header */}
            <header className="space-y-2">
                <p className="text-neutral-500 font-medium text-sm">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {getGreeting()}, <span className="text-gradient">{user?.name?.split(' ')[0] || "Athlete"}</span>
                </h2>
            </header>

            {/* Hero Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calorie Ring */}
                <Card variant="gradient" padding="lg" className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <ProgressRing
                        progress={calorieProgress}
                        size={140}
                        strokeWidth={10}
                        color={calorieProgress > 100 ? 'red' : calorieProgress > 80 ? 'orange' : 'green'}
                        value={stats?.total_calories || 0}
                        unit="kcal"
                    />
                    <div className="text-center md:text-left space-y-4 flex-1">
                        <div>
                            <p className="stat-label mb-1">Daily Calories</p>
                            <p className="text-3xl font-bold tracking-tight">
                                {stats?.total_calories || 0} <span className="text-lg text-neutral-500">/ {calorieGoal}</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <MacroStat label="Protein" value={stats?.total_protein || 0} unit="g" color="emerald" />
                            <MacroStat label="Carbs" value={stats?.total_carbs || 0} unit="g" color="blue" />
                            <MacroStat label="Fat" value={stats?.total_fat || 0} unit="g" color="orange" />
                        </div>
                    </div>
                </Card>

                {/* Hydration + Activity */}
                <div className="grid grid-cols-2 gap-4">
                    <Card variant="interactive" className="flex flex-col items-center justify-center text-center min-h-[180px]">
                        <ProgressRing
                            progress={waterProgress}
                            size={80}
                            strokeWidth={6}
                            color="blue"
                        />
                        <div className="mt-3">
                            <p className="text-xl font-bold">{((stats?.water_ml || 0) / 1000).toFixed(1)}L</p>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Water</p>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <StatCard
                            label="Volume"
                            value={stats?.workout_volume_kg?.toLocaleString() || 0}
                            unit="kg"
                            icon={<Dumbbell size={16} />}
                        />
                        <StatCard
                            label="Running"
                            value={(stats?.run_distance || 0).toFixed(1)}
                            unit="km"
                            icon={<Footprints size={16} />}
                        />
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section>
                <h3 className="stat-label mb-4 px-1">Quick Log</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link to="/log/workout">
                        <ActionCard label="Start Workout" icon={<Dumbbell size={22} />} />
                    </Link>
                    <Link to="/log/run">
                        <ActionCard label="Log Run" icon={<Footprints size={22} />} />
                    </Link>
                    <Link to="/log/meal">
                        <ActionCard label="Log Meal" icon={<Utensils size={22} />} />
                    </Link>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Workouts */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="stat-label">Recent Workouts</h3>
                        <Link to="/log/workout" className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">
                            View All →
                        </Link>
                    </div>

                    {recentWorkouts.length === 0 ? (
                        <EmptyState
                            icon={<Dumbbell size={32} />}
                            title="No workouts yet"
                            description="Start your first workout to track your progress"
                            action={{ label: "Start Workout", to: "/log/workout" }}
                        />
                    ) : (
                        <div className="space-y-3">
                            {recentWorkouts.map((session, index) => (
                                <Link
                                    key={session.id}
                                    to={`/log/workout/${session.id}`}
                                    className={clsx(
                                        "group block opacity-0 animate-fade-in-up",
                                        `stagger-${index + 1}`
                                    )}
                                >
                                    <Card variant="interactive" padding="none" className="overflow-hidden">
                                        <div className="flex items-center p-5 gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all duration-300">
                                                <Dumbbell size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white truncate group-hover:text-white/90">
                                                    {session.notes || "Training Session"}
                                                </p>
                                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                                                    {new Date(session.start_time).toLocaleDateString()} • {session.sets?.length || 0} Sets
                                                </p>
                                            </div>
                                            <ArrowUpRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="stat-label px-1">Today's Progress</h3>

                    <Card variant="glass" className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <TrendingUp size={18} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold">Keep it up!</p>
                                <p className="text-xs text-neutral-500">You're on track with your goals</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ProgressBar label="Calories" current={stats?.total_calories || 0} target={calorieGoal} color="green" />
                            <ProgressBar label="Protein" current={stats?.total_protein || 0} target={150} unit="g" color="blue" />
                            <ProgressBar label="Water" current={(stats?.water_ml || 0) / 1000} target={3} unit="L" color="cyan" />
                        </div>
                    </Card>

                    {recentRuns.length > 0 && (
                        <>
                            <h3 className="stat-label px-1 pt-4">Recent Runs</h3>
                            {recentRuns.map((run) => (
                                <Link key={run.id} to={`/log/run/${run.id}`}>
                                    <Card variant="interactive" padding="sm" className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                            <Footprints size={18} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{(run.distance_meters / 1000).toFixed(2)} km</p>
                                            <p className="text-[10px] text-neutral-600">{formatDuration(run.duration_seconds)}</p>
                                        </div>
                                        <ArrowUpRight size={16} className="text-neutral-600" />
                                    </Card>
                                </Link>
                            ))}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

// Helper Components
function MacroStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-400 bg-emerald-500/10',
        blue: 'text-blue-400 bg-blue-500/10',
        orange: 'text-orange-400 bg-orange-500/10',
    };

    return (
        <div className={clsx("rounded-xl p-3 text-center", colors[color])}>
            <p className="text-lg font-bold tabular-nums">{Math.round(value)}{unit}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        </div>
    );
}

function ProgressBar({
    label,
    current,
    target,
    unit = '',
    color
}: {
    label: string;
    current: number;
    target: number;
    unit?: string;
    color: string;
}) {
    const progress = Math.min((current / target) * 100, 100);

    const colors: Record<string, string> = {
        green: 'bg-emerald-500',
        blue: 'bg-blue-500',
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="font-medium text-neutral-400">{label}</span>
                <span className="font-bold tabular-nums">
                    {typeof current === 'number' ? current.toFixed(unit === 'L' ? 1 : 0) : current}{unit}
                    <span className="text-neutral-600"> / {target}{unit}</span>
                </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={clsx("h-full rounded-full transition-all duration-1000 ease-out", colors[color])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
    action
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action: { label: string; to: string };
}) {
    return (
        <Card variant="default" className="p-12 text-center border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4 text-neutral-600">
                {icon}
            </div>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <p className="text-neutral-500 text-sm mb-6">{description}</p>
            <Link to={action.to} className="btn-primary inline-flex">
                <Plus size={18} />
                {action.label}
            </Link>
        </Card>
    );
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
