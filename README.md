# Bet And Vote · Porra Electoral 29N

Aplicación web de porra electoral para las elecciones generales del 29 de noviembre (Congreso de los Diputados y Senado), construida con **React + Vite + TypeScript + Tailwind CSS + Lucide Icons** y backend **Supabase (Google OAuth + PostgreSQL RLS)**.

## Características principales

1. **Porra Provincial (Congreso)**:
   - 52 circunscripciones (50 provincias + Ceuta y Melilla = 350 escaños) con filtro territorial de partidos.
   - Introducción rápida por porcentaje de voto (`%`) y cálculo dinámico de escaños mediante el **método D'Hondt** (barrera mínima del `3%`).
   - Indicadores en tiempo real del **último escaño** asignado y del **siguiente escaño** en disputa con su distancia porcentual exacta.
   - En base de datos (`provincial_predictions`) se almacenan únicamente los escaños resultantes (`seats`).
   - Hemiciclo global acumulado y **Ránking Único Provincial** ordenado de menor a mayor desviación total (`ASC`).

2. **Porra Estatal por Escaños (Congreso)**:
   - Introducción directa de escaños para los 16 partidos nacionales validando la suma exacta de `350` escaños (mayoría absoluta en `176`).
   - **Ránking Estatal de Escaños** (`ASC`).

3. **Porra Estatal por Porcentaje (Congreso)**:
   - Introducción directa de porcentaje de voto (`0.0%` a `100.0%`) para los 16 partidos nacionales validando que la suma no supere el `100%`.
   - **Ránking Estatal de Porcentajes** (`ASC`).

4. **Porra del Senado (Estatal por Escaños)**:
   - Introducción directa de escaños para los 7 partidos del Senado (`PP`, `Senado de Progreso`, `VOX`, `ERC`, `Junts`, `PNV`, `EH Bildu`).
   - **Ránking del Senado** (`ASC`).

5. **Resultados en Tiempo Real y Reglas Temporales**:
   - Sincronización periódica con `https://datos.generales29n.com` mediante el hook `useLiveResults`.
   - Cierre automático de modificaciones el **domingo 29 de noviembre de 2026 a las 09:00h (hora peninsular española: `2026-11-29 09:00:00+01`)**, bloqueando escrituras tanto en la interfaz como en Supabase mediante políticas RLS.

## Configuración de Base de Datos (Supabase)

Ejecuta el script [`supabase/schema.sql`](./supabase/schema.sql) en el **SQL Editor** de tu proyecto de Supabase para crear las tablas (`profiles`, `provincial_predictions`, `national_seat_predictions`, `national_pct_predictions`, `senate_predictions`), el trigger automático de Google OAuth y las políticas RLS.
