const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase credentials - these should be stored in .env file
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Check if credentials are available
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    'WARNING: Supabase credentials not found in environment variables. ' +
    'Database functionality will not work. Please add SUPABASE_URL and SUPABASE_KEY to your .env file.'
  );
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

module.exports = supabase; 