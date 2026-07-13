# QA del Laboratorio IA — 21 perfiles de prueba (julio 2026)

Prueba de extremo a extremo (diagnóstico → oferta académica → recomendador)
con 21 perfiles sintéticos distintos, cubriendo la mayoría de las familias
ocupacionales del sistema. Complementa la curación de grupos ESCO-CR-500
documentada en `esco-cr-500-curacion-grupos.md`.

## Bugs encontrados y corregidos

1. **`detectSkills()` — alias cortos coincidían por substring.** El alias
   `"a+"` (de "certificación CompTIA A+") se normaliza a la letra suelta
   `"a"`, que aparece en cualquier texto en español — el 100% de los
   perfiles de prueba detectaban esa competencia sin relación con su CV. El
   alias `"cad"` (AutoCAD) coincidía dentro de "cadena de suministro".
   Corregido exigiendo coincidencia de palabra completa (no substring) para
   alias de una sola palabra, y descartando los de 1 carácter.

2. **`academicText()` mezclaba contenido con metadata genérica.** La
   función que arma el texto de búsqueda incluía `nivel_formacion`
   ("Técnico medio") e `institución` ("MEP Educación Técnica") junto con el
   contenido real de la competencia. Un candidato con "Técnico agrícola" en
   su puesto objetivo recibía recomendaciones de Ciberseguridad, Redes o
   Cloud Computing solo por compartir la palabra "técnico" con el *nivel*
   de esos programas. Se separó `academicScoreText()` (solo contenido) de
   `academicText()` (que sigue usando toda la metadata, correctamente, para
   el buscador libre por texto).

3. **Bono por palabra suelta generaba ruido constante.** Incluso tras el
   punto 2, palabras conectoras compartidas por *todos* los perfiles (las
   brechas transversales genéricas como "trabajo en equipo", "aprendizaje
   continuo") seguían coincidiendo parcialmente con títulos de cursos no
   relacionados ("aplicada al **trabajo**", "despliegue **continuo**"). Se
   quitó el bono de +3 por palabra suelta; solo cuenta la coincidencia de
   frase completa.

4. **`academicLevelBoost()` daba puntaje sin relevancia real.** El bono de
   +10 por ser un curso corto/técnico (en vez de una carrera completa) se
   sumaba *sin ninguna otra señal de coincidencia* — un curso de
   Ciberseguridad puntuaba 10 para un perfil agrícola solo por ser
   "Técnico medio", superando el filtro de `score > 0`. Ahora ese bono solo
   se aplica si ya hay una señal temática genuina (`score > 0` antes de
   aplicarlo).

5. **Señal de familia por "primera palabra del nombre" era ambigua.**
   Cuatro familias distintas empiezan con "Ingeniería" (civil, industrial,
   sistemas, electromecánica); un desarrollador de software recibía
   recomendaciones de Dibujo Arquitectónico solo por esa coincidencia. Se
   eliminó esa señal — el id completo de la familia (más específico) ya
   cumple ese rol.

6. **"seguridad" (id de la familia de seguridad física) coincidía con
   Ciberseguridad**, tanto por substring dentro de "ciberseguridad" como
   por aparecer como palabra suelta en el campo `keywords` de esos
   registros. Se corrigió la coincidencia a palabra completa en todo el
   flujo de puntuación (no solo en las señales dedicadas, también en el
   bucle general de términos), y se limpiaron las keywords de los 2
   registros de ciberseguridad que listaban "seguridad" como palabra suelta
   redundante.

7. **`main.id`/`main.name` se contaban dos veces** — una en la lista
   general de términos y otra en la señal dedicada de familia — duplicando
   el peso de ids genéricos de una palabra.

## Encontrado pero NO corregido — limitaciones conocidas

- **`familyScore()` tiene un piso mínimo de 22 puntos que nunca baja**,
  sin importar cuánta evidencia real exista. Con un perfil de 0-1
  competencias detectadas, muchas familias no relacionadas empatan en ese
  piso y el desempate es esencialmente por el orden del arreglo `FAMILIES`,
  no por relevancia real — así "Soporte técnico, help desk y
  certificaciones CompTIA" apareció en el top-3 del recomendador tanto para
  un perfil de limpieza como uno de estética, con 0-1 competencias
  detectadas. Corregir esto requiere revisar la fórmula de puntaje
  completa (usada también para el score principal del diagnóstico), no es
  un cambio aislado — se deja documentado para una sesión futura.

- **La palabra "administración" (id de esa familia) es genuinamente
  ambigua**, no solo por un error de coincidencia: se usa legítimamente en
  decenas de contextos no relacionados ("administración de la nube",
  "administración de propiedades", "administración pública"). Un
  asistente legal siguió recibiendo "Configuración y administración de
  servicios en la nube" como recomendación #4 porque esa palabra aparece,
  con toda razón, en las keywords de ese curso de cloud computing. No se
  encontró una forma de corregir esto sin quitarle la señal a casos donde
  sí es válida.

- **Se descubrió un quinto patrón de generación por plantilla no
  auditado: "coordinación de X"** (p. ej. "coordinación de ganaderia",
  "coordinación de gas refrigerante" aparecieron como brechas para un
  guarda de seguridad privada). La curación de grupos documentada en
  `esco-cr-500-curacion-grupos.md` solo cubrió 4 patrones ("resolución de
  problemas en X", "mejora continua de X", "atención especializada en X",
  "planificación de X"); "coordinación de X" quedó fuera y probablemente
  tiene el mismo problema de etiquetado de grupo.

- **Dos perfiles de prueba (docente de primaria, estilista/cosmetóloga)
  no detectaron ninguna competencia** pese a tener experiencia y
  habilidades claramente relevantes escritas en español simple. Esto
  sugiere que `ESCO_CR_500` tiene huecos de cobertura reales para
  vocabulario común de docencia ("planificación de lecciones", "manejo de
  grupo") y belleza/cosmetología, más allá de cualquier problema de
  etiquetado de grupo o de coincidencia — habría que agregar competencias
  y alias nuevos, no solo reclasificar los existentes.

## Perfiles probados

Ventas/retail, salud/enfermería, turismo/hotelería, logística, contabilidad,
agro, construcción, TI/desarrollo de software, legal, RRHH, educación,
manufactura, seguridad privada, limpieza, comercio exterior, inmobiliario,
marketing digital, diseño UX, mecánica automotriz, belleza/estética, call
center bilingüe.
