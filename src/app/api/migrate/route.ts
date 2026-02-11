import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MIGRATION_SQL = `
-- Users / Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Stack items
CREATE TABLE IF NOT EXISTS stack_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  category TEXT,
  save_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saves (who saved which prompt)
CREATE TABLE IF NOT EXISTS saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  saver_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, saver_ip)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Public read access policies (use DO block to avoid errors if they already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public stack items are viewable by everyone') THEN
    CREATE POLICY "Public stack items are viewable by everyone" ON stack_items FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public prompts are viewable by everyone') THEN
    CREATE POLICY "Public prompts are viewable by everyone" ON prompts FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can save a prompt') THEN
    CREATE POLICY "Anyone can save a prompt" ON saves FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Saves are viewable by everyone') THEN
    CREATE POLICY "Saves are viewable by everyone" ON saves FOR SELECT USING (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_prompts_profile ON prompts(profile_id);
CREATE INDEX IF NOT EXISTS idx_stack_profile ON stack_items(profile_id);
`;

export async function POST() {
  try {
    const { error } = await supabase.rpc("exec_sql", {
      sql: MIGRATION_SQL,
    });

    if (error) {
      // If the RPC doesn't exist, fall back to running statements individually
      // The anon key can't run raw SQL via RPC, so we'll use the REST API approach
      // For now, return instructions
      return NextResponse.json(
        {
          success: false,
          message:
            "Migration SQL needs to be run directly in the Supabase SQL Editor. The anon key cannot execute DDL statements.",
          sql: MIGRATION_SQL,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Migration complete" });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Copy and run the migration SQL in your Supabase SQL Editor dashboard.",
        sql: MIGRATION_SQL,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET returns the SQL so you can copy it
export async function GET() {
  return NextResponse.json({
    message:
      "Copy this SQL and run it in your Supabase SQL Editor (supabase.com → your project → SQL Editor → New Query → paste → Run)",
    sql: MIGRATION_SQL,
  });
}
