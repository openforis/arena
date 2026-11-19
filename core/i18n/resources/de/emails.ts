export default {
  signature: `<p>Vielen Dank,<br>
      Ihre $t(common.appNameFull)-Plattform
      </p>
      <p><i>Hinweis: Dies ist eine automatische Nachricht. Bitte <b>ANTWORTEN SIE NICHT</b> auf diese E-Mail.</i></p>
      `,
  temporaryMsg: '<p><i>Dieser Link ist nur sieben Tage gültig. Geben Sie ihn nicht an andere Personen weiter.</i></p>',
  userInviteCommon: `<p>{{invitingUserName}} hat Sie als {{groupLabel}} zur $t(common.appNameFull)-Erhebung „{{surveyName}} – {{surveyLabel}}“ eingeladen.</p>
      {{-message}}
      <p>Mit der Rolle <b>{{groupLabel}}</b> besitzen Sie folgende Berechtigungen: <br/>
        <ul>{{-groupPermissions}}</ul>
      </p>`,
  userInvite: {
    subject: 'Sie wurden zu $t(common.appNameFull) eingeladen!',
    body: `<p>Guten Tag,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{urlResetPassword}}">Klicken Sie hier, um Ihre Registrierung bei $t(common.appNameFull) abzuschließen</a></p>
             <p>Falls der Link nicht funktioniert, kopieren Sie diese Adresse in Ihren Browser: {{urlResetPassword}}</p>
             $t(emails:temporaryMsg)
             <p><i>Sie erhalten diese E-Mail, weil {{invitingUserName}} Sie zum Zugriff auf $t(common.appNameFull) unter {{serverUrl}} eingeladen hat. Falls Sie nicht der vorgesehene Empfänger sind, ignorieren Sie diese Nachricht.</i></p>
             <p>Nach Abschluss der Registrierung können Sie $t(common.appNameFull) direkt über diesen Link aufrufen: <a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>$t(common.raiseTicketInSupportForum)</p>
             $t(emails:signature)`,
  },
  userInviteExistingUser: {
    subject: 'Sie wurden zur Erhebung „{{surveyLabel}}“ in $t(common.appNameFull) eingeladen!',
    body: `<p>Guten Tag,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{serverUrl}}">Klicken Sie hier, um $t(common.appNameFull) aufzurufen</a></p>
             <p>Falls der Link nicht funktioniert, kopieren Sie diese Adresse in Ihren Browser: {{serverUrl}}</p>
             $t(emails:signature)`,
  },
  userAccessRequestConfirmation: {
    subject: '$t(common.appNameFull) – Zugriffsanfrage eingegangen',
    body: `<p>Guten Tag {{firstName}},</p>
      <p>Wir haben Ihre Anfrage auf Zugriff auf $t(common.appNameFull) erhalten. Sie wird geprüft und wir melden uns so bald wie möglich bei Ihnen.</p>
      <p><i>Sie erhalten diese E-Mail, weil diese Adresse in einer Zugriffsanfrage auf {{serverUrl}} angegeben wurde. Falls Sie diese Anfrage nicht gestellt haben, schreiben Sie bitte an <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</i></p>
      $t(emails:signature)`,
  },
  userAccessRequest: {
    subject: '$t(common.appNameFull) – Benutzerzugriffsanfrage',
    body: `<p>Guten Tag,</p>
      <p>Der folgende Benutzer hat Zugriff auf $t(common.appNameFull) angefordert.</p>
      <p>
        <ul>
          <li>$t(guest:accessRequestView.fields.email): {{email}}</li>
          <li>$t(guest:accessRequestView.fields.props.firstName): {{firstName}}</li>
          <li>$t(guest:accessRequestView.fields.props.lastName): {{lastName}}</li>
          <li>$t(guest:accessRequestView.fields.props.institution): {{institution}}</li>
          <li>$t(guest:accessRequestView.fields.props.country): {{country}}</li>
          <li>$t(guest:accessRequestView.fields.props.purpose): {{purpose}}</li>
          <li>$t(guest:accessRequestView.fields.props.surveyName): {{surveyName}}</li>
        </ul>
      </p>
      <p>Prüfen Sie diese Anfrage und antworten Sie dem Benutzer so bald wie möglich.</p>
      <p><a href="{{serverUrl}}">Klicken Sie hier, um $t(common.appNameFull) aufzurufen</a></p>
      $t(emails:signature)`,
  },
  recordsUploadedFromMobile: {
    subject_one:
      '$t(common.appNameFull) – {{count}} Datensatz aus Arena Mobile in die Erhebung „{{surveyName}}“ hochgeladen',
    subject_other:
      '$t(common.appNameFull) – {{count}} Datensätze aus Arena Mobile in die Erhebung „{{surveyName}}“ hochgeladen',
    body: `<p>Guten Tag {{name}},</p>
      <p>{{uploadedByName}} ({{uploadedByEmail}}) hat am {{dateSubmitted}} die folgenden Datensätze aus Arena Mobile in die Erhebung <b>{{surveyFullName}}</b> hochgeladen:</p>
      {{-recordsTable}}
      <p>Um einen Datensatz in $t(common.appNameFull) zu finden, öffnen Sie die Erhebung, wählen Sie Daten &gt; Datensätze und suchen Sie nach den Schlüsselwerten.</p>
      {{-accessLinkMsg}}
      <p><i>Sie erhalten diese E-Mail, weil Sie Administrator der Erhebung „{{surveyName}}“ sind und die Benachrichtigung bei Uploads aus Arena Mobile aktiviert ist. Jeder Erhebungsadministrator kann sie deaktivieren.</i></p>
      $t(emails:signature)`,
    accessLink: '<p><a href="{{serverUrl}}">Klicken Sie hier, um $t(common.appNameFull) aufzurufen</a></p>',
    action: {
      inserted: 'Neu',
      updated: 'Aktualisiert',
    },
    table: {
      keys: 'Schlüsselwerte',
      cycle: 'Zyklus',
      action: 'Status',
      owner: 'Erstellt von',
      dateCreated: 'Erstellt am',
      dateModified: 'Geändert am',
      validation: 'Fehler/Warnungen',
      uuid: 'Datensatz-UUID',
    },
  },
  userInviteRepeatConfirmation:
    'Benutzer {{email}} wurde erneut erfolgreich eingeladen. $t(common.emailSentConfirmation)',
  userResetPassword: {
    subject: '$t(common.appNameFull) – Passwort zurücksetzen',
    body: `<p>Guten Tag {{name}},</p>
             <p>Sie haben kürzlich das Zurücksetzen des Passworts für Ihr $t(common.appNameFull)-Konto angefordert. Klicken Sie zum Zurücksetzen auf den folgenden Link.</p>
             <p><a href="{{url}}">Passwort zurücksetzen</a></p>
             <p>Falls der Link nicht funktioniert, kopieren Sie diese Adresse in Ihren Browser: {{url}}</p>
             $t(emails:temporaryMsg)
             <p>Falls Sie das Zurücksetzen nicht angefordert haben, ignorieren Sie diese E-Mail oder informieren Sie uns.</p>
             $t(emails:signature)`,
  },
  authProviderUnlinked: {
    subject: '$t(common.appNameFull): {{providerLabel}} wurde von Ihrem Konto getrennt',
    body: `<p>Guten Tag {{name}},</p>
      <p>Ihr <strong>{{providerLabel}}</strong>-Konto wurde von Ihrem $t(common.appNameFull)-Konto getrennt. Sie können es nicht mehr zur Anmeldung verwenden.</p>
      <p>Falls Sie diese Änderung nicht vorgenommen haben, wenden Sie sich bitte an die Administratoren von $t(common.appNameFull).</p>
      $t(emails:signature)`,
  },
  authProviderDeleted: {
    subject: '$t(common.appNameFull): Die Anmeldung mit {{providerLabel}} ist nicht mehr verfügbar',
    body: `<p>Guten Tag {{name}},</p>
      <p>Die Anmeldung bei $t(common.appNameFull) mit <strong>{{providerLabel}}</strong> ist nicht mehr verfügbar. Dies war Ihre einzige Anmeldemöglichkeit.</p>
      <p>Um wieder auf Ihr Konto zuzugreifen, legen Sie über „Passwort vergessen?“ auf der Anmeldeseite ein Passwort fest: <a href="{{serverUrl}}/guest/forgotPassword">{{serverUrl}}/guest/forgotPassword</a></p>
      $t(emails:signature)`,
  },
  userDeleted: {
    subject: 'Sie wurden aus der Erhebung {{surveyLabel}} in $t(common.appNameFull) entfernt',
    body: `<p>Guten Tag {{name}},</p>
      <p>Sie wurden aus der Erhebung <strong>{{surveyName}} – {{surveyLabel}}</strong> entfernt.</p>
      <p>Wenden Sie sich an den Erhebungsadministrator, wenn Sie wieder Zugriff auf diese Erhebung benötigen.</p>
      $t(emails:signature)`,
  },
  userRegistrationExpired: {
    subject: 'Ihr $t(common.appNameFull)-Konto wurde entfernt',
    accountRemoved: '<p>Aus diesem Grund wurde Ihr Konto entfernt.</p>',
    accountAndSurveysRemoved: `<p>Aus diesem Grund wurden Ihr Konto und die folgenden Erhebungen entfernt, die seit ihrer Erstellung nicht geändert worden waren:</p>
      <ul>{{-surveysList}}</ul>`,
    surveyItem: '<li><b>{{survey}}</b></li>',
    requestAccessAgain: `<p>Wenn Sie $t(common.appNameFull) weiterhin verwenden möchten, können Sie hier erneut Zugriff anfordern: <a href="{{serverUrl}}">{{serverUrl}}</a></p>`,
    body: `<p>Guten Tag,</p>
      <p>Ihre Registrierung bei $t(common.appNameFull) wurde nicht innerhalb von sieben Tagen nach Erhalt des Registrierungslinks abgeschlossen. Der Link ist daher abgelaufen.</p>
      {{-accountRemovedMsg}}
      {{-requestAccessAgainMsg}}
      <p>$t(common.raiseTicketInSupportForum)</p>
      $t(emails:signature)`,
  },
}
