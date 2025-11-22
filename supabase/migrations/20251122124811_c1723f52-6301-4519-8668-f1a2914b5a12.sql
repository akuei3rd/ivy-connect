-- Add foreign key constraint from session_registrations to profiles
ALTER TABLE session_registrations
ADD CONSTRAINT fk_session_registrations_user
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;