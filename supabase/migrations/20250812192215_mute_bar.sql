/*
  # Initial ContentFlow AI Database Schema

  1. New Tables
    - `users` - User accounts with role-based access
    - `workspaces` - Agency workspaces for organizing clients
    - `workspace_members` - Many-to-many relationship for workspace access
    - `clients` - Client accounts and information
    - `content_items` - Content pieces with status tracking
    - `content_comments` - Comments and approval workflow
    - `media_files` - File storage references
    - `hashtag_packs` - Saved hashtag collections
    - `hashtag_research` - AI hashtag research history
    - `ai_generations` - AI content generation history
    - `trending_data` - Cached trending content and hashtags
    - `trending_hashtags` - Trending hashtag analytics
    - `trending_content` - Trending content formats
    - `social_accounts` - Connected social media accounts
    - `analytics_data` - Social media analytics cache
    - `notifications` - In-app notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure file storage access

  3. Indexes
    - Performance indexes for common queries
    - Full-text search indexes where needed
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'creator' CHECK (role IN ('admin', 'agency', 'creator', 'client')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url text,
  timezone text DEFAULT 'UTC',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspaces table (for agencies)
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspace members (many-to-many)
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Clients table
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
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter')),
  content_type text NOT NULL CHECK (content_type IN ('video', 'image', 'carousel', 'story', 'post')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published', 'rejected')),
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

-- Content comments table
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  type text NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'approval', 'rejection', 'revision')),
  parent_id uuid REFERENCES content_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename text NOT NULL,
  original_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  content_item_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  tags text[],
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Hashtag packs table
CREATE TABLE IF NOT EXISTS hashtag_packs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  hashtags text[] NOT NULL,
  purpose text,
  platform text CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter')),
  estimated_reach text,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hashtag research table
CREATE TABLE IF NOT EXISTS hashtag_research (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  platform text NOT NULL,
  goal text NOT NULL,
  hashtags jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- AI generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  type text NOT NULL CHECK (type IN ('hook', 'script', 'caption', 'hashtags', 'ideas')),
  platform text CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter')),
  tone text,
  niche text,
  generated_content text NOT NULL,
  tokens_used integer,
  content_item_id uuid REFERENCES content_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Trending data table
CREATE TABLE IF NOT EXISTS trending_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  platform text NOT NULL,
  type text NOT NULL CHECK (type IN ('hashtag', 'content', 'audio', 'format')),
  niche text,
  region text DEFAULT 'global',
  engagement_score integer NOT NULL,
  growth_rate text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  format text,
  description text,
  estimated_reach text,
  dropoff_prediction text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trending hashtags table
CREATE TABLE IF NOT EXISTS trending_hashtags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hashtag text NOT NULL,
  platform text NOT NULL,
  usage_count bigint NOT NULL,
  engagement_rate decimal(5,2),
  growth_rate text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text,
  updated_at timestamptz DEFAULT now()
);

-- Trending content table
CREATE TABLE IF NOT EXISTS trending_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  platform text NOT NULL,
  format text NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  viral_score integer NOT NULL,
  views text,
  engagement_rate text,
  hook_analysis text,
  suggested_script text,
  audio_track text,
  thumbnail_url text,
  category text,
  creator_handle text,
  updated_at timestamptz DEFAULT now()
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter', 'facebook')),
  account_id text NOT NULL,
  username text NOT NULL,
  display_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  account_data jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'error')),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

-- Analytics data table
CREATE TABLE IF NOT EXISTS analytics_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value jsonb NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(social_account_id, metric_type, date_range_start, date_range_end)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Workspaces policies
CREATE POLICY "Workspace owners can manage workspaces"
  ON workspaces FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Workspace members can read workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Workspace members policies
CREATE POLICY "Workspace owners can manage members"
  ON workspace_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_members.workspace_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can read workspace membership"
  ON workspace_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_members.workspace_id
      AND owner_id = auth.uid()
    )
  );

-- Clients policies
CREATE POLICY "Creators can manage their clients"
  ON clients FOR ALL
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Client users can read their own data"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Content items policies
CREATE POLICY "Creators can manage their content"
  ON content_items FOR ALL
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Clients can read their content"
  ON content_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = content_items.client_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update content status"
  ON content_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = content_items.client_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = content_items.client_id
      AND user_id = auth.uid()
    )
  );

-- Content comments policies
CREATE POLICY "Users can read comments on accessible content"
  ON content_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_comments.content_item_id
      AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clients
          WHERE id = content_items.client_id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible content"
  ON content_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_comments.content_item_id
      AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clients
          WHERE id = content_items.client_id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Media files policies
CREATE POLICY "Users can manage their uploaded files"
  ON media_files FOR ALL
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can read files for accessible content"
  ON media_files FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (content_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM content_items
      WHERE id = media_files.content_item_id
      AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clients
          WHERE id = content_items.client_id
          AND user_id = auth.uid()
        )
      )
    ))
  );

-- Hashtag packs policies
CREATE POLICY "Users can manage their hashtag packs"
  ON hashtag_packs FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Hashtag research policies
CREATE POLICY "Users can manage their hashtag research"
  ON hashtag_research FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- AI generations policies
CREATE POLICY "Users can manage their AI generations"
  ON ai_generations FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Trending data policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read trending data"
  ON trending_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read trending hashtags"
  ON trending_hashtags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read trending content"
  ON trending_content FOR SELECT
  TO authenticated
  USING (true);

-- Social accounts policies
CREATE POLICY "Users can manage their social accounts"
  ON social_accounts FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Creators can read client social accounts"
  ON social_accounts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (client_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM clients
      WHERE id = social_accounts.client_id
      AND creator_id = auth.uid()
    ))
  );

-- Analytics data policies
CREATE POLICY "Users can read analytics for their social accounts"
  ON analytics_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE id = analytics_data.social_account_id
      AND (
        user_id = auth.uid() OR
        (client_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM clients
          WHERE id = social_accounts.client_id
          AND creator_id = auth.uid()
        ))
      )
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage their notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes for performance
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
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_item_id);
CREATE INDEX IF NOT EXISTS idx_media_files_content ON media_files(content_item_id);
CREATE INDEX IF NOT EXISTS idx_media_files_uploader ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_hashtag_packs_user ON hashtag_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(type);
CREATE INDEX IF NOT EXISTS idx_trending_data_platform ON trending_data(platform);
CREATE INDEX IF NOT EXISTS idx_trending_data_type ON trending_data(type);
CREATE INDEX IF NOT EXISTS idx_trending_data_updated ON trending_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_data_account ON analytics_data(social_account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_content_items_search ON content_items USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_hashtag_packs_search ON hashtag_packs USING gin(to_tsvector('english', name || ' ' || coalesce(purpose, '')));