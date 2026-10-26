export default {
  loginView: {
    yourName: 'Таны нэр',
    yourEmail: 'Таны имэйл',
    yourPassword: 'Таны нууц үг',
    yourNewPassword: 'Таны шинэ нууц үг',
    repeatYourPassword: 'Нууц үгээ давтана уу',
    repeatYourNewPassword: 'Шинэ нууц үгээ давтана уу',
    requestAccess: '$t(common.appNameFull)-д шинээр ирсэн үү? Хандалтын хүсэлт илгээх',
    resetPassword: 'Нууц үг сэргээх',
    login: 'Нэвтрэх',
    loginUsingBackupCode: '2FA нөөц кодоор нэвтрэх',
    forgotPassword: 'Нууц үг мартсан',
    sendPasswordResetEmail: 'Нууц үг сэргээх имэйл илгээх',
    twoFactorBackupCode: '2FA нөөц код',
    twoFactorToken: 'Баталгаажуулах код',
    twoFactorTokenDescription: `Таны бүртгэлийг аюулгүй байлгахын тулд бид таныг баталгаажуулна.

  Таны баталгаажуулагч апп-аас үүсгэсэн кодыг оруулна уу.`,
  },
  accessRequestView: {
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
    introduction: `Манай нөөц хязгаарлагдмал тул та платформ руу нэвтрэх хүсэлт гаргах ёстой.
Та юу хийхийг хүсэж байгаагаа бидэнд мэдэгдээрэй!
Та **шинэ хоосон судалгаагаар** эхлэх эсвэл одоо байгаа **загвараас** хувилах боломжтой бөгөөд шинээр үүсгэсэн судалгаанд нэр санал болгох шаардлагатай болно.
Та тухайн судалгааны ***Судалгааны Администратор***-ын үүрэгтэй болно: та үүнийг засах, шинэ хэрэглэгчдийг судалгаандаа урьж, хувь нэмэр оруулах боломжтой болно.
Та мөн ***Судалгааны Менежер*** болно бөгөөд шаардлагатай бол **шинэ судалгаа** (5 хүртэл) үүсгэх боломжтой болно.
Илүү дэлгэрэнгүй мэдээлэл авахыг хүсвэл манай вэбсайтаар зочилно уу: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Хүсэлтээ илгээсний дараа Арена руу нэвтрэх урилгын имэйлийг хүлээгээрэй.**`,
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
    title: '$t(common.appNameFull) руу хандах хүсэлт гаргах',
    whitelistSenderSuggestion:
      'Хэрэв та үүнийг Спам/Хэрэггүй имэйлийн хавтаснаас олсон бол **{{senderEmail}}** хаягийг харилцагчдын жагсаалтдаа (хаягийн дэвтэр) нэмэх эсвэл аюулгүй/спам биш гэж тэмдэглэнэ үү. Ингэснээр бидний дараагийн имэйлүүд таны ирсэн имэйлийн хайрцагт шууд очих болно.',
  },
  resetPasswordView: {
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
}
