-- =============================================================================
-- BET AND VOTE - ESQUEMA DE BASE DE DATOS SUPABASE (PostgreSQL)
-- Cierre de porras: Domingo 29 de noviembre de 2026 a las 09:00h (hora peninsular)
-- Timestamp límite: '2026-11-29 09:00:00+01'::timestamptz
-- =============================================================================

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función auxiliar para comprobar si la porra sigue abierta
CREATE OR REPLACE FUNCTION public.is_betting_open()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT now() < '2026-11-29 09:00:00+01'::timestamptz;
$$;

-- Función y trigger genérico para mantener actualizado el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 1. TABLA: profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger automático que copia nombre y avatar al iniciar sesión / registrarse con Google
CREATE OR REPLACE FUNCTION public.handle_google_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Participante'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.profiles.full_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.profiles.avatar_url
    ),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_or_updated ON auth.users;
CREATE TRIGGER on_auth_user_created_or_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_google_auth_user();

-- Sincronización inicial por si ya existen usuarios en auth.users
INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    'Participante'
  ),
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  updated_at = now();

-- =============================================================================
-- 2. TABLA: provincial_predictions
-- Nota: Aunque en la UI el usuario introduce porcentajes para calcular D'Hondt,
-- en base de datos SOLO se guardan los escaños resultantes (seats).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.provincial_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  province_code TEXT NOT NULL,
  party_code TEXT NOT NULL,
  seats INT NOT NULL CHECK (seats >= 0 AND seats <= 350),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT provincial_predictions_user_province_party_key UNIQUE (user_id, province_code, party_code)
);

CREATE INDEX IF NOT EXISTS idx_provincial_predictions_user_id ON public.provincial_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_provincial_predictions_province ON public.provincial_predictions(province_code);

DROP TRIGGER IF EXISTS set_provincial_predictions_updated_at ON public.provincial_predictions;
CREATE TRIGGER set_provincial_predictions_updated_at
  BEFORE UPDATE ON public.provincial_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 3. TABLA: national_seat_predictions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.national_seat_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_code TEXT NOT NULL,
  seats INT NOT NULL CHECK (seats >= 0 AND seats <= 350),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT national_seat_predictions_user_party_key UNIQUE (user_id, party_code)
);

CREATE INDEX IF NOT EXISTS idx_national_seat_predictions_user_id ON public.national_seat_predictions(user_id);

DROP TRIGGER IF EXISTS set_national_seat_predictions_updated_at ON public.national_seat_predictions;
CREATE TRIGGER set_national_seat_predictions_updated_at
  BEFORE UPDATE ON public.national_seat_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 4. TABLA: national_pct_predictions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.national_pct_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_code TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT national_pct_predictions_user_party_key UNIQUE (user_id, party_code)
);

CREATE INDEX IF NOT EXISTS idx_national_pct_predictions_user_id ON public.national_pct_predictions(user_id);

DROP TRIGGER IF EXISTS set_national_pct_predictions_updated_at ON public.national_pct_predictions;
CREATE TRIGGER set_national_pct_predictions_updated_at
  BEFORE UPDATE ON public.national_pct_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 5. TABLA: senate_predictions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.senate_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_code TEXT NOT NULL,
  seats INT NOT NULL CHECK (seats >= 0 AND seats <= 300),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT senate_predictions_user_party_key UNIQUE (user_id, party_code)
);

CREATE INDEX IF NOT EXISTS idx_senate_predictions_user_id ON public.senate_predictions(user_id);

DROP TRIGGER IF EXISTS set_senate_predictions_updated_at ON public.senate_predictions;
CREATE TRIGGER set_senate_predictions_updated_at
  BEFORE UPDATE ON public.senate_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (RLS)
-- - SELECT público para todos los usuarios autenticados en todas las tablas.
-- - INSERT / UPDATE / DELETE permitido únicamente cuando auth.uid() = user_id
--   (o id en profiles) y la fecha actual sea anterior a 2026-11-29 09:00:00+01.
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provincial_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_seat_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_pct_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senate_predictions ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own_before_deadline" ON public.profiles;
CREATE POLICY "profiles_insert_own_before_deadline"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "profiles_update_own_before_deadline" ON public.profiles;
CREATE POLICY "profiles_update_own_before_deadline"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  )
  WITH CHECK (
    auth.uid() = id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "profiles_delete_own_before_deadline" ON public.profiles;
CREATE POLICY "profiles_delete_own_before_deadline"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

-- 2. Políticas para provincial_predictions
DROP POLICY IF EXISTS "provincial_predictions_select_authenticated" ON public.provincial_predictions;
CREATE POLICY "provincial_predictions_select_authenticated"
  ON public.provincial_predictions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "provincial_predictions_insert_own_before_deadline" ON public.provincial_predictions;
CREATE POLICY "provincial_predictions_insert_own_before_deadline"
  ON public.provincial_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "provincial_predictions_update_own_before_deadline" ON public.provincial_predictions;
CREATE POLICY "provincial_predictions_update_own_before_deadline"
  ON public.provincial_predictions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  )
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "provincial_predictions_delete_own_before_deadline" ON public.provincial_predictions;
CREATE POLICY "provincial_predictions_delete_own_before_deadline"
  ON public.provincial_predictions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

-- 3. Políticas para national_seat_predictions
DROP POLICY IF EXISTS "national_seat_predictions_select_authenticated" ON public.national_seat_predictions;
CREATE POLICY "national_seat_predictions_select_authenticated"
  ON public.national_seat_predictions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "national_seat_predictions_insert_own_before_deadline" ON public.national_seat_predictions;
CREATE POLICY "national_seat_predictions_insert_own_before_deadline"
  ON public.national_seat_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "national_seat_predictions_update_own_before_deadline" ON public.national_seat_predictions;
CREATE POLICY "national_seat_predictions_update_own_before_deadline"
  ON public.national_seat_predictions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  )
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "national_seat_predictions_delete_own_before_deadline" ON public.national_seat_predictions;
CREATE POLICY "national_seat_predictions_delete_own_before_deadline"
  ON public.national_seat_predictions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

-- 4. Políticas para national_pct_predictions
DROP POLICY IF EXISTS "national_pct_predictions_select_authenticated" ON public.national_pct_predictions;
CREATE POLICY "national_pct_predictions_select_authenticated"
  ON public.national_pct_predictions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "national_pct_predictions_insert_own_before_deadline" ON public.national_pct_predictions;
CREATE POLICY "national_pct_predictions_insert_own_before_deadline"
  ON public.national_pct_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "national_pct_predictions_update_own_before_deadline" ON public.national_pct_predictions;
CREATE POLICY "national_pct_predictions_update_own_before_deadline"
  ON public.national_pct_predictions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  )
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "national_pct_predictions_delete_own_before_deadline" ON public.national_pct_predictions;
CREATE POLICY "national_pct_predictions_delete_own_before_deadline"
  ON public.national_pct_predictions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

-- 5. Políticas para senate_predictions
DROP POLICY IF EXISTS "senate_predictions_select_authenticated" ON public.senate_predictions;
CREATE POLICY "senate_predictions_select_authenticated"
  ON public.senate_predictions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "senate_predictions_insert_own_before_deadline" ON public.senate_predictions;
CREATE POLICY "senate_predictions_insert_own_before_deadline"
  ON public.senate_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "senate_predictions_update_own_before_deadline" ON public.senate_predictions;
CREATE POLICY "senate_predictions_update_own_before_deadline"
  ON public.senate_predictions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  )
  WITH CHECK (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );

DROP POLICY IF EXISTS "senate_predictions_delete_own_before_deadline" ON public.senate_predictions;
CREATE POLICY "senate_predictions_delete_own_before_deadline"
  ON public.senate_predictions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < '2026-11-29 09:00:00+01'::timestamptz
  );
