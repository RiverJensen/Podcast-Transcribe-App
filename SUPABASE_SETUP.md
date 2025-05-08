# Supabase Setup Guide for Podcast Transcription App

This guide will help you set up a Supabase database for the podcast transcription app.

## What is Supabase?

Supabase is an open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions. For this app, we're using it to store and retrieve transcription data.

## Steps to Set Up Supabase

### 1. Create a Supabase Account

1. Go to [https://supabase.com/](https://supabase.com/) and sign up for a free account
2. Create a new project with a name of your choice (e.g., "podcast-transcriptions")
3. Note your project URL and anon/public key (you'll need these later)

### 2. Create the Transcriptions Table

In your Supabase project:

1. Go to the SQL Editor
2. Create a new query and paste the following SQL:

```sql
-- Create transcriptions table
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY,
  title TEXT,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_type TEXT,
  file_size INTEGER,
  video_id TEXT,
  duration INTEGER,
  author TEXT
);

-- Enable full-text search
ALTER TABLE transcriptions ADD COLUMN text_search TSVECTOR
GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

CREATE INDEX text_search_idx ON transcriptions USING GIN (text_search);

-- Row Level Security (RLS) for reading transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Allow public access to read transcriptions
CREATE POLICY "Allow public read access" ON transcriptions
  FOR SELECT USING (true);

-- Allow only authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON transcriptions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON transcriptions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON transcriptions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add a default sample transcription
INSERT INTO transcriptions (
  id, 
  title, 
  source_type, 
  source_name, 
  text, 
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Sample Transcription', 
  'sample', 
  'Default Sample Data',
  'This is a test transcription for the API. This default data ensures that the API always returns at least one transcription record. This sample represents what a real transcription would look like after processing an audio file or YouTube video.',
  NOW()
);
```

3. Run the query to create the table and set up security

### 3. Configure Environment Variables

1. Create a `.env` file in the root directory of your project
2. Add the following variables:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Server Port
PORT=3002

# Supabase Credentials
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

Replace `your_supabase_url_here` with your Supabase project URL and `your_supabase_anon_key_here` with your anon/public key.

## Troubleshooting

If you encounter any issues:

1. Check that your environment variables are set correctly
2. Ensure that you have created the table with the correct structure
3. Verify that you can connect to your Supabase database

## Optional: Enable Authentication

For production use, you may want to enable authentication to protect your transcription data. Supabase provides several authentication options, including email/password, social logins, and more.

To enable authentication:

1. Go to the Authentication section in your Supabase dashboard
2. Configure the providers you want to use
3. Update your application to handle user authentication

For more information on Supabase authentication, see the [official documentation](https://supabase.com/docs/guides/auth). 