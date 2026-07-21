# Guía de seguridad — Firebase del Simulador de Entrevistas ANE

Checklist para cerrar los hallazgos de la auditoría que **no** se resuelven solo
en el código y requieren acción en las consolas (Firebase / Cloudflare).

- **Proyecto Firebase:** `simulador-de-entrevista-a883d`
- **Realtime Database:** `https://simulador-de-entrevista-a883d-default-rtdb.firebaseio.com`

> Cada paso marcado con ⏱️ indica cuánto toma. Total: ~20 min.
> Hazlos **en orden** — sobre todo App Check, que si se fuerza antes de tiempo
> deja la app sin funcionar.

---

## Paso 1 — Publicar las reglas endurecidas ⏱️ 3 min · 🔴 IMPRESCINDIBLE

> Hasta que hagas esto, la base sigue **abierta**: cualquiera puede leer las
> transcripciones y nombres de los candidatos. Es el arreglo más importante.

1. Abre la consola de reglas (ya apunta a tu proyecto):
   **https://console.firebase.google.com/project/simulador-de-entrevista-a883d/database/simulador-de-entrevista-a883d-default-rtdb/rules**
2. Verás el editor con las reglas actuales (`".read": true, ".write": true`).
3. **Borra todo** y pega el contenido completo del archivo
   [`tools/firebase-database-rules.json`](./firebase-database-rules.json) de este repo.
4. Haz clic en **Publicar** (botón azul, arriba a la derecha).
5. Debe aparecer "Reglas publicadas correctamente". Si marca error de sintaxis,
   revisa que copiaste el archivo completo (empieza en `{` y termina en `}`).

### Verificar que quedó bien cerrada ⏱️ 1 min
Desde una terminal (o el navegador), esto **debe fallar** ahora (antes funcionaba):

```bash
# Intento de leer TODAS las salas — debe responder "Permission denied"
curl 'https://simulador-de-entrevista-a883d-default-rtdb.firebaseio.com/salas.json'
```
Respuesta esperada: `{"error":"Permission denied"}`. ✅ Si la ves, las reglas están activas.

Y esto **debe seguir funcionando** (el flujo real del candidato):
- Abre el simulador, genera un enlace de candidato, y comprueba que el candidato
  puede "tocar la puerta" (knock) y que el asesor lo ve. Si funciona, no rompiste nada.

---

## Paso 2 — Activar App Check (anti-abuso) ⏱️ 10 min · 🟠 RECOMENDADO

App Check garantiza que **solo tu app oficial** (no un script/curl) pueda usar la
base. Se hace en 4 sub-pasos y **el orden importa**: primero se registra y se
integra en modo monitoreo, y solo cuando el monitoreo confirma que la app real
pasa, se activa la exigencia. Forzarlo antes deja la app sin acceso.

### 2.1 Registrar reCAPTCHA y la app
1. Ve a **https://console.firebase.google.com/project/simulador-de-entrevista-a883d/appcheck**
2. Pestaña **Apps** → selecciona la app web del simulador.
3. Proveedor: **reCAPTCHA v3** (o **reCAPTCHA Enterprise** si tu institución ya lo usa).
4. Firebase te da (o te pide crear) una **clave de sitio (site key)** pública.
   Cópiala — la necesitas en el paso 2.2.

### 2.2 Integrar el SDK en el cliente (cambio de código — te lo hago yo)
En `app-simulador-entrevistas-ane.html`, junto a la inicialización de Firebase,
va este bloque **con tu site key**:

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check-compat.js"></script>
<script>
  // Debe ir DESPUÉS de firebase.initializeApp(firebaseConfig)
  const appCheck = firebase.appCheck();
  appCheck.activate('TU_SITE_KEY_RECAPTCHA_AQUI', /* isTokenAutoRefreshEnabled */ true);
</script>
```
> Pásame la site key y yo hago este cambio, ajusto el CSP (`script-src` /
> `connect-src` para `recaptcha`) y lo pruebo antes de que actives la exigencia.

### 2.3 Modo monitoreo (NO forzar todavía) ⏱️ deja correr 1–2 días
1. En App Check → pestaña **APIs** → **Realtime Database**.
2. Déjalo en **"Sin aplicar" / Monitorear** (Unenforced).
3. Firebase empieza a mostrar el % de peticiones que llegan **con** token válido.
   Cuando veas que casi el 100 % del tráfico legítimo pasa, estás listo.

### 2.4 Exigir (Enforce) ⏱️ 1 min
1. Cuando el monitoreo confirme que la app real pasa, cambia Realtime Database a
   **Aplicar / Enforce**.
2. A partir de ahí, cualquier acceso sin token de App Check (curl, scripts) es
   rechazado, aunque conozca un código de sala.

> ⚠️ Si activas **Enforce** sin haber hecho 2.2, la app deja de leer/escribir.
> Si eso pasa por error: vuelve a **Unenforced** en la misma pantalla y se
> restablece de inmediato.

---

## Paso 3 — Cerrar el proxy de Gemini ⏱️ 2 min · (solo si usas el proxy)

Aplica únicamente si desplegaste `tools/gemini-proxy-worker.js` en Cloudflare.

1. Dashboard de Cloudflare → **Workers & Pages** → tu Worker → **Settings** →
   **Variables and Secrets**.
2. Agrega el secreto:
   - Nombre: `ALLOWED_ORIGINS`
   - Valor: el dominio oficial desde donde se sirve el Ecosistema
     (p. ej. `https://ane.go.cr` o `https://tu-usuario.github.io`).
     Varios separados por coma.
3. **Deploy**. Sin este secreto el proxy responde `403` a todos — no queda abierto.

---

## Paso 4 — Rotar la clave de Gemini ⏱️ 3 min · (precaución)

La clave de Gemini se guardaba en `localStorage` del navegador. Si se usó en
equipos compartidos, conviene rotarla:

1. **https://aistudio.google.com/apikey** → elimina la clave anterior → **crea una nueva**.
2. En cada equipo donde se use el simulador: botón 🔑 → pega la clave nueva.
   (O mejor: usa el **proxy institucional** del Paso 3 y no vuelvas a pegar la
   clave en ningún navegador.)

---

## Paso 5 — Autenticación del lado del entrevistador ⏱️ decisión de infraestructura

La etiqueta "🔒 INTERNO" es **solo visual**: hoy quien tenga la URL del módulo
entra como entrevistador. Cerrarlo de verdad requiere una capa del hosting
(no se resuelve en el HTML). Opciones según dónde esté publicado:

| Hosting | Solución | Costo |
|---|---|---|
| GitHub Pages | Poner el simulador detrás de **Cloudflare Access** (Zero Trust) | Gratis hasta 50 usuarios |
| Netlify | **Netlify Identity** + regla de acceso | Gratis (tier básico) |
| Servidor propio / institucional | Autenticación del MTSS (SSO) frente al sitio | Según institución |

> Dime dónde está publicado el Ecosistema y te dejo la guía concreta de esa opción.

---

## Checklist final

- [ ] **Paso 1** — Reglas publicadas y verificadas (`curl` da *Permission denied*). 🔴
- [ ] Flujo del candidato probado tras publicar las reglas (knock funciona).
- [ ] **Paso 2** — App Check registrado, SDK integrado, en monitoreo → luego Enforce. 🟠
- [ ] **Paso 3** — `ALLOWED_ORIGINS` configurado en el Worker (si usas proxy).
- [ ] **Paso 4** — Clave de Gemini rotada.
- [ ] **Paso 5** — Decidida la autenticación del entrevistador.
