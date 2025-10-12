export default {
  signature: `<p>Thank you,<br>
      $t(common.appNameFull) platform
      </p>`,
  temporaryMsg: '<p><i>This link is only valid for the next 7 days. Please do not share it with anyone else.</i></p>',
  userInviteCommon: `<p>You have been invited by {{invitingUserName}} to join the $t(common.appNameFull) survey '{{surveyName}} - {{surveyLabel}}' as {{groupLabel}}</p>
      {{-message}}
      <p>With the role of <b>{{groupLabel}}</b> you have the following permissions: <br/> 
        <ul>{{groupPermissions}}</ul>
      </p>`,
  userInvite: {
    subject: 'You have been invited to $t(common.appNameFull)!',
    body: `<p>Hello,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{urlResetPassword}}">Click here to complete your registration to $t(common.appNameFull)</a></p>
             <p>If it doesn't work, please copy and paste the following link in your browser: {{urlResetPassword}}</p>
             $t(emails:temporaryMsg)
             <p><i>You have received this email because {{invitingUserName}} invited you to access $t(common.appNameFull) through {{serverUrl}}. If you are not the recipient, please ignore it.</i></p>
             <p>After you have completed the registration, you can access directly $t(common.appNameFull) with this link: <a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>$t(common.raiseTicketInSupportForum)</p>
             $t(emails:signature)`,
  },
  userInviteExistingUser: {
    subject: `You have been invited to join the survey '{{surveyLabel}}' in $t(common.appNameFull)!`,
    body: `<p>Hello,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{serverUrl}}">Click here to access $t(common.appNameFull)</a></p>
             <p>If it doesn't work, please copy and paste the following link in your browser: {{serverUrl}}</p>
             $t(emails:signature)`,
  },
  userAccessRequest: {
    subject: '$t(common.appNameFull) - User Access Request',
    body: `<p>Hello,</p>
      <p>The following user has requested access to $t(common.appNameFull).</p>
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
      <p>Please evaluate this request and get back to the user as soon as possible.</p>
      <p><a href="{{serverUrl}}">Click here to access $t(common.appNameFull)</a></p>
      $t(emails:signature)`,
  },
  userInviteRepeatConfirmation: 'User {{email}} has been successfully invited again. $t(common.emailSentConfirmation)',
  userResetPassword: {
    subject: '$t(common.appNameFull). Password reset',
    body: `<p>Hello {{name}},</p>
             <p>You recently requested to reset your password for your $t(common.appNameFull) account. Click the link below to reset it.</p>
             <p><a href="{{url}}">Reset your password</a></p>
             $t(emails:temporaryMsg)
             <p>If you did not request a password reset, please ignore this email or let us know.<br/>This password reset link is only valid for the next 7 days.</p>
             $t(emails:signature)`,
  },
  userDeleted: {
    subject: `You have been removed from the survey {{surveyLabel}} in $t(common.appNameFull)`,
    body: `<p>Hello {{name}},</p>
      <p>You have been removed from the survey <strong>{{surveyName}} - {{surveyLabel}}</strong></p>
      <p>If you want to have access again to that survey, please contact the survey administrator.</p>
      $t(emails:signature)`,
  },
}
