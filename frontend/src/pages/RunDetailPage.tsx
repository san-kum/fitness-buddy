import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Run } from '../lib/api';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { ArrowLeft, Navigation, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';

// Fix Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapBounds({ path }: { path: [number, number, number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (path && path.length > 0) {
            const bounds = L.latLngBounds(path.map(p => [p[0], p[1]]));
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [path]);
    return null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        api.running.list().then(runs => {
            const r = runs.find(r => r.id === parseInt(id));
            setRun(r || null);
            setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-12 text-center text-neutral-500 font-bold tracking-widest animate-pulse">Retrieving Metadata...</div>;
  if (!run) return <div className="p-12 text-center text-red-500 font-bold italic">Session Hardware Not Found</div>;

  const path: [number, number, number, number][] = run.route_data ? JSON.parse(run.route_data) : [];

  const elevationData = path.map((p, i) => ({
      dist: i, 
      alt: p[2] || 0
  })).filter((_, i) => i % 10 === 0);

  const calculateSplits = () => {
      if (path.length < 2) return [];
      const splits = [];
      let currentSplitDist = 0;
      let splitStartIdx = 0;
      
      for (let i = 1; i < path.length; i++) {
          const d = getDistance(path[i-1][0], path[i-1][1], path[i][0], path[i][1]);
          currentSplitDist += d;
          
          if (currentSplitDist >= 1000) {
              const timeDiff = path[i][3] - path[splitStartIdx][3];
              splits.push({
                  id: splits.length + 1,
                  time: timeDiff,
                  distance: currentSplitDist
              });
              currentSplitDist = 0;
              splitStartIdx = i;
          }
      }
      if (currentSplitDist > 100) {
           const timeDiff = path[path.length - 1][3] - path[splitStartIdx][3];
           splits.push({
               id: splits.length + 1,
               time: timeDiff,
               distance: currentSplitDist
           });
      }
      return splits;
  };

  const splits = calculateSplits();

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-fade-in">
      <header className="flex items-center gap-6 border-b border-white/5 pb-10">
          <button onClick={() => navigate('/log/run')} className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-90">
              <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div>
              <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 rounded uppercase tracking-widest">{run.run_type}</span>
                  <span className="text-neutral-600 font-mono text-[10px] tracking-[0.2em]">{new Date(run.start_time).toLocaleTimeString()}</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">{new Date(run.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
              <div className="h-[50vh] rounded-[3rem] overflow-hidden border border-white/10 relative shadow-2xl group shadow-black">
                  {path.length > 0 ? (
                      <MapContainer center={[path[0][0], path[0][1]]} zoom={15} className="h-full w-full grayscale contrast-125 brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700">
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                          <Polyline positions={path.map(p => [p[0], p[1]])} color="white" weight={5} />
                          <Marker position={[path[0][0], path[0][1]]} />
                          <Marker position={[path[path.length-1][0], path[path.length-1][1]]} />
                          <MapBounds path={path} />
                      </MapContainer>
                  ) : (
                      <div className="h-full w-full flex items-center justify-center bg-neutral-950 text-neutral-800 italic uppercase font-black tracking-widest">Navigation_Buffer_Empty</div>
                  )}
                  <div className="absolute top-8 left-8 z-[1000] pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                          <Navigation size={16} className="text-white fill-white" />
                          <span className="text-xs font-black text-white uppercase tracking-widest italic">Live Trace Vector</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard label="Total Range" value={(run.distance_meters / 1000).toFixed(2)} unit="KM" />
                  <StatCard label="Moving Duration" value={`${Math.floor(run.duration_seconds / 60)}:${String(run.duration_seconds % 60).padStart(2, '0')}`} unit="TIME" />
                  <StatCard label="Avg Pace" value={`${Math.floor((run.duration_seconds / (run.distance_meters / 1000 || 1)) / 60)}:${String(Math.floor((run.duration_seconds / (run.distance_meters / 1000 || 1)) % 60)).padStart(2, '0')}`} unit="/KM" />
                  <StatCard label="Altimeter" value={run.elevation_gain_meters.toFixed(0)} unit="M" />
              </div>

              <section className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                      <TrendingUp size={16} className="text-neutral-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Elevation Profile</h3>
                  </div>
                  <div className="h-48 w-full bg-neutral-950/50 border border-white/5 rounded-[2rem] p-6 shadow-xl">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={elevationData}>
                              <defs>
                                  <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="white" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '16px', fontSize: '10px'}} itemStyle={{color: '#fff'}} />
                              <Area type="monotone" dataKey="alt" stroke="white" strokeWidth={2} fill="url(#colorAlt)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </section>
          </div>

          <div className="lg:col-span-4 space-y-10">
              <section className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 px-4">Segment Breakdown</h3>
                  <div className="bg-neutral-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                      <div className="grid grid-cols-3 text-[8px] font-black uppercase tracking-widest text-neutral-600 p-6 border-b border-white/5 bg-white/[0.02]">
                          <span>Kilometer</span>
                          <span className="text-center">Pace</span>
                          <span className="text-right">Distance</span>
                      </div>
                      <div className="divide-y divide-white/5">
                          {splits.map(split => (
                              <div key={split.id} className="grid grid-cols-3 p-6 text-sm font-bold items-center hover:bg-white/5 transition-colors">
                                  <span className="text-neutral-500 font-mono italic">#{String(split.id).padStart(2, '0')}</span>
                                  <span className="text-center text-white font-mono">{Math.floor(split.time / 60)}:{String(split.time % 60).padStart(2, '0')}</span>
                                  <span className="text-right text-neutral-400 text-xs uppercase tracking-tighter">{(split.distance / 1000).toFixed(2)} km</span>
                              </div>
                          ))}
                          {splits.length === 0 && <div className="p-10 text-center text-neutral-700 italic text-xs uppercase tracking-widest">No segments processed.</div>}
                      </div>
                  </div>
              </section>

              <section className="p-8 bg-neutral-900/40 border border-white/5 rounded-[2.5rem] space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-3">
                      <Zap size={16} className="text-neutral-600" />
                      <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">Hardware Status</h3>
                  </div>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Active Gear</span>
                          <span className="text-xs font-black text-white italic uppercase tracking-tight">{run.shoe_name || "Factory Default"}</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Relative Effort</span>
                          <span className="text-xs font-black text-white italic">{run.relative_effort || "-"}/10</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Motion Points</span>
                          <span className="text-xs font-black text-white font-mono tracking-tighter">{run.steps?.toLocaleString() || 0}</span>
                      </div>
                  </div>
              </section>
          </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string, value: string | number, unit: string }) {
    return (
        <div className="bg-neutral-900/30 border border-white/5 p-8 rounded-[2.5rem] space-y-2 hover:bg-neutral-900/50 transition-all duration-500 shadow-xl">
            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] leading-none">{label}</p>
            <div className="flex items-baseline gap-1 leading-none">
                <span className="text-3xl font-black text-white tracking-tighter italic tabular-nums uppercase">{value}</span>
                <span className="text-[9px] font-black text-neutral-800 tracking-widest uppercase">{unit}</span>
            </div>
        </div>
    );
}