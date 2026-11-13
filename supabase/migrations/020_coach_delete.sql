-- Bloom: deleting a coach chat (Brew Coach, phase A6)
-- A bro can delete their own chats. The chat's turns stay, without the chat: they hold no
-- messages, only what the coach looked up and proposed, and the daily cap counts them.

create policy "delete your own" on coach_chats
  for delete to authenticated using (bro_id = (select current_bro_id()));

alter table coach_turns alter column chat_id drop not null;
alter table coach_turns drop constraint coach_turns_chat_id_fkey;
alter table coach_turns
  add constraint coach_turns_chat_id_fkey
  foreign key (chat_id) references coach_chats (id) on delete set null;
