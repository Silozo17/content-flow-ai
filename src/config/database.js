// Re-export from supabaseClient for backward compatibility
const { supabase, supabaseAdmin, testConnection } = require('./supabaseClient');

module.exports = {
  supabase,
  supabaseAdmin,
  connectSupabase: testConnection
};