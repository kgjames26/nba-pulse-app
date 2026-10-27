create table if not exists nba_ai_cache (
  cache_key text primary key,
  kind text not null,
  payload text not null,
  created_at text not null
);
