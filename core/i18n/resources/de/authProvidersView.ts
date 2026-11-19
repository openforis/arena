export default {
  title: 'Anmeldeanbieter',
  subtitle:
    'Externe Anmeldeoptionen, die in dieser Reihenfolge auf der Anmeldeseite angezeigt werden. Benutzer können sich außerdem mit E-Mail-Adresse und Passwort anmelden.',
  addProvider: 'Anbieter hinzufügen',
  continue: 'Weiter',
  encryptionKeyMissing:
    'Der Verschlüsselungsschlüssel für die Client-Geheimnisse ist nicht konfiguriert. Setzen Sie AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 Hexadezimalzeichen) auf dem Server und starten Sie Arena neu, um Anbieter hinzufügen zu können.',
  empty: {
    title: 'Noch keine Anmeldeanbieter',
    description:
      'Ermöglichen Sie Benutzern zusätzlich zur Anmeldung mit E-Mail-Adresse und Passwort die Anmeldung mit Google, Microsoft oder dem Single Sign-on Ihrer Organisation.',
  },
  columns: {
    provider: 'Anbieter',
    type: 'Typ',
    status: 'Status',
    loginPage: 'Anmeldeseite',
    linkedUsers: 'Verknüpfte Benutzer',
    actions: 'Aktionen',
  },
  passwordAlwaysAvailable:
    'Die Anmeldung mit E-Mail-Adresse und Passwort ist immer verfügbar. Änderungen erreichen innerhalb einer Minute alle Serverinstanzen.',
  status: {
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
  },
  source: {
    env: 'Serverkonfiguration',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Angezeigt',
    directLinkOnly: 'Nur direkter Link',
  },
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  enable: 'Aktivieren',
  disable: 'Deaktivieren',
  deleteConfirm:
    'Anmeldeanbieter „{{provider}}“ löschen? Die Verknüpfungen seiner {{linkedUsersCount}} Benutzer werden entfernt. Um Anmeldungen zu verhindern, die Verknüpfungen aber beizubehalten, deaktivieren Sie ihn stattdessen.\n\nBenutzer, denen danach keine Anmeldemethode mehr zur Verfügung steht (sie erhalten eine E-Mail mit einer Anleitung zum Festlegen eines Passworts): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Wählen Sie den Anbietertyp. Beschriftung und Symbol können Sie anschließend ändern.',
    typeDescription: {
      google: 'Google-Konten einschließlich Gmail und Google Workspace.',
      microsoft: 'Microsoft-Geschäfts-, Schul- oder Privatkonten (Entra ID).',
      oidc: 'Alle anderen Anbieter: Keycloak, Okta, Auth0 oder das SSO Ihrer Organisation …',
    },
    notSupportedYet: 'Facebook, GitHub und Apple werden noch nicht unterstützt.',
  },
  form: {
    errors: 'Anbieter kann nicht gespeichert werden: {{errors}}',
    newTitle: 'Neuer {{type}}-Anbieter',
    general: 'Allgemein',
    label: 'Schaltflächenbeschriftung',
    id: 'Kennung',
    idInfo:
      'Wird in URLs und zur Verknüpfung von Benutzerkonten verwendet: Kleinbuchstaben, Ziffern und Bindestriche. Die Kennung kann nach dem Erstellen nicht mehr geändert werden.',
    icon: 'Symbol',
    useUploadedIcon: 'Hochgeladenes Symbol verwenden',
    iconInvalid: 'Ungültiges Symbol: Verwenden Sie eine PNG- oder SVG-Datei mit höchstens 100 KB.',
    enabled: 'Aktiviert',
    enabledInfo:
      'Bei Deaktivierung wird die Schaltfläche ausgeblendet und Anmeldungen über diesen Anbieter werden abgelehnt. Verknüpfte Konten bleiben erhalten.',
    showOnLoginPage: 'Auf der Anmeldeseite anzeigen',
    showOnLoginPageInfo:
      'Wenn diese Option deaktiviert ist, besitzt der Anbieter keine Schaltfläche auf der Anmeldeseite. Benutzer melden sich über den direkten Link {{path}} an.',
    connection: 'Verbindung',
    issuer: 'Aussteller-URL',
    issuerInfo: 'Arena liest die übrigen Endpunkte aus <issuer>/.well-known/openid-configuration.',
    tenant: 'Mandant',
    tenantInfo:
      'Mandanten-ID Ihrer Organisation oder „organizations“ (alle Geschäfts- oder Schulkonten), „consumers“ (Privatkonten) beziehungsweise „common“ (alle Microsoft-Konten).',
    clientId: 'Client-ID',
    clientSecret: 'Client-Geheimnis',
    clientSecretInfo:
      'Wird verschlüsselt gespeichert und nie wieder angezeigt. Lassen Sie das Feld leer, um den aktuellen Wert beizubehalten.',
    clientSecretSet: '(festgelegt)',
    scopes: 'Geltungsbereiche',
    scopesInfo: 'Durch Leerzeichen getrennt; „openid“ ist erforderlich.',
    access: 'Zugriff',
    accessDescription: 'Nur Benutzer mit einem bestehenden Arena-Konto oder einer Einladung können sich anmelden.',
    allowedEmailDomains: 'Zulässige E-Mail-Domains',
    allowedEmailDomainsInfo:
      'Benutzer können sich nur mit einer E-Mail-Adresse aus diesen Domains anmelden (z. B. der Domain Ihrer Organisation).',
    emailDomainsMode: { all: 'Alle E-Mail-Domains zulassen', specific: 'Nur bestimmte Domains zulassen' },
    emailDomainsPlaceholder: 'Domain eingeben, z. B. example.org',
    emailDomainsRequired: 'Fügen Sie mindestens eine E-Mail-Domain hinzu oder lassen Sie alle E-Mail-Domains zu',
    requireArena2FA: 'Zwei-Faktor-Authentifizierung von Arena verlangen',
    requireArena2FAInfo:
      'Benutzer, die Arena-2FA aktiviert haben, müssen weiterhin ihren Code eingeben. Deaktivieren Sie diese Option nur, wenn der Anbieter eine eigene Multi-Faktor-Authentifizierung erzwingt.',
    trustEmail: 'E-Mail-Adressen dieses Anbieters vertrauen',
    trustEmailInfo:
      'Konten anhand der E-Mail-Adresse verknüpfen, auch wenn der Anbieter deren Bestätigung nicht bestätigt. Aktivieren Sie dies nur für Anbieter, die E-Mail-Adressen selbst überprüfen.',
    redirectUri: 'Weiterleitungs-URI',
    redirectUriCopied: 'Weiterleitungs-URI kopiert',
    setupStepsTitle: 'Anbieter einrichten',
    setupGuide: {
      google: 'Ausführliche Anleitung: Google',
      microsoft: 'Ausführliche Anleitung: Microsoft',
      oidc: 'Ausführliche Anleitung: Keycloak und andere Anbieter',
    },
    setupSteps: {
      google: [
        'Öffnen Sie in der Google Cloud Console die Google Auth Platform (oder APIs & Services) > Clients und erstellen Sie einen OAuth-Client vom Typ „Web application“.',
        'Fügen Sie die oben angegebene Weiterleitungs-URI unter „Authorized redirect URIs“ des Clients hinzu.',
        'Kopieren Sie die von Google erstellte Client-ID und das Client-Geheimnis in die Felder Client-ID und Client-Geheimnis im Bereich Verbindung (links) und klicken Sie anschließend auf Speichern.',
      ],
      microsoft: [
        'Öffnen Sie im Microsoft Entra Admin Center App registrations > New registration.',
        'Fügen Sie die oben angegebene Weiterleitungs-URI als „Web“-Weiterleitungs-URI der Anwendung hinzu.',
        'Erstellen Sie unter Certificates & secrets ein neues Client-Geheimnis.',
        'Kopieren Sie die Application (client) ID und den Wert des Geheimnisses in die Felder Client-ID und Client-Geheimnis im Bereich Verbindung (links) und klicken Sie anschließend auf Speichern.',
      ],
      oidc: [
        'Registrieren Sie Arena beim Anbieter (z. B. Keycloak oder Okta) als vertrauliche Webanwendung (OpenID Connect, Autorisierungscodefluss).',
        'Fügen Sie die oben angegebene Weiterleitungs-URI zu den zulässigen Weiterleitungs-URIs der Anwendung hinzu und erlauben Sie die Geltungsbereiche openid, email und profile.',
        'Kopieren Sie Aussteller-URL, Client-ID und Client-Geheimnis der Anwendung in die entsprechenden Felder im Bereich Verbindung (links) und klicken Sie anschließend auf Speichern.',
      ],
    },
    loginPagePreview: 'Vorschau der Anmeldeseite',
    readOnlyEnv:
      'Dieser Anbieter ist in der Serverkonfiguration (AUTH_PROVIDERS_CONFIG) definiert. Ändern Sie ihn dort und starten Sie Arena neu.',
    testConnection: 'Verbindung testen',
    testSignIn: 'Anmeldung testen',
    testConnectionOk: 'Verbindung erfolgreich: {{keysCount}} Signaturschlüssel in {{durationMs}} ms geladen.',
    testConnectionFailed: 'Verbindung fehlgeschlagen: {{error}}',
  },
  testResult: {
    title: 'Ergebnis der Testanmeldung',
    success:
      'Anmeldung erfolgreich: Das ID-Token wurde validiert. Niemand wurde angemeldet und es wurden keine Änderungen vorgenommen.',
    issuer: 'Aussteller',
    subject: 'Subjekt (sub)',
    email: 'E-Mail-Adresse',
    verified: '(bestätigt)',
    notVerified: '(nicht bestätigt)',
    name: 'Name',
    matchingUser: 'Übereinstimmender Arena-Benutzer',
    outcome: 'Bei der Anmeldung',
    alreadyLinked: 'Bereits verknüpft: Der Benutzer würde angemeldet.',
    wouldLink: 'Das Konto würde anhand der E-Mail-Adresse mit dem Benutzer verknüpft.',
  },
}
