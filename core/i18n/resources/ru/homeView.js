export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Активный опрос не выбран</title>
      <p><label>Пожалуйста, выберите один из</label><linkToSurveys>Списка опросов</linkToSurveys> или <linkToNewSurvey>Создайте новый</linkToNewSurvey></p>`,
    activeUsers: 'Активные пользователи',
    activityLog: {
      title: 'Журнал активности',
      size: '$t(homeView:dashboard.activityLog.title) размер: {{size}}',
      loadError: 'Не удалось загрузить активность.',
      empty: 'Активности пока нет.',
    },
    exportWithData: 'Экспорт + данные (резервная копия)',
    exportWithDataNoActivityLog: 'Экспорт + данные (БЕЗ журнала активности)',
    exportWithDataNoResultAttributes: 'Экспорт + данные (БЕЗ атрибутов результата)',
    surveyPropUpdate: {
      main: `<title>Добро пожаловать в Arena</title>
  
        <p>Сначала вам нужно установить <strong>название</strong> и <strong>метку</strong> опроса.</p>
        
        <p>Нажмите ниже на <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon> или на название опроса:<basicLink>{{surveyName}}</basicLink></p>
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
      title: 'Использование хранилища',
      availableSpace: 'Доступно ({{size}})',
      usedSpace: 'Использовано ({{size}})',
      usedSpaceOutOf: `Использовано {{percent}}% ({{used}} из {{total}})`,
    },
    storageSummaryDb: {
      title: 'Использование хранилища (База данных)',
    },
    storageSummaryFiles: {
      title: 'Использование хранилища (файлы)',
    },
    samplingPointDataCompletion: {
      title: 'Завершение данных по точкам выборки',
      totalItems: 'Всего элементов: {{totalItems}}',
      remainingItems: 'Оставшиеся элементы',
    },
    kpi: {
      records: 'Записи',
      contributors: 'Участники',
      storage: 'Хранилище',
      expandDetails: 'Показать подробности',
      collapseDetails: 'Скрыть подробности',
    },
    recordsCard: {
      total: 'Записи, добавленные за выбранный период',
      byStep: 'По этапу рабочего процесса (за всё время)',
    },
    contributorsCard: {
      active: 'Активные участники за выбранный период: {{count}}',
    },
    map: {
      title: 'Карта',
      allOwners: 'Все владельцы',
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
  landing: {
    openDashboard: 'Открыть панель',
  },
  surveyInfo: {
    basic: 'Основная информация',
    branding: {
      title: 'Брендинг',
      primaryColor: 'Основной цвет',
      titleFontSize: 'Размер шрифта заголовка',
      descriptionFontSize: 'Размер шрифта описания',
      fontSizePreset: {
        small: 'Мелкий',
        default: 'По умолчанию',
        large: 'Крупный',
      },
      surveyLogo1: 'Логотип опроса 1',
      surveyLogo2: 'Логотип опроса 2',
      surveyLogo3: 'Логотип опроса 3',
      landingBackground: 'Фоновое изображение стартовой страницы',
      uploadLogo: 'Загрузить логотип',
      logoFileFormatHint: 'PNG, JPEG, WebP или SVG (макс. {{maxMb}} МБ)',
      logoFileTooLarge: 'Размер изображения логотипа не должен превышать {{maxMb}} МБ',
      preview: 'Предпросмотр',
      backgroundFileTooLarge: 'Размер фонового изображения не должен превышать {{maxMb}} МБ',
      invalidPrimaryColor: 'Введите допустимый цвет #RRGGBB или оставьте пустым',
      invalidSaveBlocked: 'Исправьте недопустимые поля брендинга перед сохранением информации об опросе',
      imageLoadError: 'Не удалось загрузить изображение "{{name}}". Удалите его и загрузите новое.',
      imageLoadErrorReadOnly: 'Не удалось загрузить изображение "{{name}}"',
      downloadImage: 'Нажмите, чтобы скачать изображение',
    },
    configuration: {
      title: 'Конфигурация',
      filesTotalSpace: 'Общий объем файлов (ГБ)',
    },
    confirmDeleteCycleHeader: 'Удалить этот цикл?',
    confirmDeleteCycle: `Вы уверены, что хотите удалить цикл {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
Если к этому циклу привязаны записи, они будут удалены.`,
    cycleForArenaMobile: 'Цикл для Arena Mobile',
    keepNonApplicableValues: `Сохранять значения неактуальных атрибутов`,
    keepNonApplicableValuesInfo: `Если флажок не установлен (по умолчанию), при вводе данных значения атрибутов, которые стали неактуальными, удаляются (после подтверждения пользователем).
Если флажок установлен, эти значения сохраняются в записи, даже если атрибуты больше не актуальны.`,
    deleteActivityLog: 'Очистить журнал активности',
    deleteActivityLogConfirm: {
      headerText: 'Очистить ВСЕ данные журнала активности для этого опроса?',
      message: `
  - БУДУТ удалены ВСЕ данные журнала активности для опроса **{{surveyName}}**;\n\n
  - место, занимаемое опросом в БД, будет сокращено;\n\n
  - это не повлияет на введенные данные опроса;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Введите название этого опроса для подтверждения:',
    },
    fieldManualLink: 'Ссылка на полевое руководство',
    map: 'Карта',
    editInfo: 'Редактировать информацию',
    viewInfo: 'Просмотреть информацию',

    preloadedMapLayers: {
      enabledMessage: 'Включены предзагруженные слои карты',
      title: 'Предзагруженные слои карты',
      fileName: 'Имя файла',
      fileSize: 'Размер файла',
      confirmDelete: 'Вы уверены, что хотите удалить этот предзагруженный слой карты?',
      editor: {
        title: 'Предзагруженный слой карты',
      },
    },

    surveyDocLayout: {
      tabTitle: 'Макет документа',
      title: 'Изображения документа',
      layoutOptions: {
        title: 'Параметры макета',
        headerOnFirstPageOnly: 'Верхний колонтитул только на первой странице',
        pageNumbering: 'Нумерация страниц',
      },
      documentPlace: 'Место',
      documentPlaceValues: {
        header: 'Верхний колонтитул',
        footer: 'Нижний колонтитул',
      },
      applyIf: 'Применить если условие',
      confirmDelete: 'Вы уверены, что хотите удалить это изображение документа?',
      editor: {
        title: 'Изображение документа',
      },
    },

    preferredLanguage: 'Предпочитаемый язык',
    sampleBasedImageInterpretation: 'Интерпретация изображений на основе образцов',
    sampleBasedImageInterpretationEnabled: 'Интерпретация изображений на основе образцов включена',
    security: {
      title: 'Безопасность',
      dataEditorViewNotOwnedRecordsAllowed: 'Редактор данных может просматривать не свои записи',
      dataAnalystViewNotOwnedRecordsAllowed: 'Аналитик данных может просматривать не свои записи',
      visibleInMobile: 'Видно в Arena Mobile',
      allowRecordsDownloadInMobile: 'Разрешить загрузку записей с сервера в Arena Mobile',
      allowRecordsUploadFromMobile: 'Разрешить загрузку записей из Arena Mobile на сервер',
      allowRecordsWithErrorsUploadFromMobile:
        'Разрешить загрузку записей с ошибками проверки из Arena Mobile на сервер',
      allowRecordsMergeWithSameKeys:
        'Разрешить объединение записей с одинаковыми ключами (например, записей, созданных на разных устройствах с Arena Mobile)',
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
}
