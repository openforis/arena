import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Активно',
    add: 'Добавить',
    advancedFunctions: 'Расширенные функции',
    and: 'и',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Применить',
    aggregateFunction: 'Агрегатная функция',
    aggregateFunction_other: 'Агрегатные функции',
    attribute: 'Атрибут',
    attribute_other: 'Атрибуты',
    avg: 'Среднее',
    ascending: 'По возрастанию',
    areaBased: 'по площади',
    back: 'Назад',
    baseUnit: 'Базовая единица',
    cancel: 'Отмена',
    cancelConfirm: `**Есть несохраненные изменения**.

Вы хотите их игнорировать?`,
    cantUndoWarning: 'Эту операцию нельзя отменить',
    cantBeDeletedUsedItem: 'Этот {{item}} используется определениями узлов и не может быть удален',
    chain: 'Цепочка',
    chain_other: 'Цепочки',
    childrenEmpty: 'Определите хотя бы один дочерний элемент',
    clear: 'Очистить',
    clone: 'Клонировать',
    close: 'Закрыть',
    cloneFrom: 'Клонировать из',
    cnt: 'Количество',
    code: 'Код',
    collapse: 'Свернуть',
    confirm: 'Подтвердить',
    convert: 'Преобразовать',
    copy: 'Копировать',
    createdWith: 'Создано с помощью',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Цикл',
    cycle_other: 'Циклы',
    dateCreated: 'Дата создания',
    dateLastModified: 'Дата последнего изменения',
    delete: 'Удалить',
    deleted: 'Удалено!',
    descending: 'По убыванию',
    description: 'Описание',
    description_other: 'Описания',
    designerNotes: 'Заметки дизайнера',
    designerNotesInfo: `Заметки дизайнера будут видны только в дизайнере формы опроса и не будут видны в форме ввода данных.`,
    details: 'Подробности',
    dimension: 'Измерение',
    dimension_other: 'Измерения',
    done: 'Готово',
    download: 'Скачать',
    draft: 'Черновик',
    edit: 'Редактировать',
    elapsed: 'Прошедшее время',
    email: 'Электронная почта',
    email_other: 'Электронные письма',
    emailSentConfirmation: `Письмо на адрес {{email}} отправлено.

Пожалуйста, сообщите получателю, чтобы он проверил папку "Спам/Нежелательная почта".`,
    emailSentToSelfConfirmation: `Вы должны были получить письмо на адрес {{email}}.

Пожалуйста, проверьте папку "Спам/Нежелательная почта".`,
    empty: 'Пусто',
    entity: 'Сущность',
    error: 'Ошибка',
    error_other: 'Ошибки',
    error_few: 'Ошибки',
    error_many: 'Ошибки',
    errorFound: 'Найдена 1 ошибка',
    errorFound_other: 'Найдено {{count}} ошибок',
    errorMessage: 'Сообщение об ошибке',
    errorMessage_other: 'Сообщения об ошибках',
    expand: 'Развернуть',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Экспорт',
    exportAll: 'Экспортировать все',
    exportToCSV: 'Экспортировать в CSV',
    exportToExcel: 'Экспортировать в Excel',
    exportToExcelTooManyItems: 'Слишком много элементов для экспорта в Excel; пожалуйста, используйте экспорт CSV.',
    expression: 'Выражение',
    false: 'Ложь',
    file: 'Файл',
    file_other: 'Файлы',
    formContainsErrors: 'Форма содержит ошибки',
    formContainsErrorsCannotContinue: 'Форма содержит ошибки. Пожалуйста, исправьте их, прежде чем продолжить.',
    formContainsErrorsCannotSave: 'Форма содержит ошибки. Пожалуйста, исправьте их, прежде чем сохранить.',
    from: 'От',
    function: 'Функция',
    goToHomePage: 'Перейти на домашнюю страницу',
    goToSurveys: 'Перейти к опросам',
    group: 'Группа',
    help: 'Помощь',
    hide: 'Скрыть',
    id: 'id',
    import: 'Импорт',
    importFromExcelOrCSVFile: 'Импорт из Excel (.xlsx) или CSV файла',
    info: 'Информация',
    invalid: 'НЕВЕРНЫЙ',
    item: 'Элемент',
    item_other: 'Элементы',
    itemAlreadyAdded: 'Элемент уже добавлен',
    label: 'Метка',
    label_other: 'Метки',
    language: 'Язык',
    language_other: 'Языки',
    leavePageConfirmMessage: `На форме есть несохраненные изменения.

При подтверждении все изменения будут потеряны.
Вы хотите продолжить?`,
    local: 'Локально',
    loading: 'Загрузка...',
    lock: 'Заблокировать',
    unlock: 'Разблокировать',
    max: 'Максимум',
    med: 'Медиана',
    manage: 'Управление',
    message_other: 'Сообщения',
    measure: 'Измерение',
    measure_other: 'Измерения',
    measurePrevSteps: 'Измерения предыдущих шагов',
    measurePrevSteps_other: 'Измерения предыдущих шагов',
    measurePrevSteps_few: 'Измерения предыдущих шагов',
    measurePrevSteps_many: 'Измерения предыдущих шагов',
    min: 'Минимум',
    moveUp: 'Переместить вверх',
    moveDown: 'Переместить вниз',
    name: 'Имя',
    new: 'Новый',
    next: 'Далее',
    no: 'Нет',
    noItems: `$t(common.no) $t(common.item_other)`,
    notification: 'Уведомление',
    notification_other: 'Уведомления',
    notSpecified: '---Не указано---',
    orderBy: 'Сортировать по',
    of: 'из',
    ok: 'ОК',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Открыть в новом окне',
    options: 'Опции',
    owner: 'Владелец',
    path: 'Путь',
    pause: 'Приостановить',
    preview: 'Режим предварительного просмотра',
    previous: 'Предыдущий',
    publish: 'Опубликовать',
    publishConfirm: `#### Вы собираетесь опубликовать опрос {{survey}} ####

###### Процесс публикации *безвозвратно удалит* следующую информацию: ######
- Метки, связанные с удаленными языками.
- Записи, связанные с удаленными циклами.
- Данные, связанные с удаленными полями формы.

###### После публикации: ######
- Поля формы нельзя будет изменить с одиночного на множественное и наоборот.
- Коды элементов категории нельзя будет изменить.
- Элементы категории нельзя будет удалить.
- Коды таксономии нельзя будет изменить.
- Таксоны нельзя будет удалить.

**Вы уверены, что хотите продолжить?**`,
    publishRecordValuesUpdateConfirm: `#### Публикация {{survey}} обновит уже записанные данные ####

{{reasons}}

Эта операция может безвозвратно изменить или удалить уже введённые данные.

Чтобы опубликовать без обновления существующих данных, отметьте «Пропустить обновление данных» ниже (не рекомендуется).`,
    publishRecordValuesUpdateConfirmHeader: 'Данные существующих записей будут обновлены',
    publishRecordValuesUpdateConfirmOk: 'Опубликовать и обновить данные',
    publishRecordValuesUpdateConfirmInputLabel:
      'Введите название анкеты "{{strongConfirmRequiredText}}" для подтверждения',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Следующие атрибуты будут изменены, и их значения в существующих записях будут автоматически пересчитаны: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Следующие атрибуты используют дополнительное свойство категории или таксономии, которое изменилось, из-за чего их значение будет пересчитано в существующих записях: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Пропустить обновление данных',
    publishSkipDataUpdateConfirmOk: 'Пропустить обновление данных и опубликовать',
    publishSkipDataUpdateImplications: 'Пропуск обновления данных означает следующее:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Существующие записи могут перестать соответствовать новому определению анкеты',
    publishSkipDataUpdateImplicationStaleValues:
      'Затронутые значения не будут пересчитаны, пока не будут введены заново вручную',
    publishSkipDataUpdateImplicationChains:
      'Цепочки обработки, использующие эти атрибуты, могут выдавать устаревшие результаты',
    raiseTicketInSupportForum: `В случае проблем, пожалуйста, создайте заявку с тегом 'arena' на нашем <b>Форуме поддержки</b>: $t(links.supportForum)`,
    record: 'Запись',
    record_other: 'Записи',
    remaining: 'Оставшееся время',
    remote: 'Удаленно',
    required: 'Обязательно',
    requiredField: 'обязательное поле',
    reset: 'Сброс',
    refresh: 'Обновить',
    pressRefreshToReloadPage: 'Нажмите «Обновить», чтобы перезагрузить страницу.',
    resume: 'Возобновить',
    retry: 'Повторить',
    role: 'Роль',
    save: 'Сохранить',
    saveAndBack: 'Сохранить и вернуться',
    saved: 'Сохранено!',
    samplingPolygon: 'Полигон выборки',
    show: 'Показать',
    select: 'Выбрать',
    selectOne: 'Выберите один...',
    selectAll: 'Выбрать все',
    selected: 'Выбрано',
    showLabels: 'Показать метки',
    showLabelsAndNames: 'Показать метки и имена',
    showNames: 'Показать имена',
    sort: 'Сортировка',
    sortAsc: 'Сортировать по возрастанию',
    sortDesc: 'Сортировать по убыванию',
    sortNone: 'Убрать сортировку',
    srs: 'SRS',
    status: 'Статус',
    sum: 'Сумма',
    test: 'Тест',
    to: 'Кому',
    totalItems: 'Всего элементов',
    true: 'Истина',
    trySplittingFileIntoSmallerChunks: 'Попробуйте разбить файл на меньшие части.',
    type: 'Тип',
    undefinedName: 'Неопределенное имя',
    unique: 'Уникальный',
    upload: 'Загрузить',
    uploadErrorConfirm: {
      message: `Ошибка при загрузке файла: {{error}}.\n
Попробовать снова?`,
    },
    uploadFileChangedError: 'Похоже, что выбранный файл был изменен после выбора. Пожалуйста, выберите его снова.',
    uploadingFile: 'Загрузка файла ({{progressPercent}}%)',
    value: 'Значение',
    view: 'Просмотр',
    warning: 'Предупреждение',
    warning_other: 'Предупреждения',
    yes: 'Да',
    date: {
      aMomentAgo: 'Несколько секунд назад',
      hour: 'час',
      hour_other: 'часов',
      day: 'день',
      day_other: 'дней',
      minute: 'минута',
      minute_other: 'минут',
      week: 'неделя',
      week_other: 'недель',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} }) назад`,
    },
    paginator: {
      firstPage: 'Первая страница',
      goToPage: 'Перейти на страницу',
      itemsPerPage: 'Элементов на страницу',
      lastPage: 'Последняя страница',
      nextPage: 'Следующая страница',
      page: 'Страница',
      previousPage: 'Предыдущая страница',
    },
    table: {
      visibleColumns: 'Видимые столбцы',
    },
  },
  confirm: {
    strongConfirmInputLabel: 'Для подтверждения введите следующий текст: **{{strongConfirmRequiredText}}**',
  },
  dropzone: {
    acceptedFilesMessage: '(Будут приняты только файлы {{acceptedExtensions}} с максимальным размером {{maxSize}})',
    error: {
      fileNotValid: 'Выбранный файл недействителен',
      fileTooBig: 'Выбранный файл слишком большой',
      invalidFileExtension: 'Недопустимое расширение файла: {{extension}}',
    },
    message: 'Перетащите файл сюда или нажмите, чтобы выбрать его',
    selectedFile: 'Выбранный файл',
    selectedFile_other: 'Выбранные файлы',
  },
  error: {
    pageNotFound: 'Страница не найдена',
  },
  geo: {
    area: 'Площадь',
    vertices: 'Вершины',
    perimeter: 'Периметр',
  },
  files: {
    header: 'Файлы',
    missing: ' Отсутствующие файлы: {{count}}',
    totalSize: 'Общий размер: {{size}}',
    fileName: 'Имя файла',
    fileSize: 'Размер файла',
  },
  sidebar: {
    logout: 'Выйти',
  },
  header: {
    theme: {
      label: 'Тема',
      light: 'Светлая',
      dark: 'Тёмная',
      system: 'Системная',
    },
    myProfile: 'Мой профиль',
    qrCodeLoginDialog: {
      title: 'Вход в Arena Mobile с помощью QR-кода',
      instructions: `1. Откройте приложение **Arena Mobile** на вашем мобильном устройстве
2. Перейдите в меню **Настройки**
3. Выберите **Подключение к серверу**
4. Нажмите **Войти с помощью QR-кода**
5. Отсканируйте QR-код, отображаемый на этом экране`,
      success: 'Вход выполнен успешно!',
      error: 'Ошибка при генерации QR-кода: {{error}}',
    },
  },
  nodeDefsTypes: {
    integer: 'Целое число',
    decimal: 'Десятичное число',
    text: 'Текст',
    date: 'Дата',
    time: 'Время',
    boolean: 'Логическое',
    code: 'Код',
    coordinate: 'Координата',
    geo: 'Геопространственные данные',
    taxon: 'Таксон',
    file: 'Файл',
    entity: 'Сущность',
  },

  // ====== App modules and views
  appModules: {
    home: 'Главная',
    landing: 'Приветствие',
    dashboard: 'Панель управления',
    surveyNew: 'Новый опрос',
    surveys: 'Опросы',
    templateNew: 'Новый шаблон',
    templates: 'Шаблоны',
    usersAccessRequest: 'Запросы на доступ пользователей',
    collectImportReport: 'Отчет об импорте Collect',

    surveyInfo: 'Информация об опросе',
    designer: 'Опрос',
    formDesigner: 'Дизайнер форм',
    surveyHierarchy: 'Иерархия',
    surveyDependencyTree: 'Дерево зависимостей',
    surveyCompare: 'Сравнить / обновить из файла',
    category: 'Категория',
    categories: 'Категории',
    nodeDef: 'Определение узла',
    taxonomy: 'Таксономия',
    taxonomies: 'Таксономии',

    data: 'Данные',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Отчет о проверке записей',
    explorer: 'Проводник',
    map: 'Карта',
    charts: 'Диаграммы',
    export: 'Экспорт данных',
    import: 'Импорт данных',
    validationReport: 'Отчет о проверке',

    users: 'Пользователи',
    user: 'Профиль пользователя',
    userPasswordChange: 'Сменить пароль',
    userInvite: 'Пригласить пользователя',
    userNew: 'Новый пользователь',
    usersSurvey: 'Список пользователей',
    userGroup: 'Группа пользователей',
    userGroup_other: 'Группы пользователей',
    userGroupNew: 'Новая группа пользователей',
    usersList: 'Список пользователей (все)',
    user2FADevice: 'Устройство 2FA',
    user2FADevice_other: 'Устройства 2FA',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Анализ',
    chain: 'Цепочка',
    chain_other: 'Цепочки',
    virtualEntity: 'Виртуальная сущность',
    entities: 'Виртуальные сущности',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Экземпляры',
    message: 'Сообщение',
    message_other: '$t(common.message_other)',

    systemAdmin: 'Администрирование системы',
    jobMonitor: 'Монитор заданий',
    systemLogs: 'Системные журналы',

    help: 'Помощь',
    about: 'О программе',
    changelog: 'Журнал изменений',
    whatsNew: 'Что нового',
    disclaimer: 'Отказ от ответственности',
    userManual: 'Руководство пользователя',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Этот раздел доступен только после публикации опроса',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Типы зависимостей',
    dependencyTypes: {
      applicable: 'Применимость',
      defaultValues: 'Значение по умолчанию',
      editable: 'Редактируемый',
      fileName: 'Имя файла',
      itemsFilter: 'Фильтр элементов',
      maxCount: 'Макс. количество',
      minCount: 'Мин. количество',
      parentCode: 'Код родителя',
      validations: 'Проверки',
      visible: 'Видимый',
    },
    selectAtLeastOneDependencyType: 'Выберите хотя бы один тип зависимости',
    noDependenciesToDisplay: 'Нет зависимостей для отображения',
  },
  designerView: {
    formPreview: 'Предварительный просмотр формы',
  },
  recordView: {
    justDeleted: 'Эта запись только что была удалена',
    sessionExpired: 'Сессия записи истекла',
    errorLoadingRecord: 'Ошибка загрузки записи: {{details}}',
    recordEditModalTitle: 'Запись: {{keyValues}}',
    recordNotFound: 'Запись не найдена',
    keyAttributeEditing: {
      lock: 'Заблокировать редактирование ключевого атрибута',
      unlock: 'Разрешить редактирование ключевого атрибута',
    },
    qualifierAttributeEditing: {
      lock: 'Заблокировать редактирование атрибута-квалификатора',
      unlock: 'Разрешить редактирование атрибута-квалификатора',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Удалить эту пользовательскую агрегатную функцию?',
      sqlExpression: 'SQL выражение',
    },
    editRecord: 'Редактировать запись',
  },
  mapView: {
    changeMarkerColor: 'Изменить цвет маркера',
    createRecord: 'Создать новую запись',
    editRecord: 'Редактировать запись',
    elevation: 'Высота (м)',
    location: 'Местоположение',
    locationEditInfo: 'Дважды щелкните на карте или перетащите маркер, чтобы обновить местоположение',
    locationNotValidOrOutOfRange: 'Местоположение недействительно или вне диапазона зоны UTM',
    locationUpdated: 'Местоположение обновлено',
    options: {
      showLocationMarkers: 'Показать маркеры местоположения',
      showMarkersLabels: `Показать метки маркеров`,
      showSamplingPolygon: `Полигон выборки`,
      showControlPoints: `Контрольные точки`,
      showPlotReferencePoint: `Точка привязки участка`,
      showUtmGrid: 'Показать сетку UTM',
    },
    rulerTooltip: `Нажмите кнопку, чтобы начать измерение расстояний.
- щелкните несколько раз, чтобы измерить путь
- дважды щелкните или нажмите клавишу ESC, чтобы завершить измерение
- нажмите кнопку еще раз, чтобы скрыть измерения`,
    samplingPointDataLayerName: 'Данные точки выборки - уровень {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (загрузка...)',
    samplingPointItemPopup: {
      title: 'Элемент точки выборки',
      levelCode: 'Код уровня {{level}}',
    },
    selectedPeriod: 'Выбранный период',
  },
  samplingPolygonOptions: {
    circle: 'Круг',
    controlPointOffsetEast: 'Смещение опорной точки на восток (м)',
    controlPointOffsetNorth: 'Смещение опорной точки на север (м)',
    lengthLatitude: 'Длина широты (м)',
    lengthLongitude: 'Длина долготы (м)',
    numberOfControlPoints: 'Количество контрольных точек',
    numberOfPointsEast: 'Количество контрольных точек на восток',
    numberOfPointsNorth: 'Количество контрольных точек на север',
    offsetEast: 'Смещение на восток (м)',
    offsetNorth: 'Смещение на север (м)',
    radius: 'Радиус (м)',
    rectangle: 'Прямоугольник',
    samplingPolygon: 'Полигон выборки',
    shape: 'Форма',
  },
  kmlUploader: {
    opacity: 'непрозрачность',
    selectFile: 'Выбрать файл',
    title: 'Параметры KML/KMZ/Shapefile',
  },
  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Выберите период для сравнения',
    falseColor: 'Псевдоцвет',
  },
  surveysView: {
    chains: 'Цепочки',
    confirmUpdateSurveyOwner: `Изменить владельца опроса "{{surveyName}}" на "{{ownerName}}"?`,
    cycles: 'Циклы',
    datePublished: 'Дата публикации',
    editUserExtraProps: 'Редактировать дополнительные свойства пользователя',
    editUserExtraPropsForSurvey: 'Редактировать дополнительные свойства пользователя для опроса "{{surveyName}}"',
    filter: 'Фильтр',
    filterPlaceholder: 'Фильтровать по имени, метке или владельцу',
    languages: 'Языки',
    nodes: 'Узлы',
    noSurveysMatchingFilter: 'Нет опросов, соответствующих указанному фильтру',
    onlyOwn: 'Только собственные опросы',
    records: 'Записи',
    recordsCreatedWithMoreApps: 'Записи, созданные с использованием нескольких приложений:',
    status: {
      published: 'Опубликован',
      draft: 'Черновик',
      'published-draft': 'Опубликован/Черновик',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Принято',
      CREATED: 'В ожидании',
    },
    acceptRequest: {
      accept: 'Принять',
      acceptRequestAndCreateSurvey: 'Принять запрос и создать опрос',
      confirmAcceptRequestAndCreateSurvey:
        'Принять запрос на доступ для **{{email}}** как **{{role}}** и создать новый опрос **{{surveyName}}**?',
      error: 'Ошибка при принятии запроса на доступ: {{error}}',
      requestAcceptedSuccessfully: 'Запрос на доступ успешно принят. $t(common.emailSentConfirmation)',
      surveyLabel: 'Метка опроса',
      surveyLabelInitial: '(Измените название и метку опроса при необходимости)',
      surveyName: 'Название опроса',
      template: 'Шаблон',
    },
  },
  userView: {
    scale: 'Масштаб',
    rotate: 'Повернуть',
    dragAndDrop: 'Перетащите изображение сюда или',
    upload: 'нажмите здесь, чтобы загрузить',
    remove: 'Удалить фото профиля?',
    sendNewInvitation: 'Отправить новое приглашение',
    removeFromSurvey: 'Удалить из опроса',
    confirmRemove: 'Вы уверены, что хотите лишить пользователя {{user}} доступа к опросу {{survey}}?',
    removeUserConfirmation: 'Пользователь {{user}} удален из опроса {{survey}}',
    maxSurveysUserCanCreate: 'Максимальное количество опросов, которые может создать пользователь',
    preferredUILanguage: {
      label: 'Предпочитаемый язык интерфейса',
      auto: 'Автоматически определено ({{detectedLanguage}})',
    },
    newPassword: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    manageTwoFactorDevices: {
      label: 'Управление 2FA',
      title: 'Управление устройствами двухфакторной аутентификации',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Смена пароля для пользователя: {{user}}',
    oldPassword: 'Старый пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите новый пароль',
    changePassword: 'Сменить пароль',
    passwordChangedSuccessfully: 'Пароль успешно изменен!',
    notAuthorizedToChangePasswordOfAnotherUser: 'У вас нет прав на изменение пароля другого пользователя',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Пригласить пользователя {{email}} в качестве системного администратора?',
    confirmInviteSystemAdmin_other: 'Пригласить пользователей {{email}} в качестве системных администраторов?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}} адресов были пропущены (они уже были приглашены в этот опрос ранее): {{skippedEmails}}`,
    invalidEmailsWarning:
      'Адрес электронной почты {{emails}} недоступен и, возможно, не существует. Он оставлен в списке ниже: исправьте или удалите его и повторите приглашение.',
    invalidEmailsWarning_few:
      'Адреса электронной почты {{emails}} недоступны и, возможно, не существуют. Они оставлены в списке ниже: исправьте или удалите их и повторите приглашение.',
    invalidEmailsWarning_many:
      'Адреса электронной почты {{emails}} недоступны и, возможно, не существуют. Они оставлены в списке ниже: исправьте или удалите их и повторите приглашение.',
    invalidEmailsWarning_other:
      'Адреса электронной почты {{emails}} недоступны и, возможно, не существуют. Они оставлены в списке ниже: исправьте или удалите их и повторите приглашение.',
    groupPermissions: {
      label: 'Разрешения',
      systemAdmin: `
        <li>Полные права доступа к системе</li>`,
      surveyManager: `
        <li>Опросы:
          <ul>
            <li>создавать</li>
            <li>клонировать</li>
            <li>редактировать собственные опросы</li>
            <li>удалять собственные опросы</li>
          </ul>
        </li>
        <li>Пользователи:
          <ul>
            <li>приглашать пользователей в собственные опросы</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Опросы:
          <ul>
            <li>клонировать</li>
            <li>редактировать собственные опросы</li>
            <li>удалять собственные опросы</li>
          </ul>
        </li>
        <li>Пользователи:
          <ul>
            <li>приглашать пользователей в собственные опросы</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Опросы:
          <ul>
            <li>редактировать собственные опросы</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Данные:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>доступ к инструменту "Карта"</li>
          </ul>
        </li>
        <li>Анализ:
          <ul>
            <li>полные права доступа ко всем инструментам</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Данные:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>доступ к инструментам проверки данных</li>
        <li>отправлять записи на фазу "Анализ"</li>`,
      dataEditor: `
        <li>Данные:
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>добавлять новые записи (собственные опросы)</li>
        <li>редактировать существующие записи (собственные опросы)</li>
        <li>отправлять записи на фазу "Очистка"</li>`,
    },
    messageOptional: 'Сообщение (необязательно)',
    messageInfo: `Сообщение появится в электронном письме, отправленном пользователю.
Это может быть простой текст или язык Markdown (https://www.markdownguide.org).`,
    sendInvitation: 'Отправить приглашение',
    surveyNotPublishedWarning: `**Внимание**: опрос не опубликован.
      Пользователи могут быть приглашены только с ролями ***$t(auth:authGroups.systemAdmin.label)*** и ***$t(auth:authGroups.surveyAdmin.label)***.
      Если вы хотите пригласить пользователей с другими ролями, вы должны сначала опубликовать опрос.`,
    typeEmail: 'Введите адрес электронной почты, затем нажмите кнопку Добавить',
  },
  user: {
    mapApiKeys: {
      title: 'Ключи API карты',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Этот ключ API действителен',
      keyIsNotCorrect: 'Этот ключ API НЕ действителен',
    },
    title: 'Звание',
    titleValues: {
      mr: 'Г-н',
      ms: 'Г-жа',
      preferNotToSay: 'Предпочитаю не говорить',
    },
  },
  chainView: {
    baseUnit: {
      confirmDelete: 'При удалении базовой единицы вы снимите все отметки "переменная на основе площади". Продолжить?',
    },
    downloadSummaryJSON: 'Скачать сводку (JSON)',
    mauFile: {
      upload: 'Загрузить MAU.zip',
      download: 'Скачать MAU.zip',
      delete: 'Удалить MAU.zip',
      confirmCycleAssociation: 'Файл MAU.zip будет связан с текущим циклом ({{cycle}}). Продолжить?',
      confirmReplace: 'Файл MAU.zip уже загружен для этой цепочки. Заменить его?',
      confirmDelete: 'Удалить файл MAU.zip, загруженный для этой цепочки?',
      uploadComplete: 'Файл MAU.zip успешно загружен',
      deleteComplete: 'Файл MAU.zip удалён',
      invalidFileExtension: 'Пожалуйста, выберите файл .zip',
    },
    phase1Category: 'Категория 1-й фазы',
    phase1CategoryInfo: 'Выберите категорию, содержащую выборки 1-й фазы.',
    phase2JoinEntity: {
      label: 'Объект соединения (2-я фаза)',
      info: 'Объект, используемый для соединения базовой единицы с категорией 1-й фазы: сама базовая единица или одна из её родительских сущностей.',
    },
    phase2AsSamplingPointData: {
      label: 'Соединять с использованием связи Sampling Point Data',
      info: 'Ключ(и) объекта 2-й фазы считываются из таблицы Sampling Point Data, той же таблицы, что используется для 1-й фазы.',
    },
    phase1JoinAttribute: {
      label: 'Атрибут соединения (1-я фаза)',
      info: 'Выберите столбец таблицы $t(chainView.phase1Category) (дополнительное свойство или "code"), используемый для соединения с объектом соединения 2-й фазы.',
    },
    phase2JoinAttribute: {
      label: 'Атрибут соединения (2-я фаза)',
      info: 'Выберите атрибут (объекта 2-й фазы) для соединения с таблицей 1-й фазы; его значение сопоставляется с предыдущим атрибутом соединения 1-й фазы.',
    },
    formLabel: 'Метка цепочки обработки',
    basic: 'Основное',
    records: 'Записи',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Отправить только данные этапа анализа в RStudio',
    submitOnlySelectedRecordsIntoR: 'Отправить только выбранные записи в RStudio',
    includeEntitiesWithoutData: 'Включить сущности без данных',
    cannotStartRStudio: {
      common: 'Невозможно запустить RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): нет записей для отправки',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): сначала опубликуйте опрос',
    },
    nonResponseBiasCorrection: 'Коррекция смещения из-за неответной реакции',
    nonResponseBiasCorrectionInfo: `Чтобы реализовать метод корректировки по весовым классам, добавьте 'design_psu' и 'design_ssu' в таблицу категорий страты как дополнительные числовые свойства.`,
    pValue: 'P-значение',
    resultsBackFromRStudio: 'Результаты получены из RStudio',
    resultsBackFromRStudioInfo: `Включите эту опцию, если атрибуты результатов, вычисленные в RStudio, должны быть импортированы обратно на сервер Arena.
Этот процесс может быть медленным.`,
    samplingDesign: 'Дизайн выборки',
    samplingDesignDetails: 'Детали дизайна выборки',
    samplingStrategyLabel: 'Стратегия выборки',
    samplingStrategy: {
      simpleRandom: 'Простая случайная выборка',
      systematic: 'Систематическая выборка',
      stratifiedRandom: 'Стратифицированная случайная выборка',
      stratifiedSystematic: 'Стратифицированная систематическая выборка',
      twoPhase: 'Двухфазная выборка',
    },
    statisticalAnalysis: {
      header: 'Статистический анализ',
      entityToReport: 'Сущность для отчета',
      entityWithoutData: 'Сущность {{name}} не содержит данных',
      filter: 'Фильтр (R-скрипт)',
      reportingMethod: 'Метод отчетности',
      reportingMethods: {
        dimensionsCombined: 'Комбинация измерений',
        dimensionsSeparate: 'Измерения отдельно',
      },
      reportingArea: 'Общая площадь отчетности (га) (Необязательно)',
      reportingAreaInfo: `При стратифицированной выборке укажите площади страт в таблице категорий атрибута страты (название столбца 'area')`,
    },
    stratumAttribute: 'Атрибут страты',
    stratumAttributeInfo: 'Выберите переменную, используемую для стратификации выборки.',
    stratumAttribute2ndPhaseInfo: `Выберите переменную, используемую для подразделения выборки 1-й фазы на страты перед формированием окончательной детальной подвыборки. Показываются только те атрибуты, имя которых также присутствует как столбец категории 1-й фазы.`,
    postStratificationAttribute: 'Атрибут послестратификации',
    areaWeightingMethod: 'Метод взвешивания по площади',
    clusteringEntity: 'Сущность кластеризации',
    clusteringEntityInfo: `Сущность, определяющая первичные единицы выборки. Примечание: используется исключительно для кластерного анализа в рамках пакета R survey.`,
    clusteringOnlyVariances: 'Кластеризация только для дисперсий',
    errorNoLabel: 'Цепочка должна иметь допустимую метку',
    dateExecuted: 'Дата выполнения',
    deleteChain: 'Удалить цепочку',
    deleteConfirm: `Удалить эту цепочку обработки?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Цепочка обработки удалена',
    cloneFromAnotherSurvey: 'Клонировать из другого опроса',
    cloneFromAnotherSurveyDialog: {
      title: 'Клонировать цепочку из другого опроса',
      sourceSurvey: 'Исходный опрос',
      sourceChain: 'Исходная цепочка',
      entityCheck: 'Совместимость сущностей',
      entityMissing: 'отсутствует в целевом опросе',
      skipMissingEntities: 'Пропустить атрибуты анализа для сущностей, отсутствующих в целевом опросе',
      noAnalysisAttributes: 'Эта цепочка не имеет атрибутов анализа',
      cloneComplete: 'Цепочка успешно клонирована',
      missingEntities: 'Невозможно клонировать: следующие сущности не существуют в целевом опросе: {{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles: `Определение узла "{{label}}" не может быть выбрано, поскольку оно не принадлежит всем циклам цепочки обработки`,
    cannotSelectCycle: 'Этот цикл не может быть выбран, так как некоторые определения узлов не принадлежат этому циклу',
    copyRStudioCode: `#### Вы собираетесь открыть RStudio Server ####

##### Нажмите кнопку ОК, и эти команды будут скопированы в буфер обмена. #####

###### RStudio Server будет запущен; как только консоль RStudio станет активной, вставьте и запустите следующие строки для импорта кода цепочки: ######

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Цепочка обработки в RStudio ####

###### Нажмите кнопку ОК, и эти команды будут скопированы в буфер обмена. ######

###### Запустите RStudio на вашей машине (у вас должен быть установлен пакет 'rstudioapi'). ######

###### Как только консоль RStudio станет активной, вставьте и запустите следующие строки для импорта кода цепочки: ######


{{rStudioCode}}

`,
    entities: {
      new: 'Виртуальная сущность',
    },
    reportingDataCategory: 'Имя категории таблицы отчетных данных',
    reportingDataAttribute: 'Атрибут для {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Таблица отчетных данных и соединения с атрибутами',
    showSamplingAttributes: 'Показать атрибуты выборки',
  },
  instancesView: {
    title: 'Экземпляры',
    terminate: 'Завершить',
  },
  chain: {
    quantitative: 'Количественный',
    categorical: 'Категориальный',
    addQuantitative: 'Добавить количественный атрибут',
    addCategorical: 'Добавить категориальный атрибут',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'сущность и все связанные результирующие переменные будут исключены из скриптов RStudio',
    entityWithoutData: 'Сущность {{name}} не содержит данных; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle: 'Сущность {{name}} недоступна в текущем цикле; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Недействительный или просроченный токен',
    },
  },
  itemsTable: {
    unused: 'Неиспользуемые',
    noItemsAdded: 'Нет добавленных элементов',
  },
  expression: {
    functionHasTooFewArguments: 'Функция {{fnName}} требует как минимум {{minArity}} аргументов (получено {{numArgs}})',
    functionHasTooManyArguments: 'Функция {{fnName}} принимает не более {{maxArity}} аргументов (получено {{numArgs}})',
    identifierNotFound: 'Атрибут или сущность "{{name}}" не найдены',
    invalid: 'Неверное выражение: {{details}}',
    invalidAttributeValuePropertyName: 'Неверное имя свойства значения атрибута: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Неверное имя дополнительного свойства категории: {{propName}}',
    invalidCategotyName: 'Неверное имя категории: {{name}}',
    invalidTaxonomyExtraProp: 'Неверное имя дополнительного свойства таксономии: {{propName}}',
    invalidTaxonomyName: 'Неверное имя таксономии: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Неверный код языка местного названия таксона: {{vernacularLangCode}}',
    missingFunctionParameters: 'Отсутствуют параметры функции',
    undefinedFunction: 'Неопределенная функция: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
О программе
========

$t(common.appNameFull)
--------
 
 * Разработано: $t(links.openforis)
 * Версия: {{version}}
 * Веб-сайт: $t(links.openforisArenaWebsite)
 * Видеоуроки Arena в Академии онлайн-обучения ФАО: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Видеоуроки Arena на YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Форум поддержки: $t(links.supportForum)
 * Arena на GitHub: $t(links.arenaInGitHub)
 * Скрипты Arena R на GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Язык(и)',
  },
  taxonomy: {
    header: 'Таксономия',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Удалить таксономию {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Клонировать таксономию из другого опроса',
      sourceSurvey: 'Исходный опрос',
      sourceTaxonomy: 'Исходная таксономия',
      loadingSurveys: 'Загрузка опросов...',
      noSurveysAvailable: 'Нет доступных опросов',
      selectSurveyFirst: 'Сначала выберите опрос',
      loadingTaxonomies: 'Загрузка таксономий...',
      noTaxonomiesAvailable: 'В выбранном опросе нет доступных таксономий',
    },
    edit: {
      taxonomyListName: 'Название списка таксономии',
      taxaNotImported: 'Таксоны не импортированы',
      family: 'Семейство',
      genus: 'Род',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Синоним / Латинское название',
      extraPropsNotDefined: 'Дополнительные свойства не определены для этой таксономии',
      importMissingPublishedTaxa:
        '{{count}} опубликованный таксон/таксона не найден(ы) в импортируемом файле и оставлен(ы) без изменений. Коды: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (ещё {{extra}})',
    },
    taxaCount: 'Количество таксонов',
    vernacularNameLabel: 'Метка местного названия',
  },
  categoryList: {
    batchImport: 'Пакетный импорт категорий (из ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} категорий успешно импортировано!
{{insertedCategories}} новых
{{updatedCategories}} обновленных`,
    cloneFromAnotherSurvey: {
      title: 'Клонировать категорию из другого опроса',
      sourceSurvey: 'Исходный опрос',
      sourceCategory: 'Исходная категория',
      loadingSurveys: 'Загрузка опросов...',
      noSurveysAvailable: 'Нет доступных опросов',
      selectSurveyFirst: 'Сначала выберите опрос',
      loadingCategories: 'Загрузка категорий...',
      noCategoriesAvailable: 'В выбранном опросе нет доступных категорий',
    },
    itemsCount: 'Количество элементов',
    structure: 'Структура',
    types: {
      flat: 'Плоская',
      hierarchical: 'Иерархическая',
      reportingData: 'Отчетные данные',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Данные точек выборки',
    },
  },
  categoryEdit: {
    header: 'Категория',
    addLevel: 'Добавить уровень',
    categoryName: 'Название категории',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    confirmDelete: 'Удалить категорию {{categoryName}}?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'Категория **пуста** и будет удалена. Продолжить?',
    confirmDeleteLevel: `Удалить уровень категории "{{levelName}}" со всеми элементами?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Удалить элемент?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Удалить элемент со всеми дочерними элементами?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Преобразовать в отчетные данные',
      confirmMessage: `Преобразовать эту категорию в категорию отчетных данных?

Уровни будут переименованы в level_1, level_2... level_N, и к элементам будет добавлено дополнительное свойство 'area'.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Преобразовать эту категорию отчетных данных в простую категорию?`,
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Преобразовать в данные точек выборки',
      confirmMessage: `Преобразовать эту категорию в категорию данных точек выборки?

Категория будет переименована в '${samplingPointDataCategoryName}', и к элементам будет добавлено дополнительное свойство '${locationItemExtraDefName}'.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Преобразовать в категорию GeoPackage',
      confirmMessage: `Преобразовать эту категорию в категорию GeoPackage?

К элементам будет добавлено дополнительное свойство '${locationItemExtraDefName}'.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Преобразовать в простую категорию',
      confirmMessage: `Преобразовать эту категорию GeoPackage в простую категорию?

Дополнительное свойство '${locationItemExtraDefName}' будет разблокировано — его можно будет переименовать, изменить его тип или удалить, как любое другое дополнительное свойство. Данные при этом не пострадают.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Преобразовать в простую категорию',
      confirmMessage: `Преобразовать эту категорию данных точек выборки в простую категорию?

Имя категории будет очищено (вам нужно будет присвоить ей новое имя), а дополнительное свойство '${locationItemExtraDefName}' будет разблокировано — его можно будет переименовать, изменить его тип или удалить, как любое другое дополнительное свойство. Данные при этом не пострадают.`,
    },
    geoPackageCategory: 'Эта категория имеет геопространственные возможности',
    geoPackageCategoryInfo: `У этой категории есть дополнительное свойство '${locationItemExtraDefName}', которое позволяет экспортировать её в виде файла GeoPackage.`,
    samplingPointDataCategoryType: 'Это категория данных точек выборки',
    samplingPointDataCategoryTypeInfo: `Это предопределенная категория для данных точек выборки. У неё есть дополнительное свойство '${locationItemExtraDefName}', которое позволяет экспортировать её в виде файла GeoPackage.`,
    samplingPointDataCategoryLocationMissing: `Дополнительное свойство '${locationItemExtraDefName}' отсутствует`,
    createCategory: {
      menuLabel: 'Добавить категорию',
      simple: 'Простая категория',
      otherTypes: 'Другие типы категорий',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Категория данных точек выборки',
      description:
        'Предопределенная категория для данных точек выборки, включающая поле местоположения для каждого элемента.',
      message: `Создать новую категорию данных точек выборки?

К элементам будет добавлено дополнительное свойство '${locationItemExtraDefName}'.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Категория с геопространственными возможностями',
      description:
        'Добавляет элементам поле местоположения, чтобы категорию можно было экспортировать в виде файла GeoPackage.',
      message: `Создать новую категорию с геопространственными возможностями?

К элементам будет добавлено дополнительное свойство '${locationItemExtraDefName}'.`,
    },
    deleteItem: 'Удалить элемент',
    level: {
      title: 'Уровень {{levelPosition}}',
      noItemsDefined: 'Не определены элементы',
      selectItemFromPreviousLevel: 'Выберите элемент с предыдущего уровня',
    },

    importSummary: {
      columns: 'Столбец',
      columnTypeSummary: 'Уровень {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Описание ({{language}})',
      columnTypeLabel: 'Метка ({{language}})',
      columnType: {
        code: 'код',
        description: 'описание',
        label: 'метка',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Тип данных',
      title: 'Сводка импорта категорий',
    },
    reportingData: 'Отчетные данные',
    exportToGeoPackage: 'Экспорт в GeoPackage',
    exportToGeoPackageSkippedItems: '{{count}} элемент(ов) без действительного местоположения были пропущены.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Сгенерировать анализ Whisp',
      confirmMessage: `Сгенерировать анализ Whisp для всех точек выборки?

- каждая точка выборки с местоположением будет отправлена в Open Foris Whisp для анализа
- результаты будут объединены с данными точек выборки и сохранены в категории '${samplingPointDataWhispCategoryName}'
- если категория '${samplingPointDataWhispCategoryName}' уже существует, её содержимое будет заменено
- анализ выполняется в фоновом режиме и может занять несколько минут в зависимости от количества точек выборки`,
    },
    templateFor_samplingPointDataImport_csv: 'Шаблон для импорта данных точек выборки (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Шаблон для импорта данных точек выборки (Excel)',
  },
  extraProp: {
    label: 'Дополнительное свойство',
    label_other: 'Дополнительные свойства',
    addExtraProp: 'Добавить дополнительное свойство',
    dataTypes: {
      geometryPoint: 'Геометрия точки',
      number: 'Число',
      text: 'Текст',
    },
    editor: {
      title: 'Редактировать $t(extraProp.label_other)',
      confirmDelete: 'Удалить дополнительное свойство "{{name}}"?',
      confirmSave: `Сохранить изменения в определениях дополнительных свойств?

  **Предупреждения**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Имя изменено с {{nameOld}} на {{nameNew}}',
        dataTypeChanged: 'Тип данных изменен с {{dataTypeOld}} на {{dataTypeNew}}',
      },
    },
    name: 'Название свойства {{position}}',
    value: 'Значение',
  },
  record: {
    ancestorNotFound: 'Родительский узел не найден в записи',
    keyDuplicate: 'Дубликат ключа записи',
    oneOrMoreInvalidValues: 'Одно или несколько значений недействительны',
    uniqueAttributeDuplicate: 'Дублирующее значение',

    attribute: {
      customValidation: 'Неверное значение',
      uniqueDuplicate: 'Дублирующее значение',
      valueInvalid: 'Неверное значение',
      valueRequired: 'Требуемое значение',
    },
    entity: {
      keyDuplicate: 'Дубликат ключа сущности',
    },
    nodes: {
      count: {
        invalid: 'Узлов {{nodeDefName}} должно быть ровно {{count}}',
        maxExceeded: 'Узлов {{nodeDefName}} должно быть не более {{maxCount}}',
        minNotReached: 'Узлов {{nodeDefName}} должно быть не менее {{minCount}}',
      },
    },
  },

  // ====== Common components
  expressionEditor: {
    and: 'И',
    or: 'ИЛИ',
    group: 'Группа ()',
    var: 'Переменная',
    const: 'Постоянное значение',
    call: 'Функция',
    operator: 'Оператор',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Атрибут исходной координаты',
      distanceAttribute: 'Атрибут расстояния',
      bearingAttribute: 'Атрибут азимута',
    },

    geoDistanceToAOIBoundaryEditor: {
      areaOfInterestNotDefined:
        'Область интереса обследования ещё не определена: задайте её в разделе «Информация об обследовании» → «Карта»',
    },
    coordinateAttribute: 'Атрибут координат',
    coordinateAttributeWithPosition: 'Атрибут координат {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Атрибут первой даты',
      firstTimeAttribute: 'Атрибут первого времени',
      secondDateAttribute: 'Атрибут второй даты',
      secondTimeAttribute: 'Атрибут второго времени',
    },
    error: {
      selectOneVariable: 'Пожалуйста, выберите одну переменную',
    },

    header: {
      editingExpressionForNodeDefinition: 'Редактирование выражения {{qualifier}} для "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Редактирование функции "{{functionName}}" для "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'значение по умолчанию',
      'default-values-apply-if': 'применить значение по умолчанию, если',
      'editable-if': 'редактируемо, если',
      'max-count': 'максимальное количество',
      'min-count': 'минимальное количество',
      'relevant-if': 'актуально, если',
      validations: 'правило проверки',
      'validations-apply-if': 'применить правило проверки, если',
      'visible-if': 'видимо, если',
    },

    selectAFunction: 'Выберите функцию',

    valueType: {
      constant: 'Константа',
      expression: 'Выражение',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: '<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>',
    openforisArenaWebsite:
      '<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>',
    supportForum: '<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>',
    arenaVideoTutorialsInFaoElearningAcademy:
      '<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>',
    arenaVideoTutorialsInYouTube:
      '<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>',
    arenaInGitHub:
      '<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>',
    arenaRScriptsInGitHub:
      '<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>',
  },
  aiExpression: {
    title: 'Сгенерировать выражение по описанию',
    hint: 'Опишите простыми словами, что должно делать выражение. ИИ переведет его в синтаксис Arena. Нажмите Ctrl+Enter для генерации.',
    placeholder: 'например: высота дерева должна быть больше 0 и меньше 200',
    generate: 'Сгенерировать',
    generating: 'Генерация…',
    use: 'Использовать это выражение',
    useAnyway: 'Все равно использовать',
    tryAgain: 'Попробовать другое описание',
    parseError:
      'Сгенерированное выражение не удалось корректно разобрать: {{message}}. Вы все равно можете применить его и отредактировать вручную или попробовать переформулировать описание.',
    explain: {
      title: 'Объяснить это выражение',
      thinking: 'Запрашиваем у ИИ объяснение этого выражения…',
      error: 'Не удалось получить объяснение: {{message}}',
      timeout: 'ИИ слишком долго не отвечает. Повторите попытку.',
    },
  },
  aiTranslation: {
    translateButton_one: 'Перевести на {{count}} другой язык',
    translateButton_few: 'Перевести на {{count}} других языка',
    translateButton_many: 'Перевести на {{count}} других языков',
    translateButton_other: 'Перевести на {{count}} другого языка',
    translateButton: 'Перевести на другие языки',
    success_one: 'Переведено на {{count}} язык. Проверьте и сохраните.',
    success_few: 'Переведено на {{count}} языка. Проверьте и сохраните.',
    success_many: 'Переведено на {{count}} языков. Проверьте и сохраните.',
    success_other: 'Переведено на {{count}} языка. Проверьте и сохраните.',
    success: 'Переведено. Проверьте и сохраните.',
    failed: 'Не удалось выполнить перевод: {{message}}',
    timeout: 'Время ожидания перевода истекло. Повторите попытку.',
  },
  aiActivityLog: {
    title: 'Сводка журнала активности',
    summarizeButton: 'Составить сводку',
    thinking: 'Собираем события и запрашиваем у ИИ сводку…',
    error: 'Не удалось получить сводку: {{message}}',
  },
  aiChatbot: {
    open: 'Справка и документация',
    title: 'Справка и документация',
    empty: 'Задайте мне любой вопрос об Open Foris Arena.',
    placeholder: 'Введите ваш вопрос…',
    send: 'Отправить',
    stop: 'Остановить',
    clear: 'Очистить',
    showReasoning: 'Показать рассуждения',
    error: 'Ошибка чат-бота: {{message}}',
    language: 'Язык ответа',
  },
}
