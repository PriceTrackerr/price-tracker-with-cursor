create table public.product_matches (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  user_id uuid null,
  product_id uuid null,
  title text null,
  price numeric(10, 2) null default 0.00,
  currency character varying(3) null default 'USD'::character varying,
  url text null,
  image_url text null,
  platform character varying(50) null,
  constraint product_matches_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_product_matches_user on public.product_matches using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_product_matches_product on public.product_matches using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_matches_created on public.product_matches using btree (created_at desc) TABLESPACE pg_default;

create unique INDEX IF not exists uq_product_matches_user_product_url on public.product_matches using btree (user_id, product_id, url) TABLESPACE pg_default;

create index IF not exists idx_product_matches_created_at on public.product_matches using btree (created_at desc) TABLESPACE pg_default;

create trigger update_product_matches_updated_at BEFORE
update on product_matches for EACH row
execute FUNCTION update_updated_at_column ();