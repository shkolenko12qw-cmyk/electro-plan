import { createClient } from '@supabase/supabase-js';

// Вставте сюди дані з вашого Supabase Dashboard:
// Project Settings -> API
const supabaseUrl = 'https://agkvrhttfznqzgcyqpjw.supabase.co'; // Змініть .com на .co
const supabaseKey = 'sb_publishable_YHYh9aSoWqNGTJ2x_u4YHw_s7nfV-dB'; // Вставте сюди ваш довгий anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
