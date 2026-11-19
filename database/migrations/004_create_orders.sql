CREATE TABLE cafe_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafe(id),
  request_id UUID NOT NULL,
  customer_name TEXT NOT NULL
    CHECK (length(trim(customer_name)) BETWEEN 1 AND 100),
  customer_phone TEXT NOT NULL
    CHECK (length(trim(customer_phone)) BETWEEN 7 AND 20),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'accepted',
        'preparing',
        'ready',
        'completed',
        'cancelled'
      )
    ),
  total NUMERIC(14, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, request_id)
);

CREATE TABLE order_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cafe_order(id),
  menu_item_id UUID REFERENCES menu_item(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99)
);

CREATE INDEX cafe_order_cafe_created_idx
  ON cafe_order(cafe_id, created_at DESC);

CREATE INDEX order_item_order_id_idx
  ON order_item(order_id);