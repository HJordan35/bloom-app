-- Adding a bro (Bloom uses Supabase Auth since migration 003)
--
-- 1. Dashboard → Authentication → Users → Add user
--    Email + password, tick "Auto Confirm User".
-- 2. Run this, with their details:

insert into bros (first_name, last_name, email, auth_id)
select 'First', 'Last', u.email, u.id
from auth.users u
where u.email = 'bro@example.com';

-- Reset a password (takes effect on their next sign-in):
-- update auth.users
-- set encrypted_password = extensions.crypt('new-password', extensions.gen_salt('bf'))
-- where email = 'bro@example.com';
--
-- Don't use the dashboard's "Send password recovery": it emails a link,
-- but the app has no page for choosing a new password.
