-- Add bros manually. Replace names, emails, and passwords, then run in the SQL editor.

insert into bros (first_name, last_name, email, password_hash) values
  ('Henry', 'Jordan', 'henry@example.com', extensions.crypt('change-me', extensions.gen_salt('bf'))),
  ('Second', 'Bro', 'bro@example.com', extensions.crypt('change-me', extensions.gen_salt('bf')));

-- Reset a password:
-- update bros set password_hash = extensions.crypt('new-password', extensions.gen_salt('bf'))
-- where email = 'bro@example.com';
