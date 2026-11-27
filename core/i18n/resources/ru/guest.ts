export default {
  loginView: {
    title: 'Вход',
    subtitle: 'Добро пожаловать! Введите свои учетные данные, чтобы продолжить работу в $t(common.appNameFull).',
    backToLogin: 'Вернуться ко входу',
    noAccountYet: 'Ещё нет учётной записи?',
    createAccount: 'Создать учётную запись',
    invitedToSurvey:
      'Вас пригласили в обследование? Создавать учётную запись не нужно: откройте ссылку в письме-приглашении и следуйте инструкциям.',
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
  externalLogin: {
    signInWith: 'Войти через {{provider}}',
    continueWith: 'Продолжить через {{provider}}',
    registeredUsersOnly: 'Только для зарегистрированных пользователей',
    errors: {
      providerNotAvailable:
        'Этот способ входа недоступен. Повторите попытку позже или войдите с помощью электронной почты и пароля.',
      flowInvalid: 'Срок входа истёк, или вход был начат в другом браузере. Повторите попытку.',
      providerError: 'Не удалось войти через внешнего провайдера. Повторите попытку.',
      emailNotVerified:
        'Провайдер не подтвердил ваш адрес электронной почты, поэтому его нельзя сопоставить с учётной записью. Войдите с паролем и привяжите провайдера в своём профиле.',
      emailDomainNotAllowed: 'Учётные записи с этим почтовым доменом не могут использовать этот способ входа.',
      userNotFound:
        'Учётной записи с этим адресом электронной почты нет. Попросите приглашение у администратора обследования или запросите доступ.',
      userNotFoundCreateAccount:
        'Учётной записи с этим адресом электронной почты нет. Сначала создайте учётную запись или попросите приглашение у администратора обследования.',
      ambiguousEmail:
        'Этому адресу электронной почты соответствует несколько учётных записей. Войдите с паролем и привяжите провайдера в своём профиле.',
      identityAlreadyLinked: 'Эта учётная запись провайдера уже привязана к другому пользователю.',
      providerAlreadyLinked:
        'К вашему пользователю уже привязана другая учётная запись этого провайдера: сначала отвяжите её в профиле.',
      invitationInvalid: 'Приглашение недействительно или истекло. Попросите новое у администратора обследования.',
      invalidTwoFactorCode: 'Неверный код подтверждения.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'Что дальше?',
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
          'Вы получите письмо от **{{senderEmail}}** со ссылкой для доступа к $t(common.appName). Нет во входящих? Проверьте папку «Спам», затем добавьте отправителя в контакты или отметьте письмо как «не спам».',
        descriptionWithoutSender:
          'Вы получите письмо со ссылкой для доступа к $t(common.appName). Нет во входящих? Проверьте папку «Спам», затем добавьте отправителя в контакты или отметьте письмо как «не спам».',
      },
      startWorking: {
        title: 'Начните работу',
        description: 'Вы станете администратором нового обследования и сможете создать до 5 обследований.',
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
    surveyNameHint:
      'Название обозначает обследование на всей платформе $t(common.appName) и должно быть уникальным: выберите конкретное название (например, kenya_nfi_2026), а не общее, вроде «survey» или «test». Только строчные буквы, цифры и подчёркивания.',
    sendRequest: 'Отправить запрос',
    sendRequestConfirm: 'Запросить доступ к $t(common.appNameFull)?',
    templateNotSelected: 'Не выбрано (начать с нуля)',
    title: 'Запрос доступа',
    whitelistSenderSuggestion:
      'Если вы найдете его в папке «Спам», добавьте **{{senderEmail}}** в свои контакты (адресную книгу) или отметьте письмо как безопасное/не спам, чтобы наши следующие письма попадали прямо во входящие.',
  },
  registrationView: {
    title: 'Создать учётную запись',
    introduction:
      'Создайте учётную запись и своё первое обследование: расскажите, что вы хотите делать в $t(common.appName)!',
    createAccount: 'Создать учётную запись',
    createAccountConfirm: 'Создать учётную запись в $t(common.appNameFull)?',
    accountCreated: 'Учётная запись создана',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Откройте ссылку в письме, чтобы подтвердить адрес электронной почты и завершить регистрацию: выберите пароль или войдите с помощью одного из доступных способов входа (например, Google).

Спасибо, и приятной работы с **$t(common.appNameFull)**!`,
    error: 'Ошибка при создании учётной записи: {{error}}',
    steps: {
      createAccount: {
        title: 'Создайте учётную запись',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'Подтвердите адрес почты',
        description:
          'Вы получите письмо от **{{senderEmail}}** со ссылкой для завершения регистрации. Нет во входящих? Проверьте папку «Спам», затем добавьте отправителя в контакты или отметьте письмо как «не спам».',
        descriptionWithoutSender:
          'Вы получите письмо со ссылкой для завершения регистрации. Нет во входящих? Проверьте папку «Спам», затем добавьте отправителя в контакты или отметьте письмо как «не спам».',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
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
    },
    tags: {
      forestInventories: 'Лесные инвентаризации',
      questionnaires: 'Анкеты',
      multiCycle: 'Многоцикловость',
      statisticalAnalysis: 'Статистический анализ',
    },
  },
  footer: {
    website: 'О $t(common.appName)',
    userManual: 'Руководство пользователя',
    supportForum: 'Форум поддержки',
    version: 'Версия {{version}}',
  },
}
