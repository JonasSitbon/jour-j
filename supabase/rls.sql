-- JOUR J — Politiques RLS
-- Colle dans Supabase > SQL Editor et exécute

alter table wedding enable row level security;
create policy "wedding_select" on wedding for select using (user_id = auth.uid());
create policy "wedding_insert" on wedding for insert with check (user_id = auth.uid());
create policy "wedding_update" on wedding for update using (user_id = auth.uid());
create policy "wedding_delete" on wedding for delete using (user_id = auth.uid());

alter table guests enable row level security;
create policy "guests_all" on guests for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table seating_tables enable row level security;
create policy "seating_tables_all" on seating_tables for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table vendors enable row level security;
create policy "vendors_all" on vendors for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table budget_posts enable row level security;
create policy "budget_posts_all" on budget_posts for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table contributions enable row level security;
create policy "contributions_all" on contributions for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table payments enable row level security;
create policy "payments_all" on payments for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table tasks enable row level security;
create policy "tasks_all" on tasks for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table day_j enable row level security;
create policy "day_j_all" on day_j for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table date_candidates enable row level security;
create policy "date_candidates_all" on date_candidates for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table members enable row level security;
create policy "members_all" on members for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table notifications enable row level security;
create policy "notifications_all" on notifications for all using (wedding_id = (select id from wedding where user_id = auth.uid())) with check (wedding_id = (select id from wedding where user_id = auth.uid()));

alter table vendor_cats enable row level security;
create policy "vendor_cats_read" on vendor_cats for select using (true);

alter table checklist_cats enable row level security;
create policy "checklist_cats_read" on checklist_cats for select using (true);

alter table holidays enable row level security;
create policy "holidays_read" on holidays for select using (true);

alter table weather_by_month enable row level security;
create policy "weather_by_month_read" on weather_by_month for select using (true);
