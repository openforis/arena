export default {
  authenticatorCodeOne: 'Баталгаажуулагчийн код 1',
  authenticatorCodeTwo: 'Баталгаажуулагчийн код 2',
  authenticatorCodeTwoInfo: '30 секунд хүлээгээд хоёр дахь кодыг оруулна уу',
  backupCodesRegenerated: {
    title: 'Нөөц код амжилттай дахин үүсгэгдлээ',
    message: `Дараах 8 нөөц кодыг аюулгүй газарт хадгална уу:  
{{backupCodes}}  

Эдгээрийг баталгаажуулагч төхөөрөмждөө нэвтрэх боломжгүй болсон тохиолдолд ашиглан бүртгэлдээ нэвтэрч болно.  
**Нэг нөөц кодыг зөвхөн нэг удаа ашиглаж болно**.  
Нөөц кодуудыг зөвхөн одоо харах боломжтой тул **яг одоо хадгалаарай**.`,
  },
  create: {
    label: 'Үүсгэх',
  },
  creationSuccessful: {
    title: '2FA төхөөрөмж амжилттай үүсгэгдлээ',
    message: `2FA төхөөрөмж "{{deviceName}}" үүсгэгдлээ.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: '"{{deviceName}}" төхөөрөмжийг устгахдаа итгэлтэй байна уу?',
    error: 'Төхөөрөмж устгах үед алдаа гарлаа: {{message}}',
    successful: 'Төхөөрөмж амжилттай устгав',
  },
  deviceName: 'Төхөөрөмжийн нэр',
  deviceNameFinal: 'Auth апп-д харагдах төхөөрөмжийн нэр',
  enabled: 'Идэвхтэй',
  error: {
    fetchDevice: 'Төхөөрөмжийн дэлгэрэнгүйг авахад алдаа гарлаа: {{message}}',
    createDevice: 'Төхөөрөмж үүсгэх үед алдаа гарлаа: {{message}}',
    updateDevice: 'Төхөөрөмжийг шинэчлэх үед алдаа гарлаа: {{message}}',
    regenerateBackupCodes: 'Нөөц код дахин үүсгэх үед алдаа гарлаа: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Нөөц код дахин үүсгэх',
    confirm: `"{{deviceName}}" төхөөрөмжийн нөөц кодыг дахин үүсгэхдээ итгэлтэй байна уу?  
Өмнөх нөөц кодууд цаашид ажиллахгүй.`,
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
