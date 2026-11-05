CREATE TABLE cafe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cafe_member (
  cafe_id UUID NOT NULL REFERENCES cafe(id),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cafe_id, user_id)
);

CREATE INDEX cafe_member_user_id_idx
  ON cafe_member(user_id);