import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Exercise, WorkoutSet, WorkoutSession } from '../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, MoreHorizontal, Plus, Zap, Search, Save } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startTimer, stopTimer } = useTimer();
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showFinish, setShowFinish] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
      const interval = setInterval(() => {
          if (session?.start_time) {
              const start = new Date(session.start_time).getTime();
              const now = Date.now();
              const diff = Math.floor((now - start) / 1000);
              const mins = Math.floor(diff / 60);
              const secs = diff % 60;
              setElapsedTime(`${mins}:${secs.toString().padStart(2, '0')}`);
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [session]);

  async function loadData() {
    const [exs, sessions] = await Promise.all([
        api.resistance.listExercises(),
        api.resistance.listSessions()
    ]);
    setExercises(exs);
    if (id) {
        const s = sessions.find(s => s.id === parseInt(id));
        if (s) {
            setSession(s);
            if (s.sets) setSessionSets(s.sets);
        }
    }
  }

  const handleAddSet = async (exerciseId: number, weight = 0, reps = 0, rpe = 0) => {
      if (!id) return;
      try {
          const newSet = await api.resistance.addSet(parseInt(id), {
              exercise_id: exerciseId,
              weight_kg: weight,
              reps: reps,
              rpe: rpe
          });
          const ex = exercises.find(e => e.id === exerciseId);
          newSet.exercise_name = ex?.name || "Unknown";
          setSessionSets(prev => [...prev, newSet]);
      } catch (e) {
          alert("Error adding set");
      }
  };

  const handleAddExercise = async (ex: Exercise) => {
      await handleAddSet(ex.id, 0, 0, 0);
      setShowAddExercise(false);
      setExerciseSearch("");
  };
  
  const handleUpdateSet = (set: WorkoutSet, changes: Partial<WorkoutSet>) => {
       const updated = { ...set, ...changes };
       setSessionSets(prev => prev.map(s => s.id === set.id ? updated : s));
  }

  const handleSaveSet = async (set: WorkoutSet) => {
      try {
          await api.resistance.updateSet(set.id, {
              weight_kg: set.weight_kg,
              reps: set.reps,
              rpe: set.rpe
          });
          stopTimer(); 
          startTimer(30); 
      } catch (e) {
          console.error(e);
      }
  }

  const handleDeleteSet = async (setId: number) => {
      if(!confirm("Delete set?")) return;
      try {
          await api.resistance.deleteSet(setId);
          setSessionSets(prev => prev.filter(s => s.id !== setId));
      } catch (e) {
          alert("Error deleting set");
      }
  }

  const finishSession = async () => {
    if (!id) return;
    try {
        await api.resistance.finishSession(parseInt(id), new Date().toISOString());
        stopTimer();
        navigate('/log/workout');
    } catch (e) {
        stopTimer();
        navigate('/log/workout');
    }
  };
  
  const groupedSets: { exerciseName: string; exerciseId: number; sets: WorkoutSet[] }[] = [];
  sessionSets.forEach(set => {
      const lastGroup = groupedSets[groupedSets.length - 1];
      if (lastGroup && lastGroup.exerciseId === set.exercise_id) {
          lastGroup.sets.push(set);
      } else {
          groupedSets.push({
              exerciseName: set.exercise_name || "Unknown",
              exerciseId: set.exercise_id,
              sets: [set]
          });
      }
  });

  const totalVolume = sessionSets.reduce((acc, s) => acc + (s.weight_kg * s.reps), 0);
  const totalSets = sessionSets.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-48 animate-fade-in">
      <header className="fixed top-0 left-0 right-0 md:relative md:top-auto bg-black/80 backdrop-blur-xl border-b border-white/5 md:bg-transparent md:border-none md:backdrop-blur-none z-[100] px-6 py-4 md:px-0 md:py-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
             <button onClick={() => navigate('/log/workout')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-neutral-400 hover:text-white"><ArrowLeft size={18}/></button>
             <div>
                 <h2 className="text-base font-bold tracking-tight text-white uppercase italic">{session?.notes || "Training"}</h2>
                 <div className="text-[9px] text-emerald-500 font-bold flex items-center tracking-widest uppercase">
                     <div className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
                     {elapsedTime}
                 </div>
             </div>
        </div>
        <button 
            onClick={() => setShowFinish(true)}
            className="bg-white text-black px-5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
        >
            Finish
        </button>
      </header>

      <div className="h-12 md:hidden"></div>

      <div className="space-y-8">
          {groupedSets.map((group, groupIdx) => (
              <div key={groupIdx} className="bg-neutral-900/30 border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-white/[0.03] bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                          <Zap size={14} className="text-neutral-500" />
                          <h3 className="font-bold text-base tracking-tight text-white uppercase italic">{group.exerciseName}</h3>
                      </div>
                      <button className="text-neutral-700 hover:text-white transition-colors p-1"><MoreHorizontal size={16}/></button>
                  </div>
                  <div className="p-4 space-y-1">
                      <div className="grid grid-cols-12 text-[9px] uppercase text-neutral-600 font-bold px-2 mb-2 text-center tracking-widest">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Mass</div>
                          <div className="col-span-4">Reps</div>
                          <div className="col-span-1">RPE</div>
                          <div className="col-span-2"></div>
                      </div>
                      <div className="space-y-1">
                        {group.sets.map((set, setIdx) => (
                            <SetRow 
                                key={set.id} 
                                set={set} 
                                index={setIdx + 1} 
                                onChange={(changes) => handleUpdateSet(set, changes)}
                                onSave={() => handleSaveSet(set)}
                                onDelete={() => handleDeleteSet(set.id)}
                            />
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                            const lastSet = group.sets[group.sets.length - 1];
                            handleAddSet(group.exerciseId, lastSet.weight_kg, lastSet.reps, lastSet.rpe || 0);
                        }}
                        className="w-full py-3 mt-4 text-[9px] font-bold text-neutral-500 hover:text-white bg-white/[0.02] transition-all uppercase tracking-widest rounded-xl border border-dashed border-white/5"
                      >
                          Add Set
                      </button>
                  </div>
              </div>
          ))}
          
          <button 
            onClick={() => setShowAddExercise(true)}
            className="w-full py-6 border-2 border-dashed border-white/5 text-neutral-500 hover:text-white hover:border-white/10 hover:bg-neutral-900/40 transition-all text-[10px] font-bold uppercase tracking-widest rounded-[1.5rem] flex flex-col items-center gap-2"
          >
              <Plus size={20} />
              Add Exercise
          </button>
      </div>

      {/* Add Exercise Modal */}
      <Modal 
        isOpen={showAddExercise} 
        onClose={() => setShowAddExercise(false)} 
        title="Hardware Catalog"
        maxWidth="max-w-xl"
      >
          <div className="space-y-6">
              <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search Protocols..." 
                    autoFocus
                    value={exerciseSearch}
                    onChange={e => setExerciseSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white px-5 py-3 text-base focus:border-white outline-none rounded-xl placeholder-neutral-700 font-bold italic" 
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" size={18} />
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {exercises
                    .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                    .map(ex => (
                        <button 
                            key={ex.id}
                            onClick={() => handleAddExercise(ex)}
                            className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 transition-all group flex justify-between items-center"
                        >
                            <span className="font-bold text-base text-neutral-300 group-hover:text-white uppercase italic">{ex.name}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 border border-white/5 px-2 py-0.5 rounded-md">{ex.category}</span>
                        </button>
                    ))}
              </div>
          </div>
      </Modal>

      {/* Finish Summary Modal */}
      <Modal 
        isOpen={showFinish} 
        onClose={() => setShowFinish(false)} 
        title="Session Summary"
        maxWidth="max-w-md"
      >
          <div className="space-y-10 py-4">
              <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-8">
                  <div className="text-center">
                      <div className="text-xl font-bold font-mono text-white tracking-tighter italic">{elapsedTime}</div>
                      <div className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mt-1">Duration</div>
                  </div>
                  <div className="text-center">
                      <div className="text-xl font-bold font-mono text-white tracking-tighter italic">{totalVolume.toLocaleString()}</div>
                      <div className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mt-1">Volume (kg)</div>
                  </div>
                  <div className="text-center">
                      <div className="text-xl font-bold font-mono text-white tracking-tighter italic">{totalSets}</div>
                      <div className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mt-1">Sets</div>
                  </div>
              </div>

              <div className="space-y-3">
                  <button onClick={finishSession} className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl italic flex items-center justify-center gap-3">
                      <Save size={14} strokeWidth={3} /> Commit Session
                  </button>
                  <button onClick={() => setShowFinish(false)} className="w-full text-neutral-500 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors py-2">
                      Back to log
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
}

function SetRow({ set, index, onChange, onSave, onDelete }: { 
    set: WorkoutSet, 
    index: number, 
    onChange: (c: Partial<WorkoutSet>) => void,
    onSave: () => void,
    onDelete: () => void
}) {
    const [weight, setWeight] = useState(set.weight_kg.toString());
    const [reps, setReps] = useState(set.reps.toString());
    const [rpe, setRpe] = useState(set.rpe?.toString() || "");
    const [done, setDone] = useState(false);

    const handleBlur = () => {
        onChange({
            weight_kg: parseFloat(weight) || 0,
            reps: parseInt(reps) || 0,
            rpe: parseFloat(rpe) || undefined
        });
    };

    const handleCheck = () => {
        const newDone = !done;
        setDone(newDone);
        if (newDone) {
            handleBlur();
            onSave();
        }
    };

    return (
        <div className={clsx(
            "grid grid-cols-12 gap-2 items-center transition-all duration-500 p-1.5 rounded-xl border border-transparent",
            done ? "opacity-30 grayscale-[0.5] bg-white/[0.01]" : "hover:bg-white/[0.02]"
        )}>
            <div className="col-span-1 flex justify-center">
                <div 
                    className="w-7 h-7 rounded-lg bg-neutral-900 border border-white/5 text-neutral-600 font-bold text-[9px] flex items-center justify-center cursor-pointer hover:bg-red-500/10 hover:text-red-500 transition-all" 
                    onDoubleClick={onDelete}
                >
                    {String(index).padStart(2, '0')}
                </div>
            </div>
            <div className="col-span-4 px-1">
                <input 
                    type="number" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="0"
                    className="w-full bg-transparent text-white text-center py-2.5 text-base font-bold font-mono outline-none"
                    onClick={e => (e.target as HTMLInputElement).select()}
                />
            </div>
            <div className="col-span-4 px-1">
                <input 
                    type="number" 
                    value={reps} 
                    onChange={e => setReps(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="0"
                    className="w-full bg-transparent text-white text-center py-2.5 text-base font-bold font-mono outline-none"
                    onClick={e => (e.target as HTMLInputElement).select()}
                />
            </div>
             <div className="col-span-1">
                <input 
                    type="number" 
                    value={rpe} 
                    placeholder="-"
                    onChange={e => setRpe(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent text-neutral-600 text-center py-1 text-xs font-mono outline-none focus:text-white"
                />
            </div>
            <div className="col-span-2 pl-2">
                <button 
                    onClick={handleCheck}
                    className={clsx(
                        "w-full h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg",
                        done 
                            ? "bg-emerald-500 text-black shadow-emerald-500/20" 
                            : "bg-neutral-800 text-neutral-500 hover:bg-white hover:text-black active:scale-95"
                    )}
                >
                    <Check size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}