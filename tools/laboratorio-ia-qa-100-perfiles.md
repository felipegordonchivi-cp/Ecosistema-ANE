# QA del Laboratorio IA — 100 perfiles de prueba (julio 2026)

Continuación de `laboratorio-ia-qa-21-perfiles.md`. Esta ronda generó un
perfil por cada una de las 80 familias ocupacionales del sistema —
usando el propio vocabulario que el sistema tiene guardado internamente
para cada una (`FAMILY_KEYWORDS`) — más 20 variantes, para un total de 100.
Objetivo: encontrar huecos de contenido, no solo bugs de algoritmo.

**Resultado clave: 0 errores de JavaScript en las 100 corridas.** El
sistema no se cae; los problemas encontrados son de contenido/puntaje, no
de estabilidad.

## Hallazgo principal: hueco de contenido, no de algoritmo

**15 de 100 perfiles detectaron cero competencias**, pese a estar
alimentados con las palabras que el propio sistema asocia a esas familias.
Se confirmó la causa exacta: palabras como *"ciberseguridad", "firewall",
"devops", "docker", "kubernetes", "gerente", "liderazgo", "kpi", "python"*
no existían como alias en ninguna de las 2000 competencias de
`ESCO_CR_500`. A diferencia de los bugs de la ronda anterior (de
*algoritmo* — cómo se compara el texto), este es un hueco de *contenido* —
qué palabras existen para comparar.

Familias afectadas (13 únicas): Gerencia, Banca/seguros, Farmacia,
Limpieza, Comercio exterior, Ciberseguridad, Deporte/bienestar,
Belleza/moda, DevOps, Machine Learning, Cosmetología, Audiovisual,
Inmobiliario.

### Corrección aplicada

Se agregaron **27 competencias nuevas** (135 alias) a `ESCO_CR_500`
(IDs ESCO-CR-2001 a ESCO-CR-2027), una por cada área temática faltante,
asignadas al grupo más específico que la propia familia ya tenía en su
lista `groups` (para que cuenten correctamente en `jobMatchAnalysis` y en
`familyScore`). Verificado con un perfil de prueba por cada una de las 13
familias: las 13 pasaron de 0 competencias detectadas a 1-3, con
recomendaciones académicas coherentes (Ciberseguridad, DevOps y Machine
Learning quedaron con coincidencias perfectas: "Docker, DevOps y
despliegue continuo", "Python aplicado a análisis de datos", "Ciberseguridad").

Terminología redactada con criterio general del equipo (no se usó un
glosario oficial de ANE/MTSS/INA ni la taxonomía ESCO europea como fuente
— *pendiente de validación por alguien con conocimiento del sector*).

## Segundo pendiente cerrado: patrón "coordinación de X"

La curación de grupos anterior (`esco-cr-500-curacion-grupos.md`) cubrió 4
patrones de generación por plantilla. Se encontró un quinto sin auditar:
**"coordinación de X"**, con 85 competencias. Se revisaron las 85 y se
reasignaron **48** a un grupo más adecuado (37 ya estaban correctas). El
resto del patrón sigue sin cobertura de sinónimos más allá de esas 85
instancias puntuales — este barrido fue específico a "coordinación de X",
no una auditoría exhaustiva de todo `ESCO_CR_500` más allá de los 5
patrones ya revisados en conjunto.

## Tercer pendiente cerrado: piso mínimo de `familyScore()`

El piso duro de 22 puntos (`clamp(...,22,97)`), documentado como abierto en
la ronda anterior, se bajó a 5. Antes, un perfil con poca evidencia
(0-1 competencias) hacía que decenas de familias sin relación empataran en
22, y el recomendador mostraba cualquiera de ellas según el orden del
arreglo `FAMILIES` — así aparecía "Soporte técnico, help desk y
certificaciones CompTIA" para un perfil de limpieza o de estética. Con el
piso en 5, la penalización por falta de evidencia (ya calculada en la
función) se refleja de verdad en el puntaje final.

Verificado con los mismos perfiles de limpieza y estética de la ronda
anterior:

| Perfil | Antes (piso 22) | Después (piso 5) |
|---|---|---|
| Limpieza | Limpieza(67) empatado cerca de Soporte técnico(58) | Limpieza(72) claramente arriba de Soporte técnico(63) |
| Belleza/estética | Belleza(25), Cosmetología(25), **Soporte técnico(23)** | Belleza(69), Cosmetología(69) empatadas arriba — Soporte técnico ya no aparece en el top 4 |

**Nota:** "Soporte técnico, help desk y certificaciones CompTIA" sigue
apareciendo en 2 de 4 perfiles de regresión probados (Limpieza #2 con 63,
y un perfil de gerencia #4 con 60) — ya no empatado artificialmente en el
piso, pero con un puntaje real que sigue pareciendo alto para perfiles sin
ninguna relación con soporte técnico. Puede que esa familia tenga un
`familyObjectiveBoost()` o una demanda de mercado (`CR_MARKET`) que le da
una ventaja estructural frente a otras familias igual de irrelevantes —
no se investigó más a fondo en esta ronda.

## Qué NO se hizo en esta ronda

- No se auditaron los otros ~250 ítems de `ESCO_CR_500` que no siguen
  ninguno de los 5 patrones de plantilla ya revisados — solo se tocó lo
  que los 100 perfiles de prueba expusieron directamente.
- No se agregaron competencias para familias que sí detectaron *algo*
  pero con cobertura pobre (por ejemplo, las familias con solo 1
  recomendación académica) — el criterio fue arreglar únicamente las que
  detectaron *cero*.
- La ventaja persistente de "Soporte técnico help desk" en el recomendador
  (ver nota arriba) queda documentada, no resuelta.
