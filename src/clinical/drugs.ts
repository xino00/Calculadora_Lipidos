// Dose options are references for adults, not starting doses or an individual prescription.
// Sources checked on this date concern this catalogue only, not all clinical rules.
export const DRUGS_REVIEWED = '11/11/2026';
export const DRUG_REFERENCES = [
  { id: 'statin-intensity', title: 'AHA/ACC · intensidad de las estatinas', detail: 'Tabla 3 del documento de 2018: principios activos y dosis por intensidad. Solo se utiliza esta clasificación; no sus umbrales terapéuticos.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7403606/' },
  { id: 'atorva', title: 'AEMPS · atorvastatina', detail: 'Ficha técnica, apartados 4.2–4.5: posología, contraindicaciones e interacciones.', url: 'https://cima.aemps.es/cima/dochtml/ft/74072/FT_74072.html' },
  { id: 'rosuva', title: 'AEMPS · rosuvastatina', detail: 'Ficha técnica, apartados 4.2–4.3: dosis y restricciones específicas de 40 mg.', url: 'https://cima.aemps.es/cima/dochtml/ft/80213/FT_80213.html' },
  { id: 'simva', title: 'AEMPS · simvastatina', detail: 'Ficha técnica, apartado 4.2: administración oral en una toma nocturna.', url: 'https://cima.aemps.es/cima/dochtml/ft/64415/FT_64415.html' },
  { id: 'ezetimibe', title: 'AEMPS · ezetimiba', detail: 'Ficha técnica Ezetrol, apartado 4.2: posología y administración.', url: 'https://cima.aemps.es/cima/dochtml/ft/65376/FT_65376.html' },
  { id: 'nilemdo', title: 'AEMPS · ácido bempedoico', detail: 'Ficha técnica Nilemdo, apartados 4.2–4.5: posología, precauciones e interacción con simvastatina.', url: 'https://cima.aemps.es/cima/dochtml/ft/1201425002/FT_1201425002.html' },
  { id: 'alirocumab', title: 'EMA · alirocumab', detail: 'Ficha técnica Praluent, apartado 4.2: pautas subcutáneas en adultos.', url: 'https://www.ema.europa.eu/en/documents/product-information/praluent-epar-product-information_en.pdf' },
  { id: 'evolocumab', title: 'EMA · evolocumab', detail: 'Ficha técnica Repatha, apartado 4.2: pautas subcutáneas en hipercolesterolemia primaria y prevención cardiovascular.', url: 'https://www.ema.europa.eu/en/documents/product-information/repatha-epar-product-information_en.pdf' },
] as const;
type SourceId = typeof DRUG_REFERENCES[number]['id'];
export interface DrugOption {
  name: string;
  dose: string;
  route: string;
  sourceId: SourceId;
  caution?: string;
}
export interface DrugGroup {
  name: string;
  description: string;
  options: readonly DrugOption[];
  sourceId?: SourceId;
}
export const DRUG_GROUPS = {
  high: {
    name: 'Atorvastatina / rosuvastatina (alta intensidad)',
    description: 'Alternativas de alta intensidad. Usar una estatina a la dosis máxima tolerada; estas opciones no son dosis iniciales automáticas.',
    sourceId: 'statin-intensity',
    options: [
      { name: 'Atorvastatina', dose: '40 u 80 mg una vez al día', route: 'Vía oral', sourceId: 'atorva' },
      { name: 'Rosuvastatina', dose: '20 o 40 mg una vez al día', route: 'Vía oral', sourceId: 'rosuva', caution: '40 mg: solo como escalado en hipercolesterolemia grave y alto riesgo si 20 mg no alcanza el objetivo, con seguimiento y supervisión especializada recomendada. Contraindicada a 40 mg si el aclaramiento de creatinina es <60 mL/min y en otras situaciones descritas en ficha técnica. El FG estimado del formulario no equivale a ese aclaramiento.' },
    ],
  },
  moderate: {
    name: 'Atorvastatina / rosuvastatina / simvastatina (intensidad moderada)',
    description: 'Alternativas de intensidad moderada. La dosis se individualiza según tolerancia, interacciones y respuesta.',
    sourceId: 'statin-intensity',
    options: [
      { name: 'Atorvastatina', dose: '10 o 20 mg una vez al día', route: 'Vía oral', sourceId: 'atorva' },
      { name: 'Rosuvastatina', dose: '5 o 10 mg una vez al día', route: 'Vía oral', sourceId: 'rosuva' },
      { name: 'Simvastatina', dose: '20 o 40 mg en una toma por la noche', route: 'Vía oral', sourceId: 'simva' },
    ],
  },
  eze: {
    name: 'Ezetimiba', description: 'Puede formar parte de una combinación o de la vía sin estatinas.',
    options: [{ name: 'Ezetimiba', dose: '10 mg una vez al día', route: 'Vía oral', sourceId: 'ezetimibe' }],
  },
  ba: {
    name: 'Ácido bempedoico', description: 'Opción adicional según el riesgo, la tolerancia y el descenso necesario.',
    options: [{ name: 'Ácido bempedoico', dose: '180 mg una vez al día', route: 'Vía oral', sourceId: 'nilemdo', caution: 'Revisar uricemia/gota, función hepática, síntomas musculares con estatinas e interacciones. Con simvastatina: limitarla generalmente a 20 mg/día; 40 mg solo bajo la excepción de ficha técnica; más de 40 mg está contraindicado.' }],
  },
  pcsk9: {
    name: 'Alirocumab / evolocumab', description: 'Anticuerpos monoclonales anti-PCSK9: elegir uno. Pautas de adultos para hipercolesterolemia primaria y prevención cardiovascular; no incluyen la vía específica de HF homocigótica. Inclisirán no forma parte de estos escenarios.',
    options: [
      { name: 'Alirocumab', dose: '75 o 150 mg cada 2 semanas, o 300 mg cada 4 semanas', route: 'Vía subcutánea', sourceId: 'alirocumab' },
      { name: 'Evolocumab', dose: '140 mg cada 2 semanas o 420 mg una vez al mes', route: 'Vía subcutánea', sourceId: 'evolocumab' },
    ],
  },
} as const satisfies Record<string, DrugGroup>;
export type DrugGroupId = keyof typeof DRUG_GROUPS;
export function drugSource(id: SourceId) { return DRUG_REFERENCES.find(source => source.id === id)!; }
