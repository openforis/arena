export default {
  loginView: {
    title: 'ログイン',
    subtitle: 'ようこそ！$t(common.appNameFull)を利用するには認証情報を入力してください。',
    backToLogin: 'ログインに戻る',
    noAccountYet: 'アカウントをお持ちでないですか？',
    createAccount: 'アカウントを作成',
    invitedToSurvey:
      '調査に招待されましたか？アカウントを作成する必要はありません。招待メールのリンクを開き、手順に従ってください。',
    or: 'または',
    twoFactorTitle: '2段階認証',
    verify: '確認',
    lostYourDevice: '認証アプリを使用できませんか？',
    yourName: 'お名前',
    yourEmail: 'メールアドレス',
    email: '$t(common.email)',
    password: 'パスワード',
    repeatPassword: 'パスワード（確認）',
    yourNewPassword: '新しいパスワード',
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
  externalLogin: {
    signInWith: '{{provider}}でサインイン',
    continueWith: '{{provider}}で続行',
    registeredUsersOnly: '登録済みユーザーのみ',
    errors: {
      providerNotAvailable:
        'このサインイン方法は現在利用できません。後でもう一度お試しいただくか、メールアドレスとパスワードでサインインしてください。',
      flowInvalid: 'サインインの有効期限が切れたか、別のブラウザで開始されました。もう一度お試しください。',
      providerError: '外部プロバイダーでのサインインに失敗しました。もう一度お試しください。',
      emailNotVerified:
        'プロバイダーがメールアドレスを確認していないため、アカウントと照合できません。パスワードでサインインし、プロフィールからプロバイダーを連携してください。',
      emailDomainNotAllowed: 'このメールドメインのアカウントはこのサインイン方法を使用できません。',
      userNotFound:
        'このメールアドレスのアカウントはありません。調査の管理者に招待を依頼するか、アクセスをリクエストしてください。',
      userNotFoundCreateAccount:
        'このメールアドレスのアカウントはありません。先にアカウントを作成するか、調査の管理者に招待を依頼してください。',
      ambiguousEmail:
        'このメールアドレスに一致するアカウントが複数あります。パスワードでサインインし、プロフィールからプロバイダーを連携してください。',
      identityAlreadyLinked: 'このプロバイダーのアカウントは既に別のユーザーに連携されています。',
      providerAlreadyLinked:
        'このプロバイダーの別のアカウントが既にあなたのユーザーに連携されています。先にプロフィールから連携を解除してください。',
      invitationInvalid: '招待が無効か、有効期限が切れています。調査の管理者に新しい招待を依頼してください。',
      invalidTwoFactorCode: '確認コードが無効です。',
    },
  },
  accessRequestView: {
    whatHappensNext: 'この後の流れ',
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
          '**{{senderEmail}}** から$t(common.appName)にアクセスするためのリンクを記載したメールが届きます。 受信トレイに見当たらない場合は、迷惑メールフォルダを確認し、送信者を連絡先に追加するか、メールを「迷惑メールではない」としてマークしてください。',
        descriptionWithoutSender:
          '$t(common.appName)にアクセスするためのリンクを記載したメールが届きます。 受信トレイに見当たらない場合は、迷惑メールフォルダを確認し、送信者を連絡先に追加するか、メールを「迷惑メールではない」としてマークしてください。',
      },
      startWorking: { title: '利用開始', description: '新しい調査の管理者となり、最大5件の調査を作成できます。' },
    },
    error: 'アクセス申請中にエラーが発生しました：{{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        title: '$t(user.title)',
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
    surveyNameHint:
      'この名前は$t(common.appName)プラットフォーム全体で調査を識別するため、**一意**である必要があります。「survey」や「test」のような一般的な名前ではなく、組織または国、プロジェクト、年を組み合わせるなど、具体的な名前を選んでください。使用できるのは小文字、数字、アンダースコアのみです。',
    sendRequest: '申請を送信',
    sendRequestConfirm: '$t(common.appNameFull)へのアクセスを申請しますか？',
    templateNotSelected: '未選択（最初から作成）',
    title: 'アクセスを申請する',
    whitelistSenderSuggestion: `迷惑メールフォルダに入っていた場合は、今後のメールが確実に受信トレイに届くよう、**{{senderEmail}}**を連絡先に追加するか、安全な送信者としてマークしてください。`,
  },
  registrationView: {
    title: 'アカウントを作成',
    introduction: 'アカウントと最初の調査を作成しましょう。$t(common.appName)で何をしたいか教えてください！',
    createAccount: 'アカウントを作成',
    createAccountConfirm: '$t(common.appNameFull)のアカウントを作成しますか？',
    accountCreated: 'アカウントが作成されました',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

メールのリンクを開いてメールアドレスを確認し、登録を完了してください。パスワードを設定するか、利用可能なサインイン方法（例：Google）でサインインできます。

ありがとうございます。**$t(common.appNameFull)**をお楽しみください！`,
    error: 'アカウントの作成中にエラーが発生しました：{{error}}',
    steps: {
      createAccount: {
        title: 'アカウントを作成',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'メールアドレスを確認',
        description:
          '**{{senderEmail}}** から登録を完了するためのリンクが記載されたメールが届きます。受信トレイにない場合は、迷惑メールフォルダを確認し、送信者を連絡先に追加するか、メールを迷惑メールではないとマークしてください。',
        descriptionWithoutSender:
          '登録を完了するためのリンクが記載されたメールが届きます。受信トレイにない場合は、迷惑メールフォルダを確認し、送信者を連絡先に追加するか、メールを迷惑メールではないとマークしてください。',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
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
    completeRegistrationWith: '{{provider}}で登録を完了',
    definePassword: 'パスワードを設定',
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
    },
    tags: {
      forestInventories: '森林インベントリ',
      questionnaires: 'アンケート',
      multiCycle: '複数サイクル',
      statisticalAnalysis: '統計分析',
    },
  },
  footer: {
    website: '$t(common.appName)について',
    userManual: 'ユーザーマニュアル',
    supportForum: 'サポートフォーラム',
    version: 'バージョン {{version}}',
  },
}
