-- Custom foods: admin-created foods that persist across sessions
CREATE TABLE IF NOT EXISTS custom_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,   -- per 100g
  protein numeric NOT NULL DEFAULT 0,    -- per 100g
  carbs numeric NOT NULL DEFAULT 0,      -- per 100g
  fat numeric NOT NULL DEFAULT 0,        -- per 100g
  unit text NOT NULL DEFAULT 'g',        -- e.g. "g", "unidad (50g)", "scoop (30g)"
  category text NOT NULL DEFAULT 'other',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- Admin can read and insert
CREATE POLICY "admin_select_custom_foods" ON custom_foods
  FOR SELECT USING (is_admin());
CREATE POLICY "admin_insert_custom_foods" ON custom_foods
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_delete_custom_foods" ON custom_foods
  FOR DELETE USING (is_admin());

-- Index for fast lookup by name
CREATE INDEX idx_custom_foods_name ON custom_foods (lower(name));
