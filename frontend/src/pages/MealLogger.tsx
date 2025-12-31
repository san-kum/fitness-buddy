import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Meal, User, FoodLibraryItem, DailySummary } from '../lib/api';
import { Plus, ChevronDown, X, Apple, Search, Save, Trash2, Edit2, Check, Target, Droplets } from 'lucide-react';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export default function MealLogger() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [library, setLibrary] = useState<FoodLibraryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DailySummary | null>(null);
  
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [mealsData, userData, libData, summaries] = await Promise.all([
          api.nutrition.listMeals(),
          api.identity.get(),
          api.nutrition.listLibrary(),
          api.analytics.daily(today, today)
      ]);
      setMeals(mealsData);
      setUser(userData);
      setLibrary(libData);
      if (summaries.length > 0) setStats(summaries[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleLogWater = async (amount: number) => {
      try {
          await api.nutrition.logWater(amount);
          loadData();
      } catch (e) {
          console.error(e);
      }
  }

  const handleDeleteMeal = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (!confirm("Discard this meal log?")) return;
      try {
          await api.nutrition.deleteMeal(id);
          loadData();
      } catch (e) {
          alert("Error: Record discard failed.");
      }
  };

  const calculateTarget = () => {
      if (!user || !stats || !user.height_cm || !user.dob) return 2000;
      const weight = stats.weight_kg || 70;
      const height = user.height_cm;
      const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      if (user.sex === 'M') bmr += 5;
      else bmr -= 161;
      const factors: any = { 'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725, 'Extra Active': 1.9 };
      const factor = factors[user.activity_level || 'Sedentary'] || 1.2;
      const maintenance = bmr * factor;
      const offsets: any = { 'Lose Weight': -500, 'Maintain': 0, 'Gain Weight': 500 };
      const offset = offsets[user.weight_goal || 'Maintain'] || 0;
      return Math.round(maintenance + offset);
  };

  const targetCals = calculateTarget();
  const totalEaten = meals.reduce((acc, meal) => acc + (meal.entries?.reduce((sum, entry) => sum + entry.calories, 0) || 0), 0);
  const burned = stats?.exercise_calories || 0;
  const remaining = targetCals - totalEaten + burned;

  async function createMeal(e: React.FormEvent) {
    e.preventDefault();
    try {
        await api.nutrition.createMeal({
            name: mealName,
            eaten_at: new Date().toISOString()
        });
        setMealName("");
        setShowMealForm(false);
        loadData();
    } catch(e) {
        alert("Macro record failure");
    }
  }

  if (loading) return <div className="p-12 text-center text-neutral-500 font-bold uppercase tracking-widest animate-pulse text-[10px]">Syncing Data</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 pb-32 animate-fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
           {/* Sidebar: Now appears first on mobile */}
           <div className="lg:col-span-4 order-first lg:order-last">
                <div className="lg:sticky lg:top-24 space-y-6 md:space-y-8">
                    <div className="p-8 md:p-10 bg-neutral-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Remaining</p>
                            <p className={clsx("text-6xl md:text-7xl font-black tracking-tighter italic tabular-nums", remaining < 0 ? "text-red-500" : "text-white")}>
                                {remaining}
                            </p>
                            <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest mt-2">Net Calories</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-8">
                            <SummaryMiniStat label="Goal" value={targetCals} />
                            <SummaryMiniStat label="Food" value={totalEaten} />
                            <SummaryMiniStat label="Exercise" value={burned} highlight />
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3">
                            <Target size={14} className="text-neutral-500" />
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{user?.weight_goal || "MAINTAIN"} MODE</span>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 bg-neutral-900/40 border border-white/5 rounded-[3rem] space-y-6 shadow-xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Droplets className="text-blue-500" size={20} />
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Hydration</h3>
                            </div>
                            <span className="text-lg font-bold font-mono">{stats?.water_ml || 0} <span className="text-[10px] text-neutral-600">ML</span></span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[250, 500, 1000].map(amount => (
                                <button 
                                    key={amount}
                                    onClick={() => handleLogWater(amount)}
                                    className="bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 border border-white/5 py-3 rounded-xl text-[10px] font-black transition-all active:scale-90"
                                >
                                    +{amount}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
           </div>

           <div className="lg:col-span-8 space-y-10">
                <header className="flex justify-between items-center gap-4">
                    <h2 className="text-4xl font-bold tracking-tight italic uppercase">Nutrition</h2>
                    <button 
                        onClick={() => setShowMealForm(true)}
                        className="bg-white text-black px-6 py-2.5 rounded-xl font-bold flex items-center transition-all active:scale-95 shadow-lg shadow-white/5 uppercase text-xs"
                    >
                        <Plus size={16} className="mr-2 stroke-[3px]" />
                        New Meal
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {meals.map(meal => (
                        <MealCard 
                            key={meal.id} 
                            meal={meal} 
                            library={library}
                            expanded={expandedMealId === meal.id}
                            onToggle={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
                            onUpdate={loadData}
                            onDeleteMeal={(e) => handleDeleteMeal(e, meal.id)}
                        />
                    ))}
                </div>
           </div>
       </div>

       <Modal 
        isOpen={showMealForm} 
        onClose={() => setShowMealForm(false)} 
        title="Initialize Meal"
        maxWidth="max-w-md"
       >
           <form onSubmit={createMeal} className="space-y-6">
               <input 
                    type="text" 
                    placeholder="MEAL_DESIGNATION" 
                    value={mealName}
                    onChange={e => setMealName(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white px-6 py-4 rounded-2xl text-xl font-bold italic focus:border-white outline-none"
                    autoFocus
                    required
               />
               <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90">Confirm</button>
           </form>
       </Modal>
    </div>
  );
}

function SummaryMiniStat({ label, value, highlight }: { label: string, value: number, highlight?: boolean }) {
    return (
        <div className="text-center">
            <p className="text-[10px] font-bold text-white font-mono">{value}</p>
            <p className={clsx("text-[7px] uppercase tracking-widest font-black mt-1", highlight ? "text-emerald-500" : "text-neutral-600")}>{label}</p>
        </div>
    );
}

function MealCard({ meal, library, expanded, onToggle, onUpdate, onDeleteMeal }: { 
    meal: Meal, 
    library: FoodLibraryItem[], 
    expanded: boolean, 
    onToggle: () => void, 
    onUpdate: () => void,
    onDeleteMeal: (e: React.MouseEvent) => void
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(meal.name || "");
    const [search, setSearch] = useState("");
    const [amount, setAmount] = useState("100");
    const [customItem, setCustomItem] = useState<{name: string, cals: string, p: string, c: string, f: string} | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);

    const totalCals = meal.entries?.reduce((acc, curr) => acc + curr.calories, 0) || 0;
    const filteredLibrary = library.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    async function addFromLibrary(item: FoodLibraryItem) {
        const factor = parseFloat(amount) / 100;
        try {
            await api.nutrition.addEntry(meal.id, {
                name: `${item.name} (${amount}g)`,
                calories: Math.round(item.calories_per_100g * factor),
                protein_g: Math.round(item.protein_per_100g * factor * 10) / 10,
                carbs_g: Math.round(item.carbs_per_100g * factor * 10) / 10,
                fat_g: Math.round(item.fat_per_100g * factor * 10) / 10,
                quantity: `${amount}g`
            });
            setSearch("");
            setShowLibrary(false);
            onUpdate();
        } catch (e) {
            alert("Entry failure");
        }
    }

    async function addCustom(e: React.FormEvent) {
        e.preventDefault();
        if (!customItem) return;
        try {
            await api.nutrition.addEntry(meal.id, {
                name: customItem.name,
                calories: parseInt(customItem.cals) || 0,
                protein_g: parseFloat(customItem.p) || 0,
                carbs_g: parseFloat(customItem.c) || 0,
                fat_g: parseFloat(customItem.f) || 0,
            });
            if (confirm("Sync to master library?")) {
                await api.nutrition.createLibraryItem({
                    name: customItem.name,
                    calories_per_100g: parseInt(customItem.cals),
                    protein_per_100g: parseFloat(customItem.p),
                    carbs_per_100g: parseFloat(customItem.c),
                    fat_per_100g: parseFloat(customItem.f),
                });
            }
            setCustomItem(null);
            onUpdate();
        } catch (e) {
            alert("Entry failure");
        }
    }

    const handleDeleteEntry = async (id: number) => {
        if (!confirm("Discard data?")) return;
        try {
            await api.nutrition.deleteEntry(id);
            onUpdate();
        } catch (e) {
            alert("Error: Record discard failed");
        }
    };

    const handleUpdateMealName = async () => {
        try {
            await api.nutrition.updateMeal(meal.id, editName);
            setIsEditing(false);
            onUpdate();
        } catch (e) {
            alert("Error: Update failure");
        }
    };

    return (
        <div className={clsx(
            "group bg-neutral-900/20 border border-white/[0.03] rounded-[2.5rem] transition-all duration-500 overflow-hidden shadow-sm", 
            expanded ? "border-white/10 bg-neutral-900/50 shadow-xl" : "hover:border-white/10"
        )}>
            <div className="p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-6">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        expanded ? "bg-white text-black scale-110 rotate-12 shadow-xl" : "bg-neutral-950 text-neutral-700 group-hover:bg-neutral-800 group-hover:text-white group-hover:rotate-6"
                    )}>
                        <Apple size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        value={editName} 
                                        onChange={e => setEditName(e.target.value)}
                                        className="bg-black border border-white/20 text-white px-3 py-1 rounded-xl text-xl font-bold italic outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateMealName} className="text-emerald-500"><Check size={18} strokeWidth={3}/></button>
                                    <button onClick={() => setIsEditing(false)} className="text-red-500"><X size={18} strokeWidth={3}/></button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-white italic uppercase">{meal.name || "UNNAMED_ENTRY"}</div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-neutral-700 hover:text-white p-1">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={onDeleteMeal} className="text-neutral-700 hover:text-red-500 p-1">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="text-[9px] font-bold text-neutral-600 mt-1 uppercase tracking-widest">
                            {meal.entries?.length || 0} Data Points Logged
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-1 leading-none">Net_KCAL</p>
                        <p className="text-2xl font-bold text-white italic leading-none">{totalCals}</p>
                    </div>
                    <div className={clsx("w-9 h-9 rounded-full border border-white/5 flex items-center justify-center transition-all duration-500", expanded ? "rotate-180 bg-white text-black border-transparent shadow-lg" : "bg-neutral-900")}>
                        <ChevronDown size={20} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-8 pb-8 space-y-10 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        {meal.entries?.map(entry => (
                            <div key={entry.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/[0.03] hover:border-white/10 transition-all group/item shadow-xl">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-neutral-200 uppercase tracking-tight italic group-hover/item:text-white">{entry.name}</span>
                                        <button onClick={() => handleDeleteEntry(entry.id)} className="text-neutral-800 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                        <span className="text-emerald-500/80">{entry.protein_g}P</span>
                                        <span className="text-blue-500/80">{entry.carbs_g}C</span>
                                        <span className="text-orange-500/80">{entry.fat_g}F</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold font-mono text-xl text-white italic">{entry.calories}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => setShowLibrary(true)} className="flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-all shadow-xl italic">
                            <Search size={16} strokeWidth={3} /> Hardware Index
                        </button>
                        <button onClick={() => setCustomItem({name: "", cals: "", p: "", c: "", f: ""})} className="flex items-center justify-center gap-3 bg-neutral-900 border border-white/5 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all italic">
                            <Plus size={16} strokeWidth={3} /> Custom Entry
                        </button>
                    </div>

                    <Modal 
                        isOpen={showLibrary} 
                        onClose={() => setShowLibrary(false)} 
                        title="Search Index"
                        maxWidth="max-w-xl"
                    >
                        <div className="space-y-8">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="SEARCH_HARDWARE..." 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        className="w-full bg-black border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl focus:border-white outline-none font-bold italic"
                                        autoFocus
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={20} />
                                </div>
                                <div className="w-28 relative">
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        className="w-full h-full bg-black border border-white/10 text-white px-4 py-4 rounded-2xl focus:border-white outline-none font-bold text-center font-mono"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-neutral-800 uppercase">G</span>
                                </div>
                            </div>
                            <div className="space-y-1 max-h-[40vh] overflow-y-auto no-scrollbar">
                                {filteredLibrary.map(item => (
                                    <button key={item.id} onClick={() => addFromLibrary(item)} className="w-full flex justify-between items-center p-6 bg-white/[0.02] rounded-2xl border border-transparent hover:border-white/10 hover:bg-white transition-all group/lib text-left">
                                        <div className="space-y-1">
                                            <p className="font-bold text-lg text-white group-hover/lib:text-black uppercase tracking-tight italic">{item.name}</p>
                                            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest group-hover/lib:text-neutral-500">{item.calories_per_100g} kcal / 100g</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white group-hover/lib:text-black italic tracking-tighter tabular-nums">
                                                {Math.round(item.calories_per_100g * (parseFloat(amount)/100))}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={!!customItem}
                        onClose={() => setCustomItem(null)}
                        title="Manual Input"
                        maxWidth="max-w-md"
                    >
                        {customItem && (
                            <form onSubmit={addCustom} className="space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Label</p>
                                        <input type="text" value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="w-full bg-black border border-white/10 text-white px-6 py-4 rounded-xl text-lg font-bold italic focus:border-white outline-none" placeholder="UNNAMED_OBJECT" required />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Energy (kcal)</p>
                                        <input type="number" value={customItem.cals} onChange={e => setCustomItem({...customItem, cals: e.target.value})} className="w-full bg-black border border-white/10 text-white px-6 py-4 rounded-xl text-xl font-bold font-mono focus:border-white outline-none" placeholder="0000" required />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <MacroInput label="Pro" value={customItem.p} onChange={v => setCustomItem({...customItem, p: v})} />
                                        <MacroInput label="Carb" value={customItem.c} onChange={v => setCustomItem({...customItem, c: v})} />
                                        <MacroInput label="Lipid" value={customItem.f} onChange={v => setCustomItem({...customItem, f: v})} />
                                    </div>
                                    <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-all italic flex items-center justify-center gap-2">
                                        <Save size={14} strokeWidth={3}/> Commit Protocol
                                    </button>
                                </div>
                            </form>
                        )}
                    </Modal>
                </div>
            )}
        </div>
    );
}

function MacroInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-bold text-neutral-700 text-center uppercase tracking-widest">{label}</p>
            <input type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black border border-white/5 text-white p-4 rounded-xl text-base focus:border-white text-center font-bold font-mono outline-none" placeholder="--" />
        </div>
    );
}
