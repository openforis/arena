export default {
  loginView: {
    title: 'Нэвтрэх',
    subtitle: 'Тавтай морил! $t(common.appNameFull)-д нэвтрэхийн тулд мэдээллээ оруулна уу.',
    backToLogin: 'Нэвтрэх хуудас руу буцах',
    newToArena: '$t(common.appNameFull)-д шинээр ирсэн үү?',
    or: 'эсвэл',
    twoFactorTitle: 'Хоёр шаттай баталгаажуулалт',
    verify: 'Баталгаажуулах',
    lostYourDevice: 'Баталгаажуулах аппликейшнаа ашиглаж чадахгүй байна уу?',
    yourName: 'Таны нэр',
    yourEmail: 'Таны имэйл',
    yourPassword: 'Таны нууц үг',
    yourNewPassword: 'Таны шинэ нууц үг',
    repeatYourPassword: 'Нууц үгээ давтана уу',
    repeatYourNewPassword: 'Шинэ нууц үгээ давтана уу',
    requestAccess: 'Хандалтын хүсэлт илгээх',
    resetPassword: 'Нууц үг сэргээх',
    login: 'Нэвтрэх',
    loginUsingBackupCode: 'Нөөц код ашиглах',
    forgotPassword: 'Нууц үгээ мартсан уу?',
    sendPasswordResetEmail: 'Нууц үг сэргээх имэйл илгээх',
    twoFactorBackupCode: '2FA нөөц код',
    twoFactorToken: 'Баталгаажуулах код',
    twoFactorTokenDescription: `Таны бүртгэлийг аюулгүй байлгахын тулд бид таныг баталгаажуулна.

  Таны баталгаажуулагч апп-аас үүсгэсэн кодыг оруулна уу.`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'Бүртгэлтэй юу?',
    steps: {
      sendRequest: {
        title: 'Хүсэлт илгээх',
        description: 'Анхны судалгааныхаа нэрийг санал болгоно уу: хоосон судалгаа эсвэл загвараас эхэлнэ үү.',
      },
      review: { title: 'Бид хянана', description: 'Таны хүсэлтийг боловсруулахад хэдэн өдөр хүлээнэ үү.' },
      invitation: {
        title: 'Урилгаа хүлээн авах',
        description:
          'Та **{{senderEmail}}**-ээс $t(common.appName)-д нэвтрэх холбоос бүхий имэйл хүлээн авна. Ирсэн имэйл хэсэгт байхгүй юу? Спам хавтсыг шалгаад, илгээгчийг харилцагчдаа нэмэх эсвэл имэйлийг спам биш гэж тэмдэглээрэй.',
        descriptionWithoutSender:
          'Та $t(common.appName)-д нэвтрэх холбоос бүхий имэйл хүлээн авна. Ирсэн имэйл хэсэгт байхгүй юу? Спам хавтсыг шалгаад, илгээгчийг харилцагчдаа нэмэх эсвэл имэйлийг спам биш гэж тэмдэглээрэй.',
      },
      startWorking: {
        title: 'Ажлаа эхлүүлэх',
        description: 'Та шинэ судалгааны администратор болж, 5 хүртэл судалгаа үүсгэх боломжтой болно.',
      },
    },
    error: 'Хандалтын хүсэлт гаргахад алдаа гарлаа: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Нэр',
        lastName: 'Овог',
        institution: 'Байгууллага',
        country: 'Улс',
        purpose: 'Та юунд ашиглах хэрэгтэй вэ?',
        surveyName: 'Судалгааны нэр санал болгох',
        templateUuid: 'Загвараас эхлэх үү?',
      },
    },
    introduction:
      'Манай нөөц хязгаарлагдмал тул хандалтыг хүсэлтээр олгодог. $t(common.appName)-аар юу хийхийг хүсч байгаагаа бидэнд хэлээрэй!',
    reCaptchaNotAnswered: 'ReCaptcha хариулагдаагүй',
    requestSent: 'Хандалтын хүсэлт амжилттай илгээгдсэн',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Таны хүсэлтийг боловсруулахад хэдхэн хоног өгнө үү.
Хүсэлт зөвшөөрөгдсөний дараа бид **{{email}}** хаяг руу $t(common.appName) руу хэрхэн нэвтрэх тухай заавар бүхий өөр нэг имэйл илгээх болно.
Баярлалаа, **$t(common.appNameFull)**-г ашиглаарай!`,
    sendRequest: 'Хүсэлт илгээх',
    sendRequestConfirm: '$t(common.appNameFull) руу хандах хүсэлт илгээх үү?',
    templateNotSelected: 'Сонгогдоогүй (эхнээс нь эхлэх)',
    title: 'Хандалтын хүсэлт',
    whitelistSenderSuggestion:
      'Хэрэв та үүнийг Спам/Хэрэггүй имэйлийн хавтаснаас олсон бол **{{senderEmail}}** хаягийг харилцагчдын жагсаалтдаа (хаягийн дэвтэр) нэмэх эсвэл аюулгүй/спам биш гэж тэмдэглэнэ үү. Ингэснээр бидний дараагийн имэйлүүд таны ирсэн имэйлийн хайрцагт шууд очих болно.',
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Эхлэхийн тулд бүртгэлээ тохируулна уу.',
      setYourNewPassword: 'Бүртгэлдээ шинэ нууц үг сонгоно уу.',
    },
    title: {
      completeRegistration: 'Арена дахь бүртгэлээ гүйцээх',
      setYourNewPassword: 'Шинэ нууц үгээ тохируулах',
    },
    setNewPassword: 'Шинэ нууц үг тохируулах',
    forgotPasswordLinkInvalid: 'Таны нэвтрэх гэсэн хуудас байхгүй эсвэл хүчингүй болсон',
    passwordSuccessfullyReset: 'Таны нууц үг амжилттай сэргээгдсэн',
    passwordStrengthChecksTitle: 'Нууц үгийн бат бөх байдлын шалгалт',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Хоосон зай байхгүй',
      atLeast8CharactersLong: 'Наад зах нь 8 тэмдэгтээс бүрдсэн',
      containsLowerCaseLetters: 'Бага үсгүүд агуулсан',
      containsUpperCaseLetters: 'Том үсгүүд агуулсан',
      containsNumbers: 'Тоонууд агуулсан',
    },
    completeRegistration: 'Бүртгэлээ гүйцээх',
  },
  forgotPasswordView: {
    title: 'Нууц үгээ шинэчлэх',
    description: 'Бүртгэлийнхээ имэйл хаягийг оруулна уу, бид шинэ нууц үг сонгох холбоос илгээх болно.',
  },
  pitch: {
    default: {
      title: 'Хээрийн өгөгдөл, цуглуулалтаас дүн шинжилгээ хүртэл.',
      description:
        'Олон хэлний маягт зохиож, олон мөчлөгт тооллогыг удирдаж, өгөгдлийн чанарыг баталгаажуулж, үр дүнг нэгдсэн RStudio-оор шинжилнэ.',
    },
    accessRequest: {
      title: '$t(common.appName)-д анхны судалгаагаа эхлүүлээрэй.',
    },
    tags: {
      forestInventories: 'Ойн тооллого',
      questionnaires: 'Асуулга',
      multiCycle: 'Олон мөчлөг',
      statisticalAnalysis: 'Статистик шинжилгээ',
    },
  },
  footer: {
    website: '$t(common.appName)-ийн тухай',
    userManual: 'Хэрэглэгчийн гарын авлага',
    supportForum: 'Тусламжийн форум',
    version: 'Хувилбар {{version}}',
  },
}
