-- Run this command in your Supabase SQL Editor to add the archiving column
ALTER TABLE complaints ADD COLUMN is_archived boolean DEFAULT false;
