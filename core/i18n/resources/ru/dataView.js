export default {
  charts: {
    downloadToPng: 'Скачать диаграмму в PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Пожалуйста, выберите одно измерение и одну меру для отображения диаграммы',
      selectAtLeast2NumericAttributes: 'Пожалуйста, выберите 2 числовых атрибута для отображения диаграммы',
      tooManyItemsToShowChart: `Слишком много элементов для отображения диаграммы;
ожидается максимум {{maxItems}} элементов.
Пожалуйста, уточните ваш запрос (например, добавьте фильтр), чтобы уменьшить количество элементов.
`,
    },
    type: {
      area: 'Диаграмма с областями',
      bar: 'Столбчатая диаграмма',
      line: 'Линейная диаграмма',
      pie: 'Круговая диаграмма',
      scatter: 'Точечная диаграмма',
    },
  },
  dataQuery: {
    deleteConfirmMessage: 'Удалить запрос "{{name}}"?',
    displayType: {
      chart: 'Диаграмма',
      table: 'Таблица',
    },
    manageQueries: 'Управление запросами',
    mode: {
      label: 'Режим:',
      aggregate: 'Агрегировать',
      raw: 'Исходные данные',
      rawEdit: 'Редактировать исходные данные',
    },
    replaceQueryConfirmMessage: 'Заменить текущий запрос выбранным?',
    showCodes: 'Показать коды',
  },
  editSelectedRecord: 'Редактировать выбранную запись',
  filterAttributeTypes: 'Фильтр типов атрибутов',
  filterRecords: {
    buttonTitle: 'Фильтр',
    expressionEditorHeader: 'Выражение для фильтрации записей',
  },
  invalidRecord: 'Неверная запись',
  nodeDefsSelector: {
    hide: 'Скрыть селектор определений узлов',
    show: 'Показать селектор определений узлов',
    nodeDefFrequency: `{{nodeDefLabel}} (частота)`,
  },
  records: {
    clone: 'Клонировать',
    confirmDeleteRecord: `Удалить запись "{{keyValues}}"?`,
    confirmDeleteSelectedRecord_one: `Удалить выбранную запись?`,
    confirmDeleteSelectedRecord_other: `Удалить выбранные {{count}} записей?`,
    confirmMergeSelectedRecords: `### Объединить выбранные записи в одну?

- запись "источник" будет объединена с записью "цель":
  - источник: [{{sourceRecordKeys}}], изменено {{sourceRecordModifiedDate}};
  - цель: [{{targetRecordKeys}}], изменено {{targetRecordModifiedDate}};

- предварительный просмотр результата будет показан до выполнения объединения;

- при подтверждении объединения, **запись-источник БУДЕТ УДАЛЕНА**`,
    confirmUpdateRecordsStep: `Переместить выбранные {{count}} записей из {{stepFrom}} в {{stepTo}}?`,
    confirmUpdateRecordOwner: `Изменить владельца выбранной записи на {{ownerName}}?`,
    confirmValidateAllRecords: `Перепроверить все записи?\n\nЭто может занять несколько минут.`,
    deleteRecord: 'Удалить запись',
    demoteAllRecordsFromAnalysis: 'Анализ -> Очистка',
    demoteAllRecordsFromCleansing: 'Очистка -> Ввод',
    editRecord: 'Редактировать запись',
    exportList: 'Экспортировать список',
    exportData: 'Экспортировать данные',
    exportDataSummary: 'Экспортировать сводку данных',
    exportRecordDocx: 'Экспорт записи (Word)',
    filterPlaceholder: 'Фильтровать по ключам или владельцу',
    merge: {
      label: 'Объединить',
      confirmLabel: 'Подтвердить объединение',
      confirmTooManyDifferencesMessage: `**Слишком много различий**.
Похоже, записи сильно отличаются друг от друга.
Многие атрибуты (~{{nodesUpdated}}) будут обновлены во время объединения.
Продолжить предварительный просмотр объединения?`,
      noChangesWillBeApplied: `Изменения не будут применены к целевой записи.
Объединение не может быть выполнено.`,
      performedSuccessfullyMessage: 'Объединение записей выполнено успешно!',
      previewTitle: 'Предварительный просмотр объединения (запись {{keyValues}})',
    },
    noRecordsAdded: 'Нет добавленных записей',
    noRecordsAddedForThisSearch: 'Записей не найдено',
    noSelectedRecordsInStep: 'Нет выбранных записей на шаге {{step}}',
    owner: 'Владелец',
    promoteAllRecordsToAnalysis: 'Очистка -> Анализ',
    promoteAllRecordsToCleansing: 'Ввод -> Очистка',
    step: 'Шаг',
    updateRecordsStep: 'Обновить шаг записей',
    validateAll: 'Проверить всё',
    viewRecord: 'Просмотреть запись',
  },
  recordsClone: {
    title: 'Клонирование записей',
    fromCycle: 'Из цикла',
    toCycle: 'В цикл',
    confirmClone: `Клонировать записи из цикла {{cycleFrom}} в цикл {{cycleTo}}?\n
(Будут клонированы только записи, которых еще нет в цикле {{cycleTo}})`,
    startCloning: 'Начать клонирование',
    cloneComplete: 'Клонирование завершено. {{recordsCloned}} записей клонировано из {{cycleFrom}} в {{cycleTo}}',
    error: {
      cycleToMissing: 'Пожалуйста, выберите "В цикл"',
      cycleToMustBeDifferentFromCycleFrom: '"В цикл" должен отличаться от "Из цикла"',
    },
    source: {
      label: 'Источник',
      allRecords: 'Все записи в цикле {{cycleFrom}}, которых еще нет в цикле {{cycleTo}}',
      selectedRecords: 'Только выбранные {{selectedRecordsCount}} записей',
    },
  },
  recordDeleted_one: `Запись успешно удалена!`,
  recordDeleted_other: `{{count}} записей успешно удалено!`,
  recordsSource: {
    label: 'Источник',
  },
  recordsUpdated: '{{count}} записей успешно обновлено!',
  rowNum: 'Строка #',
  selectedAttributes: 'Выбранные атрибуты:',
  selectedDimensions: 'Выбранные измерения',
  selectedMeasures: 'Выбранные меры',
  sortableItemsInfo: 'Перетащите, чтобы отсортировать',
  showValidationReport: 'Показать отчет о проверке',
  sort: 'Сортировать',
  dataExport: {
    source: {
      label: 'Источник',
      allRecords: 'Все записи',
      filteredRecords: 'Только отфильтрованные записи',
      selectedRecord: 'Только выбранная запись',
      selectedRecord_other: 'Только выбранные {{count}} записей',
    },
    title: 'Экспорт данных',
  },
  dataVis: {
    errorLoadingData: 'Ошибка загрузки данных',
    noData: 'Этот запрос не вернул данных',
    noSelection:
      'Пожалуйста, сделайте выбор, используя левую панель, или выберите существующий запрос из "Управление запросами"',
  },
  viewSelectedRecord: 'Просмотреть выбранную запись',
}
