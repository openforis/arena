/* eslint-disable camelcase */

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
    chain_plural: 'Цепочки',
    childrenEmpty: 'Определите хотя бы один дочерний элемент',
    clone: 'Клонировать',
    close: 'Закрыть',
    cloneFrom: 'Клонировать из',
    cnt: 'Количество',
    code: 'Код',
    collapse: 'Свернуть',
    convert: 'Преобразовать',
    copy: 'Копировать',
    createdWith: 'Создано с помощью',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Цикл',
    cycle_plural: 'Циклы',
    dateCreated: 'Дата создания',
    dateLastModified: 'Дата последнего изменения',
    delete: 'Удалить',
    deleted: 'Удалено!',
    descending: 'По убыванию',
    description: 'Описание',
    description_plural: 'Описания',
    designerNotes: 'Заметки дизайнера',
    designerNotesInfo: `Заметки дизайнера будут видны только в дизайнере формы опроса и не будут видны в форме ввода данных.`,
    details: 'Подробности',
    dimension: 'Измерение',
    dimension_other: 'Измерения',
    done: 'Готово',
    download: 'Скачать',
    draft: 'Черновик',
    edit: 'Редактировать',
    email: 'Электронная почта',
    email_other: 'Электронные письма',
    emailSentConfirmation: `Письмо на адрес {{email}} отправлено.

Пожалуйста, сообщите получателю, чтобы он проверил папку "Спам/Нежелательная почта".`,
    emailSentToSelfConfirmation: `Вы должны были получить письмо на адрес {{email}}.

Пожалуйста, проверьте папку "Спам/Нежелательная почта".`,
    empty: 'Пусто',
    entity: 'Сущность',
    error: 'Ошибка',
    error_plural: 'Ошибки',
    errorFound: 'Найдена 1 ошибка',
    errorFound_other: 'Найдено {{count}} ошибок',
    errorMessage: 'Сообщение об ошибке',
    errorMessage_plural: 'Сообщения об ошибках',
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
    file_plural: 'Файлы',
    formContainsErrors: 'Форма содержит ошибки',
    formContainsErrorsCannotContinue: 'Форма содержит ошибки. Пожалуйста, исправьте их, прежде чем продолжить.',
    formContainsErrorsCannotSave: 'Форма содержит ошибки. Пожалуйста, исправьте их, прежде чем сохранить.',
    from: 'От',
    function: 'Функция',
    goToHomePage: 'Перейти на домашнюю страницу',
    group: 'Группа',
    help: 'Помощь',
    hide: 'Скрыть',
    id: 'id',
    import: 'Импорт',
    importFromExcelOrCSVFile: 'Импорт из Excel (.xlsx) или CSV файла',
    info: 'Информация',
    invalid: 'НЕВЕРНЫЙ',
    item: 'Элемент',
    item_plural: 'Элементы',
    itemAlreadyAdded: 'Элемент уже добавлен',
    label: 'Метка',
    label_plural: 'Метки',
    language: 'Язык',
    language_plural: 'Языки',
    leavePageConfirmMessage: `На форме есть несохраненные изменения.

При подтверждении все изменения будут потеряны.
Вы хотите продолжить?`,
    local: 'Локально',
    loading: 'Загрузка...',
    max: 'Максимум',
    med: 'Медиана',
    manage: 'Управление',
    message_plural: 'Сообщения',
    measure: 'Измерение',
    measure_other: 'Измерения',
    measurePrevSteps: 'Измерения предыдущих шагов',
    measurePrevSteps_plural: 'Измерения предыдущих шагов',
    min: 'Минимум',
    name: 'Имя',
    new: 'Новый',
    next: 'Далее',
    no: 'Нет',
    noItems: `$t(common.no) $t(common.item_plural)`,
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
    raiseTicketInSupportForum: `В случае проблем, пожалуйста, создайте заявку с тегом 'arena' на нашем <b>Форуме поддержки</b>: $t(links.supportForum)`,
    record: 'Запись',
    record_other: 'Записи',
    remote: 'Удаленно',
    required: 'Обязательно',
    requiredField: 'обязательное поле',
    reset: 'Сброс',
    retry: 'Повторить',
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
    srs: 'SRS',
    status: 'Статус',
    sum: 'Сумма',
    test: 'Тест',
    to: 'Кому',
    totalItems: 'Всего элементов',
    true: 'Истина',
    type: 'Тип',
    undefinedName: 'Неопределенное имя',
    unique: 'Уникальный',
    upload: 'Загрузить',
    value: 'Значение',
    uploadingFile: 'Загрузка файла ({{progressPercent}}%)',
    view: 'Просмотр',
    warning: 'Предупреждение',
    warning_plural: 'Предупреждения',
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
      itemsPerPage: 'Элементов на страницу',
      lastPage: 'Последняя страница',
      nextPage: 'Следующая страница',
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
  },

  sidebar: {
    logout: 'Выйти',
  },

  header: {
    myProfile: 'Мой профиль',
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
    usersSurvey: 'Список пользователей',
    usersList: 'Список пользователей (все)',

    analysis: 'Анализ',
    chain: 'Цепочка',
    chain_plural: 'Цепочки',
    virtualEntity: 'Виртуальная сущность',
    entities: 'Виртуальные сущности',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'Экземпляры',

    help: 'Помощь',
    about: 'О программе',
    disclaimer: 'Отказ от ответственности',
    userManual: 'Руководство пользователя',
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'Этот раздел доступен только после публикации опроса',
  },

  loginView: {
    yourName: 'Ваше имя',
    yourEmail: 'Ваш адрес электронной почты',
    yourPassword: 'Ваш пароль',
    yourNewPassword: 'Ваш новый пароль',
    repeatYourPassword: 'Повторите ваш пароль',
    repeatYourNewPassword: 'Повторите ваш новый пароль',
    requestAccess: 'Впервые в $t(common.appNameFull)? Запросить доступ',
    resetPassword: 'Сбросить пароль',
    login: 'Войти',
    forgotPassword: 'Забыли пароль',
    sendPasswordResetEmail: 'Отправить письмо для сброса пароля',
  },

  accessRequestView: {
    error: 'Ошибка при запросе доступа: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Имя',
        lastName: 'Фамилия',
        institution: 'Учреждение',
        country: 'Страна',
        purpose: 'Для чего вам это нужно?',
        surveyName: 'Предложите название опроса',
        templateUuid: 'Начать с шаблона?',
      },
    },
    introduction: `Наши ресурсы ограничены, поэтому вы должны запросить доступ к платформе.
Нам также интересно, что вы хотите с ней делать, поэтому, пожалуйста, сообщите нам!
У вас есть возможность начать с **нового пустого опроса** или клонировать существующий **шаблон**, и вам нужно будет предложить название для вновь созданного опроса.
Вам будет назначена роль ***Администратора опроса*** для этого опроса: вы сможете редактировать его и приглашать новых пользователей присоединяться к вашему опросу и вносить свой вклад.
Вы также будете ***Менеджером опросов*** и сможете **создавать новые опросы** (до 5), если потребуется.
Для получения дополнительной информации, пожалуйста, посетите наш веб-сайт: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**После отправки запроса, пожалуйста, дождитесь приглашения по электронной почте для доступа к Arena.**`,
    reCaptchaNotAnswered: 'ReCaptcha не отвечена',
    requestSent: 'Запрос на доступ успешно отправлен',
    requestSentMessage: `Пожалуйста, дайте нам пару дней для обработки вашего запроса.
Мы скоро отправим письмо на адрес **{{email}}** с инструкциями по доступу к $t(common.appName).
Спасибо и наслаждайтесь **$t(common.appNameFull)**!`,
    sendRequest: 'Отправить запрос',
    sendRequestConfirm: 'Запросить доступ к $t(common.appNameFull)?',
    templateNotSelected: 'Не выбрано (начать с нуля)',
    title: 'Запрос доступа к $t(common.appNameFull)',
  },

  resetPasswordView: {
    title: {
      completeRegistration: 'Завершите регистрацию в Arena',
      setYourNewPassword: 'Установите ваш новый пароль',
    },
    setNewPassword: 'Установить новый пароль',
    forgotPasswordLinkInvalid:
      'Страница, к которой вы пытались получить доступ, не существует или больше недействительна',
    passwordSuccessfullyReset: 'Ваш пароль успешно сброшен',
    passwordStrengthChecksTitle: 'Проверка надежности пароля',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Нет пробелов',
      atLeast8CharactersLong: 'Не менее 8 символов',
      containsLowerCaseLetters: 'Содержит строчные буквы',
      containsUpperCaseLetters: 'Содержит прописные буквы',
      containsNumbers: 'Содержит цифры',
    },
    completeRegistration: 'Завершить регистрацию',
  },

  homeView: {
    dashboard: {
      activeSurveyNotSelected: `<title>Активный опрос не выбран</title>
      <p><label>Пожалуйста, выберите один из</label><linkToSurveys>Списка опросов</linkToSurveys> или <linkToNewSurvey>Создайте новый</linkToNewSurvey></p>`,
      activeUsers: 'Активные пользователи',
      activityLog: {
        title: 'Журнал активности',
      },
      exportWithData: 'Экспорт + данные (резервная копия)',
      exportWithDataNoActivityLog: 'Экспорт + данные (БЕЗ журнала активности)',
      surveyPropUpdate: {
        main: `<title>Добро пожаловать в Arena</title>
  
        <p>Сначала вам нужно установить <strong>название</strong> и <strong>метку</strong> опроса.</p>
        
        <p>Нажмите ниже на <linkWithIcon> $t(homeView.surveyInfo.editInfo)</linkWithIcon> или на название опроса:<basicLink>{{surveyName}}</basicLink></p>
        `,
        secondary: `
        <p>Если название и метка верны, то создайте первый атрибут
        <linkWithIcon>Опрос \u003E Дизайнер форм</linkWithIcon>
        </p>
        `,
      },
      nodeDefCreate: {
        main: `<title>Создадим первый атрибут {{surveyName}} </title>
        
        <p>Перейдите в <linkWithIcon>Опрос \u003E Дизайнер форм</linkWithIcon></p>
        <br />
        `,
      },
      storageSummary: {
        title: 'Использование хранилища (файлы)',
        availableSpace: 'Доступно ({{size}})',
        usedSpace: 'Использовано ({{size}})',
        usedSpaceOutOf: `Использовано {{percent}}% ({{used}} из {{total}})`,
      },
      samplingPointDataCompletion: {
        title: 'Завершение данных по точкам выборки',
        totalItems: 'Всего элементов: {{totalItems}}',
        remainingItems: 'Оставшиеся элементы',
      },
      step: {
        entry: 'Ввод данных',
        cleansing: 'Очистка данных',
        analysis: 'Анализ данных',
      },
      // records' summary
      recordsByUser: 'Записи по пользователю',
      recordsAddedPerUserWithCount: 'Записи, добавленные пользователем (Всего {{totalCount}})',
      dailyRecordsByUser: 'Ежедневные записи по пользователю',
      totalRecords: 'Всего записей',
      selectUsers: 'Выбрать пользователей...',
      noRecordsAddedInSelectedPeriod: 'Нет записей, добавленных в выбранный период',
    },
    surveyDeleted: 'Опрос {{surveyName}} был удален',
    surveyInfo: {
      basic: 'Основная информация',
      configuration: {
        title: 'Конфигурация',
        filesTotalSpace: 'Общий объем файлов (ГБ)',
      },
      confirmDeleteCycleHeader: 'Удалить этот цикл?',
      confirmDeleteCycle: `Вы уверены, что хотите удалить цикл {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
Если к этому циклу привязаны записи, они будут удалены.`,
      cycleForArenaMobile: 'Цикл для Arena Mobile',
      fieldManualLink: 'Ссылка на полевое руководство',
      editInfo: 'Редактировать информацию',
      viewInfo: 'Просмотреть информацию',
      preferredLanguage: 'Предпочитаемый язык',
      sampleBasedImageInterpretation: 'Интерпретация изображений на основе образцов',
      sampleBasedImageInterpretationEnabled: 'Интерпретация изображений на основе образцов включена',
      security: {
        title: 'Безопасность',
        dataEditorViewNotOwnedRecordsAllowed: 'Редактор данных может просматривать не свои записи',
        visibleInMobile: 'Видно в Arena Mobile',
        allowRecordsDownloadInMobile: 'Разрешить загрузку записей с сервера в Arena Mobile',
        allowRecordsUploadFromMobile: 'Разрешить загрузку записей из Arena Mobile на сервер',
      },
      srsPlaceholder: 'Введите код или метку',
      unpublish: 'Отменить публикацию и удалить данные',
      unpublishSurveyDialog: {
        confirmUnpublish: 'Вы уверены, что хотите отменить публикацию этого опроса?',
        unpublishWarning: `Отмена публикации опроса **{{surveyName}}** приведет к удалению всех его данных.\n\n
  
  $t(common.cantUndoWarning)`,
        confirmName: 'Введите название этого опроса для подтверждения:',
      },
      userExtraProps: {
        title: 'Дополнительные свойства пользователя',
        info: `Дополнительные свойства, которые могут быть назначены каждому пользователю, связанному с опросом.
Эти свойства могут быть использованы в значениях по умолчанию, правилах проверки и выражениях применимости.
Например: *userProp('property_name') == 'some_value'*`,
      },
    },
    deleteSurveyDialog: {
      confirmDelete: 'Вы уверены, что хотите удалить этот опрос?',
      deleteWarning: `Удаление опроса **{{surveyName}}** приведет к удалению всех его данных.\n\n

$t(common.cantUndoWarning)`,
      confirmName: 'Введите название этого опроса для подтверждения:',
    },
    surveyList: {
      active: '$t(common.active)',
      activate: 'Активировать',
    },
    collectImportReport: {
      excludeResolvedItems: 'Исключить разрешенные элементы',
      expression: 'Выражение',
      resolved: 'Разрешено',
      exprType: {
        applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
        codeParent: 'Родительский код',
        defaultValue: 'Значение по умолчанию',
        validationRule: 'Правило проверки',
      },
      title: 'Отчет об импорте Collect',
    },
    recordsSummary: {
      recordsAddedInTheLast: 'Записи, добавленные за последние:',
      fromToPeriod: 'с {{from}} по {{to}}',
      record: '{{count}} Запись',
      record_other: '{{count}} Записей',
      week: '{{count}} Неделя',
      week_other: '{{count}} Недель',
      month: '{{count}} Месяц',
      month_other: '{{count}} Месяцев',
      year: '{{count}} Год',
      year_other: '{{count}} Лет',
    },
  },

  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Типы зависимостей',
    dependencyTypes: {
      applicable: 'Применимость',
      defaultValues: 'Значение по умолчанию',
      itemsFilter: 'Фильтр элементов',
      minCount: 'Мин. количество',
      maxCount: 'Макс. количество',
      validations: 'Проверки',
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
    lock: 'Заблокировать',
    unlock: 'Разблокировать',
  },

  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Удалить эту пользовательскую агрегатную функцию?',
      sqlExpression: 'SQL выражение',
    },
    editRecord: 'Редактировать запись',
  },

  dataExportView: {
    error: 'Ошибка экспорта данных: {{details}}',
    optionNotCompatibleWithDataImport: 'Не совместимо с импортом данных',
    options: {
      header: '$t(common.options)',
      fileFormatLabel: 'Формат файла',
      fileFormat: {
        csv: 'CSV',
        xlsx: 'Excel',
      },
      includeCategoryItemsLabels: 'Включить метки элементов категории',
      includeCategories: 'Включить категории',
      expandCategoryItems: 'Развернуть элементы категории',
      exportSingleEntitiesIntoSeparateFiles: 'Экспортировать отдельные сущности в отдельные файлы',
      includeAncestorAttributes: 'Включить атрибуты предков',
      includeAnalysis: 'Включить результирующие переменные',
      includeDataFromAllCycles: 'Включить данные из всех циклов',
      includeDateCreated: 'Включить дату создания',
      includeFiles: 'Включить файлы',
      includeFileAttributeDefs: 'Включить столбцы атрибутов файлов',
      includeInternalUuids: 'Включить внутренние UUID',
      recordsModifiedAfter: 'Записи, измененные после',
    },
    optionsInfo: {
      expandCategoryItems:
        'добавляет один логический столбец для каждого элемента категории со значением TRUE, если элемент был выбран, FALSE в противном случае',
      exportSingleEntitiesIntoSeparateFiles: `экспортирует отдельные сущности в отдельные файлы; если не отмечено, атрибуты, принадлежащие одной сущности, будут включены среди атрибутов ее ближайшей родительской множественной сущности`,
      includeAnalysis: 'включает атрибуты анализа',
      includeAncestorAttributes: 'включает атрибуты, принадлежащие родительским сущностям, до корневой сущности',
      includeCategoryItemsLabels: 'добавляет столбец с меткой для каждого элемента категории',
      includeCategories: `категории будут экспортированы в подпапку "categories"`,
      includeDataFromAllCycles:
        'данные из всех циклов будут включены, в противном случае будет учитываться только выбранный',
      includeDateCreated: 'включает дату создания каждой сущности (строки) в столбец "date_created"',
      includeFiles: `экспортирует файлы, связанные с записями, в подпапку "files"`,
      includeFileAttributeDefs: `добавляет столбцы атрибутов файлов: внутренний идентификатор файла (file_uuid) и имя (file_name)`,
      includeInternalUuids: 'включает внутренние идентификаторы (UUID) в столбцы, оканчивающиеся суффиксом "_uuid"',
      recordsModifiedAfter: 'экспортирует только данные из записей, измененных после указанной даты',
    },
    startExport: 'Начать экспорт',
  },

  dataImportView: {
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
$t(dataImportView.jobs.DataImportJob.importCompleteSummary)`,
        importWithFilesCompleteSuccessfully: `$t(dataImportView.jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} файлов вставлено
        - {{updatedFiles}} файлов обновлено
        - {{deletedFiles}} файлов удалено`,
        importCompleteWithErrors: `## Импорт завершен (с ошибками):
        - {{processed}} строк обработано`,
      },
      DataImportValidationJob: {
        validationCompleteWithErrors: `## Проверка завершена ({{errorsFoundMessage}})
        - {{processed}} строк обработано`,
        validationWithFilesCompleteWithErrors: `$t(dataImportView.jobs.DataImportValidationJob.validationCompleteWithErrors)`,
        validationCompleteSuccessfully: `## Проверка завершена без ошибок
        - {{processed}} строк обработано
        - {{insertedRecords}} записей будет создано
        - {{updatedRecords}} записей будет обновлено
        - {{entitiesCreated}} сущностей будет создано
        - {{entitiesDeleted}} сущностей будет удалено
        - {{updatedValues}} значений будет обновлено`,
        validationWithFilesCompleteSuccessfully: `$t(dataImportView.jobs.DataImportValidationJob.validationCompleteSuccessfully)
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
      deleteExistingEntities: `удалить данные выбранной сущности во всех записях`,
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
    startImportConfirmWithDeleteExistingEntities: `$t(dataImportView.startImportConfirm)
** (выбрана опция $t(dataImportView.options.deleteExistingEntities): существующие сущности будут удалены перед созданием новых) **
`,
    steps: {
      selectImportType: 'Выбрать тип импорта',
      selectCycle: 'Выбрать цикл',
      selectEntity: 'Выбрать сущность',
      selectFile: 'Выбрать файл',
      startImport: 'Начать импорт',
    },
    validateFile: 'Проверить файл',
    validateFileInfo:
      'Процесс проверки проверяет, что файл содержит действительные данные в соответствии с типом данных каждого атрибута.',
  },

  dataView: {
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
      deleteRecord: 'Удалить запись',
      demoteAllRecordsFromAnalysis: 'Анализ -> Очистка',
      demoteAllRecordsFromCleansing: 'Очистка -> Ввод',
      editRecord: 'Редактировать запись',
      exportList: 'Экспортировать список',
      exportData: 'Экспортировать данные',
      exportDataSummary: 'Экспортировать сводку данных',
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
  },

  mapView: {
    createRecord: 'Создать новую запись',
    editRecord: 'Редактировать запись',
    earthMap: 'Карта Земли',
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
    },
    samplingPointDataLayerName: 'Данные точки выборки - уровень {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (загрузка...)',
    samplingPointItemPopup: {
      title: 'Элемент точки выборки',
      levelCode: 'Код уровня {{level}}',
    },
    selectedPeriod: 'Выбранный период',
    whisp: 'Шепот',
    whispEarthMap: 'Карта Земли Шепота',
    whispCsv: 'Шепот CSV',
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
  },

  usersView: {
    accepted: 'Принято',
    confirmUserWillBeSystemAdmin: 'Пользователь станет системным администратором. Продолжить?',
    copyInvitationLink: 'Скопировать ссылку-приглашение в буфер обмена',
    copyInvitationLinkConfirmMessage: `Если приглашенный пользователь не получил никаких писем на адрес {{email}},
вы можете скопировать ссылку-приглашение в буфер обмена и поделиться ею с ним другими способами.
    
Скопировать ссылку-приглашение в буфер обмена?`,
    copyPasswordResetLink: 'Скопировать ссылку для сброса пароля в буфер обмена?',
    copyPasswordResetLinkConfirmMessage: `Если пользователь сбросил свой пароль, но не получил никаких писем на адрес {{email}},
вы можете скопировать ссылку для сброса пароля в буфер обмена и поделиться ею с ним другими способами.
    
Скопировать ссылку для сброса пароля в буфер обмена?`,
    editSurveyUserExtraPropsForUser:
      'Редактировать дополнительные свойства пользователя опроса для пользователя "{{userName}}"',
    inviteUser: 'Пригласить',
    invitationExpiredClickToSendAgainTheInvitation: 'Приглашение истекло: нажмите, чтобы отправить приглашение снова',
    invitationLinkCopiedToClipboard: 'Ссылка-приглашение скопирована в буфер обмена',
    invitedBy: 'Приглашен(а) кем',
    invitedDate: 'Дата приглашения',
    lastLogin: 'Последний вход',
    moreThan30DaysAgo: 'Более 30 дней назад',
    notAcceptedYet: 'Приглашение еще не принято',
    passwordResetLinkCopiedToClipboard: 'Ссылка для сброса пароля скопирована в буфер обмена',
    passwordResetLink: 'Ссылка для сброса пароля',
    roleInCurrentSurvey: 'Роль в текущем опросе',
    roleInSurvey: 'Роль в опросе',
    filterPlaceholder: 'Фильтровать по имени или email',
    surveyName: 'Название опроса',
    surveyExtraProp: {
      label: 'Дополнительное свойство опроса',
      label_other: 'Дополнительные свойства опроса',
    },
    surveysDraft: 'Опросы (черновик)',
    surveysPublished: 'Опросы (опубликовано)',
    updateUserConfirmation: 'Пользователь {{name}} обновлен',
    userNotInvitedToAnySurvey: `Пользователь не приглашен ни в один опрос`,
    userSurveys: 'Опросы пользователя',
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
      role: 'Роль',
      template: 'Шаблон',
    },
  },

  userView: {
    scale: 'Масштаб',
    rotate: 'Повернуть',
    dragAndDrop: 'Перетащите изображение сюда или',
    upload: 'нажмите здесь, чтобы загрузить',
    sendNewInvitation: 'Отправить новое приглашение',
    removeFromSurvey: 'Удалить из опроса',
    confirmRemove: 'Вы уверены, что хотите лишить пользователя {{user}} доступа к опросу {{survey}}?',
    removeUserConfirmation: 'Пользователь {{user}} удален из опроса {{survey}}',
    maxSurveysUserCanCreate: 'Максимальное количество опросов, которые может создать пользователь',
    preferredUILanguage: {
      label: 'Предпочитаемый язык интерфейса',
      auto: 'Автоматически определено ({{detectedLanguage}})',
    },
  },

  userPasswordChangeView: {
    oldPassword: 'Старый пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите новый пароль',
    changePassword: 'Сменить пароль',
    passwordChangedSuccessfully: 'Пароль успешно изменен!',
  },

  userInviteView: {
    confirmInviteSystemAdmin: 'Пригласить пользователя {{email}} в качестве системного администратора?',
    confirmInviteSystemAdmin_other: 'Пригласить пользователей {{email}} в качестве системных администраторов?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)
    
    {{skppedEmailsCount}} адресов были пропущены (они уже были приглашены в этот опрос ранее): {{skippedEmails}}`,
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
    firstPhaseCategory: 'Категория 1-й фазы',
    firstPhaseCommonAttribute: {
      label: 'Общий атрибут',
      info: `Атрибут, общий для базовой единицы и таблицы 1-й фазы
(это должен быть кодовый атрибут с тем же именем, что и дополнительное свойство, определенное для категории 1-й фазы)`,
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
    nonResponseBiasCorrectionTip: `Для реализации этого метода добавьте 'design_psu' и 'design_ssu' в категорию страты как дополнительные свойства.`,
    pValue: 'P-значение',
    resultsBackFromRStudio: 'Результаты получены из RStudio',
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
    },
    stratumAttribute: 'Атрибут страты',
    postStratificationAttribute: 'Атрибут послестратификации',
    areaWeightingMethod: 'Метод взвешивания по площади',
    clusteringEntity: 'Сущность кластеризации',
    clusteringOnlyVariances: 'Кластеризация только для дисперсий',
    errorNoLabel: 'Цепочка должна иметь допустимую метку',
    dateExecuted: 'Дата выполнения',
    deleteChain: 'Удалить цепочку',
    deleteConfirm: `Удалить эту цепочку обработки?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Цепочка обработки удалена',
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
    emptyNodeDefs: '$t(validationErrors.analysis.analysisNodeDefsRequired)',
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
 * Форум поддержки: $t(links.supportForum)
 * Arena на GitHub: <a href="https://github.com/openforis/arena" target="_blank">https://github.com/openforis/arena</a>
 * Скрипты Arena R на GitHub: <a href="https://github.com/openforis/arena-r" target="_blank">https://github.com/openforis/arena-r</a>
`,
    },
  },

  // ====== Survey views

  nodeDefEdit: {
    additionalFields: 'Дополнительные поля',
    basic: 'Основное',
    advanced: 'Расширенные',
    mobileApp: 'Мобильное приложение',
    validations: 'Проверки',
    function: 'Функция',
    editingFunction: 'Редактирование функции {{functionName}}',
    editorHelp: {
      json: 'Допустимые выражения являются подмножеством Javascript.',
      sql: 'Разрешены только допустимые SQL-выражения.',
    },
    editorCompletionHelp: '- Показать доступные переменные и функции, которые можно использовать',
    functionDescriptions: {
      categoryItemProp: 'Возвращает значение указанного $t(extraProp.label) элемента категории с указанным кодом',
      dateTimeDiff: 'Возвращает разницу (в минутах) между двумя парами дата-время',
      distance: 'Возвращает расстояние (в метрах) между указанными координатами',
      first: 'Возвращает первое значение или узел указанного множественного атрибута или сущности',
      geoPolygon: 'Генерирует полигон в GeoJSON из списка координат',
      includes: 'Возвращает true, если указанный множественный атрибут включает указанное значение.',
      index: 'Возвращает индекс указанного узла среди его братьев',
      isEmpty: 'Возвращает true, если для аргумента не указано значение',
      isNotEmpty: 'Возвращает true, если для аргумента указано некоторое значение',
      last: 'Возвращает последнее значение или узел указанного множественного атрибута или сущности',
      ln: 'Возвращает натуральный логарифм X',
      log10: 'Возвращает логарифм X по основанию 10',
      max: 'Возвращает максимум из аргументов',
      min: 'Возвращает минимум из аргументов',
      now: 'Возвращает текущую дату или время',
      parent: 'Возвращает родительскую сущность указанного узла',
      pow: 'Возвращает значение основания, возведенного в степень',
      recordCycle: 'Возвращает цикл текущей записи',
      recordDateCreated:
        'Возвращает дату и время создания текущей записи в виде значения datetime. Может использоваться в текстовом, датовом или временном атрибуте',
      recordDateLastModified:
        'Возвращает дату и время последнего изменения текущей записи в виде значения datetime. Может использоваться в текстовом, датовом или временном атрибуте',
      recordOwnerEmail: 'Возвращает email пользователя, которому принадлежит запись',
      recordOwnerName: 'Возвращает имя пользователя, которому принадлежит запись',
      recordOwnerRole: 'Возвращает роль (в текущем опросе) пользователя, которому принадлежит запись',
      rowIndex: 'Возвращает текущий индекс строки таблицы (или формы)',
      taxonProp: 'Возвращает значение указанного $t(extraProp.label) таксона с указанным кодом',
      taxonVernacularName:
        'Возвращает (первое) народное (или местное) название на указанном языке таксона с указанным кодом',
      userEmail: 'Возвращает email вошедшего в систему пользователя',
      userIsRecordOwner:
        'Возвращает логическое значение "true", если пользователь, редактирующий запись, также является ее владельцем, "false" в противном случае',
      userName: 'Возвращает имя вошедшего в систему пользователя',
      userProp: 'Возвращает значение указанного $t(extraProp.label) вошедшего в систему пользователя',
      uuid: 'Генерирует UUID (универсальный уникальный идентификатор), который может быть использован в качестве идентификатора (например, в качестве ключевого атрибута сущности)',
      // SQL functions
      avg: 'Возвращает среднее значение числовой переменной',
      count: 'Возвращает количество строк, соответствующих указанному критерию',
      sum: 'Возвращает общую сумму числовой переменной',
    },
    functionName: {
      rowIndex: 'Индекс строки',
    },
    basicProps: {
      analysis: 'Анализ',
      autoIncrementalKey: {
        label: 'Автоинкрементный ключ',
        info: 'Значение будет генерироваться автоматически',
      },
      displayAs: 'Отображать как',
      displayIn: 'Отображать в',
      entitySource: 'Источник сущности',
      enumerate: {
        label: 'Перечислить',
        info: `Строки будут автоматически генерироваться с использованием элементов категории, связанных с атрибутом кода, помеченным как Ключ, определенный внутри сущности; строки нельзя добавлять или удалять, а атрибут кода ключа не будет редактируемым`,
      },
      enumerator: {
        label: 'Перечислитель',
        info: 'Элементы в категории будут использоваться для генерации строк родительской сущности',
      },
      form: 'Форма',
      formula: 'Формула',
      includedInClonedData: 'Включено в клонированные данные',
      key: 'Ключ',
      multiple: 'Множественный',
      ownPage: 'Собственная страница',
      parentPage: 'Родительская страница ({{parentPage}})',
      table: 'Таблица',
    },
    advancedProps: {
      areaBasedEstimate: 'Оценка по площади',
      defaultValues: 'Значения по умолчанию',
      defaultValueEvaluatedOneTime: 'Значение по умолчанию оценивается только один раз',
      defaultValuesNotEditableForAutoIncrementalKey:
        'Значения по умолчанию нередактируемы, так как установлен автоинкрементный ключ',
      hidden: 'Скрыть в форме ввода',
      hiddenWhenNotRelevant: 'Скрыто, когда неактуально',
      itemsFilter: 'Фильтр элементов',
      itemsFilterInfo: `Выражение, используемое для фильтрации выбираемых элементов.
В выражении слово "this" будет относиться к самому элементу.
Например: this.region = region_attribute_name
(где "region" - это имя дополнительного свойства, определенного для элемента, а region_attribute_name - это имя атрибута в опросе)`,
      readOnly: 'Только для чтения',
      relevantIf: 'Актуально, если',
      script: 'Скрипт',
    },
    mobileAppProps: {
      hiddenInMobile: {
        label: 'Скрыто в Arena Mobile',
        info: `Если отмечено, атрибут не будет виден в AM`,
      },
      includedInMultipleEntitySummary: {
        label: 'Включить в сводку множественной сущности',
        info: `Если отмечено, атрибут будет виден в представлении сводки сущности`,
      },
      includedInPreviousCycleLink: {
        label: 'Включить в ссылку на предыдущий цикл',
        info: `Если отмечено, значение из предыдущего цикла будет отображаться в форме ввода данных (когда ссылка на предыдущий цикл активна в мобильном приложении)"`,
      },
    },
    decimalProps: {
      maxNumberDecimalDigits: 'Максимальное количество десятичных знаков',
    },
    fileProps: {
      fileNameExpression: 'Выражение имени файла',
      fileType: 'Тип файла',
      fileTypes: {
        image: 'Изображение',
        video: 'Видео',
        audio: 'Аудио',
        other: 'Другое',
      },
      maxFileSize: 'Макс. размер файла (МБ)',
      numberOfFiles: 'Перейдите в раздел "Проверки", чтобы изменить минимальное и максимальное количество файлов.',
      showGeotagInformation: 'Показать информацию о геотегах',
    },
    mobileProps: {
      title: 'Мобильное приложение',
    },
    formHeaderProps: {
      headerColorLabel: 'Цвет заголовка',
      headerColor: {
        blue: 'Синий',
        green: 'Зеленый',
        orange: 'Оранжевый',
        red: 'Красный',
        yellow: 'Желтый',
      },
    },
    textProps: {
      textInputType: 'Тип текстового ввода',
      textInputTypes: {
        singleLine: 'Одна строка',
        multiLine: 'Многострочный',
      },
      textTransform: 'Преобразование текста',
      textTransformTypes: {
        none: 'нет',
        capitalize: 'с большой буквы',
        uppercase: 'в верхний регистр',
        lowercase: 'в нижний регистр',
      },
    },
    booleanProps: {
      labelValue: 'Значение метки',
      labelValues: {
        trueFalse: '$t(common.true)/$t(common.false)',
        yesNo: '$t(common.yes)/$t(common.no)',
      },
    },
    codeProps: {
      category: 'Категория',
      codeShown: 'Показать код',
      displayAs: 'Отображать как',
      displayAsTypes: {
        checkbox: 'Флажок',
        dropdown: 'Выпадающий список',
      },
      parentCode: 'Родительский код',
    },
    coordinateProps: {
      allowOnlyDeviceCoordinate: 'Разрешить только координаты устройства',
      allowOnlyDeviceCoordinateInfo: `Применяется только к Arena Mobile: если отмечено, пользователь не сможет изменять значения X/Y, но для их получения можно будет использовать только GPS устройства`,
    },
    expressionsProp: {
      expression: 'Выражение',
      applyIf: 'Применить, если',
      confirmDelete: 'Удалить это выражение?',
      severity: 'Важность',
    },
    validationsProps: {
      minCount: 'Минимальное количество',
      maxCount: 'Максимальное количество',
      expressions: 'Выражения',
    },
    cannotChangeIntoMultipleWithDefaultValues:
      'Этот узел не может быть преобразован в множественный, потому что у него есть значения по умолчанию.',
    cannotDeleteNodeDefReferenced: `Невозможно удалить "{{nodeDef}}": на него ссылаются следующие определения узлов: {{nodeDefDependents}}`,
    cloneDialog: {
      confirmButtonLabel: 'Клонировать',
      title: 'Клонирование определения узла "{{nodeDefName}}"',
      entitySelectLabel: 'Сущность для клонирования:',
    },
    conversion: {
      dialogTitle: 'Преобразовать {{nodeDefName}} в другой тип',
      fromType: 'Из типа',
      toType: 'В тип',
    },
    moveDialog: {
      confirmButtonLabel: 'Переместить',
      title: 'Перемещение определения узла "{{nodeDefName}}"',
      entitySelectLabel: 'Сущность, в которую нужно переместить:',
    },
    movedNodeDefinitionHasErrors:
      'Определение узла "{{nodeDefName}}", которое вы переместили, содержит ошибки; пожалуйста, исправьте их.',
    nodeDefintionsHaveErrors: 'Эти определения узлов содержат ошибки: {{nodeDefNames}}. Пожалуйста, исправьте их.',
    filterVariable: 'Переменная для фильтрации элементов',
    filterVariableForLevel: 'Переменная для {{levelName}}',
    unique: {
      label: 'Уникальный',
      info: `Когда атрибут помечен как **Уникальный**, его значение должно быть уникальным внутри ближайшей множественной сущности (иначе будет показана ошибка).

---

Например, в структуре *кластер -> участок -> дерево*, если у вас есть атрибут *tree_species*, помеченный как **Уникальный**, вы можете иметь только одно дерево каждого вида внутри одного и того же *участка*.`,
    },
  },

  languagesEditor: {
    languages: 'Язык(и)',
  },

  taxonomy: {
    header: 'Таксономия',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Удалить таксономию {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    edit: {
      taxonomyListName: 'Название списка таксономии',
      taxaNotImported: 'Таксоны не импортированы',
      family: 'Семейство',
      genus: 'Род',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      extraPropsNotDefined: 'Дополнительные свойства не определены для этой таксономии',
    },
    taxaCount: 'Количество таксонов',
    vernacularNameLabel: 'Метка местного названия',
  },

  categoryList: {
    batchImport: 'Пакетный импорт категорий (из ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} категорий успешно импортировано!
{{insertedCategories}} новых
{{updatedCategories}} обновленных`,
    itemsCount: 'Количество элементов',
    types: {
      flat: 'Плоская',
      hierarchical: 'Иерархическая',
      reportingData: 'Отчетные данные',
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
    templateForImport: 'Шаблон для импорта',
    templateFor_specificDataImport_csv: 'Шаблон для импорта данных (CSV)',
    templateFor_specificDataImport_xlsx: 'Шаблон для импорта данных (Excel)',
    templateFor_genericDataImport_csv: 'Шаблон для импорта данных (общий, CSV)',
    templateFor_genericDataImport_xlsx: 'Шаблон для импорта данных (общий, Excel)',
    templateFor_samplingPointDataImport_csv: 'Шаблон для импорта данных точек выборки (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Шаблон для импорта данных точек выборки (Excel)',
  },

  extraProp: {
    label: 'Дополнительное свойство',
    label_plural: 'Дополнительные свойства',
    addExtraProp: 'Добавить дополнительное свойство',
    dataTypes: {
      geometryPoint: 'Геометрия точки',
      number: 'Число',
      text: 'Текст',
    },
    editor: {
      title: 'Редактировать $t(extraProp.label_plural)',
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

  // ===== All validation errors
  validationErrors: {
    // Common
    invalidEmail: 'Неверный адрес электронной почты',
    invalidField: '"{{field}}" недействителен',
    invalidNumber: 'Неверное число',
    invalidDate: 'Неверная дата',
    minLengthNotRespected: 'Минимальная длина {{minLength}} символов не соблюдена',
    nameDuplicate: 'Имя повторяется',
    nameCannotBeKeyword: `Имя "{{value}}" не может быть использовано: это зарезервированное слово`,
    nameInvalid:
      'Имя "{{name}}" недействительно: оно должно быть не более 40 символов и содержать только строчные буквы и цифры, начинаться с буквы, и содержать только символы "-" и "_"',
    nameRequired: 'Имя обязательно',
    requiredField: 'Поле {{field}} обязательно',
    rowsDuplicate: 'строка: {{row}} дублирующая строка: {{duplicateRow}}',

    analysis: {
      labelDefaultLangRequired: 'Метка на языке по умолчанию для опроса обязательна',
      analysisNodeDefsRequired: 'Требуется хотя бы один вычисляемый атрибут',
    },

    categoryEdit: {
      childrenEmpty: '$t(common.childrenEmpty)',
      childrenInvalid: 'Хотя бы один неверный дочерний элемент',
      codeCannotBeKeyword: `Код "{{value}}" не может быть использован: это зарезервированное слово`,
      codeDuplicate: 'Код повторяется',
      codeRequired: 'Код обязателен',
      itemExtraPropDataTypeRequired: 'Тип данных обязателен для $t(extraProp.label) "{{key}}"',
      itemExtraPropNameInvalid: 'Неверное имя для $t(extraProp.label) "{{key}}"',
      itemExtraPropInvalidNumber: 'Неверное число для $t(extraProp.label) "{{key}}"',
      itemExtraPropInvalidGeometryPoint: 'Неверная геометрическая точка для $t(extraProp.label) "{{key}}"',
      itemsInvalid: 'Хотя бы один неверный элемент',
      itemsEmpty: 'Определите хотя бы один элемент',
      levelDuplicate: 'Имя уровня повторяется',
      levelsInvalid: 'Хотя бы один неверный уровень',
      nameNotSpecified: 'Имя категории не указано',
    },

    categoryImport: {
      cannotDeleteItemsOfPublishedCategory:
        'Невозможно удалить опубликованные элементы категории. Элементы, отсутствующие в импортированном файле: {{deletedItemCodes}}',
      cannotDeleteLevelsOfPublishedCategory:
        'Невозможно удалить уровни опубликованной категории. Уровни, отсутствующие в импортированном файле: {{deletedLevelNames}}',
      codeColumnMissing: 'Должен быть хотя бы один столбец "code"',
      codeRequired: '{{columnName}}: требуется код',
      codeDuplicate: '{{columnName}}: дублирующий код "{{code}}"',
      columnMissing: 'Отсутствует столбец: {{columnNameMissing}}',
      emptyHeaderFound: 'Файл содержит пустой заголовок',
      emptyFile: '$t(validationErrors.dataImport.emptyFile)',
      invalidImportFile:
        'ZIP-файл должен содержать только файлы .csv или .xlsx (по одному для каждой категории), без каких-либо каталогов',
      invalidParentItemOrder: 'Элемент с кодами {{parentItemCodes}} должен стоять перед своими дочерними элементами',
      nameDuplicate: 'Категория с таким именем уже существует: {{name}}',
      srsNotDefined: 'SRS с кодом {{srs}} не определено в опросе',
    },

    dataImport: {
      emptyFile: 'Файл, который вы пытаетесь импортировать, пуст',
      invalidHeaders: 'Неверные столбцы: {{invalidHeaders}}',
      invalidBoolean: 'Неверное логическое значение в столбце {{headers}}: {{value}}',
      invalidCode: `Неверный код для атрибута '{{attributeName}}': {{code}}`,
      invalidCoordinate: 'Неверная координата в столбце {{headers}}: {{value}}',
      invalidDate:
        'Неверная дата в столбце {{headers}}: {{value}}. Даты должны быть отформатированы как YYYY-MM-DD или DD/MM/YYYY. Например, 2023-01-15 или 15/01/2023',
      invalidNumber: 'Неверное число в столбце {{headers}}: {{value}}',
      invalidTaxonCode: 'Неверный код в столбце {{headers}}: {{value}}',
      invalidTime:
        'Неверное время в столбце {{headers}}: {{value}}. Время должно быть отформатировано как HH:mm. Например, 09:45 или 16:30',
      missingRequiredHeaders: 'Отсутствуют обязательные столбцы: {{missingRequiredHeaders}}',
      errorUpdatingValues: 'Ошибка обновления значений: {{details}}',
      multipleRecordsMatchingKeys: 'Найдено несколько записей, соответствующих ключам "{{keyValues}}"',
      recordAlreadyExisting: 'Запись с ключами "{{keyValues}}" уже существует',
      recordInAnalysisStepCannotBeUpdated:
        'Запись с ключами "{{keyValues}}" находится на этапе анализа и не может быть обновлена',
      recordKeyMissingOrInvalid: 'Отсутствует или неверное значение для ключевого атрибута "{{keyName}}"',
      recordNotFound: 'Запись с ключами "{{keyValues}}" не найдена',
    },

    expressions: {
      cannotGetChildOfAttribute: 'невозможно получить дочерний узел {{childName}} атрибута {{parentName}}',
      cannotUseCurrentNode: 'невозможно использовать текущий узел {{name}} в этом выражении',
      circularDependencyError: 'невозможно сослаться на узел {{name}}, потому что он ссылается на текущий узел',
      expressionInvalid: 'Неверное выражение: {{details}}',
      unableToFindNode: 'невозможно найти узел: {{name}}',
      unableToFindNodeChild: 'невозможно найти дочерний узел: {{name}}',
      unableToFindNodeParent: 'невозможно найти родительский узел: {{name}}',
      unableToFindNodeSibling: 'невозможно найти родственный узел: {{name}}',
    },

    extraPropEdit: {
      nameInvalid: 'Неверное имя',
      nameRequired: 'Имя обязательно',
      dataTypeRequired: 'Тип данных обязателен',
      valueRequired: 'Значение обязательно',
    },

    nodeDefEdit: {
      analysisParentEntityRequired: 'Сущность обязательна',
      applyIfDuplicate: 'Условие "$t(nodeDefEdit.expressionsProp.applyIf)" повторяется',
      applyIfInvalid: 'Неверное условие "$t(nodeDefEdit.advancedProps.relevantIf)"',
      columnWidthCannotBeGreaterThan: 'Ширина столбца не может быть больше {{max}}',
      columnWidthCannotBeLessThan: 'Ширина столбца не может быть меньше {{min}}',
      countMaxMustBePositiveNumber: 'Максимальное количество должно быть положительным целым числом',
      countMinMustBePositiveNumber: 'Минимальное количество должно быть положительным целым числом',
      categoryRequired: 'Категория обязательна',
      childrenEmpty: '$t(common.childrenEmpty)',
      defaultValuesInvalid: 'Неверные "Значения по умолчанию"',
      defaultValuesNotSpecified: 'Значение по умолчанию не указано',
      entitySourceRequired: 'Источник сущности обязателен',
      expressionApplyIfOnlyLastOneCanBeEmpty:
        'Только последнее выражение может иметь пустое условие "$t(nodeDefEdit.expressionsProp.applyIf)"',
      expressionDuplicate: 'Выражение повторяется',
      expressionRequired: 'Выражение обязательно',
      formulaInvalid: 'Формула неверна',
      keysEmpty: 'Определите хотя бы один ключевой атрибут',

      keysExceedingMax: 'Превышено максимальное количество ключевых атрибутов',
      maxFileSizeInvalid: 'Максимальный размер файла должен быть больше 0 и меньше {{max}}',
      nameInvalid:
        'Имя недействительно (оно должно содержать только строчные буквы, цифры и подчеркивания, начинаться с буквы)',
      taxonomyRequired: 'Таксономия обязательна',
      validationsInvalid: 'Неверные "Проверки"',
      countMaxInvalid: 'Неверное "Максимальное количество"',
      countMinInvalid: 'Неверное "Минимальное количество"',
    },

    record: {
      keyDuplicate: 'Дубликат ключа записи',
      entityKeyDuplicate: 'Дубликат ключа сущности',
      entityKeyValueNotSpecified: 'Значение ключа для "{{keyDefName}}" не указано',
      missingAncestorForEntity: 'Невозможно найти "{{ancestorName}}" с этими ключами: {{keyValues}}',
      oneOrMoreInvalidValues: 'Одно или несколько значений недействительны',
      uniqueAttributeDuplicate: 'Дублирующее значение',
      valueInvalid: 'Неверное значение',
      valueRequired: 'Требуемое значение',
    },

    recordClone: {
      differentKeyAttributes: 'Ключевые атрибуты отличаются в Цикле {{cycleFrom}} и Цикле {{cycleTo}}',
    },

    surveyInfoEdit: {
      langRequired: 'Язык обязателен',
      srsRequired: 'Система пространственной привязки обязательна',
      cycleRequired: 'Цикл обязателен',
      cyclesRequired: 'Должен быть определен хотя бы один цикл',
      cyclesExceedingMax: 'Опрос может иметь не более 10 циклов',
      cycleDateStartBeforeDateEnd: 'Дата начала цикла должна быть раньше даты его окончания',
      cycleDateStartAfterPrevDateEnd: 'Дата начала цикла должна быть после даты окончания предыдущего цикла',
      cycleDateStartInvalid: 'Дата начала цикла недействительна',
      cycleDateStartMandatory: 'Дата начала цикла обязательна',
      cycleDateEndInvalid: 'Дата окончания цикла недействительна',
      cycleDateEndMandatoryExceptForLastCycle: 'Дата окончания цикла обязательна для всех циклов, кроме последнего',
      fieldManualLinksInvalid: 'Неверная ссылка на полевое руководство',
    },

    surveyLabelsImport: {
      invalidHeaders: 'Неверные столбцы: {{invalidHeaders}}',
      cannotFindNodeDef: "Невозможно найти определение атрибута или сущности с именем '{{name}}'",
    },

    taxonomyEdit: {
      codeChangedAfterPublishing: `Опубликованный код изменился: '{{oldCode}}' => '{{newCode}}'`,
      codeDuplicate: 'Дублирующий код {{value}}; $t(validationErrors.rowsDuplicate)',
      codeRequired: 'Код обязателен',
      familyRequired: 'Семейство обязательно',
      genusRequired: 'Род обязателен',
      scientificNameDuplicate: 'Дублирующее научное название {{value}}; $t(validationErrors.rowsDuplicate)',
      scientificNameRequired: 'Научное название обязательно',
      taxaEmpty: 'Пустые таксоны',
      vernacularNamesDuplicate: `Дублирующее местное название '{{name}}' для языка '{{lang}}'`,
    },

    taxonomyImportJob: {
      duplicateExtraPropsColumns: 'Дублирующие столбцы дополнительной информации: {{duplicateColumns}}',
      invalidExtraPropColumn:
        'Неверное имя столбца дополнительной информации "{{columnName}}": оно не может быть зарезервированным словом',
      missingRequiredColumns: 'Отсутствуют обязательные столбцы: {{columns}}',
    },

    user: {
      emailRequired: 'Электронная почта обязательна',
      emailInvalid: 'Неверный адрес электронной почты',
      emailNotFound: 'Адрес электронной почты не найден',
      groupRequired: 'Группа обязательна',
      nameRequired: 'Имя обязательно',
      titleRequired: 'Звание обязательно',
      passwordRequired: 'Пароль обязателен',
      passwordInvalid: 'Пароль не должен содержать пробелов',
      passwordUnsafe: 'Пароль должен быть не менее 8 символов и содержать строчные буквы, прописные буквы и цифры',
      passwordsDoNotMatch: `Пароли не совпадают`,

      userNotFound: 'Пользователь не найден. Убедитесь, что email и пароль верны',
      passwordChangeRequired: 'Требуется смена пароля',
      passwordResetNotAllowedWithPendingInvitation: `Сброс пароля не разрешен: пользователь был приглашен в опрос, но приглашение еще не принято`,
    },

    userAccessRequest: {
      countryRequired: 'Страна обязательна',
      emailRequired: '$t(validationErrors.user.emailRequired)',
      firstNameRequired: 'Имя обязательно',
      institutionRequired: 'Учреждение обязательна',
      lastNameRequired: 'Фамилия обязательна',
      purposeRequired: 'Цель обязательна',
      surveyNameRequired: 'Название опроса обязательно',
      invalidRequest: 'Неверный запрос на доступ пользователя',
      userAlreadyExisting: 'Пользователь с адресом электронной почты {{email}} уже существует',
      requestAlreadySent: `Запрос на доступ для пользователя с адресом электронной почты {{email}} уже отправлен`,
      invalidReCaptcha: 'Неверная ReCaptcha',
    },

    userAccessRequestAccept: {
      accessRequestAlreadyProcessed: 'Запрос на доступ пользователя уже обработан',
      accessRequestNotFound: 'Запрос на доступ пользователя не найден',
      emailRequired: '$t(validationErrors.user.emailRequired)',
      emailInvalid: '$t(validationErrors.user.emailInvalid)',
      roleRequired: 'Роль обязательна',
      surveyNameRequired: 'Название опроса обязательно',
    },

    userPasswordChange: {
      oldPasswordRequired: 'Старый пароль обязателен',
      oldPasswordWrong: 'Старый пароль неверен',
      newPasswordRequired: 'Новый пароль обязателен',
      confirmPasswordRequired: 'Подтверждение пароля обязательно',
      confirmedPasswordNotMatching: 'Новый пароль и подтверждение пароля не совпадают',
    },
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
      'max-count': 'максимальное количество',
      'min-count': 'минимальное количество',
      'relevant-if': 'актуально, если',
      validations: 'правило проверки',
      'validations-apply-if': 'применить правило проверки, если',
    },

    selectAFunction: 'Выберите функцию',

    valueType: {
      constant: 'Константа',
      expression: 'Выражение',
    },
  },
}
