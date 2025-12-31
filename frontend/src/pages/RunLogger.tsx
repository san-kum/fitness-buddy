import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import type { Run, Shoe } from '../lib/api';
import { Trash2, Footprints, Check, Clock, Navigation, ChevronRight, Signal } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import clsx from 'clsx';

// REPLACE THIS with your Mapbox Public Token
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FuanVzaGFuIiwiYSI6ImNtNWVlbXR0azAwdzkybm9qbnIzNHVxcDMifQ.Z_IdX_-_xkX_v_xkX_v_xk";
mapboxgl.accessToken = MAPBOX_TOKEN;

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

export default function RunLogger() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const navigate = useNavigate();
  
  // Modals
  const [showManualForm, setShowManualForm] = useState(false);
  const [showShoeForm, setShowShoeForm] = useState(false);
  const [showLiveRun, setShowLiveRun] = useState(false);
  
  // Live State
  const [liveDuration, setLiveDuration] = useState(0);
  const [liveDistance, setLiveDistance] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [livePath, setLivePath] = useState<[number, number, number, number][]>([]); // lat, lng, alt, time
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const lastPosition = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Manual Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0,5));
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [elevation, setElevation] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [selectedShoe, setSelectedShoe] = useState("");
  const [runType, setRunType] = useState("Run");
  const [notes, setNotes] = useState("");

  // New Shoe Form
  const [shoeBrand, setShoeBrand] = useState("");
  const [shoeModel, setShoeModel] = useState("");

  useEffect(() => {
    loadData();
    return () => stopTracking(); 
  }, []);

  // Initialize Mapbox when Live Run modal opens
  useEffect(() => {
      if (showLiveRun && mapContainer.current && !mapRef.current) {
          mapRef.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: 'mapbox://styles/mapbox/dark-v11',
              center: [0, 0],
              zoom: 15,
              pitch: 45,
              bearing: -17
          });

          mapRef.current.on('load', () => {
              if (!mapRef.current) return;
              mapRef.current.addSource('route', {
                  'type': 'geojson',
                  'data': {
                      'type': 'Feature',
                      'properties': {},
                      'geometry': {
                          'type': 'LineString',
                          'coordinates': []
                      }
                  }
              });

              mapRef.current.addLayer({
                  'id': 'route',
                  'type': 'line',
                  'source': 'route',
                  'layout': { 'line-join': 'round', 'line-cap': 'round' },
                  'paint': { 'line-color': '#ffffff', 'line-width': 4 }
              });
          });
      }
      return () => {
          if (!showLiveRun && mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
              markerRef.current = null;
          }
      };
  }, [showLiveRun]);

  // Update Map Path in real-time
  useEffect(() => {
      if (mapRef.current && livePath.length > 0) {
          const coords = livePath.map(p => [p[1], p[0]]); // [lng, lat] for Mapbox
          const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
          if (source) {
              source.setData({
                  'type': 'Feature',
                  'properties': {},
                  'geometry': { 'type': 'LineString', 'coordinates': coords }
              });
          }

          const latest = coords[coords.length - 1] as [number, number];
          if (!markerRef.current) {
              markerRef.current = new mapboxgl.Marker({ color: '#ffffff' }).setLngLat(latest).addTo(mapRef.current);
          } else {
              markerRef.current.setLngLat(latest);
          }
          mapRef.current.easeTo({ center: latest, duration: 1000 });
      }
  }, [livePath]);

  async function loadData() {
    try {
      const [runData, shoeData] = await Promise.all([
          api.running.list(),
          api.running.listShoes()
      ]);
      setRuns(runData);
      setShoes(shoeData);
    } catch (e) { console.error(e); }
  }

  const startTracking = async () => {
      if (!navigator.geolocation) {
          alert("Geolocation unsupported.");
          return;
      }

      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          try {
              const permission = await (DeviceMotionEvent as any).requestPermission();
              if (permission !== 'granted') console.warn("Motion permission denied.");
          } catch (e) { console.error(e); }
      }

      setShowLiveRun(true);
      setLiveDuration(0);
      setGpsAccuracy(null);
      setLiveDistance(0);
      setLiveSteps(0);
      setLivePath([]);
      lastPosition.current = null;

      watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
              setGpsAccuracy(Math.round(pos.coords.accuracy));
              const currentCoords: [number, number, number, number] = [
                  pos.coords.latitude, 
                  pos.coords.longitude, 
                  pos.coords.altitude || 0,
                  Date.now() / 1000
              ];
              setLivePath(prev => [...prev, currentCoords]);

              if (lastPosition.current) {
                  const d = getDistance(
                      lastPosition.current.latitude, 
                      lastPosition.current.longitude, 
                      pos.coords.latitude, 
                      pos.coords.longitude
                  );
                  if (d > 3 && pos.coords.accuracy < 20) setLiveDistance(prev => prev + d);
              }
              lastPosition.current = pos.coords;
          },
          (err) => console.error(err),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );

      timerId.current = window.setInterval(() => {
          setLiveDuration(prev => prev + 1);
      }, 1000);

      if (window.DeviceMotionEvent) {
          let lastSum = 0;
          const threshold = 15;
          const handler = (e: DeviceMotionEvent) => {
              const accel = e.accelerationIncludingGravity;
              if (!accel || accel.x === null || accel.y === null || accel.z === null) return;
              const currentSum = Math.abs(accel.x + accel.y + accel.z);
              const delta = Math.abs(currentSum - lastSum);
              if (delta > threshold) setLiveSteps(prev => prev + 1);
              lastSum = currentSum;
          };
          motionHandlerRef.current = handler;
          window.addEventListener('devicemotion', handler);
      }
  };

  const stopTracking = () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (timerId.current) clearInterval(timerId.current);
      if (motionHandlerRef.current) {
          window.removeEventListener('devicemotion', motionHandlerRef.current);
          motionHandlerRef.current = null;
      }
  };

  const saveLiveRun = async () => {
      stopTracking();
      try {
          await api.running.create({
              start_time: new Date().toISOString(),
              distance_meters: liveDistance,
              duration_seconds: liveDuration,
              steps: Math.floor(liveSteps / 2),
              route_data: JSON.stringify(livePath),
              run_type: "Run",
              notes: "Map-Integrated Session"
          });
          setShowLiveRun(false);
          loadData();
      } catch (e) { alert("Sync failed."); }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${date}T${time}`).toISOString();
      await api.running.create({
        start_time: startDateTime,
        distance_meters: parseFloat(distance) * 1000, 
        duration_seconds: parseFloat(duration) * 60,
        elevation_gain_meters: elevation ? parseFloat(elevation) : 0,
        avg_heart_rate: avgHr ? parseInt(avgHr) : undefined,
        shoe_id: selectedShoe ? parseInt(selectedShoe) : undefined,
        run_type: runType,
        notes: notes || undefined
      });
      setShowManualForm(false);
      loadData();
    } catch (e) { alert("Save failed."); }
  }

  const handleSaveShoe = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.running.createShoe({ brand: shoeBrand, model: shoeModel });
          setShoeBrand(""); setShoeModel("");
          setShowShoeForm(false);
          loadData();
      } catch (e) { alert("Gear registration failed."); }
  }

  const handleDeleteRun = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if(!confirm("Discard record?")) return;
      await api.running.delete(id);
      loadData();
  }

  const weeklyMileage = runs.filter(r => {
      const diff = (new Date().getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60 * 24);
      return diff < 7;
  }).reduce((acc, r) => acc + (r.distance_meters / 1000), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-12">
        <div className="space-y-6 flex-1">
            <div className="space-y-2">
                <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase text-glow">Cardio</h2>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Real-Time GPS Synchronization Engine</p>
            </div>
            <div className="max-w-md space-y-3">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Weekly Objective</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{weeklyMileage.toFixed(1)} / 40.0 <span className="text-[10px] text-neutral-600 not-italic uppercase">KM</span></p>
                </div>
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-1000" style={{ width: `${Math.min(100, (weeklyMileage/40)*100)}%` }}></div>
                </div>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
            <button onClick={() => setShowShoeForm(true)} className="bg-neutral-900 border border-white/5 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-neutral-800 transition-all italic">Gear</button>
            <button onClick={() => setShowManualForm(true)} className="bg-neutral-900 border border-white/5 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-neutral-800 transition-all italic">Manual</button>
            <button 
                onClick={startTracking}
                className="bg-white text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-neutral-200 transition-all active:scale-95 shadow-3xl shadow-white/10 italic flex items-center gap-3"
            >
                <Navigation size={16} className="fill-black" /> ACTIVATE_TRACE
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {runs.map(run => (
            <div key={run.id} onClick={() => navigate(`/log/run/${run.id}`)} className="group bg-neutral-900/20 border border-white/5 rounded-[3rem] overflow-hidden hover:bg-neutral-900/40 transition-all shadow-2xl flex flex-col lg:flex-row justify-between lg:items-center gap-10 cursor-pointer shadow-black text-left">
                <div className="flex flex-1 items-center gap-10 p-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-neutral-950 border border-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-xl overflow-hidden shrink-0">
                        <Footprints size={28} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-3">
                         <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter italic leading-none">{(run.distance_meters / 1000).toFixed(2)}</span>
                            <span className="text-xs font-black text-neutral-700 tracking-widest uppercase">KM</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black bg-white/5 border border-white/5 text-neutral-500 px-2 py-0.5 rounded uppercase">{run.run_type}</span>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} className="text-neutral-800" />
                                {new Date(run.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                         </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 lg:gap-16 px-10 lg:px-0">
                    <RunStat label="Time" value={`${Math.floor(run.duration_seconds / 60)}m`} unit={`${run.duration_seconds % 60}s`} />
                    <RunStat label="Pace" value={`${Math.floor((run.duration_seconds / (run.distance_meters / 1000 || 1)) / 60)}:${String(Math.floor((run.duration_seconds / (run.distance_meters / 1000 || 1)) % 60)).padStart(2, '0')}`} unit="/km" />
                    <RunStat label="Steps" value={run.steps || 0} unit="pts" />
                    <div className="flex items-center gap-4 lg:pr-10">
                        <button onClick={(e) => handleDeleteRun(e, run.id)} className="text-neutral-800 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                            <Trash2 size={20} />
                        </button>
                        <ChevronRight size={24} className="text-neutral-800 group-hover:text-white transition-all group-hover:translate-x-1" />
                    </div>
                </div>
            </div>
        ))}
      </div>

      <Modal isOpen={showLiveRun} onClose={() => { if(confirm("Abandon stream?")) { stopTracking(); setShowLiveRun(false); } }} title="Active Performance Protocol" maxWidth="max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 h-[70vh] lg:h-[65vh]">
              <div ref={mapContainer} className="lg:col-span-7 bg-black rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-inner h-full" />

              <div className="lg:col-span-5 flex flex-col justify-between space-y-8 px-4">
                  <div className="space-y-8">
                      <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Signal size={14} className={clsx(gpsAccuracy && gpsAccuracy < 15 ? "text-emerald-500" : "text-orange-500")} />
                              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">GPS_Precision</span>
                          </div>
                          <span className="text-xs font-bold font-mono">{gpsAccuracy ? `${gpsAccuracy}m` : "Acquiring..."}</span>
                      </div>

                      <div className="text-center md:text-left space-y-2">
                          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em]">Elapsed Time</p>
                          <p className="text-6xl md:text-8xl font-black text-white italic tracking-tighter tabular-nums text-glow">
                              {Math.floor(liveDuration / 60)}:{String(liveDuration % 60).padStart(2, '0')}
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                          <div className="space-y-2 text-center md:text-left">
                              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Distance (KM)</p>
                              <p className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{(liveDistance / 1000).toFixed(2)}</p>
                          </div>
                          <div className="space-y-2 text-center md:text-left">
                              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Steps</p>
                              <p className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{Math.floor(liveSteps/2)}</p>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <button onClick={saveLiveRun} className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm hover:bg-neutral-200 transition-all active:scale-95 shadow-3xl shadow-white/10 italic flex items-center justify-center gap-4 leading-none">
                          <Check size={20} strokeWidth={3} /> Terminate & Log
                      </button>
                      <button onClick={() => { stopTracking(); setShowLiveRun(false); }} className="text-neutral-600 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] transition-all italic text-center w-full">
                          Discard Data Stream
                      </button>
                  </div>
              </div>
          </div>
      </Modal>

      <Modal isOpen={showManualForm} onClose={() => setShowManualForm(false)} title="Manual Record Input" maxWidth="max-w-xl">
          <form onSubmit={handleManualSave} className="space-y-10 py-4">
              <div className="grid grid-cols-2 gap-6">
                  <FormInput label="Date" value={date} onChange={setDate} type="date" />
                  <FormInput label="Time" value={time} onChange={setTime} type="time" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <FormInput label="Distance (KM)" value={distance} onChange={setDistance} type="number" placeholder="0.00" />
                  <FormInput label="Duration (MIN)" value={duration} onChange={setDuration} type="number" placeholder="0.0" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormInput label="Elevation (M)" value={elevation} onChange={setElevation} type="number" placeholder="0" />
                  <FormInput label="BPM" value={avgHr} onChange={setAvgHr} type="number" placeholder="---" />
              </div>
              <div className="space-y-3 px-2">
                  <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2 leading-none">Activity Type</label>
                  <select value={runType} onChange={e => setRunType(e.target.value)} className="w-full bg-neutral-900 border border-white/5 text-white p-5 rounded-2xl focus:border-white outline-none font-bold italic appearance-none uppercase text-xs tracking-widest">
                      <option value="Run">Protocol: Run</option>
                      <option value="Race">Protocol: Race</option>
                      <option value="Long Run">Protocol: Long Run</option>
                      <option value="Recovery">Protocol: Recovery</option>
                  </select>
              </div>
              <div className="space-y-3 px-2">
                  <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2 leading-none">Hardware Selection</label>
                  <select value={selectedShoe} onChange={e => setSelectedShoe(e.target.value)} className="w-full bg-black border border-white/10 text-white p-5 rounded-2xl focus:border-white outline-none font-bold text-xs uppercase tracking-widest appearance-none">
                      <option value="">Default Unit</option>
                      {shoes.map(s => <option key={s.id} value={s.id}>{s.brand} {s.model}</option>)}
                  </select>
              </div>
              <div className="space-y-3 px-2">
                  <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2 leading-none">Notes</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-black border border-white/10 text-white p-5 rounded-2xl focus:border-white outline-none font-bold italic" placeholder="System notes..." />
              </div>
              <button type="submit" className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-neutral-200 shadow-3xl italic">Commit Record</button>
          </form>
      </Modal>

      <Modal isOpen={showShoeForm} onClose={() => setShowShoeForm(false)} title="Gear Management" maxWidth="max-w-md">
          <div className="space-y-10 py-4">
              <form onSubmit={handleSaveShoe} className="space-y-6">
                  <div className="space-y-4">
                      <FormInput label="Manufacturer" value={shoeBrand} onChange={setShoeBrand} placeholder="Brand" />
                      <FormInput label="Model Index" value={shoeModel} onChange={setShoeModel} placeholder="Model" />
                  </div>
                  <button type="submit" className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-neutral-200 transition-all italic shadow-2xl">Register Hardware</button>
              </form>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] ml-2">Inventory</h4>
                  <div className="space-y-2">
                      {shoes.map(s => (
                          <div key={s.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group">
                              <div className="space-y-1">
                                  <p className="font-black text-white uppercase italic tracking-tight">{s.brand}</p>
                                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{s.model}</p>
                              </div>
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">Active</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
}

function RunStat({ label, value, unit }: { label: string, value: string | number, unit: string }) {
    return (
        <div className="space-y-2 text-center md:text-left">
            <p className="text-[10px] font-black text-neutral-700 uppercase tracking-widest leading-none">{label}</p>
            <div className="flex items-baseline gap-1 leading-none">
                <span className="text-3xl font-black text-white tracking-tighter italic tabular-nums">{value}</span>
                <span className="text-[9px] font-black text-neutral-800 tracking-widest uppercase">{unit}</span>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
    return (
        <div className="space-y-2 px-2">
            <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2 leading-none">{label}</label>
            <input 
                type={type} 
                step="any"
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
                className="w-full bg-neutral-900 border border-white/5 text-white p-5 rounded-2xl focus:border-white outline-none font-black italic tracking-tight transition-all placeholder-neutral-900"
            />
        </div>
    );
}