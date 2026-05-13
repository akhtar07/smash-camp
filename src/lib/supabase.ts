import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Player = {
  id: string;
  name: string;
  email: string;
  is_coach: boolean;
};

export type AttendanceRecord = {
  player_id: string;
  date: string;
  present: boolean;
};

export type ExerciseCompletion = {
  player_id: string;
  day_number: number;
  exercise_name: string;
  block_type: string;
  completed: boolean;
  date: string;
};
