export default {
  authGroups: {
    systemAdmin: {
      label: 'Administrador del sistema',
      label_other: 'Administradores del sistema',
      description: 'Administradores del sistema OF Arena',
    },
    surveyManager: {
      label: 'Gestor de encuestas',
      label_other: 'Gestores de encuestas',
      description: 'Gestores de encuestas OF Arena',
    },
    surveyAdmin: {
      label: 'Administrador de encuestas',
      label_other: 'Administradores de encuestas',
      description: 'Todos los derechos',
    },
    surveyEditor: {
      label: 'Editor de encuestas',
      label_other: 'Editores de encuestas',
      description: 'Puede editar encuestas, registros, invitar usuarios',
    },
    dataEditor: {
      label: 'Editor de datos',
      label_other: 'Editores de datos',
      description: 'Puede editar registros en el paso de entrada de datos',
    },
    dataCleanser: {
      label: 'Limpiador de datos',
      label_other: 'Limpiadores de datos',
      description: 'Puede editar registros en el paso de limpieza de datos',
    },
    dataAnalyst: {
      label: 'Analista de datos',
      label_other: 'Analistas de datos',
      description: 'Puede editar registros en el paso de análisis de datos',
    },
    surveyGuest: {
      label: 'Invitado de la encuesta',
      label_other: 'Invitados de la encuesta',
      description: 'Puede ver registros',
    },
  },
}
