export default {
  section: 'AI機能',
  enableFeatures: 'AI機能を有効にする',
  featuresDisabled: 'このデプロイメントではAI機能が無効になっています。',
  encryptionMissing:
    'このデプロイメントにはAI_USER_KEY_ENCRYPTION_SECRETが設定されていません。管理者が設定するまで、個人用APIキーは保存できません。',

  provider: 'プロバイダー',
  providers: {
    default: 'Arena のデフォルト',
    openai: 'OpenAI',
    anthropic: 'Anthropic（Claude）',
    google: 'Google（Gemini）',
    'openai-compatible': 'OpenAI互換（Azure、OpenRouter、Ollamaなど）',
    'vercel-ai-sdk': 'Vercel AI SDK（チャットエンドポイント）',
  },
  model: 'モデル',
  modelOther: 'その他（モデルIDを入力）...',
  baseUrl: 'ベースURL',
  apiKey: 'APIキー',
  apiKeyPlaceholder: 'プロバイダーのAPIキーを貼り付けてください',
  apiKeyKept: '既存のキーを維持する場合は空欄のままにしてください。',
  apiKeyUnreadable:
    '保存されたAPIキーを読み取れなくなりました（サーバーの暗号化シークレットが変更されました）。キーを再入力するまで、AI機能は既定のプロバイダーを使用します。',
  vercelAiSdkHint:
    'Vercel AI SDKチャットエンドポイントは固定エージェントとして扱われ、モデル選択やAPIキーは適用されません。自由記述の生成は機能しますが、構造化出力機能は動作しない場合があります。',
  modelsFetchFailed: 'モデルを取得できませんでした：{{message}}',

  savedSuccessfully: 'AI設定を保存しました。',
  saveFailed: 'AI設定の保存に失敗しました：{{message}}',

  status: {
    now: '現在:',
    ready: '準備完了',
    notTested: '未テスト',
    notAvailable: '利用不可',
    none: 'ローカルサーバーをオンにするか、プロバイダーを選択してください。',
  },
  where: {
    section: 'AI の実行場所',
    order: {
      title: '順序',
      localFirst: 'ローカルサーバーを優先し、クラウドプロバイダーを予備として使用する',
      cloudFirst: 'クラウドプロバイダーを優先する',
      hint: '各調査の AI ポリシーにより、エンジンがブロックされる場合があります。レコードデータは既定でこのデバイスに留まります。',
    },
  },
  localServer: {
    name: 'ローカル AI サーバー',
    where: 'このコンピューター上の LM Studio · このブラウザーに保存',
    use: '使用する',
    baseUrl: 'サーバー URL',
    test: 'テスト',
    answered: '応答あり',
    noModels: 'サーバーにモデルがありません。LM Studio でモデルを読み込んでください。',
    contextTokens: 'コンテキスト: {{count}} トークン',
    contextUnknown: 'コンテキスト: 不明 (8,192 トークンと仮定)',
    model: 'モデル',
    modelPlaceholder: '接続をテストするとモデルが一覧表示されます',
    help: 'LM Studio: サーバーを起動し、Enable CORS をオンにしてください。ブラウザーがローカルネットワーク上のデバイスへのアクセス許可を求める場合があります。',
    docsLink: 'LM Studio のドキュメント',
    httpsHint:
      'Arena は HTTPS で提供されています。ネットワーク内の別のマシンのサーバーには HTTPS が必要です。または Local Network Access に対応したブラウザー (Chrome) とあなたの許可が必要です。',
    cloudWarning:
      'このアドレスはこのデバイス上でも組織のサーバー一覧にもありません。調査の AI ポリシーではクラウドサービスとして扱われます。',
    notSaved:
      'ローカル AI サーバーの設定をこのブラウザーに保存できませんでした (ストレージがブロックされているか、いっぱいです)。',
  },
  cloud: {
    name: 'クラウドプロバイダー',
    where: 'アカウントに保存',
    defaultHint: 'Arena 管理者が設定したプロバイダーを使用します。',
    defaultNone: 'このサーバーには設定されていません。',
    localUrlHint:
      'このアドレスはお使いのコンピューターまたはネットワーク上にあります。LM Studio の場合は、上のローカル AI サーバーを使用してください。Arena サーバーからはアクセスできません。',
    localUrlLink: 'ローカル AI サーバーを使用する',
    test: 'テスト',
    testOk: '{{latencyMs}} ms で応答しました',
    remove: '自分のプロバイダーを削除',
    removed: 'プロバイダーを削除しました。AI 機能は Arena のデフォルトを使用します。',
  },
  dataClasses: {
    none: '調査の内容なし',
    schema: '調査の設計',
    data: 'レコードデータ',
  },
  features: {
    section: 'AI ができることと AI が見るもの',
    keyHint: '「調査の設計」と「レコードデータ」は、各調査の AI ポリシーの 2 つの設定に対応します。',
    sendsLabel: '送信内容:',
    groupHints: {
      none: '任意のエンジン。',
      cloud: '調査の既定ポリシー: クラウドを含む任意のエンジン。',
      onDevice: '調査の既定ポリシー: このデバイスのみ。クラウドエンジンには調査管理者の許可が必要です。',
    },
    chat: {
      label: 'ヘルプアシスタント',
      sends: '質問と Arena ユーザーマニュアルの抜粋。',
    },
    expressions: {
      label: '式',
      sends: '属性とその兄弟属性 (名前、型、ラベル)、式、およびあなたの説明。',
    },
    translation: {
      label: 'ラベルの翻訳',
      sends: '属性、カテゴリー項目のラベルと種の一般名、および言語コード。',
    },
    assistantDesign: {
      label: 'デザインアシスタント',
      sends: '要求された調査の構造: エンティティ、属性、ラベル、カテゴリー、式。',
    },
    dataQuery: {
      label: 'データクエリ',
      sends: 'エンティティの属性名とラベル、およびあなたの説明。レコードの値は含みません。',
    },
    dataDictionary: {
      label: 'データディクショナリ',
      sends: 'ラベルを含む調査の構造全体。',
      runs: 'Arena サーバーのプロバイダーで実行され、ローカルサーバーでは実行されません。',
    },
    assistantAnalysis: {
      label: '分析アシスタント',
      sends: '調査の構造と、クエリを実行するたびにレコード数とクエリ結果 (最大 200 グループまたは 50 行)。',
    },
    assistantCleaning: {
      label: 'クリーニングアシスタント',
      sends: '検証エラーとそのレコードのキーと値、および参照するレコードの値。あなたが確認する修正を提案します。',
    },
    userActivity: {
      label: 'アクティビティの要約',
      sends: '活動ログの調査名、ユーザー名、活動の種類、件数、日付。',
    },
  },
  footerNote: 'すべての AI 設定はプロフィールの保存ボタンで保存されます。',
}
