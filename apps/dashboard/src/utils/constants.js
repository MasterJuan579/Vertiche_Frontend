export const STAGES = [
  {
    key: 'preregistro',
    apiValue: 'PREREGISTRO',
    title: 'Pre-registro',
    label: 'Palets esperando',
    color: '#64748b',
  },
  {
    key: 'qa',
    apiValue: 'QA',
    title: 'QA',
    label: 'Inspecciones',
    color: '#a16207',
  },
  {
    key: 'registro',
    apiValue: 'REGISTRO',
    title: 'Registro',
    label: 'Tags registrados',
    color: '#0f766e',
  },
  {
    key: 'sorter',
    apiValue: 'SORTER',
    title: 'Sorter',
    label: 'Lecturas recientes',
    color: '#6d28d9',
  },
  {
    key: 'bahia',
    apiValue: 'BAHIA',
    title: 'Bahía',
    label: 'Cajas en packing',
    color: '#1d4ed8',
  },
  {
    key: 'auditoria',
    apiValue: 'AUDITORIA',
    title: 'Auditoría',
    label: 'Tags aprobados',
    color: '#c2410c',
  },
  {
    key: 'envio',
    apiValue: 'ENVIO',
    title: 'Envío',
    label: 'Cajas enviadas',
    color: '#15803d',
  },
];

export const STAGE_BY_KEY = STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage;
  return acc;
}, {});

export const EMPTY_VALUE = '--';

