export default {
  subPage: 'Подстраница',
  addChildTo: 'Добавить к {{nodeDefLabel}}',
  addChildToTitle: 'Добавить новый узел к {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Булево',
    code: 'Код',
    coordinate: 'Координата',
    date: 'Дата',
    decimal: 'Десятичное число',
    geo: 'Геопространственные данные',
    entity: 'Таблица или форма',
    file: 'Файл',
    integer: 'Целое число',
    taxon: 'Таксон',
    text: 'Текст',
    time: 'Время',
    formHeader: 'Заголовок формы',
  },
  clone: "Клонировать '{{nodeDefLabel}}'",
  compressFormItems: "Сжать элементы формы для '{{nodeDefLabel}}'",
  confirmUpdateDependentEnumeratedEntities:
    'Если вы продолжите, некоторые перечисленные сущности ({{entityDefs}}) будут перечислимы заново, удалив существующие в них значения (если таковые имеются).\nПродолжить?',
  convert: "Преобразовать '{{nodeDefLabel}}'",
  delete: "Удалить '{{nodeDefLabel}}'",
  edit: "Редактировать '{{nodeDefLabel}}'",
  schemaSummary_csv: 'Сводка схемы (CSV)',
  schemaSummary_xlsx: 'Сводка схемы (Excel)',
  hidePages: 'Скрыть страницы',
  showPages: 'Показать страницы',
  move: "Переместить '{{nodeDefLabel}}'",
  movePageUp: 'Переместить страницу вверх',
  movePageDown: 'Переместить страницу вниз',
  formEditActions: {
    preview: 'Предварительный просмотр',
  },
  formEntryActions: {
    confirmDemote: 'Вы уверены, что хотите понизить статус этой записи до {{name}}?',
    confirmPromote:
      'Вы уверены, что хотите **повысить статус этой записи до {{name}}**?\nВы больше не сможете ее редактировать',
    confirmPromoteWithErrors: '**Эта запись содержит ошибки**.\n$t(surveyForm:formEntryActions.confirmPromote)',
    confirmDelete: 'Вы уверены, что хотите удалить эту запись?\n\n$t(common.cantUndoWarning)',
    closePreview: 'Закрыть предварительный просмотр',
    demoteTo: 'Понизить до {{stepPrev}}',
    promoteTo: 'Повысить до {{stepNext}}',
    step: 'Шаг {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Столбцы',
    confirmConvert: 'Преобразовать атрибут "{{name}}" в "{{toType}}"?',
    confirmDelete:
      'Вы уверены, что хотите безвозвратно удалить это определение узла: {{ name }}?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: 'Введите код или метку',
    option: 'Вариант {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: '$t(common.true)',
        false: '$t(common.false)',
      },
      yesNo: {
        true: '$t(common.yes)',
        false: '$t(common.no)',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Координата',
    srs: 'СКР',
    x: 'X',
    y: 'Y',
    showOnMap: 'Показать на карте',
    accuracy: 'Точность',
    altitude: 'Высота',
    altitudeAccuracy: 'Точность высоты',
  },
  nodeDefGeo: {
    confirmDelete: 'Удалить это геопространственное значение?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Загружен недействительный файл GeoJSON',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Добавить новую {{name}}',
    confirmDelete: 'Вы уверены, что хотите удалить эту сущность?',
    select: 'Выберите {{name}}:',
    selectedEntity: 'Выбрано {{name}}:',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Научное название',
    vernacularName: 'Народное название',
    vernacularNameAlwaysIncludedIfSingle: 'Народное название всегда включается, если оно только одно',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Включено**: если эта опция включена и для таксона определено только одно народное название, это народное название будет автоматически сохранено в данных при выборе таксона.  
- **Отключено**: будет сохранён только код таксона и научное название, даже если у таксона есть только одно народное название.`,
    vernacularNameSelectionKept: 'Выбор народного названия сохранен',
    vernacularNameSelectionKeptInfo: `- **Включено**: когда таксон выбирается по народному (общепринятому) названию, конкретное народное название, использованное для поиска, также сохраняется в данных.  
- **Отключено**: будет сохранён только код таксона и научное название, независимо от того, какое народное название использовалось при поиске.  
В Arena Mobile:  
- **Включено**: каждое народное название отображается как отдельный элемент в списке результатов поиска.
- **Отключено**: все народные названия таксона группируются и отображаются рядом с таксоном (объединяются в одну запись). В результате список автодополнения содержит меньше элементов.`,
    visibleFields: 'Видимые поля',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Ошибка загрузки предварительного просмотра',
    fileUuid: 'UUID файла',
    fileName: 'Имя файла',
    locationInformationNotFound: 'Информация о местоположении не найдена в файле',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Все узлы',
    onlyPages: 'Только страницы',
  },
  step: {
    entry: 'Ввод данных',
    cleansing: 'Очистка данных',
    analysis: 'Анализ данных',
  },
  confirmNodeDelete: 'Вы уверены, что хотите удалить этот {{nodeDefType}} ({{nodeDefLabel}})?',
  exportLabels_csv: 'Экспортировать метки в CSV',
  exportLabels_xlsx: 'Экспортировать метки в Excel',
  importLabels: 'Импорт меток из Excel или CSV',
}
