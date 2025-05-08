const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase credentials - these should be stored in .env file
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Check if credentials are available
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    'WARNING: Supabase credentials not found in environment variables. ' +
    'Using mock implementation for testing purposes. ' +
    'For production, please add SUPABASE_URL and SUPABASE_KEY to your .env file.'
  );
}

// Create a mock Supabase client for testing when credentials are not available
const mockSupabase = {
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { code: 'PGRST116' } })
      }),
      order: () => ({
        textSearch: () => ({
          order: async () => ({ data: [], error: null })
        })
      })
    }),
    insert: (data) => ({
      select: () => ({
        single: async () => ({ data, error: null })
      })
    }),
    delete: () => ({
      eq: async () => ({ error: null })
    })
  })
};

// Create Supabase client or use mock
const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : mockSupabase;

module.exports = supabase; 