# Banco de fondos virtuales · Simulador STAR

Esta carpeta contiene los fondos institucionales que el entrevistador puede
usar como fondo virtual de su cámara en la Sala Virtual (botón **🖼 FONDO**
en los controles de la cámara).

## Archivos esperados por el banco

El selector de fondos busca exactamente estos nombres:

| Archivo | Descripción |
|---|---|
| `fondo-brete-claro.jpg` | Fondo institucional Brete/ANE — versión clara (círculo beige, burbuja roja) |
| `fondo-brete-azul.jpg` | Fondo institucional Brete/ANE — versión azul (círculo azul, burbuja gris) |

**Para habilitarlos:** subir aquí las dos imágenes oficiales (JPG, idealmente
1920×1080) con esos nombres exactos. Mientras falten, el selector muestra la
casilla del banco como "(falta archivo)" y el resto de la función sigua
operativa (opción "Ninguno" y "➕ Subir" fondo propio).

## Notas técnicas

- La segmentación de la persona corre 100% en el navegador del entrevistador
  (MediaPipe Selfie Segmentation) — el video nunca sale a un servidor externo.
- El fondo propio subido con "➕ Subir" se guarda en `localStorage` del
  navegador (redimensionado a máx. 1280px como JPEG) y persiste entre sesiones.
- El fondo elegido se recuerda y se re-aplica automáticamente al iniciar la
  cámara en la siguiente entrevista.
