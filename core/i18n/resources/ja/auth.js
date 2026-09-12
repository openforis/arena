export default {
  authGroups: {
    systemAdmin: {
      label: 'システム管理者',
      label_plural: 'システム管理者',
      description: 'OF Arenaシステム管理者',
    },
    surveyManager: {
      label: '調査マネージャー',
      label_plural: '調査マネージャー',
      description: 'OF Arena調査マネージャー',
    },
    surveyAdmin: {
      label: '調査管理者',
      label_plural: '調査管理者',
      description: 'すべての権限',
    },
    surveyEditor: {
      label: '調査編集者',
      label_plural: '調査編集者',
      description: '調査・記録の編集、ユーザーの招待が可能',
    },
    dataEditor: {
      label: 'データ編集者',
      label_plural: 'データ編集者',
      description: 'データ入力ステップで記録の編集が可能',
    },
    dataCleanser: {
      label: 'データクレンザー',
      label_plural: 'データクレンザー',
      description: 'データクレンジングステップで記録の編集が可能',
    },
    dataAnalyst: {
      label: 'データ分析者',
      label_plural: 'データ分析者',
      description: 'データ分析手順で記録の編集が可能',
    },
    surveyGuest: {
      label: '調査ゲスト',
      label_plural: '調査ゲスト',
      description: '記録の閲覧が可能',
    },
  },
}
