# Validación de implementación

Estado: comprobación técnica y revisión de reglas; **no validación clínica externa ni prospectiva**.

Comprobación del 21/10/2026: **181 pruebas automatizadas superadas** y compilación TypeScript/Vite correcta.

## Comprobación de interfaz

Revisión en navegador de escritorio y en un viewport de 390 × 844 píxeles (simulación de anchura móvil, no ensayo en dispositivo físico). Se verificaron navegación, ejemplo ficticio, cálculo del objetivo, cambio de unidad de Lp(a) con vaciado del valor, entrada con coma decimal, cambio del escenario farmacológico, cálculo de SCORE2 con su categoría y paso a entrada manual, y reinicio del caso. No se observó desbordamiento horizontal. Con LDL actual de 50 mg/dL y basal desconocido en prevención secundaria, el objetivo completo permanece sin verificar.

## Pruebas automatizadas

Ejecutar `npm test`. Las pruebas usan casos sintéticos. Cubren:

- SCORE2/SCORE2-OP calculados: ejemplos resueltos de los suplementos originales (SCORE2 en las cuatro regiones; riesgo sin calibrar de SCORE2 y SCORE2-OP), 18 casos de referencia de MDCalc y el ejemplo publicado de U-Prevent, con ambos sexos, tabaquismo y las cuatro regiones; cambio de modelo entre 69 y 70 años; datos incompletos, HDL-c ≥ colesterol total, valores fuera de rango, lípidos bajo tratamiento y PA sistólica ≥180 o CT >310 mg/dL.
- Cortes 2/10/20 %, incluidos valores inmediatamente adyacentes; edades 40/70/89 y exclusiones.
- Entrada manual: confirmación del origen y la región de SCORE2; bloqueo de resultados calculados bajo tratamiento.
- Prioridad de ASCVD, HF, factores aislados, diabetes y ERC frente al score.
- FG a ambos lados de 30 y 60; ERC conocida frente a dato aislado; información incompleta.
- Diabetes: edad, duración, lesión de órgano, número de factores, DM1 de inicio precoz y frontera >20 años.
- LDL basal ≥190, ausencia de basal, reducción ≥50 % y objetivo absoluto estricto.
- Diferencia entre descenso total desde basal y descenso adicional desde actual.
- Umbrales de inicio en cada categoría y prevención secundaria.
- Lp(a) en cada unidad, valores exactos de umbral, ausencia de conversión o reclasificación automática.
- Combinaciones farmacológicas publicadas, no suma de efectos ni reconstrucción del basal.
- Suspensión de la ruta en situaciones especiales; intolerancia completa; objetivo ya alcanzado; SCA.
- Entrada numérica con coma decimal y rechazo de notaciones ambiguas.

## Qué queda fuera de estas pruebas

No prueban que un paciente real haya sido clasificado correctamente a partir de su historia, la integridad de la historia aportada, la eficacia individual de una combinación, todas las fichas técnicas, las interacciones completas o la elegibilidad de financiación. Las pruebas de SCORE2 comprueban la implementación de las ecuaciones publicadas; no validan el modelo en población española ni resuelven la discrepancia de escalas del suplemento de SCORE2-OP descrita en el método clínico.

## Revisión clínica antes de uso asistencial

Se requiere evaluación independiente con casos representativos, contraste con los calculadores oficiales cuando correspondan, revisión por un profesional del alcance y excepciones, y aprobación institucional si se integra en práctica asistencial. El código y las fuentes permiten revisar cada regla. La compilación y las pruebas unitarias, por sí solas, no equivalen a esa aprobación.

## Despliegue

La compilación local y el despliegue de Sites se verifican por separado. Los workflows de GitHub quedan preparados, pero su ejecución remota solo puede verificarse después de crear/conectar el repositorio y activar Pages cuando el plan lo permita.
