# Curación de grupos ESCO-CR-500 — julio 2026

## Qué pasó

Al probar el Laboratorio IA con un CV real (perfil de gestión/ciencias
sociales), el diagnóstico mostró como "competencias faltantes para el
puesto" cosas sin relación alguna con el perfil: AutoCAD, redes eléctricas,
fotografía. Se rastreó a `jobMatchAnalysis()`, que arma la lista de las 25
competencias clave de una familia ocupacional a partir de los grupos ESCO-CR
asociados a esa familia (campo `groups` en `FAMILIES`).

El problema no era la función en sí, sino los datos: 324 de las 2000
competencias en `ESCO_CR_500` fueron generadas por plantilla (patrones como
"resolución de problemas en X", "mejora continua de X", "atención
especializada en X", "planificación de X") y muchas quedaron etiquetadas con
un `group` que no corresponde a su dominio real — por ejemplo, "AutoCAD para
construcción" y "resolución de problemas en redes eléctricas" estaban
etiquetadas como `proyectos` (gestión de proyectos), en vez de
`ingenieria_construccion`/`construccion_mantenimiento`.

## Qué se corrigió

Se revisaron las 258 categorías (`X`) únicas generadas por plantilla y se
reasignaron **232 competencias** a un grupo existente más adecuado (92 ya
estaban correctamente etiquetadas y no se tocaron). El detalle línea por
línea (ID, nombre de la competencia, grupo anterior, grupo nuevo) está en
`tools/esco-cr-500-cambios-grupo.tsv` de este mismo commit.

Se verificó con 3 perfiles de prueba distintos que el diagnóstico ahora
produce brechas coherentes con el oficio real:

| Perfil de prueba | Familia detectada | Antes | Después |
|---|---|---|---|
| Socióloga / gestión de programas sociales | Gerencia, jefaturas y liderazgo | AutoCAD, redes eléctricas, fotografía | Scrum, KPI, coordinación de proyectos |
| Maestro de obras | Ingeniería civil y construcción | — | AutoCAD, planos, seguridad ocupacional (correctamente detectados) |
| Soporte técnico de redes | Redes y certificación Cisco | — | Troubleshooting, switching, Cisco, AWS |

## Qué NO se corrigió (limitaciones conocidas)

- **Redacción de algunas competencias sigue siendo torpe.** El reetiquetado
  corrige a qué *grupo* pertenece una competencia, pero no reescribe el
  *nombre* generado por plantilla — frases como "resolución de problemas en
  jefe" siguen sonando extrañas aunque ahora estén en el grupo correcto
  (`proyectos`). Reescribir los ~300 nombres es un trabajo aparte.
- **No se crearon grupos nuevos.** Algunos dominios (derecho/legal, por
  ejemplo) no tienen un grupo dedicado en la taxonomía actual de 21 grupos;
  se ubicaron en el grupo existente más cercano (`administracion`) en vez de
  crear una categoría nueva, lo cual habría requerido también actualizar
  `FAMILIES` y volver a probar cada familia afectada.
- **Esta curación se basó en criterio de dominio, no en una fuente ESCO
  oficial verificada línea por línea.** Para producción con datos reales de
  candidatos, se recomienda que un especialista en clasificación
  ocupacional de la ANE revise la tabla de cambios adjunta.
