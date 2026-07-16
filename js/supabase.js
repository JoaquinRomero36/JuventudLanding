const SUPABASE_URL = 'PONER_ACA_TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'PONER_ACA_TU_ANON_KEY';

const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
