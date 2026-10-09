export default {
  aiDataQueryDescriptionMissing: 'Describa en lenguaje natural los datos que desea ver.',
  aiDataQueryEmpty: 'Primero seleccione una entidad y algunos atributos (o dimensiones y medidas).',
  aiDataQueryInvalid: 'La IA no pudo generar una consulta válida para esta solicitud: {{errors}}',
  aiDataQueryNoEntities: 'Esta encuesta no tiene entidades que se puedan consultar.',
  aiDataQuerySummaryInvalid:
    'La IA no pudo sugerir un nombre y una descripción para esta consulta. Inténtelo de nuevo.',
  userCannotDeleteHasMessages:
    'Este usuario no se puede eliminar: es autor de {{count}} mensaje(s); elimínelos o reasígnelos primero',
  userCannotDeleteLastSystemAdmin: 'Este usuario no se puede eliminar: es el último administrador del sistema',
  userCannotDeleteOwnsSurveys:
    'Este usuario no se puede eliminar: es propietario de {{count}} encuesta(s); transfiera la propiedad primero',
  userCannotDeleteSelf: 'No puede eliminar su propia cuenta de usuario',
  userEmailInvalid:
    'El correo electrónico de invitación no se pudo entregar a {{email}}; compruebe que la dirección sea correcta',
  cannotGetChild: "No se puede obtener el hijo '{{childName}}' del atributo {{name}}",
  cannotImportFilesExceedingQuota:
    'No se pueden importar archivos de registro: se excedería la cuota de almacenamiento de archivos',
  cannotInsertFileExceedingQuota:
    'No se puede insertar el archivo: se excedería la cuota de almacenamiento de archivos',
  cannotOverridePublishedTaxa: 'No se pueden sobrescribir taxones publicados',
  cantUpdateStep: 'No se puede actualizar el paso',
  chainCannotBeSaved: 'La cadena no es válida y no se puede guardar',
  csv: {
    emptyHeaderFound: 'Encabezado vacío encontrado en la columna {{columnPosition}}',
    emptyHeaders: 'Encabezados vacíos encontrados',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      'Error al exportar datos (demasiados elementos). Intente exportar datos usando el formato CSV.',
    noRecordsMatchingSearchCriteria: 'No hay registros que coincidan con los criterios de búsqueda',
  },
  dataImport: {
    importFromMobileNotAllawed: 'No se permite la importación de datos desde Arena Mobile',
    invalidNodeInRecord:
      'Nodo inválido en el registro "{{recordUuid}}", nodo "{{nodeUuid}}" con la definición de nodo "{{nodeDefName}}" (uuid "{{nodeDefUuid}}"): {{details}}',
    noRecordsFound: 'No se encontraron registros en el archivo de importación o formato de archivo incorrecto',
    pendingImportFileNotFoundOrExpired:
      'No se puede encontrar el archivo subido anteriormente; puede haber expirado. Por favor, súbalo de nuevo.',
    recordMergeWithSameKeysNotAllowed:
      'No se puede importar el registro "{{recordKeyValues}}": ya existe otro registro con las mismas claves y la fusión de registros con las mismas claves no está permitida en esta encuesta',
    recordOwnedByAnotherUser:
      'No se puede actualizar el registro "{{recordKeyValues}}" porque pertenece a otro usuario',
  },
  entryDataNotFound: 'Datos de entrada no encontrados: {{entryName}}',
  expression: {
    identifierNotFound: 'Identificador no encontrado',
    undefinedFunction: 'Función indefinida',
  },
  functionHasTooFewArguments: 'La función {{fnName}} requiere al menos {{minArity}} (obtenido {{numArgs}})',
  functionHasTooManyArguments: 'La función {{fnName}} solo acepta un máximo de {{maxArity}} (obtenido {{numArgs}})',
  generic: 'Error inesperado: {{text}}',
  geoWhispApiError: 'El servicio Whisp no está disponible temporalmente.',
  importingDataIntoWrongCollectSurvey:
    'Importando datos en la encuesta Collect incorrecta. URI esperado: {{collectSurveyUri}}',
  invalidType: 'Tipo no válido {{type}}',
  jobCanceledOrErrorsFound: 'Trabajo cancelado o errores encontrados; transacción de reversión',
  jobOrphanedOnRestart: 'El trabajo se interrumpió por un reinicio del servidor. Vuelva a intentarlo.',
  paramIsRequired: 'El parámetro {{param}} es obligatorio',
  unableToFindParent: 'No se puede encontrar el padre de {{name}}',
  unableToFindNode: 'No se puede encontrar el nodo con el nombre {{name}}',
  unableToFindSibling: 'No se puede encontrar el hermano con el nombre {{name}}',
  undefinedFunction: "Función indefinida '{{fnName}}' o tipos de parámetros incorrectos",
  invalidSyntax: 'La sintaxis de la expresión no es válida',
  networkError: 'Error de comunicación con el servidor',
  record: {
    errorUpdating: 'Error al actualizar el registro',
    entityNotFound: 'Entidad "{{entityName}}" con claves "{{keyValues}}" no encontrada',
    updateSelfAndDependentsDefaultValues:
      'Error al actualizar el registro; error al evaluar la expresión en el nodo {{nodeDefName}}: {{details}}',
  },
  recordPrintableExport: {
    missingEntityParams: 'La exportación de la página actual requiere entityDefUuid y entityNodeUuid',
    entityNotFound: 'Entidad no encontrada para la exportación especificada',
    missingServerUrl: 'Se requiere la URL pública del servidor al exportar con un código QR',
    qrTokenMismatch: 'No se pudo finalizar la exportación con código QR; inténtelo de nuevo',
  },
  sessionExpiredRefreshPage: 'La sesión podría haber caducado.\nIntente actualizar la página.',
  survey: {
    nodeDefNameNotFound: 'Definición de nodo no encontrada: {{name}}',
    dataMigrationInProgress: 'Esta encuesta se está actualizando; vuelva a intentarlo en breve.',
    fileNotFound: 'Archivo no encontrado',
  },
  unsupportedFunctionType: 'Tipo de función no compatible: {{exprType}}',
  aiNotConfigured:
    'La IA no está configurada. Configure un proveedor personal en la Configuración de IA o pida a su administrador que configure uno predeterminado.',
  aiFeaturesDisabled: 'Las funciones de IA están deshabilitadas en este despliegue.',
  aiFeatureDisabled: 'La función de IA "{{feature}}" está deshabilitada.',
  aiPromptTooLarge: 'El prompt de IA es demasiado grande ({{size}} caracteres; límite {{limit}}).',
  aiInputTooLong: 'El campo de entrada de IA "{{field}}" supera el límite de {{limit}} caracteres.',
  aiSchemaMissing: 'Falta el esquema de salida estructurada de IA para la función "{{feature}}".',
  aiProviderInvalid: 'Proveedor de IA no compatible: {{provider}}.',
  aiModelMissing: 'El identificador del modelo de IA es obligatorio.',
  aiApiKeyMissing: 'La clave de API es obligatoria para el proveedor {{provider}}.',
  aiBaseUrlMissing: 'Se requiere una URL base para el proveedor compatible con OpenAI.',
  aiModelListFailed: 'No se pudieron listar los modelos del proveedor: {{message}}',
  aiExpressionDescriptionMissing: 'Describa en lenguaje sencillo la expresión que desea.',
  aiExpressionTypeInvalid: 'Tipo de expresión desconocido: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'No se puede generar una expresión sin un campo de destino.',
  aiExpressionNodeDefNotFound: 'No se pudo encontrar el campo de destino (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'No se puede explicar una expresión vacía.',
  aiTranslationSocketMissing: 'WebSocket no conectado. Espere un momento e inténtelo de nuevo.',
  aiTranslationSourceLangMissing: 'El idioma de origen es obligatorio para la traducción.',
  aiTranslationTargetLangsMissing: 'Se requiere al menos un idioma de destino para la traducción.',
  aiTranslationItemsMissing: 'Nada que traducir.',
  aiTranslationTooManyItems: 'Demasiados elementos en un solo lote ({{count}}); el límite es {{limit}}.',
  aiActivityLogSurveyMissing: 'Se requiere una encuesta para resumir el registro de actividad.',
  aiChatbotDisabled: 'El chatbot de documentación está deshabilitado en este despliegue.',
  aiChatbotUpstreamError:
    'El chatbot de documentación no está disponible temporalmente. Inténtelo de nuevo en un momento.',
  aiChatbotPayloadTooLarge: 'Su conversación es demasiado grande. Borre el chat e intente con una pregunta más corta.',
  userHasPendingInvitation:
    "Ya hay una invitación pendiente para el usuario con el correo electrónico '{{email}}'; no se le puede invitar a esta encuesta hasta que sea aceptada",
  userHasRole: 'El usuario dado ya tiene un rol en esta encuesta',
  userHasRole_other: 'Los usuarios dados ya tienen un rol en esta encuesta',
  userInvalid: 'Usuario inválido',
  userIsAdmin: 'El usuario dado ya es un administrador del sistema',
  userNotAllowedToChangePref: 'Usuario no permitido para cambiar la preferencia',
  userNotAuthorized: 'El usuario {{userName}} no está autorizado',
  userNotFound: 'Usuario no encontrado: {{userUuid}}',
  usersBackupImport: {
    invalidFile: 'El archivo no es una copia de seguridad de usuarios de Arena válida',
  },
}
