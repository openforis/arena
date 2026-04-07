export default {
  invalidEmail: 'Correo electrónico no válido',
  invalidField: '"{{field}}" no válido',
  invalidNumber: 'Número no válido',
  invalidDate: 'Fecha no válida',
  minLengthNotRespected: 'Longitud mínima de {{minLength}} caracteres no respetada',
  nameDuplicate: 'El nombre está duplicado',
  nameCannotBeKeyword: 'El nombre "{{value}}" no se puede usar: es una palabra reservada',
  nameInvalid:
    'El nombre "{{name}}" no es válido: debe tener un máximo de 40 caracteres y contener solo letras minúsculas y números, comenzando con una letra, y solo los símbolos "-" y "_"',
  nameRequired: 'El nombre es obligatorio',
  requiredField: '{{field}} es obligatorio',
  rowsDuplicate: 'fila: {{row}} fila duplicada: {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: 'La etiqueta en el idioma predeterminado de la encuesta es obligatoria',
    analysisNodeDefsRequired: 'Se requiere al menos un atributo calculado',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Al menos un hijo no válido',
    codeCannotBeKeyword: 'El código "{{value}}" no se puede usar: es una palabra reservada',
    codeDuplicate: 'El código está duplicado',
    codeRequired: 'El código es obligatorio',
    itemExtraPropDataTypeRequired: 'Tipo de datos obligatorio para $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Nombre no válido para $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Número no válido para $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Punto de geometría no válido para $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'Al menos un elemento no válido',
    itemsEmpty: 'Defina al menos un elemento',
    levelDuplicate: 'El nombre del nivel está duplicado',
    levelsInvalid: 'Al menos un nivel no válido',
    nameNotSpecified: 'Nombre de categoría no especificado',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'No se pueden eliminar elementos de categoría publicados. Elementos faltantes en el archivo importado: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'No se pueden eliminar niveles de categoría publicados. Niveles faltantes en el archivo importado: {{deletedLevelNames}}',
    codeColumnMissing: 'Debe haber al menos una columna de "código"',
    codeRequired: '{{columnName}}: se requiere un código',
    codeDuplicate: '{{columnName}}: código duplicado "{{code}}"',
    columnMissing: 'Columna faltante: {{columnNameMissing}}',
    emptyHeaderFound: 'El archivo contiene un encabezado vacío',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'El archivo ZIP debe contener solo archivos .csv o .xlsx (uno para cada categoría), sin directorios',
    invalidParentItemOrder: 'El elemento con códigos {{parentItemCodes}} debe ir antes que sus hijos',
    nameDuplicate: 'Ya existe una categoría con el mismo nombre: {{name}}',
    srsNotDefined: 'SRS con código {{srs}} no definido en la encuesta',
  },

  dataImport: {
    emptyFile: 'El archivo que intenta importar está vacío',
    invalidHeaders: 'Columnas no válidas: {{invalidHeaders}}',
    invalidBoolean: 'Valor booleano no válido en la columna {{headers}}: {{value}}',
    invalidCode: "Código no válido para el atributo '{{attributeName}}': {{code}}",
    invalidCoordinate: 'Coordenada no válida en la columna {{headers}}: {{value}}',
    invalidDate:
      'Fecha no válida en la columna {{headers}}: {{value}}. Las fechas deben tener el formato AAAA-MM-DD o DD/MM/AAAA. Ej.: 2023-01-15 o 15/01/2023',
    invalidNumber: 'Número no válido en la columna {{headers}}: {{value}}',
    invalidTaxonCode: 'Código no válido en la columna {{headers}}: {{value}}',
    invalidTime:
      'Hora no válida en la columna {{headers}}: {{value}}. La hora debe tener el formato HH:mm. Ej.: 09:45 o 16:30',
    missingRequiredHeaders: 'Faltan columnas obligatorias: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Error al actualizar valores: {{details}}',
    multipleRecordsMatchingKeys: 'Se encontraron varios registros que coinciden con las claves "{{keyValues}}"',
    recordAlreadyExisting: 'Registro con claves "{{keyValues}}" ya existente',
    recordInAnalysisStepCannotBeUpdated:
      'El registro con claves "{{keyValues}}" está en el paso de análisis y no se puede actualizar',
    recordKeyMissingOrInvalid: 'Valor faltante o no válido para el atributo clave "{{keyName}}"',
    recordNotFound: 'Registro con claves "{{keyValues}}" no encontrado',
  },

  expressions: {
    cannotGetChildOfAttribute: 'no se puede obtener el nodo hijo {{childName}} del atributo {{parentName}}',
    cannotUseCurrentNode: 'no se puede usar el nodo actual {{name}} en esta expresión',
    circularDependencyError: 'no se puede hacer referencia al nodo {{name}} porque hace referencia al nodo actual',
    expressionInvalid: 'Expresión no válida: {{details}}',
    unableToFindNode: 'no se puede encontrar el nodo: {{name}}',
    unableToFindNodeChild: 'no se puede encontrar el nodo hijo: {{name}}',
    unableToFindNodeParent: 'no se puede encontrar el nodo padre: {{name}}',
    unableToFindNodeSibling: 'no se puede encontrar el nodo hermano: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Nombre no válido',
    nameRequired: 'Nombre obligatorio',
    dataTypeRequired: 'Tipo de datos obligatorio',
    valueRequired: 'Valor obligatorio',
  },

  message: {
    bodyRequired: 'El cuerpo es obligatorio',
    subjectRequired: 'El asunto es obligatorio',
    notificationTypeRequired: 'El tipo de notificación es obligatorio',
    targetsRequired: 'Se requiere al menos un destino',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'La entidad es obligatoria',
    applyIfDuplicate: 'La condición "$t(nodeDefEdit.expressionsProp.applyIf)" está duplicada',
    applyIfInvalid: 'Condición "$t(nodeDefEdit.advancedProps.relevantIf)" no válida',
    columnWidthCannotBeGreaterThan: 'El ancho de columna no puede ser mayor que {{max}}',
    columnWidthCannotBeLessThan: 'El ancho de columna no puede ser menor que {{min}}',
    countMaxMustBePositiveNumber: 'El recuento máximo debe ser un número entero positivo',
    countMinMustBePositiveNumber: 'El recuento mínimo debe ser un número entero positivo',
    categoryRequired: 'La categoría es obligatoria',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: 'Valores predeterminados no válidos',
    defaultValuesNotSpecified: 'Valor predeterminado no especificado',
    entitySourceRequired: 'Se requiere la fuente de la entidad',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Solo la última expresión puede tener una condición "$t(nodeDefEdit.expressionsProp.applyIf)" vacía',
    expressionDuplicate: 'Expresión duplicada',
    expressionRequired: 'Expresión obligatoria',
    formulaInvalid: 'La fórmula es inválida',
    keysEmpty: 'Defina al menos un atributo clave',
    keysExceedingMax: 'Excediendo el número máximo de atributos clave',
    maxFileSizeInvalid: 'El tamaño máximo de archivo debe ser mayor que 0 y menor que {{max}}',
    nameInvalid:
      'El nombre no es válido (debe contener solo letras minúsculas, números y guiones bajos, comenzando con una letra)',
    taxonomyRequired: 'La taxonomía es obligatoria',
    validationsInvalid: 'Validaciones no válidas',
    countMaxInvalid: 'Recuento máximo no válido',
    countMinInvalid: 'Recuento mínimo no válido',
  },

  record: {
    keyDuplicate: 'Clave de registro duplicada',
    entityKeyDuplicate: 'Clave de entidad duplicada',
    entityKeyValueNotSpecified: 'Valor de clave para "{{keyDefName}}" no especificado',
    missingAncestorForEntity: 'No se puede encontrar "{{ancestorName}}" con estas claves: {{keyValues}}',
    oneOrMoreInvalidValues: 'Uno o más valores no son válidos',
    uniqueAttributeDuplicate: 'Valor duplicado',
    valueInvalid: 'Valor no válido',
    valueRequired: 'Valor requerido',
  },

  recordClone: {
    differentKeyAttributes: 'Los atributos clave son diferentes en el Ciclo {{cycleFrom}} y el Ciclo {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'El idioma es obligatorio',
    srsRequired: 'El sistema de referencia espacial es obligatorio',
    cycleRequired: 'El ciclo es obligatorio',
    cyclesRequired: 'Se debe definir al menos un ciclo',
    cyclesExceedingMax: 'Una encuesta puede tener como máximo 10 ciclos',
    cycleDateStartBeforeDateEnd: 'La fecha de inicio del ciclo debe ser anterior a su fecha de finalización',
    cycleDateStartAfterPrevDateEnd:
      'La fecha de inicio del ciclo debe ser posterior a la fecha de finalización del ciclo anterior',
    cycleDateStartInvalid: 'La fecha de inicio del ciclo no es válida',
    cycleDateStartMandatory: 'La fecha de inicio del ciclo es obligatoria',
    cycleDateEndInvalid: 'La fecha de finalización del ciclo no es válida',
    cycleDateEndMandatoryExceptForLastCycle:
      'La fecha de finalización del ciclo es obligatoria para todos los ciclos excepto el último',
    fieldManualLinksInvalid: 'El enlace del manual de campo no es válido',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Columnas no válidas: {{invalidHeaders}}',
    cannotFindNodeDef: "No se puede encontrar la definición de atributo o entidad con el nombre '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: "El código publicado ha cambiado: '{{oldCode}}' => '{{newCode}}'",
    codeDuplicate: 'Código duplicado {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'El código es obligatorio',
    familyRequired: 'La familia es obligatoria',
    genusRequired: 'El género es obligatorio',
    scientificNameDuplicate: 'Nombre científico duplicado {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'El nombre científico es obligatorio',
    taxaEmpty: 'Taxones vacíos',
    vernacularNamesDuplicate: "Nombre vernáculo duplicado '{{name}}' para el idioma '{{lang}}'",
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Columnas de información extra duplicadas: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Nombre de columna de información extra no válido "{{columnName}}": no puede ser una palabra reservada',
    missingRequiredColumns: 'Faltan columnas obligatorias: {{columns}}',
  },

  user: {
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: 'Correo electrónico no válido',
    emailNotFound: 'Correo electrónico no encontrado',
    groupRequired: 'El grupo es obligatorio',
    nameRequired: 'El nombre es obligatorio',
    titleRequired: 'El título es obligatorio',
    passwordRequired: 'La contraseña es obligatoria',
    passwordInvalid: 'La contraseña no debe contener espacios en blanco',
    passwordUnsafe: 'La contraseña debe tener al menos 8 caracteres y contener letras minúsculas, mayúsculas y números',
    passwordsDoNotMatch: 'Las contraseñas no coinciden',
    userNotFound: 'Usuario no encontrado. Asegúrese de que el correo electrónico y la contraseña sean correctos',
    passwordChangeRequired: 'Cambio de contraseña obligatorio',
    passwordResetNotAllowedWithPendingInvitation:
      'Restablecimiento de contraseña no permitido: el usuario ha sido invitado a una encuesta pero la invitación aún no ha sido aceptada',
  },

  userAccessRequest: {
    countryRequired: 'País es obligatorio',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'El nombre es obligatorio',
    institution: 'Institución es obligatorio',
    lastNameRequired: 'El apellido es obligatorio',
    purposeRequired: 'El propósito es obligatorio',
    surveyNameRequired: 'El nombre de la encuesta es obligatorio',
    invalidRequest: 'Solicitud de acceso de usuario no válida',
    userAlreadyExisting: 'Usuario con correo electrónico {{email}} ya existente',
    requestAlreadySent: 'Solicitud de acceso para el usuario con correo electrónico {{email}} ya enviada',
    invalidReCaptcha: 'ReCaptcha no válido',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Solicitud de acceso de usuario ya procesada',
    accessRequestNotFound: 'Solicitud de acceso de usuario no encontrada',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'El rol es obligatorio',
    surveyNameRequired: 'El nombre de la encuesta es obligatorio',
  },

  userPasswordChange: {
    oldPasswordRequired: 'La contraseña antigua es obligatoria',
    oldPasswordWrong: 'La contraseña antigua es incorrecta',
    newPasswordRequired: 'La nueva contraseña es obligatoria',
    confirmPasswordRequired: 'La confirmación de la contraseña es obligatoria',
    confirmedPasswordNotMatching: 'La nueva contraseña y la confirmación de la contraseña no coinciden',
  },

  userInvite: {
    messageContainsLinks: 'El mensaje de invitación no puede contener enlaces',
    messageTooLong: 'El mensaje de invitación es demasiado largo (máximo {{maxLength}} caracteres)',
  },

  user2FADevice: {
    nameDuplicate: 'Ya existe un dispositivo con el mismo nombre',
    nameRequired: 'Se requiere el nombre del dispositivo',
  },
}
