-- A third role: super_admin.
--
-- admin runs the board — standards, approvals, email, applicants, import.
-- super_admin also holds the team and the money: invites, role changes, the
-- activity list, every rate and the finances.
--
-- APPLIED to the live database on 2026-09-19. Kept as the record of what was
-- run, and so a fresh database gets the same shape.
--
-- Run it through the SQL endpoint over SSH on the VM; PostgREST cannot do DDL
-- and the database is not reachable from a laptop. See docs/DEPLOYMENT.md,
-- "Running SQL against it".
--
-- The live constraint was named `ccm_user_role_check` — from when the board
-- was /ccm — rather than anything matching the table's current name, which is
-- why this finds it rather than guessing.

DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
     WHERE rel.relname = 'content_automation_user'
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE content_automation_user DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE content_automation_user
  ADD CONSTRAINT content_automation_user_role_check
  CHECK (role IN ('super_admin', 'admin', 'member'));

-- What the roles are now:
SELECT role, count(*) FROM content_automation_user GROUP BY role ORDER BY role;
