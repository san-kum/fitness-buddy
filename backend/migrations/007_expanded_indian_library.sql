-- Seeds & Nuts Expansion
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES 
('Sunflower Seeds', 584, 20.8, 20.0, 51.5),
('Pumpkin Seeds (Kaddu)', 559, 30.2, 10.7, 49.1),
('Flax Seeds (Alsi)', 534, 18.3, 28.9, 42.2),
('Chia Seeds', 486, 16.5, 42.1, 30.7),
('Sesame Seeds (Til)', 573, 17.7, 23.5, 49.7),
('Watermelon Seeds (Magaj)', 557, 28.3, 15.3, 47.4),
('Cashews (Kaju)', 553, 18.2, 30.2, 43.8),
('Walnuts (Akhrot)', 654, 15.2, 13.7, 65.2);

-- Raw Pulses & Legumes (Dry weight)
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES 
('Moong Dal (Yellow - Dry)', 348, 24.5, 59.9, 1.2),
('Moong Dal (Green - Dry)', 334, 24.0, 56.7, 1.3),
('Masoor Dal (Red - Dry)', 352, 24.6, 63.4, 1.1),
('Chana Dal (Bengal Gram - Dry)', 372, 20.8, 59.8, 5.6),
('Toor Dal (Pigeon Pea - Dry)', 343, 22.3, 62.8, 1.7),
('Urad Dal (Black Gram - Dry)', 341, 25.2, 58.9, 1.4),
('Chickpeas (Kabuli Chana - Dry)', 364, 19.3, 60.6, 6.0),
('Kidney Beans (Rajma - Dry)', 333, 23.6, 60.0, 0.8),
('Black Eyed Peas (Lobia - Dry)', 336, 23.5, 60.0, 1.3),
('Horse Gram (Kulthi - Dry)', 321, 22.0, 57.0, 0.5),
('Soybeans (Dry)', 446, 36.5, 30.2, 19.9);

-- Boiled/Cooked Staples (No oil/spices)
INSERT OR IGNORE INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES 
('Boiled Moong Dal', 105, 7.0, 19.0, 0.4),
('Boiled Chickpeas', 164, 8.9, 27.4, 2.6),
('Boiled Rajma', 127, 8.7, 22.8, 0.5),
('Boiled Masoor Dal', 116, 9.0, 20.0, 0.4);
