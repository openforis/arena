import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

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
    entity: '項目',
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
    false: '誤',
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

この操作により、既に入力されたデータが恒久的に変更または消去される可能性があります。

データを更新せずに公開したい場合は、下の「データ更新をスキップ」にチェックを入れてください（非推奨）。`,
    publishRecordValuesUpdateConfirmHeader: '既存の記録データが更新されます',
    publishRecordValuesUpdateConfirmOk: '公開してデータを更新',
    publishRecordValuesUpdateConfirmInputLabel: '確認のため、調査名「{{strongConfirmRequiredText}}」を入力してください',
    publishRecordValuesUpdateReasonAttributeChanged:
      '以下の属性が変更され、既存の記録内でその値が自動的に再計算されます：**{{attributeNames}}**。',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      '以下の属性は、変更されたカテゴリまたは分類体系の追加プロパティを使用しているため、既存の記録内でその値が再計算されます：**{{attributeNames}}**。',
    publishSkipDataUpdate: 'データ更新をスキップ',
    publishSkipDataUpdateConfirmOk: 'データ更新をスキップして公開',
    publishSkipDataUpdateImplications: 'データ更新をスキップすると、次のようになります：\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData: '既存の記録が新しい調査定義と一致しなくなる場合があります',
    publishSkipDataUpdateImplicationStaleValues: '影響を受ける値は、手動で再入力するまで再計算されません',
    publishSkipDataUpdateImplicationChains: 'これらの属性を使用する処理チェーンが、古い結果を出力する可能性があります',
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
    true: '正',
    trySplittingFileIntoSmallerChunks: 'ファイルをより小さく分割してお試しください。',
    type: '種類',
    undefinedName: '未定義の名前',
    unique: '一意',
    upload: 'アップロード',
    uploadErrorConfirm: {
      message: `ファイルのアップロード中にエラーが発生しました：{{error}}\n
再試行しますか？`,
    },
    uploadFileChangedError: '選択したファイルは、選択後に変更されたようです。もう一度選択し直してください。',
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
      goToPage: 'ページへ移動',
      itemsPerPage: '1ページあたりの項目数',
      lastPage: '最後のページ',
      nextPage: '次のページ',
      page: 'ページ',
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
    theme: {
      label: 'テーマ',
      light: 'ライト',
      dark: 'ダーク',
      system: 'システム設定',
    },
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
    entity: '項目',
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
    surveyCompare: '比較 / ファイルから更新',
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
    user2FADevice: '2FA（二要素認証）デバイス',
    user2FADevice_plural: '2FA（二要素認証）デバイス',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_plural)',

    analysis: '分析',
    chain: '処理チェーン',
    chain_plural: '処理チェーン',
    virtualEntity: '仮想項目',
    entities: '仮想項目',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'インスタンス',

    message: 'メッセージ',
    message_plural: '$t(common.message_plural)',

    systemAdmin: 'システム管理',
    jobMonitor: 'ジョブモニター',
    systemLogs: 'システムログ',

    help: 'ヘルプ',
    about: 'このアプリについて',
    changelog: '変更履歴',
    whatsNew: '新機能',
    disclaimer: '免責事項',
    userManual: 'ユーザーマニュアル',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'このセクションは調査が公開されている場合のみ利用できます',
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
      lock: 'グループ識別属性の編集をロック',
      unlock: 'グループ識別属性の編集を許可',
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
    falseColor: '偽合成色（フォールスカラー）',
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
      label: '優先ユーザー画面言語',
      auto: '自動検出（{{detectedLanguage}}）',
    },
    newPassword: 'パスワード',
    confirmPassword: 'パスワード（確認）',
    manageTwoFactorDevices: {
      label: '2FA（二段階認証）を管理',
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
    mauFile: {
      upload: 'MAU.zipをアップロード',
      download: 'MAU.zipをダウンロード',
      delete: 'MAU.zipを削除',
      confirmCycleAssociation: 'MAU.zipファイルは現在のサイクル（{{cycle}}）に関連付けられます。続けますか？',
      confirmReplace: 'このチェーンには既にMAU.zipファイルがアップロードされています。置き換えますか？',
      confirmDelete: 'このチェーンにアップロードされたMAU.zipファイルを削除しますか？',
      uploadComplete: 'MAU.zipファイルが正常にアップロードされました',
      deleteComplete: 'MAU.zipファイルが削除されました',
      invalidFileExtension: '.zipファイルを選択してください',
    },
    phase1Category: '第1段階カテゴリ',
    phase1CategoryInfo: '第1段階のサンプルを含むカテゴリを選択してください。',
    phase2JoinEntity: {
      label: '結合項目（第2段階）',
      info: '基本単位と第1段階カテゴリを結合するために使用する項目です。基本単位項目自体、またはその上位の項目のいずれかを指定します。',
    },
    phase2AsSamplingPointData: {
      label: '抽出地点データのリンクを使って結合',
      info: '第2段階項目のキーは、第1段階でも使用される同じ抽出地点データ（Sampling Point Data）テーブルから読み込まれます。',
    },
    phase1JoinAttribute: {
      label: '結合属性（第1段階）',
      info: '$t(chainView.phase1Category)テーブルの列（追加プロパティまたは「コード」）を選択してください。第2段階の結合項目との結合に使用されます。',
    },
    phase2JoinAttribute: {
      label: '結合属性（第2段階）',
      info: '第2段階項目の属性の中から、第1段階テーブルと結合する属性を選択してください。その値は、前述の第1段階の結合属性と照合されます。',
    },
    formLabel: '処理チェーンのラベル',
    basic: '基本',
    records: '記録',
    recordsInStepCount: '{{step}}：{{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: '分析ステップのデータのみをRStudioに送信',
    submitOnlySelectedRecordsIntoR: '選択した記録のみをRStudioに送信',
    includeEntitiesWithoutData: 'データのない項目を含める',
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
      entityToReport: 'レポート対象の項目',
      entityWithoutData: '項目{{name}}にはデータがありません',
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
    stratumAttribute2ndPhaseInfo:
      '最終的な詳細サブサンプルを抽出する前に、第1段階サンプルをさらに層別する変数を選択してください。',
    postStratificationAttribute: '事後層別属性',
    areaWeightingMethod: '面積重み付け方法',
    clusteringEntity: 'クラスタリング項目',
    clusteringEntityInfo:
      '第一次抽出単位を定義する項目です。注：これはR surveyパッケージの枠組みにおけるクラスター分析にのみ使用されます。',
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
      entityCheck: '項目の互換性',
      entityMissing: '対象調査に存在しません',
      skipMissingEntities: '対象調査に存在しない項目の分析属性をスキップ',
      noAnalysisAttributes: 'この処理チェーンには分析属性がありません',
      cloneComplete: '処理チェーンを複製しました',
      missingEntities: '複製できません：以下の項目が対象調査に存在しません：{{entities}}',
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
      new: '仮想項目',
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
    entityExcludedInRStudioScripts: 'この項目および関連するすべての結果変数はRStudioスクリプトから除外されます',
    entityWithoutData: '項目{{name}}にはデータがありません。$t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      '項目{{name}}は選択中のサイクルでは利用できません。$t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: '無効または期限切れのトークンです',
    },
  },
  itemsTable: {
    unused: '未使用',
    noItemsAdded: '項目が追加されていません',
  },
  expression: {
    functionHasTooFewArguments:
      '関数{{fnName}}には少なくとも{{minArity}}個の引数が必要です（{{numArgs}}個指定されました）',
    functionHasTooManyArguments:
      '関数{{fnName}}が受け付ける引数は最大{{maxArity}}個です（{{numArgs}}個指定されました）',
    identifierNotFound: '属性または項目「{{name}}」が見つかりません',
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
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
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
    geoPackageCategory: 'このカテゴリには位置情報機能があります',
    geoPackageCategoryInfo: `このカテゴリには「${locationItemExtraDefName}」という追加プロパティがあり、GeoPackageファイルとしてエクスポートできます。`,
    samplingPointDataCategoryType: 'これは抽出地点データカテゴリです',
    samplingPointDataCategoryTypeInfo: `これは抽出地点データ用の定義済みカテゴリです。「${locationItemExtraDefName}」という追加プロパティがあり、GeoPackageファイルとしてエクスポートできます。`,
    samplingPointDataCategoryLocationMissing: `追加プロパティ「${locationItemExtraDefName}」がありません`,
    createCategory: {
      menuLabel: 'カテゴリを追加',
      simple: '単純カテゴリ',
      otherTypes: 'その他のカテゴリタイプ',
    },
    createSamplingPointDataCategory: {
      buttonLabel: '抽出地点データカテゴリ',
      description: '各項目に位置情報フィールドを含む、抽出地点データ用の定義済みカテゴリです。',
      message: `新しい抽出地点データカテゴリを作成しますか？

項目に「${locationItemExtraDefName}」の追加プロパティが追加されます。`,
    },
    createGeoPackageCategory: {
      buttonLabel: '位置情報機能付きカテゴリ',
      description:
        '項目に位置情報フィールドを追加し、カテゴリをGeoPackageファイルとしてエクスポートできるようにします。',
      message: `新しい位置情報機能付きカテゴリを作成しますか？

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
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Whisp分析を生成',
      confirmMessage: `すべての抽出地点についてWhisp分析を生成しますか？

- 位置情報を持つすべての抽出地点が分析のためにOpen Foris Whispに送信されます
- 結果は抽出地点データと結合され、カテゴリ'${samplingPointDataWhispCategoryName}'に保存されます
- カテゴリ'${samplingPointDataWhispCategoryName}'がすでに存在する場合、その内容は置き換えられます
- 分析はバックグラウンドで実行され、抽出地点の数によっては数分かかる場合があります`,
    },
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
      keyDuplicate: '項目キーが重複しています',
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
