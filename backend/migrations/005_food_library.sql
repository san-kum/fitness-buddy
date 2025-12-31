CREATE TABLE food_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    calories_per_100g REAL NOT NULL,
    protein_per_100g REAL DEFAULT 0,
    carbs_per_100g REAL DEFAULT 0,
    fat_per_100g REAL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed some common items
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Chicken Breast (Cooked)', 165, 31, 0, 3.6);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('White Rice (Cooked)', 130, 2.7, 28, 0.3);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Whole Egg (Large)', 143, 13, 1.1, 10);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Oats (Dry)', 389, 16.9, 66, 6.9);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Whey Protein Powder', 400, 80, 5, 5);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Peanut Butter', 588, 25, 20, 50);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Greek Yogurt (Non-fat)', 59, 10, 3.6, 0.4);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Banana', 89, 1.1, 23, 0.3);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Avocado', 160, 2, 9, 15);
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES ('Salmon (Cooked)', 208, 20, 0, 13);
