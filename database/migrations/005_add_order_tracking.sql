ALTER TABLE cafe_order
  ADD COLUMN tracking_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX cafe_order_tracking_token_idx
  ON cafe_order(tracking_token);