-- ==========================================================
-- GACHA MAKAN - MASTER DATA SEED
-- Deskripsi: Data awal untuk testing fitur Spin & Map.
-- Cara Pakai: Copy-paste isi file ini ke SQL Editor Supabase.
-- ==========================================================

-- 1. Bersihkan data lama (Opsional, agar tidak duplikat saat testing)
-- DELETE FROM hygiene_reports;
-- DELETE FROM restaurants;

-- 2. Masukkan Data Warung/Restoran
-- PENTING: Untuk koordinat POINT, formatnya adalah (Longitude, Latitude).
-- Jatinangor Longitude sekitar 107.77xx, Latitude sekitar -6.92xx.

INSERT INTO restaurants (name, category, price_tier, location, hygiene_score, is_verified_safe)
VALUES 
  -- AREA CISEKE (High-end, near main gate)
  (
    'Ayam Geprek Pangeran Ciseke', 
    'Ayam', 
    20000, 
    ST_GeographyFromText('POINT(107.774435 -6.927781)'), 
    100, 
    true
  ),
  (
    'Warteg Bahari Ciseke', 
    'Warteg', 
    15000, 
    ST_GeographyFromText('POINT(107.773850 -6.928500)'), 
    85, 
    true
  ),
  (
    'Mie Gacoan Jatinangor', 
    'Mie', 
    15000, 
    ST_GeographyFromText('POINT(107.771144 -6.926224)'), 
    95, 
    true
  ),
  (
    'Soto Ayam Ciseke Premium',
    'Sup',
    18000,
    ST_GeographyFromText('POINT(107.774100 -6.927200)'),
    92,
    true
  ),

  -- AREA SAYANG (Mid-range, student-friendly)
  (
    'Ayam Serundeng SPG Sayang', 
    'Ayam', 
    18000, 
    ST_GeographyFromText('POINT(107.770500 -6.930100)'), 
    90, 
    true
  ),
  (
    'Nasi Kuning Sayang',
    'Nasi',
    12000,
    ST_GeographyFromText('POINT(107.770800 -6.930300)'),
    78,
    true
  ),
  (
    'Bakso Sayang Mantep',
    'Bakso',
    14000,
    ST_GeographyFromText('POINT(107.770200 -6.929800)'),
    88,
    true
  ),
  (
    'Warteg Sayang (Contoh Red Flag)', 
    'Warteg', 
    12000, 
    ST_GeographyFromText('POINT(107.771000 -6.931000)'), 
    40, 
    false
  ),

  -- AREA HEGARMANAH / GKPN (Budget-friendly)
  (
    'Kantin Jatinangor ITB', 
    'Campur', 
    15000, 
    ST_GeographyFromText('POINT(107.770000 -6.925000)'), 
    100, 
    true
  ),
  (
    'Nasi Goreng Hegarmanah',
    'Nasi',
    11000,
    ST_GeographyFromText('POINT(107.769500 -6.924500)'),
    70,
    false
  ),
  (
    'Sate Ayam Budget',
    'Sate',
    13000,
    ST_GeographyFromText('POINT(107.769800 -6.924800)'),
    75,
    true
  ),

  -- AREA UJUNGBERUNG (Far, but good options)
  (
    'Ayam Bakar Ujung',
    'Ayam',
    22000,
    ST_GeographyFromText('POINT(107.768000 -6.922000)'),
    94,
    true
  ),
  (
    'Warung Apu Ujung',
    'Warteg',
    13000,
    ST_GeographyFromText('POINT(107.767800 -6.921500)'),
    65,
    false
  ),

  -- AREA MARGAHAYU (Premium cluster)
  (
    'Steak House Margahayu',
    'Steak',
    25000,
    ST_GeographyFromText('POINT(107.776000 -6.930500)'),
    98,
    true
  ),
  (
    'Nasi Padang Margahayu',
    'Padang',
    16000,
    ST_GeographyFromText('POINT(107.776500 -6.931000)'),
    86,
    true
  );

-- 3. Masukkan Contoh Laporan Higienitas (Untuk testing Map Red Flag)
-- Restaurant_id harus disesuaikan dengan ID asli dari tabel restaurants.
-- Bagian ini opsional, bisa diisi manual nanti di aplikasi.

-- INSERT INTO hygiene_reports (restaurant_id, issue_description)
-- VALUES 
--   ((SELECT id FROM restaurants WHERE name = 'Warteg X (Contoh Red Flag)' LIMIT 1), 'Ditemukan lalat di area penyajian makanan.');