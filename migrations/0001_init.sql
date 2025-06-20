-- D1 schema for museum visitors

CREATE TABLE IF NOT EXISTS event_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- YYYY-MM-DD
  visit_type TEXT NOT NULL, -- 'individual' or 'group'
  group_description TEXT,
  children_count INTEGER NOT NULL,
  adults_count INTEGER NOT NULL,
  seniors_count INTEGER NOT NULL,
  students_count INTEGER NOT NULL,
  event_type_id INTEGER NOT NULL REFERENCES event_types(id),
  created_at TEXT NOT NULL
);

-- Initial event types (copy from your constants)
INSERT INTO event_types (id, name) VALUES
  (1, 'Meeting with writer'),
  (2, 'Excursion'),
  (3, 'Concert'),
  (4, 'Workshop'),
  (5, 'Exhibition opening'),
  (6, 'Lecture'),
  (7, 'Film screening'),
  (8, 'Children''s program');

-- Optionally, initial visits can be seeded here as well.
