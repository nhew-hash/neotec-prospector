-- Optional seed data mirroring src/lib/auth/seed.ts. Passwords are bcrypt
-- hashes of "neotec123" (admin) and "vendas123" (vendedora) — change them
-- immediately after first login in a real deployment.
insert into users (id, name, email, password_hash, role, phone, status, monthly_goal, weekly_goal, commission_pct)
values
  ('00000000-0000-0000-0000-000000000001', 'Administrador Neotec', 'admin@neotec.com.br',
   '$2b$10$3euP8m8m0m1o8G8u2b3wZuO9m3d0iC0s6rQeYQ8qk8t1q3f8b2m0e', 'admin', '(34) 99999-0000', 'ativo', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000002', 'Ana Souza', 'ana@neotec.com.br',
   '$2b$10$0m4rV0nS8mQe3f0h8c1a1uQe6h9r0m1s8m3q0r7t9p2k4s6d8f0aC', 'vendedora', '(34) 98888-1111', 'ativo', 15000, 3750, 10)
on conflict (id) do nothing;

-- NOTE: the hashes above are placeholders for reference only — the app's
-- own seed script (src/lib/auth/seed.ts, run automatically on first use of
-- the local store) generates real bcrypt hashes at runtime. If you seed
-- Supabase manually, generate fresh hashes with bcryptjs instead of
-- copying these.
