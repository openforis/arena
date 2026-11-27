export default {
  loginView: {
    title: 'Anmelden',
    subtitle: 'Willkommen! Geben Sie Ihre Zugangsdaten ein, um mit $t(common.appNameFull) fortzufahren.',
    backToLogin: 'Zurück zur Anmeldung',
    noAccountYet: 'Noch kein Konto?',
    createAccount: 'Konto erstellen',
    invitedToSurvey:
      'Zu einer Erhebung eingeladen? Sie müssen kein Konto erstellen: Öffnen Sie den Link in der Einladungs-E-Mail und folgen Sie den Schritten.',
    or: 'oder',
    twoFactorTitle: 'Zwei-Faktor-Authentifizierung',
    verify: 'Bestätigen',
    lostYourDevice: 'Sie können Ihre Authenticator-App nicht verwenden?',
    yourName: 'Ihr Name',
    yourEmail: 'Ihre E-Mail-Adresse',
    yourPassword: 'Ihr Passwort',
    yourNewPassword: 'Ihr neues Passwort',
    repeatYourPassword: 'Passwort wiederholen',
    repeatYourNewPassword: 'Neues Passwort wiederholen',
    requestAccess: 'Zugriff anfordern',
    resetPassword: 'Passwort zurücksetzen',
    login: 'Anmelden',
    loginUsingBackupCode: 'Backup-Code verwenden',
    forgotPassword: 'Passwort vergessen?',
    sendPasswordResetEmail: 'E-Mail zum Zurücksetzen des Passworts senden',
    twoFactorBackupCode: '2FA-Backup-Code',
    twoFactorToken: 'Bestätigungscode',
    twoFactorTokenDescription: `Zum Schutz Ihres Kontos überprüfen wir Ihre Identität.

Geben Sie den von Ihrer Authenticator-App erzeugten Code ein.`,
  },
  externalLogin: {
    signInWith: 'Mit {{provider}} anmelden',
    continueWith: 'Mit {{provider}} fortfahren',
    registeredUsersOnly: 'Nur für registrierte Benutzer',
    errors: {
      providerNotAvailable:
        'Diese Anmeldeoption ist nicht verfügbar. Versuchen Sie es später erneut oder melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an.',
      flowInvalid:
        'Die Anmeldung ist abgelaufen oder wurde in einem anderen Browser begonnen. Versuchen Sie es erneut.',
      providerError: 'Die Anmeldung beim externen Anbieter ist fehlgeschlagen. Versuchen Sie es erneut.',
      emailNotVerified:
        'Der Anbieter hat Ihre E-Mail-Adresse nicht bestätigt, sodass sie keinem Konto zugeordnet werden kann. Melden Sie sich mit Ihrem Passwort an und verknüpfen Sie den Anbieter in Ihrem Profil.',
      emailDomainNotAllowed: 'Konten mit dieser E-Mail-Domain können diese Anmeldeoption nicht verwenden.',
      userNotFound:
        'Für diese E-Mail-Adresse ist kein Konto vorhanden. Bitten Sie einen Erhebungsadministrator um eine Einladung oder fordern Sie Zugriff an.',
      userNotFoundCreateAccount:
        'Für diese E-Mail-Adresse ist kein Konto vorhanden. Erstellen Sie zuerst ein Konto oder bitten Sie einen Erhebungsadministrator um eine Einladung.',
      ambiguousEmail:
        'Mehrere Konten stimmen mit dieser E-Mail-Adresse überein. Melden Sie sich mit Ihrem Passwort an und verknüpfen Sie den Anbieter in Ihrem Profil.',
      identityAlreadyLinked: 'Dieses Konto des Anbieters ist bereits mit einem anderen Benutzer verknüpft.',
      providerAlreadyLinked:
        'Ein anderes Konto dieses Anbieters ist bereits mit Ihrem Benutzerkonto verknüpft. Trennen Sie es zuerst in Ihrem Profil.',
      invitationInvalid:
        'Die Einladung ist ungültig oder abgelaufen. Bitten Sie den Erhebungsadministrator um eine neue Einladung.',
      invalidTwoFactorCode: 'Ungültiger Bestätigungscode.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'Wie geht es weiter?',
    alreadyHaveAnAccount: 'Sie haben bereits ein Konto?',
    steps: {
      sendRequest: {
        title: 'Anfrage senden',
        description:
          'Schlagen Sie einen Namen für Ihre erste Erhebung vor und beginnen Sie mit einer leeren Erhebung oder einer Vorlage.',
      },
      review: { title: 'Wir prüfen Ihre Anfrage', description: 'Bitte geben Sie uns einige Tage für die Bearbeitung.' },
      invitation: {
        title: 'Einladung erhalten',
        description:
          'Sie erhalten von **{{senderEmail}}** eine E-Mail mit dem Zugriffslink für $t(common.appName). Nicht im Posteingang? Prüfen Sie den Spam-Ordner und fügen Sie den Absender Ihren Kontakten hinzu oder markieren Sie die E-Mail als „Kein Spam“.',
        descriptionWithoutSender:
          'Sie erhalten eine E-Mail mit dem Zugriffslink für $t(common.appName). Nicht im Posteingang? Prüfen Sie den Spam-Ordner und fügen Sie den Absender Ihren Kontakten hinzu oder markieren Sie die E-Mail als „Kein Spam“.',
      },
      startWorking: {
        title: 'Arbeit beginnen',
        description:
          'Sie werden Erhebungsadministrator der neuen Erhebung und können bis zu fünf Erhebungen erstellen.',
      },
    },
    error: 'Fehler beim Anfordern des Zugriffs: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        institution: 'Institution',
        country: 'Land',
        purpose: 'Wofür benötigen Sie den Zugriff?',
        surveyName: 'Name für die Erhebung vorschlagen',
        templateUuid: 'Mit einer Vorlage beginnen?',
      },
    },
    introduction:
      'Die Ressourcen von $t(common.appName) sind begrenzt, daher wird der Zugriff auf Anfrage gewährt. Teilen Sie uns mit, was Sie damit tun möchten!',
    reCaptchaNotAnswered: 'ReCAPTCHA wurde nicht beantwortet',
    requestSent: 'Zugriffsanfrage erfolgreich gesendet',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Bitte geben Sie uns einige Tage für die Bearbeitung Ihrer Anfrage.
Nach der Annahme senden wir eine weitere E-Mail mit den Zugangsanweisungen für $t(common.appName) an **{{email}}**.
Vielen Dank und viel Erfolg mit **$t(common.appNameFull)**!`,
    surveyNameHint:
      'Der Name identifiziert die Erhebung auf der gesamten $t(common.appName)-Plattform und muss eindeutig sein: Wählen Sie einen spezifischen Namen (z. B. kenya_nfi_2026), keinen allgemeinen wie „survey“ oder „test“. Nur Kleinbuchstaben, Ziffern und Unterstriche.',
    sendRequest: 'Anfrage senden',
    sendRequestConfirm: 'Zugriff auf $t(common.appNameFull) anfordern?',
    templateNotSelected: 'Nicht ausgewählt (von Grund auf beginnen)',
    title: 'Zugriff anfordern',
    whitelistSenderSuggestion: `Falls Sie die E-Mail im Spam-Ordner finden, fügen Sie **{{senderEmail}}** Ihren Kontakten hinzu oder markieren Sie sie als sicher bzw. „Kein Spam“, damit zukünftige E-Mails von uns direkt Ihren Posteingang erreichen.`,
  },
  registrationView: {
    title: 'Konto erstellen',
    introduction:
      'Erstellen Sie Ihr Konto und Ihre erste Erhebung: Erzählen Sie uns, was Sie mit $t(common.appName) vorhaben!',
    createAccount: 'Konto erstellen',
    createAccountConfirm: 'Ihr Konto in $t(common.appNameFull) erstellen?',
    accountCreated: 'Konto erstellt',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Öffnen Sie den Link in der E-Mail, um Ihre E-Mail-Adresse zu bestätigen und Ihre Registrierung abzuschließen: Wählen Sie Ihr Passwort oder melden Sie sich mit einer der verfügbaren Anmeldeoptionen an (z. B. Google).

Vielen Dank und viel Freude mit **$t(common.appNameFull)**!`,
    error: 'Fehler beim Erstellen des Kontos: {{error}}',
    steps: {
      createAccount: {
        title: 'Konto erstellen',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'E-Mail bestätigen',
        description:
          'Sie erhalten eine E-Mail von **{{senderEmail}}** mit dem Link zum Abschließen Ihrer Registrierung. Nicht in Ihrem Posteingang? Prüfen Sie den Spam-/Junk-Ordner und fügen Sie den Absender zu Ihren Kontakten hinzu oder markieren Sie die E-Mail als kein Spam.',
        descriptionWithoutSender:
          'Sie erhalten eine E-Mail mit dem Link zum Abschließen Ihrer Registrierung. Nicht in Ihrem Posteingang? Prüfen Sie den Spam-/Junk-Ordner und fügen Sie den Absender zu Ihren Kontakten hinzu oder markieren Sie die E-Mail als kein Spam.',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Richten Sie Ihr Konto ein, um zu beginnen.',
      setYourNewPassword: 'Wählen Sie ein neues Passwort für Ihr Konto.',
    },
    title: {
      completeRegistration: 'Registrierung bei Arena abschließen',
      setYourNewPassword: 'Neues Passwort festlegen',
    },
    setNewPassword: 'Neues Passwort festlegen',
    forgotPasswordLinkInvalid: 'Die aufgerufene Seite existiert nicht oder ist nicht mehr gültig',
    passwordSuccessfullyReset: 'Ihr Passwort wurde erfolgreich zurückgesetzt',
    passwordStrengthChecksTitle: 'Anforderungen an die Passwortstärke',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Keine Leerzeichen',
      atLeast8CharactersLong: 'Mindestens 8 Zeichen lang',
      containsLowerCaseLetters: 'Enthält Kleinbuchstaben',
      containsUpperCaseLetters: 'Enthält Großbuchstaben',
      containsNumbers: 'Enthält Ziffern',
    },
    completeRegistration: 'Registrierung abschließen',
  },
  forgotPasswordView: {
    title: 'Passwort zurücksetzen',
    description:
      'Geben Sie die E-Mail-Adresse Ihres Kontos ein. Wir senden Ihnen einen Link zum Festlegen eines neuen Passworts.',
  },
  pitch: {
    default: {
      title: 'Felddaten – von der Erfassung bis zur Analyse.',
      description:
        'Entwerfen Sie mehrsprachige Formulare, verwalten Sie mehrzyklische Inventuren, prüfen Sie die Datenqualität und analysieren Sie Ergebnisse mit integriertem RStudio.',
    },
    accessRequest: {
      title: 'Starten Sie Ihre erste Erhebung in $t(common.appName).',
    },
    tags: {
      forestInventories: 'Waldinventuren',
      questionnaires: 'Fragebögen',
      multiCycle: 'Mehrzyklisch',
      statisticalAnalysis: 'Statistische Analyse',
    },
  },
  footer: {
    website: 'Über $t(common.appName)',
    userManual: 'Benutzerhandbuch',
    supportForum: 'Supportforum',
    version: 'Version {{version}}',
  },
}
