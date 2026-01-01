import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Meal, User, FoodLibraryItem, DailySummary } from '../lib/api';
import { Plus, ChevronDown, X, Apple, Search, Save, Trash2, Edit2, Check, Droplets } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { SwipeableRow } from '../components/SwipeableRow';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
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

    const { showToast } = useToast();

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
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    }

    const handleLogWater = async (amount: number) => {
        try {
            await api.nutrition.logWater(amount);
            showToast(`Added ${amount}ml water`, "success");
            loadData();
        } catch (e) {
            showToast("Failed to log water", "error");
        }
    };

    const handleDeleteMeal = async (id: number) => {
        try {
            await api.nutrition.deleteMeal(id);
            showToast("Meal deleted", "success");
            loadData();
        } catch (e) {
            showToast("Failed to delete meal", "error");
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
        const factors: Record<string, number> = { 'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725, 'Extra Active': 1.9 };
        const factor = factors[user.activity_level || 'Sedentary'] || 1.2;
        const maintenance = bmr * factor;
        const offsets: Record<string, number> = { 'Lose Weight': -500, 'Maintain': 0, 'Gain Weight': 500 };
        const offset = offsets[user.weight_goal || 'Maintain'] || 0;
        return Math.round(maintenance + offset);
    };

    const targetCals = calculateTarget();
    const totalEaten = meals.reduce((acc, meal) => acc + (meal.entries?.reduce((sum, entry) => sum + entry.calories, 0) || 0), 0);
    const burned = stats?.exercise_calories || 0;
    const remaining = targetCals - totalEaten + burned;
    const calorieProgress = (totalEaten / targetCals) * 100;
    const waterProgress = ((stats?.water_ml || 0) / 3000) * 100;

    async function createMeal(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.nutrition.createMeal({
                name: mealName,
                eaten_at: new Date().toISOString()
            });
            setMealName("");
            setShowMealForm(false);
            showToast("Meal created", "success");
            loadData();
        } catch (e) {
            showToast("Failed to create meal", "error");
        }
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 order-first lg:order-last">
                        <Skeleton variant="card" height={320} />
                    </div>
                    <div className="lg:col-span-8 space-y-4">
                        <Skeleton variant="rectangular" height={48} width="40%" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="card" height={100} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-32 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                {/* Sidebar Stats */}
                <div className="lg:col-span-4 order-first lg:order-last">
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {/* Hero Calorie Card */}
                        <Card variant="gradient" padding="lg" className="text-center space-y-6">
                            <div className="flex justify-center">
                                <ProgressRing
                                    progress={calorieProgress}
                                    size={160}
                                    strokeWidth={12}
                                    color={remaining < 0 ? 'red' : calorieProgress > 90 ? 'orange' : 'green'}
                                    value={remaining}
                                    unit="remaining"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                <StatMini label="Goal" value={targetCals} />
                                <StatMini label="Food" value={totalEaten} />
                                <StatMini label="Burned" value={burned} highlight />
                            </div>

                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                                    {user?.weight_goal || "Maintain"} Mode
                                </span>
                            </div>
                        </Card>

                        {/* Hydration Card */}
                        <Card variant="default" className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Droplets className="text-blue-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Hydration</h3>
                                        <p className="text-xs text-neutral-500">{stats?.water_ml || 0}ml / 3000ml</p>
                                    </div>
                                </div>
                                <ProgressRing progress={waterProgress} size={40} strokeWidth={4} color="blue" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[250, 500, 1000].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => handleLogWater(amount)}
                                        className="btn-secondary text-xs py-3 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400"
                                    >
                                        +{amount}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    <header className="flex justify-between items-center gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Nutrition</h2>
                        <button
                            onClick={() => setShowMealForm(true)}
                            className="btn-primary text-xs uppercase tracking-wider"
                        >
                            <Plus size={18} strokeWidth={3} />
                            New Meal
                        </button>
                    </header>

                    {/* Meals List */}
                    <div className="space-y-4">
                        {meals.map((meal, index) => (
                            <div
                                key={meal.id}
                                className={clsx("opacity-0 animate-fade-in-up", `stagger-${Math.min(index + 1, 5)}`)}
                            >
                                <MealCard
                                    meal={meal}
                                    library={library}
                                    expanded={expandedMealId === meal.id}
                                    onToggle={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
                                    onUpdate={loadData}
                                    onDelete={() => handleDeleteMeal(meal.id)}
                                />
                            </div>
                        ))}

                        {meals.length === 0 && (
                            <Card variant="default" className="p-12 text-center border-dashed">
                                <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                                    <Apple size={32} className="text-neutral-600" />
                                </div>
                                <h4 className="font-bold text-lg mb-2">No meals logged today</h4>
                                <p className="text-neutral-500 text-sm mb-6">Start tracking your nutrition</p>
                                <button onClick={() => setShowMealForm(true)} className="btn-primary inline-flex">
                                    <Plus size={18} />
                                    Add First Meal
                                </button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* New Meal Modal */}
            <Modal
                isOpen={showMealForm}
                onClose={() => setShowMealForm(false)}
                title="New Meal"
            >
                <form onSubmit={createMeal} className="space-y-6">
                    <input
                        type="text"
                        placeholder="Breakfast, Lunch, Dinner..."
                        value={mealName}
                        onChange={e => setMealName(e.target.value)}
                        className="input-lg"
                        autoFocus
                        required
                    />
                    <button type="submit" className="btn-primary w-full uppercase tracking-wider text-xs">
                        Create Meal
                    </button>
                </form>
            </Modal>
        </div>
    );
}

function StatMini({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className="text-center">
            <p className="text-lg font-bold tabular-nums">{value}</p>
            <p className={clsx("text-[9px] uppercase tracking-widest font-bold", highlight ? "text-emerald-500" : "text-neutral-600")}>{label}</p>
        </div>
    );
}

function MealCard({
    meal,
    library,
    expanded,
    onToggle,
    onUpdate,
    onDelete,
}: {
    meal: Meal;
    library: FoodLibraryItem[];
    expanded: boolean;
    onToggle: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(meal.name || "");
    const [search, setSearch] = useState("");
    const [amount, setAmount] = useState("100");
    const [customItem, setCustomItem] = useState<{ name: string; cals: string; p: string; c: string; f: string } | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);

    const { showToast } = useToast();

    const totalCals = meal.entries?.reduce((acc, curr) => acc + curr.calories, 0) || 0;
    const totalProtein = meal.entries?.reduce((acc, curr) => acc + curr.protein_g, 0) || 0;
    const totalCarbs = meal.entries?.reduce((acc, curr) => acc + curr.carbs_g, 0) || 0;
    const totalFat = meal.entries?.reduce((acc, curr) => acc + curr.fat_g, 0) || 0;
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
            showToast("Food added", "success");
            onUpdate();
        } catch (e) {
            showToast("Failed to add food", "error");
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
            showToast("Food added", "success");
            setCustomItem(null);
            onUpdate();
        } catch (e) {
            showToast("Failed to add food", "error");
        }
    }

    const handleDeleteEntry = async (id: number) => {
        try {
            await api.nutrition.deleteEntry(id);
            showToast("Entry deleted", "success");
            onUpdate();
        } catch (e) {
            showToast("Failed to delete entry", "error");
        }
    };

    const handleUpdateMealName = async () => {
        try {
            await api.nutrition.updateMeal(meal.id, editName);
            setIsEditing(false);
            showToast("Meal updated", "success");
            onUpdate();
        } catch (e) {
            showToast("Failed to update", "error");
        }
    };

    return (
        <Card
            variant="interactive"
            padding="none"
            className={clsx(
                "overflow-hidden transition-all duration-300",
                expanded && "ring-1 ring-white/10"
            )}
        >
            {/* Header */}
            <div
                className="p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 md:gap-5 min-w-0">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        expanded ? "bg-white text-black scale-105" : "bg-neutral-900 text-neutral-500"
                    )}>
                        <Apple size={22} />
                    </div>

                    <div className="min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="input-base py-2 px-3 text-lg font-bold"
                                    autoFocus
                                />
                                <button onClick={handleUpdateMealName} className="btn-ghost text-emerald-500 p-2">
                                    <Check size={18} strokeWidth={3} />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="btn-ghost text-red-500 p-2">
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="font-bold text-lg md:text-xl truncate">{meal.name || "Untitled Meal"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                                        {meal.entries?.length || 0} items
                                    </span>
                                    <span className="text-neutral-800">•</span>
                                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                                        {new Date(meal.eaten_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    {!isEditing && (
                        <div className="hidden md:flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setIsEditing(true)} className="btn-ghost p-2">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={onDelete} className="btn-ghost p-2 hover:text-red-500">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}

                    <div className="text-right">
                        <p className="text-2xl font-bold tabular-nums">{totalCals}</p>
                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">kcal</p>
                    </div>

                    <div className={clsx(
                        "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300",
                        expanded && "rotate-180 bg-white text-black border-transparent"
                    )}>
                        <ChevronDown size={18} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-5 md:px-6 pb-6 space-y-6 animate-fade-in border-t border-white/5">
                    {/* Macro Summary */}
                    <div className="grid grid-cols-3 gap-3 pt-4">
                        <div className="macro-protein text-center py-3">
                            <p className="font-bold">{totalProtein.toFixed(1)}g</p>
                            <p className="text-[9px] uppercase tracking-wider opacity-70">Protein</p>
                        </div>
                        <div className="macro-carbs text-center py-3">
                            <p className="font-bold">{totalCarbs.toFixed(1)}g</p>
                            <p className="text-[9px] uppercase tracking-wider opacity-70">Carbs</p>
                        </div>
                        <div className="macro-fat text-center py-3">
                            <p className="font-bold">{totalFat.toFixed(1)}g</p>
                            <p className="text-[9px] uppercase tracking-wider opacity-70">Fat</p>
                        </div>
                    </div>

                    {/* Entries */}
                    {meal.entries && meal.entries.length > 0 && (
                        <div className="space-y-2">
                            {meal.entries.map(entry => (
                                <SwipeableRow key={entry.id} onDelete={() => handleDeleteEntry(entry.id)}>
                                    <div className="flex justify-between items-center p-4 bg-black/30 rounded-xl border border-white/5">
                                        <div>
                                            <p className="font-semibold">{entry.name}</p>
                                            <div className="flex gap-3 mt-1 text-[10px] font-bold">
                                                <span className="text-emerald-500">{entry.protein_g}P</span>
                                                <span className="text-blue-500">{entry.carbs_g}C</span>
                                                <span className="text-orange-500">{entry.fat_g}F</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-lg tabular-nums">{entry.calories}</span>
                                    </div>
                                </SwipeableRow>
                            ))}
                        </div>
                    )}

                    {/* Add Food Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowLibrary(true)} className="btn-primary text-xs uppercase tracking-wider">
                            <Search size={16} strokeWidth={3} />
                            Search Food
                        </button>
                        <button
                            onClick={() => setCustomItem({ name: "", cals: "", p: "", c: "", f: "" })}
                            className="btn-secondary text-xs uppercase tracking-wider"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Custom Entry
                        </button>
                    </div>

                    {/* Search Modal */}
                    <Modal isOpen={showLibrary} onClose={() => setShowLibrary(false)} title="Search Food">
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Search foods..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="input-base pl-12"
                                        autoFocus
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                </div>
                                <div className="w-24 relative">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="input-base text-center font-bold"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-neutral-600">g</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {filteredLibrary.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addFromLibrary(item)}
                                        className="w-full flex justify-between items-center p-4 rounded-xl border border-white/5 hover:bg-white hover:text-black transition-all group text-left"
                                    >
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-xs text-neutral-500 group-hover:text-neutral-600">
                                                {item.calories_per_100g} kcal / 100g
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold tabular-nums">
                                            {Math.round(item.calories_per_100g * (parseFloat(amount) / 100))}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Modal>

                    {/* Custom Entry Modal */}
                    <Modal isOpen={!!customItem} onClose={() => setCustomItem(null)} title="Custom Entry">
                        {customItem && (
                            <form onSubmit={addCustom} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="stat-label mb-2 block">Name</label>
                                        <input
                                            type="text"
                                            value={customItem.name}
                                            onChange={e => setCustomItem({ ...customItem, name: e.target.value })}
                                            className="input-base"
                                            placeholder="Food name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="stat-label mb-2 block">Calories</label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={customItem.cals}
                                            onChange={e => setCustomItem({ ...customItem, cals: e.target.value })}
                                            className="input-lg text-center"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="stat-label mb-2 block text-center">Protein</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={customItem.p}
                                                onChange={e => setCustomItem({ ...customItem, p: e.target.value })}
                                                className="input-base text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="stat-label mb-2 block text-center">Carbs</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={customItem.c}
                                                onChange={e => setCustomItem({ ...customItem, c: e.target.value })}
                                                className="input-base text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="stat-label mb-2 block text-center">Fat</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={customItem.f}
                                                onChange={e => setCustomItem({ ...customItem, f: e.target.value })}
                                                className="input-base text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full uppercase tracking-wider text-xs">
                                    <Save size={16} />
                                    Add Entry
                                </button>
                            </form>
                        )}
                    </Modal>
                </div>
            )}
        </Card>
    );
}
