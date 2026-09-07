import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: '調査を作成しました',
    [ActivityLog.type.surveyPropUpdate]: '調査の{{key}}を更新しました',
    [ActivityLog.type.surveyPublish]: '調査を公開しました',
    [ActivityLog.type.surveyCollectImport]: 'Collectから調査をインポートしました',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'エンティティ{{parentName}}にノード定義{{type}}を追加しました',
    [ActivityLog.type.nodeDefUpdate]: 'ノード定義{{name}}の{{keys}}を更新しました',
    [ActivityLog.type.nodeDefMarkDeleted]: 'ノード定義{{name}}を削除しました',

    // Category
    [ActivityLog.type.categoryInsert]: 'カテゴリを追加しました',
    [ActivityLog.type.categoryPropUpdate]: 'カテゴリ{{categoryName}}の{{key}}を更新しました',
    [ActivityLog.type.categoryDelete]: 'カテゴリ{{categoryName}}を削除しました',
    [ActivityLog.type.categoryLevelInsert]: 'カテゴリ{{categoryName}}のインデックス{{index}}にレベルを追加しました',
    [ActivityLog.type.categoryLevelPropUpdate]: 'カテゴリ{{categoryName}}のレベル{{index}}の{{key}}を更新しました',
    [ActivityLog.type.categoryLevelDelete]: 'カテゴリ{{categoryName}}のレベル{{index}}を削除しました',
    [ActivityLog.type.categoryItemInsert]: 'カテゴリ{{categoryName}}のレベル{{levelIndex}}に項目を追加しました',
    [ActivityLog.type.categoryItemPropUpdate]: 'カテゴリ{{categoryName}}の項目{{code}}の{{key}}を更新しました',
    [ActivityLog.type.categoryItemDelete]: 'カテゴリ{{categoryName}}のレベル{{levelIndex}}の項目{{code}}を削除しました',
    [ActivityLog.type.categoryImport]: 'カテゴリ{{categoryName}}にCSVファイルをインポートしました',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: '分類体系を追加しました',
    [ActivityLog.type.taxonomyPropUpdate]: '分類体系{{taxonomyName}}の{{key}}を更新しました',
    [ActivityLog.type.taxonomyDelete]: '分類体系{{taxonomyName}}を削除しました',
    [ActivityLog.type.taxonomyTaxaImport]: '分類体系{{taxonomyName}}にCSVファイルをインポートしました',
    [ActivityLog.type.taxonInsert]: '分類体系{{taxonomyName}}に分類群を追加しました',

    // Record
    [ActivityLog.type.recordCreate]: '記録を追加しました',
    [ActivityLog.type.recordDelete]: '記録{{keys}}を削除しました',
    [ActivityLog.type.recordImport]: '記録をインポートしました',
    [ActivityLog.type.recordStepUpdate]: '記録{{keys}}のステップを{{stepFrom}}から{{stepTo}}に更新しました',
    [ActivityLog.type.recordMerge]: '記録{{sourceRecordKeys}}を記録{{targetRecordKeys}}に統合しました',

    // Node
    [ActivityLog.type.nodeCreate]: '記録{{recordKeys}}の{{parentPath}}にノード{{name}}を追加しました',
    [ActivityLog.type.nodeValueUpdate]: '記録{{recordKeys}}の{{parentPath}}のノード{{name}}を更新しました',
    [ActivityLog.type.nodeDelete]: '記録{{recordKeys}}からノード{{name}}を削除しました',

    // User
    [ActivityLog.type.userInvite]: 'ユーザー{{email}}を役割{{groupName}}で招待しました',
    [ActivityLog.type.userUpdate]: 'ユーザー{{name}}を更新しました',
    [ActivityLog.type.userRemove]: 'ユーザー{{name}}を調査から削除しました',

    // Analysis
    [ActivityLog.type.chainCreate]: '処理チェーンを追加しました',
    [ActivityLog.type.chainPropUpdate]: '処理チェーン{{label}}の{{key}}を更新しました',
    [ActivityLog.type.analysisNodeDefPropUpdate]: '計算ノード定義{{name}}の{{key}}を{{value}}に更新しました',
    [ActivityLog.type.chainStatusExecSuccess]: '処理チェーン{{label}}の実行に成功しました',
    [ActivityLog.type.chainDelete]: '処理チェーン{{label}}を削除しました',
  },
}
