export default {
  charts: {
    downloadToPng: 'Descargar gráfico a PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Por favor, seleccione una dimensión y una medida para mostrar el gráfico',
      selectAtLeast2NumericAttributes: 'Por favor, seleccione 2 atributos numéricos para mostrar el gráfico',
      tooManyItemsToShowChart:
        'Demasiados elementos para mostrar el gráfico;\nse esperan un máximo de {{maxItems}} elementos.\nPor favor, refine su consulta (por ejemplo, añadiendo un filtro) para reducir el número de elementos.\n',
      sampleRandomOnly:
        'Mostrando una muestra aleatoria de {{sampleSize}} de {{totalCount}} elementos (no se encontraron valores atípicos).',
      sampleWithOutliers:
        'Mostrando {{sampleSize}} de {{totalCount}} elementos: {{outliersCount}} valores atípicos y una muestra aleatoria de {{randomCount}} de los demás elementos.',
      sampleOutliersOnly: 'Mostrando los {{sampleSize}} valores atípicos más extremos de {{totalCount}} elementos.',
    },
    type: {
      area: 'Gráfico de área',
      bar: 'Gráfico de barras',
      line: 'Gráfico de líneas',
      pie: 'Gráfico circular',
      scatter: 'Gráfico de dispersión',
    },
  },
  dataQuery: {
    ai: {
      button: 'Preguntar a la IA',
      buttonTitle: 'Generar una consulta a partir de una descripción usando IA',
      title: 'Generar una consulta con IA',
      hint: 'Describa los datos que desea ver; la IA seleccionará la entidad, los atributos (o dimensiones y medidas), el filtro y el orden. Luego podrá revisar la consulta generada y guardarla desde el administrador de consultas.',
      placeholder: 'p. ej. número de árboles agrupados por especie',
      generate: 'Generar',
      generating: 'Generando…',
      replaceQueryConfirmMessage: '¿Reemplazar la consulta actual por la generada?',
      suggestSummary: 'Sugerir nombre y descripción',
      suggestSummaryFailed: 'No se pudo sugerir el nombre y la descripción de la consulta: {{message}}',
      suggestSummaryTitle:
        'Usar IA para sugerir el nombre, la etiqueta y la descripción de la consulta según las selecciones actuales',
      generatedSuccessfully:
        'Consulta generada: {{explanation}} Revise el resultado y guarde la consulta si desea conservarla.',
    },
    deleteConfirmMessage: '¿Eliminar la consulta "{{name}}"?',
    displayType: {
      chart: 'Gráfico',
      table: 'Tabla',
    },
    manageQueries: 'Administrar consultas',
    mode: {
      label: 'Modo:',
      aggregate: 'Agregar',
      raw: 'Crudo',
      rawEdit: 'Edición en bruto',
    },
    replaceQueryConfirmMessage: '¿Reemplazar la consulta actual por la seleccionada?',
    showCodes: 'Mostrar códigos',
  },
  editSelectedRecord: 'Editar registro seleccionado',
  filterAttributeTypes: 'Filtrar tipos de atributos',
  filterAttributes: 'Filtrar atributos',
  filterMessages: 'Filtrar mensajes',
  messageTypeFilter: {
    valueRequired: 'Valor obligatorio',
    valueInvalid: 'Valor inválido',
    uniqueDuplicate: 'Valor duplicado',
    customValidation: 'Validación personalizada',
    entityKeyDuplicate: 'Clave de entidad duplicada',
    recordKeyDuplicate: 'Clave de registro duplicada',
    nodesCount: 'Recuento de nodos',
  },
  filterRecords: {
    buttonTitle: 'Filtrar registros',
    expressionEditorHeader: 'Expresión para filtrar registros',
  },
  invalidRecord: 'Registro no válido',
  nodeDefsSelector: {
    hide: 'Ocultar selector de definiciones de nodo',
    show: 'Mostrar selector de definiciones de nodo',
    nodeDefFrequency: '{{nodeDefLabel}} (frecuencia)',
    searchPlaceholder: 'Buscar variable por nombre',
  },
  records: {
    clone: 'Clonar',
    confirmDeleteRecord: '¿Eliminar el registro "{{keyValues}}"?',
    confirmDeleteSelectedRecord_one: '¿Eliminar el registro seleccionado?',
    confirmDeleteSelectedRecord_other: '¿Eliminar los {{count}} registros seleccionados?',
    confirmMergeSelectedRecords:
      '### ¿Fusionar los registros seleccionados en uno?\n\n- el registro "fuente" se fusionará con el registro "destino":\n  - fuente: [{{sourceRecordKeys}}], modificado {{sourceRecordModifiedDate}};\n  - destino: [{{targetRecordKeys}}], modificado {{targetRecordModifiedDate}};\n\n- se mostrará una vista previa del resultado antes de realizar la fusión;\n\n- cuando se confirme la fusión, **el registro fuente SERÁ ELIMINADO**',
    confirmUpdateRecordsStep: '¿Mover el/los {{count}} registro(s) seleccionado(s) de {{stepFrom}} a {{stepTo}}?',
    confirmUpdateRecordOwner: '¿Cambiar el propietario del registro seleccionado a {{ownerName}}?',
    confirmValidateAllRecords: `¿Volver a validar todos los registros?\n\nEsto puede tardar varios minutos.`,
    deleteRecord: 'Eliminar registro',
    demoteAllRecordsFromAnalysis: 'Análisis -> Limpieza',
    demoteAllRecordsFromCleansing: 'Limpieza -> Entrada',
    editRecord: 'Editar registro',
    exportList: 'Exportar lista',
    exportData: 'Exportar datos',
    exportDataSummary: 'Exportar resumen de datos',
    exportSelectedRecordsArenaFormat: 'Exportar registros seleccionados (formato Arena)',
    exportRecordDocx: 'Exportar registro (Word)',
    filterPlaceholder: 'Filtrar por claves o propietario',
    merge: {
      label: 'Fusionar',
      confirmLabel: 'Confirmar fusión',
      confirmTooManyDifferencesMessage:
        '**Demasiadas diferencias**. \nParece que los registros son muy diferentes entre sí. \nMuchos atributos (~{{nodesUpdated}}) se actualizarán durante la fusión. \n¿Continuar con la vista previa de la fusión?',
      noChangesWillBeApplied: 'No se aplicarían cambios al registro de destino. \nNo se puede realizar la fusión.',
      performedSuccessfullyMessage: '¡Fusión de registros realizada correctamente!',
      previewTitle: 'Vista previa de la fusión (registro {{keyValues}})',
    },
    noRecordsAdded: 'No se añadieron registros',
    noRecordsAddedForThisSearch: 'No se encontraron registros',
    noSelectedRecordsInStep: 'No hay registros seleccionados en el paso {{step}}',
    owner: 'Propietario',
    promoteAllRecordsToAnalysis: 'Limpieza -> Análisis',
    promoteAllRecordsToCleansing: 'Entrada -> Limpieza',
    step: 'Paso',
    updateRecordsStep: 'Actualizar paso de registros',
    validateAll: 'Validar todo',
    viewRecord: 'Ver registro',
  },
  recordsClone: {
    title: 'Clonación de registros',
    fromCycle: 'Del ciclo',
    toCycle: 'Al ciclo',
    confirmClone:
      '¿Clonar registros del ciclo {{cycleFrom}} al ciclo {{cycleTo}}?\n(Solo se clonarán los registros que aún no estén en el ciclo {{cycleTo}})',
    startCloning: 'Iniciar clonación',
    cloneComplete: 'Clonación completada. Se clonaron {{recordsCloned}} registros de {{cycleFrom}} a {{cycleTo}}',
    error: {
      cycleToMissing: 'Por favor, seleccione "Al ciclo"',
      cycleToMustBeDifferentFromCycleFrom: '"Al ciclo" debe ser diferente de "Del ciclo"',
    },
    source: {
      label: 'Fuente',
      allRecords: 'Todos los registros en el ciclo {{cycleFrom}} que aún no estén en el ciclo {{cycleTo}}',
      selectedRecords: 'Solo los {{selectedRecordsCount}} registros seleccionados',
    },
  },
  recordDeleted_one: '¡Registro eliminado correctamente!',
  recordDeleted_other: '¡{{count}} registros eliminados correctamente!',
  recordsSource: {
    label: 'Fuente',
  },
  recordsUpdated: '¡{{count}} registros actualizados correctamente!',
  rowNum: 'Fila #',
  selectedAttributes: 'Atributos seleccionados:',
  selectedDimensions: 'Dimensiones seleccionadas',
  selectedMeasures: 'Medidas seleccionadas',
  sortableItemsInfo: 'Arrastre y suelte para ordenarlos',
  showValidationReport: 'Mostrar informe de validación',
  sort: 'Ordenar',
  dataExport: {
    source: {
      label: 'Fuente',
      allRecords: 'Todos los registros',
      filteredRecords: 'Solo registros filtrados',
      selectedRecord: 'Solo registro seleccionado',
      selectedRecord_other: 'Solo {{count}} registros seleccionados',
    },
    title: 'Exportar datos',
  },
  dataMatrixExport: {
    intro: `Exporte los datos de **{{entity}}** como una tabla con:

- una **fila** por cada valor distinto de los atributos de fila (p. ej. cada especie y estrato);
- una **columna** por cada registro, con el nombre de su clave ({{keys}});
- en las celdas, el valor del atributo de valor (p. ej. cobertura).

Es el formato utilizado por herramientas de análisis de vegetación como Turboveg, Juice y Synbiosys.`,
    layout: {
      dataMatrix: 'Matriz de datos',
      info: 'Tabla: filas y columnas como se muestran en el Explorador de datos. Matriz de datos: una fila por especie (u otro atributo) y una columna por registro, como requieren herramientas de análisis de vegetación como Turboveg.',
      label: 'Exportar como',
      table: 'Tabla',
    },
    preview: 'Vista previa',
    previewRecord: '{{keys}} del registro {{number}}',
    recordKeys: 'Atributos clave usados para nombrar las columnas de los registros',
    recordKeysInfo:
      'Cada registro se convierte en una columna, con el nombre formado por los valores de los atributos clave seleccionados (p. ej. solo el número de parcela). Por defecto se usan los atributos clave seleccionados en el Explorador de datos, o todos si no se ha seleccionado ninguno. Se requiere al menos uno.',
    recordsAll:
      'Se exportan los datos de todos los registros: defina un filtro en el Explorador de datos para exportar solo algunos.',
    recordsFiltered: 'Solo se exportan los datos que cumplen el filtro actual del Explorador de datos.',
    rowAttribute: 'Filas (nombre del atributo de taxón, p. ej. especie)',
    rowAttributeInfo:
      'Cada valor distinto de este atributo se convierte en una fila de la tabla. Los atributos de taxón se exportan con su nombre científico, porque todos los taxones no listados tienen el mismo código.',
    secondRowAttribute: 'Segundo atributo de fila, opcional (p. ej. estrato)',
    secondRowAttributeInfo:
      'Úselo cuando la misma especie pueda aparecer más de una vez en un registro (p. ej. en distintos estratos): cada combinación se convierte en una fila separada.',
    valueAttribute: 'Valores (p. ej. cobertura)',
    valueAttributeInfo:
      'El valor que se muestra en las celdas. Los atributos de código se exportan con su código, no con la etiqueta. Si una fila aparece más de una vez en un registro con valores distintos, la celda los contiene todos.',
  },
  dataVis: {
    errorLoadingData: 'Error al cargar datos',
    noData: 'Esta consulta no devolvió datos',
    noSelection:
      'Por favor, haga su selección usando el panel lateral izquierdo o seleccione una consulta existente de "Administrar consultas"',
  },
  viewSelectedRecord: 'Ver registro seleccionado',
  mapView: {
    layersControl: {
      baseLayers: 'Capas base',
      inputData: 'Datos de entrada',
      preloadedLayers: 'Capas precargadas',
      samplingPointData: 'Datos de puntos de muestreo',
    },
    layersPanel: {
      markers: '{{count}} marcadores',
      markers_one: '{{count}} marcador',
      markers_other: '{{count}} marcadores',
    },
  },
}
