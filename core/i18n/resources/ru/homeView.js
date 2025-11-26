export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Активный опрос не выбран</title>
      <p><label>Пожалуйста, выберите один из</label><linkToSurveys>Списка опросов</linkToSurveys> или <linkToNewSurvey>Создайте новый</linkToNewSurvey></p>`,
    activeUsers: 'Активные пользователи',
    activityLog: {
      title: 'Журнал активности',
      size: '$t(homeView:dashboard.activityLog.title) размер: {{size}}',
    },
    deleteActivityLog: 'Очистить журнал активности',
    deleteActivityLogDataConfirm: {
      headerText: 'Очистить ВСЕ данные журнала активности для этого опроса?',
      message: `
  - БУДУТ удалены ВСЕ данные журнала активности для опроса **{{surveyName}}**;\n\n
  - место, занимаемое опросом в БД, будет сокращено;\n\n
  - это не повлияет на введенные данные опроса;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Введите название этого опроса для подтверждения:',
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
}
