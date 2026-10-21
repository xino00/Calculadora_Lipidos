# Lípidos · Consulta

[![Clinical tests and build](https://github.com/xino00/Calculadora_Lipidos/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/xino00/Calculadora_Lipidos/actions/workflows/ci.yml)

Aplicación web independiente, en español, para explorar riesgo cardiovascular, objetivos de LDL-c, Lp(a) y escenarios de tratamiento en adultos. Marco clínico **ESC/EAS 2025**. React + TypeScript + Vite; sin backend ni almacenamiento de datos clínicos.

**Estado: prototipo funcional pendiente de validación clínica externa.** Las pruebas automatizadas verifican las reglas implementadas; no constituyen validación prospectiva, certificación ni aval de ESC/EAS. No es una aplicación oficial de estas sociedades.

## Ejecutar

Requiere Node.js 22.12 o superior (CI usa Node 24).

```bash
git clone https://github.com/xino00/Calculadora_Lipidos.git
cd Calculadora_Lipidos
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`dist/` contiene una aplicación estática portable. `base: './'` usa rutas relativas, por lo que admite una subcarpeta de GitHub Pages sin modificar el nombre del repositorio. No utiliza router de servidor. El servidor de Vite es solo para desarrollo.

## Cuatro módulos

1. **Riesgo:** prevención primaria/secundaria; condiciones de riesgo alto/muy alto; SCORE2 y SCORE2-OP introducidos desde una calculadora oficial. Región baja (España) por defecto. No se calcula ni aproxima SCORE2.
2. **Objetivos LDL:** basal sin tratamiento y actual separados; objetivo absoluto y, en riesgo alto/muy alto, reducción ≥50 %; reducción absoluta y porcentual adicional. Basal desconocido nunca se reconstruye.
3. **Lp(a):** mg/dL o nmol/L, sin conversión. Cambiar la unidad vacía el valor. Modificador sin reclasificación automática.
4. **Tratamiento:** umbrales de inicio, orientación según pauta/tolerancia/SCA y comparación de combinaciones con promedios de reducción de la figura 2.

Incluye caso ficticio optativo, resumen revisable antes de copiar, restablecimiento completo y referencias en la interfaz.

## Arquitectura

```text
src/
  clinical/       Funciones puras: riesgo, LDL, Lp(a), umbrales, escenarios
  components/     Formularios y panel de resultados
  tests/          Casos clínicos sintéticos y pruebas de valores límite
  App.tsx         Estado efímero y navegación
  styles.css      Interfaz responsive sin recursos externos
.github/workflows/
  ci.yml          Instalación reproducible, pruebas y compilación
  pages.yml       Publicación optativa en Pages, con las mismas pruebas
docs/
  clinical-method.md    Fuentes y decisiones de implementación
  validation.md        Alcance de comprobaciones y revisión pendiente
```

## Decisiones clínicas clave

- Se aplican los cortes **2/10/20 % de la tabla 3 de ESC/EAS 2025**, no los umbrales por edad de ESC Prevención 2021. La edad solo selecciona SCORE2 (40–69) o SCORE2-OP (70–89).
- Diabetes, ERC, ASCVD, HF y factores muy elevados no se evalúan con SCORE2 general. La diabetes usa la tabla 3; los casos no cubiertos requieren valoración específica. No se implementa SCORE2-Diabetes.
- LDL basal **≥190 mg/dL** se considera al menos riesgo alto por la nota a de tabla 4 (documentada discrepancia con `>190` de tabla 3).
- El objetivo absoluto usa **<**; el criterio de reducción usa **≥50 %**. Si falta el basal, no se declara verificado el objetivo completo de alto/muy alto riesgo.
- El objetivo opcional <40 mg/dL se ofrece solo al marcar recurrencia con estatina máxima o enfermedad polivascular en prevención secundaria, como opción IIb de figura 1.
- Las estimaciones farmacológicas son promedios aproximados de combinaciones publicadas, no suma de reducciones individuales. Se aplican al basal sin tratamiento, nunca como descenso adicional sobre el LDL tratado.

Véase [método clínico](docs/clinical-method.md) y [validación](docs/validation.md).

## Privacidad y alcance

El estado vive solo en memoria de React. Sin formularios de identificación, backend, analítica, peticiones de datos, localStorage, sessionStorage, IndexedDB ni cookies de aplicación. No se incluyen datos clínicos en URL. Recargar o «Nuevo caso» elimina los campos. Solo el botón explícito de copiar escribe un resumen en el portapapeles. El hosting puede gestionar sus propios registros de acceso/autenticación; no recibe los campos de la calculadora.

No prescribe dosis individuales ni comprueba todas las contraindicaciones/interacciones. Embarazo/lactancia, hepatopatía activa y diálisis suspenden la ruta farmacológica. No cubre pediatría, hipertrigliceridemia, financiación española ni toda la guía de ERC 2026. El marco es 2025; no afirma incorporar automáticamente guías posteriores.

## Repositorio

Código en [github.com/xino00/Calculadora_Lipidos](https://github.com/xino00/Calculadora_Lipidos) (público). Rama principal: `main`. Cada cambio en `main` y cada pull request ejecutan `ci.yml` (instalación, pruebas y compilación).

El código es visible para cualquiera: no introducir claves API ni datos de pacientes en el repositorio, issues ni pull requests. El archivo `.openai/hosting.json` identifica el despliegue de Sites, pero no contiene secretos ni afecta a GitHub Pages.

El repositorio no incluye todavía un archivo de licencia; sin él, el código no otorga permisos de reutilización a terceros.

## GitHub Pages

Al ser un repositorio público, Pages está disponible en GitHub Free. El workflow `pages.yml` permanece desactivado hasta habilitarlo:

1. `Settings → Pages → Build and deployment → Source: GitHub Actions`.
2. `Settings → Secrets and variables → Actions → Variables`: crear `ENABLE_PAGES` con valor `true`.
3. En `Actions → Deploy GitHub Pages → Run workflow` (o subir un cambio a `main`).
4. Abrir la URL devuelta por el despliegue, previsiblemente `https://xino00.github.io/Calculadora_Lipidos/`. Puede añadirse a la pantalla de inicio del móvil desde el navegador. No se promete funcionamiento sin conexión: no hay service worker.

Si el repositorio pasa a privado, Pages requiere un plan de GitHub compatible.

El workflow ejecuta pruebas y compilación antes de publicar. Las acciones están fijadas a los SHA publicados en la guía de despliegue de Vite consultada el 21/10/2026. La activación y ejecución remota del workflow requiere un repositorio y los permisos correspondientes; el código local por sí solo no verifica el despliegue en GitHub.

Alternativa: cualquier hosting estático que acepte `dist/`; no requiere servidor propio, base de datos ni claves. Las condiciones de gratuidad dependen del proveedor.

Fuentes de despliegue: [Vite](https://vite.dev/guide/static-deploy.html), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Fuentes y uso del contenido

La implementación contiene reglas y cálculos propios basados en hechos clínicos con enlaces a las fuentes. No distribuye PDFs, tablas, figuras originales, logos ni coeficientes de SCORE2. La guía y su material pertenecen a sus titulares; consultar sus condiciones de reutilización antes de una distribución institucional o comercial. No se atribuye a este proyecto ninguna licencia de contenido de ESC/EAS.

- Mach et al. [ESC/EAS 2025](https://doi.org/10.1093/eurheartj/ehaf190).
- [Corrección editorial](https://doi.org/10.1093/eurheartj/ehaf1036), sin cambios de reglas clínicas.
- [ESC/EAS 2019](https://doi.org/10.1093/eurheartj/ehz455), guía de base.
- [CIMA: Nilemdo](https://cima.aemps.es/cima/dochtml/ft/1201425002/FT_1201425002.html) y [atorvastatina](https://cima.aemps.es/cima/dochtml/ft/74072/FT_74072.html).

Revisión de fuentes: 21/10/2026.
