export default {
  confirmDeleteAllRecords: 'Импортлохоос өмнө бүх бичлэгүүдийг устгах уу?',
  confirmDeleteAllRecordsInCycle: 'Импортлохоос өмнө {{cycle}} мөчлөг дэх бүх бичлэгүүдийг устгах уу?',
  conflictResolutionStrategy: {
    label: 'Зөрчилдөөнийг шийдвэрлэх стратеги',
    info: 'Ижил бичлэг (эсвэл ижил түлхүүр шинж чанартай бичлэг) олдвол юу хийх',
    skipExisting: 'Хэрэв байгаа бол алгасах',
    overwriteIfUpdated: 'Хэрэв шинэчлэгдсэн бол дахин бичих',
    merge: 'Бичлэгүүдийг нэгтгэх',
  },
  deleteAllRecordsBeforeImport: 'Импортлохоос өмнө бүх бичлэгүүдийг устгах',
  downloadAllTemplates: 'Бүх загваруудыг татах',
  downloadAllTemplates_csv: 'Бүх загваруудыг татах (CSV)',
  downloadAllTemplates_xlsx: 'Бүх загваруудыг татах (Excel)',
  downloadTemplate: 'Загвар татах',
  downloadTemplate_csv: 'Загвар татах (CSV)',
  downloadTemplate_xlsx: 'Загвар татах (Excel)',
  errors: {
    rowNum: 'Мөр #',
  },
  forceImportFromAnotherSurvey: 'Өөр судалгаанаас албадан импортлох',

  importFromArena: 'Арена/Арена Мобайл',
  importFromCollect: 'Цуглуулах / Цуглуулах Мобайл',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Импортлох алхамууд
1. Зорилтот объектыг сонгох
2. Загварыг татах
3. Загварыг бөглөж хадгалах (хэрэв CSV бол UTF-8-г кодчилол болгон ашиглана)
4. Сонголтуудыг шалгах
5. CSV/Excel файлыг байршуулах
6. Файлыг баталгаажуулах
7. Импортлохыг эхлүүлэх
`,
  importIntoCycle: 'Мөчлөгт импортлох',
  importIntoMultipleEntityOrAttribute: 'Олон объектод эсвэл шинж чанарт импортлох',
  importType: {
    label: 'Импортын төрөл',
    insertNewRecords: 'Шинэ бичлэгүүдийг оруулах',
    updateExistingRecords: 'Одоо байгаа бичлэгүүдийг шинэчлэх',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Arena Mobile өгөгдөл импортлолт амжилттай боллоо:
{{summary}}`,
      importSummaryItem: {
        processed: 'боловсруулсан бичлэг',
        insertedRecords: 'үүсгэсэн бичлэг',
        updatedRecords: 'шинэчилсэн бичлэг',
        skippedRecords: 'алгассан бичлэг',
        missingFiles: 'байхгүй файлууд',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Цуглуулгын өгөгдлийн импорт амжилттай боллоо:
        - {{insertedRecords}} бичлэг үүсгэгдсэн`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} мөр боловсруулагдсан
        - {{insertedRecords}} бичлэг үүсгэгдсэн
        - {{updatedRecords}} бичлэг шинэчлэгдсэн
        - {{entitiesCreated}} объект үүсгэгдсэн
        - {{entitiesDeleted}} объект устгагдсан
        - {{updatedValues}} утга шинэчлэгдсэн`,
      importCompleteSuccessfully: `## Импорт амжилттай боллоо:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} файл оруулсан
        - {{updatedFiles}} файл шинэчлэгдсэн
        - {{deletedFiles}} файл устгагдсан`,
      importCompleteWithErrors: `## Импорт дууссан (алдаатай):
        - {{processed}} мөр боловсруулагдсан`,
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Баталгаажуулалт дууссан ({{errorsFoundMessage}})
        - {{processed}} мөр боловсруулагдсан`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Баталгаажуулалт алдаагүй амжилттай боллоо
        - {{processed}} мөр боловсруулагдсан
        - {{insertedRecords}} бичлэг үүсгэгдэх байсан
        - {{updatedRecords}} бичлэг шинэчлэгдэх байсан
        - {{entitiesCreated}} объект үүсгэгдэх байсан
        - {{entitiesDeleted}} объект устгагдах байсан
        - {{updatedValues}} утга шинэчлэгдэх байсан`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} файл оруулах байсан
        - {{updatedFiles}} файл шинэчлэх байсан
        - {{deletedFiles}} файл устгах байсан`,
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Алдаа гарвал зогсоох',
    preventAddingNewEntityData: 'Шинэ объектын өгөгдөл нэмэхийг хориглох',
    preventUpdatingRecordsInAnalysis: 'Шинжилгээний алхамд бичлэгүүдийг шинэчлэхийг хориглох',
    includeFiles: 'Файлуудыг оруулах',
    deleteExistingEntities: `Сонгогдсон объектын өгөгдлийг бүх бичлэгээс устгах`,
  },
  optionsInfo: {
    deleteExistingEntities: `АНХААРУУЛГА: бүх "{{nodeDefName}}" объектууд
болон тэдний бүх үр удам бүх бичлэгүүдээс
шинэ объектуудыг оруулахаас өмнө устгагдана.`,
  },
  startImport: 'Импортлохыг эхлүүлэх',
  startImportConfirm: `ОК товчийг дарснаар та импортлох үйл явцыг эхлүүлнэ.
**Өөрчлөлтүүдийг буцаах боломжгүй.**
Үргэлжлүүлэхдээ итгэлтэй байна уу?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)
**($t(dataImportView:options.deleteExistingEntities) сонголт сонгогдсон: одоо байгаа объектууд шинийг үүсгэхээс өмнө устгагдана)**
`,
  steps: {
    selectImportType: 'Импортын төрлийг сонгох',
    selectCycle: 'Мөчлөг сонгох',
    selectEntity: 'Объект сонгох',
    selectFile: 'Файл сонгох',
    startImport: 'Импортлохыг эхлүүлэх',
  },
  templateForImport: 'Импортын загвар',
  templateFor_specificDataImport_csv: 'Өгөгдөл импортлох загвар (CSV)',
  templateFor_specificDataImport_xlsx: 'Өгөгдөл импортлох загвар (Excel)',
  templateFor_genericDataImport_csv: 'Өгөгдлийн ерөнхий загвар (CSV)',
  templateFor_genericDataImport_xlsx: 'Өгөгдлийн ерөнхий загвар (Excel)',
  validateFile: 'Файлыг баталгаажуулах',
  validateFileInfo:
    'Баталгаажуулах үйл явц нь файл нь шинж чанар бүрийн өгөгдлийн төрлийн дагуу хүчинтэй өгөгдөл агуулж байгаа эсэхийг шалгадаг.',
}
