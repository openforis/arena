export default {
  authGroups: {
    systemAdmin: {
      label: 'Системный администратор',
      label_other: 'Системные администраторы',
      description: 'Системные администраторы OF Arena',
    },
    surveyManager: {
      label: 'Менеджер опроса',
      label_other: 'Менеджеры опросов',
      description: 'Менеджеры опросов OF Arena',
    },
    surveyAdmin: {
      label: 'Администратор опроса',
      label_other: 'Администраторы опросов',
      description: 'Полные права',
    },
    surveyEditor: {
      label: 'Редактор опросов',
      label_other: 'Редакторы опросов',
      description: 'Может редактировать опрос, записи, приглашать пользователей',
    },
    dataEditor: {
      label: 'Редактор данных',
      label_other: 'Редакторы данных',
      description: 'Может редактировать записи на этапе ввода данных',
    },
    dataCleanser: {
      label: 'Очиститель данных',
      label_other: 'Очистители данных',
      description: 'Может редактировать записи на этапе очистки данных',
    },
    dataAnalyst: {
      label: 'Аналитик данных',
      label_other: 'Аналитики данных',
      description: 'Может редактировать записи на этапе анализа данных',
    },
    surveyGuest: {
      label: 'Гость опроса',
      label_other: 'Гости опроса',
      description: 'Может просматривать записи',
    },
  },
}
