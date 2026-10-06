-- =====================================================================
-- Demo reviews: clearly flagged sample content (no user, no verified badge,
-- excluded from aggregate ratings / structured data). Delete them in admin.
-- =====================================================================

alter table public.lw_reviews add column is_demo boolean not null default false;

-- Demo rows have no author account; keep the one-review-per-user rule for real users only.
alter table public.lw_reviews
  add constraint lw_reviews_demo_has_no_user check (not is_demo or user_id is null);
