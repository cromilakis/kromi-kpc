# Infra de generación de documentos (HTML→PDF + QR) — Diseño (sub-proyecto #4)

Fecha: 2026-07-14
Estado: aprobado (pendiente de plan de implementación)

## Contexto

Cuarto sub-proyecto del programa "construcción de documentos" (ver
`2026-07-12-diagnostico-persistido-design.md`). #1 (diagnóstico persistido), #2
(diagnóstico asistido) y #3 (portal de detalle de brechas) ya están en `main`.
Este sub-proyecto construye la **infraestructura de generación de documentos
PDF** desde cero: no existe nada hoy. Es la base para #5 (documentos de
mitigación) y #7 (documento final de catastro + certificado).

Sustrato existente relevante:
- `company_diagnoses` (cabecera: `status active|superseded`, `source`,
  `answers`, `risk_level`, `total_breaches`) y `diagnosis_breaches` (fila por
  brecha: `breach_code`, `area`, `area_label`, `severity`, `articles`,
  `fine_min_utm`, `fine_max_utm`, `description`, `dimension`,
  `resolution_status`). **Snapshots inmutables** (#1).
- `lib/portal/load-diagnosis.server.ts` — loader del cliente con gate de pago
  (`service_paid_at` vía `company_client_view`) + RLS que ya exige pago (#3).
- `lib/legal/fine.ts` (`formatFineClp`) y `lib/portal/severity-tag.ts` (mapa de
  severidad) — reutilizables en el documento.
- Certificado: existe como fila + `/verify/[code]` (RPC `verify_certificate`).
  El código/hash (`lib/certificates/issue.server.ts`) es reutilizable; la
  *emisión sobre el nuevo modelo* es #7.
- No hay dependencia de PDF hoy. Stack: Next.js 16 en Vercel; Vercel Functions
  soportan hasta 5 GB, así que Chromium headless es viable.

## Objetivo

Un servicio reutilizable que renderice **HTML autocontenido → PDF** con
Chromium headless, un helper de **QR verificable** (`/verify/[code]`), y un
primer documento real de punta a punta: el **Informe de diagnóstico del
cliente**, descargable por el cliente (portal) y por el consultor (`/app`).

## Decisiones tomadas (con el usuario)

1. **Motor PDF:** HTML→PDF con **Chromium headless** (`puppeteer-core` +
   `@sparticuz/chromium`). Máxima fidelidad; reutiliza los tokens del design
   system vía CSS inline. Sin servicios externos (datos personales no salen a
   terceros — Ley 21.719).
2. **Almacenamiento:** **on-demand**, sin storage. Como las fuentes
   (`diagnosis_breaches`, cabecera, y en #7 la fila del certificado) son
   snapshots inmutables, regenerar es determinista y reproducible. Sin bucket,
   sin RLS de storage, sin tabla de metadata en #4.
3. **Primer documento:** **Informe de diagnóstico del cliente** (brechas
   persistidas). El QR/verify se construye como helper unit-tested y se cablea
   de verdad en #7 (certificado, el artefacto realmente verificable). **No** se
   pone un QR de adorno en el informe.
4. **Audiencia:** cliente (portal, gated a pagado) **y** consultor (`/app`).
5. **Chromium:** en Vercel usa el binario de `@sparticuz/chromium`; en local
   (Windows) usa el Chrome/Edge instalado vía `executablePath`
   (`PUPPETEER_EXECUTABLE_PATH`).

## Arquitectura y componentes

Principio: el render es el único módulo con navegador; los constructores de
documento son funciones **puras** (datos → HTML string), testeables sin Chromium.

- **`lib/documents/render.server.ts`** — `renderPdf(html, opts?): Promise<Buffer>`.
  Lanza Chromium con `puppeteer-core` + `@sparticuz/chromium`. Resolución del
  ejecutable, en orden: (a) `@sparticuz/chromium` en entorno serverless/Linux;
  (b) `process.env.PUPPETEER_EXECUTABLE_PATH`; (c) canal `chrome`. `setContent`
  → `page.pdf({ format: 'A4', printBackground: true, margin })`. Cierra el
  browser en `finally`. Único punto de I/O de navegador.
- **`lib/documents/layout.ts`** — *chrome* compartido:
  `renderDocument({ title, bodyHtml, meta, code?, qrDataUri? }): string`.
  Devuelve HTML autocontenido con `<style>` inline que replica tokens de marca
  (colores/tipografía). Cabecera de marca, pie con fecha de generación y folio,
  y un **bloque opcional código + QR** (para #7). Sin dependencia del pipeline
  Tailwind de la app.
- **`lib/documents/qr.ts`** — `qrDataUri(url): Promise<string>` (lib `qrcode` →
  data URI PNG) y `verifyUrl(code): string` (`${APP_URL}/verify/{code}`, base
  desde `NEXT_PUBLIC_APP_URL`/fallback). Helper reutilizable, unit-tested. No se
  usa en el informe de #4.
- **`lib/documents/diagnosis-report.ts`** — `buildDiagnosisReportHtml(data, dict):
  string` (puro): portada + resumen (nivel de riesgo, total de brechas) + tabla
  de brechas (área/`area_label`, severidad, multa `formatFineClp`). Reusa
  `lib/legal/fine.ts` y el mapa de severidad. Degradación: sin brechas → estado
  vacío coherente.
- **`lib/documents/load-report-data.server.ts`** — datos del diagnóstico activo
  + brechas + nombre/RUT de empresa. Dos entradas: `loadClientReportData()`
  (reusa el gate pagado + RLS de #3) y `loadCompanyReportData(companyId)`
  (consultor, RLS de equipo). Devuelve un tipo común `ReportData` o un estado
  de error (`no_paid` | `not_found` | `unavailable`).
- **`app/portal/evaluaciones/informe/route.ts`** — GET cliente, gated a pagado.
- **`app/app/companies/[id]/informe/route.ts`** — GET consultor (rol
  `consultant|admin`).
- Helper compartido **`lib/documents/respond-with-report.server.ts`**:
  `respondWithReportPdf(data, dict): Response` (construye HTML → `renderPdf` →
  `Response` con `application/pdf` + `Content-Disposition`). Mapea estados de
  error a códigos HTTP.
- **`components/documents/download-report-button.tsx`** — botón cliente
  (`fetch` → blob → descarga, con estado de error traducido). En el portal de
  Evaluaciones y en la página de empresa en `/app`.

## Flujo de datos

**Cliente:** botón `fetch('/portal/evaluaciones/informe')` → ruta valida sesión
+ gate de pago (`company_client_view`) → carga diagnóstico activo + brechas por
RLS → `getTranslations('documents')` → `buildDiagnosisReportHtml` →
`renderDocument` → `renderPdf` → `200 application/pdf` +
`Content-Disposition: attachment; filename="informe-diagnostico-<rut>.pdf"`. El
botón crea un blob y dispara la descarga.

**Consultor:** `GET /app/companies/[id]/informe` → valida sesión + rol → carga
por `companyId` (RLS equipo) → mismo render.

## Manejo de errores

La ruta responde con código; el botón traduce el estado (nunca descarga un
archivo roto):
- Sin sesión → `401`.
- No pagado (cliente) / rol no autorizado (consultor) → `403`.
- Sin diagnóstico activo → `404`.
- Fallo de BD o de render (Chromium) → `503`, logueado con contexto; **no** se
  degrada a PDF vacío.

## Determinismo / snapshot

Fuentes inmutables → regenerar produce el mismo informe salvo la línea "generado
el <fecha>" del pie (marca de emisión, explícita y esperada).

## Dependencias y configuración

- Nuevas deps: `puppeteer-core`, `@sparticuz/chromium`, `qrcode`; dev
  `@types/qrcode`.
- `next.config.ts`: `serverExternalPackages: ['puppeteer-core',
  '@sparticuz/chromium']` (no empaquetar en el bundle del server).
- Rutas: `export const runtime = 'nodejs'`, `export const dynamic =
  'force-dynamic'`, `export const maxDuration = 60`.
- i18n: namespace `documents` (es-CL), cargado en la ruta y pasado como
  diccionario al constructor puro. Botón: strings de UI en un namespace de app.
- Env: `PUPPETEER_EXECUTABLE_PATH` (dev/CI, ruta a Chrome/Edge);
  `NEXT_PUBLIC_APP_URL` para `verifyUrl`.

## Alcance

**En #4:** servicio `renderPdf`; helpers `layout`, `qr` (con `verifyUrl`);
constructor `diagnosis-report` (puro); loaders de datos (cliente + consultor);
rutas de descarga (portal + `/app`); botón de descarga; i18n; deps + config
Vercel; pruebas unit + E2E.

**Fuera de #4:** documentos de mitigación por brecha y consolidado (#5); marcar
brecha resuelta / completar mitigación (#6); documento final de catastro +
emisión de certificado con QR real sobre el nuevo modelo (#7); almacenamiento
de artefactos (no se hace: on-demand); remoción de lo viejo (#8).

## Casos borde

- **No pagado (cliente):** `403`, sin fuga de datos.
- **Sin diagnóstico activo:** `404`.
- **Sin brechas (diagnóstico "sin hallazgos"):** informe con estado vacío
  coherente, no se rompe.
- **Chromium no disponible / timeout:** `503` logueado, sin PDF vacío.
- **`companyId` inexistente / de otra empresa (consultor):** RLS acota; `404`.

## Pruebas

- **Unit (Vitest):** `qr.ts` (`qrDataUri` devuelve `data:image/png;base64,…`;
  `verifyUrl` arma la URL correcta); `diagnosis-report.ts` (HTML contiene
  empresa, filas de brechas con severidad y multa, resumen; degradación sin
  brechas). El HTML se asserta como string (sin navegador).
- **E2E (Playwright):** cliente pagado → `GET` del informe responde
  `application/pdf` con cabecera de bytes `%PDF`; cliente no pagado → `403`;
  consultor → PDF de una empresa. Reusa el flujo post-pago y el seed de consultor.
  El servicio de render (Chromium) se ejercita solo por E2E.

## Nota de despliegue (pre-deploy, del usuario)

En Vercel, la función de render usa el binario de `@sparticuz/chromium`; hay que
verificar memoria/`maxDuration` de la función tras el primer deploy. En local se
requiere `PUPPETEER_EXECUTABLE_PATH` apuntando a un Chrome/Edge instalado para
que la E2E renderice un PDF real. #4 no agrega migraciones.
