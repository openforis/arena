export default {
  loginView: {
    yourName: 'お名前',
    yourEmail: 'メールアドレス',
    yourPassword: 'パスワード',
    yourNewPassword: '新しいパスワード',
    repeatYourPassword: 'パスワード（確認）',
    repeatYourNewPassword: '新しいパスワード（確認）',
    requestAccess: '$t(common.appNameFull)を初めて利用しますか？アクセスを申請する',
    resetPassword: 'パスワードを再設定',
    login: 'ログイン',
    loginUsingBackupCode: '2FA（二段階認証）バックアップコードでログイン',
    forgotPassword: 'パスワードをお忘れですか',
    sendPasswordResetEmail: 'パスワード再設定メールを送信',
    twoFactorBackupCode: '2FA（二段階認証）バックアップコード',
    twoFactorToken: '確認コード',
    twoFactorTokenDescription: `アカウントを安全に保つため、本人確認を行っています。

認証アプリで生成されたコードを入力してください。`,
  },
  accessRequestView: {
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
    introduction: `リソースには限りがあるため、プラットフォームへのアクセスには申請が必要です。
また、どのような目的でご利用になるかにも関心がありますので、ぜひお知らせください！
**新規の空の調査**から始めるか、既存の**テンプレート**を複製するかを選択でき、新しく作成する調査には名前を提案していただきます。
その調査については***調査管理者***の役割が割り当てられます：編集や、新しいユーザーを招待して調査に参加・貢献してもらうことができます。
また***調査マネージャー***にもなり、必要に応じて**新しい調査を作成**できます（最大5件まで）。
詳しくは公式サイトをご覧ください：$t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**申請を送信した後は、Arenaへのアクセスを許可する招待メールをお待ちください。**`,
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
    title: '$t(common.appNameFull)へのアクセス申請',
    whitelistSenderSuggestion: `迷惑メールフォルダに入っていた場合は、今後のメールが確実に受信トレイに届くよう、**{{senderEmail}}**を連絡先に追加するか、安全な送信者としてマークしてください。`,
  },
  resetPasswordView: {
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
}
