export default {
  loginView: {
    title: 'Нэвтрэх',
    subtitle: 'Тавтай морил! $t(common.appNameFull)-д нэвтрэхийн тулд мэдээллээ оруулна уу.',
    backToLogin: 'Нэвтрэх хуудас руу буцах',
    noAccountYet: 'Бүртгэл байхгүй юу?',
    createAccount: 'Бүртгэл үүсгэх',
    invitedToSurvey:
      'Судалгаанд уригдсан уу? Бүртгэл үүсгэх шаардлагагүй: урилгын имэйл дэх холбоосыг нээж, алхмуудыг дагана уу.',
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
  externalLogin: {
    signInWith: '{{provider}}-ээр нэвтрэх',
    continueWith: '{{provider}}-ээр үргэлжлүүлэх',
    registeredUsersOnly: 'Зөвхөн бүртгэлтэй хэрэглэгчид',
    errors: {
      providerNotAvailable:
        'Энэ нэвтрэх сонголт одоогоор боломжгүй байна. Дараа дахин оролдох эсвэл имэйл, нууц үгээрээ нэвтэрнэ үү.',
      flowInvalid: 'Нэвтрэлтийн хугацаа дууссан эсвэл өөр хөтөч дээр эхэлсэн байна. Дахин оролдоно уу.',
      providerError: 'Гадаад үйлчилгээ үзүүлэгчээр нэвтэрч чадсангүй. Дахин оролдоно уу.',
      emailNotVerified:
        'Үйлчилгээ үзүүлэгч таны имэйл хаягийг баталгаажуулаагүй тул бүртгэлтэй тааруулах боломжгүй. Нууц үгээрээ нэвтэрч, профайлаасаа үйлчилгээ үзүүлэгчийг холбоно уу.',
      emailDomainNotAllowed: 'Энэ имэйлийн домэйнтэй бүртгэлүүд энэ нэвтрэх сонголтыг ашиглах боломжгүй.',
      userNotFound: 'Энэ имэйл хаягтай бүртгэл байхгүй байна. Судалгааны админаас урилга хүсэх эсвэл хандалт хүснэ үү.',
      userNotFoundCreateAccount:
        'Энэ имэйл хаягтай бүртгэл байхгүй байна. Эхлээд бүртгэл үүсгэх эсвэл судалгааны админаас урилга хүснэ үү.',
      ambiguousEmail:
        'Энэ имэйл хаягт нэгээс олон бүртгэл таарч байна. Нууц үгээрээ нэвтэрч, профайлаасаа үйлчилгээ үзүүлэгчийг холбоно уу.',
      identityAlreadyLinked: 'Үйлчилгээ үзүүлэгчийн энэ бүртгэл өөр хэрэглэгчтэй аль хэдийн холбогдсон байна.',
      providerAlreadyLinked:
        'Энэ үйлчилгээ үзүүлэгчийн өөр бүртгэл таны хэрэглэгчтэй аль хэдийн холбогдсон байна: эхлээд профайлаасаа холболтыг салгана уу.',
      invitationInvalid: 'Урилга хүчингүй эсвэл хугацаа нь дууссан байна. Судалгааны админаас шинэ урилга хүснэ үү.',
      invalidTwoFactorCode: 'Баталгаажуулах код буруу байна.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'Дараа нь юу болох вэ?',
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
        title: '$t(user.title)',
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
    surveyNameHint:
      'Энэ нэр нь $t(common.appName) платформ даяар судалгааг тодорхойлох тул **давтагдашгүй** байх ёстой: "survey", "test" гэх мэт ерөнхий нэр биш, жишээ нь байгууллага эсвэл улс, төсөл, оныг хослуулсан тодорхой нэр сонгоно уу. Зөвхөн жижиг үсэг, тоо, доогуур зураас.',
    sendRequest: 'Хүсэлт илгээх',
    sendRequestConfirm: '$t(common.appNameFull) руу хандах хүсэлт илгээх үү?',
    templateNotSelected: 'Сонгогдоогүй (эхнээс нь эхлэх)',
    title: 'Хандалтын хүсэлт',
    whitelistSenderSuggestion:
      'Хэрэв та үүнийг Спам/Хэрэггүй имэйлийн хавтаснаас олсон бол **{{senderEmail}}** хаягийг харилцагчдын жагсаалтдаа (хаягийн дэвтэр) нэмэх эсвэл аюулгүй/спам биш гэж тэмдэглэнэ үү. Ингэснээр бидний дараагийн имэйлүүд таны ирсэн имэйлийн хайрцагт шууд очих болно.',
  },
  registrationView: {
    title: 'Бүртгэл үүсгэх',
    introduction:
      'Бүртгэл болон анхны судалгаагаа үүсгээрэй: $t(common.appName)-аар юу хийхийг хүсэж байгаагаа бидэнд хэлээрэй!',
    createAccount: 'Бүртгэл үүсгэх',
    createAccountConfirm: '$t(common.appNameFull)-д бүртгэл үүсгэх үү?',
    accountCreated: 'Бүртгэл үүсгэгдлээ',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Имэйл хаягаа баталгаажуулж, бүртгэлээ дуусгахын тулд имэйл дэх холбоосыг нээнэ үү: нууц үгээ сонгох эсвэл боломжтой нэвтрэх аргуудын аль нэгээр (жишээ нь Google) нэвтэрнэ үү.

Баярлалаа, **$t(common.appNameFull)**-ийг сайхан ашиглаарай!`,
    error: 'Бүртгэл үүсгэхэд алдаа гарлаа: {{error}}',
    steps: {
      createAccount: {
        title: 'Бүртгэлээ үүсгэх',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'Имэйлээ баталгаажуулах',
        description:
          'Та **{{senderEmail}}**-ээс бүртгэлээ дуусгах холбоостой имэйл хүлээн авна. Ирсэн мэйлд байхгүй юу? Spam/Junk хавтсыг шалгаад, илгээгчийг харилцагчиддаа нэмэх эсвэл имэйлийг спам биш гэж тэмдэглэнэ үү.',
        descriptionWithoutSender:
          'Та бүртгэлээ дуусгах холбоостой имэйл хүлээн авна. Ирсэн мэйлд байхгүй юу? Spam/Junk хавтсыг шалгаад, илгээгчийг харилцагчиддаа нэмэх эсвэл имэйлийг спам биш гэж тэмдэглэнэ үү.',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
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
