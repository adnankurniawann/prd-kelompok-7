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
  -- AREA CISEKE
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
    false
  ),
  (
    'Mie Gacoan Jatinangor', 
    'Mie', 
    15000, 
    ST_GeographyFromText('POINT(107.771144 -6.926224)'), 
    95, 
    true
  ),

  -- AREA SAYANG
  (
    'Ayam Serundeng SPG Sayang', 
    'Ayam', 
    18000, 
    ST_GeographyFromText('POINT(107.770500 -6.930100)'), 
    90, 
    true
  ),
  (
    'Warteg X (Contoh Red Flag)', 
    'Warteg', 
    12000, 
    ST_GeographyFromText('POINT(107.772000 -6.929500)'), 
    40, -- Skor rendah untuk testing filter higienitas
    false
  ),

  -- AREA HEGARMANAH / GKPN
  (
    'Kantin Jatinangor ITB', 
    'Campur', 
    15000, 
    ST_GeographyFromText('POINT(107.770000 -6.925000)'), 
    100, 
    true
  );

-- 3. Masukkan Contoh Laporan Higienitas (Untuk testing Map Red Flag)
-- Restaurant_id harus disesuaikan dengan ID asli dari tabel restaurants.
-- Bagian ini opsional, bisa diisi manual nanti di aplikasi.

-- INSERT INTO hygiene_reports (restaurant_id, issue_description)
-- VALUES 
--   ((SELECT id FROM restaurants WHERE name = 'Warteg X (Contoh Red Flag)' LIMIT 1), 'Ditemukan lalat di area penyajian makanan.');