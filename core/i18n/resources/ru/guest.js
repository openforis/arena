export default {
  loginView: {
    yourName: 'Ваше имя',
    yourEmail: 'Ваш адрес электронной почты',
    yourPassword: 'Ваш пароль',
    yourNewPassword: 'Ваш новый пароль',
    repeatYourPassword: 'Повторите ваш пароль',
    repeatYourNewPassword: 'Повторите ваш новый пароль',
    requestAccess: 'Впервые в $t(common.appNameFull)? Запросить доступ',
    resetPassword: 'Сбросить пароль',
    login: 'Войти',
    loginUsingBackupCode: 'Войти с помощью резервного кода 2FA',
    forgotPassword: 'Забыли пароль',
    sendPasswordResetEmail: 'Отправить письмо для сброса пароля',
    twoFactorBackupCode: 'Резервный код 2FA',
    twoFactorToken: 'Код подтверждения',
    twoFactorTokenDescription: `Чтобы обеспечить безопасность вашей учетной записи, мы подтверждаем вашу личность.

  Введите код, сгенерированный вашим приложением-аутентификатором.`,
  },
  accessRequestView: {
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
    introduction: `Наши ресурсы ограничены, поэтому вы должны запросить доступ к платформе.
Нам также интересно, что вы хотите с ней делать, поэтому, пожалуйста, сообщите нам!
У вас есть возможность начать с **нового пустого опроса** или клонировать существующий **шаблон**, и вам нужно будет предложить название для вновь созданного опроса.
Вам будет назначена роль ***Администратора опроса*** для этого опроса: вы сможете редактировать его и приглашать новых пользователей присоединяться к вашему опросу и вносить свой вклад.
Вы также будете ***Менеджером опросов*** и сможете **создавать новые опросы** (до 5), если потребуется.
Для получения дополнительной информации, пожалуйста, посетите наш веб-сайт: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**После отправки запроса, пожалуйста, дождитесь приглашения по электронной почте для доступа к Arena.**`,
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
    title: 'Запрос доступа к $t(common.appNameFull)',
    whitelistSenderSuggestion:
      'Если вы найдете его в папке «Спам», добавьте **{{senderEmail}}** в свои контакты (адресную книгу) или отметьте письмо как безопасное/не спам, чтобы наши следующие письма попадали прямо во входящие.',
  },
  resetPasswordView: {
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
}
