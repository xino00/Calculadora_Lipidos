# Lípidos · Consulta

[![Clinical tests and build](https://github.com/xino00/Calculadora_Lipidos/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/xino00/Calculadora_Lipidos/actions/workflows/ci.yml)

**Calculadora clínica de riesgo cardiovascular, objetivos de LDL-c, lipoproteína(a) y tratamiento hipolipemiante en adultos, basada en la actualización 2025 de las guías ESC/EAS de dislipidemias.**

**Abrir la calculadora: [xino00.github.io/Calculadora_Lipidos](https://xino00.github.io/Calculadora_Lipidos/)**

> [!WARNING]
> **Prototipo pendiente de validación clínica externa.** Es una herramienta de apoyo para profesionales sanitarios: no sustituye al juicio clínico ni a la lectura de la guía. No es una herramienta oficial de la ESC ni de la EAS ni cuenta con su aval.

## ¿Para qué sirve?

Ayuda a aplicar de forma ordenada y trazable las recomendaciones ESC/EAS 2025 durante la consulta, siguiendo el razonamiento clínico habitual:

**riesgo cardiovascular → objetivo de LDL-c → decisión terapéutica**

| Pregunta clínica | Qué hace la calculadora |
| --- | --- |
| ¿Cuál es el riesgo cardiovascular del paciente? | Lo clasifica en bajo, moderado, alto o muy alto a partir de las condiciones clínicas (enfermedad cardiovascular aterosclerótica, aterosclerosis en imagen, diabetes, ERC, hipercolesterolemia familiar, factores aislados muy elevados) o, si no las hay, del SCORE2/SCORE2-OP obtenido en la calculadora oficial. |
| ¿Cuál es su objetivo de LDL-c y cuánto le falta? | Calcula el objetivo absoluto y, en riesgo alto o muy alto, el criterio de reducción ≥50 % desde el basal. Muestra el descenso adicional necesario en mg/dL y en porcentaje. |
| ¿Cómo interpreto su Lp(a)? | La sitúa respecto a los umbrales de la guía, en mg/dL o nmol/L, sin convertir unidades ni reclasificar el riesgo automáticamente. |
| ¿Cuándo tratar y con qué? | Indica si se recomienda o se debe considerar iniciar tratamiento, propone una ruta orientativa según tolerancia a estatinas, pauta actual y síndrome coronario agudo, y compara el LDL-c estimado con distintas combinaciones de fármacos. |

Al terminar genera un **resumen en texto** para revisar y copiar a la historia clínica.

**Dirigida a** médicos y otros profesionales sanitarios que atienden a adultos en prevención cardiovascular: atención primaria, cardiología, medicina interna, endocrinología y residentes de estas especialidades.

## ¿En qué se basa?

### Guías

- **Fuente principal:** Mach F, Koskinas KC, Roeters van Lennep JE, Tokgözoğlu L, Badimon L, Baigent C, et al. *2025 Focused Update of the 2019 ESC/EAS Guidelines for the management of dyslipidaemias.* Eur Heart J. 2025;46(42):4359–4378. [doi:10.1093/eurheartj/ehaf190](https://doi.org/10.1093/eurheartj/ehaf190)
- **Guía de base que la actualización complementa:** Mach F, Baigent C, Catapano AL, et al. *2019 ESC/EAS Guidelines for the management of dyslipidaemias: lipid modification to reduce cardiovascular risk.* Eur Heart J. 2020;41(1):111–188. [doi:10.1093/eurheartj/ehz455](https://doi.org/10.1093/eurheartj/ehz455)
- [Corrección editorial](https://doi.org/10.1093/eurheartj/ehaf1036) de la actualización 2025: no modifica reglas clínicas.

### Qué parte de la guía usa cada módulo

| Módulo | Elementos de ESC/EAS 2025 |
| --- | --- |
| 1 · Riesgo | Tabla 3 (categorías de riesgo); tabla 4, nota a (LDL-c basal ≥190 mg/dL) |
| 2 · Objetivos LDL-c | Figura 1 (objetivos por categoría y opción <40 mg/dL, clase IIb) |
| 3 · Lp(a) | Cuadro 1, sección 6 y recomendación 4 |
| 4 · Tratamiento | Tabla 4 y recomendación 1 (inicio), recomendaciones 2–3 (fármacos y SCA), figura 2 (reducción media de cada combinación) |

Otras fuentes:

- **SCORE2 / SCORE2-OP:** la calculadora no los calcula. Se introduce el resultado de la herramienta oficial [HeartScore](https://www.heartscore.org/); la región de riesgo baja (España) es la predeterminada.
- **Fichas técnicas de la AEMPS (CIMA)** de [ácido bempedoico (Nilemdo)](https://cima.aemps.es/cima/dochtml/ft/1201425002/FT_1201425002.html) y [atorvastatina](https://cima.aemps.es/cima/dochtml/ft/74072/FT_74072.html), para las notas de posología y precauciones.

### Objetivos de LDL-c que aplica

| Riesgo | Objetivo | Además |
| --- | --- | --- |
| Bajo | <116 mg/dL (3,0 mmol/L) | — |
| Moderado | <100 mg/dL (2,6 mmol/L) | — |
| Alto | <70 mg/dL (1,8 mmol/L) | Reducción ≥50 % desde el basal |
| Muy alto | <55 mg/dL (1,4 mmol/L) | Reducción ≥50 % desde el basal. Opcional <40 mg/dL (1,0 mmol/L), clase IIb, si hay evento recurrente con estatina a dosis máxima tolerada o enfermedad polivascular |

La calculadora trabaja en mg/dL. Si se desconoce el LDL-c basal, no da por cumplido el objetivo completo en riesgo alto o muy alto.

### Criterios propios donde la guía deja margen

- **Cortes de SCORE2:** usa los cortes fijos 2/10/20 % de la tabla 3 de 2025, no los umbrales por edad de la guía de prevención ESC 2021.
- **LDL-c basal de 190 mg/dL:** se considera al menos riesgo alto (≥190, tabla 4), aunque la tabla 3 imprime >190.
- **Lp(a):** >50 mg/dL o >105 nmol/L se muestra como modificador de riesgo; el valor exacto de 105 nmol/L aparece como «en el umbral».
- **Diabetes:** aplica los criterios de la tabla 3; no implementa SCORE2-Diabetes y pide valoración específica en los casos que la tabla no cubre.
- **Simulador de fármacos:** aplica la reducción media de cada combinación (figura 2) al LDL-c basal sin tratamiento. No suma porcentajes de fármacos individuales ni los aplica sobre el LDL-c ya tratado.

El detalle de cada regla, con su tabla o figura de origen, está en [docs/clinical-method.md](docs/clinical-method.md).

## Cómo se usa

1. **Riesgo:** edad, prevención primaria o secundaria y condiciones clínicas. Si procede, el SCORE2/SCORE2-OP obtenido en HeartScore.
2. **Objetivos LDL-c:** LDL-c basal sin tratamiento y, si ya está tratado, LDL-c actual.
3. **Lp(a):** valor y unidad del laboratorio (opcional).
4. **Tratamiento:** tolerancia a estatinas, pauta actual y situaciones especiales. Permite explorar escenarios de combinación.
5. **Resumen:** revisarlo y copiarlo.

«Explorar un ejemplo» carga un caso ficticio; «Nuevo caso» borra todos los campos.

## Qué no hace

- No calcula SCORE2, SCORE2-OP ni SCORE2-Diabetes, ni incluye sus coeficientes.
- No prescribe dosis individuales ni comprueba todas las contraindicaciones e interacciones.
- No propone tratamiento farmacológico en embarazo o lactancia, hepatopatía activa o diálisis.
- No cubre pediatría, hipertrigliceridemia, criterios de financiación del SNS ni la valoración completa de la ERC.
- No convierte la Lp(a) entre mg/dL y nmol/L ni eleva la categoría de riesgo automáticamente por modificadores; la reclasificación es una decisión del profesional.
- No incorpora automáticamente guías posteriores a 2025.

## Privacidad

Todo se procesa en el navegador y se mantiene solo en memoria: sin servidor, sin analítica, sin cookies ni almacenamiento local y sin datos clínicos en la URL. No se piden datos identificativos. Recargar la página o pulsar «Nuevo caso» borra la información. Solo el botón de copiar escribe el resumen en el portapapeles.

## Validación

138 pruebas automatizadas con casos sintéticos comprueban los valores límite de cada regla: cortes de SCORE2, edades, filtrado glomerular, criterios de diabetes, LDL-c basal ≥190, reducción ≥50 %, umbrales de Lp(a), combinaciones de fármacos y situaciones especiales. Verifican que las reglas están implementadas como se describen; **no son una validación clínica**.

Antes de usarla en la práctica asistencial se necesita una revisión independiente con casos reales representativos, el contraste con las calculadoras oficiales y, si se integra en un centro, su aprobación institucional. Más detalle en [docs/validation.md](docs/validation.md).

## Desarrollo

Aplicación estática en React + TypeScript + Vite, sin backend. Requiere Node.js 22.12 o superior (CI usa Node 24).

```bash
git clone https://github.com/xino00/Calculadora_Lipidos.git
cd Calculadora_Lipidos
npm ci
npm run dev      # servidor de desarrollo
npm test         # pruebas clínicas
npm run build    # genera dist/
npm run preview  # sirve dist/ en local
```

```text
src/
  clinical/       Reglas clínicas como funciones puras: riesgo, LDL-c, Lp(a), umbrales, escenarios
  components/     Formularios y panel de resultados
  tests/          Casos clínicos sintéticos y pruebas de valores límite
  App.tsx         Estado efímero y navegación
  styles.css      Interfaz responsive sin recursos externos
.github/workflows/
  ci.yml          Instalación, pruebas y compilación en cada cambio de main y cada pull request
  pages.yml       Publicación en GitHub Pages, con las mismas pruebas
docs/
  clinical-method.md   Fuentes y decisiones de implementación
  validation.md        Alcance de las comprobaciones y revisión pendiente
```

`dist/` es una web estática portable: `base: './'` usa rutas relativas y funciona en cualquier subcarpeta o hosting estático.

### Publicación en GitHub Pages

Cada cambio en `main` ejecuta `pages.yml`: instala, pasa las pruebas, compila y publica `dist/` en **https://xino00.github.io/Calculadora_Lipidos/**. Si alguna prueba falla, no se publica. También puede lanzarse a mano desde *Actions → Deploy GitHub Pages → Run workflow*.

Requiere que [Settings → Pages](https://github.com/xino00/Calculadora_Lipidos/settings/pages) tenga *Source: GitHub Actions* (ya configurado; la app móvil de GitHub no muestra este ajuste, hay que usar el navegador).

La web puede añadirse a la pantalla de inicio del móvil; no funciona sin conexión (no hay service worker).

El repositorio es público: no subir claves ni datos de pacientes al código, issues o pull requests.

## Uso del contenido de las guías

La calculadora contiene reglas y cálculos propios basados en las guías citadas, con enlaces a las fuentes. No distribuye PDFs, tablas o figuras originales, logos ni coeficientes de SCORE2. La guía y su material pertenecen a sus titulares; consultar sus condiciones de reutilización antes de una distribución institucional o comercial.

Revisión de fuentes: 21/10/2026.

## Licencia

Código bajo [licencia MIT](LICENSE), proporcionado «tal cual», sin garantía de ningún tipo. La licencia cubre solo el código de este repositorio; las guías ESC/EAS y su material siguen perteneciendo a sus titulares.
