export default {
  error: 'Error al exportar datos: {{details}}',
  optionNotCompatibleWithDataImport: 'No compatible con la importación de datos',
  options: {
    header: '$t(common.options)',
    fileFormatLabel: 'Formato de archivo',
    fileFormat: {
      csv: 'CSV',
      xlsx: 'Excel',
    },
    includeCategoryItemsLabels: 'Incluir etiquetas de elementos de categoría',
    includeCategories: 'Incluir categorías',
    expandCategoryItems: 'Expandir elementos de categoría',
    exportSingleEntitiesIntoSeparateFiles: 'Exportar entidades únicas a archivos separados',
    includeAncestorAttributes: 'Incluir atributos ancestrales',
    includeAnalysis: 'Incluir variables de resultados',
    includeDataFromAllCycles: 'Incluir datos de todos los ciclos',
    includeDateCreated: 'Incluir fecha de creación',
    includeFiles: 'Incluir archivos',
    includeFileAttributeDefs: 'Incluir columnas de atributos de archivo',
    includeInternalUuids: 'Incluir UUID internos',
    recordsModifiedAfter: 'Registros modificados después',
  },
  optionsInfo: {
    expandCategoryItems:
      'añade una columna booleana para cada elemento de categoría con un valor VERDADERO si el elemento ha sido seleccionado, FALSO en caso contrario',
    exportSingleEntitiesIntoSeparateFiles:
      'exporta entidades únicas en archivos separados; cuando no está marcado, los atributos que pertenecen a una entidad única se incluirán entre los de su entidad múltiple ancestral más cercana',
    includeAnalysis: 'incluye atributos de análisis',
    includeAncestorAttributes: 'incluye atributos que pertenecen a las entidades ancestrales, hasta la entidad raíz',
    includeCategoryItemsLabels: 'añade una columna con una etiqueta para cada elemento de categoría',
    includeCategories: 'las categorías se exportarán a una subcarpeta llamada "categories"',
    includeDataFromAllCycles:
      'se incluirán los datos de todos los ciclos, de lo contrario, solo se considerará el seleccionado',
    includeDateCreated: 'incluye la fecha de creación de cada entidad (fila) en una columna llamada "date_created"',
    includeFiles: 'exporta archivos asociados a los registros a una subcarpeta llamada "files"',
    includeFileAttributeDefs:
      'añade columnas de atributos de archivo: identificador interno del archivo (file_uuid) y nombre (file_name)',
    includeInternalUuids: 'incluye los identificadores internos (UUIDs) en columnas que terminan con el sufijo "_uuid"',
    recordsModifiedAfter: 'exporta solo datos de registros modificados después de la fecha especificada',
  },
  startExport: 'Iniciar exportación',
}
