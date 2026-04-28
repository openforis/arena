export default {
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
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
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

  message: {
    bodyRequired: 'Текст обязателен',
    subjectRequired: 'Тема обязательна',
    notificationTypeRequired: 'Тип уведомления обязателен',
    targetsRequired: 'Требуется как минимум одна целевая аудитория',
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

  surveyPreloadedMapLayer: {
    fileRequired: 'Файл обязателен',
    fileNameDuplicate: 'Другой файл с таким же именем уже существует',
    labelsRequired: 'Требуется хотя бы одна метка',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Неверные столбцы: {{invalidHeaders}}',
    cannotFindNodeDef: "Невозможно найти определение атрибута или сущности с именем '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Опубликованный код изменился: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Дублирующий код {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Код обязателен',
    familyRequired: 'Семейство обязательно',
    genusRequired: 'Род обязателен',
    scientificNameDuplicate: 'Дублирующее научное название {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Научное название обязательно',
    taxaEmpty: 'Пустые таксоны',
    vernacularNamesDuplicate: `Дублирующее местное название '{{name}}' для языка '{{lang}}'`,
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Дублирующие столбцы дополнительной информации: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Неверное имя столбца дополнительной информации "{{columnName}}": оно не может быть зарезервированным словом',
    missingRequiredColumns: 'Отсутствуют обязательные столбцы: {{columns}}',
    reservedScientificName:
      'Научное название "{{scientificName}}" зарезервировано и не может использоваться; оно будет автоматически добавлено в таксономию.',
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
    emailRequired: '$t(validationErrors:user.emailRequired)',
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
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
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

  userInvite: {
    messageContainsLinks: 'Приглашение не может содержать ссылки',
    messageTooLong: 'Сообщение приглашения слишком длинное (максимум {{maxLength}} символов)',
  },

  user2FADevice: {
    nameDuplicate: 'Устройство с таким именем уже существует',
    nameRequired: 'Требуется имя устройства',
  },
}
