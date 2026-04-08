export default {
  confirmDeleteAllRecords: 'Delete all records before import?',
  confirmDeleteAllRecordsInCycle: 'Delete all records in the cycle {{cycle}} before import?',
  conflictResolutionStrategy: {
    label: 'Conflict resolution strategy',
    info: 'What to do in case the same record (or a record with the same key attributes) is found',
    skipExisting: 'Skip if already existing',
    overwriteIfUpdated: 'Overwrite if updated',
    merge: 'Merge records',
  },
  deleteAllRecordsBeforeImport: 'Delete all records before import',
  downloadAllTemplates: 'Download all templates',
  downloadAllTemplates_csv: 'Download all templates (CSV)',
  downloadAllTemplates_xlsx: 'Download all templates (Excel)',
  downloadTemplate: 'Download template',
  downloadTemplate_csv: 'Download template (CSV)',
  downloadTemplate_xlsx: 'Download template (Excel)',
  errors: {
    rowNum: 'Row #',
  },
  fileUploadChunkSize: {
    label: 'File upload chunk size',
  },
  forceImportFromAnotherSurvey: 'Force import from another survey',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Importing steps
1. Select the target entity
2. Download a template
3. Fill in the template and save it (if in CSV, use UTF-8 as encoding)
4. Check options
5. Upload the CSV/Excel file
6. Validate the file
7. Start import
`,
  importIntoCycle: 'Import into cycle',
  importIntoMultipleEntityOrAttribute: 'Import into multiple entity or attribute',
  importType: {
    label: 'Import type',
    insertNewRecords: 'Insert new records',
    updateExistingRecords: 'Update existing records',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Arena Mobile data import complete:
{{summary}}`,
      importSummaryItem: {
        processed: 'records processed',
        insertedRecords: 'records created',
        updatedRecords: 'records updated',
        skippedRecords: 'records skipped',
        missingFiles: 'files missing',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Collect data import complete:
        - {{insertedRecords}} records created`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} rows processed
        - {{insertedRecords}} records created
        - {{updatedRecords}} records updated
        - {{entitiesCreated}} entities created
        - {{entitiesDeleted}} entities deleted
        - {{updatedValues}} values updated`,
      importCompleteSuccessfully: `## Import complete:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} files inserted
        - {{updatedFiles}} files updated
        - {{deletedFiles}} files deleted`,
      importCompleteWithErrors: `## Import complete (with errors):
        - {{processed}} rows processed`,
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validation complete ({{errorsFoundMessage}})
        - {{processed}} rows processed`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validation complete without errors
        - {{processed}} rows processed
        - {{insertedRecords}} records would be created
        - {{updatedRecords}} records would be updated
        - {{entitiesCreated}} entities would be created
        - {{entitiesDeleted}} entities would be deleted
        - {{updatedValues}} values would be updated`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} files would be inserted
        - {{updatedFiles}} files would be updated
        - {{deletedFiles}} files would be deleted`,
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Abort on errors',
    preventAddingNewEntityData: 'Prevent adding new entity data',
    preventUpdatingRecordsInAnalysis: 'Prevent updating records in Analysis step',
    includeFiles: 'Include files',
    deleteExistingEntities: `Delete selected entity's data in all records`,
  },
  optionsInfo: {
    deleteExistingEntities: `WARNING: all entities "{{nodeDefName}}" 
and all their descendants in all records  
will be deleted before inserting the new ones.`,
  },
  startImport: 'Start import',
  startImportConfirm: `By pressing 'Ok' you will start the import process.  
**It won't be possible to rollback the changes.**  
Are you sure you want to continue?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)  
**($t(dataImportView:options.deleteExistingEntities) option selected: existing entities will be deleted before creating new ones)**
`,
  steps: {
    selectImportType: 'Select Import Type',
    selectCycle: 'Select Cycle',
    selectEntity: 'Select Entity',
    selectFile: 'Select File',
    startImport: 'Start import',
  },
  templateForImport: 'Template for import',
  templateFor_specificDataImport_csv: 'Template for import (CSV)',
  templateFor_specificDataImport_xlsx: 'Template for import (Excel)',
  templateFor_genericDataImport_csv: 'Template for import (generic, CSV)',
  templateFor_genericDataImport_xlsx: 'Template for import (generic, Excel)',
  validateFile: 'Validate file',
  validateFileInfo:
    'The validation process checks that the file contains valid data according to the data type of each attribute.',
}
