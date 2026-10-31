export default {
  additionalFields: 'Campos adicionales',
  basic: 'Básico',
  advanced: 'Avanzado',
  mobileApp: 'Aplicación móvil',
  print: 'Impresión',
  printProps: {
    printOrientation: {
      label: 'Orientación de página',
      info: 'Orientación usada cuando esta entidad inicia su propia sección imprimible. Por defecto se hereda la orientación del documento elegida en la exportación.',
    },
    orientations: {
      default: 'Predeterminada (documento)',
      portrait: 'Vertical',
      landscape: 'Horizontal',
    },
  },
  validations: 'Validaciones',
  function: 'Función',
  editingFunction: 'Editando función {{functionName}}',
  editorHelp: {
    json: 'Las expresiones válidas son un subconjunto de Javascript.',
    sql: 'Solo se permiten expresiones SQL válidas.',
  },
  editorCompletionHelp: '- Mostrar las variables y funciones disponibles que se pueden usar',
  functionDescriptions: {
    categoryItemProp:
      'Devuelve el valor de la $t(extraProp.label) especificada de un elemento de categoría que tiene el código especificado',
    dateTimeDiff: 'Devuelve la diferencia (en minutos) de 2 pares de fecha-hora',
    distance: 'Devuelve la distancia (en metros) entre las coordenadas especificadas',
    geoCoordinateAtDistance:
      'Devuelve las coordenadas a una distancia y rumbo especificados desde las coordenadas especificadas',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    first: 'Devuelve el primer valor o nodo del atributo o entidad múltiple especificado',
    geoPolygon: 'Genera un polígono en GeoJSON a partir de una lista de coordenadas',
    includes: 'Devuelve verdadero si el atributo múltiple especificado incluye el valor especificado.',
    index: 'Devuelve el índice del nodo especificado entre sus hermanos',
    isEmpty: 'Devuelve verdadero si el argumento no tiene ningún valor especificado',
    isNotEmpty: 'Devuelve verdadero si el argumento tiene algún valor especificado',
    last: 'Devuelve el último valor o nodo del atributo o entidad múltiple especificado',
    ln: 'Devuelve el logaritmo natural de X',
    log10: 'Devuelve el logaritmo en base 10 de X',
    max: 'Devuelve el máximo de los argumentos',
    min: 'Devuelve el mínimo de los argumentos',
    now: 'Devuelve la fecha u hora actual',
    parent: 'Devuelve la entidad padre del nodo especificado',
    pow: 'Devuelve el valor de una base elevada a una potencia',
    prevCycleNote:
      'Funciona solo en Arena Mobile cuando se definen múltiples ciclos y el enlace al ciclo anterior está habilitado',
    prevCycleValue:
      'Devuelve el valor del mismo atributo en el registro del ciclo anterior. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Devuelve los valores de los mismos atributos en el registro del ciclo anterior. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Devuelve el ciclo del registro actual',
    recordDateCreated:
      'Devuelve la fecha y hora de creación del registro actual como un valor de fecha y hora. Se puede usar en un atributo de texto, fecha u hora',
    recordDateLastModified:
      'Devuelve la fecha y hora de la última modificación del registro actual como un valor de fecha y hora. Se puede usar en un atributo de texto, fecha u hora',
    recordOwnerEmail: 'Devuelve el correo electrónico del usuario propietario del registro',
    recordOwnerName: 'Devuelve el nombre del usuario propietario del registro',
    recordOwnerRole: 'Devuelve el rol (en la encuesta actual) del usuario propietario del registro',
    rowIndex: 'Devuelve el índice de la fila (o formulario) actual de la tabla',
    taxonProp:
      "Devuelve el valor de la propiedad especificada de un taxón que tiene el código especificado: code, family, genus, scientificName, un nombre vernáculo (usando el código del idioma como nombre de la propiedad, p. ej. 'swa') o una $t(extraProp.label)",
    taxonVernacularName:
      'Devuelve el (primer) nombre vernáculo (o local) en el idioma especificado de un taxón que tiene el código especificado',
    unique: 'Devuelve los valores únicos de un atributo o entidad múltiple',
    userEmail: 'Devuelve el correo electrónico del usuario que ha iniciado sesión',
    userIsRecordOwner:
      'Devuelve un valor booleano "verdadero" si el usuario que edita el registro también es su propietario, "falso" en caso contrario',
    userName: 'Devuelve el nombre del usuario que ha iniciado sesión',
    userProp: 'Devuelve el valor de la $t(extraProp.label) especificada del usuario que ha iniciado sesión',
    uuid: 'Genera un UUID (identificador universalmente único) que se puede usar como identificador (por ejemplo, como atributo clave de una entidad)',
    avg: 'Devuelve el valor promedio de una variable numérica',
    count: 'Devuelve el número de filas que coinciden con un criterio especificado',
    sum: 'Devuelve la suma total de una variable numérica',
  },
  functionName: {
    rowIndex: 'Índice de fila',
  },
  basicProps: {
    analysis: 'Análisis',
    autoIncrementalKey: {
      label: 'Clave auto incremental',
      info: 'El valor se generará automáticamente',
    },
    autoCreateMinCountItems: {
      label: 'Crear mínimo de elementos automáticamente',
      info: 'Cuando la entidad se vuelve relevante o se crea su entidad padre, se generará automáticamente un número de entidades igual al mínimo requerido.',
    },
    displayAs: 'Mostrar como',
    displayIn: 'Mostrar en',
    entitySource: 'Fuente de la entidad',
    enumerate: {
      label: 'Enumerar',
      info: 'Las filas se generarán automáticamente utilizando los elementos de categoría asociados a un atributo de código marcado como Clave definido dentro de la entidad; las filas no se pueden añadir ni eliminar y el atributo de código clave no será editable',
    },
    enumeratingItemsExpression: {
      label: 'Expresión de elementos de enumeración',
      info: 'Expresión opcional que filtra qué elementos de la categoría se enumeran (p. ej. unique(table_source.source_type)). Si está vacía, se usan todos los elementos de la categoría.',
    },
    enumerator: {
      label: 'Enumerador',
      info: 'Los elementos de la categoría se utilizarán para generar las filas de la entidad padre',
    },
    form: 'Formulario',
    formula: 'Fórmula',
    includedInClonedData: 'Incluido en los datos clonados',
    includedInMultipleEntitySummary: {
      label: 'Incluir en el resumen de entidades múltiples',
      info: `Si está marcado, el valor del atributo será visible en el selector de entidades y en la vista de resumen de la entidad`,
    },
    includedInRecordsList: {
      label: 'Incluir en la lista de registros',
      info: `Si está marcado, el atributo será visible en la lista de registros`,
    },
    key: 'Clave',
    maxKeysCountReached: 'Número máximo de claves alcanzado ({{maxKeysCount}})',
    multiple: 'Múltiple',
    ownPage: 'Su propia página',
    parentPage: 'Página padre ({{parentPage}})',
    qualifier: {
      label: 'Calificador',
      info: `Cuando un usuario que pertenece a un grupo crea un nuevo registro, este atributo se completará automáticamente con el valor especificado para él en los calificadores del grupo del usuario. Los usuarios solo podrán ver y modificar los registros que pertenezcan a su propio grupo, si pertenecen a uno.`,
    },
    table: 'Tabla',
  },
  advancedProps: {
    defaultValuesNotSpecified: 'Valores predeterminados no especificados',
    defaultValuesSpecified: 'Valores predeterminados especificados',
    editableAlways: 'Siempre editable',
    editableIfConditionIsMet: 'Editable cuando se cumple la condición',
    relevantIfRadioNone: 'Siempre relevante',
    relevantIfRadioDefined: 'Relevante cuando se cumple la condición',
    visibleAlways: 'Siempre visible',
    visibleIfConditionIsMet: 'Visible cuando se cumple la condición',
    areaBasedEstimate: 'Estimación basada en el área',
    defaultValues: 'Valores predeterminados',
    defaultValuesInfo: `Esto permite completar automáticamente una respuesta según reglas específicas.
    Si configura varias reglas, el sistema las comprobará en orden, de arriba hacia abajo.
    Aplicará la primera regla que cumpla las condiciones y usará ese resultado como respuesta.`,
    defaultValueEvaluatedOneTime: 'Valor predeterminado evaluado solo una vez',
    defaultValueEvaluatedOneTimeInfo: `El valor predeterminado se evaluará solo una vez, cuando se cree el atributo.
    Si no está marcado, el valor predeterminado se volverá a evaluar cada vez que se actualice el registro.
    Debe marcarse al usar expresiones como now() o uuid(), que deben evaluarse solo una vez, cuando el valor del atributo se genera por primera vez.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Valores predeterminados no editables porque la clave auto incremental está configurada',
    editableIf: 'Editable si',
    editableIfInfo: `Por defecto, un usuario siempre puede acceder a un campo relevante.
Aquí se puede definir una regla para indicar si el usuario puede escribir o modificar este campo.
Esto decide si un usuario puede escribir o cambiar este campo.
Si se cumplen las condiciones definidas, el campo se puede editar. Si no, será de solo lectura (bloqueado).`,
    hidden: 'Siempre oculto',
    hiddenInReport: 'Ocultar en el Panel Analítico',
    hiddenInReportInfo: `Si está marcado, el atributo no será visible en el Panel Analítico`,
    hiddenWhenNotRelevant: 'Oculto cuando no es relevante',
    itemsFilter: 'Filtro de elementos',
    itemsFilterInfo:
      'Expresión utilizada para filtrar elementos seleccionables. En la expresión, la palabra "this" se referirá al elemento en sí. Ej.: this.region = region_attribute_name (donde "region" es el nombre de una propiedad extra definida para el elemento y region_attribute_name es el nombre de un atributo en la encuesta)',
    readOnly: 'Solo lectura',
    relevantIf: 'Relevante si',
    relevantIfInfo: `Por defecto, todos los campos están activos.
    Si define una regla de relevancia y no se cumple, el campo se mostrará en gris o se ocultará por completo,
    y las respuestas automáticas se ignorarán.
    Úselo para mostrar u ocultar partes de la encuesta de forma dinámica; por ejemplo, mostrar "Especifique" solo cuando el usuario elige "Otro".`,
    script: 'Script',
    visibleIf: 'Visible si',
    visibleIfInfo: `Por defecto, un campo siempre es visible.
    Si define una regla, solo será visible cuando esa regla se cumpla; en caso contrario, quedará oculto.
    Nota: a diferencia de ocultar un campo "no relevante", un campo oculto puede seguir guardando una respuesta automática.
    Esto es útil para ocultar secciones completas de la encuesta según quién haya iniciado sesión (por ejemplo, por rol).`,
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Oculto en Arena Mobile',
      info: 'Si está marcado, el atributo no será visible en AM',
    },
    includedInPreviousCycleLink: {
      label: 'Incluir en el enlace del ciclo anterior',
      info: 'Si está marcado, el valor del ciclo anterior se mostrará en el formulario de entrada de datos (cuando el enlace al ciclo anterior esté activo en la aplicación móvil)',
    },
  },
  numericProps: {
    unit: 'Unidad',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Número máximo de dígitos decimales',
  },
  fileProps: {
    fileNameExpression: 'Expresión de nombre de archivo',
    fileType: 'Tipo de archivo',
    fileTypes: {
      image: 'Imagen',
      video: 'Video',
      audio: 'Audio',
      other: 'Otro',
    },
    maxFileSize: 'Tamaño máximo de archivo (Mb)',
    numberOfFiles: 'Vaya a Validaciones para cambiar el número mínimo y máximo de archivos.',
    showGeotagInformation: 'Mostrar información de geoetiqueta',
  },
  mobileProps: {
    title: 'Aplicación móvil',
  },
  timeProps: {
    includeSeconds: 'Incluir segundos',
  },
  formHeaderProps: {
    headerColorLabel: 'Color de encabezado',
    headerColor: {
      blue: 'Azul',
      green: 'Verde',
      orange: 'Naranja',
      red: 'Rojo',
      yellow: 'Amarillo',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hipervínculo',
      markdown: 'Markdown',
      text: 'Texto',
    },
    textInputType: 'Tipo de entrada de texto',
    textInputTypes: {
      singleLine: 'Una sola línea',
      multiLine: 'Varias líneas',
    },
    textTransform: 'Transformación de texto',
    textTransformTypes: {
      none: 'ninguno',
      capitalize: 'capitalizar',
      uppercase: 'mayúsculas',
      lowercase: 'minúsculas',
    },
  },
  booleanProps: {
    labelValue: 'Valor de la etiqueta',
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Categoría',
    codeShown: 'Mostrar código',
    displayAsTypes: {
      checkbox: 'Casilla de verificación',
      dropdown: 'Desplegable',
    },
    parentCode: 'Código padre',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: 'Permitir solo coordenadas del dispositivo',
    allowOnlyDeviceCoordinateInfo:
      'Solo se aplica a Arena Mobile: si está marcado, el usuario no podrá modificar los valores X/Y, solo se podrá usar el GPS del dispositivo para obtenerlos',
    mapMarkerColor: 'Color del marcador en el mapa',
  },
  expressionsProp: {
    expression: 'Expresión',
    applyIf: 'Aplicar si',
    confirmDelete: '¿Eliminar esta expresión?',
    severity: 'Severidad',
  },
  validationsProps: {
    minCount: 'Conteo mínimo',
    maxCount: 'Conteo máximo',
    expressions: 'Expresiones de validación',
    attributeAlwaysValid: 'Atributo siempre válido',
    attributeValidWhenConditionIsMet: 'Atributo válido cuando se cumple la condición',
    notRequired: 'No obligatorio',
    alwaysRequired: 'Siempre obligatorio',
    requiredWhenConditionIsMet: 'Obligatorio cuando se cumple la condición',
  },
  cannotChangeIntoMultipleWithDefaultValues:
    'Este nodo no se puede convertir a múltiple porque tiene valores predeterminados.',
  cannotDeleteNodeDefReferenced:
    'No se puede eliminar "{{nodeDef}}": está referenciado por estas definiciones de nodo: {{nodeDefDependents}}',
  cloneDialog: {
    confirmButtonLabel: 'Clonar',
    title: 'Clonando definición de nodo "{{nodeDefName}}"',
    entitySelectLabel: 'Entidad en la que clonar:',
  },
  conversion: {
    dialogTitle: 'Convertir {{nodeDefName}} a otro tipo',
    fromType: 'De tipo',
    toType: 'A tipo',
  },
  moveDialog: {
    confirmButtonLabel: 'Mover',
    title: 'Moviendo la definición del nodo "{{nodeDefName}}" desde "{{parentNodeDefName}}"',
    entitySelectLabel: 'Entidad a la que mover:',
  },
  movedNodeDefinitionHasErrors:
    'La definición de nodo "{{nodeDefName}}" que ha movido tiene errores; por favor, corríjalos.',
  nodeDefintionsHaveErrors: 'Estas definiciones de nodo tienen errores: {{nodeDefNames}}. Por favor, corríjalos.',
  filterVariable: 'Variable para filtrar elementos',
  filterVariableForLevel: 'Variable para {{levelName}}',
  unique: {
    label: 'Único',
    info: 'Cuando un atributo está marcado como **Único**, su valor debe ser único dentro de la entidad múltiple más cercana (se mostrará un error en caso contrario). \n\n---\n\nEj.: en una estructura como *clúster -> parcela -> árbol*, si tiene un atributo *tree_species* marcado como **Único**, solo puede tener un árbol por especie dentro de la misma *parcela*.',
  },
  nodeDefClonedSuccessfully:
    'Definición de nodo "{{nodeDefName}}" clonada correctamente en "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: 'Las siguientes categorías también se clonaron desde la encuesta de origen: {{names}}',
  taxonomiesClonedFromSurvey: 'Las siguientes taxonomías también se clonaron desde la encuesta de origen: {{names}}',
}
