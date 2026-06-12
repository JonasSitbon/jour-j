-- Migration 13: Key contacts (bridal party, family, emergency)
create table if not exists key_contacts (
  id              bigserial primary key,
  wedding_id      bigint not null references wedding(id) on delete cascade,
  name            text not null default '',
  role            text not null default 'autre',
  phone           text not null default '',
  email           text not null default '',
  note            text not null default '',
  is_bridal_party boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table key_contacts enable row level security;

create policy "key_contacts_access" on key_contacts
  using  (has_wedding_access(wedding_id))
  with check (has_wedding_access(wedding_id));

create index if not exists key_contacts_wedding_idx on key_contacts(wedding_id);
