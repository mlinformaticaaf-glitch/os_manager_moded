-- Update handle_service_order_finance trigger to include 'completed' status
CREATE OR REPLACE FUNCTION handle_service_order_finance()
RETURNS TRIGGER AS $$
DECLARE
  v_os_number TEXT;
  v_transaction_id UUID;
BEGIN
  -- When status changes to 'delivered' or 'completed', create an income transaction
  -- OR when already in these statuses and totals/payment change
  IF (NEW.status = 'delivered' OR NEW.status = 'completed') THEN
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
        COALESCE(NEW.completed_at::date, CURRENT_DATE), 
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
        END,
        due_date = COALESCE(due_date, NEW.completed_at::date, CURRENT_DATE)
      WHERE id = v_transaction_id;
    END IF;
  END IF;

  -- Handle cancellation specifically
  IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    UPDATE financial_transactions
    SET status = 'cancelled'
    WHERE reference_id = NEW.id AND (category = 'service_order' OR category = 'services');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
