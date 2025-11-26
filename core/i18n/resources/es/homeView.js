export default {
  dashboard: {
    activeSurveyNotSelected:
      '<title>Encuesta activa no seleccionada</title>\n      <p><label>Por favor, seleccione una de la</label><linkToSurveys>Lista de encuestas</linkToSurveys> o <linkToNewSurvey>Cree una nueva</linkToNewSurvey></p>',
    activeUsers: 'Usuarios activos',
    activityLog: {
      title: 'Registro de actividad',
      size: '$t(homeView:dashboard.activityLog.title) tamaño: {{size}}',
    },
    deleteActivityLog: 'Borrar registro de actividad',
    deleteActivityLogConfirm: {
      headerText: '¿Borrar TODOS los datos del registro de actividad de esta encuesta?',
      message: `
  - TODOS los datos del registro de actividad para la encuesta **{{surveyName}}** se eliminarán;\n\n
  - el espacio ocupado por la encuesta en la BD se reducirá;\n\n
  - no afectará a los datos de entrada de la encuesta;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Escriba el nombre de esta encuesta para confirmar:',
    },
    exportWithData: 'Exportar + datos (Copia de seguridad)',
    exportWithDataNoActivityLog: 'Exportar + datos (SIN registro de actividad)',
    exportWithDataNoResultAttributes: 'Exportar + datos (SIN atributos de resultado)',
    surveyPropUpdate: {
      main: '<title>Bienvenido a Arena</title>\n  \n        <p>Primero debe establecer el <strong>nombre</strong> y la <strong>etiqueta</strong> de la encuesta.</p>\n        \n        <p>Haga clic a continuación en <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>o en el nombre de la encuesta:<basicLink>{{surveyName}}</basicLink></p>\n        ',
      secondary:
        '\n        <p>Si el nombre y la etiqueta son correctos, cree el primer atributo\n        <linkWithIcon>Encuesta > Diseñador de formularios</linkWithIcon>\n        </p>\n        ',
    },
    nodeDefCreate: {
      main: '<title>Vamos a crear el primer atributo de {{surveyName}} </title>\n        \n        <p>Vaya a <linkWithIcon>Encuesta > Diseñador de formularios</linkWithIcon></p>\n        <br />\n        ',
    },
    storageSummary: {
      title: 'Uso del almacenamiento',
      availableSpace: 'Disponible ({{size}})',
      usedSpace: 'Usado ({{size}})',
      usedSpaceOutOf: `Usado {{percent}}% ({{used}} de {{total}})`,
    },
    storageSummaryDb: {
      title: 'Uso del almacenamiento (Base de datos)',
    },
    storageSummaryFiles: {
      title: 'Uso del almacenamiento (archivos)',
    },
    samplingPointDataCompletion: {
      title: 'Finalización de datos de puntos de muestreo',
      totalItems: 'Total de elementos: {{totalItems}}',
      remainingItems: 'Elementos restantes',
    },
    step: {
      entry: 'Entrada de datos',
      cleansing: 'Limpieza de datos',
      analysis: 'Análisis de datos',
    },
    recordsByUser: 'Registros por usuario',
    recordsAddedPerUserWithCount: 'Registros añadidos por usuario (Total de {{totalCount}})',
    dailyRecordsByUser: 'Registros diarios por usuario',
    totalRecords: 'Total de registros',
    selectUsers: 'Seleccionar usuarios...',
    noRecordsAddedInSelectedPeriod: 'No se añadieron registros en el período seleccionado',
  },
  surveyDeleted: 'La encuesta {{surveyName}} ha sido eliminada',
  surveyInfo: {
    basic: 'Información básica',
    configuration: {
      title: 'Configuración',
      filesTotalSpace: 'Espacio total de archivos (GB)',
    },
    confirmDeleteCycleHeader: '¿Eliminar este ciclo?',
    confirmDeleteCycle:
      '¿Está seguro de que desea eliminar el ciclo {{cycle}}?\n\n$t(common.cantUndoWarning)\n\nSi hay registros asociados a este ciclo, se eliminarán.',
    cycleForArenaMobile: 'Ciclo para Arena Mobile',
    fieldManualLink: 'Enlace al manual de campo',
    editInfo: 'Editar información',
    viewInfo: 'Ver información',
    preferredLanguage: 'Idioma preferido',
    sampleBasedImageInterpretation: 'Interpretación de imágenes basada en muestras',
    sampleBasedImageInterpretationEnabled: 'Interpretación de imágenes basada en muestras habilitada',
    security: {
      title: 'Seguridad',
      dataEditorViewNotOwnedRecordsAllowed: 'El editor de datos puede ver registros no propios',
      visibleInMobile: 'Visible en Arena Mobile',
      allowRecordsDownloadInMobile: 'Permitir la descarga de registros del servidor a Arena Mobile',
      allowRecordsUploadFromMobile: 'Permitir la carga de registros de Arena Mobile al servidor',
    },
    srsPlaceholder: 'Escriba el código o la etiqueta',
    unpublish: 'Despublicar y eliminar datos',
    unpublishSurveyDialog: {
      confirmUnpublish: '¿Está seguro de que desea despublicar esta encuesta?',
      unpublishWarning:
        'Al despublicar la encuesta **{{surveyName}}** se eliminarán todos sus datos.\n\n$t(common.cantUndoWarning)',
      confirmName: 'Introduzca el nombre de esta encuesta para confirmar:',
    },
    userExtraProps: {
      title: 'Propiedades adicionales de usuario',
      info: "Propiedades adicionales que se pueden asignar a cada usuario asociado a la encuesta. \nEsas propiedades se pueden usar en valores predeterminados, reglas de validación y expresiones de aplicabilidad. \nEj.: *userProp('property_name') == 'some_value'*",
    },
  },
  deleteSurveyDialog: {
    confirmDelete: '¿Está seguro de que desea eliminar esta encuesta?',
    deleteWarning:
      'Al eliminar la encuesta **{{surveyName}}** se eliminarán todos sus datos.\n\n$t(common.cantUndoWarning)',
    confirmName: 'Introduzca el nombre de esta encuesta para confirmar:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Activar',
  },
  collectImportReport: {
    excludeResolvedItems: 'Excluir elementos resueltos',
    expression: 'Expresión',
    resolved: 'Resuelto',
    exprType: {
      applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
      codeParent: 'Código padre',
      defaultValue: 'Valor predeterminado',
      validationRule: 'Regla de validación',
    },
    title: 'Informe de importación de Collect',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Registros añadidos en los últimos:',
    fromToPeriod: 'de {{from}} a {{to}}',
    record: '{{count}} Registro',
    record_other: '{{count}} Registros',
    week: '{{count}} Semana',
    week_other: '{{count}} Semanas',
    month: '{{count}} Mes',
    month_other: '{{count}} Meses',
    year: '{{count}} Año',
    year_other: '{{count}} Años',
  },
}
