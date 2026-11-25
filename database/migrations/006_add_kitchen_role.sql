BEGIN;

ALTER TABLE cafe_member
  DROP CONSTRAINT cafe_member_role_check;

ALTER TABLE cafe_member
  ADD CONSTRAINT cafe_member_role_check
  CHECK (role IN ('owner', 'staff', 'kitchen'));

COMMIT;