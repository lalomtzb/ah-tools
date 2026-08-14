# Guía de despliegue — Herramientas AH (PULSE + Autoevaluación)

Todo esto es de clics, sin programar. Cuando llegues aquí, dime y te acompaño paso a paso.

## Qué hay en esta carpeta
- `index.html` — PULSE (español)
- `index_en.html` — PULSE (inglés)
- `autoevaluacion_es.html` — Autoevaluación del trabajador (español)
- `self_assessment_en.html` — Autoevaluación del trabajador (inglés)
- `api/subscribe.js` — función de servidor que guarda los correos en tu lista de Brevo
- Los correos van a la **lista Brevo ID 3**. Remitente del reporte: **info@absurdlyhuman.com**

## Paso a paso

### 1. Genera tu API key de Brevo (y guárdala, NO la pegues en el chat)
Brevo → **SMTP & API → API Keys → Generar una nueva**. Cópiala a un lugar seguro.

### 2. Sube esta carpeta a GitHub (todo por web, sin terminal)
- Crea una cuenta gratis en github.com si no tienes.
- **New repository** → nómbralo p. ej. `ah-tools` → Create.
- En el repo: **Add file → Upload files** → arrastra el contenido de esta carpeta (incluida la carpeta `api`) → Commit.

### 3. Conecta el repo a Vercel
- Crea cuenta gratis en vercel.com (entra con GitHub).
- **Add New → Project → Import** el repo `ah-tools` → **Deploy**.
- Al terminar tendrás una URL tipo `ah-tools.vercel.app` — ahí ya funcionan las herramientas.

### 4. Pega tu API key en Vercel (aquí va el secreto, seguro)
- En el proyecto de Vercel: **Settings → Environment Variables**.
- Añade: `BREVO_API_KEY` = *(tu clave)*. (Opcional: `BREVO_LIST_ID` = `3`.)
- **Redeploy** para que tome la variable.

### 5. Conecta el subdominio app.absurdlyhuman.com
- En Vercel: **Settings → Domains → Add** → `app.absurdlyhuman.com`.
- Vercel te da **un registro DNS (CNAME)**. Ese lo pegas en Wix:
  Wix → **Dominios → absurdlyhuman.com → Manage DNS Records → Add** el CNAME que te dio Vercel.
- En ~30 min a unas horas queda activo.

### 6. Autentica tu dominio en Brevo (para que el reporte no caiga en spam)
- Brevo → **Senders, Domains & Dedicated IPs → Domains → Add** `absurdlyhuman.com`.
- Brevo te da unos registros DNS → se pegan en Wix igual que el paso anterior.

### 7. Arma la automatización del reporte en Brevo
- Brevo → **Automations → crea un flujo**: disparador *"Un contacto se agrega a una lista"* (lista 3) → acción *"Enviar un email"* (el reporte, desde info@absurdlyhuman.com).
- (Opcional) Crea dos atributos de contacto de texto `SOURCE` y `FOCUS` en Brevo para segmentar por herramienta y por resultado.

## Enlaces de los botones (ya cableados a tu tienda)
- PULSE ES → páginas de producto en español de cada toolkit.
- PULSE EN → páginas de producto en inglés.
- Autoevaluación → cada resultado enlaza a su Conflict Lab exacto ($19).
