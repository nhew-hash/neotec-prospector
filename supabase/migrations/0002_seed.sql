-- Optional seed data mirroring src/lib/auth/seed.ts. Passwords are real
-- bcrypt hashes of "neotec123" (admin) and "vendas123" (vendedora),
-- generated with bcryptjs at 10 salt rounds. Change them immediately after
-- first login in a real deployment.
insert into users (id, name, email, password_hash, role, phone, status, monthly_goal, weekly_goal, commission_pct)
values
  ('00000000-0000-0000-0000-000000000001', 'Administrador Neotec', 'admin@neotec.com.br',
   '$2b$10$/dOBg31/MNxV/o/giiSXUu6irUH.DIQwcbcpUhWO27UX5XuiLqKfu', 'admin', '(34) 99999-0000', 'ativo', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000002', 'Ana Souza', 'ana@neotec.com.br',
   '$2b$10$nTZue14IJ9JiNieUTiGQsuT.GxjWZGGlpVx0l/TUgR1655eVN1uAi', 'vendedora', '(34) 98888-1111', 'ativo', 15000, 3750, 10)
on conflict (id) do nothing;

-- To seed additional/real users, generate a fresh hash with bcryptjs
-- (bcrypt.hashSync('sua-senha', 10)) and insert a new row following the
-- same pattern — or use the "Nova vendedora" form in Configurações once
-- logged in as admin, which does this for you.
