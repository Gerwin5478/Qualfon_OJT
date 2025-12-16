import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tkycfahdgknoialtfbsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRreWNmYWhkZ2tub2lhbHRmYnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjkyOTEsImV4cCI6MjA4MTM0NTI5MX0.os9B_NxCqGOJ-LCEUnKnNKsjWOqCYyA-XOs446pICDE';

export const supabase = createClient(supabaseUrl, supabaseKey);