export default {
  confirmDeleteAllRecords: '¿Eliminar todos los registros antes de importar?',
  confirmDeleteAllRecordsInCycle: '¿Eliminar todos los registros en el ciclo {{cycle}} antes de importar?',
  conflictResolutionStrategy: {
    label: 'Estrategia de resolución de conflictos',
    info: 'Qué hacer en caso de que se encuentre el mismo registro (o un registro con los mismos atributos clave)',
    skipExisting: 'Omitir si ya existe',
    overwriteIfUpdated: 'Sobrescribir si se actualiza',
    merge: 'Fusionar registros',
  },
  deleteAllRecordsBeforeImport: 'Eliminar todos los registros antes de importar',
  downloadAllTemplates: 'Descargar todas las plantillas',
  downloadAllTemplates_csv: 'Descargar todas las plantillas (CSV)',
  downloadAllTemplates_xlsx: 'Descargar todas las plantillas (Excel)',
  downloadTemplate: 'Descargar plantilla',
  downloadTemplate_csv: 'Descargar plantilla (CSV)',
  downloadTemplate_xlsx: 'Descargar plantilla (Excel)',
  errors: {
    rowNum: 'Fila #',
  },
  forceImportFromAnotherSurvey: 'Forzar importación desde otra encuesta',
  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo:
    '### Pasos de importación\n1. Seleccione la entidad de destino\n2. Descargue una plantilla\n3. Rellene la plantilla y guárdela (si es CSV, use UTF-8 como codificación)\n4. Verifique las opciones\n5. Suba el archivo CSV/Excel\n6. Valide el archivo\n7. Inicie la importación\n',
  importIntoCycle: 'Importar al ciclo',
  importIntoMultipleEntityOrAttribute: 'Importar a entidad o atributo múltiple',
  importType: {
    label: 'Tipo de importación',
    insertNewRecords: 'Insertar nuevos registros',
    updateExistingRecords: 'Actualizar registros existentes',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Importación de datos de Arena Mobile completada:
{{summary}}`,
      importSummaryItem: {
        processed: 'registros procesados',
        insertedRecords: 'registros creados',
        updatedRecords: 'registros actualizados',
        skippedRecords: 'registros omitidos',
        missingFiles: 'archivos faltantes',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully:
        'Importación de datos de Collect completada:\n        - {{insertedRecords}} registros creados',
    },
    DataImportJob: {
      importCompleteSummary:
        '\n        - {{processed}} filas procesadas\n        - {{insertedRecords}} registros creados\n        - {{updatedRecords}} registros actualizados\n        - {{entitiesCreated}} entidades creadas\n        - {{entitiesDeleted}} entidades eliminadas\n        - {{updatedValues}} valores actualizados',
      importCompleteSuccessfully:
        '## Importación completada:\n$t(dataImportView:jobs.DataImportJob.importCompleteSummary)',
      importWithFilesCompleteSuccessfully:
        '$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)\n        - {{insertedFiles}} archivos insertados\n        - {{updatedFiles}} archivos actualizados\n        - {{deletedFiles}} archivos eliminados',
      importCompleteWithErrors: '## Importación completada (con errores):\n        - {{processed}} filas procesadas',
    },
    DataImportValidationJob: {
      validationCompleteWithErrors:
        '## Validación completada ({{errorsFoundMessage}})\n        - {{processed}} filas procesadas',
      validationWithFilesCompleteWithErrors:
        '$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)',
      validationCompleteSuccessfully:
        '## Validación completada sin errores\n        - {{processed}} filas procesadas\n        - {{insertedRecords}} registros se crearían\n        - {{updatedRecords}} registros se actualizarían\n        - {{entitiesCreated}} entidades se crearían\n        - {{entitiesDeleted}} entidades se eliminarían\n        - {{updatedValues}} valores se actualizarían',
      validationWithFilesCompleteSuccessfully:
        '$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)\n        - {{insertedFiles}} archivos se insertarían\n        - {{updatedFiles}} archivos se actualizarían\n        - {{deletedFiles}} archivos se eliminarían',
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Abortar en errores',
    preventAddingNewEntityData: 'Prevenir la adición de nuevos datos de entidad',
    preventUpdatingRecordsInAnalysis: 'Prevenir la actualización de registros en el paso de análisis',
    includeFiles: 'Incluir archivos',
    deleteExistingEntities: 'Eliminar los datos de la entidad seleccionada en todos los registros',
  },
  optionsInfo: {
    deleteExistingEntities:
      'ADVERTENCIA: todas las entidades "{{nodeDefName}}" \ny todos sus descendientes en todos los registros \nse eliminarán antes de insertar los nuevos.',
  },
  startImport: 'Iniciar importación',
  startImportConfirm:
    "Al pulsar 'Ok' se iniciará el proceso de importación. \n**No será posible revertir los cambios.** \n¿Está seguro de que desea continuar?",
  startImportConfirmWithDeleteExistingEntities:
    '$t(dataImportView:startImportConfirm) \n**($t(dataImportView:options.deleteExistingEntities) opción seleccionada: las entidades existentes se eliminarán antes de crear nuevas)**\n',
  steps: {
    selectImportType: 'Seleccionar tipo de importación',
    selectCycle: 'Seleccionar ciclo',
    selectEntity: 'Seleccionar entidad',
    selectFile: 'Seleccionar archivo',
    startImport: 'Iniciar importación',
  },
  templateForImport: 'Plantilla para importar',
  templateFor_specificDataImport_csv: 'Plantilla para importación de datos (CSV)',
  templateFor_specificDataImport_xlsx: 'Plantilla para importación de datos (Excel)',
  templateFor_genericDataImport_csv: 'Plantilla para importación de datos (genérica, CSV)',
  templateFor_genericDataImport_xlsx: 'Plantilla para importación de datos (genérica, Excel)',
  validateFile: 'Validar archivo',
  validateFileInfo:
    'El proceso de validación verifica que el archivo contenga datos válidos de acuerdo con el tipo de datos de cada atributo.',
}
