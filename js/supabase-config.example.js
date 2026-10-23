/**
 * ==============================================================================
 * SUPABASE CONFIGURATION TEMPLATE
 * ==============================================================================
 * Copy this file to `js/supabase-config.js` and insert your actual project URL
 * and publishable/anon key from your Supabase Dashboard:
 * Settings -> API -> Project URL & Project API Keys (anon public).
 *
 * IMPORTANT SECURITY RULES:
 * 1. NEVER include your Supabase `service_role` secret key here!
 * 2. Only the `anon` public key is safe for frontend client code.
 * 3. Security is strictly enforced by PostgreSQL Row Level Security (RLS).
 * ==============================================================================
 */

window.SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
