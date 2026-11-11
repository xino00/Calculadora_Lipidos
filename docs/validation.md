# Validación de implementación

Estado: comprobación técnica y revisión de reglas; **no validación clínica externa ni prospectiva**.

Comprobación del 11/11/2026: **189 pruebas automatizadas superadas** y compilación TypeScript/Vite correcta. Se conservan las 181 pruebas anteriores y se añaden 8 comprobaciones de presentación de opciones farmacológicas.

## Comprobación de interfaz

Revisión del flujo en dos pantallas en Chromium, a 1440 × 1000 y 390 × 844 píxeles (simulación de móvil, no dispositivo físico). Se inspeccionaron capturas de datos, resultados y catálogo. No se observó desbordamiento horizontal, tampoco al desplegar el simulador.

Se comprobaron navegación y conservación de edad/LDL al editar, ejemplo ficticio, reinicio, fuentes auxiliares, SCORE2 calculado y manual, entrada con coma decimal, campos condicionales de diabetes/ERC, errores de HDL y rango manual, y contenido/copia del resumen al portapapeles del navegador de prueba. Un error de Lp(a) dentro de un desplegable cerrado lo abre, enfoca el campo y mantiene la pantalla de datos; cambiar la unidad vacía el valor.

Casos de seguridad del flujo: basal desconocido con LDL actual 50 mg/dL en prevención secundaria mantiene el objetivo sin verificar y suspende estimaciones; intolerancia completa excluye estatinas; la contradicción con una pauta estatínica permanece visible en resultados; objetivo cumplido no muestra el catálogo como intensificación; embarazo, hepatopatía activa y diálisis suspenden opciones y simulación; los datos incompletos permiten consultar el resultado parcial sin desbloquear fármacos. El simulador empieza sin selección y la combinación ezetimiba/bempedoico conserva su cálculo desde el basal.

La revisión documental independiente del catálogo contrastó cada dosis, vía, intervalo e intensidad con los originales enlazados en el método clínico. Se corrigió la atribución de síntomas tendinosos a la ficha de Nilemdo: el aviso enlazado ahora se refiere a síntomas musculares con estatinas. Esta revisión se limita al contenido añadido, no acredita vigencia integral ni validación clínica externa.

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
- Presentación de opciones: filtros de intolerancia en todos los componentes, selección incompatible sin sustitución automática, catálogo vacío con bloqueos o datos pendientes, y consulta educativa con objetivo cumplido o indicación de hábitos.

## Qué queda fuera de estas pruebas

No prueban que un paciente real haya sido clasificado correctamente a partir de su historia, la integridad de la historia aportada, la eficacia individual de una combinación, todas las fichas técnicas, las interacciones completas o la elegibilidad de financiación. Las pruebas de SCORE2 comprueban la implementación de las ecuaciones publicadas; no validan el modelo en población española ni resuelven la discrepancia de escalas del suplemento de SCORE2-OP descrita en el método clínico.

## Revisión clínica antes de uso asistencial

Se requiere evaluación independiente con casos representativos, contraste con los calculadores oficiales cuando correspondan, revisión por un profesional del alcance y excepciones, y aprobación institucional si se integra en práctica asistencial. El código y las fuentes permiten revisar cada regla. La compilación y las pruebas unitarias, por sí solas, no equivalen a esa aprobación.

## Despliegue

La compilación local y la publicación en GitHub Pages se verifican por separado. El único workflow de publicación es `pages.yml`, que prueba, compila y sube `dist/`. Tras un push autorizado, comprobar tanto su ejecución como el HTML y los recursos servidos; superar las pruebas locales no demuestra que los cambios estén publicados.
