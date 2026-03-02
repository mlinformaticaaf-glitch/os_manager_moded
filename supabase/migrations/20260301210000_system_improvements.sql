-- Migration: 20260301210000_system_improvements.sql
-- Description: Implement triggers for stock/finance, ID binding for stock, and status history.

-- 1. Add product_id to service_order_items (if not exists)
ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- 2. Create service_order_logs table for status history
CREATE TABLE IF NOT EXISTS service_order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for the logs table
ALTER TABLE service_order_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their own service orders"
  ON service_order_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = service_order_logs.service_order_id
      AND service_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their own service orders"
  ON service_order_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = service_order_logs.service_order_id
      AND service_orders.user_id = auth.uid()
    )
  );

-- 3. Functions and Triggers for Stock Management

-- Function to handle stock on status change (delivered/cancelled)
CREATE OR REPLACE FUNCTION handle_service_order_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct stock when status changes to 'delivered' and stock wasn't deducted yet
  IF (NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.stock_deducted = false) THEN
    UPDATE products
    SET stock_quantity = stock_quantity - items.quantity
    FROM (
      SELECT product_id, quantity 
      FROM service_order_items 
      WHERE service_order_id = NEW.id AND type = 'product' AND product_id IS NOT NULL
    ) AS items
    WHERE products.id = items.product_id;
    
    NEW.stock_deducted := true;
    NEW.delivered_at := now();
  END IF;

  -- Return stock when status changes from 'delivered' to 'cancelled' (or anything else if needed)
  IF (NEW.status = 'cancelled' AND OLD.status = 'delivered' AND NEW.stock_deducted = true) THEN
    UPDATE products
    SET stock_quantity = stock_quantity + items.quantity
    FROM (
      SELECT product_id, quantity 
      FROM service_order_items 
      WHERE service_order_id = NEW.id AND type = 'product' AND product_id IS NOT NULL
    ) AS items
    WHERE products.id = items.product_id;
    
    NEW.stock_deducted := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for status change logging
CREATE OR REPLACE FUNCTION log_service_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change on update
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.status != OLD.status) THEN
      INSERT INTO service_order_logs (service_order_id, user_id, old_status, new_status)
      VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
    END IF;
  -- Log initial status on insert
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO service_order_logs (service_order_id, user_id, old_status, new_status)
    VALUES (NEW.id, NEW.user_id, NULL, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Financial Transaction Trigger
CREATE OR REPLACE FUNCTION handle_service_order_finance()
RETURNS TRIGGER AS $$
DECLARE
  v_os_number TEXT;
  v_transaction_id UUID;
BEGIN
  -- When status changes to 'delivered', create an income transaction
  -- OR when already delivered and totals/payment change
  IF (NEW.status = 'delivered') THEN
    v_os_number := LPAD(NEW.order_number::text, 4, '0') || '/' || EXTRACT(YEAR FROM NEW.created_at)::text;
    
    -- Check if transaction already exists
    SELECT id INTO v_transaction_id FROM financial_transactions 
    WHERE reference_id = NEW.id AND category = 'service_order';
    
    IF v_transaction_id IS NULL THEN
      INSERT INTO financial_transactions (
        user_id, type, category, reference_id, description, amount, 
        due_date, status, payment_method, paid_date
      ) VALUES (
        NEW.user_id, 'income', 'service_order', NEW.id, 'OS ' || v_os_number, NEW.total,
        CURRENT_DATE, 
        CASE WHEN NEW.payment_status = 'paid' THEN 'paid' ELSE 'pending' END,
        NEW.payment_method,
        CASE WHEN NEW.payment_status = 'paid' THEN CURRENT_DATE ELSE NULL END
      );
    ELSE
      -- Update existing transaction if details changed
      UPDATE financial_transactions
      SET 
        amount = NEW.total,
        description = 'OS ' || v_os_number,
        status = CASE 
          WHEN NEW.payment_status = 'paid' THEN 'paid' 
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          ELSE 'pending' 
        END,
        payment_method = NEW.payment_method,
        paid_date = CASE 
          WHEN NEW.payment_status = 'paid' AND paid_date IS NULL THEN CURRENT_DATE 
          WHEN NEW.payment_status != 'paid' THEN NULL
          ELSE paid_date 
        END
      WHERE id = v_transaction_id;
    END IF;
  END IF;

  -- Handle cancellation specifically
  IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    UPDATE financial_transactions
    SET status = 'cancelled'
    WHERE reference_id = NEW.id AND category = 'service_order';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_handle_service_order_stock ON service_orders;
CREATE TRIGGER trg_handle_service_order_stock
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_service_order_stock();

DROP TRIGGER IF EXISTS trg_log_service_order_status_change ON service_orders;
CREATE TRIGGER trg_log_service_order_status_change
  AFTER INSERT OR UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_service_order_status_change();

DROP TRIGGER IF EXISTS trg_handle_service_order_finance ON service_orders;
CREATE TRIGGER trg_handle_service_order_finance
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_service_order_finance();
