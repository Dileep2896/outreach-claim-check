-- Claim Check schema for Postgres / Supabase. Documented here, NOT executed by the demo
-- (the demo uses InMemoryQueueRepository). Plug in @supabase/supabase-js in src/lib/repo.

create table if not exists leads (
  id            text primary key,
  business_id   text not null,
  company       text not null,
  contact_name  text not null,
  contact_role  text,
  segment       text,
  city          text,
  reason        text,
  created_at    timestamptz not null default now()
);

create table if not exists research_facts (
  id            text primary key,
  lead_id       text not null references leads(id) on delete cascade,
  text          text not null,
  mention       text,
  source_url    text not null,
  source_label  text not null,
  observed_at   date not null,
  confidence    text not null check (confidence in ('fact', 'guess'))
);
create index if not exists research_facts_lead_idx on research_facts(lead_id);

create table if not exists drafts (
  id            text primary key,
  lead_id       text not null references leads(id) on delete cascade,
  date          date not null,
  message_type  text not null,
  channel       text not null check (channel in ('email', 'linkedin')),
  subject       text,
  first_touch   boolean not null default true,
  body          text not null
);
create index if not exists drafts_date_idx on drafts(date);

-- one row per check run, so an eval set can be rebuilt from production traffic
create table if not exists claim_checks (
  id            bigserial primary key,
  draft_id      text not null references drafts(id) on delete cascade,
  extractor     text not null default 'rules',
  verdict       text not null check (verdict in ('ready', 'review', 'blocked')),
  readiness     int not null,
  claims        jsonb not null,     -- CheckedClaim[] (text, span, kind, grounding)
  why_now       jsonb not null,
  compliance    jsonb not null,
  checked_at    timestamptz not null default now()
);

create table if not exists decisions (
  id                   bigserial primary key,
  draft_id             text not null references drafts(id) on delete cascade,
  message_type         text not null,
  action               text not null check (action in ('approved', 'skipped')),
  unsupported_at_send  int not null default 0,
  decided_at           date not null default current_date
);
create index if not exists decisions_type_idx on decisions(message_type);

-- Ledger view: the auto-send evidence per message type
create or replace view message_type_ledger as
select message_type,
       count(*) filter (where action = 'approved')                              as sent,
       count(*) filter (where action = 'approved' and unsupported_at_send = 0)  as clean_sent,
       (count(*) filter (where action = 'approved') >= 50
        and count(*) filter (where action = 'approved' and unsupported_at_send = 0)::numeric
            / nullif(count(*) filter (where action = 'approved'), 0) >= 0.95)  as eligible
from decisions group by message_type;
