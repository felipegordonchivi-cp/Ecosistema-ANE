# Ecosistema ANE · Portal Integrado v16

**Agencia Nacional del Empleo · Costa Rica**

Portal web integrado con los 4 módulos del ecosistema de reclutamiento y orientación laboral de la ANE.

## Módulos incluidos

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| **ATS ANE** | Motor de preselección y ranking curricular con competencias ESCO-CR | ✅ Activo |
| **Simulador STAR** | Entrevistas virtuales por competencias con audio y transcripción | ✅ Activo |
| **Centro de Control** | Dashboard ejecutivo de intermediación laboral (Chart.js + XLSX) | ✅ Activo |
| **Laboratorio IA v15** | Copiloto ESCO-CR con recomendación responsable y confianza calibrada | ✅ Activo |

## Despliegue rápido

### GitHub Pages
1. Fork o sube este repositorio a GitHub
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. Acceder en `https://[usuario].github.io/[repositorio]/`

### Netlify / Vercel
- Conectar el repositorio y hacer deploy directo (sitio estático sin build step)

### Servidor local
```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```
Luego abrir `http://localhost:8080`

## Estructura de archivos

```
index.html                              ← Portal integrado (punto de entrada)
app-ats-ane.html                        ← Módulo 1: ATS
app-simulador-entrevistas-ane.html      ← Módulo 2: Simulador STAR
app-dashboard-intermediacion-ane.html   ← Módulo 3: Centro de Control
app-4-laboratorio-ia-ane.html           ← Módulo 4: Laboratorio IA
manual-ats-ane.html                     ← Manual ATS
manual-simulador-entrevistas-ane.html   ← Manual Simulador
manual-dashboard-intermediacion-ane.html← Manual Dashboard
manual-laboratorio-ia-ane.html          ← Manual Laboratorio IA
manual-centro-ayuda-ane.html            ← Centro de ayuda general
Informe_Ejecutivo_Ecosistema_ANE_Membretado.html ← Informe ejecutivo
base-*.csv                              ← Datos ESCO-CR (2 000 perfiles)
```

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+0` | Inicio ejecutivo |
| `Ctrl+1` | Módulo ATS |
| `Ctrl+2` | Simulador STAR |
| `Ctrl+3` | Centro de Control |
| `Ctrl+4` | Laboratorio IA |

## Notas técnicas

- **Procesamiento 100% local**: ningún dato se envía a servidores externos
- **Sin backend requerido**: archivos HTML estáticos puros
- **Simulador de audio**: requiere HTTPS para MediaRecorder (incluido en cualquier despliegue web)
- **CDN con fallback**: el Dashboard usa cdnjs → jsDelivr → unpkg automáticamente
- **Privacidad por diseño**: los CV y datos de candidatos nunca salen del navegador

## Auditoría técnica

El portal incluye una sección de **Auditoría técnica** integrada con:
- Puntuaciones de madurez por módulo
- Hallazgos de arquitectura, seguridad y diseño
- Recomendaciones prioritarias para v2

---

*Ecosistema ANE v16 · Recomendación responsable · Costa Rica 2026*
