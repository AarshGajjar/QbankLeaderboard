/*
  # Authentication and User Management Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `display_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `completed` (integer)
      - `correct` (integer)
      - `session_date` (date)
      - `created_at` (timestamp)
    
    - `daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `date` (date)
      - `total_completed` (integer)
      - `total_correct` (integer)
      - `session_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  completed integer NOT NULL CHECK (completed >= 0),
  correct integer NOT NULL CHECK (correct >= 0 AND correct <= completed),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create daily stats table
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_completed integer NOT NULL DEFAULT 0,
  total_correct integer NOT NULL DEFAULT 0,
  session_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for user_sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for daily_stats
CREATE POLICY "Users can read own daily stats"
  ON daily_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily stats"
  ON daily_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily stats"
  ON daily_stats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON user_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

-- Create function to update daily stats when sessions are added
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, total_completed, total_correct, session_count)
  VALUES (NEW.user_id, NEW.session_date, NEW.completed, NEW.correct, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_completed = daily_stats.total_completed + NEW.completed,
    total_correct = daily_stats.total_correct + NEW.correct,
    session_count = daily_stats.session_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update daily stats
CREATE TRIGGER trigger_update_daily_stats
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();