-- Aktifkan ekstensi PostGIS untuk query jarak
create extension if not exists postgis;

-- 1. Tabel Users
create table users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  monthly_budget int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabel Restaurants (Warung Makan)
create table restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text, -- e.g., 'Ayam', 'Mie', 'Warteg'
  price_tier int, -- Estimasi harga maksimal (misal: 15000, 25000)
  location geography(point) not null, -- Kordinat lokasi untuk perhitungan jarak
  hygiene_score int default 100, -- Base score 100
  is_verified_safe boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Hygiene Reports (Flag Kebersihan)
create table hygiene_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  restaurant_id uuid references restaurants(id) not null,
  report_type text not null, -- 'RED_FLAG' atau 'CLEAN'
  description text, -- "Banyak lalat di etalase"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel User History (Riwayat Gacha/Makan)
create table user_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  restaurant_id uuid references restaurants(id) not null,
  budget_used int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);