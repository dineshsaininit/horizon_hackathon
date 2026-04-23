import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ldyxvvwsknxadjgjgyme.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeXh2dndza254YWRqZ2pneW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjEyNzEsImV4cCI6MjA5MjQ5NzI3MX0.0FENPIlVZJw3-SdO8SVboiS_0N9bQ2aM8gyzdP-Ubxw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
