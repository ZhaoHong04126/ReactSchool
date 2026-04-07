import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mowgqjldqjblzkkkpxbn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd2dramxkcWpibHpra2tweGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MzQ0MzgsImV4cCI6MjA2MDAxMDQzOH0.6121982111111111111111111111111111111111111111111111111111111111';

export const supabase = createClient(supabaseUrl, supabaseKey);
