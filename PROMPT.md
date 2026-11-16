Quiero construir y desplegar una 
aplicación web llamada **"Bet And 
Vote"** para hacer una porra 
electoral con mis amigos.
### 1. Identidad Visual, UX y Stack 
### Tecnológico
- **Nombre de la app**: Bet And Vote. 
- **Diseño**: Paleta limpia y moderna 
basada en tonos azules y blancos 
(`slate`, `blue-600`, `sky-500`, 
fondos blancos y azul muy claro). - 
**Enfoque UX**: Votar debe ser 
ultrarrápido, fluido e intuitivo 
desde móvil y escritorio (sliders 
sincronizados con inputs numéricos, 
navegación rápida entre provincias y 
guardado ágil con feedback 
instantáneo). - **Stack**: React + 
Vite + TypeScript + Tailwind CSS + 
Lucide Icons (compilación estática 
100% compatible con GitHub Pages). - 
**Backend y Auth**: Supabase 
(`@supabase/supabase-js`) usando 
Google OAuth. Las credenciales 
`VITE_SUPABASE_URL` y 
`VITE_SUPABASE_ANON_KEY` se leen 
desde `.env`. - **Sin roles de 
usuario**: Todos los usuarios son 
iguales; no existe rol de 
administrador ni panel de 
administración.
### 2. Reglas Temporales y Esquema de 
### Base de Datos 
### (`supabase/schema.sql`)
Genera el script SQL completo con 
tablas, triggers y políticas RLS: - 
**Cierre de porras**: Domingo 29 de 
noviembre a las 09:00h (hora 
peninsular española: `2026-11-29 
09:00:00+01`). Hasta ese instante 
exacto, cualquier usuario puede 
modificar sus votos todas las veces 
que quiera (`UPSERT`). A partir de 
esa fecha, la interfaz pasa a modo 
solo lectura y Supabase bloquea 
escrituras mediante RLS. - 
**Tablas**:
  1. `profiles`: (`id` UUID PK 
  referenciando `auth.users`, 
  `full_name`, `avatar_url`, 
  `updated_at`). Incluye un trigger 
  automático que copie nombre y 
  avatar al iniciar sesión con 
  Google. 2. 
  `provincial_predictions`: (`id`, 
  `user_id`, `province_code`, 
  `party_code`, `seats` int, 
  `updated_at`). Restricción 
  `UNIQUE(user_id, province_code, 
  party_code)`. **Importante**: 
  aunque en la UI el usuario 
  introduce porcentajes para calcular 
  D'Hondt, en base de datos SOLO se 
  guardan los escaños resultantes 
  (`seats`). 3. 
  `national_seat_predictions`: (`id`, 
  `user_id`, `party_code`, `seats` 
  int, `updated_at`). 
  `UNIQUE(user_id, party_code)`. 4. 
  `national_pct_predictions`: (`id`, 
  `user_id`, `party_code`, 
  `percentage` numeric(5,2), 
  `updated_at`). `UNIQUE(user_id, 
  party_code)`. 5. 
  `senate_predictions`: (`id`, 
  `user_id`, `party_code`, `seats` 
  int, `updated_at`). 
  `UNIQUE(user_id, party_code)`.
- **Políticas RLS**: - `SELECT` 
  público para todos los usuarios 
  autenticados en todas las tablas 
  (para calcular ránkings y permitir 
  ver los votos de otros usuarios). - 
  `INSERT / UPDATE / DELETE` 
  permitido únicamente cuando 
  `auth.uid() = user_id` y la fecha 
  actual sea anterior a `2026-11-29 
  09:00:00+01`.
### 3. Partidos Políticos y 
### Distribución Territorial
Configura como constantes maestras: - 
**52 circunscripciones** (50 
provincias + Ceuta y Melilla) con su 
reparto oficial de escaños (Total = 
350 escaños). - **Partidos del 
Congreso (16 en total)** con sus 
colores corporativos y siglas:
  `PP`, `PSOE`, `VOX`, `Frente 
  Amplio`, `Podemos`, `ERC`, `Junts`, 
  `BNG`, `PNV`, `EH Bildu`, `Adelante 
  Andalucía`, `Compromìs`, `Coalición 
  Canaria`, `UPC`, `SALF`, `Ara Mès`. 
  * En la **Porra Estatal (Escaños y 
  Porcentajes)** aparecen estos 16 
  partidos. * En la **Porra 
  Provincial**, filtra los partidos 
  según la provincia:
    - **En todas las provincias**: 
    `PP`, `PSOE`, `VOX` y `Frente 
    Amplio`. - **Galicia** (A Coruña, 
    Lugo, Ourense, Pontevedra): 
    añadir `BNG`. - **País Vasco** 
    (Álava, Bizkaia, Gipuzkoa): 
    añadir `PNV` y `EH Bildu`. - 
    **Navarra**: añadir `EH Bildu`. - 
    **Cataluña** (Barcelona, Girona, 
    Lleida, Tarragona): añadir 
    `Junts` y `ERC`. - **Madrid**: 
    añadir `Podemos` y `SALF`. - 
    **Comunidad Valenciana** 
    (Alicante, Castellón, Valencia): 
    añadir `Compromìs`. - 
    **Baleares**: añadir `Ara Mès`. - 
    **Andalucía** (Almería, Cádiz, 
    Córdoba, Granada, Huelva, Jaén, 
    Málaga, Sevilla): añadir 
    `Adelante Andalucía`. - 
    **Canarias** (Las Palmas, Santa 
    Cruz de Tenerife): añadir 
    `Coalición Canaria` y `UPC`.
- **Partidos del Senado (7 en 
total)**:
  `PP`, `Senado de Progreso`, `VOX`, 
  `ERC`, `Junts`, `PNV`, `EH Bildu`.
### 4. Resultados en Tiempo Real y 
### Reglas de Cálculo de Ránkings
- **Fuente en tiempo real**: Crea un 
servicio/hook (`useLiveResults`) que 
obtenga en tiempo real los resultados 
oficiales desde 
`https://datos.generales29n.com` (con 
polling periódico y estado de espera 
si el escrutinio aún no ha 
comenzado). - **Lógica común de todos 
los Ránkings**:
  - **Sin ránking combinado**: Cada 
  una de las 4 secciones muestra su 
  propio ránking integrado en su 
  vista. - **Ordenación de menos a 
  más desviación (`ASC`)**: En todos 
  los ránkings se ordena a los 
  participantes de **menor a mayor 
  desviación total**. Gana el usuario 
  con menor desviación (el que más se 
  acerque al resultado real; `0` 
  equivale a un acierto perfecto). En 
  caso de empate en desviación, queda 
  por delante quien haya guardado su 
  voto antes (`updated_at` más 
  antiguo). - **Cálculo sobre el 
  total oficial**: Para evitar que un 
  usuario con provincias o partidos 
  sin rellenar obtenga menor 
  desviación artificialmente, el 
  cálculo debe iterar siempre sobre 
  todos los partidos/provincias de 
  los resultados reales (tomando `0` 
  si el usuario dejó algún partido o 
  provincia sin asignar) e incluir en 
  el ránking a los usuarios que hayan 
  participado en esa porra. - **Ver 
  votos de otros usuarios**: En 
  cualquier ránking, al hacer clic 
  sobre el nombre de un usuario se 
  abre un modal o vista detallada con 
  el desglose completo de los votos 
  de ese usuario en esa sección.
### 5. Estructura de las 4 Secciones
#### Sección 1: Porra Provincial 
#### (Congreso)
- **Resumen superior con Hemiciclo**: 
Muestra en la parte superior el 
resumen global del voto provincial 
del usuario mediante un **gráfico del 
Parlamento (hemiciclo)** que suma los 
escaños acumulados por cada partido 
en todas las provincias votadas. - 
**Mecánica de voto (Porcentaje -> 
D'Hondt dinámico)**:
  - Selector rápido de las 52 
  provincias (mostrando cuáles están 
  ya completadas). - En cada 
  provincia, el usuario introduce el 
  **% de voto** de cada partido 
  disponible en esa circunscripción 
  (validando que la suma no supere el 
  100%). - El sistema calcula de 
  forma dinámica los escaños mediante 
  el **método D'Hondt** aplicando el 
  **mínimo del 3%** para entrar al 
  reparto. - **Resaltado en vivo**: 
  Destaca visualmente qué partido ha 
  obtenido el **último escaño** de la 
  provincia y qué partido se llevaría 
  el **siguiente escaño** (mostrando 
  a qué diferencia porcentual está de 
  conseguirlo). - Al guardar, se 
  almacenan en la base de datos 
  **únicamente los escaños 
  (`seats`)** de cada partido.
- **Ránking Único Provincial**: 
Ránking general único (no por 
provincia individual) donde la 
puntuación de cada usuario es la 
**suma total de todas las 
desviaciones de escaños en las 52 
provincias y todos sus partidos**:
  `Desviación Provincial Total = 
  SUM_provincias( SUM_partidos( 
  |escaños_usuario - escaños_reales| 
  ) )` Ordenado de menor a mayor 
  desviación.
#### Sección 2: Porra Estatal por 
#### Escaños (Congreso)
- Introducción directa de los escaños 
a nivel nacional para los 16 partidos 
(sin cálculo D'Hondt), validando que 
sumen 350 escaños y mostrando el 
hemiciclo con la mayoría absoluta en 
176. - **Ránking Estatal de 
Escaños**: Suma de las desviaciones 
absolutas de escaños de los 16 
partidos (`SUM(|escaños_usuario - 
escaños_reales|)`), ordenado de menor 
a mayor desviación.
#### Sección 3: Porra Estatal por 
#### Porcentaje (Congreso)
- Introducción directa del porcentaje 
de voto (`0.0%` a `100.0%`) para los 
16 partidos a nivel nacional, 
validando que la suma no supere el 
100%. - **Ránking Estatal de 
Porcentajes**: Suma de las 
desviaciones absolutas en puntos 
porcentuales de los 16 partidos 
(`SUM(|porcentaje_usuario - 
porcentaje_real|)`), ordenado de 
menor a mayor desviación.
#### Sección 4: Porra del Senado 
#### (Estatal por Escaños)
- Introducción directa de escaños a 
nivel estatal para los 7 partidos del 
Senado (`PP`, `Senado de Progreso`, 
`VOX`, `ERC`, `Junts`, `PNV`, `EH 
Bildu`). - **Ránking del Senado**: 
Suma de las desviaciones absolutas de 
escaños de los 7 partidos 
(`SUM(|escaños_usuario - 
escaños_reales|)`), ordenado de menor 
a mayor desviación.
### 6. GitHub y Publicación en GitHub 
### Pages
1. Verifica que el proyecto compile 
sin errores de TypeScript (`npm run 
build`). 2. Inicializa Git, crea un 
repositorio nuevo en GitHub llamado 
`bet-and-vote` usando GitHub CLI (`gh 
repo create bet-and-vote --public 
--source=. --remote=origin --push`). 
3. Configura `vite.config.ts` con el 
`base: '/bet-and-vote/'` 
correspondiente y crea un workflow de 
GitHub Actions 
(`.github/workflows/deploy.yml`) para 
publicar automáticamente la web en 
**GitHub Pages**.
