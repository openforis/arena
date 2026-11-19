export default {
  confirmDeleteAllRecords: 'Alle Datensätze vor dem Import löschen?',
  confirmDeleteAllRecordsInCycle: 'Alle Datensätze im Zyklus {{cycle}} vor dem Import löschen?',
  conflictResolutionStrategy: {
    label: 'Strategie zur Konfliktlösung',
    info: 'Vorgehen, wenn derselbe Datensatz oder ein Datensatz mit denselben Schlüsselattributen gefunden wird',
    skipExisting: 'Überspringen, wenn bereits vorhanden',
    overwriteIfUpdated: 'Überschreiben, wenn aktualisiert',
    merge: 'Datensätze zusammenführen',
  },
  deleteAllRecordsBeforeImport: 'Alle Datensätze vor dem Import löschen',
  downloadAllTemplates: 'Alle Vorlagen herunterladen',
  downloadAllTemplates_csv: 'Alle Vorlagen herunterladen (CSV)',
  downloadAllTemplates_xlsx: 'Alle Vorlagen herunterladen (Excel)',
  downloadTemplate: 'Vorlage herunterladen',
  downloadTemplate_csv: 'Vorlage herunterladen (CSV)',
  downloadTemplate_xlsx: 'Vorlage herunterladen (Excel)',
  errors: {
    rowNum: 'Zeilennr.',
  },
  fileUploadChunkSize: {
    label: 'Blockgröße beim Datei-Upload',
  },
  forceImportFromAnotherSurvey: 'Import aus einer anderen Erhebung erzwingen',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromOdk: 'ODK / ODK Collect',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Importschritte
1. Zielentität auswählen
2. Vorlage herunterladen
3. Vorlage ausfüllen und speichern (bei CSV UTF-8 als Kodierung verwenden)
4. Optionen prüfen
5. CSV-/Excel-Datei hochladen
6. Datei validieren
7. Import starten
`,
  importIntoCycle: 'In Zyklus importieren',
  importIntoMultipleEntityOrAttribute: 'In Mehrfachentität oder -attribut importieren',
  importPreview: {
    title: 'Importvorschau',
    generatePreview: 'Vorschau erzeugen',
    skipInfo:
      'Mit „Überspringen“ markierte Datensätze können nicht ausgewählt werden: Es existiert bereits ein später geänderter Datensatz, daher werden sie nicht importiert.',
    confirmImport: 'Ausgewählte Datensätze importieren ({{count}})',
    columns: {
      exists: 'Vorhanden',
      action: 'Aktion',
      dateModified: 'Änderungsdatum des importierten Datensatzes',
      existingDateModified: 'Änderungsdatum des vorhandenen Datensatzes',
    },
    action: {
      insert: 'Einfügen',
      overwrite: 'Überschreiben',
      merge: 'Zusammenführen',
      skip: 'Überspringen',
    },
  },
  importType: {
    label: 'Importtyp',
    insertNewRecords: 'Neue Datensätze einfügen',
    updateExistingRecords: 'Vorhandene Datensätze aktualisieren',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Arena-Mobile-Datenimport abgeschlossen:
{{summary}}`,
      importSummaryItem: {
        processed: 'Datensätze verarbeitet',
        insertedRecords: 'Datensätze erstellt',
        updatedRecords: 'Datensätze aktualisiert',
        skippedRecords: 'Datensätze übersprungen',
        missingFiles: 'Dateien fehlen',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Collect-Datenimport abgeschlossen:
        - {{insertedRecords}} Datensätze erstellt`,
    },
    OdkDataImportJob: {
      importCompleteSuccessfully: `ODK-Datenimport abgeschlossen:
        - {{submittedCount}} Datensätze erstellt
        - {{skippedCount}} doppelte Übermittlungen übersprungen`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} Zeilen verarbeitet
        - {{insertedRecords}} Datensätze erstellt
        - {{updatedRecords}} Datensätze aktualisiert
        - {{entitiesCreated}} Entitäten erstellt
        - {{entitiesDeleted}} Entitäten gelöscht
        - {{updatedValues}} Werte aktualisiert`,
      importCompleteSuccessfully: `## Import abgeschlossen:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} Dateien eingefügt
        - {{updatedFiles}} Dateien aktualisiert
        - {{deletedFiles}} Dateien gelöscht`,
      importCompleteWithErrors: `## Import abgeschlossen (mit Fehlern):
        - {{processed}} Zeilen verarbeitet`,
      tooLong: 'Dieser Import dauert länger. $t(common.trySplittingFileIntoSmallerChunks)',
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validierung abgeschlossen ({{errorsFoundMessage}})
        - {{processed}} Zeilen verarbeitet`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validierung fehlerfrei abgeschlossen
        - {{processed}} Zeilen verarbeitet
        - {{insertedRecords}} Datensätze würden erstellt
        - {{updatedRecords}} Datensätze würden aktualisiert
        - {{entitiesCreated}} Entitäten würden erstellt
        - {{entitiesDeleted}} Entitäten würden gelöscht
        - {{updatedValues}} Werte würden aktualisiert`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} Dateien würden eingefügt
        - {{updatedFiles}} Dateien würden aktualisiert
        - {{deletedFiles}} Dateien würden gelöscht`,
      tooLong: 'Diese Validierung dauert länger. $t(common.trySplittingFileIntoSmallerChunks)',
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Bei Fehlern abbrechen',
    preventAddingNewEntityData: 'Hinzufügen neuer Entitätsdaten verhindern',
    preventUpdatingRecordsInAnalysis: 'Aktualisieren von Datensätzen im Analyseschritt verhindern',
    includeFiles: 'Dateien einbeziehen',
    skipMissingFiles: 'Fehlende Dateien ignorieren',
    deleteExistingEntities: `Daten der ausgewählten Entität in allen Datensätzen löschen`,
  },
  optionsInfo: {
    deleteExistingEntities: `WARNUNG: Alle Entitäten „{{nodeDefName}}“ 
und alle ihre untergeordneten Elemente in sämtlichen Datensätzen  
werden gelöscht, bevor die neuen eingefügt werden.`,
  },
  startImport: 'Import starten',
  startImportConfirm: `Durch Klicken auf „OK“ starten Sie den Import.  
**Die Änderungen können nicht rückgängig gemacht werden.**  
Möchten Sie wirklich fortfahren?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)  
**(Option „$t(dataImportView:options.deleteExistingEntities)“ ausgewählt: Vorhandene Entitäten werden gelöscht, bevor neue erstellt werden.)**
`,
  steps: {
    selectImportType: 'Importtyp auswählen',
    selectCycle: 'Zyklus auswählen',
    selectEntity: 'Entität auswählen',
    selectFile: 'Datei auswählen',
    startImport: 'Import starten',
  },
  templateForImport: 'Importvorlage',
  templateFor_specificDataImport_csv: 'Importvorlage (CSV)',
  templateFor_specificDataImport_xlsx: 'Importvorlage (Excel)',
  templateFor_genericDataImport_csv: 'Importvorlage (generisch, CSV)',
  templateFor_genericDataImport_xlsx: 'Importvorlage (generisch, Excel)',
  validateFile: 'Datei validieren',
  validateFileInfo: 'Die Validierung prüft, ob die Datei für den Datentyp jedes Attributs gültige Daten enthält.',
}
