export default {
  accepted: '承認済み',
  accessRequestDate: 'アクセス申請日',
  confirmUserWillBeSystemAdmin: 'このユーザーはシステム管理者になります。続けますか？',
  copyInvitationLink: '招待リンクをクリップボードにコピー',
  copyInvitationLinkConfirmMessage: `招待されたユーザーがメールアドレス{{email}}にメールを受信していない場合、
招待リンクをクリップボードにコピーして、他の方法で共有できます。

招待リンクをクリップボードにコピーしますか？`,
  copyPasswordResetLink: 'パスワード再設定リンクをクリップボードにコピーしますか？',
  copyPasswordResetLinkConfirmMessage: `ユーザーがパスワードを再設定したものの、メールアドレス{{email}}にメールを受信していない場合、
パスワード再設定リンクをクリップボードにコピーして、他の方法で共有できます。

パスワード再設定リンクをクリップボードにコピーしますか？`,
  editSurveyUserExtraPropsForUser: 'ユーザー「{{userName}}」の調査ユーザー追加プロパティを編集',
  inviteUser: '招待',
  invitationExpiredClickToSendAgainTheInvitation: '招待の有効期限が切れています：クリックして招待を再送信',
  invitationLinkCopiedToClipboard: '招待リンクをクリップボードにコピーしました',
  invitedBy: '招待者',
  invitedDate: '招待日',
  lastLogin: '最終ログイン',
  moreThan30DaysAgo: '30日以上前',
  notAcceptedYet: '招待はまだ承認されていません',
  passwordResetLinkCopiedToClipboard: 'パスワード再設定リンクをクリップボードにコピーしました',
  passwordResetLink: 'パスワード再設定リンク',
  prefs: {
    title: '通知設定',
    notifyOnUserAccessRequest: '新規ユーザーのアクセス申請',
  },
  roleInCurrentSurvey: '現在の調査での役割',
  roleInSurvey: '調査での役割',
  filterPlaceholder: '名前またはメールアドレスで絞り込み',
  surveyName: '調査名',
  surveyExtraProp: {
    label: '調査追加プロパティ',
    label_other: '調査追加プロパティ',
  },
  surveysDraft: '調査（下書き）',
  surveysPublished: '調査（公開済み）',
  userRemovedFromSurveyGoToSurveysRequired: `この調査から削除されました。
「調査一覧へ」を押して調査一覧を開いてください。`,
  userRoleUpdatedRefreshRequired: `この調査でのあなたの役割が更新されました。
$t(common.pressRefreshToReloadPage)`,
  userGroup: {
    new: '新規グループ',
    edit: 'グループを編集',
    name: '名前',
    label: 'ラベル',
    qualifier: 'グループ識別属性{{index}}',
    qualifier_plural: 'グループ識別属性',
    qualifierKey: 'キー',
    qualifierValue: '値',
    addQualifier: 'グループ識別属性を追加',
    members: 'メンバー',
    addMember: 'メンバーを追加',
    noMembers: 'メンバーはまだいません',
    memberAlreadyInGroup: '現在「{{groupName}}」に所属しています',
    tabs: {
      groups: 'ユーザーグループ',
      assignments: 'グループ割り当て',
      report: 'メンバーレポート',
    },
    memberName: 'メンバー名',
    memberEmail: 'メンバーのメールアドレス',
    memberRole: '調査での役割',
    memberStatus: '状態',
    status: {
      INVITED: '招待済み',
      ACCEPTED: '承認済み',
      FORCE_CHANGE_PASSWORD: 'パスワードの変更が必要です',
    },
    unassigned: '未割り当て',
    confirmDelete: 'グループ「{{name}}」を削除しますか？そのメンバーは未割り当てになります。続けますか？',
    deleteConfirmed: 'グループ「{{name}}」を削除しました',
    saveConfirmed: 'グループ「{{name}}」を保存しました',
    confirmReassign: '{{userName}}は現在グループ「{{groupName}}」に所属しています。このグループに移動しますか？',
    notFound: 'グループが見つかりません',
  },
  updateUserConfirmation: 'ユーザー{{name}}を更新しました',
  userNotInvitedToAnySurvey: `このユーザーはどの調査にも招待されていません`,
  userSurveys: 'ユーザーの調査',
  usersBackup: {
    menu: 'バックアップ / 復元',
    backup: 'ユーザーのバックアップ',
    backupTitle: 'ユーザーのバックアップ',
    backupInfo:
      'すべてのユーザーが調査でのロールとユーザーグループとともにエクスポートされ、別のArenaサーバーに復元できます。2FAデバイスはエクスポートされません。',
    includePasswords: 'パスワードを含める',
    passwordsWarning:
      'バックアップファイルにはパスワードのハッシュが含まれます。安全な場所に保管し、使用後は削除してください。',
    restore: 'ユーザーの復元',
    restoreTitle: 'バックアップからユーザーを復元',
    restoreInfo: `- ユーザーはメールアドレスで照合されます
- 調査でのロールとユーザーグループは、調査名とグループ名で照合されます
- このサーバーに存在しない調査のロールとユーザーグループは無視されます
- 変更内容を確認するため、まず「検証」を実行してください`,
    conflictMode: {
      skip: '既存のユーザーをスキップ',
      merge: '既存のユーザー：不足している調査でのロールとユーザーグループを追加',
      overwrite: '既存のユーザー：詳細（名前、パスワード、ステータス）、調査でのロール、ユーザーグループを上書き',
    },
    validate: '検証',
    summaryDryRun: '検証が完了しました：まだ何も変更されていません',
    summaryImported: 'ユーザーを復元しました',
    summary: {
      usersTotal: 'バックアップ内のユーザー：{{count}}',
      usersInserted: '新規ユーザー：{{count}}',
      usersUpdated: '更新されたユーザー：{{count}}',
      usersSkipped: 'スキップされたユーザー：{{count}}',
      authGroupsAdded: '追加された調査でのロール：{{count}}',
      userGroupsAdded: '追加されたユーザーグループのメンバーシップ：{{count}}',
    },
    surveysNotFound: '見つからない調査（ロールは無視されました）：{{names}}',
    userGroupsNotFound: '見つからないユーザーグループ（メンバーシップは無視されました）：{{names}}',
  },
}
