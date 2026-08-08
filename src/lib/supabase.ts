import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const DEFAULT_SUPABASE_URL = 'https://ihvtfgbvztutvsolwkur.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_JRZTn4DC13sU9c4e9uqKhg_M4H1rnoS';

export function getSupabaseConfig() {
  let url = localStorage.getItem('ramox_supabase_url') || env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  let key = localStorage.getItem('ramox_supabase_key') || env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  // Secret keys (e.g. sb_secret_...) are forbidden by Supabase JS in browser environments
  if (key && (key.startsWith('sb_secret_') || key.includes('service_role'))) {
    console.warn('Secret key detected in browser localStorage. Clearing and using publishable key instead.');
    localStorage.removeItem('ramox_supabase_key');
    key = DEFAULT_SUPABASE_KEY;
  }

  return { url, key };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('ramox_supabase_url', url.trim());
  else localStorage.removeItem('ramox_supabase_url');

  const trimmedKey = key ? key.trim() : '';
  if (trimmedKey.startsWith('sb_secret_') || trimmedKey.includes('service_role')) {
    console.warn('Cannot save secret key to browser localStorage. Defaulting to publishable key.');
    localStorage.removeItem('ramox_supabase_key');
  } else if (trimmedKey) {
    localStorage.setItem('ramox_supabase_key', trimmedKey);
  } else {
    localStorage.removeItem('ramox_supabase_key');
  }

  return reinitSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function reinitSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.error('Erro ao inicializar cliente Supabase:', e);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
}

// Initial boot
reinitSupabaseClient();

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    reinitSupabaseClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export const supabase = getSupabase();

