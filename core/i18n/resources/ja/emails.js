export default {
  signature: `<p>よろしくお願いいたします。<br>
      $t(common.appNameFull) プラットフォームより
      </p>
      <p><i>注：これは自動送信メッセージです。このメールに<b>返信しないでください</b>。</i></p>
      `,
  temporaryMsg: '<p><i>このリンクの有効期限は7日間です。他の人と共有しないでください。</i></p>',
  userInviteCommon: `<p>{{invitingUserName}}さんから、$t(common.appNameFull)の調査「{{surveyName}} - {{surveyLabel}}」に{{groupLabel}}として招待されました</p>
      {{-message}}
      <p><b>{{groupLabel}}</b>の役割には、以下の権限があります：<br/>
        <ul>{{groupPermissions}}</ul>
      </p>`,
  userInvite: {
    subject: '$t(common.appNameFull)への招待が届いています！',
    body: `<p>こんにちは、</p>
             $t(emails:userInviteCommon)
             <p><a href="{{urlResetPassword}}">ここをクリックして$t(common.appNameFull)への登録を完了してください</a></p>
             <p>リンクが機能しない場合は、次のアドレスをコピーしてブラウザに貼り付けてください：{{urlResetPassword}}</p>
             $t(emails:temporaryMsg)
             <p><i>このメールは、{{invitingUserName}}さんが{{serverUrl}}経由で$t(common.appNameFull)へのアクセスをあなたに招待したために送信されています。心当たりがない場合は無視してください。</i></p>
             <p>登録完了後は、次のリンクから直接$t(common.appNameFull)にアクセスできます：<a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>$t(common.raiseTicketInSupportForum)</p>
             $t(emails:signature)`,
  },
  userInviteExistingUser: {
    subject: `$t(common.appNameFull)の調査「{{surveyLabel}}」への招待が届いています！`,
    body: `<p>こんにちは、</p>
             $t(emails:userInviteCommon)
             <p><a href="{{serverUrl}}">ここをクリックして$t(common.appNameFull)にアクセス</a></p>
             <p>リンクが機能しない場合は、次のアドレスをコピーしてブラウザに貼り付けてください：{{serverUrl}}</p>
             $t(emails:signature)`,
  },
  userAccessRequestConfirmation: {
    subject: '$t(common.appNameFull) - アクセス申請を受け付けました',
    body: `<p>{{firstName}}様、こんにちは</p>
      <p>$t(common.appNameFull)へのアクセス申請を受け付けました。内容を確認のうえ、なるべく早くご連絡いたします。</p>
      <p><i>このメールは、{{serverUrl}}でこのアドレスを使ってアクセス申請が行われたために送信されています。心当たりがない場合は、<a href="mailto:{{supportEmail}}">{{supportEmail}}</a>までご連絡ください。</i></p>
      $t(emails:signature)`,
  },
  userAccessRequest: {
    subject: '$t(common.appNameFull) - ユーザーアクセス申請',
    body: `<p>こんにちは、</p>
      <p>以下のユーザーから$t(common.appNameFull)へのアクセス申請がありました。</p>
      <p>
        <ul>
          <li>$t(accessRequestView.fields.email): {{email}}</li>
          <li>$t(accessRequestView.fields.props.firstName): {{firstName}}</li>
          <li>$t(accessRequestView.fields.props.lastName): {{lastName}}</li>
          <li>$t(accessRequestView.fields.props.institution): {{institution}}</li>
          <li>$t(accessRequestView.fields.props.country): {{country}}</li>
          <li>$t(accessRequestView.fields.props.purpose): {{purpose}}</li>
          <li>$t(accessRequestView.fields.props.surveyName): {{surveyName}}</li>
        </ul>
      </p>
      <p>内容を確認のうえ、なるべく早くこのユーザーにご連絡ください。</p>
      <p><a href="{{serverUrl}}">ここをクリックして$t(common.appNameFull)にアクセス</a></p>
      $t(emails:signature)`,
  },
  userInviteRepeatConfirmation: 'ユーザー{{email}}を再度招待しました。$t(common.emailSentConfirmation)',
  userResetPassword: {
    subject: '$t(common.appNameFull) - パスワードの再設定',
    body: `<p>{{name}}様、こんにちは</p>
             <p>$t(common.appNameFull)アカウントのパスワード再設定リクエストを受け付けました。以下のリンクからパスワードを再設定してください。</p>
             <p><a href="{{url}}">パスワードを再設定</a></p>
             <p>リンクが機能しない場合は、次のアドレスをコピーしてブラウザに貼り付けてください：{{url}}</p>
             $t(emails:temporaryMsg)
             <p>パスワードの再設定をリクエストしていない場合は、このメールを無視するか、ご連絡ください。</p>
             $t(emails:signature)`,
  },
  userDeleted: {
    subject: `$t(common.appNameFull)の調査{{surveyLabel}}から削除されました`,
    body: `<p>{{name}}様、こんにちは</p>
      <p>調査<strong>{{surveyName}} - {{surveyLabel}}</strong>から削除されました</p>
      <p>この調査への再アクセスをご希望の場合は、調査管理者にご連絡ください。</p>
      $t(emails:signature)`,
  },
}
