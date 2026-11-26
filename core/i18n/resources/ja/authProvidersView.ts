export default {
  title: 'ログインプロバイダー',
  subtitle:
    'ログインページに表示される外部サインインの選択肢です（この順序で表示）。ユーザーはメールアドレスとパスワードでもサインインできます。',
  addProvider: 'プロバイダーを追加',
  continue: '続行',
  encryptionKeyMissing:
    'クライアントシークレットの暗号化キーが設定されていません：プロバイダーを追加するには、サーバーでAUTH_PROVIDER_SECRET_ENCRYPTION_KEY（16進数64文字）を設定し、Arenaを再起動してください。',
  empty: {
    title: 'ログインプロバイダーはまだありません',
    description:
      'メールアドレスとパスワードに加えて、Google、Microsoft、または組織のシングルサインオンでユーザーがサインインできるようにします。',
  },
  columns: {
    provider: 'プロバイダー',
    type: '種類',
    status: '状態',
    loginPage: 'ログインページ',
    linkedUsers: '連携ユーザー',
    actions: '操作',
  },
  passwordAlwaysAvailable:
    'メールアドレスとパスワードによるサインインは常に利用できます。変更は1分以内にすべてのサーバーインスタンスに反映されます。',
  status: {
    enabled: '有効',
    disabled: '無効',
  },
  source: {
    env: 'サーバー設定',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: '表示',
    directLinkOnly: '直接リンクのみ',
  },
  moveUp: '上へ移動',
  moveDown: '下へ移動',
  enable: '有効にする',
  disable: '無効にする',
  deleteConfirm:
    'ログインプロバイダー「{{provider}}」を削除しますか？{{linkedUsersCount}}人のユーザーの連携が削除されます（連携を残したままサインインを停止するには、代わりに無効にしてください）。\n\nサインイン方法がなくなるユーザー（パスワードの設定方法を説明するメールが送信されます）：{{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'プロバイダーの種類を選択してください。ラベルとアイコンは後で変更できます。',
    typeDescription: {
      google: 'GmailやGoogle Workspaceを含むGoogleアカウント。',
      microsoft: '職場、学校、または個人のMicrosoftアカウント（Entra ID）。',
      oidc: 'その他のプロバイダー：Keycloak、Okta、Auth0、組織のSSOなど',
    },
    notSupportedYet: 'Facebook、GitHub、Appleにはまだ対応していません。',
  },
  form: {
    errors: 'プロバイダーを保存できません：{{errors}}',
    newTitle: '新しい{{type}}プロバイダー',
    general: '全般',
    label: 'ボタンのラベル',
    id: '識別子',
    idInfo:
      'URLとユーザーアカウントの連携に使用されます：小文字の英字、数字、ハイフンが使用できます。作成後は変更できません。',
    icon: 'アイコン',
    useUploadedIcon: 'アップロードしたアイコンを使用',
    iconInvalid: '無効なアイコンです：100 KBまでのPNGまたはSVGファイルを使用してください。',
    enabled: '有効',
    enabledInfo:
      '無効にすると、ボタンが非表示になり、このプロバイダーでのサインインは拒否されます。連携済みのアカウントは保持されます。',
    showOnLoginPage: 'ログインページに表示',
    showOnLoginPageInfo:
      'オフの場合、ログインページにこのプロバイダーのボタンは表示されません：ユーザーは直接リンク{{path}}を使用してサインインします',
    connection: '接続',
    issuer: '発行者（Issuer）URL',
    issuerInfo: 'Arenaはその他のエンドポイントを<issuer>/.well-known/openid-configurationから読み込みます。',
    tenant: 'テナント',
    tenantInfo:
      '組織のテナントID、または「organizations」（職場または学校のアカウント）、「consumers」（個人アカウント）、「common」（すべてのMicrosoftアカウント）。',
    clientId: 'クライアントID',
    clientSecret: 'クライアントシークレット',
    clientSecretInfo: '暗号化して保存され、再表示されません：現在の値を維持するには空欄のままにしてください。',
    clientSecretSet: '（設定済み）',
    scopes: 'スコープ',
    scopesInfo: 'スペース区切り。「openid」は必須です。',
    access: 'アクセス',
    accessDescription: 'Arenaのアカウントまたは招待をすでに持っているユーザーのみサインインできます。',
    allowedEmailDomains: '許可するメールドメイン',
    allowedEmailDomainsInfo: 'これらのドメイン（例：組織のドメイン）のメールアドレスでのみサインインできます。',
    emailDomainsMode: { all: 'すべてのメールドメインを許可', specific: '特定のドメインのみ許可' },
    emailDomainsPlaceholder: 'ドメインを入力（例：example.org）',
    emailDomainsRequired: 'メールドメインを1つ以上追加するか、すべてのメールドメインを許可してください',
    requireArena2FA: 'Arenaの二要素認証を必須にする',
    requireArena2FAInfo:
      'Arenaの2FAを有効にしたユーザーは、引き続きコードの入力が必要です。このプロバイダーが独自の多要素認証を強制する場合にのみオフにしてください。',
    trustEmail: 'このプロバイダーのメールアドレスを信頼する',
    trustEmailInfo:
      'プロバイダーがメールアドレスの確認済みを示さない場合でも、メールアドレスでアカウントを連携します。メールアドレスを自身で確認するプロバイダーの場合にのみオンにしてください。',
    redirectUri: 'リダイレクトURI',
    redirectUriCopied: 'リダイレクトURIをコピーしました',
    setupStepsTitle: 'プロバイダーの設定方法',
    setupGuide: {
      google: '詳細ガイド：Google',
      microsoft: '詳細ガイド：Microsoft',
      oidc: '詳細ガイド：Keycloakおよびその他のプロバイダー',
    },
    setupSteps: {
      google: [
        'Google Cloudコンソールで、Google Auth Platform（またはAPIとサービス）＞ クライアントを開き、種類「ウェブアプリケーション」のOAuthクライアントを作成します。',
        '上記のリダイレクトURIを、クライアントの「承認済みのリダイレクトURI」に追加します。',
        'Googleが作成したクライアントIDとクライアントシークレットを、（左側の）接続セクションのクライアントIDとクライアントシークレットの欄にコピーし、保存をクリックします。',
      ],
      microsoft: [
        'Microsoft Entra管理センターで、アプリの登録 ＞ 新規登録を開きます。',
        '上記のリダイレクトURIを、アプリケーションの「Web」リダイレクトURIとして追加します。',
        '証明書とシークレットで、新しいクライアントシークレットを作成します。',
        'アプリケーション（クライアント）IDとシークレットの値を、（左側の）接続セクションのクライアントIDとクライアントシークレットの欄にコピーし、保存をクリックします。',
      ],
      oidc: [
        'プロバイダー（例：Keycloak、Okta）で、Arenaを機密Webアプリケーション（OpenID Connect、認可コードフロー）として登録します。',
        '上記のリダイレクトURIをアプリケーションの許可されたリダイレクトURIに追加し、openid、email、profileのスコープを許可します。',
        'アプリケーションの発行者URL、クライアントID、クライアントシークレットを、（左側の）接続セクションの発行者（Issuer）URL、クライアントID、クライアントシークレットの欄にコピーし、保存をクリックします。',
      ],
    },
    loginPagePreview: 'ログインページのプレビュー',
    readOnlyEnv:
      'このプロバイダーはサーバー設定（AUTH_PROVIDERS_CONFIG）で定義されています：そこで変更してArenaを再起動してください。',
    testConnection: '接続をテスト',
    testSignIn: 'サインインをテスト',
    testConnectionOk: '接続OK：{{keysCount}}個の署名キーを{{durationMs}} msで読み込みました。',
    testConnectionFailed: '接続に失敗しました：{{error}}',
  },
  testResult: {
    title: 'サインインのテスト結果',
    success: 'サインインに成功しました：IDトークンが検証されました。誰もログインしておらず、何も変更されていません。',
    issuer: '発行者（Issuer）',
    subject: 'サブジェクト（sub）',
    email: 'メールアドレス',
    verified: '（確認済み）',
    notVerified: '（未確認）',
    name: '名前',
    matchingUser: '一致するArenaユーザー',
    outcome: 'サインイン時',
    alreadyLinked: '連携済み：ユーザーはログインされます。',
    wouldLink: 'アカウントはメールアドレスによってユーザーに連携されます。',
  },
}
