export default {
  loginView: {
    title: 'ログイン',
    subtitle: 'ようこそ！$t(common.appNameFull)を利用するには認証情報を入力してください。',
    backToLogin: 'ログインに戻る',
    newToArena: '$t(common.appNameFull)を初めて利用しますか？',
    or: 'または',
    twoFactorTitle: '2段階認証',
    verify: '確認',
    lostYourDevice: '認証アプリを使用できませんか？',
    yourName: 'お名前',
    yourEmail: 'メールアドレス',
    yourPassword: 'パスワード',
    yourNewPassword: '新しいパスワード',
    repeatYourPassword: 'パスワード（確認）',
    repeatYourNewPassword: '新しいパスワード（確認）',
    requestAccess: 'アクセスを申請する',
    resetPassword: 'パスワードを再設定',
    login: 'ログイン',
    loginUsingBackupCode: 'バックアップコードを使用する',
    forgotPassword: 'パスワードをお忘れですか？',
    sendPasswordResetEmail: 'パスワード再設定メールを送信',
    twoFactorBackupCode: '2FA（二段階認証）バックアップコード',
    twoFactorToken: '確認コード',
    twoFactorTokenDescription: `アカウントを安全に保つため、本人確認を行っています。

認証アプリで生成されたコードを入力してください。`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'すでにアカウントをお持ちですか？',
    steps: {
      sendRequest: {
        title: '申請を送信',
        description: '最初の調査の名前を提案してください：空の調査またはテンプレートから開始できます。',
      },
      review: { title: '審査', description: '申請の処理には数日かかる場合があります。' },
      invitation: {
        title: '招待を受け取る',
        description:
          '$t(common.appName)にアクセスするためのメールが届きます：新しい調査の管理者となり、最大5件の調査を作成できます。',
      },
    },
    error: 'アクセス申請中にエラーが発生しました：{{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: '名',
        lastName: '姓',
        institution: '所属機関',
        country: '国',
        purpose: 'ご利用の目的は何ですか？',
        surveyName: '調査名を提案してください',
        templateUuid: 'テンプレートから開始しますか？',
      },
    },
    introduction:
      'リソースには限りがあるため、アクセスは申請制です。$t(common.appName)で何をしたいかお聞かせください！',
    reCaptchaNotAnswered: 'reCAPTCHAが未回答です',
    requestSent: 'アクセス申請を送信しました',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

処理には数日かかりますので、しばらくお待ちください。
承認され次第、**{{email}}**宛に$t(common.appName)へのアクセス方法をご案内するメールを送信します。
ありがとうございます。**$t(common.appNameFull)**をお楽しみください！`,
    sendRequest: '申請を送信',
    sendRequestConfirm: '$t(common.appNameFull)へのアクセスを申請しますか？',
    templateNotSelected: '未選択（最初から作成）',
    title: 'アクセスを申請する',
    whitelistSenderSuggestion: `迷惑メールフォルダに入っていた場合は、今後のメールが確実に受信トレイに届くよう、**{{senderEmail}}**を連絡先に追加するか、安全な送信者としてマークしてください。`,
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'アカウントを設定して利用を開始してください。',
      setYourNewPassword: 'アカウントの新しいパスワードを設定してください。',
    },
    title: {
      completeRegistration: 'Arenaへの登録を完了する',
      setYourNewPassword: '新しいパスワードを設定',
    },
    setNewPassword: '新しいパスワードを設定',
    forgotPasswordLinkInvalid: 'アクセスしようとしたページは存在しないか、無効になっています',
    passwordSuccessfullyReset: 'パスワードを再設定しました',
    passwordStrengthChecksTitle: 'パスワード強度チェック',
    passwordStrengthChecks: {
      noWhiteSpaces: '空白文字を含まない',
      atLeast8CharactersLong: '8文字以上',
      containsLowerCaseLetters: '小文字を含む',
      containsUpperCaseLetters: '大文字を含む',
      containsNumbers: '数字を含む',
    },
    completeRegistration: '登録を完了',
  },
  forgotPasswordView: {
    title: 'パスワードの再設定',
    description: 'アカウントのメールアドレスを入力してください。新しいパスワードを設定するためのリンクをお送りします。',
  },
  pitch: {
    default: {
      title: '現地データを、収集から分析まで。',
      description:
        '多言語フォームの設計、複数サイクルのインベントリ管理、データ品質の検証、統合されたRStudioによる結果の分析が可能です。',
    },
    accessRequest: {
      title: '$t(common.appName)で最初の調査を始めましょう。',
      description:
        'プロジェクトについてお聞かせください。承認されると、フォームの設計、現地チームの招待、データの分析を一か所で行えます。',
    },
    tags: {
      forestInventories: '森林インベントリ',
      questionnaires: 'アンケート',
      multiCycle: '複数サイクル',
      statisticalAnalysis: '統計分析',
      freeAndOpenSource: '無料・オープンソース',
      openForis: 'FAO · Open Foris',
      upToFiveSurveys: '最大5件の調査',
    },
  },
  footer: {
    website: '$t(common.appName)について',
    userManual: 'ユーザーマニュアル',
    supportForum: 'サポートフォーラム',
    version: 'バージョン {{version}}',
  },
}
