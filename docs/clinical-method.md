# Método clínico y trazabilidad

Marco: adultos, prevención y seguimiento lipídico, ESC/EAS 2025. Revisión documental: 21 de octubre de 2026. La actualización de 2025 complementa la guía de 2019. Se revisó también la corrección ehaf1036: solo modifica la identificación de una revisora.

Fuente principal inspeccionada: texto íntegro publicado, DOI [10.1093/eurheartj/ehaf190](https://doi.org/10.1093/eurheartj/ehaf190), pp. 4359–4378. Se comprobaron visualmente figuras 1 y 2; extracción de texto para tablas 3–4 y recomendaciones 1–4. No se incluye una copia de las fuentes en este repositorio.

| Regla | Fuente exacta | Implementación |
| --- | --- | --- |
| Riesgo por SCORE2: <2, 2–<10, 10–<20, ≥20 % | Tabla 3, p. 4364 | `risk.ts` |
| SCORE2 <70 y SCORE2-OP ≥70; intervalo total 40–89 | Sección 3 y recomendación 1 | `scoreModel`; resultado externo |
| No recalcular con lípidos bajo tratamiento | Sección 3, p. 4367 | Confirmación de origen y resultado previo si tratado |
| ASCVD, diabetes, ERC, HF y factores graves | Tabla 3 y notas | Prioridad de condiciones; SCORE2 general excluido |
| LDL ≥190: al menos alto | Tabla 4, nota a | Umbral inclusivo documentado |
| Objetivos 116/100/70/55; ≥50 % en alto/muy alto | Figura 1 | `targets.ts`, sin redondear antes de comparar |
| Opción <40 | Figura 1, clase IIb | Activación clínica explícita, no automática |
| Inicio farmacológico en primaria | Recomendación 1, p. 4367 | `thresholds.ts`, solo LDL basal |
| Lp(a) como modificador; umbral >50/>105 | Cuadro 1 y recomendación 4 | `lpa.ts`, sin multiplicador ni conversión |
| Fármacos y combinaciones | Sección 4, figura 2 y recomendación 2 | `medications.ts`, promedios publicados |
| Intensificación durante SCA | Recomendación 3 | Rama específica al marcar SCA |
| Perfil lipídico a 4–6 semanas | Sección 4, p. 4368 | Recordatorio tras cambios |
| Bempedoico 180 mg/día, simvastatina y precauciones | CIMA Nilemdo, 4.2–4.5 | Notas enlazadas; no prescripción automática |

## Diferencias de marcos y ambigüedades

**No fusionar guías.** Los umbrales de la tabla 3 de 2025 son fijos, aunque la guía de prevención 2021 utilice cortes por edad. El programa no transforma un SCORE antiguo en SCORE2 ni multiplica el porcentaje introducido.

**Diabetes.** Se aplica literalmente la tabla 3 de dislipidemias 2025. La propia actualización remite a SCORE2-Diabetes/ESC 2023 para DM2 sin ASCVD. Esa vía no está implementada; no se aplican los cortes del SCORE2 general a SCORE2-Diabetes. Cuando la tabla 3 no determina una categoría, se solicita valoración individual. La reclasificación manual muestra motivo y no puede rebajar un criterio automático.

**ERC.** Se exige ERC confirmada; un FG aislado no diagnostica cronicidad. Con FG ≥60, la tabla no basta para asignar riesgo por ERC. Albuminuria y guías renales específicas requieren revisión separada. No se presenta el programa como síntesis de toda la normativa clínica de 2026.

**LDL 190 mg/dL.** Tabla 3 imprime >190; tabla 4, nota a, establece ≥190 como al menos riesgo alto. La implementación adopta ≥190 para no clasificar como bajo/moderado a un paciente en la casilla de LDL basal ≥190.

**Lp(a) 105 nmol/L.** El cuadro 1 y la recomendación 4 hablan de valores por encima del umbral; un párrafo usa ≥105. En el valor exacto, la interfaz muestra «en el umbral» y explicita la variación. El riesgo es continuo y no hay salto automático de categoría. Rangos intermedios se basan en la sección 6, no en una etiqueta de normalidad universal.

**Objetivo <40 mg/dL.** Figura 1 de 2025 incluye recurrencia vascular mientras se recibe estatina máxima tolerada o enfermedad polivascular. Es opción IIb. Se conserva categoría muy alta y se etiqueta el objetivo como opcional; no se impone a toda prevención secundaria. No se incorpora el límite temporal de 2 años de 2019 como si fuera la redacción literal de figura 1 de 2025.

**Cálculos.** Se expresa LDL en mg/dL. Para objetivo `T` y basal `B`, se comprueba actual `<T` y, cuando procede, actual `≤B/2`. El umbral conjunto es `min(T, B/2)`. La distancia hasta el umbral es `max(0, actual−umbral)`; el porcentaje adicional divide por el actual. Si se necesita desigualdad estricta, la interfaz lo advierte. Si falta basal, solo se verifica el objetivo absoluto.

**Escenarios.** Valores de figura 2 para cada combinación; `LDL estimado = basal × (100−reducción)/100`. El orden de operaciones evita que 275 con un descenso del 80 % produzca un valor binario inferior a 55 y se interprete como cumplimiento del objetivo estricto. No se modelan dosis individuales, respuesta del paciente, abandono ni efecto incremental sobre una pauta actual. No hay una secuencia rígida que obligue a usar bempedoico antes de anti-PCSK9.

## Límites operativos

Rangos de entrada son límites del prototipo, no intervalos fisiológicos: edad adulta 18–110, LDL >0–1000 mg/dL, FG >0–200, Lp(a) 0–500 mg/dL o 0–1500 nmol/L. Fuera de estos rangos se debe revisar el caso manualmente. No se infiere sexo, etnia, tratamiento ni diagnóstico a partir de un identificador; no se solicita ninguno.
