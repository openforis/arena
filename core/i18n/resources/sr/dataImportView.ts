export default {
  confirmDeleteAllRecords: 'Obrisati sve zapise prije uvoza?',
  confirmDeleteAllRecordsInCycle: 'Obrisati sve zapise u ciklusu {{cycle}} prije uvoza?',
  conflictResolutionStrategy: {
    label: 'Strategija rješavanja konflikata',
    info: 'Šta uraditi ako se pronađe isti zapis (ili zapis sa istim ključnim atributima)',
    skipExisting: 'Preskoči ako već postoji',
    overwriteIfUpdated: 'Prepiši ako je ažuriran',
    merge: 'Spoji zapise',
  },
  deleteAllRecordsBeforeImport: 'Obriši sve zapise prije uvoza',
  downloadAllTemplates: 'Preuzmi sve šablone',
  downloadAllTemplates_csv: 'Preuzmi sve šablone (CSV)',
  downloadAllTemplates_xlsx: 'Preuzmi sve šablone (Excel)',
  downloadTemplate: 'Preuzmi šablon',
  downloadTemplate_csv: 'Preuzmi šablon (CSV)',
  downloadTemplate_xlsx: 'Preuzmi šablon (Excel)',
  errors: {
    rowNum: 'Red br.',
  },
  fileUploadChunkSize: {
    label: 'Veličina dijela fajla pri otpremanju',
  },
  forceImportFromAnotherSurvey: 'Prisilno uvezi iz drugog istraživanja',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromOdk: 'ODK / ODK Collect',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Koraci uvoza
1. Izaberite ciljni entitet
2. Preuzmite šablon
3. Popunite šablon i sačuvajte ga (ako je u CSV formatu, koristite UTF-8 kodiranje)
4. Provjerite opcije
5. Otpremite CSV/Excel fajl
6. Validirajte fajl
7. Pokrenite uvoz
`,
  importIntoCycle: 'Uvezi u ciklus',
  importIntoMultipleEntityOrAttribute: 'Uvezi u višestruki entitet ili atribut',
  importPreview: {
    title: 'Pregled uvoza',
    generatePreview: 'Generiši pregled',
    skipInfo:
      'Zapisi označeni sa "Preskoči" ne mogu se izabrati: već postoji zapis koji je kasnije izmijenjen, pa oni neće biti uvezeni.',
    confirmImport: 'Uvezi izabrane zapise ({{count}})',
    columns: {
      exists: 'Postoji',
      action: 'Radnja',
      dateModified: 'Izmjena uvezenog zapisa',
      existingDateModified: 'Izmjena postojećeg zapisa',
    },
    action: {
      insert: 'Umetni',
      overwrite: 'Prepiši',
      merge: 'Spoji',
      skip: 'Preskoči',
    },
  },
  importType: {
    label: 'Vrsta uvoza',
    insertNewRecords: 'Umetni nove zapise',
    updateExistingRecords: 'Ažuriraj postojeće zapise',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Uvoz podataka iz Arena Mobile završen:
{{summary}}`,
      importSummaryItem: {
        processed: 'obrađenih zapisa',
        insertedRecords: 'kreiranih zapisa',
        updatedRecords: 'ažuriranih zapisa',
        skippedRecords: 'preskočenih zapisa',
        missingFiles: 'nedostajućih fajlova',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Uvoz podataka iz Collect završen:
        - kreiranih zapisa: {{insertedRecords}}`,
    },
    OdkDataImportJob: {
      importCompleteSuccessfully: `Uvoz podataka iz ODK završen:
        - kreiranih zapisa: {{submittedCount}}
        - preskočenih duplih podnesaka: {{skippedCount}}`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - obrađenih redova: {{processed}}
        - kreiranih zapisa: {{insertedRecords}}
        - ažuriranih zapisa: {{updatedRecords}}
        - kreiranih entiteta: {{entitiesCreated}}
        - obrisanih entiteta: {{entitiesDeleted}}
        - ažuriranih vrijednosti: {{updatedValues}}`,
      importCompleteSuccessfully: `## Uvoz završen:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - umetnutih fajlova: {{insertedFiles}}
        - ažuriranih fajlova: {{updatedFiles}}
        - obrisanih fajlova: {{deletedFiles}}`,
      importCompleteWithErrors: `## Uvoz završen (sa greškama):
        - obrađenih redova: {{processed}}`,
      tooLong: 'Ovaj uvoz traje duže vrijeme. $t(common.trySplittingFileIntoSmallerChunks)',
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validacija završena ({{errorsFoundMessage}})
        - obrađenih redova: {{processed}}`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validacija završena bez grešaka
        - obrađenih redova: {{processed}}
        - zapisa koji bi bili kreirani: {{insertedRecords}}
        - zapisa koji bi bili ažurirani: {{updatedRecords}}
        - entiteta koji bi bili kreirani: {{entitiesCreated}}
        - entiteta koji bi bili obrisani: {{entitiesDeleted}}
        - vrijednosti koje bi bile ažurirane: {{updatedValues}}`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - fajlova koji bi bili umetnuti: {{insertedFiles}}
        - fajlova koji bi bili ažurirani: {{updatedFiles}}
        - fajlova koji bi bili obrisani: {{deletedFiles}}`,
      tooLong: 'Ova validacija traje duže vrijeme. $t(common.trySplittingFileIntoSmallerChunks)',
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Prekini u slučaju grešaka',
    preventAddingNewEntityData: 'Spriječi dodavanje podataka novih entiteta',
    preventUpdatingRecordsInAnalysis: 'Spriječi ažuriranje zapisa u koraku Analiza',
    includeFiles: 'Uključi fajlove',
    skipMissingFiles: 'Zanemari nedostajuće fajlove',
    deleteExistingEntities: `Obriši podatke izabranog entiteta u svim zapisima`,
  },
  optionsInfo: {
    deleteExistingEntities: `UPOZORENJE: svi entiteti "{{nodeDefName}}"
i svi njihovi potomci u svim zapisima
biće obrisani prije umetanja novih.`,
  },
  startImport: 'Pokreni uvoz',
  startImportConfirm: `Pritiskom na 'Ok' pokrenućete proces uvoza.
**Neće biti moguće poništiti izmjene.**
Da li ste sigurni da želite da nastavite?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)
**(izabrana opcija $t(dataImportView:options.deleteExistingEntities): postojeći entiteti biće obrisani prije kreiranja novih)**
`,
  steps: {
    selectImportType: 'Izaberite vrstu uvoza',
    selectCycle: 'Izaberite ciklus',
    selectEntity: 'Izaberite entitet',
    selectFile: 'Izaberite fajl',
    startImport: 'Pokreni uvoz',
  },
  templateForImport: 'Šablon za uvoz',
  templateFor_specificDataImport_csv: 'Šablon za uvoz (CSV)',
  templateFor_specificDataImport_xlsx: 'Šablon za uvoz (Excel)',
  templateFor_genericDataImport_csv: 'Šablon za uvoz (generički, CSV)',
  templateFor_genericDataImport_xlsx: 'Šablon za uvoz (generički, Excel)',
  validateFile: 'Validiraj fajl',
  validateFileInfo:
    'Proces validacije provjerava da li fajl sadrži ispravne podatke u skladu sa tipom podataka svakog atributa.',
}
