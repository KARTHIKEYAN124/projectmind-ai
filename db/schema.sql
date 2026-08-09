create extension if not exists vector;
create extension if not exists pgcrypto;

create type memory_status as enum ('active', 'questionable', 'superseded', 'deprecated', 'invalid');
create type memory_type as enum (
  'architecture',
  'decision',
  'convention',
  'bug',
  'solution',
  'failed_attempt',
  'constraint',
  'dependency',
  'security',
  'performance',
  'deployment',
  'incident',
  'feature',
  'technical_debt',
  'team_knowledge'
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  provider text,
  provider_subject text,
  created_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'developer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists repository_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  provider text not null default 'github',
  owner text not null,
  name text not null,
  clone_url text not null,
  default_branch text,
  private boolean not null default false,
  installation_id text,
  encrypted_access_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  name text not null,
  head_sha text
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  path text not null,
  language text,
  size_bytes integer,
  content_hash text,
  indexed_at timestamptz,
  unique (repository_id, path)
);

create table if not exists symbols (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade,
  name text not null,
  kind text not null,
  signature text,
  start_line integer,
  end_line integer,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists symbol_relationships (
  id uuid primary key default gen_random_uuid(),
  source_symbol_id uuid references symbols(id) on delete cascade,
  target_symbol_id uuid references symbols(id) on delete cascade,
  relationship text not null,
  confidence numeric not null default 0.8,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists commits (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  sha text not null,
  message text,
  author_name text,
  author_email text,
  committed_at timestamptz,
  unique (repository_id, sha)
);

create table if not exists commit_files (
  commit_id uuid references commits(id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  status text,
  additions integer,
  deletions integer,
  primary key (commit_id, file_id)
);

create table if not exists pull_requests (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  number integer not null,
  title text,
  body text,
  state text,
  merged_at timestamptz,
  author text,
  metadata jsonb not null default '{}'::jsonb,
  unique (repository_id, number)
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  number integer not null,
  title text,
  body text,
  state text,
  author text,
  metadata jsonb not null default '{}'::jsonb,
  unique (repository_id, number)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  path text,
  title text,
  content text,
  content_hash text,
  updated_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  content text not null,
  type memory_type not null,
  status memory_status not null default 'questionable',
  confidence numeric not null default 0.75,
  created_by uuid references users(id),
  valid_from timestamptz,
  valid_until timestamptz,
  superseded_by uuid references memories(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_sources (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  source_type text not null,
  source_id text,
  source_author text,
  source_commit text,
  url text,
  confidence numeric not null default 0.75,
  created_at timestamptz not null default now()
);

create table if not exists memory_relations (
  id uuid primary key default gen_random_uuid(),
  source_memory_id uuid references memories(id) on delete cascade,
  target_memory_id uuid references memories(id) on delete cascade,
  relation text not null
);

create table if not exists memory_versions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  text text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists embeddings_vector_idx on embeddings using ivfflat (embedding vector_cosine_ops);
create index if not exists memories_search_idx on memories using gin (to_tsvector('english', title || ' ' || content));
create index if not exists files_path_idx on files(repository_id, path);
create index if not exists symbol_relationship_idx on symbol_relationships(source_symbol_id, relationship);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  asked_by uuid references users(id),
  question text not null,
  intent text,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  answer text not null,
  confidence numeric,
  model text,
  created_at timestamptz not null default now()
);

create table if not exists answer_sources (
  answer_id uuid references answers(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  score numeric,
  primary key (answer_id, source_type, source_id)
);

create table if not exists sync_jobs (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repository_connections(id) on delete cascade,
  type text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  actor_user_id uuid references users(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
