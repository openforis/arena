export default {
  title: 'Нэвтрэх үйлчилгээ үзүүлэгчид',
  subtitle:
    'Нэвтрэх хуудсанд энэ дарааллаар харагдах гадаад нэвтрэх сонголтууд. Хэрэглэгчид мөн имэйл болон нууц үгээр нэвтэрч болно.',
  addProvider: 'Үйлчилгээ үзүүлэгч нэмэх',
  continue: 'Үргэлжлүүлэх',
  encryptionKeyMissing:
    'Клиентийн нууц түлхүүрүүдийн шифрлэлтийн түлхүүр тохируулагдаагүй байна: үйлчилгээ үзүүлэгч нэмэхийн тулд сервер дээр AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 арван зургаатын тэмдэгт)-ийг тохируулаад Arena-г дахин эхлүүлнэ үү.',
  empty: {
    title: 'Нэвтрэх үйлчилгээ үзүүлэгч хараахан алга',
    description:
      'Хэрэглэгчдэд имэйл болон нууц үгээс гадна Google, Microsoft эсвэл танай байгууллагын нэгдсэн нэвтрэлтээр (SSO) нэвтрэх боломж олгоно уу.',
  },
  columns: {
    provider: 'Үйлчилгээ үзүүлэгч',
    type: 'Төрөл',
    status: 'Төлөв',
    loginPage: 'Нэвтрэх хуудас',
    linkedUsers: 'Холбогдсон хэрэглэгчид',
    actions: 'Үйлдлүүд',
  },
  passwordAlwaysAvailable:
    'Имэйл болон нууц үгээр нэвтрэх боломж үргэлж байна. Өөрчлөлтүүд нэг минутын дотор бүх сервер дээр хэрэгжинэ.',
  status: {
    enabled: 'Идэвхтэй',
    disabled: 'Идэвхгүй',
  },
  source: {
    env: 'серверийн тохиргоо',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Харагдана',
    directLinkOnly: 'Зөвхөн шууд холбоосоор',
  },
  moveUp: 'Дээш зөөх',
  moveDown: 'Доош зөөх',
  enable: 'Идэвхжүүлэх',
  disable: 'Идэвхгүй болгох',
  deleteConfirm:
    '"{{provider}}" нэвтрэх үйлчилгээ үзүүлэгчийг устгах уу? Түүний {{linkedUsersCount}} хэрэглэгчийн холболтыг устгана (нэвтрэлтийг зогсоох боловч холболтуудыг хадгалахыг хүсвэл оронд нь идэвхгүй болгоно уу).\n\nНэвтрэх аргагүй үлдэх хэрэглэгчид (тэд нууц үг хэрхэн тохируулахыг тайлбарласан имэйл хүлээн авна): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Үйлчилгээ үзүүлэгчийн төрлийг сонгоно уу. Шошго болон дүрс тэмдгийг дараа нь өөрчилж болно.',
    typeDescription: {
      google: 'Gmail болон Google Workspace зэрэг Google бүртгэлүүд.',
      microsoft: 'Ажлын, сургуулийн эсвэл хувийн Microsoft бүртгэлүүд (Entra ID).',
      oidc: 'Бусад аливаа үйлчилгээ үзүүлэгч: Keycloak, Okta, Auth0, танай байгууллагын SSO...',
    },
    notSupportedYet: 'Facebook, GitHub болон Apple хараахан дэмжигдээгүй байна.',
  },
  form: {
    errors: 'Үйлчилгээ үзүүлэгчийг хадгалж чадсангүй: {{errors}}',
    newTitle: 'Шинэ {{type}} үйлчилгээ үзүүлэгч',
    general: 'Ерөнхий',
    label: 'Товчны шошго',
    id: 'Танигч',
    idInfo:
      'URL-д болон хэрэглэгчийн бүртгэлийг холбоход ашиглана: жижиг үсэг, тоо болон зураас. Үүсгэсний дараа өөрчлөх боломжгүй.',
    icon: 'Дүрс тэмдэг',
    useUploadedIcon: 'Байршуулсан дүрс тэмдгийг ашиглах',
    iconInvalid: 'Дүрс тэмдэг буруу байна: 100 KB хүртэлх PNG эсвэл SVG файл ашиглана уу.',
    enabled: 'Идэвхтэй',
    enabledInfo:
      'Идэвхгүй үед товч нуугдаж, энэ үйлчилгээ үзүүлэгчээр нэвтрэхийг татгалзана. Холбогдсон бүртгэлүүд хадгалагдана.',
    showOnLoginPage: 'Нэвтрэх хуудсанд харуулах',
    showOnLoginPageInfo:
      'Унтраасан үед нэвтрэх хуудсанд үйлчилгээ үзүүлэгчийн товч харагдахгүй: хэрэглэгчид {{path}} шууд холбоосоор нэвтэрнэ',
    connection: 'Холболт',
    issuer: 'Issuer URL',
    issuerInfo: 'Arena бусад endpoint-уудыг <issuer>/.well-known/openid-configuration-аас уншина.',
    tenant: 'Tenant',
    tenantInfo:
      'Танай байгууллагын Tenant ID, эсвэл "organizations" (аливаа ажлын болон сургуулийн бүртгэл), "consumers" (хувийн бүртгэлүүд) эсвэл "common" (аливаа Microsoft бүртгэл).',
    clientId: 'Клиентийн ID',
    clientSecret: 'Клиентийн нууц түлхүүр',
    clientSecretInfo:
      'Шифрлэгдсэн хэлбэрээр хадгалагдах бөгөөд дахин харагдахгүй: одоогийнхийг хадгалах бол хоосон үлдээнэ үү.',
    clientSecretSet: '(тохируулсан)',
    scopes: 'Scope-ууд',
    scopesInfo: 'Зайгаар тусгаарлана; "openid" заавал шаардлагатай.',
    access: 'Хандалт',
    accessDescription: 'Зөвхөн Arena бүртгэл эсвэл урилгатай хэрэглэгчид нэвтрэх боломжтой.',
    allowedEmailDomains: 'Зөвшөөрөгдсөн имэйлийн домэйнууд',
    allowedEmailDomainsInfo: 'Хэрэглэгчид зөвхөн эдгээр домэйны имэйлээр нэвтэрч болно (жишээ нь танай байгууллагынх).',
    emailDomainsMode: { all: 'Бүх имэйлийн домэйныг зөвшөөрөх', specific: 'Зөвхөн тодорхой домэйнуудыг зөвшөөрөх' },
    emailDomainsPlaceholder: 'Домэйн бичнэ үү, жишээ нь example.org',
    emailDomainsRequired: 'Дор хаяж нэг имэйлийн домэйн нэмэх эсвэл бүх имэйлийн домэйныг зөвшөөрнө үү',
    requireArena2FA: 'Arena-гийн хоёр үе шаттай баталгаажуулалтыг шаардах',
    requireArena2FAInfo:
      'Arena 2FA идэвхжүүлсэн хэрэглэгчид кодоо оруулах шаардлагатай хэвээр байна. Зөвхөн энэ үйлчилгээ үзүүлэгч өөрийн олон хүчин зүйлийн баталгаажуулалтыг шаарддаг бол унтраана уу.',
    trustEmail: 'Энэ үйлчилгээ үзүүлэгчийн имэйлд итгэх',
    trustEmailInfo:
      'Үйлчилгээ үзүүлэгч имэйл баталгаажсаныг батлаагүй үед ч бүртгэлүүдийг имэйлээр холбоно. Зөвхөн имэйлийг өөрөө баталгаажуулдаг үйлчилгээ үзүүлэгчид асаана уу.',
    redirectUri: 'Redirect URI',
    redirectUriCopied: 'Redirect URI хуулагдлаа',
    setupStepsTitle: 'Үйлчилгээ үзүүлэгчийг хэрхэн тохируулах',
    setupGuide: {
      google: 'Дэлгэрэнгүй заавар: Google',
      microsoft: 'Дэлгэрэнгүй заавар: Microsoft',
      oidc: 'Дэлгэрэнгүй заавар: Keycloak болон бусад үйлчилгээ үзүүлэгчид',
    },
    setupSteps: {
      google: [
        'Google Cloud console-д Google Auth Platform (эсвэл APIs & Services) > Clients-ийг нээж "Web application" төрлийн OAuth клиент үүсгэнэ.',
        'Дээрх redirect URI-г клиентийн "Authorized redirect URIs"-д нэмнэ.',
        'Google-ийн үүсгэсэн client ID болон client secret-ийг Холболт хэсгийн (зүүн талд) Клиентийн ID болон Клиентийн нууц түлхүүр талбаруудад хуулж, Хадгалах дээр дарна.',
      ],
      microsoft: [
        'Microsoft Entra admin center-д App registrations > New registration-ийг нээнэ.',
        'Дээрх redirect URI-г аппликейшний "Web" redirect URI болгон нэмнэ.',
        'Certificates & secrets хэсэгт шинэ client secret үүсгэнэ.',
        'Application (client) ID болон нууц түлхүүрийн утгыг Холболт хэсгийн (зүүн талд) Клиентийн ID болон Клиентийн нууц түлхүүр талбаруудад хуулж, Хадгалах дээр дарна.',
      ],
      oidc: [
        'Үйлчилгээ үзүүлэгч дээр (жишээ нь Keycloak, Okta) Arena-г нууц вэб аппликейшн (OpenID Connect, authorization code flow) болгон бүртгэнэ.',
        'Дээрх redirect URI-г аппликейшний зөвшөөрөгдсөн redirect URI-уудад нэмж, openid, email болон profile scope-уудыг зөвшөөрнө.',
        'Аппликейшний issuer URL, client ID болон client secret-ийг Холболт хэсгийн (зүүн талд) Issuer URL, Клиентийн ID болон Клиентийн нууц түлхүүр талбаруудад хуулж, Хадгалах дээр дарна.',
      ],
    },
    loginPagePreview: 'Нэвтрэх хуудсыг урьдчилан харах',
    readOnlyEnv:
      'Энэ үйлчилгээ үзүүлэгчийг серверийн тохиргоонд (AUTH_PROVIDERS_CONFIG) тодорхойлсон: тэнд өөрчлөөд Arena-г дахин эхлүүлнэ үү.',
    testConnection: 'Холболтыг шалгах',
    testSignIn: 'Нэвтрэлтийг шалгах',
    testConnectionOk: 'Холболт амжилттай: {{durationMs}} ms-д {{keysCount}} гарын үсгийн түлхүүр ачааллаа.',
    testConnectionFailed: 'Холболт амжилтгүй: {{error}}',
  },
  testResult: {
    title: 'Нэвтрэлтийн шалгалтын үр дүн',
    success: 'Нэвтрэлт амжилттай: ID token баталгаажлаа. Хэн ч нэвтрээгүй бөгөөд юу ч өөрчлөгдөөгүй.',
    issuer: 'Issuer',
    subject: 'Subject (sub)',
    email: 'Имэйл',
    verified: '(баталгаажсан)',
    notVerified: '(баталгаажаагүй)',
    name: 'Нэр',
    matchingUser: 'Тохирох Arena хэрэглэгч',
    outcome: 'Нэвтрэх үед',
    alreadyLinked: 'Аль хэдийн холбогдсон: хэрэглэгч нэвтэрнэ.',
    wouldLink: 'Бүртгэлийг имэйлээр нь хэрэглэгчтэй холбоно.',
  },
}
