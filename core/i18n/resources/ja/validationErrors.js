export default {
  // Common
  invalidEmail: '無効なメールアドレスです',
  invalidField: '「{{field}}」が無効です',
  invalidNumber: '無効な数値です',
  invalidDate: '無効な日付です',
  minLengthNotRespected: '最小文字数（{{minLength}}文字）を満たしていません',
  nameDuplicate: '名前が重複しています',
  nameCannotBeKeyword: `名前「{{value}}」は予約語のため使用できません`,
  nameInvalid:
    '名前「{{name}}」が無効です：40文字以内で、半角小文字・数字・「-」「_」記号のみを使用し、先頭は文字である必要があります',
  nameRequired: '名前は必須です',
  requiredField: '{{field}}は必須です',
  rowsDuplicate: '行：{{row}} 重複する行：{{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: '調査のデフォルト言語でのラベルは必須です',
    analysisNodeDefsRequired: '少なくとも1つの計算属性が必要です',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: '無効な子要素が少なくとも1つあります',
    codeCannotBeKeyword: `コード「{{value}}」は予約語のため使用できません`,
    codeDuplicate: 'コードが重複しています',
    codeRequired: 'コードは必須です',
    itemExtraPropDataTypeRequired: '$t(extraProp.label)「{{key}}」にはデータ型が必要です',
    itemExtraPropNameInvalid: '$t(extraProp.label)「{{key}}」の名前が無効です',
    itemExtraPropInvalidNumber: '$t(extraProp.label)「{{key}}」の数値が無効です',
    itemExtraPropInvalidGeometryPoint: '$t(extraProp.label)「{{key}}」のジオメトリポイントが無効です',
    itemsInvalid: '無効な項目が少なくとも1つあります',
    itemsEmpty: '少なくとも1つの項目を定義してください',
    levelDuplicate: 'レベル名が重複しています',
    levelsInvalid: '無効なレベルが少なくとも1つあります',
    nameNotSpecified: 'カテゴリ名が指定されていません',
  },

  category: {
    samplingPointDataCategoryAlreadyExists:
      'この調査には既に抽出地点データのカテゴリが存在します。作成できるのは1つのみです。',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      '公開済みカテゴリの項目は削除できません。インポートファイルに存在しない項目：{{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      '公開済みカテゴリのレベルは削除できません。インポートファイルに存在しないレベル：{{deletedLevelNames}}',
    codeColumnMissing: '少なくとも1つの「code」列が必要です',
    codeRequired: '{{columnName}}：コードは必須です',
    codeDuplicate: '{{columnName}}：コード「{{code}}」が重複しています',
    columnMissing: '列が見つかりません：{{columnNameMissing}}',
    emptyHeaderFound: 'ファイルに空のヘッダーが含まれています',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'ZIPファイルには、ディレクトリを含まず.csvまたは.xlsxファイル（カテゴリごとに1つ）のみを含める必要があります',
    invalidParentItemOrder: 'コード{{parentItemCodes}}の項目は、その子項目より前に配置する必要があります',
    nameDuplicate: '同じ名前のカテゴリが既に存在します：{{name}}',
    srsNotDefined: 'コード{{srs}}のSRSはこの調査で定義されていません',
    uuidDuplicate:
      'このカテゴリは既にこの調査に複製されています（現在の名前：「{{name}}」）。再度複製することはできません。',
  },

  dataImport: {
    emptyFile: 'インポートしようとしているファイルが空です',
    invalidHeaders: '無効な列：{{invalidHeaders}}',
    invalidBoolean: '列{{headers}}の真偽値が無効です：{{value}}',
    invalidCode: `属性「{{attributeName}}」のコードが無効です：{{code}}`,
    invalidCoordinate: '列{{headers}}の座標が無効です：{{value}}',
    invalidDate:
      '列{{headers}}の日付が無効です：{{value}}。日付はYYYY-MM-DDまたはDD/MM/YYYY形式で入力してください（例：2023-01-15または15/01/2023）',
    invalidNumber: '列{{headers}}の数値が無効です：{{value}}',
    invalidTaxonCode: '列{{headers}}のコードが無効です：{{value}}',
    invalidTime:
      '列{{headers}}の時刻が無効です：{{value}}。時刻はHH:mm形式で入力してください（例：09:45または16:30）',
    missingRequiredHeaders: '必須列が見つかりません：{{missingRequiredHeaders}}',
    errorUpdatingValues: '値の更新中にエラーが発生しました：{{details}}',
    multipleRecordsMatchingKeys: 'キー「{{keyValues}}」に一致する記録が複数見つかりました',
    recordAlreadyExisting: 'キー「{{keyValues}}」の記録は既に存在します',
    recordInAnalysisStepCannotBeUpdated: 'キー「{{keyValues}}」の記録は分析ステップにあるため更新できません',
    recordKeyMissingOrInvalid: 'キー属性「{{keyName}}」の値が未入力または無効です',
    recordNotFound: 'キー「{{keyValues}}」の記録が見つかりません',
  },

  expressions: {
    cannotGetChildOfAttribute: '属性{{parentName}}の子ノード{{childName}}を取得できません',
    cannotUseCurrentNode: 'この式では現在のノード{{name}}を使用できません',
    circularDependencyError: '現在のノードを参照しているため、ノード{{name}}を参照できません',
    expressionInvalid: '式が無効です：{{details}}',
    unableToFindNode: 'ノードが見つかりません：{{name}}',
    unableToFindNodeChild: '子ノードが見つかりません：{{name}}',
    unableToFindNodeParent: '親ノードが見つかりません：{{name}}',
    unableToFindNodeSibling: '兄弟ノードが見つかりません：{{name}}',
  },

  extraPropEdit: {
    nameInvalid: '無効な名前です',
    nameRequired: '名前は必須です',
    dataTypeRequired: 'データ型は必須です',
    valueRequired: '値は必須です',
  },

  message: {
    bodyRequired: '本文は必須です',
    subjectRequired: '件名は必須です',
    notificationTypeRequired: '通知タイプは必須です',
    targetsRequired: '少なくとも1つの対象が必要です',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: '項目は必須です',
    applyIfDuplicate: '「$t(nodeDefEdit.expressionsProp.applyIf)」条件が重複しています',
    applyIfInvalid: '「$t(nodeDefEdit.advancedProps.relevantIf)」条件が無効です',
    columnWidthCannotBeGreaterThan: '列幅は{{max}}より大きくできません',
    columnWidthCannotBeLessThan: '列幅は{{min}}より小さくできません',
    countMaxMustBePositiveNumber: '最大数は正の整数である必要があります',
    countMinMustBePositiveNumber: '最小数は正の整数である必要があります',
    categoryRequired: 'カテゴリは必須です',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: '「デフォルト値」が無効です',
    defaultValuesNotSpecified: 'デフォルト値が指定されていません',
    entitySourceRequired: '項目のソースは必須です',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      '「$t(nodeDefEdit.expressionsProp.applyIf)」条件を空にできるのは最後の式のみです',
    expressionDuplicate: '式が重複しています',
    expressionRequired: '式は必須です',
    formulaInvalid: '数式が無効です',
    keysEmpty: '少なくとも1つのキー属性を定義してください',

    keysExceedingMax: 'キー属性の最大数を超えています',
    maxFileSizeInvalid: '最大ファイルサイズは0より大きく、{{max}}未満である必要があります',
    nameInvalid:
      '名前が無効です（半角小文字・数字・アンダースコアのみを使用し、先頭は文字である必要があります）',
    taxonomyRequired: '分類体系は必須です',
    validationsInvalid: '「検証ルール」が無効です',
    countMaxInvalid: '「最大数」が無効です',
    countMinInvalid: '「最小数」が無効です',
    readOnlyCannotHaveEditableIf: '読み取り専用ノードには「編集可能条件」を設定できません',
    qualifierCannotHaveApplicableExpression:
      '修飾子属性には「$t(nodeDefEdit.advancedProps.relevantIf)」条件を設定できません',
    qualifierCannotHaveEditabilityRule: '修飾子属性には編集可能ルールを設定できません',
    qualifierCannotHaveDefaultValues: '修飾子属性にはデフォルト値を設定できません',
    qualifierCannotHaveValidations: '修飾子属性には検証ルールを設定できません',
  },

  record: {
    keyDuplicate: '記録キーが重複しています',
    entityKeyDuplicate: 'キーが重複しています',
    entityKeyValueNotSpecified: '「{{keyDefName}}」のキー値が指定されていません',
    missingAncestorForEntity: 'キー{{keyValues}}に一致する「{{ancestorName}}」が見つかりません',
    oneOrMoreInvalidValues: '1つ以上の値が無効です',
    uniqueAttributeDuplicate: '値が重複しています',
    valueInvalid: '無効な値です',
    valueRequired: '値は必須です',
  },

  recordClone: {
    differentKeyAttributes: 'サイクル{{cycleFrom}}とサイクル{{cycleTo}}でキー属性が異なります',
  },

  surveyInfoEdit: {
    langRequired: '言語は必須です',
    srsRequired: '空間参照系は必須です',
    cycleRequired: 'サイクルは必須です',
    cyclesRequired: '少なくとも1つのサイクルを定義してください',
    cyclesExceedingMax: '調査に設定できるサイクルは最大10個までです',
    cycleDateStartBeforeDateEnd: 'サイクルの開始日は終了日より前である必要があります',
    cycleDateStartAfterPrevDateEnd: 'サイクルの開始日は前のサイクルの終了日より後である必要があります',
    cycleDateStartInvalid: 'サイクルの開始日が無効です',
    cycleDateStartMandatory: 'サイクルの開始日は必須です',
    cycleDateEndInvalid: 'サイクルの終了日が無効です',
    cycleDateEndMandatoryExceptForLastCycle: '最後のサイクルを除き、終了日は必須です',
    fieldManualLinksInvalid: 'フィールドマニュアルへのリンクが無効です',
  },

  surveyPreloadedMapLayer: {
    fileRequired: 'ファイルは必須です',
    fileNameDuplicate: '同じ名前の別のファイルが既に存在します',
    labelsRequired: '少なくとも1つのラベルが必要です',
  },

  surveyDocImage: {
    documentPlaceRequired: 'ドキュメントの配置は必須です',
    fileRequired: 'ファイルは必須です',
    fileNameDuplicate: '同じ名前の別のファイルが既に存在します',
    labelsRequired: '少なくとも1つのラベルが必要です',
  },

  surveyLabelsImport: {
    invalidHeaders: '無効な列：{{invalidHeaders}}',
    cannotFindNodeDef: "名前が「{{name}}」の属性または項目定義が見つかりません",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `公開済みのコードが変更されました：「{{oldCode}}」→「{{newCode}}」`,
    codeDuplicate: 'コード{{value}}が重複しています。$t(validationErrors:rowsDuplicate)',
    codeRequired: 'コードは必須です',
    familyRequired: '科は必須です',
    genusRequired: '属は必須です',
    scientificNameDuplicate: '学名{{value}}が重複しています。$t(validationErrors:rowsDuplicate)',
    scientificNameRequired: '学名は必須です',
    taxaEmpty: '分類群が空です',
    vernacularNamesDuplicate: `言語「{{lang}}」の通称名「{{name}}」が重複しています`,
  },

  taxonomyImport: {
    nameDuplicate: '同じ名前の分類体系が既に存在します：{{name}}',
    uuidDuplicate:
      'この分類体系は既にこの調査に複製されています（現在の名前：「{{name}}」）。再度複製することはできません。',
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: '追加情報列が重複しています：{{duplicateColumns}}',
    invalidExtraPropColumn: '追加情報列名「{{columnName}}」が無効です：予約語は使用できません',
    missingRequiredColumns: '必須列が見つかりません：{{columns}}',
    reservedScientificName:
      '学名「{{scientificName}}」は予約語のため使用できません。この名前は自動的に分類体系に追加されます。',
  },

  user: {
    emailDuplicate: '同じメールアドレスのユーザーが既に存在します',
    emailRequired: 'メールアドレスは必須です',
    emailInvalid: 'メールアドレスが無効です',
    emailNotFound: 'メールアドレスが見つかりません',
    groupRequired: 'グループは必須です',
    nameRequired: '名前は必須です',
    titleRequired: '敬称は必須です',
    passwordRequired: 'パスワードは必須です',
    passwordInvalid: 'パスワードに空白文字を含めることはできません',
    passwordUnsafe:
      'パスワードは8文字以上で、半角小文字・大文字・数字を含む必要があります',
    passwordsDoNotMatch: `パスワードが一致しません`,

    userNotFound: 'ユーザーが見つかりません。メールアドレスとパスワードが正しいか確認してください',
    passwordChangeRequired: 'パスワードの変更が必要です',
    passwordResetNotAllowedWithPendingInvitation: `パスワードの再設定はできません：このユーザーは調査に招待されていますが、まだ招待が承認されていません`,
    twoFactorTokenRequired: '確認コードは必須です',
  },

  userAccessRequest: {
    countryRequired: '国は必須です',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: '名は必須です',
    institutionRequired: '所属機関は必須です',
    lastNameRequired: '姓は必須です',
    purposeRequired: '目的は必須です',
    surveyNameRequired: '調査名は必須です',
    invalidRequest: '無効なユーザーアクセス申請です',
    userAlreadyExisting: 'メールアドレス{{email}}のユーザーは既に存在します',
    requestAlreadySent: `メールアドレス{{email}}のユーザーのアクセス申請は既に送信済みです`,
    emailNotReachable:
      '確認メールを{{email}}に送信できませんでした。アドレスが正しいか確認してください',
    invalidReCaptcha: 'reCAPTCHAが無効です',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'ユーザーアクセス申請は既に処理済みです',
    accessRequestNotFound: 'ユーザーアクセス申請が見つかりません',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: '役割は必須です',
    surveyNameRequired: '調査名は必須です',
  },

  userGroupEdit: {
    nameDuplicate: '同じ名前のグループが既に存在します：{{name}}',
    qualifiersInvalid: '1つ以上の修飾子のキーが無効または重複しています',
    qualifierNameDuplicate: 'このグループには同じ名前の修飾子が既に存在します：{{name}}',
    qualifierNameInvalid: '修飾子名が無効です',
    qualifierNameRequired: '修飾子名は必須です',
  },

  userPasswordChange: {
    oldPasswordRequired: '現在のパスワードは必須です',
    oldPasswordWrong: '現在のパスワードが間違っています',
    newPasswordRequired: '新しいパスワードは必須です',
    confirmPasswordRequired: 'パスワードの確認は必須です',
    confirmedPasswordNotMatching: '新しいパスワードと確認用パスワードが一致しません',
  },

  userInvite: {
    messageContainsLinks: '招待メッセージにリンクを含めることはできません',
    messageTooLong: '招待メッセージが長すぎます（最大{{maxLength}}文字）',
  },

  user2FADevice: {
    nameDuplicate: '同じ名前のデバイスが既に存在します',
    nameRequired: 'デバイス名は必須です',
  },
}
