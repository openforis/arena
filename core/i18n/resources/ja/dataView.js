export default {
  charts: {
    downloadToPng: 'グラフをPNGでダウンロード',
    warning: {
      selectOneDimensionAndOneMeasure: 'グラフを表示するには、1つのディメンションと1つのメジャーを選択してください',
      selectAtLeast2NumericAttributes: 'グラフを表示するには、数値属性を2つ選択してください',
      tooManyItemsToShowChart: `グラフを表示するには項目数が多すぎます。
最大{{maxItems}}項目までです。
フィルターの追加など、クエリを絞り込んで項目数を減らしてください。
`,
    },
    type: {
      area: '面グラフ',
      bar: '棒グラフ',
      line: '折れ線グラフ',
      pie: '円グラフ',
      scatter: '散布図',
    },
  },
  dataQuery: {
    deleteConfirmMessage: 'クエリ「{{name}}」を削除しますか？',
    displayType: {
      chart: 'グラフ',
      table: 'テーブル',
    },
    manageQueries: 'クエリを管理',
    mode: {
      label: 'モード：',
      aggregate: '集計',
      raw: '生データ',
      rawEdit: '生データ編集',
    },
    replaceQueryConfirmMessage: '現在のクエリを選択したクエリで置き換えますか？',
    showCodes: 'コードを表示',
  },
  editSelectedRecord: '選択した記録を編集',
  filterAttributeTypes: '属性の種類で絞り込み',
  filterAttributes: '属性を絞り込み',
  filterMessages: 'メッセージを絞り込み',
  messageTypeFilter: {
    valueRequired: '値が必須',
    valueInvalid: '値が無効',
    uniqueDuplicate: '値の重複',
    customValidation: 'カスタム検証',
    entityKeyDuplicate: '項目キーの重複',
    recordKeyDuplicate: '記録キーの重複',
    nodesCount: 'ノード数',
  },
  filterRecords: {
    buttonTitle: '記録を絞り込み',
    expressionEditorHeader: '記録を絞り込む式',
  },
  invalidRecord: '無効な記録',
  nodeDefsSelector: {
    hide: 'ノード定義セレクターを隠す',
    show: 'ノード定義セレクターを表示',
    nodeDefFrequency: `{{nodeDefLabel}}（頻度）`,
    searchPlaceholder: '変数名で検索',
  },
  records: {
    clone: '複製',
    confirmDeleteRecord: `記録「{{keyValues}}」を削除しますか？`,
    confirmDeleteSelectedRecord_one: `選択した記録を削除しますか？`,
    confirmDeleteSelectedRecord_other: `選択した{{count}}件の記録を削除しますか？`,
    confirmMergeSelectedRecords: `### 選択した記録を1つに統合しますか？

- 記録「source（統合元）」が記録「target（統合先）」に統合されます：
  - 統合元：[{{sourceRecordKeys}}]、更新日時{{sourceRecordModifiedDate}}
  - 統合先：[{{targetRecordKeys}}]、更新日時{{targetRecordModifiedDate}}

- 統合を実行する前に、結果のプレビューが表示されます

- 統合を確定すると、**統合元の記録は削除されます**`,
    confirmUpdateRecordsStep: `選択した{{count}}件の記録を{{stepFrom}}から{{stepTo}}に移動しますか？`,
    confirmUpdateRecordOwner: `選択した記録の所有者を{{ownerName}}に変更しますか？`,
    confirmValidateAllRecords: `すべての記録を再検証しますか？\n\n数分かかる場合があります。`,
    deleteRecord: '記録を削除',
    demoteAllRecordsFromAnalysis: '分析 → クレンジング',
    demoteAllRecordsFromCleansing: 'クレンジング → 入力',
    editRecord: '記録を編集',
    exportList: '一覧をエクスポート',
    exportData: 'データをエクスポート',
    exportDataSummary: 'データ概要をエクスポート',
    exportRecordDocx: '記録をエクスポート（Word）',
    filterPlaceholder: 'キーまたは所有者で絞り込み',
    merge: {
      label: '統合',
      confirmLabel: '統合を確定',
      confirmTooManyDifferencesMessage: `**差分が多すぎます**。
これらの記録は互いに大きく異なっているようです。
統合により多くの属性（約{{nodesUpdated}}個）が更新されます。
統合プレビューに進みますか？`,
      noChangesWillBeApplied: `統合先の記録には変更が適用されません。
統合を実行できません。`,
      performedSuccessfullyMessage: '記録の統合が完了しました！',
      previewTitle: '統合プレビュー（記録{{keyValues}}）',
    },
    noRecordsAdded: '記録が追加されていません',
    noRecordsAddedForThisSearch: '記録が見つかりません',
    noSelectedRecordsInStep: 'ステップ{{step}}に選択中の記録がありません',
    owner: '所有者',
    promoteAllRecordsToAnalysis: 'クレンジング → 分析',
    promoteAllRecordsToCleansing: '入力 → クレンジング',
    step: 'ステップ',
    updateRecordsStep: '記録のステップを更新',
    validateAll: 'すべて検証',
    viewRecord: '記録を表示',
  },
  recordsClone: {
    title: '記録の複製',
    fromCycle: '複製元サイクル',
    toCycle: '複製先サイクル',
    confirmClone: `サイクル{{cycleFrom}}からサイクル{{cycleTo}}に記録を複製しますか？\n
（サイクル{{cycleTo}}にまだ存在しない記録のみが複製されます）`,
    startCloning: '複製を開始',
    cloneComplete: '複製が完了しました。{{cycleFrom}}から{{cycleTo}}へ{{recordsCloned}}件の記録を複製しました',
    error: {
      cycleToMissing: '「複製先サイクル」を選択してください',
      cycleToMustBeDifferentFromCycleFrom: '「複製先サイクル」は「複製元サイクル」と異なる必要があります',
    },
    source: {
      label: 'ソース',
      allRecords: 'サイクル{{cycleFrom}}のうち、サイクル{{cycleTo}}にまだ存在しないすべての記録',
      selectedRecords: '選択した{{selectedRecordsCount}}件の記録のみ',
    },
  },
  recordDeleted_one: `記録を削除しました！`,
  recordDeleted_other: `{{count}}件の記録を削除しました！`,
  recordsSource: {
    label: 'ソース',
  },
  recordsUpdated: '{{count}}件の記録を更新しました！',
  rowNum: '行番号',
  selectedAttributes: '選択中の属性：',
  selectedDimensions: '選択中のディメンション',
  selectedMeasures: '選択中のメジャー',
  sortableItemsInfo: 'ドラッグ＆ドロップで並べ替え',
  showValidationReport: '検証レポートを表示',
  sort: '並べ替え',
  dataExport: {
    source: {
      label: 'ソース',
      allRecords: 'すべての記録',
      filteredRecords: '絞り込んだ記録のみ',
      selectedRecord: '選択した記録のみ',
      selectedRecord_other: '選択した{{count}}件の記録のみ',
    },
    title: 'データをエクスポート',
  },
  dataVis: {
    errorLoadingData: 'データの読み込み中にエラーが発生しました',
    noData: 'このクエリではデータが見つかりませんでした',
    noSelection: '左側のパネルから選択するか、「クエリを管理」から既存のクエリを選択してください',
  },
  viewSelectedRecord: '選択した記録を表示',
  mapView: {
    layersControl: {
      baseLayers: 'ベースレイヤー',
      inputData: '入力データ',
      preloadedLayers: 'プリロード済みレイヤー',
      samplingPointData: '抽出地点データ',
    },
    layersPanel: {
      hidePanel: 'パネルを隠す',
      showPanel: 'パネルを表示',
      markers: '{{count}}件のマーカー',
      markers_one: '{{count}}件のマーカー',
      markers_other: '{{count}}件のマーカー',
    },
  },
}
