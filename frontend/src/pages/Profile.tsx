import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User, BodyMetric } from '../lib/api';
import { Save, User as UserIcon, Ruler, Weight, Activity, Zap, LogOut } from 'lucide-react';
import clsx from 'clsx';

const ACTIVITY_LEVELS = [
// ... (rest of the constants)
    { label: 'Sedentary (Office job, little exercise)', value: 'Sedentary', factor: 1.2 },
    { label: 'Lightly Active (Light exercise 1-3 days/week)', value: 'Lightly Active', factor: 1.375 },
    { label: 'Moderately Active (Moderate exercise 3-5 days/week)', value: 'Moderately Active', factor: 1.55 },
    { label: 'Very Active (Hard exercise 6-7 days/week)', value: 'Very Active', factor: 1.725 },
    { label: 'Extra Active (Very hard exercise, physical job)', value: 'Extra Active', factor: 1.9 },
];

const WEIGHT_GOALS = [
    { label: 'Lose Weight (-500 kcal)', value: 'Lose Weight', offset: -500 },
    { label: 'Maintain Weight', value: 'Maintain', offset: 0 },
    { label: 'Gain Weight (+500 kcal)', value: 'Gain Weight', offset: 500 },
];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("M");
  const [activityLevel, setActivityLevel] = useState("Sedentary");
  const [weightGoal, setWeightGoal] = useState("Maintain");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [u, metrics] = await Promise.all([
          api.identity.get(),
          api.body.list()
      ]);
      
      setUser(u);
      setName(u.name);
      setHeight(u.height_cm?.toString() || "");
      setDob(u.dob ? u.dob.split('T')[0] : "");
      setSex(u.sex || "M");
      setActivityLevel(u.activity_level || "Sedentary");
      setWeightGoal(u.weight_goal || "Maintain");

      if (metrics && metrics.length > 0) {
          setLatestMetric(metrics[0]);
          setWeight(metrics[0].weight_kg?.toString() || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const calculateTDEE = () => {
      if (!user || !latestMetric || !user.height_cm || !user.dob) return 0;
      
      const weight = latestMetric.weight_kg || 70;
      const height = user.height_cm;
      const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
      
      // Mifflin-St Jeor Equation
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      if (user.sex === 'M') bmr += 5;
      else bmr -= 161;
      
      const activity = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.factor || 1.2;
      const maintenance = bmr * activity;
      
      const goalOffset = WEIGHT_GOALS.find(g => g.value === weightGoal)?.offset || 0;
      return {
          maintenance: Math.round(maintenance),
          target: Math.round(maintenance + goalOffset)
      };
  };

  const tdee = calculateTDEE();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.identity.update({
        name,
        height_cm: height ? parseFloat(height) : undefined,
        dob: dob ? new Date(dob).toISOString() : undefined,
        sex,
        activity_level: activityLevel,
        weight_goal: weightGoal
      });

      const newWeight = parseFloat(weight);
      if (weight && (!latestMetric || newWeight !== latestMetric.weight_kg)) {
          await api.body.create({
              recorded_at: new Date().toISOString(),
              weight_kg: newWeight
          });
      }

      alert("System update complete: Profile synchronized.");
      loadData();
    } catch (e) {
      alert("Error: Profile persistence failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-bold tracking-widest text-xs uppercase">Accessing Profile</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-32 animate-fade-in">
        {/* Profile Header */}
        <header className="flex flex-col md:flex-row items-center gap-10 p-10 bg-neutral-900/30 border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="w-32 h-32 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-3xl group-hover:scale-105 transition-transform duration-500">
                <UserIcon size={64} className="text-neutral-700 group-hover:text-white transition-colors" />
            </div>
            <div className="text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">{user?.name || "Anonymous"}</h2>
                    {!user?.google_id ? (
                        <a 
                            href="/api/auth/google/login" 
                            className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2"
                        >
                            <Zap size={12} fill="currentColor" /> Connect Account
                        </a>
                    ) : (
                        <a 
                            href="/api/auth/logout"
                            className="bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={12} /> Disconnect ({user.email})
                        </a>
                    )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <HeaderStat icon={<Ruler size={14}/>} label="Height" value={`${user?.height_cm || "-"} cm`} />
                    <HeaderStat icon={<Weight size={14}/>} label="Weight" value={`${latestMetric?.weight_kg || "-"} kg`} />
                    <HeaderStat icon={<Activity size={14}/>} label="Sex" value={user?.sex === 'M' ? "Male" : "Female"} />
                </div>
            </div>
            {tdee !== 0 && typeof tdee !== 'number' && (
                <div className="md:ml-auto bg-white text-black p-8 rounded-[2rem] text-center shadow-2xl shadow-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Target Intake</p>
                    <p className="text-4xl font-black italic tracking-tighter">{tdee.target}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter mt-1">KCAL / DAY</p>
                </div>
            )}
        </header>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-12">
                <section className="space-y-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-1 h-4 bg-white rounded-full"></div>
                        Identity Config
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileInput label="Designation" value={name} onChange={setName} placeholder="Name" />
                        <ProfileInput label="Temporal Origin" value={dob} onChange={setDob} type="date" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <ProfileInput label="Length (cm)" value={height} onChange={setHeight} type="number" />
                        <ProfileInput label="Mass (kg)" value={weight} onChange={setWeight} type="number" />
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-2">Bio-Sex</p>
                            <select value={sex} onChange={e => setSex(e.target.value)} className="w-full bg-neutral-900 border border-white/5 text-white p-5 rounded-2xl focus:border-white outline-none font-bold appearance-none text-center">
                                <option value="M">MALE</option>
                                <option value="F">FEMALE</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-1 h-4 bg-white rounded-full"></div>
                        Metabolic Goals
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-2">Activity Level</p>
                            <div className="grid grid-cols-1 gap-2">
                                {ACTIVITY_LEVELS.map(level => (
                                    <div 
                                        key={level.value}
                                        onClick={() => setActivityLevel(level.value)}
                                        className={clsx(
                                            "p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center",
                                            activityLevel === level.value ? "bg-white text-black border-transparent shadow-xl" : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:border-white/10"
                                        )}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-tight">{level.label}</span>
                                        {activityLevel === level.value && <Zap size={16} fill="currentColor" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-2">Weight Objective</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {WEIGHT_GOALS.map(goal => (
                                    <div 
                                        key={goal.value}
                                        onClick={() => setWeightGoal(goal.value)}
                                        className={clsx(
                                            "p-5 rounded-2xl border cursor-pointer transition-all text-center",
                                            weightGoal === goal.value ? "bg-white text-black border-transparent shadow-xl" : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:border-white/10"
                                        )}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-tighter">{goal.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="lg:col-span-5 space-y-8">
                <div className="sticky top-24 space-y-8">
                    <section className="p-8 bg-neutral-900/50 border border-white/5 rounded-[2.5rem] space-y-8">
                        <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest text-center">Summary Projection</h3>
                        <div className="space-y-6">
                            <ProjectionRow label="Basal Metabolic Rate" value={tdee !== 0 && typeof tdee !== 'number' ? Math.round(tdee.maintenance / (ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.factor || 1.2)) : 0} />
                            <ProjectionRow label="Maintenance TDEE" value={tdee !== 0 && typeof tdee !== 'number' ? tdee.maintenance : 0} />
                            <div className="pt-6 border-t border-white/5">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Daily Protocol</p>
                                        <p className="text-4xl font-black text-white italic tracking-tighter mt-1">{tdee !== 0 && typeof tdee !== 'number' ? tdee.target : 0} KCAL</p>
                                    </div>
                                    <div className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-1",
                                        weightGoal === 'Lose Weight' ? 'bg-red-500/10 text-red-500' : 
                                        weightGoal === 'Gain Weight' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white'
                                    )}>
                                        {weightGoal}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-200 transition-all active:scale-95 shadow-3xl shadow-white/10 flex items-center justify-center gap-3 italic"
                    >
                        {saving ? "SYNCING..." : <><Save size={18} strokeWidth={3} /> COMMIT_CHANGES</>}
                    </button>
                </div>
            </div>
        </form>
    </div>
  );
}

function ProfileInput({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-2">{label}</label>
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
                className="w-full bg-neutral-900 border border-white/5 text-white p-5 rounded-2xl focus:border-white outline-none font-bold transition-all"
            />
        </div>
    );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="text-neutral-600">{icon}</div>
            <div className="space-y-0.5">
                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-sm font-bold text-neutral-300 leading-none">{value}</p>
            </div>
        </div>
    );
}

function ProjectionRow({ label, value }: { label: string, value: number }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{label}</span>
            <span className="font-mono text-white font-bold">{value} <span className="text-[10px] text-neutral-700">KCAL</span></span>
        </div>
    );
}