export default {
  section: 'AI機能',
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
    '保存されたAPIキーを読み取れなくなりました（サーバーの暗号化シークレットが変更されました）。キーを再入力してください。',
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
    where: 'このコンピューターまたはネットワーク上',
    use: '使用する',
    baseUrl: 'サーバー URL',
    test: 'テスト',
    answered: '応答あり',
    noModels: 'サーバーにモデルがありません。ローカルサーバーでモデルを読み込んでください。',
    contextTokens: 'コンテキスト: {{count}} トークン',
    contextUnknown: 'コンテキスト: 不明 (8,192 トークンと仮定)',
    model: 'モデル',
    modelPlaceholder: '接続をテストするとモデルが一覧表示されます',
    help: 'ローカルサーバー（LM Studio や Ollama など）を起動し、このサイトからのリクエスト（CORS）を許可してください。ブラウザーがローカルネットワーク上のデバイスへのアクセス許可を求める場合があります。',
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
    removedNoDefault: 'プロバイダーを削除しました。',
  },
  types: {
    local: 'ローカルサーバー',
    orgServer: '組織のサーバー',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'OpenAI 互換',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'モック（テストサーバー）',
  },
  typeHints: {
    orgServer: '組織のリストにある OpenAI 互換サーバー。',
    'openai-compatible': 'Azure、OpenRouter など',
    'vercel-ai-sdk': 'Vercel AI SDK で作成したチャットエンドポイント。',
  },
  dialog: {
    addTitle: 'AI プロバイダーを追加',
    editTitle: '{{name}} を編集',
    groupLocal: 'このコンピューターまたはネットワーク上',
    groupCloud: 'クラウド（API キーを使用）',
    back: '戻る',
    name: '名前（任意）',
    test: 'テスト',
    testOk: '{{latencyMs}} ms で応答しました',
    add: 'プロバイダーを追加',
    save: '保存',
    testFirst: '保存する前に接続をテストしてください。',
    orgServerHint: '組織のリストにあるサーバー: {{urls}}',
    orgServerNotAllowed: 'このアドレスは組織のサーバーリストにありません。',
    apiKeyCleared: 'アドレスが変更されました。API キーをもう一度入力してください。',
    localUrlHint:
      'このアドレスはこのコンピューターまたはネットワーク上にあり、Arena サーバーからは接続できません。ローカルサーバーとして追加してください。',
    useLocalServer: 'ローカルサーバーを追加',
  },
  dataClasses: {
    none: '調査の内容なし',
    schema: '調査の設計',
    data: 'レコードデータ',
  },
  access: {
    section: 'AI が参照できるもの',
    levels: {
      off: 'オフ',
      help: 'ヘルプのみ',
      design: '+ 調査の設計',
      data: '+ レコードデータ',
    },
    classes: {
      help: { title: 'Arena ヘルプ', text: '質問と Arena ユーザーマニュアルの抜粋。' },
      design: {
        title: '調査の設計',
        text: 'エンティティ、属性、ラベル、カテゴリ、式。レコードの値は含みません。',
      },
      data: {
        title: 'レコードデータ',
        text: 'レコードの値とクエリ結果。既定では、このデバイス上のサーバーだけが受け取れます。',
      },
    },
    count: '{{total}} 件中 {{on}} 件の機能がオン',
    off: 'AI 機能はオフです',
    customize: 'カスタマイズ',
    customizeHint: '各調査の AI ポリシーにより、プロバイダーがブロックされる場合があります。',
    sendsInfo: '送信される内容',
  },
  features: {
    chat: {
      label: 'ヘルプアシスタント',
      sends: '質問、Arena ユーザーマニュアルの抜粋、および Arena 内の現在位置 (モジュール名)。',
    },
    assistantSuggestions: {
      label: '先回りの提案',
      sends: '提案の「実行する」をクリックするまで何も送信しません。確認はブラウザ内で行われます。',
    },
    expressions: {
      label: '式',
      sends:
        '属性とその兄弟属性 (名前と型)、式、およびあなたの説明。再試行やエラーの説明の場合は、失敗した式とそのエラーメッセージも。',
    },
    translation: {
      label: 'ラベルの翻訳',
      sends:
        '翻訳するラベルまたは説明と、言語コード。フォームデザイナーの「AI：ラベルを翻訳」は、すべてのエンティティと属性のラベルと説明を送信します。',
    },
    assistantDesign: {
      label: 'デザインアシスタント',
      sends: '要求された調査の構造: エンティティ、属性、ラベル、カテゴリー、式。',
    },
    dataQuery: {
      label: 'データクエリ',
      sends:
        '調査のエンティティの属性名、型、ラベル、カテゴリー名、あなたの説明、および要約の場合はフィルターを含むクエリ。レコードの値は含みません。',
    },
    dataDictionary: {
      label: 'データディクショナリ',
      sends: '調査名と、説明のない各エンティティまたは属性の名前、型、親エンティティ。',
    },
    assistantAnalysis: {
      label: '分析アシスタント',
      sends: '調査の構造と、クエリを実行するたびにレコード数とクエリ結果 (最大 200 グループまたは 50 行)。',
    },
    assistantCleaning: {
      label: 'クリーニングアシスタント',
      sends:
        '調査の構造、検証エラーとそのレコードのキーと値、参照するレコードの値、およびクエリを実行した場合はその結果 (レコード数と最大 200 グループまたは 50 行)。あなたが確認する修正を提案します。',
    },
    userActivity: {
      label: 'アクティビティの要約',
      sends: '活動ログの調査名、ユーザー名、活動の種類、件数、日付。',
    },
  },
  footerNote: 'すべての AI 設定はプロフィールの保存ボタンで保存されます。',
}
