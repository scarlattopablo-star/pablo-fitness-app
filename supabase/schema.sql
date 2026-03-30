-- =============================================
-- PABLO SCARLATTO ENTRENAMIENTOS - Database Schema
-- =============================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Surveys
CREATE TABLE public.surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('hombre', 'mujer')),
  weight NUMERIC(5,1) NOT NULL,
  height NUMERIC(5,1) NOT NULL,
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentario', 'moderado', 'activo', 'muy-activo')),
  dietary_restrictions TEXT[] DEFAULT '{}',
  objective TEXT NOT NULL,
  -- Calculated macros
  tmb INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fats INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Plans catalog
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  includes TEXT[] DEFAULT '{}',
  icon TEXT,
  color TEXT,
  price_1_month NUMERIC(10,2) DEFAULT 50,
  price_3_months NUMERIC(10,2) DEFAULT 120,
  price_6_months NUMERIC(10,2) DEFAULT 200,
  price_1_year NUMERIC(10,2) DEFAULT 300,
  couple_price_1_month NUMERIC(10,2) DEFAULT 80,
  couple_price_3_months NUMERIC(10,2) DEFAULT 190,
  couple_price_6_months NUMERIC(10,2) DEFAULT 320,
  couple_price_1_year NUMERIC(10,2) DEFAULT 480,
  is_couple BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  duration TEXT NOT NULL CHECK (duration IN ('1-mes', '3-meses', '6-meses', '1-ano')),
  amount_paid NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  mercadopago_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Exercise categories
CREATE TABLE public.exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 6. Exercises
CREATE TABLE public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.exercise_categories(id),
  muscle_group TEXT NOT NULL,
  description TEXT,
  steps TEXT[] DEFAULT '{}',
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Training plans (assigned to users)
CREATE TABLE public.training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  week_number INTEGER DEFAULT 1,
  data JSONB NOT NULL, -- stores full training plan structure
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Nutrition plans (assigned to users)
CREATE TABLE public.nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  data JSONB NOT NULL, -- stores full meal plan structure
  important_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Progress entries
CREATE TABLE public.progress_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,1),
  chest NUMERIC(5,1),
  waist NUMERIC(5,1),
  hips NUMERIC(5,1),
  arms NUMERIC(5,1),
  legs NUMERIC(5,1),
  photo_front TEXT, -- storage URL
  photo_side TEXT,
  photo_back TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  mercadopago_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Plans: everyone can read
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admin can manage plans" ON public.plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Exercises: everyone can read
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Admin can manage exercises" ON public.exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Surveys: users can manage their own
CREATE POLICY "Users can manage own surveys" ON public.surveys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all surveys" ON public.surveys FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Subscriptions: users can view own, admins can manage all
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Training/Nutrition plans: users can view own
CREATE POLICY "Users can view own training plans" ON public.training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage training plans" ON public.training_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Users can view own nutrition plans" ON public.nutrition_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage nutrition plans" ON public.nutrition_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Progress: users can manage own
CREATE POLICY "Users can manage own progress" ON public.progress_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all progress" ON public.progress_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Payments: users can view own
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED: Insert 10 plans
-- =============================================

INSERT INTO public.plans (slug, name, short_description, icon, color, is_couple) VALUES
  ('quema-grasa', 'Quema Grasa', 'Pierde grasa corporal de forma efectiva y sostenible', 'Flame', '#FF4444', false),
  ('ganancia-muscular', 'Ganancia Muscular', 'Aumenta tu masa muscular con un plan progresivo', 'Dumbbell', '#4CAF50', false),
  ('tonificacion', 'Tonificación', 'Define tu cuerpo sin ganar volumen excesivo', 'Sparkles', '#FF9800', false),
  ('principiante-total', 'Principiante Total', 'Tu primer paso hacia una vida fitness', 'GraduationCap', '#2196F3', false),
  ('rendimiento-deportivo', 'Rendimiento Deportivo', 'Mejora tu rendimiento en tu deporte', 'Trophy', '#9C27B0', false),
  ('post-parto', 'Post-Parto', 'Recupera tu cuerpo después del embarazo', 'Heart', '#E91E63', false),
  ('fuerza-funcional', 'Fuerza Funcional', 'Fuerza real para tu vida diaria', 'Shield', '#607D8B', false),
  ('recomposicion-corporal', 'Recomposición Corporal', 'Pierde grasa y gana músculo a la vez', 'RefreshCw', '#00BCD4', false),
  ('plan-pareja', 'Plan Pareja', 'Entrenen juntos, crezcan juntos', 'Users', '#FF5722', true),
  ('competicion', 'Competición', 'Prepárate para competir como profesional', 'Medal', '#FFD700', false);

-- Seed exercise categories
INSERT INTO public.exercise_categories (slug, name, sort_order) VALUES
  ('pecho', 'Pecho', 1),
  ('espalda', 'Espalda', 2),
  ('hombros', 'Hombros', 3),
  ('biceps', 'Bíceps', 4),
  ('triceps', 'Tríceps', 5),
  ('piernas', 'Piernas', 6),
  ('abdomen', 'Abdomen', 7),
  ('cardio', 'Cardio', 8);

-- Set Pablo as admin (update after he registers)
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'scarlattopablo@gmail.com';
