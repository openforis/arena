export default {
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
    noRecordsFound: 'No se encontraron registros en el archivo de importación o formato de archivo incorrecto',
  },
  entryDataNotFound: 'Datos de entrada no encontrados: {{entryName}}',
  expression: {
    identifierNotFound: 'Identificador no encontrado',
    undefinedFunction: 'Función indefinida',
  },
  functionHasTooFewArguments: 'La función {{fnName}} requiere al menos {{minArity}} (obtenido {{numArgs}})',
  functionHasTooManyArguments: 'La función {{fnName}} solo acepta un máximo de {{maxArity}} (obtenido {{numArgs}})',
  generic: 'Error inesperado: {{text}}',
  importingDataIntoWrongCollectSurvey:
    'Importando datos en la encuesta Collect incorrecta. URI esperado: {{collectSurveyUri}}',
  invalidType: 'Tipo no válido {{type}}',
  jobCanceledOrErrorsFound: 'Trabajo cancelado o errores encontrados; transacción de reversión',
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
  sessionExpiredRefreshPage: 'La sesión podría haber caducado.\nIntente actualizar la página.',
  survey: {
    nodeDefNameNotFound: 'Definición de nodo no encontrada: {{name}}',
  },
  unsupportedFunctionType: 'Tipo de función no compatible: {{exprType}}',
  userHasPendingInvitation:
    "Ya hay una invitación pendiente para el usuario con el correo electrónico '{{email}}'; no se le puede invitar a esta encuesta hasta que sea aceptada",
  userHasRole: 'El usuario dado ya tiene un rol en esta encuesta',
  userHasRole_other: 'Los usuarios dados ya tienen un rol en esta encuesta',
  userInvalid: 'Usuario inválido',
  userIsAdmin: 'El usuario dado ya es un administrador del sistema',
  userNotAllowedToChangePref: 'Usuario no permitido para cambiar la preferencia',
  userNotAuthorized: 'El usuario {{userName}} no está autorizado',
}
