-- Bloom: a title for each coach chat, for the list of earlier chats (Brew Coach, phase A4)
-- The first line the bro sent, set by the coach function on a chat's first turn.

alter table coach_chats add column title text;

-- Chats from before this: their first user line
update coach_chats c
set title = (
  select left(part ->> 'text', 80)
  from jsonb_array_elements(c.messages) with ordinality as m (message, n),
    jsonb_array_elements(m.message -> 'parts') as part
  where m.message ->> 'role' = 'user' and part ->> 'type' = 'text'
  order by m.n
  limit 1
);
