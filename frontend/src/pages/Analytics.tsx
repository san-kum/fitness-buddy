import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DailySummary } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Target, TrendingUp, Zap } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<DailySummary[]>([]);
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [range]);

  async function loadData() {
    setLoading(true);
    try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - parseInt(range));
        
        const summaries = await api.analytics.daily(
            start.toISOString().split('T')[0], 
            end.toISOString().split('T')[0]
        );
        setData([...summaries].reverse());
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 md:space-y-20 pb-32 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <div className="space-y-2">
            <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Analytics</h2>
            <p className="text-neutral-500 font-medium max-w-md uppercase tracking-widest text-[10px]">Metabolic & Performance Trend Analysis</p>
        </div>
        <div className="flex bg-neutral-900/50 p-1.5 rounded-2xl border border-white/5 self-start md:self-end">
            {["7", "30", "90"].map((r) => (
                <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${range === r ? 'bg-white text-black shadow-xl' : 'text-neutral-500 hover:text-white'}`}
                >
                    {r} Days
                </button>
            ))}
        </div>
      </header>

      {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
              <p className="text-neutral-600 font-black uppercase tracking-widest text-[10px]">Processing Data Nodes</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 gap-16 md:gap-24">
            {/* Energy & Macros - Bar Chart */}
            <ChartSection 
                title="Metabolic Intake" 
                subtitle="Caloric & Macronutrient Distribution"
                icon={<Target size={20} strokeWidth={2.5} />}
            >
                <div className="h-[350px] md:h-[450px] w-full bg-neutral-950/50 border border-white/5 p-4 md:p-8 rounded-[2.5rem] shadow-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '20px', padding: '15px'}}
                                itemStyle={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'}}
                                labelStyle={{color: '#fff', marginBottom: '8px', fontWeight: '900', fontSize: '12px'}}
                                cursor={{fill: 'white', opacity: 0.03}}
                            />
                            <Bar dataKey="total_protein" stackId="a" fill="white" name="PRO" />
                            <Bar dataKey="total_carbs" stackId="a" fill="#444" name="CHO" />
                            <Bar dataKey="total_fat" stackId="a" fill="#111" name="FAT" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartSection>

            {/* Training Volume - Area Chart */}
            <ChartSection 
                title="Volume Progression" 
                subtitle="Mechanical Load (KG) Over Time"
                icon={<TrendingUp size={20} strokeWidth={2.5} />}
            >
                <div className="h-[350px] md:h-[450px] w-full bg-neutral-950/50 border border-white/5 p-4 md:p-8 rounded-[2.5rem] shadow-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="white" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '20px'}}
                                itemStyle={{color: 'white', fontWeight: 'bold', fontSize: '11px'}}
                                labelStyle={{color: '#666', marginBottom: '5px', fontSize: '11px'}}
                            />
                            <Area type="monotone" dataKey="workout_volume_kg" stroke="white" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" name="VOL (KG)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartSection>

            {/* Cardiac Output - Bar Chart */}
            <ChartSection 
                title="Cardiac Analysis" 
                subtitle="Aerobic Distance (KM) Variance"
                icon={<Activity size={20} strokeWidth={2.5} />}
            >
                <div className="h-[350px] md:h-[450px] w-full bg-neutral-950/50 border border-white/5 p-4 md:p-8 rounded-[2.5rem] shadow-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '20px'}}
                                itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
                                cursor={{fill: 'white', opacity: 0.05}}
                            />
                            <Bar dataKey="run_distance" fill="white" radius={[5, 5, 0, 0]} name="DIST (M)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartSection>

            {/* Weight History - Area Chart */}
            <ChartSection 
                title="Body Composition" 
                subtitle="Mass Index Regression"
                icon={<Zap size={20} strokeWidth={2.5} />}
            >
                <div className="h-[350px] md:h-[450px] w-full bg-neutral-950/50 border border-white/5 p-4 md:p-8 rounded-[2.5rem] shadow-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.filter(d => d.weight_kg > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} dy={10} />
                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 9, fill: '#404040', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '20px'}}
                                itemStyle={{color: 'white', fontWeight: 'bold', fontSize: '11px'}}
                            />
                            <Area type="stepAfter" dataKey="weight_kg" stroke="white" strokeWidth={3} fillOpacity={0.05} fill="white" name="MASS (KG)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartSection>
        </div>
      )}
    </div>
  );
}

function ChartSection({ title, subtitle, icon, children }: { title: string, subtitle: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <section className="space-y-8">
            <div className="flex items-center gap-4 px-4">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center text-white">
                    {icon}
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">{title}</h3>
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-1">{subtitle}</p>
                </div>
            </div>
            {children}
        </section>
    );
}
