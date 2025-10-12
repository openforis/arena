export default {
  cannotGetChild: "Не удается получить дочерний элемент '{{childName}}' из атрибута {{name}}",
  cannotImportFilesExceedingQuota: 'Невозможно импортировать файлы записей: будет превышена квота хранения файлов',
  cannotInsertFileExceedingQuota: 'Невозможно вставить файл: будет превышена квота хранения файлов',
  cannotOverridePublishedTaxa: 'Невозможно перезаписать опубликованные таксоны',
  cantUpdateStep: 'Не удается обновить шаг',
  chainCannotBeSaved: 'Цепочка недействительна и не может быть сохранена',
  csv: {
    emptyHeaderFound: 'Обнаружен пустой заголовок в столбце {{columnPosition}}',
    emptyHeaders: 'Обнаружены пустые заголовки',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      'Ошибка экспорта данных (слишком много элементов). Попробуйте экспортировать данные в формате CSV.',
    noRecordsMatchingSearchCriteria: 'Нет записей, соответствующих критериям поиска',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Импорт данных из Arena Mobile не разрешен',
  },
  entryDataNotFound: 'Данные записи не найдены: {{entryName}}',
  expression: {
    identifierNotFound: 'Идентификатор не найден',
    undefinedFunction: 'Неопределенная функция',
  },
  functionHasTooFewArguments: 'Функция {{fnName}} требует как минимум {{minArity}} (получено {{numArgs}})',
  functionHasTooManyArguments: 'Функция {{fnName}} принимает не более {{maxArity}} (получено {{numArgs}})',
  generic: 'Неожиданная ошибка: {{text}}',
  importingDataIntoWrongCollectSurvey: 'Импорт данных в неверный опрос Collect. Ожидаемый URI: {{collectSurveyUri}}',
  invalidType: 'Неверный тип {{type}}',
  jobCanceledOrErrorsFound: 'Задача отменена или обнаружены ошибки; откат транзакции',
  paramIsRequired: 'Параметр {{param}} обязателен',
  unableToFindParent: 'Не удается найти родителя {{name}}',
  unableToFindNode: 'Не удается найти узел с именем {{name}}',
  unableToFindSibling: 'Не удается найти родственный элемент с именем {{name}}',
  undefinedFunction: "Неопределенная функция '{{fnName}}' или неверные типы параметров",
  invalidSyntax: 'Недопустимый синтаксис выражения',
  networkError: 'Ошибка связи с сервером',
  record: {
    errorUpdating: 'Ошибка при обновлении записи',
    entityNotFound: 'Сущность "{{entityName}}" с ключами "{{keyValues}}" не найдена',
    updateSelfAndDependentsDefaultValues:
      'Ошибка обновления записи; ошибка при оценке выражения в узле {{nodeDefName}}: {{details}}',
  },
  sessionExpiredRefreshPage: 'Срок действия сеанса мог истечь.\nПопробуйте обновить страницу.',
  survey: {
    nodeDefNameNotFound: 'Определение узла не найдено: {{name}}',
  },
  unsupportedFunctionType: 'Неподдерживаемый тип функции: {{exprType}}',
  userHasPendingInvitation:
    "У пользователя с адресом электронной почты '{{email}}' уже есть ожидающее приглашение; его/ее нельзя пригласить в этот опрос, пока оно не будет принято",
  userHasRole: 'Данный пользователь уже имеет роль в этом опросе',
  userHasRole_other: 'Данные пользователи уже имеют роль в этом опросе',
  userInvalid: 'Неверный пользователь',
  userIsAdmin: 'Данный пользователь уже является системным администратором',
  userNotAllowedToChangePref: 'Пользователю не разрешено изменять настройки',
  userNotAuthorized: 'Пользователь {{userName}} не авторизован',
}
