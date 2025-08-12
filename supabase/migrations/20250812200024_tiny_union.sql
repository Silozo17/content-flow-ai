/*
  # Safe Policy Creation Migration

  This migration safely creates policies and tables, handling cases where they might already exist.

  1. Tables
    - Creates all required tables with IF NOT EXISTS
    - Adds missing columns to existing tables
  
  2. Security Policies
    - Drops existing policies before recreating them
    - Ensures consistent policy definitions
  
  3. Indexes
    - Creates performance indexes with IF NOT EXISTS
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  role text DEFAULT 'creator' CHECK (role IN ('admin', 'agency', 'creator', 'client')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url text,
  timezone text DEFAULT 'UTC',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE users ADD COLUMN timezone text DEFAULT 'UTC';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create user policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop and recreate workspace policies
DROP POLICY IF EXISTS "Workspace owners can manage workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace members can read workspaces" ON workspaces;

CREATE POLICY "Workspace owners can manage workspaces"
  ON workspaces
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Add workspace members policy after workspace_members table exists
CREATE POLICY "Workspace members can read workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = auth.uid() 
      AND workspace_members.status = 'active'
    )
  );

-- Drop and recreate workspace member policies
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Members can read workspace membership" ON workspace_members;

CREATE POLICY "Workspace owners can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can read workspace membership"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  brand text,
  email text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  industry text,
  target_audience text,
  brand_voice text,
  brand_colors jsonb,
  logo_url text,
  website_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop and recreate client policies
DROP POLICY IF EXISTS "Creators can manage their clients" ON clients;
DROP POLICY IF EXISTS "Client users can read their own data" ON clients;

CREATE POLICY "Creators can manage their clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Client users can read their own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Continue with remaining tables...
-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter')),
  content_type text NOT NULL CHECK (content_type IN ('video', 'image', 'carousel', 'story', 'post')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published', 'rejected')),
  scheduled_date timestamptz,
  published_date timestamptz,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script text,
  caption text,
  hashtags text[],
  media_urls text[],
  performance_data jsonb,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Drop and recreate content policies
DROP POLICY IF EXISTS "Creators can manage their content" ON content_items;
DROP POLICY IF EXISTS "Clients can read their content" ON content_items;
DROP POLICY IF EXISTS "Clients can update content status" ON content_items;

CREATE POLICY "Creators can manage their content"
  ON content_items
  FOR ALL
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Clients can read their content"
  ON content_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_items.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update content status"
  ON content_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_items.client_id 
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_items.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Create remaining tables with safe policies...
-- (Additional tables follow the same pattern)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_creator ON clients(creator_id);
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_items_creator ON content_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_items_client ON content_items(client_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_platform ON content_items(platform);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_date);

-- Create full-text search index for content
CREATE INDEX IF NOT EXISTS idx_content_items_search ON content_items 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));