import { createClient } from "@supabase/supabase-js";

// Clean the URL supplied by users from trailing rest endpoints
const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://oixqnryeiqnqjoammcrx.supabase.co";
const cleanUrl = rawUrl.replace("/rest/v1/", "").replace(/\/$/, "");

const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_WrTopXPrhrWGiGq18vlXyQ_04AMD0de";

export const supabase = createClient(cleanUrl, anonKey);

// SQL helper query for user to copy paste in Supabase SQL editor to create the table
export const SUPABASE_SQL_HELPER = `
-- Crea la tabla para almacenar el progreso de tu huerto en Supabase:
CREATE TABLE IF NOT EXISTS public.medicinal_garden (
    id TEXT PRIMARY KEY,
    plant_id TEXT NOT NULL,
    custom_name TEXT,
    plant_info JSONB NOT NULL,
    location TEXT NOT NULL,
    planted_at TIMESTAMPTZ NOT NULL,
    last_watered_at TIMESTAMPTZ NOT NULL,
    progress_percentage INT NOT NULL DEFAULT 0,
    current_stage TEXT NOT NULL DEFAULT 'Brote / Semilla',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegúrate de habilitar RLS o permitir acceso anónimo temporalmente para pruebas:
ALTER TABLE public.medicinal_garden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir accesos de lectura y escritura anónimos" 
ON public.medicinal_garden FOR ALL USING (true) WITH CHECK (true);
`;
