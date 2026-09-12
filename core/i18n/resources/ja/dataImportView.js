export default {
  confirmDeleteAllRecords: 'インポート前にすべての記録を削除しますか？',
  confirmDeleteAllRecordsInCycle: 'インポート前にサイクル{{cycle}}のすべての記録を削除しますか？',
  conflictResolutionStrategy: {
    label: '競合解決の方法',
    info: '同一の記録（またはキー属性が同じ記録）が見つかった場合の処理方法',
    skipExisting: '既存の場合はスキップ',
    overwriteIfUpdated: '更新されていれば上書き',
    merge: '記録を統合',
  },
  deleteAllRecordsBeforeImport: 'インポート前にすべての記録を削除',
  downloadAllTemplates: 'すべてのテンプレートをダウンロード',
  downloadAllTemplates_csv: 'すべてのテンプレートをダウンロード（CSV）',
  downloadAllTemplates_xlsx: 'すべてのテンプレートをダウンロード（Excel）',
  downloadTemplate: 'テンプレートをダウンロード',
  downloadTemplate_csv: 'テンプレートをダウンロード（CSV）',
  downloadTemplate_xlsx: 'テンプレートをダウンロード（Excel）',
  errors: {
    rowNum: '行番号',
  },
  fileUploadChunkSize: {
    label: 'ファイルアップロードのチャンクサイズ',
  },
  forceImportFromAnotherSurvey: '別の調査からのインポートを強制する',

  importFromArena: 'Arena / Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### インポートの手順
1. 対象の項目を選択
2. テンプレートをダウンロード
3. テンプレートに入力して保存（CSVの場合はUTF-8エンコーディングを使用）
4. オプションを確認
5. CSV/Excelファイルをアップロード
6. ファイルを検証
7. インポートを開始
`,
  importIntoCycle: 'インポート先のサイクル',
  importIntoMultipleEntityOrAttribute: '複数項目または属性へのインポート',
  importPreview: {
    title: 'インポートプレビュー',
    generatePreview: 'プレビューを生成',
    skipInfo:
      '「スキップ」と表示された記録は選択できません：より新しく更新された既存の記録があるため、インポートされません。',
    confirmImport: '選択した記録（{{count}}件）をインポート',
    columns: {
      exists: '既存',
      action: '操作',
      dateModified: 'インポート記録の更新日時',
      existingDateModified: '既存記録の更新日時',
    },
    action: {
      insert: '挿入',
      overwrite: '上書き',
      merge: '統合',
      skip: 'スキップ',
    },
  },
  importType: {
    label: 'インポート種別',
    insertNewRecords: '新規記録を挿入',
    updateExistingRecords: '既存記録を更新',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Arena Mobileデータのインポートが完了しました：
{{summary}}`,
      importSummaryItem: {
        processed: '件の記録を処理',
        insertedRecords: '件の記録を作成',
        updatedRecords: '件の記録を更新',
        skippedRecords: '件の記録をスキップ',
        missingFiles: '件のファイルが見つかりません',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Collectデータのインポートが完了しました：
        - {{insertedRecords}}件の記録を作成`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}}行を処理
        - {{insertedRecords}}件の記録を作成
        - {{updatedRecords}}件の記録を更新
        - {{entitiesCreated}}件の項目を作成
        - {{entitiesDeleted}}件の項目を削除
        - {{updatedValues}}件の値を更新`,
      importCompleteSuccessfully: `## インポート完了：
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}}件のファイルを追加
        - {{updatedFiles}}件のファイルを更新
        - {{deletedFiles}}件のファイルを削除`,
      importCompleteWithErrors: `## インポート完了（エラーあり）：
        - {{processed}}行を処理`,
      tooLong: 'インポートに時間がかかっています。$t(common.trySplittingFileIntoSmallerChunks)',
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## 検証完了（{{errorsFoundMessage}}）
        - {{processed}}行を処理`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## 検証完了（エラーなし）
        - {{processed}}行を処理
        - {{insertedRecords}}件の記録が作成されます
        - {{updatedRecords}}件の記録が更新されます
        - {{entitiesCreated}}件の項目が作成されます
        - {{entitiesDeleted}}件の項目が削除されます
        - {{updatedValues}}件の値が更新されます`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}}件のファイルが追加されます
        - {{updatedFiles}}件のファイルが更新されます
        - {{deletedFiles}}件のファイルが削除されます`,
      tooLong: '検証に時間がかかっています。$t(common.trySplittingFileIntoSmallerChunks)',
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'エラー発生時に中止',
    preventAddingNewEntityData: '新規項目データの追加を禁止',
    preventUpdatingRecordsInAnalysis: '分析ステップの記録更新を禁止',
    includeFiles: 'ファイルを含める',
    skipMissingFiles: '見つからないファイルを無視',
    deleteExistingEntities: `選択した項目のデータをすべての記録から削除`,
  },
  optionsInfo: {
    deleteExistingEntities: `警告：新しい項目を挿入する前に、「{{nodeDefName}}」に該当する
すべての記録内の項目とその子孫がすべて削除されます。`,
  },
  startImport: 'インポートを開始',
  startImportConfirm: `「OK」を押すとインポート処理が開始されます。
**変更をロールバックすることはできません。**
続行してもよろしいですか？`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)
**（「$t(dataImportView:options.deleteExistingEntities)」オプションが選択されています：新規作成前に既存の項目が削除されます）**
`,
  steps: {
    selectImportType: 'インポート種別を選択',
    selectCycle: 'サイクルを選択',
    selectEntity: '項目を選択',
    selectFile: 'ファイルを選択',
    startImport: 'インポートを開始',
  },
  templateForImport: 'インポート用テンプレート',
  templateFor_specificDataImport_csv: 'インポート用テンプレート（CSV）',
  templateFor_specificDataImport_xlsx: 'インポート用テンプレート（Excel）',
  templateFor_genericDataImport_csv: 'インポート用テンプレート（汎用、CSV）',
  templateFor_genericDataImport_xlsx: 'インポート用テンプレート（汎用、Excel）',
  validateFile: 'ファイルを検証',
  validateFileInfo: '検証処理では、各属性のデータ型に従って、ファイルに有効なデータが含まれているかを確認します。',
}
