export default {
  authGroups: {
    systemAdmin: {
      label: 'Системный администратор',
      label_plural: 'Системные администраторы',
      description: 'Системные администраторы OF Arena',
    },
    surveyManager: {
      label: 'Менеджер опроса',
      label_plural: 'Менеджеры опросов',
      description: 'Менеджеры опросов OF Arena',
    },
    surveyAdmin: {
      label: 'Администратор опроса',
      label_plural: 'Администраторы опросов',
      description: 'Полные права',
    },
    surveyEditor: {
      label: 'Редактор опросов',
      label_plural: 'Редакторы опросов',
      description: 'Может редактировать опрос, записи, приглашать пользователей',
    },
    dataEditor: {
      label: 'Редактор данных',
      label_plural: 'Редакторы данных',
      description: 'Может редактировать записи на этапе ввода данных',
    },
    dataCleanser: {
      label: 'Очиститель данных',
      label_plural: 'Очистители данных',
      description: 'Может редактировать записи на этапе очистки данных',
    },
    dataAnalyst: {
      label: 'Аналитик данных',
      label_plural: 'Аналитики данных',
      description: 'Может редактировать записи на этапе анализа данных',
    },
    surveyGuest: {
      label: 'Гость опроса',
      label_plural: 'Гости опроса',
      description: 'Может просматривать записи',
    },
  },
}
