export default {
  authenticatorCodeOne: 'Код аутентификатора 1',
  authenticatorCodeTwo: 'Код аутентификатора 2',
  authenticatorCodeTwoInfo: 'Подождите 30 секунд и введите второй код',
  backupCodesRegenerated: {
    title: 'Резервные коды успешно обновлены',
    message: `Пожалуйста, сохраните следующие 8 резервных кодов в безопасном месте:  
{{backupCodes}}  

Используйте их для доступа к аккаунту, если вы потеряете доступ к устройству-аутентификатору.  
**Каждый резервный код можно использовать только один раз**.  
Их можно увидеть только сейчас, поэтому **сохраните их сейчас**.`,
  },
  create: {
    label: 'Создать',
  },
  creationSuccessful: {
    title: 'Устройство 2FA успешно создано',
    message: `Устройство 2FA "{{deviceName}}" создано.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Вы уверены, что хотите удалить устройство "{{deviceName}}"?',
    error: 'Ошибка удаления устройства: {{message}}',
    successful: 'Устройство успешно удалено',
  },
  deviceName: 'Имя устройства',
  deviceNameFinal: 'Имя устройства, отображаемое в приложении',
  enabled: 'Включено',
  error: {
    fetchDevice: 'Ошибка получения данных устройства: {{message}}',
    createDevice: 'Ошибка создания устройства: {{message}}',
    updateDevice: 'Ошибка обновления устройства: {{message}}',
    regenerateBackupCodes: 'Ошибка обновления резервных кодов: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Обновить резервные коды',
    confirm: `Вы уверены, что хотите обновить резервные коды для устройства "{{deviceName}}"?  
Предыдущие резервные коды больше не будут работать.`,
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
