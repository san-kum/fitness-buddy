import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Routine, WorkoutSession, Exercise } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, ChevronRight, Check, Trash2, LayoutGrid, Clock, Search, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export default function WorkoutLogger() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigate = useNavigate();
  
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
      const [s, r, e] = await Promise.all([
          api.resistance.listSessions(),
          api.resistance.listRoutines(),
          api.resistance.listExercises()
      ]);
      setSessions(s);
      setRoutines(r);
      setExercises(e);
  }

  const handleDeleteRoutine = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (!confirm("Delete routine?")) return;
      try {
          await api.resistance.deleteRoutine(id);
          loadData();
      } catch (e) {
          alert("Error deleting routine");
      }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (!confirm("Delete log?")) return;
      try {
          await api.resistance.deleteSession(id);
          loadData();
      } catch (e) {
          alert("Error deleting session");
      }
  };

  const startEmptySession = async () => {
    try {
      const s = await api.resistance.createSession({ notes: "Freestyle" });
      navigate(`/log/workout/${s.id}`);
    } catch (e) {
      alert("Error starting session");
    }
  };

  const startRoutine = async (routine: Routine) => {
      try {
          const s = await api.resistance.createSession({ notes: routine.name });
          if (routine.exercises) {
              for (const ex of routine.exercises) {
                 await api.resistance.addSet(s.id, {
                     exercise_id: ex.exercise_id,
                     weight_kg: 0,
                     reps: 0,
                     rpe: 0
                 });
              }
          }
          navigate(`/log/workout/${s.id}`);
      } catch (e) {
          alert("Error starting routine");
      }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.resistance.createRoutine({
              name: newRoutineName,
              exercise_ids: selectedExercises.map(e => e.id)
          });
          setShowCreateRoutine(false);
          setNewRoutineName("");
          setSelectedExercises([]);
          loadData();
      } catch (e) {
          alert("Error creating routine");
      }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h2 className="text-4xl font-bold tracking-tighter">Training</h2>
            <p className="text-neutral-500 text-sm mt-1">Manage protocols and log sessions.</p>
        </div>
        <button 
            onClick={startEmptySession}
            className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center transition-all interactive-scale shadow-2xl shadow-white/5 uppercase text-xs tracking-widest"
        >
            <Plus size={18} className="mr-2 stroke-[3px]" />
            Quick Start
        </button>
      </header>

      {/* Routines Section */}
      <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Routines</h3>
              <button 
                onClick={() => setShowCreateRoutine(true)} 
                className="text-[10px] font-bold text-white border border-white/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all tracking-widest uppercase"
              >
                  + New
              </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {routines.map(rt => (
                  <div key={rt.id} className="group bg-neutral-900/30 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all flex flex-col justify-between min-h-[180px]">
                      <div>
                          <div className="flex justify-between items-start mb-4">
                              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400">
                                  <LayoutGrid size={16} />
                              </div>
                              <button onClick={(e) => handleDeleteRoutine(e, rt.id)} className="text-neutral-700 hover:text-red-500 transition-all p-1 opacity-0 group-hover:opacity-100">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                          <h4 className="font-bold text-xl tracking-tight mb-2 uppercase italic">{rt.name}</h4>
                          <div className="flex flex-wrap gap-1.5">
                              {rt.exercises?.slice(0, 3).map(e => (
                                  <span key={e.id} className="text-[9px] font-bold uppercase text-neutral-500 bg-white/5 px-2 py-1 rounded-md">{e.exercise_name}</span>
                              ))}
                              {(rt.exercises?.length || 0) > 3 && <span className="text-[9px] font-bold text-neutral-700 uppercase self-center px-1">+{((rt.exercises?.length || 0) - 3)}</span>}
                          </div>
                      </div>
                      <button onClick={() => startRoutine(rt)} className="mt-6 w-full bg-neutral-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                          <Play size={12} fill="currentColor" /> Start
                      </button>
                  </div>
              ))}
              {routines.length === 0 && (
                  <div className="col-span-full py-12 border border-dashed border-white/5 rounded-[2rem] text-center">
                      <p className="text-neutral-700 text-xs font-bold uppercase tracking-widest">No protocols defined.</p>
                  </div>
              )}
          </div>
      </section>

      {/* History */}
      <section className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 px-2">History</h3>
        <div className="grid grid-cols-1 gap-3">
            {sessions.map(s => (
            <div key={s.id} onClick={() => navigate(`/log/workout/${s.id}`)} className="group bg-neutral-900/20 border border-white/5 p-5 rounded-[1.5rem] hover:bg-neutral-900/40 transition-all cursor-pointer flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center justify-center min-w-[48px] h-[48px] rounded-xl bg-neutral-900 border border-white/5 font-bold group-hover:bg-white group-hover:text-black transition-all">
                        <span className="text-[8px] text-neutral-500 group-hover:text-neutral-400 uppercase leading-none mb-0.5">{new Date(s.start_time).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg leading-none">{new Date(s.start_time).getDate()}</span>
                    </div>
                    <div>
                        <div className="font-bold text-base text-white italic uppercase tracking-tight">
                            {s.notes || "Workout"}
                        </div>
                        <div className="flex items-center gap-3 text-neutral-600 text-[9px] font-bold uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1"><Clock size={10}/> {new Date(s.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                            <span>{s.sets?.length || 0} Sets</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={(e) => handleDeleteSession(e, s.id)} className="text-neutral-800 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-2">
                        <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-all" />
                </div>
            </div> 
            ))}
        </div>
      </section>

      {/* Routine Creation Modal */}
      <Modal 
        isOpen={showCreateRoutine} 
        onClose={() => setShowCreateRoutine(false)} 
        title="Create Protocol"
        maxWidth="max-w-xl"
      >
          <form onSubmit={handleCreateRoutine} className="space-y-8">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Protocol Designation</label>
                  <input 
                    type="text" 
                    placeholder="Routine Name"
                    value={newRoutineName} 
                    onChange={e => setNewRoutineName(e.target.value)} 
                    className="w-full bg-black border border-white/10 text-white px-5 py-4 rounded-2xl focus:border-white outline-none font-bold text-lg" 
                    required 
                  />
              </div>
              
              <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Hardware Library</label>
                  <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={exerciseSearch}
                        onChange={e => setExerciseSearch(e.target.value)}
                        className="w-full bg-black border border-white/5 text-white pl-10 pr-4 py-4 rounded-xl focus:border-white/20 outline-none text-sm font-bold italic" 
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700" size={16} />
                  </div>
                  <div className="h-56 overflow-y-auto bg-black/50 rounded-[1.5rem] p-2 space-y-1 border border-white/[0.03] no-scrollbar">
                      {exercises
                        .filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                        .map(ex => {
                          const isSelected = selectedExercises.find(e => e.id === ex.id);
                          return (
                            <div 
                              key={ex.id} 
                              onClick={() => {
                                  if (isSelected) setSelectedExercises(prev => prev.filter(e => e.id !== ex.id));
                                  else setSelectedExercises(prev => [...prev, ex]);
                              }}
                              className={clsx(
                                "cursor-pointer px-4 py-3 rounded-xl text-sm flex justify-between items-center transition-all",
                                isSelected ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                              )}
                            >
                                <span className="uppercase text-xs font-bold">{ex.name}</span>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          );
                        })}
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Protocol Queue ({selectedExercises.length})</label>
                  <div className="flex flex-wrap gap-2">
                      {selectedExercises.map(ex => (
                          <span key={ex.id} className="text-[9px] font-bold uppercase tracking-widest bg-white text-black px-3 py-1.5 rounded-full flex items-center gap-2 italic">
                              {ex.name}
                              <button type="button" onClick={() => setSelectedExercises(prev => prev.filter(e => e.id !== ex.id))}><X size={10} strokeWidth={3}/></button>
                          </span>
                      ))}
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={!newRoutineName || selectedExercises.length === 0}
                className="w-full bg-white text-black py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-10 shadow-xl"
              >
                  Save Protocol
              </button>
          </form>
      </Modal>
    </div>
  );
}
