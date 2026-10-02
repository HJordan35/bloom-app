-- Adding a bro (Bloom uses Supabase Auth since migration 003)
--
-- 1. Dashboard → Authentication → Users → Add user
--    Email + password, tick "Auto Confirm User".
-- 2. Run this, with their details:

insert into bros (first_name, last_name, email, auth_id)
select 'First', 'Last', u.email, u.id
from auth.users u
where u.email = 'bro@example.com';

-- Reset a password: Dashboard → Authentication → Users → (bro) → Reset password,
-- or delete and re-add the auth user, then:
-- update bros set auth_id = (select id from auth.users where email = 'bro@example.com')
-- where email = 'bro@example.com';
