/**
 * Proxy institucional para Gemini — Simulador de Entrevistas ANE
 * ============================================================
 * Problema que resuelve: hoy cada asesor pega su propia API Key de Gemini
 * en el navegador (guardada en localStorage). Eso la expone en DevTools y
 * en el historial del navegador. Este Worker la guarda como secreto del
 * lado del servidor — el navegador nunca la ve.
 *
 * Costo: $0. El free tier de Cloudflare Workers incluye 100,000
 * solicitudes/día, muy por encima de lo que este simulador necesita.
 *
 * ── Cómo desplegarlo (una sola vez, ~5 minutos) ──────────────
 * 1. Crear una cuenta gratuita en https://dash.cloudflare.com/sign-up
 * 2. En el dashboard: Workers & Pages → Create → Create Worker.
 * 3. Pega el contenido de este archivo reemplazando el código de ejemplo.
 * 4. Settings → Variables and Secrets → agrega los secretos:
 *      GEMINI_API_KEY  = tu-clave-de-aistudio.google.com
 *      ALLOWED_ORIGINS = https://tu-dominio-oficial  (obligatorio; varios
 *                        dominios separados por coma). Sin esto el proxy
 *                        responde 403 — así no queda abierto a cualquiera.
 * 5. Deploy. Copia la URL que te da (algo como
 *    https://gemini-proxy.tu-usuario.workers.dev).
 * 6. En el simulador: botón 🔑 → campo "Proxy institucional" → pega esa URL
 *    → Guardar. A partir de ahí el simulador deja de usar la API Key local.
 *
 * Este Worker es un simple passthrough: reenvía el mismo payload que el
 * simulador ya arma (contents/parts) hacia la API de Gemini, agregando la
 * clave desde el secreto — no cambia el formato de la respuesta, así que
 * el simulador la interpreta exactamente igual que una llamada directa.
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Restringe qué orígenes pueden llamar al proxy. NO se deja abierto ('*'):
// un proxy abierto deja que cualquiera que descubra la URL del Worker gaste
// tu cuota de Gemini. Configura el/los dominios oficiales como secreto del
// Worker: Settings -> Variables -> ALLOWED_ORIGINS = "https://tu-dominio.gov"
// (varios separados por coma). Si no se configura, el proxy NO responde.
function pickOrigin(request, env){
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
  const origin = request.headers.get('Origin') || '';
  if(list.length === 0) return null;          // sin configurar → rechazar
  if(list.includes('*')) return '*';          // permitido explícitamente si de verdad se quiere
  return list.includes(origin) ? origin : null;
}

function corsHeaders(allowOrigin){
  return {
    'Access-Control-Allow-Origin': allowOrigin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

// Límite de tamaño del payload — una respuesta de entrevista más su prompt no
// necesita más que esto; corta intentos de abuso/costo con cuerpos enormes.
const MAX_BODY_BYTES = 60 * 1024;

export default {
  async fetch(request, env){
    const allowOrigin = pickOrigin(request, env);

    if(request.method === 'OPTIONS'){
      return new Response(null, {status: allowOrigin ? 204 : 403, headers: corsHeaders(allowOrigin)});
    }
    // Origen no autorizado → 403 (no filtra la clave ni reenvía nada)
    if(!allowOrigin){
      return new Response(JSON.stringify({error:{message:'Origen no autorizado. Configura ALLOWED_ORIGINS en el Worker.'}}), {
        status:403, headers:{'Content-Type':'application/json', ...corsHeaders(null)}
      });
    }
    if(request.method !== 'POST'){
      return new Response('Method not allowed', {status:405, headers: corsHeaders(allowOrigin)});
    }
    if(!env.GEMINI_API_KEY){
      return new Response(JSON.stringify({error:{message:'GEMINI_API_KEY no configurada en el Worker'}}), {
        status:500, headers:{'Content-Type':'application/json', ...corsHeaders(allowOrigin)}
      });
    }

    let body;
    try { body = await request.text(); } catch(e){
      return new Response(JSON.stringify({error:{message:'Body inválido'}}), {
        status:400, headers:{'Content-Type':'application/json', ...corsHeaders(allowOrigin)}
      });
    }
    if(body.length > MAX_BODY_BYTES){
      return new Response(JSON.stringify({error:{message:'Payload demasiado grande'}}), {
        status:413, headers:{'Content-Type':'application/json', ...corsHeaders(allowOrigin)}
      });
    }

    const upstream = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body
    });

    const respBody = await upstream.text();
    return new Response(respBody, {
      status: upstream.status,
      headers:{'Content-Type':'application/json', ...corsHeaders(allowOrigin)}
    });
  }
};
