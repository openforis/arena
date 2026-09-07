import { samplingPointDataCategoryName, locationItemExtraDefName } from '@core/survey/category'

export default {
  common: {
    active: '有効',
    add: '追加',
    advancedFunctions: '高度な機能',
    and: 'および',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: '適用',
    aggregateFunction: '集計関数',
    aggregateFunction_other: '集計関数',
    attribute: '属性',
    attribute_other: '属性',
    avg: '平均',
    ascending: '昇順',
    areaBased: '面積ベース',
    back: '戻る',
    baseUnit: '基本単位',
    cancel: 'キャンセル',
    cancelConfirm: `**保存されていない変更があります**。

無視してもよろしいですか？`,
    cantUndoWarning: 'この操作は取り消せません',
    cantBeDeletedUsedItem: 'この{{item}}は一部のノード定義で使用されているため削除できません',
    chain: '処理チェーン',
    chain_plural: '処理チェーン',
    childrenEmpty: '少なくとも1つの子要素を定義してください',
    clear: 'クリア',
    clone: '複製',
    close: '閉じる',
    cloneFrom: '複製元',
    cnt: '件数',
    code: 'コード',
    collapse: '折りたたむ',
    confirm: '確認',
    convert: '変換',
    copy: 'コピー',
    createdWith: '作成元',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'サイクル',
    cycle_plural: 'サイクル',
    dateCreated: '作成日',
    dateLastModified: '最終更新日',
    delete: '削除',
    deleted: '削除しました！',
    descending: '降順',
    description: '説明',
    description_plural: '説明',
    designerNotes: 'デザイナーノート',
    designerNotesInfo: `デザイナーノートは調査フォームデザイナーでのみ表示され、データ入力フォームには表示されません。`,
    details: '詳細',
    dimension: 'ディメンション',
    dimension_other: 'ディメンション',
    done: '完了',
    download: 'ダウンロード',
    draft: '下書き',
    edit: '編集',
    elapsed: '経過時間',
    email: 'メールアドレス',
    email_other: 'メールアドレス',
    emailSentConfirmation: `{{email}}宛にメールを送信しました。

    迷惑メールフォルダも確認するよう、相手に伝えてください。`,
    emailSentToSelfConfirmation: `{{email}}宛にメールが届いているはずです。

迷惑メールフォルダもご確認ください。`,
    empty: '空',
    entity: 'エンティティ',
    error: 'エラー',
    error_plural: 'エラー',
    errorFound: '1件のエラーが見つかりました',
    errorFound_other: '{{count}}件のエラーが見つかりました',
    errorMessage: 'エラーメッセージ',
    errorMessage_plural: 'エラーメッセージ',
    expand: '展開',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'エクスポート',
    exportAll: 'すべてエクスポート',
    exportToCSV: 'CSVにエクスポート',
    exportToExcel: 'Excelにエクスポート',
    exportToExcelTooManyItems: 'Excelでエクスポートするには項目数が多すぎます。CSVエクスポートをご利用ください。',
    expression: '式',
    false: '偽',
    file: 'ファイル',
    file_plural: 'ファイル',
    formContainsErrors: 'フォームにエラーがあります',
    formContainsErrorsCannotContinue: 'フォームにエラーがあります。続行する前に修正してください。',
    formContainsErrorsCannotSave: 'フォームにエラーがあります。保存する前に修正してください。',
    from: '開始',
    function: '関数',
    goToHomePage: 'ホームページへ',
    goToSurveys: '調査一覧へ',
    group: 'グループ',
    help: 'ヘルプ',
    hide: '隠す',
    id: 'id',
    import: 'インポート',
    importFromExcelOrCSVFile: 'Excel（.xlsx）またはCSVファイルからインポート',
    info: '情報',
    invalid: '無効',
    item: '項目',
    item_plural: '項目',
    itemAlreadyAdded: '既に追加済みの項目です',
    label: 'ラベル',
    label_plural: 'ラベル',
    language: '言語',
    language_plural: '言語',
    leavePageConfirmMessage: `フォームに保存されていない変更があります。

このまま進むと、すべての変更が失われます。
続行しますか？`,
    local: 'ローカル',
    loading: '読み込み中...',
    lock: 'ロック',
    unlock: 'ロック解除',
    max: '最大',
    med: '中央値',
    manage: '管理',
    message_plural: 'メッセージ',
    measure: 'メジャー',
    measure_other: 'メジャー',
    measurePrevSteps: '前ステップのメジャー',
    measurePrevSteps_plural: '前ステップのメジャー',
    min: '最小',
    moveUp: '上に移動',
    moveDown: '下に移動',
    name: '名前',
    new: '新規',
    next: '次へ',
    no: 'いいえ',
    noItems: `$t(common.no) $t(common.item_plural)`,
    notification: '通知',
    notification_other: '通知',
    notSpecified: '---未指定---',
    orderBy: '並べ替え',
    of: '/',
    ok: 'OK',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: '新しいウィンドウで開く',
    options: 'オプション',
    owner: '所有者',
    path: 'パス',
    pause: '一時停止',
    preview: 'プレビューモード',
    previous: '前へ',
    publish: '公開',
    publishConfirm: `#### 調査「{{survey}}」を公開しようとしています ####

###### 公開処理により、以下の情報は*完全に削除*されます ######
- 削除された言語に紐づくラベル
- 削除されたサイクルに紐づく記録
- 削除されたフォーム項目に紐づくデータ

###### 公開後は次のことができなくなります： ######
- フォーム項目を単一から複数へ、またはその逆に変更すること
- カテゴリ項目のコードを変更すること
- カテゴリ項目を削除すること
- 分類体系のコードを変更すること
- 分類群を削除すること

**続行してもよろしいですか？**`,
    publishRecordValuesUpdateConfirm: `#### 「{{survey}}」を公開すると、既存の入力データが更新されます ####

{{reasons}}

これにより、既に入力されたデータが恒久的に変更または消去される可能性があります。確認のため、以下に調査名を入力してください。`,
    publishRecordValuesUpdateConfirmHeader: '既存の記録データが更新されます',
    publishRecordValuesUpdateConfirmInputLabel: '確認のため、調査名「{{strongConfirmRequiredText}}」を入力してください',
    publishRecordValuesUpdateReasonAttributeChanged:
      '以下の属性が変更されたため、既存の記録内でその値が再計算されます：**{{attributeNames}}**。',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      '以下の属性は、変更されたカテゴリまたは分類体系の追加プロパティを使用しているため、既存の記録内でその値が再計算されます：**{{attributeNames}}**。',
    raiseTicketInSupportForum: `問題が発生した場合は、<b>サポートフォーラム</b>に「arena」タグを付けてチケットを作成してください：$t(links.supportForum)`,
    record: '記録',
    record_other: '記録',
    remaining: '残り',
    remote: 'リモート',
    required: '必須',
    requiredField: '必須項目',
    reset: 'リセット',
    refresh: '更新',
    pressRefreshToReloadPage: 'ページを再読み込みするには「更新」を押してください。',
    resume: '再開',
    retry: '再試行',
    role: '役割',
    save: '保存',
    saveAndBack: '保存して戻る',
    saved: '保存しました！',
    samplingPolygon: 'サンプリングポリゴン',
    show: '表示',
    select: '選択',
    selectOne: '1つ選択...',
    selectAll: 'すべて選択',
    selected: '選択中',
    showLabels: 'ラベルを表示',
    showLabelsAndNames: 'ラベルと名前を表示',
    showNames: '名前を表示',
    sort: '並べ替え',
    sortAsc: '昇順で並べ替え',
    sortDesc: '降順で並べ替え',
    sortNone: '並べ替えを解除',
    srs: 'SRS',
    status: '状態',
    sum: '合計',
    test: 'テスト',
    to: '終了',
    totalItems: '合計項目数',
    true: '真',
    trySplittingFileIntoSmallerChunks: 'ファイルをより小さく分割してお試しください。',
    type: '種類',
    undefinedName: '未定義の名前',
    unique: '一意',
    upload: 'アップロード',
    uploadErrorConfirm: {
      message: `ファイルのアップロード中にエラーが発生しました：{{error}}\n
再試行しますか？`,
    },
    uploadFileChangedError:
      '選択したファイルは、選択後に変更されたようです。もう一度選択し直してください。',
    uploadingFile: 'ファイルをアップロード中（{{progressPercent}}%）',
    value: '値',
    view: '表示',
    warning: '警告',
    warning_plural: '警告',
    yes: 'はい',
    date: {
      aMomentAgo: 'たった今',
      hour: '時間',
      hour_other: '時間',
      day: '日',
      day_other: '日',
      minute: '分',
      minute_other: '分',
      week: '週間',
      week_other: '週間',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} })前`,
    },
    paginator: {
      firstPage: '最初のページ',
      itemsPerPage: '1ページあたりの項目数',
      lastPage: '最後のページ',
      nextPage: '次のページ',
      previousPage: '前のページ',
    },
    table: {
      visibleColumns: '表示する列',
    },
  },

  confirm: {
    strongConfirmInputLabel: '確認のため、次のテキストを入力してください：**{{strongConfirmRequiredText}}**',
  },

  dropzone: {
    acceptedFilesMessage: '（受け付けるのは{{acceptedExtensions}}ファイルのみ、最大サイズは{{maxSize}}です）',
    error: {
      fileNotValid: '選択されたファイルは無効です',
      fileTooBig: '選択されたファイルが大きすぎます',
      invalidFileExtension: '無効なファイル拡張子です：{{extension}}',
    },
    message: 'ファイルをここにドラッグ＆ドロップするか、クリックして選択してください',
    selectedFile: '選択したファイル',
    selectedFile_other: '選択したファイル',
  },

  error: {
    pageNotFound: 'ページが見つかりません',
  },

  geo: {
    area: '面積',
    vertices: '頂点',
    perimeter: '周囲長',
  },

  files: {
    header: 'ファイル',
    missing: ' 見つからないファイル：{{count}}件',
    totalSize: '合計サイズ：{{size}}',
    fileName: 'ファイル名',
    fileSize: 'ファイルサイズ',
  },

  sidebar: {
    logout: 'ログアウト',
  },

  header: {
    myProfile: 'マイプロフィール',
    qrCodeLoginDialog: {
      title: 'QRコードでArena Mobileにログイン',
      instructions: `1. モバイル端末で**Arena Mobile**アプリを起動
2. **設定**メニューに移動
3. **サーバーへの接続**を選択
4. **QRコードでログイン**を押す
5. この画面に表示されているQRコードをスキャン`,
      success: 'ログインに成功しました！',
      error: 'QRコードの生成中にエラーが発生しました：{{error}}',
    },
  },

  nodeDefsTypes: {
    integer: '整数',
    decimal: '小数',
    text: 'テキスト',
    date: '日付',
    time: '時刻',
    boolean: '真偽値',
    code: 'コード',
    coordinate: '座標',
    geo: '地理空間',
    taxon: '分類群',
    file: 'ファイル',
    entity: 'エンティティ',
  },

  // ====== App modules and views

  appModules: {
    home: 'ホーム',
    landing: 'ランディング',
    dashboard: 'ダッシュボード',
    surveyNew: '新規調査',
    surveys: '調査',
    templateNew: '新規テンプレート',
    templates: 'テンプレート',
    usersAccessRequest: 'ユーザーアクセス申請',
    collectImportReport: 'Collectインポートレポート',

    surveyInfo: '調査情報',
    designer: '調査',
    formDesigner: 'フォームデザイナー',
    surveyHierarchy: '階層構造',
    surveyDependencyTree: '依存関係ツリー',
    category: 'カテゴリ',
    categories: 'カテゴリ',
    nodeDef: 'ノード定義',
    taxonomy: '分類体系',
    taxonomies: '分類体系',

    data: 'データ',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: '記録検証レポート',
    explorer: 'エクスプローラー',
    map: '地図',
    charts: 'グラフ',
    export: 'データエクスポート',
    import: 'データインポート',
    validationReport: '検証レポート',

    users: 'ユーザー',
    user: 'ユーザープロフィール',
    userPasswordChange: 'パスワードを変更',
    userInvite: 'ユーザーを招待',
    userNew: '新規ユーザー',
    usersSurvey: 'ユーザー一覧',
    userGroup: 'ユーザーグループ',
    userGroup_plural: 'ユーザーグループ',
    userGroupNew: '新規ユーザーグループ',
    usersList: 'ユーザー一覧（全体）',
    user2FADevice: '2FAデバイス',
    user2FADevice_plural: '2FAデバイス',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_plural)',

    analysis: '分析',
    chain: '処理チェーン',
    chain_plural: '処理チェーン',
    virtualEntity: '仮想エンティティ',
    entities: '仮想エンティティ',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'インスタンス',

    message: 'メッセージ',
    message_plural: '$t(common.message_plural)',

    jobMonitor: 'ジョブモニター',

    help: 'ヘルプ',
    about: 'このアプリについて',
    disclaimer: '免責事項',
    userManual: 'ユーザーマニュアル',
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'このセクションは調査が公開されている場合のみ利用できます',
  },

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
    loginUsingBackupCode: '2FAバックアップコードでログイン',
    forgotPassword: 'パスワードをお忘れですか',
    sendPasswordResetEmail: 'パスワード再設定メールを送信',
    twoFactorBackupCode: '2FAバックアップコード',
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
$t(accessRequestView.whitelistSenderSuggestion)

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

  surveyDependencyTreeView: {
    dependencyTypesLabel: '依存関係の種類',
    dependencyTypes: {
      applicable: '適用性',
      defaultValues: 'デフォルト値',
      editable: '編集可能',
      fileName: 'ファイル名',
      itemsFilter: '項目フィルター',
      maxCount: '最大数',
      minCount: '最小数',
      parentCode: '親コード',
      validations: '検証ルール',
      visible: '表示',
    },
    selectAtLeastOneDependencyType: '少なくとも1つの依存関係の種類を選択してください',
    noDependenciesToDisplay: '表示する依存関係がありません',
  },

  designerView: {
    formPreview: 'フォームプレビュー',
  },

  recordView: {
    justDeleted: 'この記録は削除されたばかりです',
    sessionExpired: '記録のセッションの有効期限が切れました',
    errorLoadingRecord: '記録の読み込み中にエラーが発生しました：{{details}}',
    recordEditModalTitle: '記録：{{keyValues}}',
    recordNotFound: '記録が見つかりません',
    keyAttributeEditing: {
      lock: 'キー属性の編集をロック',
      unlock: 'キー属性の編集を許可',
    },
    qualifierAttributeEditing: {
      lock: '修飾子属性の編集をロック',
      unlock: '修飾子属性の編集を許可',
    },
  },

  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'このカスタム集計関数を削除しますか？',
      sqlExpression: 'SQL式',
    },
    editRecord: '記録を編集',
  },

  mapView: {
    changeMarkerColor: 'マーカーの色を変更',
    createRecord: '新規記録を作成',
    editRecord: '記録を編集',
    elevation: '標高（m）',
    location: '位置',
    locationEditInfo: '地図をダブルクリックするか、マーカーをドラッグして位置を更新してください',
    locationNotValidOrOutOfRange: '位置が無効か、UTMゾーンの範囲外です',
    locationUpdated: '位置を更新しました',
    options: {
      showLocationMarkers: '位置マーカーを表示',
      showMarkersLabels: `マーカーのラベルを表示`,
      showSamplingPolygon: `サンプリングポリゴン`,
      showControlPoints: `管理点`,
      showPlotReferencePoint: `プロット基準点`,
      showUtmGrid: 'UTMグリッドを表示',
    },
    rulerTooltip: `ボタンを押すと距離の測定を開始します。
- 複数回クリックすると経路を測定できます
- ダブルクリックまたはESCキーで測定を終了します
- もう一度ボタンを押すと測定結果を非表示にします`,
    samplingPointDataLayerName: '抽出地点データ - レベル{{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName)（読み込み中...）',
    samplingPointItemPopup: {
      title: '抽出地点項目',
      levelCode: 'レベル{{level}}のコード',
    },
    selectedPeriod: '選択中の期間',
  },

  samplingPolygonOptions: {
    circle: '円',
    controlPointOffsetEast: '基準点オフセット（東方向、m）',
    controlPointOffsetNorth: '基準点オフセット（北方向、m）',
    lengthLatitude: '緯度方向の長さ（m）',
    lengthLongitude: '経度方向の長さ（m）',
    numberOfControlPoints: '管理点の数',
    numberOfPointsEast: '東方向の管理点数',
    numberOfPointsNorth: '北方向の管理点数',
    offsetEast: 'オフセット（東方向、m）',
    offsetNorth: 'オフセット（北方向、m）',
    radius: '半径（m）',
    rectangle: '長方形',
    samplingPolygon: 'サンプリングポリゴン',
    shape: '形状',
  },

  kmlUploader: {
    opacity: '不透明度',
    selectFile: 'ファイルを選択',
    title: 'KML/KMZ/Shapefileオプション',
  },

  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: '比較する期間を選択',
    falseColor: 'フォールスカラー',
  },

  surveysView: {
    chains: '処理チェーン',
    confirmUpdateSurveyOwner: `調査「{{surveyName}}」の所有者を「{{ownerName}}」に変更しますか？`,
    cycles: 'サイクル',
    datePublished: '公開日',
    editUserExtraProps: 'ユーザー追加プロパティを編集',
    editUserExtraPropsForSurvey: '調査「{{surveyName}}」のユーザー追加プロパティを編集',
    filter: '絞り込み',
    filterPlaceholder: '名前、ラベル、所有者で絞り込み',
    languages: '言語',
    nodes: 'ノード',
    noSurveysMatchingFilter: '指定した条件に一致する調査がありません',
    onlyOwn: '自分の調査のみ',
    records: '記録',
    recordsCreatedWithMoreApps: '複数のアプリで作成された記録：',
    status: {
      published: '公開済み',
      draft: '下書き',
      'published-draft': '公開済み/下書き',
    },
  },

  usersAccessRequestView: {
    status: {
      ACCEPTED: '承認済み',
      CREATED: '保留中',
    },
    acceptRequest: {
      accept: '承認',
      acceptRequestAndCreateSurvey: '申請を承認して調査を作成',
      confirmAcceptRequestAndCreateSurvey:
        '**{{email}}**のアクセス申請を**{{role}}**として承認し、新しい調査**{{surveyName}}**を作成しますか？',
      error: 'アクセス申請の承認中にエラーが発生しました：{{error}}',
      requestAcceptedSuccessfully: 'アクセス申請を承認しました。$t(common.emailSentConfirmation)',
      surveyLabel: '調査ラベル',
      surveyLabelInitial: '（必要に応じて調査名とラベルを変更してください）',
      surveyName: '調査名',
      template: 'テンプレート',
    },
  },

  userView: {
    scale: '拡大縮小',
    rotate: '回転',
    dragAndDrop: '上に画像をドロップするか、',
    upload: 'アップロード',
    remove: 'プロフィール画像を削除しますか？',
    sendNewInvitation: '招待を再送信',
    removeFromSurvey: '調査から削除',
    confirmRemove: '{{user}}の調査{{survey}}へのアクセスを取り消してもよろしいですか？',
    removeUserConfirmation: 'ユーザー{{user}}を調査{{survey}}から削除しました',
    maxSurveysUserCanCreate: 'ユーザーが作成できる調査の最大数',
    preferredUILanguage: {
      label: '優先UI言語',
      auto: '自動検出（{{detectedLanguage}}）',
    },
    newPassword: 'パスワード',
    confirmPassword: 'パスワード（確認）',
    manageTwoFactorDevices: {
      label: '2FAを管理',
      title: '二要素認証デバイスの管理',
    },
  },

  userPasswordChangeView: {
    changingPasswordForUser: 'パスワードを変更するユーザー：{{user}}',
    oldPassword: '現在のパスワード',
    newPassword: '新しいパスワード',
    confirmPassword: '新しいパスワード（確認）',
    changePassword: 'パスワードを変更',
    passwordChangedSuccessfully: 'パスワードを変更しました！',
    notAuthorizedToChangePasswordOfAnotherUser: '他のユーザーのパスワードを変更する権限がありません',
  },

  userInviteView: {
    confirmInviteSystemAdmin: 'ユーザー{{email}}をシステム管理者として招待しますか？',
    confirmInviteSystemAdmin_other: 'ユーザー{{email}}をシステム管理者として招待しますか？',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}}件のアドレスをスキップしました（既にこの調査に招待済みです）：{{skippedEmails}}`,
    invalidEmailsWarning: `メールアドレス{{emails}}に到達できませんでした。存在しない可能性があります。以下のリストに残していますので、修正するか削除してから再度招待してください。`,
    invalidEmailsWarning_other: `メールアドレス{{emails}}に到達できませんでした。存在しない可能性があります。以下のリストに残していますので、修正または削除してから再度招待してください。`,
    groupPermissions: {
      label: '権限',
      systemAdmin: `
        <li>すべてのシステムアクセス権限</li>`,
      surveyManager: `
        <li>調査：
          <ul>
            <li>作成</li>
            <li>複製</li>
            <li>自分の調査を編集</li>
            <li>自分の調査を削除</li>
          </ul>
        </li>
        <li>ユーザー：
          <ul>
            <li>自分の調査にユーザーを招待</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>調査：
          <ul>
            <li>複製</li>
            <li>自分の調査を編集</li>
            <li>自分の調査を削除</li>
          </ul>
        </li>
        <li>ユーザー：
          <ul>
            <li>自分の調査にユーザーを招待</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>調査：
          <ul>
            <li>自分の調査を編集</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>データ：
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>地図ツールへのアクセス</li>
          </ul>
        </li>
        <li>分析：
          <ul>
            <li>すべてのツールへのフルアクセス権限</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>データ：
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>データ検証ツールへのアクセス</li>
        <li>記録を「分析」フェーズへ提出</li>`,
      dataEditor: `
        <li>データ：
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>新規記録の追加（自分の調査）</li>
        <li>既存記録の編集（自分の調査）</li>
        <li>記録を「クレンジング」フェーズへ提出</li>`,
    },
    messageOptional: 'メッセージ（任意）',
    messageInfo: `このメッセージはユーザーに送信されるメールに表示されます。
プレーンテキストまたはMarkdown記法（https://www.markdownguide.org）が使用できます。`,
    sendInvitation: '招待を送信',
    surveyNotPublishedWarning: `**警告**：調査は公開されていません。
      ユーザーを招待できるのは***$t(auth:authGroups.systemAdmin.label)***と***$t(auth:authGroups.surveyAdmin.label)***の役割のみです。
      それ以外の役割でユーザーを招待したい場合は、先に調査を公開してください。`,
    typeEmail: 'メールアドレスを入力し、追加ボタンを押してください',
  },

  user: {
    mapApiKeys: {
      title: '地図APIキー',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'このAPIキーは有効です',
      keyIsNotCorrect: 'このAPIキーは無効です',
    },
    title: '敬称',
    titleValues: {
      mr: 'Mr',
      ms: 'Ms',
      preferNotToSay: '回答しない',
    },
  },

  chainView: {
    baseUnit: {
      confirmDelete: '基本単位を削除すると、すべての「面積ベース変数」の選択が解除されます。続行しますか？',
    },
    downloadSummaryJSON: '概要をダウンロード（JSON）',
    firstPhaseCategory: '第1段階カテゴリ',
    firstPhaseCategoryInfo: '第1段階のサンプルを含むカテゴリを選択してください。',
    firstPhaseCategoryExtraProp: {
      label: '第1段階の層別属性',
      info: '第1段階のサンプリングにおいて、元の母集団を大まかな層に分けるために使用する$t(chainView.firstPhaseCategory)の追加プロパティ（カテゴリテーブルの列）を選択してください。',
    },
    firstPhaseCommonAttribute: {
      label: '共通属性',
      info: `基本単位と第1段階テーブルで共通する属性
（コード属性またはテキスト属性である必要があります。その値は第1段階カテゴリに定義された追加プロパティと照合されます。属性名は追加プロパティ名と一致している必要はありません）`,
    },
    formLabel: '処理チェーンのラベル',
    basic: '基本',
    records: '記録',
    recordsInStepCount: '{{step}}：{{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: '分析ステップのデータのみをRStudioに送信',
    submitOnlySelectedRecordsIntoR: '選択した記録のみをRStudioに送信',
    includeEntitiesWithoutData: 'データのないエンティティを含める',
    cannotStartRStudio: {
      common: 'RStudioを起動できません',
      noRecords: '$t(chainView.cannotStartRStudio.common)：送信する記録がありません',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common)：先に調査を公開してください',
    },
    nonResponseBiasCorrection: '無回答バイアス補正',
    nonResponseBiasCorrectionInfo: `重み付けクラス調整法を実装するには、層カテゴリテーブルに追加の数値プロパティとして「design_psu」と「design_ssu」を追加してください`,
    pValue: 'P値',
    resultsBackFromRStudio: 'RStudioからの結果を取り込む',
    resultsBackFromRStudioInfo: `RStudioで計算された結果属性をArenaサーバーに取り込む場合はこのオプションを有効にしてください。
処理に時間がかかる場合があります。`,
    samplingDesign: 'サンプリング設計',
    samplingDesignDetails: 'サンプリング設計の詳細',
    samplingStrategyLabel: 'サンプリング戦略',
    samplingStrategy: {
      simpleRandom: '単純無作為抽出',
      systematic: '系統抽出',
      stratifiedRandom: '層別無作為抽出',
      stratifiedSystematic: '層別系統抽出',
      twoPhase: '二相抽出',
    },
    statisticalAnalysis: {
      header: '統計分析',
      entityToReport: 'レポート対象のエンティティ',
      entityWithoutData: 'エンティティ{{name}}にはデータがありません',
      filter: 'フィルター（Rスクリプト）',
      reportingMethod: 'レポート方法',
      reportingMethods: {
        dimensionsCombined: 'ディメンションを組み合わせる',
        dimensionsSeparate: 'ディメンションを個別に表示',
      },
      reportingArea: '合計レポート面積（ha、任意）',
      reportingAreaInfo: `層別サンプリングの場合、層属性のカテゴリテーブル内で各層の面積を指定してください（列名「area」）`,
    },
    stratumAttribute: '層別属性',
    stratumAttributeInfo: 'サンプルの層別に使用する変数を選択してください。',
    stratumAttribute2ndPhase: '第2段階の層別属性',
    stratumAttribute2ndPhaseInfo:
      '最終的な詳細サブサンプルを抽出する前に、第1段階サンプルをさらに層別する変数を選択してください。',
    postStratificationAttribute: '事後層別属性',
    areaWeightingMethod: '面積重み付け方法',
    clusteringEntity: 'クラスタリングエンティティ',
    clusteringEntityInfo:
      '第一次抽出単位を定義するエンティティです。注：これはR surveyパッケージの枠組みにおけるクラスター分析にのみ使用されます。',
    clusteringOnlyVariances: '分散計算のみクラスタリングを使用',
    errorNoLabel: '処理チェーンには有効なラベルが必要です',
    dateExecuted: '実行日',
    deleteChain: '処理チェーンを削除',
    deleteConfirm: `この処理チェーンを削除しますか？

$t(common.cantUndoWarning)`,
    deleteComplete: '処理チェーンを削除しました',
    cloneFromAnotherSurvey: '別の調査から複製',
    cloneFromAnotherSurveyDialog: {
      title: '別の調査から処理チェーンを複製',
      sourceSurvey: '複製元の調査',
      sourceChain: '複製元の処理チェーン',
      entityCheck: 'エンティティの互換性',
      entityMissing: '対象調査に存在しません',
      skipMissingEntities: '対象調査に存在しないエンティティの分析属性をスキップ',
      noAnalysisAttributes: 'この処理チェーンには分析属性がありません',
      cloneComplete: '処理チェーンを複製しました',
      missingEntities: '複製できません：以下のエンティティが対象調査に存在しません：{{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles: `ノード定義「{{label}}」は、処理チェーンのすべてのサイクルに属していないため選択できません`,
    cannotSelectCycle: '一部のノード定義がこのサイクルに属していないため、このサイクルは選択できません',
    copyRStudioCode: `#### RStudio Serverを開こうとしています ####

##### OKボタンを押すと、以下のコマンドがクリップボードにコピーされます。 #####

###### RStudio Serverが開きます。RStudioコンソールが有効になったら、以下の行を貼り付けて実行し、処理チェーンのコードをインポートしてください： ######

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### 処理チェーンをRStudioへ ####

###### OKボタンを押すと、以下のコマンドがクリップボードにコピーされます。 ######

###### 自分のマシンでRStudioを起動してください（'rstudioapi'パッケージがインストールされている必要があります）。 ######

###### RStudioコンソールが有効になったら、以下の行を貼り付けて実行し、処理チェーンのコードをインポートしてください： ######


{{rStudioCode}}

`,
    entities: {
      new: '仮想エンティティ',
    },
    reportingDataCategory: 'カテゴリテーブル名',
    reportingDataAttribute: '{{level}}の属性',
    reportingDataTableAndJoinsWithAttributes: 'レポートデータテーブルと属性の結合',
    showSamplingAttributes: 'サンプリング属性を表示',
  },

  instancesView: {
    title: 'インスタンス',
    terminate: '終了',
  },
  chain: {
    quantitative: '量的',
    categorical: 'カテゴリ',
    addQuantitative: '量的属性を追加',
    addCategorical: 'カテゴリ属性を追加',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'このエンティティおよび関連するすべての結果変数はRStudioスクリプトから除外されます',
    entityWithoutData: 'エンティティ{{name}}にはデータがありません。$t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'エンティティ{{name}}は選択中のサイクルでは利用できません。$t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: '無効または期限切れのトークンです',
    },
  },

  itemsTable: {
    unused: '未使用',
    noItemsAdded: '項目が追加されていません',
  },

  expression: {
    functionHasTooFewArguments: '関数{{fnName}}には少なくとも{{minArity}}個の引数が必要です（{{numArgs}}個指定されました）',
    functionHasTooManyArguments: '関数{{fnName}}が受け付ける引数は最大{{maxArity}}個です（{{numArgs}}個指定されました）',
    identifierNotFound: '属性またはエンティティ「{{name}}」が見つかりません',
    invalid: '無効な式です：{{details}}',
    invalidAttributeValuePropertyName: '無効な属性値プロパティ名です：{{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: '無効な追加プロパティ名です：{{propName}}',
    invalidCategotyName: '無効なカテゴリ名です：{{name}}',
    invalidTaxonomyExtraProp: '無効な分類体系の追加プロパティ名です：{{propName}}',
    invalidTaxonomyName: '無効な分類体系名です：{{name}}',
    invalidTaxonVernacularNameLanguageCode: '無効な分類群通称名の言語コードです：{{vernacularLangCode}}',
    missingFunctionParameters: '関数のパラメータが不足しています',
    undefinedFunction: '未定義の関数です：{{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
このアプリについて
========

$t(common.appNameFull)
--------

 * 開発元：$t(links.openforis)
 * バージョン：{{version}}
 * ウェブサイト：$t(links.openforisArenaWebsite)
 * FAO elearning AcademyのArena動画チュートリアル：$t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * YouTubeのArena動画チュートリアル：$t(links.arenaVideoTutorialsInYouTube)
 * サポートフォーラム：$t(links.supportForum)
 * GitHub上のArena：$t(links.arenaInGitHub)
 * GitHub上のArena Rスクリプト：$t(links.arenaRScriptsInGitHub)
`,
    },
  },

  // ====== Survey views

  nodeDefEdit: {
    additionalFields: '追加フィールド',
    basic: '基本',
    advanced: '詳細設定',
    mobileApp: 'モバイルアプリ',
    print: '印刷',
    printProps: {
      printOrientation: {
        label: 'ページの向き',
        info: 'このエンティティが独自の印刷セクションを開始する際に使用される向きです。デフォルトはエクスポート時に選択されたドキュメントの向きを継承します。',
      },
      orientations: {
        default: 'デフォルト（ドキュメント）',
        portrait: '縦',
        landscape: '横',
      },
    },
    validations: '検証ルール',
    function: '関数',
    editingFunction: '関数{{functionName}}を編集中',
    editorHelp: {
      json: '有効な式はJavaScriptのサブセットです。',
      sql: '有効なSQL式のみが使用できます。',
    },
    editorCompletionHelp: '- 利用可能な変数と関数を表示',
    functionDescriptions: {
      categoryItemProp:
        '指定したコードを持つカテゴリ項目の、指定した$t(extraProp.label)の値を返します',
      dateTimeDiff: '2つの日時の組の差（分単位）を返します',
      distance: '指定した座標間の距離（メートル単位）を返します',
      first: '指定した複数属性またはエンティティの最初の値またはノードを返します',
      geoCoordinateAtDistance:
        '指定した座標から指定した距離・方位にある座標を返します',
      geoDistance: '$t(nodeDefEdit.functionDescriptions.distance)',
      geoPolygon: '座標のリストからGeoJSON形式のポリゴンを生成します',
      includes: '指定した複数属性に指定した値が含まれている場合にtrueを返します。',
      index: '指定したノードの、兄弟ノード内でのインデックスを返します',
      isEmpty: '引数に値が指定されていない場合にtrueを返します',
      isNotEmpty: '引数に何らかの値が指定されている場合にtrueを返します',
      last: '指定した複数属性またはエンティティの最後の値またはノードを返します',
      ln: 'Xの自然対数を返します',
      log10: 'Xの常用対数（底10）を返します',
      max: '引数のうち最大の値を返します',
      min: '引数のうち最小の値を返します',
      now: '現在の日付または時刻を返します',
      parent: '指定したノードの親エンティティを返します',
      pow: '底をべき乗した値を返します',
      prevCycleNote:
        '複数サイクルが定義されており、前サイクルへのリンクが有効な場合のみ、Arena Mobileで動作します',
      prevCycleValue:
        '前サイクルの記録における同じ属性の値を返します。$t(nodeDefEdit.functionDescriptions.prevCycleNote)',
      prevCycleValues:
        '前サイクルの記録における同じ属性群の値を返します。$t(nodeDefEdit.functionDescriptions.prevCycleNote)',
      recordCycle: '現在の記録のサイクルを返します',
      recordDateCreated:
        '現在の記録の作成日時を日時値として返します。テキスト、日付、または時刻属性で使用できます',
      recordDateLastModified:
        '現在の記録の最終更新日時を日時値として返します。テキスト、日付、または時刻属性で使用できます',
      recordOwnerEmail: '記録を所有するユーザーのメールアドレスを返します',
      recordOwnerName: '記録を所有するユーザーの名前を返します',
      recordOwnerRole: '記録を所有するユーザーの（現在の調査における）役割を返します',
      rowIndex: '現在のテーブル行（またはフォーム）のインデックスを返します',
      taxonProp: '指定したコードを持つ分類群の、指定した$t(extraProp.label)の値を返します',
      taxonVernacularName:
        '指定したコードを持つ分類群の、指定した言語での（最初の）通称名（現地名）を返します',
      unique: '複数属性またはエンティティの一意な値を返します',
      userEmail: 'ログイン中のユーザーのメールアドレスを返します',
      userIsRecordOwner:
        '記録を編集しているユーザーがその記録の所有者でもある場合は真偽値「true」、そうでなければ「false」を返します',
      userName: 'ログイン中のユーザーの名前を返します',
      userProp: 'ログイン中のユーザーの、指定した$t(extraProp.label)の値を返します',
      uuid: '識別子として使用できるUUID（汎用一意識別子）を生成します（例：エンティティのキー属性として）',
      // SQL functions
      avg: '数値変数の平均値を返します',
      count: '指定した条件に一致する行数を返します',
      sum: '数値変数の合計値を返します',
    },
    functionName: {
      rowIndex: '行インデックス',
    },
    basicProps: {
      analysis: '分析',
      autoIncrementalKey: {
        label: '自動連番',
        info: '値は自動的に生成されます',
      },
      autoCreateMinCountItems: {
        label: '最小項目数を自動作成',
        info: 'エンティティが適用対象になった時、または親エンティティが作成された時に、最小数に等しい数のエンティティが自動的に生成されます。',
      },
      displayAs: '表示形式',
      displayIn: '表示先',
      entitySource: 'エンティティのソース',
      enumerate: {
        label: '列挙',
        info: `エンティティ内でキーとして指定されたコード属性に関連付けられたカテゴリ項目を使用して、行が自動的に生成されます。行の追加・削除はできず、キーとなるコード属性も編集できません`,
      },
      enumeratingItemsExpression: {
        label: '列挙項目の式',
        info: '列挙するカテゴリ項目を絞り込む任意の式です（例：unique(table_source.source_type)）。空の場合、すべてのカテゴリ項目が使用されます。',
      },
      enumerator: {
        label: '列挙元',
        info: 'このカテゴリの項目を使って、親エンティティの行が生成されます',
      },
      form: 'フォーム',
      formula: '数式',
      includedInClonedData: '複製データに含める',
      includedInRecordsList: {
        label: '記録一覧に含める',
        info: `有効にすると、この属性が記録一覧に表示されます`,
      },
      key: 'キー',
      maxKeysCountReached: 'キーの最大数に達しました（{{maxKeysCount}}）',
      multiple: '複数',
      ownPage: '専用ページ',
      parentPage: '親ページ（{{parentPage}}）',
      qualifier: {
        label: '修飾子',
        info: `グループに所属するユーザーが新規記録を作成すると、この属性にはそのユーザーのグループに設定された修飾子の値が自動的に入力されます。グループに所属するユーザーは、自分のグループに属する記録のみを閲覧・編集できます。`,
      },
      table: 'テーブル',
    },
    advancedProps: {
      areaBasedEstimate: '面積ベース推定',
      defaultValues: 'デフォルト値',
      defaultValuesInfo: `特定のルールに基づいて回答を自動入力できます。
複数のルールを設定した場合、システムは上から順にチェックします。
条件に一致する最初のルールが適用され、その結果が回答として使用されます。`,
      defaultValueEvaluatedOneTime: 'デフォルト値は一度だけ評価',
      defaultValueEvaluatedOneTimeInfo: `属性が作成される時に一度だけデフォルト値が評価されます。
チェックしない場合、記録が更新されるたびにデフォルト値が再評価されます。
now()やuuid()のように、属性値が最初に生成される時だけ評価されるべき式を使う場合はチェックしてください。`,
      defaultValuesNotEditableForAutoIncrementalKey: '自動連番キーが設定されているため、デフォルト値は編集できません',
      defaultValuesNotSpecified: 'デフォルト値が指定されていません',
      defaultValuesSpecified: 'デフォルト値が指定されています',
      editableIf: '編集可能性',
      editableIfInfo: `デフォルトでは、ユーザーは常に該当するフィールドにアクセスできます。
ここでは、このフィールドに入力・変更できるかどうかのルールを設定できます。
設定した条件が満たされている場合は編集可能に、そうでない場合は「読み取り専用」（ロック）になります。`,
      editableAlways: '常に編集可能',
      editableIfConditionIsMet: '条件を満たす場合に編集可能',
      hidden: '常に非表示',
      hiddenInReport: '分析ダッシュボードで非表示',
      hiddenInReportInfo: `有効にすると、この属性は分析ダッシュボードに表示されません`,
      hiddenWhenNotRelevant: '適用対象外の場合は非表示',
      itemsFilter: '項目フィルター',
      itemsFilterInfo: `選択可能な項目を絞り込むために使用される式です。
式の中では「this」という単語がその項目自体を指します。
例：this.region = region_attribute_name
（「region」は項目に定義された追加プロパティの名前、region_attribute_nameは調査内の属性名です）`,
      readOnly: '読み取り専用',
      relevantIf: '適用性',
      relevantIfInfo: `デフォルトでは、すべてのフィールドは常に有効です。
適用ルールを設定し、それが満たされない場合、フィールドはグレー表示または完全に非表示になり、
自動入力された回答も無視されます。
調査の一部を動的に表示・非表示にするために使用します。例：前の質問で「その他」を選択した場合のみ「詳細を記入」テキストボックスを表示する、など。`,
      relevantIfRadioNone: '常に適用',
      relevantIfRadioDefined: '条件を満たす場合に適用',
      script: 'スクリプト',
      visibleIf: '可視性',
      visibleIfInfo: `デフォルトでは、フィールドは常に表示されます。
ルールを設定すると、そのルールが満たされる場合のみ表示され、それ以外は非表示になります。
注：「適用対象外」で非表示になるフィールドとは異なり、非表示になったフィールドでも裏側で自動入力された回答が保存され続ける場合があります。
ユーザーの役割など、ログインしているユーザーに応じて調査の特定部分を非表示にする場合に最適です。`,
      visibleAlways: '常に表示',
      visibleIfConditionIsMet: '条件を満たす場合に表示',
    },
    mobileAppProps: {
      hiddenInMobile: {
        label: 'Arena Mobileで非表示',
        info: `有効にすると、この属性はArena Mobileに表示されません`,
      },
      includedInMultipleEntitySummary: {
        label: '複数エンティティの概要に含める',
        info: `有効にすると、この属性はエンティティ概要ビュー（Arena Mobile内）に表示されます`,
      },
      includedInPreviousCycleLink: {
        label: '前サイクルへのリンクに含める',
        info: `有効にすると、モバイルアプリで前サイクルへのリンクが有効な場合、データ入力フォームに前サイクルの値が表示されます`,
      },
    },
    numericProps: {
      unit: '単位',
    },
    decimalProps: {
      maxNumberDecimalDigits: '小数点以下の最大桁数',
    },
    fileProps: {
      fileNameExpression: 'ファイル名の式',
      fileType: 'ファイルの種類',
      fileTypes: {
        image: '画像',
        video: '動画',
        audio: '音声',
        other: 'その他',
      },
      maxFileSize: '最大ファイルサイズ（MB）',
      numberOfFiles: 'ファイル数の最小・最大を変更するには「検証ルール」に移動してください。',
      showGeotagInformation: 'ジオタグ情報を表示',
    },
    mobileProps: {
      title: 'モバイルアプリ',
    },
    formHeaderProps: {
      headerColorLabel: 'ヘッダーの色',
      headerColor: {
        blue: '青',
        green: '緑',
        orange: 'オレンジ',
        red: '赤',
        yellow: '黄',
      },
    },
    textProps: {
      displayAsTypes: {
        hyperlink: 'ハイパーリンク',
        markdown: 'Markdown',
        text: 'テキスト',
      },
      textInputType: 'テキスト入力タイプ',
      textInputTypes: {
        singleLine: '1行',
        multiLine: '複数行',
      },
      textTransform: 'テキスト変換',
      textTransformTypes: {
        none: 'なし',
        capitalize: '先頭大文字',
        uppercase: '大文字',
        lowercase: '小文字',
      },
    },
    booleanProps: {
      labelValue: 'ラベルの値',
      labelValues: {
        trueFalse: '$t(common.true)/$t(common.false)',
        yesNo: '$t(common.yes)/$t(common.no)',
      },
    },
    codeProps: {
      category: 'カテゴリ',
      codeShown: 'コードを表示',
      displayAsTypes: {
        checkbox: 'チェックボックス',
        dropdown: 'ドロップダウン',
      },
      parentCode: '親コード',
    },
    coordinateProps: {
      allowOnlyDeviceCoordinate: 'デバイスの座標のみ許可',
      allowOnlyDeviceCoordinateInfo: `Arena Mobileにのみ適用されます：チェックすると、ユーザーはX/Y値を手動で編集できず、デバイスのGPSでのみ座標を取得できるようになります`,
      mapMarkerColor: '地図マーカーの色',
    },
    expressionsProp: {
      expression: '式',
      applyIf: '適用条件',
      confirmDelete: 'この式を削除しますか？',
      severity: '重要度',
    },
    validationsProps: {
      minCount: '最小数',
      maxCount: '最大数',
      expressions: '検証式',
      attributeAlwaysValid: '属性は常に有効',
      attributeValidWhenConditionIsMet: '条件を満たす場合に属性は有効',
    },
    cannotChangeIntoMultipleWithDefaultValues:
      'デフォルト値が設定されているため、このノードを複数に変換できません。',
    cannotDeleteNodeDefReferenced: `「{{nodeDef}}」は以下のノード定義から参照されているため削除できません：{{nodeDefDependents}}`,
    cloneDialog: {
      confirmButtonLabel: '複製',
      title: 'ノード定義「{{nodeDefName}}」を複製',
      entitySelectLabel: '複製先のエンティティ：',
    },
    conversion: {
      dialogTitle: '{{nodeDefName}}を別の型に変換',
      fromType: '変換元の型',
      toType: '変換先の型',
    },
    moveDialog: {
      confirmButtonLabel: '移動',
      title: 'ノード定義「{{nodeDefName}}」を「{{parentNodeDefName}}」から移動',
      entitySelectLabel: '移動先のエンティティ：',
    },
    movedNodeDefinitionHasErrors: '移動したノード定義「{{nodeDefName}}」にはエラーがあります。修正してください。',
    nodeDefintionsHaveErrors: '以下のノード定義にはエラーがあります：{{nodeDefNames}}。修正してください。',
    filterVariable: '項目を絞り込む変数',
    filterVariableForLevel: '{{levelName}}用の変数',
    unique: {
      label: '一意',
      info: `属性を**一意**としてマークすると、その値は最も近い複数エンティティ内で一意である必要があります（そうでない場合はエラーが表示されます）。

---

例：*クラスター → プロット → 樹木*のような構造で、属性*tree_species*を**一意**としてマークすると、同じ*プロット*内では樹種ごとに1本の木しか登録できません。`,
    },
    nodeDefClonedSuccessfully:
      'ノード定義「{{nodeDefName}}」を「{{targetParentNodeDefName}}」に複製しました',
    categoriesClonedFromSurvey: '以下のカテゴリも複製元の調査から複製されました：{{names}}',
    taxonomiesClonedFromSurvey: '以下の分類体系も複製元の調査から複製されました：{{names}}',
  },

  languagesEditor: {
    languages: '言語',
  },

  taxonomy: {
    header: '分類体系',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: '分類体系{{taxonomyName}}を削除しますか？\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: '別の調査から分類体系を複製',
      sourceSurvey: '複製元の調査',
      sourceTaxonomy: '複製元の分類体系',
      loadingSurveys: '調査を読み込み中...',
      noSurveysAvailable: '利用可能な調査がありません',
      selectSurveyFirst: '先に調査を選択してください',
      loadingTaxonomies: '分類体系を読み込み中...',
      noTaxonomiesAvailable: '選択した調査に利用可能な分類体系がありません',
    },
    edit: {
      taxonomyListName: '分類体系リスト名',
      taxaNotImported: 'インポートされなかった分類群',
      family: '科',
      genus: '属',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: '異名/ラテン語名',
      extraPropsNotDefined: 'この分類体系には追加プロパティが定義されていません',
      importMissingPublishedTaxa:
        'インポートファイルに見つからず、変更されなかった公開済み分類群：{{count}}件。コード：{{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa)（他{{extra}}件）',
    },
    taxaCount: '分類群の数',
    vernacularNameLabel: '通称名ラベル',
  },

  categoryList: {
    batchImport: 'カテゴリを一括インポート（ZIPから）',
    batchImportCompleteSuccessfully: `{{importedCategories}}件のカテゴリをインポートしました！
新規：{{insertedCategories}}件
更新：{{updatedCategories}}件`,
    cloneFromAnotherSurvey: {
      title: '別の調査からカテゴリを複製',
      sourceSurvey: '複製元の調査',
      sourceCategory: '複製元のカテゴリ',
      loadingSurveys: '調査を読み込み中...',
      noSurveysAvailable: '利用可能な調査がありません',
      selectSurveyFirst: '先に調査を選択してください',
      loadingCategories: 'カテゴリを読み込み中...',
      noCategoriesAvailable: '選択した調査に利用可能なカテゴリがありません',
    },
    itemsCount: '項目数',
    structure: '構造',
    types: {
      flat: 'フラット',
      hierarchical: '階層',
      reportingData: 'レポートデータ',
      geoPackage: 'GeoPackage',
      samplingPointData: '抽出地点データ',
    },
  },

  categoryEdit: {
    header: 'カテゴリ',
    addLevel: 'レベルを追加',
    categoryName: 'カテゴリ名',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    confirmDelete: 'カテゴリ{{categoryName}}を削除しますか？\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'このカテゴリは**空**のため削除されます。続行しますか？',
    confirmDeleteLevel: `カテゴリレベル「{{levelName}}」をすべての項目とともに削除しますか？\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `この項目を削除しますか？

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `この項目をすべての子項目とともに削除しますか？

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'レポートデータに変換',
      confirmMessage: `このカテゴリをレポートデータカテゴリに変換しますか？

レベルはlevel_1、level_2...level_Nに名前が変更され、項目に追加の「area」プロパティが追加されます。`,
    },
    convertToSimpleCategory: {
      confirmMessage: `このレポートデータカテゴリを単純カテゴリに変換しますか？`,
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: '抽出地点データに変換',
      confirmMessage: `このカテゴリを抽出地点データカテゴリに変換しますか？

カテゴリ名は「${samplingPointDataCategoryName}」に変更され、項目に「${locationItemExtraDefName}」の追加プロパティが追加されます。`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'GeoPackageカテゴリに変換',
      confirmMessage: `このカテゴリをGeoPackageカテゴリに変換しますか？

項目に「${locationItemExtraDefName}」の追加プロパティが追加されます。`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: '単純カテゴリに変換',
      confirmMessage: `このGeoPackageカテゴリを単純カテゴリに変換しますか？

「${locationItemExtraDefName}」の追加プロパティのロックが解除され、他の追加プロパティと同様に名前変更・型変更・削除ができるようになります。データ自体には影響しません。`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: '単純カテゴリに変換',
      confirmMessage: `この抽出地点データカテゴリを単純カテゴリに変換しますか？

カテゴリ名はクリアされ（新しい名前を付ける必要があります）、「${locationItemExtraDefName}」の追加プロパティのロックが解除され、他の追加プロパティと同様に名前変更・型変更・削除ができるようになります。データ自体には影響しません。`,
    },
    geoPackageCategory: 'これはGeoPackageカテゴリです',
    samplingPointDataCategoryType: 'これは抽出地点データカテゴリです',
    createCategory: {
      menuLabel: 'カテゴリを追加',
      simple: '単純カテゴリ',
      otherTypes: 'その他のカテゴリタイプ',
    },
    createSamplingPointDataCategory: {
      buttonLabel: '抽出地点データカテゴリ',
      message: `新しい抽出地点データカテゴリを作成しますか？

項目に「${locationItemExtraDefName}」の追加プロパティが追加されます。`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'GeoPackageカテゴリ',
      message: `新しいGeoPackageカテゴリを作成しますか？

項目に「${locationItemExtraDefName}」の追加プロパティが追加されます。`,
    },
    deleteItem: '項目を削除',
    level: {
      title: 'レベル{{levelPosition}}',
      noItemsDefined: '項目が定義されていません',
      selectItemFromPreviousLevel: '前のレベルから項目を選択してください',
    },

    importSummary: {
      columns: '列',
      columnTypeSummary: 'レベル{{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: '説明（{{language}}）',
      columnTypeLabel: 'ラベル（{{language}}）',
      columnType: {
        code: 'コード',
        description: '説明',
        label: 'ラベル',
        extra: '$t(extraProp.label)',
      },
      dataType: 'データ型',
      title: 'カテゴリインポート概要',
    },
    reportingData: 'レポートデータ',
    exportToGeoPackage: 'GeoPackageにエクスポート',
    exportToGeoPackageSkippedItems: '有効な位置情報がないため{{count}}件の項目をスキップしました。',
    templateFor_samplingPointDataImport_csv: '抽出地点データインポート用テンプレート（CSV）',
    templateFor_samplingPointDataImport_xlsx: '抽出地点データインポート用テンプレート（Excel）',
  },

  extraProp: {
    label: '追加プロパティ',
    label_plural: '追加プロパティ',
    addExtraProp: '追加プロパティを追加',
    dataTypes: {
      geometryPoint: 'ジオメトリポイント',
      number: '数値',
      text: 'テキスト',
    },
    editor: {
      title: '$t(extraProp.label_plural)を編集',
      confirmDelete: '追加プロパティ「{{name}}」を削除しますか？',
      confirmSave: `追加プロパティ定義への変更を保存しますか？

  **警告**：

  {{warnings}}`,
      warnings: {
        nameChanged: '名前が{{nameOld}}から{{nameNew}}に変更されました',
        dataTypeChanged: 'データ型が{{dataTypeOld}}から{{dataTypeNew}}に変更されました',
      },
    },
    name: 'プロパティ{{position}}の名前',
    value: '値',
  },

  record: {
    ancestorNotFound: '記録内に上位階層ノードが見つかりません',
    keyDuplicate: '記録キーが重複しています',
    oneOrMoreInvalidValues: '1つ以上の値が無効です',
    uniqueAttributeDuplicate: '値が重複しています',

    attribute: {
      customValidation: '無効な値',
      uniqueDuplicate: '値が重複しています',
      valueInvalid: '無効な値',
      valueRequired: '値は必須です',
    },
    entity: {
      keyDuplicate: 'エンティティキーが重複しています',
    },
    nodes: {
      count: {
        invalid: '{{nodeDefName}}のノード数はちょうど{{count}}である必要があります',
        maxExceeded: '{{nodeDefName}}のノード数は{{maxCount}}以下である必要があります',
        minNotReached: '{{nodeDefName}}のノード数は{{minCount}}以上である必要があります',
      },
    },
  },

  // ====== Common components

  expressionEditor: {
    and: 'AND',
    or: 'OR',
    group: 'グループ ()',
    var: '変数',
    const: '定数値',
    call: '関数',
    operator: '演算子',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: '起点となる座標属性',
      distanceAttribute: '距離属性',
      bearingAttribute: '方位属性',
    },
    coordinateAttributeWithPosition: '座標属性{{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: '1つ目の日付属性',
      firstTimeAttribute: '1つ目の時刻属性',
      secondDateAttribute: '2つ目の日付属性',
      secondTimeAttribute: '2つ目の時刻属性',
    },
    error: {
      selectOneVariable: '変数を1つ選択してください',
    },

    header: {
      editingExpressionForNodeDefinition: '「{{nodeDef}}」の{{qualifier}}式を編集中',
      editingFunctionForNodeDefinition: '「{{nodeDef}}」の関数「{{functionName}}」を編集中',
    },

    qualifier: {
      'default-values': 'デフォルト値',
      'default-values-apply-if': 'デフォルト値の適用条件',
      'editable-if': '編集可能条件',
      'max-count': '最大数',
      'min-count': '最小数',
      'relevant-if': '適用条件',
      validations: '検証ルール',
      'validations-apply-if': '検証ルールの適用条件',
      'visible-if': '可視性',
    },

    selectAFunction: '関数を選択',

    valueType: {
      constant: '定数',
      expression: '式',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>`,
    arenaVideoTutorialsInFaoElearningAcademy: `<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>`,
    arenaVideoTutorialsInYouTube: `<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>`,
    arenaInGitHub: `<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>`,
    arenaRScriptsInGitHub: `<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>`,
  },

  aiExpression: {
    title: '説明から式を生成',
    hint: '式にどんな動作をさせたいかを自然な言葉で説明してください。AIがArenaの構文に変換します。Ctrl+Enterで生成します。',
    placeholder: '例：木の高さは0より大きく200未満である必要がある',

    generate: '生成',
    generating: '生成中…',
    use: 'この式を使用',
    useAnyway: 'このまま使用',
    tryAgain: '別の説明を試す',
    parseError:
      '生成された式を正しく解析できませんでした：{{message}}。そのまま適用して手動で編集することもできますし、説明を言い換えて再試行することもできます。',

    explain: {
      title: 'この式を説明',
      thinking: 'AIにこの式の説明を依頼しています…',
      error: '説明の取得に失敗しました：{{message}}',
      timeout: 'AIの応答に時間がかかりすぎました。もう一度お試しください。',
    },
  },

  aiTranslation: {
    translateButton_one: '他の{{count}}言語に翻訳',
    translateButton_other: '他の{{count}}言語に翻訳',
    translateButton: '他の言語に翻訳',

    success_one: '{{count}}言語に翻訳しました。確認して保存してください。',
    success_other: '{{count}}言語に翻訳しました。確認して保存してください。',
    success: '翻訳しました。確認して保存してください。',

    failed: '翻訳に失敗しました：{{message}}',
    timeout: '翻訳リクエストがタイムアウトしました。もう一度お試しください。',
  },

  aiActivityLog: {
    title: 'アクティビティログの要約',
    summarizeButton: '要約する',
    thinking: 'イベントを集計し、AIに要約を依頼しています…',
    error: '要約の取得に失敗しました：{{message}}',
  },

  aiChatbot: {
    open: 'ヘルプとドキュメント',
    title: 'ヘルプとドキュメント',
    empty: 'Open Foris Arenaについて何でも聞いてください。',
    placeholder: '質問を入力してください…',
    send: '送信',
    stop: '停止',
    clear: 'クリア',
    showReasoning: '思考過程を表示',
    error: 'チャットボットエラー：{{message}}',
    language: '応答言語',
  },
}
