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
      sampleRandomOnly:
        'Отображается случайная выборка из {{sampleSize}} элементов (всего {{totalCount}}); выбросов не обнаружено.',
      sampleWithOutliers:
        'Отображается {{sampleSize}} из {{totalCount}} элементов: {{outliersCount}} выбросов и случайная выборка из {{randomCount}} остальных элементов.',
      sampleOutliersOnly: 'Отображаются {{sampleSize}} наиболее экстремальных выбросов из {{totalCount}} элементов.',
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
    ai: {
      button: 'Спросить ИИ',
      buttonTitle: 'Сформировать запрос по описанию с помощью ИИ',
      title: 'Сформировать запрос с помощью ИИ',
      hint: 'Опишите данные, которые вы хотите увидеть; ИИ выберет сущность, атрибуты (или измерения и меры), фильтр и сортировку. Затем вы сможете проверить сформированный запрос и сохранить его в диспетчере запросов.',
      placeholder: 'например, количество деревьев по породам',
      generate: 'Сформировать',
      generating: 'Формирование…',
      replaceQueryConfirmMessage: 'Заменить текущий запрос сформированным?',
      suggestSummary: 'Предложить название и описание',
      suggestSummaryFailed: 'Не удалось предложить название и описание запроса: {{message}}',
      suggestSummaryTitle: 'Использовать ИИ, чтобы предложить имя, метку и описание запроса на основе текущего выбора',
      generatedSuccessfully:
        'Запрос сформирован: {{explanation}} Проверьте результат и сохраните запрос, если он вам нужен.',
    },
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
    showTotalAndPercentage: 'Показать итог и процент',
    total: 'Итого',
  },
  editSelectedRecord: 'Редактировать выбранную запись',
  filterAttributeTypes: 'Фильтр типов атрибутов',
  filterAttributes: 'Фильтр атрибутов',
  filterMessages: 'Фильтр сообщений',
  messageTypeFilter: {
    valueRequired: 'Требуемое значение',
    valueInvalid: 'Неверное значение',
    uniqueDuplicate: 'Дублирующее значение',
    customValidation: 'Пользовательская проверка',
    entityKeyDuplicate: 'Дублирующийся ключ сущности',
    recordKeyDuplicate: 'Дубликат ключа записи',
    nodesCount: 'Количество узлов',
  },
  filterRecords: {
    buttonTitle: 'Фильтр записей',
    expressionEditorHeader: 'Выражение для фильтрации записей',
  },
  invalidRecord: 'Неверная запись',
  nodeDefsSelector: {
    hide: 'Скрыть селектор определений узлов',
    show: 'Показать селектор определений узлов',
    nodeDefFrequency: `{{nodeDefLabel}} (частота)`,
    searchPlaceholder: 'Поиск переменной по названию',
  },
  records: {
    clone: 'Клонировать',
    confirmDeleteRecord: `Удалить запись "{{keyValues}}"?`,
    confirmDeleteSelectedRecord_one: `Удалить выбранную запись?`,
    confirmDeleteSelectedRecord_few: 'Удалить выбранные {{count}} записи?',
    confirmDeleteSelectedRecord_many: 'Удалить выбранные {{count}} записей?',
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
    exportSelectedRecordsArenaFormat: 'Экспортировать выбранные записи (формат Arena)',
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
  recordDeleted_few: '{{count}} записи успешно удалены!',
  recordDeleted_many: '{{count}} записей успешно удалено!',
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
      selectedRecord_few: 'Только выбранные {{count}} записи',
      selectedRecord_many: 'Только выбранные {{count}} записей',
      selectedRecord_other: 'Только выбранные {{count}} записей',
    },
    title: 'Экспорт данных',
  },
  dataMatrixExport: {
    intro: `Экспорт данных **{{entity}}** в виде таблицы:

- одна **строка** для каждого отдельного значения атрибутов строк (например, для каждого вида и яруса);
- один **столбец** для каждой записи, названный по её ключу ({{keys}});
- в ячейках — значение атрибута значения (например, покрытие).

Этот формат используют инструменты анализа растительности, такие как Turboveg, Juice и Synbiosys.`,
    layout: {
      dataMatrix: 'Матрица данных',
      info: 'Таблица: строки и столбцы, как в Обозревателе данных. Матрица данных: одна строка на вид (или другой атрибут) и один столбец на запись, как требуют инструменты анализа растительности, например Turboveg.',
      label: 'Экспортировать как',
      table: 'Таблица',
    },
    preview: 'Предпросмотр',
    previewRecord: '{{keys}} записи {{number}}',
    recordKeys: 'Ключевые атрибуты для названий столбцов записей',
    recordKeysInfo:
      'Каждая запись становится столбцом, названным по значениям выбранных ключевых атрибутов (например, только номер участка). По умолчанию используются ключевые атрибуты, выбранные в Обозревателе данных, или все, если ни один не выбран. Нужен хотя бы один.',
    recordsAll:
      'Экспортируются данные всех записей: задайте фильтр в Обозревателе данных, чтобы экспортировать только некоторые из них.',
    recordsFiltered: 'Экспортируются только данные, соответствующие текущему фильтру Обозревателя данных.',
    rowAttribute: 'Строки (имя атрибута таксона, например, вид)',
    rowAttributeInfo:
      'Каждое отдельное значение этого атрибута становится строкой таблицы. Атрибуты таксона экспортируются с научным названием, потому что все таксоны не из списка имеют один и тот же код.',
    secondRowAttribute: 'Второй атрибут строки, необязательно (например, ярус)',
    secondRowAttributeInfo:
      'Используйте, когда один и тот же вид может встречаться в записи несколько раз (например, в разных ярусах): каждая комбинация становится отдельной строкой.',
    valueAttribute: 'Значения (например, покрытие)',
    valueAttributeInfo:
      'Значение, отображаемое в ячейках. Атрибуты кода экспортируются с кодом, а не с меткой. Если строка встречается в записи несколько раз с разными значениями, ячейка содержит их все.',
  },
  dataVis: {
    errorLoadingData: 'Ошибка загрузки данных',
    noData: 'Этот запрос не вернул данных',
    noSelection:
      'Пожалуйста, сделайте выбор, используя левую панель, или выберите существующий запрос из "Управление запросами"',
  },
  viewSelectedRecord: 'Просмотреть выбранную запись',
  mapView: {
    layersControl: {
      areasOfInterest: 'Области интереса',
      baseLayers: 'Базовые слои',
      inputData: 'Входные данные',
      preloadedLayers: 'Предзагруженные слои',
      samplingPointData: 'Данные точек выборки',
    },
    layersPanel: {
      markers: '{{count}} маркеров',
      markers_one: '{{count}} маркер',
      markers_few: '{{count}} маркера',
      markers_many: '{{count}} маркеров',
      markers_other: '{{count}} маркеров',
    },
  },
}
