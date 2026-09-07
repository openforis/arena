export default {
  body: {
    label: '本文',
    info: `メッセージ本文の書式設定には**Markdown**記法が使えます（詳細は https://www.markdownguide.org を参照）。
以下のプレースホルダー変数も利用できます：
- \`{{userTitleAndName}}\`：ユーザーの敬称と氏名に置き換えられます（例：「John様」）
- \`{{userName}}\`：ユーザーの氏名に置き換えられます（例：「John」）`,
  },
  dateSent: '送信日',
  dateValidUntil: '有効期限',
  deleteMessage: {
    confirmTitle: 'このメッセージを削除しますか？',
  },
  messageDeleted: 'メッセージを削除しました。',
  notificationType: {
    label: '通知タイプ',
    email: 'メール',
    push_notification: 'アプリ内通知',
  },
  preview: 'プレビュー',
  sendMessage: {
    label: 'メッセージを送信',
    confirmTitle: 'このメッセージを送信しますか？',
  },
  status: {
    label: '状態',
    draft: '下書き',
    sent: '送信済み',
  },
  subject: '件名',
  target: {
    emailsExcluded: {
      label: '除外するメールアドレス',
      placeholder: '除外するメールアドレスを入力し、追加ボタンを押してください',
    },
    emailsIncluded: {
      label: '含めるメールアドレス',
      placeholder: '含めるメールアドレスを入力し、追加ボタンを押してください',
    },
    userType: {
      label: '対象ユーザータイプ',
      all: 'すべてのユーザー',
      system_admins: 'システム管理者',
      survey_managers: '調査マネージャー',
      data_analysts: 'データ分析者',
      data_cleaners: 'データクレンザー',
      data_editors: 'データ編集者',
      individual: '個別ユーザー',
    },
  },
}
