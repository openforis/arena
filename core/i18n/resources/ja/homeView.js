export default {
  dashboard: {
    activeSurveyNotSelected: `<title>アクティブな調査が選択されていません</title>
      <p><label>以下から選択してください：</label><linkToSurveys>調査一覧</linkToSurveys>、または<linkToNewSurvey>新しい調査を作成</linkToNewSurvey></p>`,
    activeUsers: 'アクティブユーザー',
    activityLog: {
      title: 'アクティビティログ',
      size: '$t(homeView:dashboard.activityLog.title)のサイズ：{{size}}',
    },
    exportWithData: 'エクスポート＋データ（バックアップ）',
    exportWithDataNoActivityLog: 'エクスポート＋データ（アクティビティログを除く）',
    exportWithDataNoResultAttributes: 'エクスポート＋データ（分析結果属性を除く）',
    surveyPropUpdate: {
      main: `<title>Arenaへようこそ</title>

        <p>まず、調査の<strong>名前</strong>と<strong>ラベル</strong>を設定してください。</p>

        <p>下の<linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>、または調査名<basicLink>{{surveyName}}</basicLink>をクリックしてください</p>
        `,
      secondary: `
        <p>名前とラベルに問題がなければ、
        <linkWithIcon>調査 ＞ フォームデザイナー</linkWithIcon>で最初の属性を作成してください
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>{{surveyName}}の最初の属性を作成しましょう</title>

        <p><linkWithIcon>調査 ＞ フォームデザイナー</linkWithIcon>に移動してください</p>
        <br />
        `,
    },
    storageSummary: {
      title: 'ストレージ使用状況',
      availableSpace: '利用可能（{{size}}）',
      usedSpace: '使用中（{{size}}）',
      usedSpaceOutOf: `{{percent}}%使用中（{{total}}中{{used}}）`,
    },
    storageSummaryDb: {
      title: 'ストレージ使用状況（データベース）',
    },
    storageSummaryFiles: {
      title: 'ストレージ使用状況（ファイル）',
    },
    samplingPointDataCompletion: {
      title: '抽出地点データの完了状況',
      totalItems: '合計項目数：{{totalItems}}',
      remainingItems: '残り項目数',
    },
    step: {
      entry: 'データ入力',
      cleansing: 'データクレンジング',
      analysis: 'データ分析',
    },
    // records' summary
    recordsByUser: 'ユーザー別記録数',
    recordsAddedPerUserWithCount: 'ユーザーごとの追加記録数（合計{{totalCount}}件）',
    dailyRecordsByUser: 'ユーザー別の日次記録数',
    totalRecords: '記録合計数',
    selectUsers: 'ユーザーを選択...',
    noRecordsAddedInSelectedPeriod: '選択した期間に追加された記録はありません',
  },
  surveyDeleted: '調査{{surveyName}}を削除しました',
  landing: {
    openDashboard: 'ダッシュボードを開く',
  },
  surveyInfo: {
    basic: '基本情報',
    branding: {
      title: 'ブランディング',
      primaryColor: '主要な色',
      titleFontSize: 'タイトルのフォントサイズ',
      descriptionFontSize: '説明のフォントサイズ',
      fontSizePreset: {
        small: '小',
        default: 'デフォルト',
        large: '大',
      },
      surveyLogo1: '調査ロゴ1',
      surveyLogo2: '調査ロゴ2',
      surveyLogo3: '調査ロゴ3',
      landingBackground: 'ランディング背景画像',
      uploadLogo: '画像をアップロード',
      logoFileFormatHint: 'PNG、JPEG、WebP、またはSVG（最大{{maxMb}} MB）',
      logoFileTooLarge: 'ロゴ画像は{{maxMb}} MB以下にしてください',
      preview: 'プレビュー',
      backgroundFileTooLarge: '背景画像は{{maxMb}} MB以下にしてください',
      invalidPrimaryColor: '有効な#RRGGBB形式の色を入力するか、空欄のままにしてください',
      invalidSaveBlocked: '調査情報を保存する前に、無効なブランディング項目を修正してください',
    },
    configuration: {
      title: '設定',
      filesTotalSpace: 'ファイルの合計容量（GB）',
    },
    confirmDeleteCycleHeader: 'このサイクルを削除しますか？',
    confirmDeleteCycle: `サイクル{{cycle}}を削除してもよろしいですか？\n\n$t(common.cantUndoWarning)\n\n
このサイクルに紐づく記録がある場合、それらも削除されます。`,
    cycleForArenaMobile: 'Arena Mobile用サイクル',
    deleteActivityLog: 'アクティビティログを消去',
    deleteActivityLogConfirm: {
      headerText: 'この調査のアクティビティログをすべて消去しますか？',
      message: `
  - 調査**{{surveyName}}**のアクティビティログデータがすべて削除されます\n\n
  - データベース内でこの調査が占める容量が削減されます\n\n
  - 調査の入力データには影響しません\n\n

  $t(common.cantUndoWarning)`,
      confirmName: '確認のため、この調査の名前を入力してください：',
    },
    fieldManualLink: 'フィールドマニュアルへのリンク',
    editInfo: '情報を編集',
    map: '地図',
    viewInfo: '情報を表示',

    preloadedMapLayers: {
      enabledMessage: '事前ロード済み地図レイヤーが有効です',
      title: '事前ロード済み地図レイヤー',
      confirmDelete: 'この事前ロード済み地図レイヤーを削除しますか？',
      editor: {
        title: '事前ロード済み地図レイヤー',
      },
    },

    surveyDocLayout: {
      tabTitle: 'ドキュメントレイアウト',
      title: 'ドキュメント画像',
      layoutOptions: {
        title: 'レイアウトオプション',
        headerOnFirstPageOnly: 'ヘッダーは1ページ目のみ',
        pageNumbering: 'ページ番号',
      },
      documentPlace: '配置',
      documentPlaceValues: {
        header: 'ヘッダー',
        footer: 'フッター',
      },
      applyIf: '適用条件',
      confirmDelete: 'このドキュメント画像を削除しますか？',
      editor: {
        title: 'ドキュメント画像',
      },
    },

    preferredLanguage: '優先言語',
    sampleBasedImageInterpretation: 'サンプルベースの画像判読',
    sampleBasedImageInterpretationEnabled: 'サンプルベースの画像判読が有効です',
    security: {
      title: 'セキュリティ',
      dataEditorViewNotOwnedRecordsAllowed: 'データ編集者が他者所有の記録を閲覧可能にする',
      dataAnalystViewNotOwnedRecordsAllowed: 'データ分析者が他者所有の記録を閲覧可能にする',
      visibleInMobile: 'Arena Mobileに表示する',
      allowRecordsDownloadInMobile: 'サーバーからArena Mobileへの記録ダウンロードを許可',
      allowRecordsUploadFromMobile: 'Arena Mobileからサーバーへの記録アップロードを許可',
      allowRecordsWithErrorsUploadFromMobile:
        '検証エラーのある記録のArena Mobileからサーバーへのアップロードを許可',
    },
    srsPlaceholder: 'コードまたはラベルを入力',
    unpublish: '公開を取り消してデータを削除',
    unpublishSurveyDialog: {
      confirmUnpublish: 'この調査の公開を取り消しますか？',
      unpublishWarning: `調査**{{surveyName}}**の公開を取り消すと、そのすべてのデータが削除されます。\n\n

  $t(common.cantUndoWarning)`,
      confirmName: '確認のため、この調査の名前を入力してください：',
    },
    userExtraProps: {
      title: 'ユーザー追加プロパティ',
      info: `調査に関連付けられた各ユーザーに設定できる追加プロパティです。
これらのプロパティは、デフォルト値・検証ルール・適用条件式の中で使用できます。
例：*userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'この調査を削除しますか？',
    deleteWarning: `調査**{{surveyName}}**を削除すると、そのすべてのデータが削除されます。\n\n

$t(common.cantUndoWarning)`,
    confirmName: '確認のため、この調査の名前を入力してください：',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: '有効化',
  },
  collectImportReport: {
    excludeResolvedItems: '解決済み項目を除外',
    expression: '式',
    resolved: '解決済み',
    exprType: {
      applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
      codeParent: '親コード',
      defaultValue: 'デフォルト値',
      validationRule: '検証ルール',
    },
    title: 'Collectインポートレポート',
  },
  recordsSummary: {
    recordsAddedInTheLast: '直近の追加記録数：',
    fromToPeriod: '{{from}}から{{to}}まで',
    record: '{{count}}件の記録',
    record_other: '{{count}}件の記録',
    week: '{{count}}週間',
    week_other: '{{count}}週間',
    month: '{{count}}か月',
    month_other: '{{count}}か月',
    year: '{{count}}年',
    year_other: '{{count}}年',
  },
}
