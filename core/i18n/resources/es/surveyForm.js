export default {
  subPage: 'Subpágina',
  addChildTo: 'Agregar a {{nodeDefLabel}}',
  addChildToTitle: 'Agregar nuevo nodo a {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Booleano',
    code: 'Código',
    coordinate: 'Coordenada',
    date: 'Fecha',
    decimal: 'Decimal',
    geo: 'Geoespacial',
    entity: 'Tabla o formulario',
    file: 'Archivo',
    integer: 'Entero',
    taxon: 'Taxón',
    text: 'Texto',
    time: 'Hora',
    // layout elments
    formHeader: 'Encabezado de formulario',
  },
  clone: `Clonar '{{nodeDefLabel}}'`,
  compressFormItems: `Comprimir elementos de formulario para '{{nodeDefLabel}}'`,
  confirmUpdateDependentEnumeratedEntities: `Si continúa, algunas entidades enumeradas ({{entityDefs}}) se volverán a enumerar, 
eliminando los valores existentes insertados en ellas (si los hay). 
¿Continuar?`,
  convert: `Convertir '{{nodeDefLabel}}'`,
  delete: `Eliminar '{{nodeDefLabel}}'`,
  edit: `Editar '{{nodeDefLabel}}'`,
  schemaSummary_csv: 'Resumen del esquema (CSV)',
  schemaSummary_xlsx: 'Resumen del esquema (Excel)',
  hidePages: 'Ocultar páginas',
  showPages: 'Mostrar páginas',
  move: `Mover '{{nodeDefLabel}}'`,
  movePageUp: 'Mover página hacia arriba',
  movePageDown: 'Mover página hacia abajo',
  formEditActions: {
    preview: 'Vista previa',
  },
  formEntryActions: {
    confirmDemote: '¿Está seguro de que desea degradar este registro a {{name}}?',
    confirmPromote: `¿Está seguro de que desea **promover este registro a {{name}}**? 
Ya no podrá editarlo`,
    confirmPromoteWithErrors: `**Este registro contiene errores**. 
Confirmar promoción`,
    confirmDelete: '¿Está seguro de que desea eliminar este registro?\n\nNo se puede deshacer la advertencia',
    closePreview: 'Cerrar vista previa',
    demoteTo: 'Degradar a {{stepPrev}}',
    promoteTo: 'Promover a {{stepNext}}',
    step: 'Paso {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Columnas',
    confirmConvert: '¿Convertir el atributo "{{name}}" en "{{toType}}"?',
    confirmDelete:
      '¿Está seguro de que desea eliminar permanentemente esta definición de nodo: {{ name }}?\n\nNo se puede deshacer la advertencia',
  },
  nodeDefCode: {
    code: 'Código',
    label: 'Etiqueta',
    typeCodeOrLabel: 'Escriba código o etiqueta',
    option: 'Opción {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: 'Verdadero',
        false: 'Falso',
      },
      yesNo: {
        true: 'Sí',
        false: 'No',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Coordenada',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Mostrar en el mapa',
    accuracy: 'Precisión',
    altitude: 'Altitud',
    altitudeAccuracy: 'Precisión de altitud',
  },
  nodeDefGeo: {
    confirmDelete: '¿Eliminar este valor geoespacial?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Archivo GeoJSON no válido cargado',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Agregar nuevo {{name}}',
    confirmDelete: '¿Está seguro de que desea eliminar esta entidad?',
    select: 'Seleccione un(a) {{name}}:',
    selectedEntity: '{{name}} seleccionado(a):',
  },
  nodeDefTaxon: {
    code: 'Código',
    scientificName: 'Nombre científico',
    vernacularName: 'Nombre vernáculo',
    vernacularNameAlwaysIncludedIfSingle: 'Nombre vernáculo siempre incluido si solo hay uno',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Activado**: si esta opción está activada y un taxón tiene definido un solo nombre vernáculo, ese nombre vernáculo se almacenará automáticamente con los datos cuando se seleccione el taxón.  
- **Desactivado**: solo se almacenarán el código del taxón y el nombre científico, incluso si el taxón tiene un solo nombre vernáculo.`,
    vernacularNameSelectionKept: 'Selección de nombre vernáculo mantenida',
    vernacularNameSelectionKeptInfo: `- **Activado**: cuando se selecciona un taxón usando un nombre vernáculo (común), también se almacenará en los datos el nombre vernáculo específico usado para la búsqueda.  
- **Desactivado**: solo se almacenarán el código del taxón y el nombre científico, sin importar qué nombre vernáculo se haya usado durante la búsqueda.  
En Arena Mobile:  
- **Activado**: cada nombre vernáculo aparece como un elemento separado en la lista de resultados de búsqueda.
- **Desactivado**: todos los nombres vernáculos de un taxón se agrupan y se muestran junto al taxón (combinados en una sola entrada). Como resultado, la lista de autocompletado contiene menos elementos.`,
    visibleFields: 'Campos visibles',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Error al cargar la vista previa',
    fileUuid: 'Uuid del archivo',
    fileName: 'Nombre del archivo',
    locationInformationNotFound: 'Información de ubicación no encontrada en el archivo',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Todos los nodos',
    onlyPages: 'Solo páginas',
  },
  step: {
    entry: 'Entrada',
    cleansing: 'Limpieza',
    analysis: 'Análisis',
  },
  confirmNodeDelete: '¿Está seguro de que desea eliminar este {{nodeDefType}} ({{nodeDefLabel}})?',
  exportDocx: 'Exportar encuesta (Word)',
  exportLabels_csv: 'Exportar etiquetas (CSV)',
  exportLabels_xlsx: 'Exportar etiquetas (Excel)',
  importLabels: 'Importar etiquetas desde Excel o CSV',
}
