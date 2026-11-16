CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT, qty INTEGER, finish TEXT, design INTEGER,
  total INTEGER, name TEXT, phone TEXT,
  status TEXT DEFAULT 'quoted', checkout_id TEXT, receipt TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP
);
