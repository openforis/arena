export default {
  title: 'Ажлын хяналт',
  activeOnly: 'Зөвхөн идэвхтэй ажлууд',
  noSurvey: '—',
  columns: {
    type: 'Төрөл',
    status: 'Төлөв',
    survey: 'Судалгаа',
    user: 'Хэрэглэгч',
    progress: 'Явц',
    elapsed: 'Өнгөрсөн хугацаа',
    remaining: 'Үлдсэн хугацаа (тооцоолсон)',
    startedAt: 'Эхэлсэн огноо',
  },
  status: {
    pending: 'Хүлээгдэж байна',
    running: 'Ажиллаж байна',
    succeeded: 'Амжилттай',
    failed: 'Амжилтгүй',
    canceled: 'Цуцлагдсан',
  },
  confirmCancelJob: 'Та энэ ажлыг цуцлахдаа итгэлтэй байна уу?',
  jobCanceledByAdmin: 'Энэ ажлыг администратор цуцалсан байна.',
}
