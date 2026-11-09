export default {
  loginView: {
    title: 'Вход',
    subtitle: 'Добро пожаловать! Введите свои учетные данные, чтобы продолжить работу в $t(common.appNameFull).',
    backToLogin: 'Вернуться ко входу',
    newToArena: 'Впервые в $t(common.appNameFull)?',
    or: 'или',
    twoFactorTitle: 'Двухэтапная проверка',
    verify: 'Подтвердить',
    lostYourDevice: 'Не можете воспользоваться приложением-аутентификатором?',
    yourName: 'Ваше имя',
    yourEmail: 'Ваш адрес электронной почты',
    yourPassword: 'Ваш пароль',
    yourNewPassword: 'Ваш новый пароль',
    repeatYourPassword: 'Повторите ваш пароль',
    repeatYourNewPassword: 'Повторите ваш новый пароль',
    requestAccess: 'Запросить доступ',
    resetPassword: 'Сбросить пароль',
    login: 'Войти',
    loginUsingBackupCode: 'Использовать резервный код',
    forgotPassword: 'Забыли пароль?',
    sendPasswordResetEmail: 'Отправить письмо для сброса пароля',
    twoFactorBackupCode: 'Резервный код 2FA',
    twoFactorToken: 'Код подтверждения',
    twoFactorTokenDescription: `Чтобы обеспечить безопасность вашей учетной записи, мы подтверждаем вашу личность.

  Введите код, сгенерированный вашим приложением-аутентификатором.`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'Уже есть учетная запись?',
    steps: {
      sendRequest: {
        title: 'Отправьте запрос',
        description:
          'Предложите название для вашего первого обследования: начните с пустого обследования или с шаблона.',
      },
      review: {
        title: 'Мы его рассмотрим',
        description: 'Пожалуйста, дайте нам пару дней на обработку вашего запроса.',
      },
      invitation: {
        title: 'Получите приглашение',
        description:
          'Вы получите письмо для доступа к $t(common.appName): вы станете администратором нового обследования и сможете создать до 5 обследований.',
      },
    },
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
    introduction:
      'Наши ресурсы ограничены, поэтому доступ предоставляется по запросу. Расскажите нам, что вы хотите делать в $t(common.appName)!',
    reCaptchaNotAnswered: 'ReCaptcha не отвечена',
    requestSent: 'Запрос на доступ успешно отправлен',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Пожалуйста, дайте нам пару дней для обработки вашего запроса.
Как только он будет одобрен, мы отправим еще одно письмо на адрес **{{email}}** с инструкциями по доступу к $t(common.appName).
Спасибо и наслаждайтесь **$t(common.appNameFull)**!`,
    sendRequest: 'Отправить запрос',
    sendRequestConfirm: 'Запросить доступ к $t(common.appNameFull)?',
    templateNotSelected: 'Не выбрано (начать с нуля)',
    title: 'Запрос доступа',
    whitelistSenderSuggestion:
      'Если вы найдете его в папке «Спам», добавьте **{{senderEmail}}** в свои контакты (адресную книгу) или отметьте письмо как безопасное/не спам, чтобы наши следующие письма попадали прямо во входящие.',
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Настройте свою учетную запись, чтобы начать работу.',
      setYourNewPassword: 'Выберите новый пароль для своей учетной записи.',
    },
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
  forgotPasswordView: {
    title: 'Сброс пароля',
    description:
      'Введите адрес электронной почты вашей учетной записи, и мы отправим вам ссылку для выбора нового пароля.',
  },
  pitch: {
    default: {
      title: 'Полевые данные: от сбора до анализа.',
      description:
        'Создавайте многоязычные формы, ведите многоцикловые инвентаризации, проверяйте качество данных и анализируйте результаты во встроенном RStudio.',
    },
    accessRequest: {
      title: 'Создайте своё первое обследование в $t(common.appName).',
      description:
        'Расскажите нам о своем проекте. После одобрения вы сможете создавать формы, приглашать полевые группы и анализировать данные в одном месте.',
    },
    tags: {
      forestInventories: 'Лесные инвентаризации',
      questionnaires: 'Анкеты',
      multiCycle: 'Многоцикловость',
      statisticalAnalysis: 'Статистический анализ',
      freeAndOpenSource: 'Свободное ПО с открытым кодом',
      openForis: 'ФАО · Open Foris',
      upToFiveSurveys: 'До 5 обследований',
    },
  },
  footer: {
    website: 'О $t(common.appName)',
    userManual: 'Руководство пользователя',
    supportForum: 'Форум поддержки',
    version: 'Версия {{version}}',
  },
}
