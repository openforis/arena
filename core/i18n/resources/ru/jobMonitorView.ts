export default {
  title: 'Монитор задач',
  activeOnly: 'Только активные задачи',
  noSurvey: '—',
  columns: {
    type: 'Тип',
    status: 'Статус',
    survey: 'Опрос',
    user: 'Пользователь',
    progress: 'Прогресс',
    startedAt: 'Начато',
  },
  status: {
    pending: 'В ожидании',
    running: 'Выполняется',
    succeeded: 'Успешно',
    failed: 'Ошибка',
    canceled: 'Отменено',
  },
  confirmCancelJob: 'Вы уверены, что хотите отменить эту задачу?',
  jobCanceledByAdmin: 'Эта задача была отменена администратором.',
}
