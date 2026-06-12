-- Migration 12: Songs / music playlist per wedding
create table if not exists songs (
  id             bigserial primary key,
  wedding_id     bigint not null references wedding(id) on delete cascade,
  moment         text not null default 'autre',
  title          text not null default '',
  artist         text not null default '',
  duration       text not null default '',
  link           text not null default '',
  note           text not null default '',
  approved       boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table songs enable row level security;

create policy "songs_access" on songs
  using  (has_wedding_access(wedding_id))
  with check (has_wedding_access(wedding_id));

create index if not exists songs_wedding_idx on songs(wedding_id);
