export default {
  authenticatorCodeOne: 'Баталгаажуулагчийн код 1',
  authenticatorCodeTwo: 'Баталгаажуулагчийн код 2',
  authenticatorCodeTwoInfo: '30 секунд хүлээгээд хоёр дахь кодыг оруулна уу',
  create: {
    label: 'Үүсгэх',
  },
  deletion: {
    confirm: '"{{deviceName}}" төхөөрөмжийг устгахдаа итгэлтэй байна уу?',
    error: 'Төхөөрөмж устгах үед алдаа гарлаа: {{message}}',
    successful: 'Төхөөрөмж амжилттай устгав',
  },
  deviceName: 'Төхөөрөмжийн нэр',
  enabled: 'Идэвхтэй',
  error: {
    fetchDevice: 'Төхөөрөмжийн дэлгэрэнгүйг авахад алдаа гарлаа: {{message}}',
    createDevice: 'Төхөөрөмж үүсгэх үед алдаа гарлаа: {{message}}',
    updateDevice: 'Төхөөрөмжийг шинэчлэх үед алдаа гарлаа: {{message}}',
  },
  showSecretKey: 'Нууц түлхүүрийг харуулах',
  validation: {
    label: 'Баталгаажуулах',
    successful: 'Төхөөрөмж амжилттай баталгаажлаа',
    error: 'Баталгаажуулагчийн код буруу байна',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Баталгаажуулагч апп суулгах',
      description: 'Мобайл төхөөрөмждөө баталгаажуулагч апп суулгаарай (ж. Google Authenticator, Authy гэх мэт).',
    },
    scanCode: {
      title: 'QR код скан хийх',
      description: 'Баталгаажуулагч апп-аа ашиглан QR кодыг скан хийнэ үү.',
      descriptionAlternative: 'Эсвэл нууц түлхүүрийг баталгаажуулагч апп-д гараар оруулж болно.',
    },
    typeAuthenticatorCodes: {
      title: 'Баталгаажуулагчийн код оруулах',
      description: 'Баталгаажуулагч апп-аас гарсан дараалсан хоёр кодыг оруулж төхөөрөмжийг баталгаажуулна уу.',
    },
  },
}
