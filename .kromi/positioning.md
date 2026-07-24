# Posicionamiento y narrativa — KPC (Kromi Privacy Center)

> Documento contrato de posicionamiento. Complementa `.kromi/init.md` (funcional)
> y `.kromi/design.md` (diseño). Fija la **tesis, la voz, la narrativa y el orden
> de las secciones** de la cara pública. La implementación de la landing y de la
> autoevaluación debe ser trazable a este documento.
>
> **Fecha:** 2026-07-24. **Estado:** vigente para la cara pública post-pivote
> (init.md aviso 2026-07-22). Ante conflicto con la voz en 3ª persona del
> `RFC.md` §16 (escrito antes del pivote), **manda este documento**: la voz es
> **2ª persona** (decisión del usuario, 2026-07-24).

---

## 1. Tesis (una sola idea)

> **Entender qué debes hacer para cumplir la ley no debería depender de cuánto
> puedas pagar. Ese trabajo ya lo hicimos. Es tuyo. Nuestro negocio empieza solo
> si decides que lo implementemos nosotros.**

De ella se derivan las tres frases que el visitante debe llegar a pensar, y cada
sección del sitio existe para producir una:

1. *"Ya hicieron el trabajo intelectual por mí."* → lo produce **el informe como protagonista**.
2. *"Me están regalando algo que normalmente tendría que pagar."* → lo produce **el manifiesto + la ausencia de fricción** (sin registro, sin reunión).
3. *"Puedo hacerlo solo… pero sería más fácil que ellos lo implementen."* → lo produce **la bifurcación** (implementación como elección, no como venta).

## 2. Modelo de negocio (lo que se regala y lo que se cobra)

- **Se regala:** conocimiento estructurado — diagnóstico, fundamento legal por
  brecha, plan de mitigación, evidencia requerida. Completo y sin costo.
- **Se cobra:** la **ejecución** (implementación acompañada), solo si el cliente
  la pide. Nunca en el sitio; la estimación ocurre por WhatsApp.
- **Premisa:** quien puede implementar solo nunca habría pagado implementación;
  quien recibe un plan excelente y se siente capaz de entenderlo pero no de
  ejecutarlo, llega precalificado, educado y con confianza ya construida.

## 3. Categoría (contra qué NO competimos)

KPC no compite en el eje "confía en nuestra experiencia" (autoridad opaca). Crea
la categoría **"ya hicimos el trabajo, aquí está, verifícalo tú mismo"**
(transparencia demostrada). Es difícil de imitar: obliga al competidor a regalar
su propio activo.

> KPC = **la plataforma que convierte una ley compleja en un plan claro y
> ejecutable, y te lo entrega antes de pedirte nada.**

## 4. Voz y tono

- **Persona:** 2ª persona ("tu empresa", "recibes"). Cálida, directa, digna.
- **Tono:** profesional, transparente, generoso. Sin marketing agresivo.
- **Destacar por lo propio, no por comparación** (decisión 2026-07-24): la marca
  se elige por lo buena que es su propuesta, no por ser "el menos malo". Evitar
  el lenguaje comparativo o el ataque a terceros (consultoras, "trámite exprés").
  La diferenciación es **implícita**.
- **No exponer decisiones de negocio de forma literal** (por qué es gratis, "no
  vendemos horas", "nuestro negocio es X"): el foco está en el **resultado para
  el cliente**, no en la mecánica comercial ni en explicar nuestro modelo.
- **Evitar el "tono IA"** (decisión 2026-07-24): sin construcciones de antítesis
  del tipo "con información, no con miedo" o "no termina en X: termina cuando Y",
  sin frases de aforismo grandilocuente. Preferir enunciados simples, concretos y
  directos. La postura se expresa como lo que ofrecemos (una herramienta simple,
  gratis y sin compromiso), no como una declaración de principios abstracta.
- **Prohibido:** "no esperes más", "aprovecha", "somos líderes", "expertos",
  "agenda una reunión", "solicita una llamada", "conoce nuestros servicios",
  clichés y promesas exageradas.
- **El miedo (sanciones) es contexto de servicio, no palanca de presión.**

## 5. El informe es el producto (no la autoevaluación)

- El protagonista es el **entregable** (el Informe KPC), no la herramienta (el
  cuestionario). Se vende el destino, no el trayecto.
- **Mostrarlo, no describirlo:** el hero y la sección "El Informe" enseñan una
  maqueta real del entregable antes de pedir nada.
- **Anclaje de valor sin precio:** "un diagnóstico como este normalmente es la
  parte que se cobra; aquí no".
- Contiene: nivel de exposición · cada brecha en lenguaje claro · fundamento
  legal exacto · meta de cierre · acciones paso a paso · evidencia requerida ·
  PDF descargable, sin registro.

## 6. Jerarquía de CTA (regla dura)

- **Primario (todo el sitio):** "Obtén tu informe gratis" → `/self-assessment`.
  Texto único, botón Ink.
- **Secundario (solo hero y "El Informe"):** "Ver qué incluye el informe" →
  ancla a `#informe`.
- **Comercial (solo la bifurcación y el resultado):** "Escríbenos por WhatsApp,
  sin compromiso".
- **Regla de oro:** el CTA de WhatsApp **jamás** aparece antes de que el usuario
  tenga o pueda ver su informe. Vender antes de dar contradice el modelo.

## 7. Orden de secciones (del primer pixel al footer)

| # | Sección | Ancla | Produce / función |
|---|---------|-------|-------------------|
| 1 | Nav sticky | — | orientación + CTA único siempre visible |
| 2 | **Hero** | — | el regalo + maqueta del informe |
| 3 | **Manifiesto** (NUEVA) | `#postura` | responde "¿cuál es la trampa?" |
| 4 | **El Informe** (NUEVA) | `#informe` | protagonista: anatomía del entregable |
| 5 | **¿Alguna te suena?** (extraída de stakes) | `#reconoces` | el espejo: auto-reconocimiento |
| 6 | **El estándar** (14 dominios + organismos) | `#dominios` | exhaustividad y competencia |
| 7 | **El contexto legal** (sanciones, reencuadrado) | `#riesgo` | urgencia como dato, no como látigo |
| 8 | **Cómo funciona** (3 pasos) | `#ciclo` | quita incertidumbre de proceso |
| 9 | **La bifurcación** (implementación) | `#implementacion` | monetiza sin vender; dos caminos válidos |
| 10 | **FAQ** (+2 preguntas) | — | barre objeciones antes del cierre |
| 11 | **Cierre + Footer** | — | peak-end: último recuerdo = generosidad |

> La diferenciación frente a la consultora tradicional es **implícita**
> (manifiesto + informe gratuito + bifurcación). Se descartó (2026-07-24) una
> sección comparativa explícita ("Por qué esto es distinto"): destacamos por lo
> propio, no atacando lo ajeno.

### Por qué este orden supera al anterior

- **Generosidad primero, miedo después:** el hero abre con el regalo; las
  sanciones bajan de la posición 2 a la 7 y cambian de marco ("El riesgo" →
  "Por qué esto importa"). *Primacy* al servicio de la confianza, no del temor.
- **El porqué antes del qué:** el manifiesto (pos. 3) desactiva la sospecha
  "¿cuál es la trampa?" antes de que bloquee el resto del scroll.
- **Un solo momento comercial:** la venta vive en la bifurcación (pos. 9),
  honesta y opcional; el resto es servicio.
- **Cierre sin presión:** *peak-end* — el recuerdo final es generosidad
  ("decidas lo que decidas"), no acoso.

## 8. Fundamento psicológico por bloque (resumen)

- **Hero:** *zero-price effect*, *goal-gradient*, *StoryBrand* (cliente = héroe).
- **Manifiesto:** *reciprocity*, *ambiguity aversion* eliminada, señal costosa
  ("si puedes solo, perfecto").
- **El Informe:** *endowment* anticipado ("es tuyo"), *anchoring* de valor,
  demostración sobre afirmación.
- **¿Alguna te suena?:** *self-referencing effect*, *problem-agitation* respetuoso.
- **El estándar:** *authority bias* (organismos), exhaustividad percibida.
- **Contexto legal:** *loss aversion* honesta, *framing* de servicio, *serial
  position* (dato duro al medio).
- **Cómo funciona:** *goal-gradient*, *default effect* (default = recibir informe).
- **Bifurcación:** *IKEA effect*, anti-*reactancia*, simetría visual = honestidad.
- **FAQ:** *objection handling*, *ambiguity aversion*.

## 9. Señales de confianza a mantener/agregar

- Entregar el informe **sin pedir correo ni teléfono** (señal costosa).
- **Mostrar el entregable** antes de pedir nada.
- Ofrecer sinceramente el **camino gratuito**.
- **Fundamento legal por artículo** en cada brecha.
- **Declarar el modelo de negocio** en voz alta (manifiesto + FAQ "¿por qué
  regalan esto?").
- **Autocertificación / dogfooding** (RFC §15): KPC cumple el estándar que
  entrega. Candidato a sello de confianza.
- **Confidencialidad por diseño** (RFC §15): la autoevaluación no exige datos de
  contacto y nada se comparte.

## 10. Aumento de conversión = remoción de fricción

Sin registro (fricción de datos) · sin reunión (fricción social/tiempo) · sin
precio en el sitio (fricción de compromiso) · resultado instantáneo (*Doherty
threshold*) · CTA único (fricción de decisión). La conversión **no se fuerza con
urgencia; se desbloquea quitando obstáculos** — la única vía coherente con el tono.

## 11. Pendientes / decisiones que requieren intervención humana

- **Discrepancia PDF/pantalla** (resuelta 2026-07-24): el PDF prometía
  "prioridad, esfuerzo y plazo" que no se renderizan. Se alineó el texto a lo
  que efectivamente se muestra (severidad + meta + acciones + respaldo). No
  comprometer plazos (RFC §18).
- **Afirmaciones legales** (FAQ "obligation", footer, fundamento por brecha)
  requieren validación del abogado especialista.
- **Autocertificación como sello público:** decisión de si/ cómo exponerla.
