---
title: Propuesta de mitigación — Seguridad de la información
breach: B-SEG-001
control: DPC-SEG-001
---

# Seguridad de la información y control de accesos

**Empresa:** {{companyName}} · **RUT:** {{rut}}
**Preparado por:** DPC — Data Protection Compliance · **Fecha:** {{date}}

Esta propuesta detalla cómo cerrar la brecha de seguridad detectada en su
diagnóstico, en qué orden y con qué evidencia respaldar cada avance. Es una
guía de trabajo: los plazos y responsables se ajustan a la realidad de la
empresa junto a su consultor asignado.

## 1. El hallazgo, en concreto

El diagnóstico detectó que datos personales de la empresa se almacenan en
**planillas y documentos sin control** —Excel en computadores locales,
carpetas compartidas sin permisos, o cuentas de nube personales—, sin cifrado,
sin respaldo confiable y sin registro de quién accede.

La Ley 21.719 (Art. 14 quinquies) exige aplicar **medidas de seguridad
técnicas y organizativas apropiadas al riesgo** del tratamiento. La ausencia
de estas medidas es, en sí misma, una infracción —no solo un problema
técnico— y agrava cualquier incidente que ocurra: una filtración desde una
planilla sin control es más probable, más difícil de contener y deja a la
empresa sin evidencia de haber actuado con diligencia.

> El nivel de seguridad exigido es mayor mientras más sensibles o más
> voluminosos sean los datos. Una base con datos de salud, financieros o de
> menores exige un estándar más alto que un listado de contactos comerciales.

## 2. Meta de la mitigación

Al cerrar esta brecha, los datos personales de {{companyName}} dejan de vivir
en archivos sueltos y pasan a un entorno con **acceso restringido por
función, respaldo probado y trazabilidad**, respaldado por una política de
seguridad que el equipo conoce y aplica.

## 3. Plan de acción

### Acción 1 — Consolidar los datos en un repositorio con acceso controlado

Migrar las planillas y documentos dispersos a un único repositorio con
permisos por rol. Opciones habituales para una pyme:

- Una unidad compartida de **Google Workspace** o **Microsoft 365 Business**
  con carpetas por área y permisos por persona.
- El módulo de datos de un **sistema de gestión** (ERP/CRM) que ya se use.

Una vez migrados, **eliminar las copias sueltas** de escritorios y correos.

*Evidencia a subir:* captura del repositorio mostrando la estructura de
carpetas y la configuración de permisos.

### Acción 2 — Cuentas individuales con mínimo privilegio

Reemplazar los usuarios compartidos por **una cuenta por persona**. Cada
usuario accede solo a lo que su función necesita:

| Rol | Acceso típico |
| --- | --- |
| Administración / finanzas | Datos de facturación, remuneraciones |
| Ventas / atención | Datos de contacto de clientes |
| Gerencia | Vista general, sin edición operativa |

Activar **verificación en dos pasos** en todas las cuentas que lo permitan.

*Evidencia a subir:* listado de usuarios con su nivel de acceso y captura de
la verificación en dos pasos activa.

### Acción 3 — Respaldo y trazabilidad

- Configurar **respaldos periódicos** (idealmente diarios) y probar al menos
  una vez que se puede restaurar.
- Donde el sistema lo permita, activar el **registro de accesos** (quién
  consultó o modificó cada dato).

*Evidencia a subir:* configuración del respaldo (frecuencia) y muestra de la
bitácora de accesos.

### Acción 4 — Política de seguridad y capacitación

Formalizar las reglas mínimas con la **Política de Seguridad de la Información
y Control de Accesos** (disponible como documento tipo en su portal):
contraseñas robustas, prohibición de cuentas de nube personales para datos de
la empresa, escritorio limpio y revocación de accesos al término de funciones.
Capacitar al equipo en su aplicación.

*Evidencia a subir:* política firmada y registro de la capacitación.

## 4. Documentos tipo disponibles en su portal

- **Política de Seguridad de la Información y Control de Accesos** — base
  lista para personalizar y firmar.

## 5. Cómo se verifica el cierre

La brecha se marca como resuelta cuando estén subidas las evidencias de las
cuatro acciones. Su consultor DPC revisa cada evidencia antes de considerarla
válida para la certificación.

---

*Documento preparado por DPC — Data Protection Compliance como base estándar.
Su contenido es referencial y debe ajustarse a la operación real de la empresa
junto al consultor asignado.*
