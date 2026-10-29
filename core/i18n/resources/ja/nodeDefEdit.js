export default {
  additionalFields: '追加フィールド',
  basic: '基本',
  advanced: '詳細設定',
  mobileApp: 'モバイルアプリ',
  print: '印刷',
  printProps: {
    printOrientation: {
      label: 'ページの向き',
      info: 'この項目が独自の印刷セクションを開始する際に使用される向きです。デフォルトはエクスポート時に選択されたドキュメントの向きを継承します。',
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
    categoryItemProp: '指定したコードを持つカテゴリ項目の、指定した$t(extraProp.label)の値を返します',
    dateTimeDiff: '2つの日時の組の差（分単位）を返します',
    distance: '指定した座標間の距離（メートル単位）を返します',
    first: '指定した複数属性または項目の最初の値またはノードを返します',
    geoCoordinateAtDistance: '指定した座標から指定した距離・方位にある座標を返します',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoAOIContaining:
      '指定された座標を含む調査の最初の関心領域（調査情報 → 地図 で定義された順序）の名前を返します。どの領域にも含まれない場合は何も返しません',
    geoDistanceToAOIBoundary:
      '座標と調査の指定された関心領域の境界との距離（メートル単位）を返します：領域内では負、領域外では正の値',
    geoPolygon: '座標のリストからGeoJSON形式のポリゴンを生成します',
    includes: '指定した複数属性に指定した値が含まれている場合にtrueを返します。',
    index: '指定したノードの、兄弟ノード内でのインデックスを返します',
    isEmpty: '引数に値が指定されていない場合にtrueを返します',
    isNotEmpty: '引数に何らかの値が指定されている場合にtrueを返します',
    last: '指定した複数属性または項目の最後の値またはノードを返します',
    ln: 'Xの自然対数を返します',
    log10: 'Xの常用対数（底10）を返します',
    max: '引数のうち最大の値を返します',
    min: '引数のうち最小の値を返します',
    now: '現在の日付または時刻を返します',
    parent: '指定したノードの親項目を返します',
    pow: '底をべき乗した値を返します',
    prevCycleNote: '複数サイクルが定義されており、前サイクルへのリンクが有効な場合のみ、Arena Mobileで動作します',
    prevCycleValue:
      '前サイクルの記録における同じ属性の値を返します。$t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      '前サイクルの記録における同じ属性群の値を返します。$t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: '現在の記録のサイクルを返します',
    recordDateCreated: '現在の記録の作成日時を日時値として返します。テキスト、日付、または時刻属性で使用できます',
    recordDateLastModified:
      '現在の記録の最終更新日時を日時値として返します。テキスト、日付、または時刻属性で使用できます',
    recordOwnerEmail: '記録を所有するユーザーのメールアドレスを返します',
    recordOwnerName: '記録を所有するユーザーの名前を返します',
    recordOwnerRole: '記録を所有するユーザーの（現在の調査における）役割を返します',
    rowIndex: '現在のテーブル行（またはフォーム）のインデックスを返します',
    taxonProp: '指定したコードを持つ分類群の、指定した$t(extraProp.label)の値を返します',
    taxonVernacularName: '指定したコードを持つ分類群の、指定した言語での（最初の）通称名（現地名）を返します',
    unique: '複数属性または項目の一意な値を返します',
    userEmail: 'ログイン中のユーザーのメールアドレスを返します',
    userIsRecordOwner:
      '記録を編集しているユーザーがその記録の所有者でもある場合は真偽値「true」、そうでなければ「false」を返します',
    userName: 'ログイン中のユーザーの名前を返します',
    userProp: 'ログイン中のユーザーの、指定した$t(extraProp.label)の値を返します',
    uuid: '識別子として使用できるUUID（汎用一意識別子）を生成します（例：項目のキー属性として）',
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
      info: '項目が適用対象になった時、または親項目が作成された時に、最小数に等しい数の項目が自動的に生成されます。',
    },
    displayAs: '表示形式',
    displayIn: '表示先',
    entitySource: '項目のソース',
    enumerate: {
      label: '列挙',
      info: `項目内でキーとして指定されたコード属性に関連付けられたカテゴリ項目を使用して、行が自動的に生成されます。行の追加・削除はできず、キーとなるコード属性も編集できません`,
    },
    enumeratingItemsExpression: {
      label: '列挙項目の式',
      info: '列挙するカテゴリ項目を絞り込む任意の式です（例：unique(table_source.source_type)）。空の場合、すべてのカテゴリ項目が使用されます。',
    },
    enumerator: {
      label: '列挙元',
      info: 'このカテゴリの項目を使って、親項目の行が生成されます',
    },
    form: 'フォーム',
    formula: '数式',
    includedInClonedData: '複製データに含める',
    includedInMultipleEntitySummary: {
      label: '複数項目の概要に含める',
      info: `有効にすると、この属性の値が、エンティティ選択リストおよびエンティティ概要ビューに表示されます`,
    },
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
      label: 'グループ識別属性',
      info: `グループに所属するユーザーが新規記録を作成すると、この属性にはそのユーザーが属するグループに設定された値が自動的に入力されます。グループに所属するユーザーは、自分のグループに属する記録のみを閲覧・編集できます。`,
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
  timeProps: {
    includeSeconds: '秒を含める',
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
    notRequired: '必須ではない',
    alwaysRequired: '常に必須',
    requiredWhenConditionIsMet: '条件を満たす場合に必須',
  },
  cannotChangeIntoMultipleWithDefaultValues: 'デフォルト値が設定されているため、このノードを複数に変換できません。',
  cannotDeleteNodeDefReferenced: `「{{nodeDef}}」は以下のノード定義から参照されているため削除できません：{{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: '複製',
    title: 'ノード定義「{{nodeDefName}}」を複製',
    entitySelectLabel: '複製先の項目：',
  },
  conversion: {
    dialogTitle: '{{nodeDefName}}を別の型に変換',
    fromType: '変換元の型',
    toType: '変換先の型',
  },
  moveDialog: {
    confirmButtonLabel: '移動',
    title: 'ノード定義「{{nodeDefName}}」を「{{parentNodeDefName}}」から移動',
    entitySelectLabel: '移動先の項目：',
  },
  movedNodeDefinitionHasErrors: '移動したノード定義「{{nodeDefName}}」にはエラーがあります。修正してください。',
  nodeDefintionsHaveErrors: '以下のノード定義にはエラーがあります：{{nodeDefNames}}。修正してください。',
  filterVariable: '項目を絞り込む変数',
  filterVariableForLevel: '{{levelName}}用の変数',
  unique: {
    label: '一意',
    info: `属性を**一意**としてマークすると、その値は最も近い複数項目内で一意である必要があります（そうでない場合はエラーが表示されます）。

---

例：*クラスター → プロット → 樹木*のような構造で、属性*tree_species*を**一意**としてマークすると、同じ*プロット*内では樹種ごとに1本の木しか登録できません。`,
  },
  nodeDefClonedSuccessfully: 'ノード定義「{{nodeDefName}}」を「{{targetParentNodeDefName}}」に複製しました',
  categoriesClonedFromSurvey: '以下のカテゴリも複製元の調査から複製されました：{{names}}',
  taxonomiesClonedFromSurvey: '以下の分類体系も複製元の調査から複製されました：{{names}}',
}
