const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for general operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Create admin client for service operations (if service role key is available)
let supabaseAdmin = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
} else {
  logger.warn('SUPABASE_SERVICE_ROLE_KEY not provided. Some admin operations may not work.');
  // Use regular client as fallback
  supabaseAdmin = supabase;
}

// Test database connection
async function testConnection() {
  try {
    // Try a simple query that should work even without tables
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      // If RPC doesn't work, try a basic select
      const { data: basicTest, error: basicError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (basicError && basicError.code !== 'PGRST116') {
        throw basicError;
      }
    }
    
    logger.info('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

// Alternative test function for routes
async function testBasicConnection() {
  try {
    // Test with a simple query that doesn't require specific tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error && !error.message.includes('permission denied')) {
      throw error;
    }
    
    logger.info('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  testBasicConnection
};