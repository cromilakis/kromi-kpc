/**
 * QUESTION_HELP — "por qué importa" de cada pregunta del diagnóstico.
 *
 * Texto de UX (no una determinación legal) que se muestra bajo cada pregunta
 * del autodiagnóstico para que la persona entienda qué aporta su respuesta al
 * resultado. Se mantiene aparte del árbol de decisión (mismo patrón que
 * `breach-content.ts`) para no mezclar contenido editorial con la lógica del
 * motor. Clave = id del nodo de screening (`S-0xx`) o de la pregunta de
 * profundización. Si una pregunta no tiene entrada, la UI simplemente no
 * muestra la línea.
 */
export const QUESTION_HELP: Record<string, string> = {
  // Screening (las 22 preguntas base que ve todo el mundo). Descripciones muy
  // breves: qué define esta pregunta en el diagnóstico.
  "S-001": "Define el alcance de las obligaciones y el volumen de datos a proteger.",
  "S-002": "Determina qué riesgos y obligaciones específicas aplican a tu operación.",
  "S-003": "Delimita a qué personas debes proteger y qué derechos garantizar.",
  "S-004": "Los datos sensibles exigen resguardos reforzados; su presencia cambia el diagnóstico.",
  "S-005": "Todo proveedor con acceso a tus datos debe estar bajo contrato.",
  "S-006": "El lugar donde viven los datos define la seguridad exigible.",
  "S-007": "Una cuenta personal para datos de empresa rara vez cumple la seguridad mínima.",
  "S-008": "Recolectar datos en la web obliga a informar y pedir consentimiento.",
  "S-009": "El marketing directo exige una base de licitud distinta del contacto operativo.",
  "S-010": "Las cámaras captan datos y exigen aviso, finalidad y conservación reglada.",
  "S-011": "Huella y rostro son datos sensibles: exigen justificación y resguardos.",
  "S-012": "Guardar datos fuera de Chile activa reglas de transferencia internacional.",
  "S-013": "Revela si conservas datos históricos sin un plazo de eliminación definido.",
  "S-014": "Sin saber dónde están los datos, no puedes eliminarlos cuando lo piden.",
  "S-015": "Informar cómo tratas los datos es una obligación básica de transparencia.",
  "S-016": "Sin un registro de datos, no puedes demostrar cumplimiento ante una fiscalización.",
  "S-017": "Un responsable formal es la base de la gobernanza de datos.",
  "S-018": "Debes responder las solicitudes de derechos dentro de 30 días.",
  "S-019": "Ante una filtración hay que contener y notificar a tiempo.",
  "S-020": "Decidir sobre personas sin intervención humana exige evaluación de impacto.",
  "S-021": "Tratar datos por encargo de terceros conlleva obligaciones que van por contrato.",
  "S-022": "El personal sin capacitación es una de las principales causas de incidentes.",
};
