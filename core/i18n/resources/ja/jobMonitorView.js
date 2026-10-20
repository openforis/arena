export default {
  title: 'ジョブモニター',
  activeOnly: '実行中のジョブのみ',
  noSurvey: '—',
  columns: {
    type: '種類',
    status: '状態',
    survey: '調査',
    user: 'ユーザー',
    progress: '進捗',
    startedAt: '開始日時',
  },
  status: {
    pending: '待機中',
    running: '実行中',
    succeeded: '成功',
    failed: '失敗',
    canceled: 'キャンセル済み',
  },
  confirmCancelJob: 'このジョブをキャンセルしますか？',
  jobCanceledByAdmin: 'このジョブは管理者によってキャンセルされました。',
}
