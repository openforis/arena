export default {
  section: 'KI-Funktionen',
  encryptionMissing:
    'In dieser Bereitstellung fehlt AI_USER_KEY_ENCRYPTION_SECRET. Persönliche API-Schlüssel können erst gespeichert werden, nachdem ein Administrator die Einstellung konfiguriert hat.',
  model: 'Modell',
  modelOther: 'Anderes Modell (Modell-ID eingeben) ...',
  modelChooseFromList: 'Aus der Modellliste wählen',
  baseUrl: 'Basis-URL',
  apiKey: 'API-Schlüssel',
  apiKeyPlaceholder: 'API-Schlüssel Ihres Anbieters einfügen',
  apiKeySaved: 'Schlüssel gespeichert',
  unknownError: 'Unbekannter Fehler',
  apiKeyKept: 'Leer lassen, um den vorhandenen Schlüssel beizubehalten.',
  apiKeyUnreadable:
    'Der gespeicherte API-Schlüssel kann nicht mehr gelesen werden (das Verschlüsselungsgeheimnis des Servers wurde geändert). Geben Sie den Schlüssel erneut ein.',
  vercelAiSdkHint:
    'Ein Vercel-AI-SDK-Chat-Endpunkt wird als fester Agent behandelt; Modellauswahl und API-Schlüssel gelten nicht. Freitextgenerierung funktioniert, Funktionen für strukturierte Ausgaben möglicherweise nicht.',
  modelsFetchFailed: 'Modelle konnten nicht abgerufen werden: {{message}}',
  savedSuccessfully: 'KI-Einstellungen gespeichert.',
  saveFailed: 'KI-Einstellungen konnten nicht gespeichert werden: {{message}}',
  status: {
    ready: 'Bereit',
    notTested: 'Nicht getestet',
    notAvailable: 'Nicht verfügbar',
    notSetUp: 'Nicht eingerichtet',
  },
  where: {
    onDevice: 'Dieser Computer',
    orgHosted: 'Organisationsserver',
    cloudOwnKey: 'Cloud · Ihr Schlüssel',
    cloud: 'Cloud',
  },
  localServer: {
    where: 'Auf diesem Computer oder in Ihrem Netzwerk',
    baseUrl: 'Server-URL',
    answered: 'Hat geantwortet',
    noModels: 'Der Server listet kein Modell auf. Laden Sie ein Modell in Ihren lokalen Server.',
    contextTokens_one: 'Kontext: {{count}} Token',
    contextTokens_other: 'Kontext: {{count}} Token',
    contextUnknown: 'Kontext: unbekannt (8.192 Token angenommen)',
    model: 'Modell',
    modelPlaceholder: 'Testen Sie die Verbindung, um die Modelle aufzulisten',
    help: 'Starten Sie Ihren lokalen Server (zum Beispiel LM Studio oder Ollama) und erlauben Sie Anfragen von dieser Website (CORS). Ihr Browser fragt möglicherweise, ob der Zugriff auf Geräte im lokalen Netzwerk erlaubt werden soll.',
    httpsHint:
      'Arena wird über HTTPS bereitgestellt: Ein Server auf einem anderen Rechner Ihres Netzwerks benötigt HTTPS oder einen Browser mit Local Network Access (Chrome) und Ihrer Erlaubnis.',
    cloudWarning:
      'Diese Adresse liegt weder auf diesem Gerät noch auf der Serverliste der Organisation: Die KI-Richtlinie der Erhebung behandelt sie als Cloud-Dienst.',
    notSaved:
      'Die Einstellungen des lokalen KI-Servers konnten in diesem Browser nicht gespeichert werden (Speicher blockiert oder voll).',
  },
  list: {
    section: 'Anbieter',
    add: 'Anbieter hinzufügen',
    arenaDefault: 'Arena-Standard',
    default: 'Standard',
    defaultMissing:
      'Ihr Standardanbieter ist ein lokaler Server, der in einem anderen Browser gespeichert ist. Machen Sie einen anderen Anbieter zum Standard, um KI hier zu verwenden.',
    footerHint: 'Anbieter werden beim Hinzufügen gespeichert. Was die KI sehen darf, wird mit „Speichern“ gespeichert.',
    menu: 'Aktionen für {{name}}',
    makeDefault: 'Als Standard festlegen',
    test: 'Verbindung testen',
    edit: 'Bearbeiten …',
    remove: 'Entfernen',
    removeConfirm: '{{name}} entfernen? Unterhaltungen, die ihn verwenden, nutzen dann Ihren Standardanbieter.',
    removed: '{{name}} wurde entfernt.',
    defaultChanged: '{{name}} ist jetzt Ihr Standard.',
    testOk: '{{name}} hat geantwortet.',
    testFailed: '{{name}} hat nicht geantwortet. Bearbeiten Sie den Anbieter, um seine Einstellungen zu prüfen.',
    actionFailed: 'Die Änderung konnte nicht gespeichert werden: {{message}}',
  },
  types: {
    local: 'Lokaler Server',
    orgServer: 'Organisationsserver',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'google-vertex': 'Google Vertex AI (Gemini)',
    'openai-compatible': 'OpenAI-kompatibel',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock (Testserver)',
  },
  defaultName: {
    local: 'Lokaler Server',
    orgServer: 'Organisationsserver',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    'google-vertex': 'Google Vertex AI',
    'openai-compatible': 'OpenAI-kompatibel',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock',
  },
  typeHints: {
    orgServer: 'Ein OpenAI-kompatibler Server auf der Liste Ihrer Organisation.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'google-vertex': 'Ein Vertex-AI-API-Schlüssel (Express-Modus); Modell eingeben, z. B. gemini-2.5-flash.',
    'vercel-ai-sdk': 'Ein mit dem Vercel AI SDK erstellter Chat-Endpunkt.',
  },
  dialog: {
    addTitle: 'KI-Anbieter hinzufügen',
    editTitle: '{{name}} bearbeiten',
    groupLocal: 'Auf Ihrem Computer oder in Ihrem Netzwerk',
    groupCloud: 'Cloud, mit Ihrem API-Schlüssel',
    back: 'Zurück',
    name: 'Name (optional)',
    test: 'Testen',
    testOk: 'Antwort in {{latencyMs}} ms',
    add: 'Anbieter hinzufügen',
    save: 'Speichern',
    testFirst: 'Testen Sie die Verbindung vor dem Speichern.',
    orgServerHint: 'Server auf der Liste Ihrer Organisation: {{urls}}',
    orgServerNotAllowed: 'Diese Adresse steht nicht auf der Serverliste Ihrer Organisation.',
    apiKeyCleared: 'Die Adresse wurde geändert: Geben Sie den API-Schlüssel erneut ein.',
    removeKey: 'Schlüssel entfernen',
    keepKey: 'Schlüssel behalten',
    apiKeyRemoved: 'Der gespeicherte Schlüssel wird entfernt. Testen Sie die Verbindung und speichern Sie dann.',
    localUrlHint:
      'Diese Adresse liegt auf Ihrem Computer oder in Ihrem Netzwerk: Der Arena-Server kann sie nicht erreichen. Fügen Sie sie stattdessen als lokalen Server hinzu.',
    useLocalServer: 'Lokalen Server hinzufügen',
  },
  dataClasses: {
    none: 'Keine Erhebungsinhalte',
    schema: 'Erhebungsdesign',
    data: 'Erfasste Daten',
  },
  access: {
    section: 'Was die KI sehen darf',
    levels: {
      off: 'Aus',
      help: 'Nur Hilfe',
      design: '+ Erhebungsdesign',
      data: '+ Erfasste Daten',
    },
    classes: {
      help: {
        title: 'Arena-Hilfe',
        text: 'Ihre Frage und Auszüge aus dem Arena-Benutzerhandbuch.',
      },
      design: {
        title: 'Erhebungsdesign',
        text: 'Entitäten, Attribute, Bezeichnungen, Kategorien und Ausdrücke. Keine Datensatzwerte.',
      },
      data: {
        title: 'Erfasste Daten',
        text: 'Datensatzwerte und Abfrageergebnisse. Standardmäßig darf nur ein Server auf diesem Gerät sie empfangen.',
      },
    },
    count: '{{on}} von {{total}} Funktionen aktiv',
    off: 'KI-Funktionen sind ausgeschaltet',
    customize: 'Anpassen',
    customizeHint: 'Die KI-Richtlinie jeder Erhebung kann einen Anbieter trotzdem sperren.',
    sendsInfo: 'Was gesendet wird',
  },
  features: {
    chat: {
      label: 'Hilfe-Assistent',
      sends: 'Ihre Frage, Auszüge aus dem Arena-Benutzerhandbuch und wo Sie sich in Arena befinden (der Modulname).',
    },
    assistantSuggestions: {
      label: 'Proaktive Vorschläge',
      sends: 'Nichts, bis Sie bei einem Vorschlag auf „Ausführen“ klicken. Die Prüfungen laufen in Ihrem Browser.',
    },
    expressions: {
      label: 'Ausdrücke',
      sends:
        'Das Attribut und seine Geschwisterattribute (Namen und Typen), den Ausdruck und Ihre Beschreibung. Bei einem erneuten Versuch oder der Erklärung eines Fehlers auch den fehlgeschlagenen Ausdruck und seine Fehlermeldung.',
    },
    translation: {
      label: 'Übersetzung von Bezeichnungen',
      sends:
        'Die übersetzte Bezeichnung oder Beschreibung mit den Sprachcodes. „KI: Bezeichnungen übersetzen“ im Formular-Designer sendet die Bezeichnungen und Beschreibungen aller Entitäten und Attribute.',
    },
    assistantDesign: {
      label: 'Design-Assistent',
      sends: 'Die angeforderte Erhebungsstruktur: Entitäten, Attribute, Bezeichnungen, Kategorien und Ausdrücke.',
    },
    dataQuery: {
      label: 'Datenabfragen',
      sends:
        'Die Attributnamen, -typen und -bezeichnungen der Entitäten der Erhebung, Kategorienamen, Ihre Beschreibung und für eine Zusammenfassung die Abfrage mit ihrem Filter. Keine Datensatzwerte.',
    },
    dataDictionary: {
      label: 'Datenwörterbuch',
      sends:
        'Den Namen der Erhebung und für jede Entität oder jedes Attribut ohne Beschreibung den Namen, Typ und die übergeordneten Entitäten.',
    },
    assistantAnalysis: {
      label: 'Analyse-Assistent',
      sends:
        'Die Erhebungsstruktur, dann Datensatzzahlen und Abfrageergebnisse (bis zu 200 Gruppen oder 50 Zeilen), wann immer er eine Abfrage ausführt.',
    },
    assistantCleaning: {
      label: 'Bereinigungsassistent',
      sends:
        'Die Erhebungsstruktur, Validierungsfehler mit ihren Datensatzschlüsseln und Werten, die Werte der betrachteten Datensätze und bei Abfragen deren Ergebnisse (Datensatzzahlen und bis zu 200 Gruppen oder 50 Zeilen). Er schlägt Änderungen vor, die Sie prüfen.',
    },
    userActivity: {
      label: 'Aktivitätszusammenfassungen',
      sends:
        'Den Namen der Erhebung, Benutzernamen, Aktivitätstypen, Anzahlen und Datumsangaben aus dem Aktivitätsprotokoll.',
    },
  },
}
