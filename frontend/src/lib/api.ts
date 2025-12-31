const API_URL = "/api";

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, options);
  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(text || `Error ${res.status}`);
  }
  
  try {
    return text ? JSON.parse(text) : {} as T;
  } catch (e) {
    console.error("JSON Parse Error:", text);
    return {} as T;
  }
}

export const api = {
  identity: {
    get: () => fetcher<User>("/user"),
    create: (data: Partial<User>) => fetcher<User>("/user", { method: "POST", body: JSON.stringify(data) }),
    update: (data: Partial<User>) => fetcher<User>("/user", { method: "PUT", body: JSON.stringify(data) }),
  },
  resistance: {
    listExercises: () => fetcher<Exercise[]>("/exercises"),
    createExercise: (data: Partial<Exercise>) => fetcher<Exercise>("/exercises", { method: "POST", body: JSON.stringify(data) }),
    listSessions: () => fetcher<WorkoutSession[]>("/sessions"),
    createSession: (data: { start_time?: string, notes?: string }) => fetcher<WorkoutSession>("/sessions", { method: "POST", body: JSON.stringify(data) }),
    finishSession: (id: number, end_time: string) => fetcher(`/sessions/${id}/finish`, { method: "POST", body: JSON.stringify({ end_time }) }),
    addSet: (sessionId: number, data: Partial<WorkoutSet>) => fetcher<WorkoutSet>(`/sessions/${sessionId}/sets`, { method: "POST", body: JSON.stringify(data) }),
    updateSet: (setId: number, data: Partial<WorkoutSet>) => fetcher(`/sets/${setId}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteSet: (setId: number) => fetcher(`/sets/${setId}`, { method: "DELETE" }),
    listRoutines: () => fetcher<Routine[]>("/routines"),
    createRoutine: (data: { name: string, exercise_ids: number[] }) => fetcher<Routine>("/routines", { method: "POST", body: JSON.stringify(data) }),
    deleteRoutine: (id: number) => fetcher(`/routines/${id}`, { method: "DELETE" }),
    deleteSession: (id: number) => fetcher(`/sessions/${id}`, { method: "DELETE" }),
  },
  running: {
    list: () => fetcher<Run[]>("/runs"),
    create: (data: Partial<Run>) => fetcher<Run>("/runs", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => fetcher(`/runs/${id}`, { method: "DELETE" }),
    listShoes: () => fetcher<Shoe[]>("/shoes"),
    createShoe: (data: { brand: string, model: string }) => fetcher<Shoe>("/shoes", { method: "POST", body: JSON.stringify(data) }),
  },
  nutrition: {
    listMeals: () => fetcher<Meal[]>("/meals"),
    createMeal: (data: { name?: string, eaten_at?: string }) => fetcher<Meal>("/meals", { method: "POST", body: JSON.stringify(data) }),
    updateMeal: (id: number, name: string) => fetcher(`/meals/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
    deleteMeal: (id: number) => fetcher(`/meals/${id}`, { method: "DELETE" }),
    addEntry: (mealId: number, data: Partial<FoodEntry>) => fetcher<FoodEntry>(`/meals/${mealId}/entries`, { method: "POST", body: JSON.stringify(data) }),
    deleteEntry: (id: number) => fetcher(`/meals/entries/${id}`, { method: "DELETE" }),
    listLibrary: () => fetcher<FoodLibraryItem[]>("/nutrition/library"),
    createLibraryItem: (data: Partial<FoodLibraryItem>) => fetcher<FoodLibraryItem>("/nutrition/library", { method: "POST", body: JSON.stringify(data) }),
    logWater: (amount_ml: number) => fetcher("/nutrition/water", { method: "POST", body: JSON.stringify({ amount_ml }) }),
  },
  body: {
    list: () => fetcher<BodyMetric[]>("/body/metrics"),
    create: (data: Partial<BodyMetric>) => fetcher<BodyMetric>("/body/metrics", { method: "POST", body: JSON.stringify(data) }),
  },
  analytics: {
    daily: (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        return fetcher<DailySummary[]>(`/analytics/daily?${params.toString()}`);
    }
  }
};

// Types
export interface User {
  id: number;
  name: string;
  height_cm?: number;
  dob?: string;
  sex?: string;
  activity_level?: string;
  weight_goal?: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  equipment?: string;
}

export interface WorkoutSession {
  id: number;
  start_time: string;
  end_time?: string;
  notes?: string;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: number;
  exercise_id: number;
  exercise_name?: string;
  weight_kg: number;
  reps: number;
  rpe?: number;
  performed_at: string;
}

export interface Routine {
    id: number;
    name: string;
    exercises?: RoutineExercise[];
}

export interface RoutineExercise {
    id: number;
    exercise_id: number;
    exercise_name: string;
    exercise_order: number;
}

export interface Run {
  id: number;
  start_time: string;
  duration_seconds: number;
  distance_meters: number;
  elevation_gain_meters: number;
  avg_heart_rate?: number;
  cadence?: number;
  steps?: number;
  relative_effort?: number;
  shoe_id?: number;
  shoe_name?: string;
  route_data?: string;
  run_type?: string;
  notes?: string;
}

export interface Shoe {
    id: number;
    brand: string;
    model: string;
    is_active: boolean;
}

export interface Meal {
  id: number;
  name?: string;
  eaten_at: string;
  entries?: FoodEntry[];
}

export interface FoodEntry {
  id: number;
  meal_id: number;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity?: string;
}

export interface FoodLibraryItem {
    id: number;
    name: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
}

export interface BodyMetric {
  id: number;
  recorded_at: string;
  weight_kg?: number;
  body_fat_percent?: number;
}

export interface DailySummary {
    date: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    run_distance: number;
    workout_volume_kg: number;
    exercise_calories: number;
    water_ml: number;
    weight_kg: number;
}
