export default {
  mapCustomLayers: {
    urlInvalid: 'La URL del servicio no es válida',
    urlNotAllowed: 'Solo se pueden usar direcciones http y https públicas',
    hostNotFound: 'Host no encontrado: {{host}}',
    redirectNotFollowed: 'El servicio redirige a {{location}}: use esa URL',
    responseTooLarge: 'La respuesta del servicio supera los {{limitMb}} MB',
    timeout: 'El servicio no respondió en {{seconds}} segundos',
    fetchFailed: 'El servicio respondió con el estado HTTP {{status}}',
    unreachable: 'No se puede acceder al servicio',
    notCapabilities: 'No se encontraron capabilities WMS o WMTS en esta URL',
    noLayers: 'El servicio no tiene ninguna capa que se pueda mostrar',
    invalidLayers: 'Las capas de mapa no son válidas',
    tooManyLayers: 'Se pueden añadir como máximo {{max}} capas de mapa personalizadas',
    busy: 'El servidor está ocupado cargando otros servicios: inténtelo de nuevo en un momento',
  },
  aiDataQueryDescriptionMissing: 'Describa en lenguaje natural los datos que desea ver.',
  aiDataQueryEmpty: 'Primero seleccione una entidad y algunos atributos (o dimensiones y medidas).',
  aiLocalServerUnreachable:
    'No se pudo conectar con el servidor de IA local en {{baseUrl}}. ¿Está en marcha, con CORS activado? ¿Bloqueó el navegador el acceso a los dispositivos de la red local?',
  aiLocalServerModelMissing:
    'El modelo "{{modelId}}" no está disponible en el servidor de IA local. Cárguelo en LM Studio o elija otro modelo en su configuración de IA.',
  aiLocalServerContextExceeded:
    'La solicitud es demasiado larga para el tamaño de contexto del modelo local. Cargue el modelo con un contexto mayor en LM Studio o acorte la solicitud.',
  aiLocalServerError: 'El servidor de IA local devolvió un error (HTTP {{status}}).',
  aiNoEngineAvailable: 'No se puede usar ningún motor de IA para esta solicitud.',
  aiLocalServerConsentCancelled: 'La solicitud se canceló.',
  aiCapabilityStatsInvalid: 'Las estadísticas de capacidades no son válidas.',
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
  aggregateFunctionInvalid: `La función de agregación personalizada "{{name}}" no es válida: edítela para corregirla`,
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
    recordOfAnotherUserGroup:
      'No se puede actualizar el registro "{{recordKeyValues}}" porque pertenece a otro grupo de usuarios',
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
  geoWhispSamplingPointDataCategoryMissing: 'No se encontró la categoría de datos de puntos de muestreo.',
  geoWhispSamplingPointDataLocationsMissing:
    'No se encontró ningún elemento de datos de puntos de muestreo con una ubicación válida.',
  importingDataIntoWrongCollectSurvey:
    'Importando datos en la encuesta Collect incorrecta. URI esperado: {{collectSurveyUri}}',
  invalidParams: 'Parámetros de solicitud no válidos.',
  invalidType: 'Tipo no válido {{type}}',
  jobCanceledOrErrorsFound: 'Trabajo cancelado o errores encontrados; transacción de reversión',
  jobOrphanedOnRestart: 'El trabajo se interrumpió por un reinicio del servidor. Vuelva a intentarlo.',
  mobileAppVersionNotSupported:
    'Esta versión de Arena Mobile no es compatible con el servidor: actualícela a la versión {{minVersion}} o posterior',
  paramIsRequired: 'El parámetro {{param}} es obligatorio',
  paramMustBeInteger: 'El parámetro {{param}} debe ser un número entero',
  propUpdateNotAllowed: 'La propiedad "{{key}}" no se puede actualizar',
  unableToFindParent: 'No se puede encontrar el padre de {{name}}',
  unableToFindNode: 'No se puede encontrar el nodo con el nombre {{name}}',
  unableToFindSibling: 'No se puede encontrar el hermano con el nombre {{name}}',
  undefinedFunction: "Función indefinida '{{fnName}}' o tipos de parámetros incorrectos",
  invalidSyntax: 'La sintaxis de la expresión no es válida',
  networkError: 'Error de comunicación con el servidor',
  nodeDefConversionNotAllowed: `'{{name}}' no se puede convertir en {{toType}}`,
  nodeDefTypeInvalid: 'Tipo de definición de nodo no válido: {{type}}',
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
    languageCodeInvalid: 'El código de idioma no es válido: {{lang}}',
    cycleKeysInvalid: 'Los ciclos deben estar numerados de forma consecutiva, empezando por 1',
    srsCodeInvalid: 'El código del sistema de referencia espacial no es válido: {{code}}',
  },
  unsupportedFunctionType: 'Tipo de función no compatible: {{exprType}}',
  aiSessionExpired: 'Su sesión ha caducado. Vuelva a iniciar sesión.',
  aiNotAuthorized: 'No tiene permiso para usar esta función de IA aquí.',
  aiNotConfigured:
    'La IA no está configurada. Configure un proveedor personal en la Configuración de IA o pida a su administrador que configure uno predeterminado.',
  aiPolicyRefused:
    'La política de IA de esta encuesta no permite enviar $t(common:aiPolicy.dataClass.{{dataClass}}) a $t(common:aiPolicy.hostingClass.{{hostingClass}}).',
  aiPolicyInvalid:
    'La política de IA no es válida: elija un nivel para el diseño de la encuesta y otro para los datos de los registros.',
  aiPolicyAboveCeiling:
    '«$t(common:aiPolicy.level.{{level}})» no está permitido para $t(common:aiPolicy.dataClass.{{dataClass}}) en esta instancia de Arena (máximo: «$t(common:aiPolicy.level.{{ceiling}})»).',
  aiFeaturesDisabled: 'Las funciones de IA están deshabilitadas en este despliegue.',
  aiFeatureDisabled: 'La función de IA "{{feature}}" está deshabilitada.',
  aiPromptTooLarge: 'El prompt de IA es demasiado grande ({{size}} caracteres; límite {{limit}}).',
  aiInputTooLong: 'El campo de entrada de IA "{{field}}" supera el límite de {{limit}} caracteres.',
  aiFeatureUnknown: 'Función de IA desconocida "{{feature}}".',
  aiCallInvalid: 'La solicitud de IA no es válida ({{reason}}).',
  aiRateLimited: 'Demasiadas solicitudes de IA. Espere un minuto y vuelva a intentarlo.',
  aiRequestTimeout: 'La IA tardó demasiado en responder. Inténtelo de nuevo.',
  aiProviderAuth:
    'El proveedor de IA rechazó las credenciales. Compruebe la clave API en Ajustes de IA o consulte a su administrador.',
  aiProviderRateLimited: 'El proveedor de IA está limitando las solicitudes. Inténtelo de nuevo en un momento.',
  aiProviderRejected: 'El proveedor de IA rechazó la solicitud (compruebe el nombre del modelo en Ajustes de IA).',
  aiDataDictionaryInvalid: 'La IA no devolvió descripciones de campos utilizables.',
  aiSchemaMissing: 'Falta el esquema de salida estructurada de IA para la función "{{feature}}".',
  aiProviderInvalid: 'Proveedor de IA no compatible: {{provider}}.',
  aiModelMissing: 'El identificador del modelo de IA es obligatorio.',
  aiApiKeyMissing: 'La clave de API es obligatoria para el proveedor {{provider}}.',
  aiBaseUrlMissing: 'Se requiere una URL base para el proveedor compatible con OpenAI.',
  aiBaseUrlNotAllowed:
    'Esta URL base apunta a una dirección interna y no está permitida. Pida a su administrador que la añada a los servidores de modelos de la organización.',
  aiProviderUnavailable: 'No se pudo contactar con el proveedor de IA. Inténtelo de nuevo más tarde.',
  aiModelListFailed: 'No se pudieron listar los modelos del proveedor: {{message}}',
  aiExpressionDescriptionMissing: 'Describa en lenguaje sencillo la expresión que desea.',
  aiExpressionTypeInvalid: 'Tipo de expresión desconocido: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'No se puede generar una expresión sin un campo de destino.',
  aiExpressionNodeDefNotFound: 'No se pudo encontrar el campo de destino (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'No se puede explicar una expresión vacía.',
  aiTranslationSourceLangMissing: 'El idioma de origen es obligatorio para la traducción.',
  aiTranslationTargetLangsMissing: 'Se requiere al menos un idioma de destino para la traducción.',
  aiTranslationItemsMissing: 'Nada que traducir.',
  aiTranslationInvalid: 'La IA no devolvió una traducción utilizable. Inténtelo de nuevo.',
  aiTranslationTooManyItems: 'Demasiados elementos en un solo lote ({{count}}); el límite es {{limit}}.',
  userHasPendingInvitation:
    "Ya hay una invitación pendiente para el usuario con el correo electrónico '{{email}}'; no se le puede invitar a esta encuesta hasta que sea aceptada",
  userHasRole: 'El usuario dado ya tiene un rol en esta encuesta',
  userHasRole_other: 'Los usuarios dados ya tienen un rol en esta encuesta',
  userInvalid: 'Usuario inválido',
  userInvitationLinkNotAvailable:
    'Solo un administrador del sistema puede copiar el enlace de invitación de este usuario, porque el usuario tiene roles o invitaciones fuera de esta encuesta',
  surveyCompareFileTooLarge:
    'El archivo de la encuesta es demasiado grande (máx. {{maxSize}} MB): exporte la encuesta sin datos, los registros y sus archivos no son necesarios para comparar encuestas',
  userIsAdmin: 'El usuario dado ya es un administrador del sistema',
  userNotAllowedToChangePref: 'Usuario no permitido para cambiar la preferencia',
  userNotAuthorized: 'El usuario {{userName}} no está autorizado',
  userNotFound: 'Usuario no encontrado: {{userUuid}}',
  userNotInvitedToSurvey: 'El usuario no tiene ninguna invitación pendiente a esta encuesta',
  usersBackupImport: {
    invalidFile: 'El archivo no es una copia de seguridad de usuarios de Arena válida',
  },
}
