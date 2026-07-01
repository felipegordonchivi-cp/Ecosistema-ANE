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
 * 4. Settings → Variables and Secrets → agrega el secreto:
 *      GEMINI_API_KEY = tu-clave-de-aistudio.google.com
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

// Restringe qué orígenes pueden llamar al proxy. Ajusta a tu dominio real
// de GitHub Pages para no dejarlo abierto a cualquier sitio.
const ALLOWED_ORIGIN = '*'; // p.ej. 'https://tu-usuario.github.io'

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env){
    if(request.method === 'OPTIONS'){
      return new Response(null, {headers: corsHeaders()});
    }
    if(request.method !== 'POST'){
      return new Response('Method not allowed', {status:405, headers: corsHeaders()});
    }
    if(!env.GEMINI_API_KEY){
      return new Response(JSON.stringify({error:{message:'GEMINI_API_KEY no configurada en el Worker'}}), {
        status:500, headers:{'Content-Type':'application/json', ...corsHeaders()}
      });
    }

    let body;
    try { body = await request.text(); } catch(e){
      return new Response(JSON.stringify({error:{message:'Body inválido'}}), {
        status:400, headers:{'Content-Type':'application/json', ...corsHeaders()}
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
      headers:{'Content-Type':'application/json', ...corsHeaders()}
    });
  }
};
