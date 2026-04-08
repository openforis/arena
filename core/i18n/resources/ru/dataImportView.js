export default {
  confirmDeleteAllRecords: 'Удалить все записи перед импортом?',
  confirmDeleteAllRecordsInCycle: 'Удалить все записи в цикле {{cycle}} перед импортом?',
  conflictResolutionStrategy: {
    label: 'Стратегия разрешения конфликтов',
    info: 'Что делать, если найдена та же запись (или запись с теми же ключевыми атрибутами)',
    skipExisting: 'Пропустить, если уже существует',
    overwriteIfUpdated: 'Перезаписать, если обновлено',
    merge: 'Объединить записи',
  },
  deleteAllRecordsBeforeImport: 'Удалить все записи перед импортом',
  downloadAllTemplates: 'Скачать все шаблоны',
  downloadAllTemplates_csv: 'Скачать все шаблоны (CSV)',
  downloadAllTemplates_xlsx: 'Скачать все шаблоны (Excel)',
  downloadTemplate: 'Скачать шаблон',
  downloadTemplate_csv: 'Скачать шаблон (CSV)',
  downloadTemplate_xlsx: 'Скачать шаблон (Excel)',
  errors: {
    rowNum: 'Строка #',
  },
  forceImportFromAnotherSurvey: 'Принудительный импорт из другого опроса',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Шаги импорта
1. Выберите целевую сущность
2. Скачайте шаблон
3. Заполните шаблон и сохраните его (если в CSV, используйте кодировку UTF-8)
4. Проверьте опции
5. Загрузите файл CSV/Excel
6. Проверьте файл
7. Начать импорт
`,
  importIntoCycle: 'Импортировать в цикл',
  importIntoMultipleEntityOrAttribute: 'Импортировать в множественную сущность или атрибут',
  importType: {
    label: 'Тип импорта',
    insertNewRecords: 'Вставить новые записи',
    updateExistingRecords: 'Обновить существующие записи',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Импорт данных Arena Mobile завершен:
{{summary}}`,
      importSummaryItem: {
        processed: 'обработано записей',
        insertedRecords: 'создано записей',
        updatedRecords: 'обновлено записей',
        skippedRecords: 'пропущено записей',
        missingFiles: 'отсутствующие файлы',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Импорт данных Collect завершен:
        - {{insertedRecords}} записей создано`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} строк обработано
        - {{insertedRecords}} записей создано
        - {{updatedRecords}} записей обновлено
        - {{entitiesCreated}} сущностей создано
        - {{entitiesDeleted}} сущностей удалено
        - {{updatedValues}} значений обновлено`,
      importCompleteSuccessfully: `## Импорт завершен:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} файлов вставлено
        - {{updatedFiles}} файлов обновлено
        - {{deletedFiles}} файлов удалено`,
      importCompleteWithErrors: `## Импорт завершен (с ошибками):
        - {{processed}} строк обработано`,
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Проверка завершена ({{errorsFoundMessage}})
        - {{processed}} строк обработано`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Проверка завершена без ошибок
        - {{processed}} строк обработано
        - {{insertedRecords}} записей будет создано
        - {{updatedRecords}} записей будет обновлено
        - {{entitiesCreated}} сущностей будет создано
        - {{entitiesDeleted}} сущностей будет удалено
        - {{updatedValues}} значений будет обновлено`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} файлов будет вставлено
        - {{updatedFiles}} файлов будет обновлено
        - {{deletedFiles}} файлов будет удалено`,
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Прервать при ошибках',
    preventAddingNewEntityData: 'Запретить добавление новых данных сущностей',
    preventUpdatingRecordsInAnalysis: 'Запретить обновление записей на этапе анализа',
    includeFiles: 'Включить файлы',
    deleteExistingEntities: `Удалить данные выбранной сущности во всех записях`,
  },
  optionsInfo: {
    deleteExistingEntities: `ВНИМАНИЕ: все сущности "{{nodeDefName}}"
и все их потомки во всех записях
будут удалены перед вставкой новых.`,
  },
  startImport: 'Начать импорт',
  startImportConfirm: `Нажав "ОК", вы начнете процесс импорта.
**Отменить изменения будет невозможно.**
Вы уверены, что хотите продолжить?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)
** (выбрана опция $t(dataImportView:options.deleteExistingEntities): существующие сущности будут удалены перед созданием новых) **
`,
  steps: {
    selectImportType: 'Выбрать тип импорта',
    selectCycle: 'Выбрать цикл',
    selectEntity: 'Выбрать сущность',
    selectFile: 'Выбрать файл',
    startImport: 'Начать импорт',
  },
  templateForImport: 'Шаблон для импорта',
  templateFor_specificDataImport_csv: 'Шаблон для импорта данных (CSV)',
  templateFor_specificDataImport_xlsx: 'Шаблон для импорта данных (Excel)',
  templateFor_genericDataImport_csv: 'Шаблон для импорта данных (общий, CSV)',
  templateFor_genericDataImport_xlsx: 'Шаблон для импорта данных (общий, Excel)',
  validateFile: 'Проверить файл',
  validateFileInfo:
    'Процесс проверки проверяет, что файл содержит действительные данные в соответствии с типом данных каждого атрибута.',
}
