-- Players table (includes is_coach flag)
CREATE TABLE players (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_coach BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id)
);

-- Attendance table
CREATE TABLE attendance (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  present BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (player_id, date)
);

-- Exercise completions table
CREATE TABLE exercise_completions (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  exercise_name TEXT NOT NULL,
  block_type TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (player_id, day_number, exercise_name, date)
);

-- Daily sessions summary table
CREATE TABLE daily_sessions (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  completion_percent INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, date)
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;

-- Open policies (fine for a private summer camp)
CREATE POLICY "Public read/write" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write" ON exercise_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write" ON daily_sessions FOR ALL USING (true) WITH CHECK (true);
