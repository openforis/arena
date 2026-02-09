export default {
  authenticatorCodeOne: 'Код аутентификатора 1',
  authenticatorCodeTwo: 'Код аутентификатора 2',
  authenticatorCodeTwoInfo: 'Подождите 30 секунд и введите второй код',
  create: {
    label: 'Создать',
  },
  deletion: {
    confirm: 'Вы уверены, что хотите удалить устройство "{{deviceName}}"?',
    error: 'Ошибка удаления устройства: {{message}}',
    successful: 'Устройство успешно удалено',
  },
  deviceName: 'Имя устройства',
  enabled: 'Включено',
  error: {
    fetchDevice: 'Ошибка получения данных устройства: {{message}}',
    createDevice: 'Ошибка создания устройства: {{message}}',
    updateDevice: 'Ошибка обновления устройства: {{message}}',
  },
  showSecretKey: 'Показать секретный ключ',
  validation: {
    label: 'Проверить',
    successful: 'Устройство успешно подтверждено',
    error: 'Неверные коды аутентификатора',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Установите приложение-аутентификатор',
      description:
        'Установите приложение-аутентификатор на мобильное устройство (например, Google Authenticator, Authy и т. д.).',
    },
    scanCode: {
      title: 'Сканировать QR-код',
      description: 'Используйте приложение-аутентификатор для сканирования QR-кода.',
      descriptionAlternative: 'В качестве альтернативы можно ввести секретный ключ в приложении-аутентификаторе.',
    },
    typeAuthenticatorCodes: {
      title: 'Введите коды аутентификатора',
      description:
        'Введите два последовательных кода, сгенерированных приложением-аутентификатором, чтобы подтвердить устройство.',
    },
  },
}
