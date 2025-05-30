create table if not exists addresses (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references auth.users(id) not null,
  type text check (type in ('SHIPPING', 'BILLING')) not null,
  name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  postcode text not null,
  country text not null,
  is_default boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table addresses enable row level security;

create policy "Users can view their own addresses"
  on addresses for select
  using (auth.uid() = client_id);

create policy "Users can insert their own addresses"
  on addresses for insert
  with check (auth.uid() = client_id);

create policy "Users can update their own addresses"
  on addresses for update
  using (auth.uid() = client_id);

create policy "Users can delete their own addresses"
  on addresses for delete
  using (auth.uid() = client_id);

-- Create function to ensure only one default address per type per client
create or replace function check_default_address()
returns trigger as $$
begin
  if NEW.is_default then
    update addresses
    set is_default = false
    where client_id = NEW.client_id
    and type = NEW.type
    and id != NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Create trigger to enforce default address constraint
create trigger enforce_single_default_address
  before insert or update on addresses
  for each row
  execute function check_default_address();
