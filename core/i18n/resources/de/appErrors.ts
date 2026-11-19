export default {
  authProvider: {
    notFound: 'Anmeldeanbieter nicht gefunden',
    readOnly: 'Dieser Anbieter ist in der Serverkonfiguration definiert und kann hier nicht geändert werden',
    idAlreadyUsed: 'Die Kennung „{{id}}“ wird bereits von einem anderen Anbieter verwendet',
    encryptionKeyMissing:
      'Der Verschlüsselungsschlüssel für die Client-Geheimnisse (AUTH_PROVIDER_SECRET_ENCRYPTION_KEY) ist nicht konfiguriert',
    validation: 'Einige Felder sind ungültig',
    iconInvalid: 'Ungültiges Symbol: Verwenden Sie eine PNG- oder SVG-Datei mit höchstens 100 KB',
    identityNotFound: 'Verknüpftes Konto nicht gefunden',
    lastSignInMethod:
      'Dies ist die letzte Anmeldemethode: Legen Sie zuerst ein Passwort fest oder verknüpfen Sie einen anderen Anbieter',
    idInvalid: 'Ungültige Kennung: Verwenden Sie Kleinbuchstaben, Ziffern und Bindestriche (höchstens 64 Zeichen)',
    typeInvalid: 'Ungültiger Anbietertyp',
    labelInvalid: 'Die Schaltflächenbeschriftung ist erforderlich (höchstens 64 Zeichen)',
    issuerInvalid: 'Ungültige Aussteller-URL (HTTPS ist erforderlich)',
    tenantInvalid: 'Ungültiger Mandant',
    clientIdRequired: 'Die Client-ID ist erforderlich',
    scopesMissingOpenid: 'Die Geltungsbereiche müssen „openid“ enthalten',
    emailDomainInvalid: 'Ungültige E-Mail-Domain',
    clientSecretRequired: 'Das Client-Geheimnis ist erforderlich',
  },
  mapCustomLayers: {
    urlInvalid: 'Die Dienst-URL ist ungültig',
    urlNotAllowed: 'Es dürfen nur öffentliche HTTP- und HTTPS-Adressen verwendet werden',
    hostNotFound: 'Host nicht gefunden: {{host}}',
    redirectNotFollowed: 'Der Dienst leitet zu {{location}} weiter. Verwenden Sie stattdessen diese URL.',
    responseTooLarge: 'Die Antwort des Dienstes ist größer als {{limitMb}} MB',
    timeout: 'Der Dienst hat nicht innerhalb von {{seconds}} Sekunden geantwortet',
    fetchFailed: 'Der Dienst hat mit dem HTTP-Status {{status}} geantwortet',
    unreachable: 'Der Dienst ist nicht erreichbar',
    notCapabilities: 'Unter dieser URL wurden keine WMS- oder WMTS-Funktionen gefunden',
    noLayers: 'Der Dienst besitzt keine darstellbare Kartenebene',
    invalidLayers: 'Die Kartenebenen sind ungültig',
    tooManyLayers: 'Es können höchstens {{max}} benutzerdefinierte Kartenebenen hinzugefügt werden',
    busy: 'Der Server lädt gerade andere Dienste. Versuchen Sie es gleich erneut.',
  },
  aggregateFunctionInvalid: `Die benutzerdefinierte Aggregatfunktion „{{name}}“ ist ungültig. Bearbeiten Sie sie, um den Fehler zu beheben.`,
  cannotGetChild: `Unterelement „{{childName}}“ kann nicht aus Attribut {{name}} abgerufen werden`,
  cannotImportFilesExceedingQuota:
    'Datensatzdateien können nicht importiert werden: Das Speicherkontingent würde überschritten',
  cannotInsertFileExceedingQuota: 'Datei kann nicht eingefügt werden: Das Speicherkontingent würde überschritten',
  cannotOverridePublishedTaxa: 'Veröffentlichte Taxa können nicht überschrieben werden',
  cantUpdateStep: `Schritt kann nicht aktualisiert werden`,
  chainCannotBeSaved: 'Die Verarbeitungskette ist ungültig und kann nicht gespeichert werden',
  csv: {
    emptyHeaderFound: 'Leere Spaltenüberschrift an Position {{columnPosition}} gefunden',
    emptyHeaders: 'Leere Spaltenüberschriften gefunden',
  },
  dataExport: {
    excelMaxCellsLimitExceeded: 'Fehler beim Datenexport (zu viele Elemente). Versuchen Sie den Export im CSV-Format.',
    noRecordsMatchingSearchCriteria: 'Keine den Suchkriterien entsprechenden Datensätze',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Datenimport aus Arena Mobile ist nicht zulässig',
    invalidNodeInRecord:
      'Ungültiger Knoten im Datensatz „{{recordUuid}}“: Knoten „{{nodeUuid}}“ mit Knotendefinition „{{nodeDefName}}“ (UUID „{{nodeDefUuid}}“): {{details}}',
    noRecordsFound: 'Keine Datensätze in der Importdatei gefunden oder falsches Dateiformat',
    pendingImportFileNotFoundOrExpired:
      'Die zuvor hochgeladene Datei wurde nicht mehr gefunden; möglicherweise ist sie abgelaufen. Laden Sie sie erneut hoch.',
    recordMergeWithSameKeysNotAllowed:
      'Datensatz „{{recordKeyValues}}“ kann nicht importiert werden: Ein anderer Datensatz mit denselben Schlüsseln ist bereits vorhanden und das Zusammenführen ist in dieser Erhebung nicht zulässig',
    recordOfAnotherUserGroup:
      'Datensatz „{{recordKeyValues}}“ kann nicht aktualisiert werden, da er einer anderen Benutzergruppe gehört',
    recordOwnedByAnotherUser:
      'Datensatz „{{recordKeyValues}}“ kann nicht aktualisiert werden, da er einem anderen Benutzer gehört',
  },
  entryDataNotFound: 'Eingabedaten nicht gefunden: {{entryName}}',
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  functionHasTooFewArguments: 'Funktion {{fnName}} benötigt mindestens {{minArity}} Argumente (erhalten: {{numArgs}})',
  functionHasTooManyArguments:
    'Funktion {{fnName}} akzeptiert höchstens {{maxArity}} Argumente (erhalten: {{numArgs}})',
  generic: 'Unerwarteter Fehler: {{text}}',
  geoWhispApiError: 'Der Whisp-Dienst ist vorübergehend nicht verfügbar.',
  geoWhispSamplingPointDataCategoryMissing: 'Kategorie für Stichprobenpunktdaten nicht gefunden.',
  geoWhispSamplingPointDataLocationsMissing: 'Kein Stichprobenpunktdatenelement mit gültigem Standort gefunden.',
  importingDataIntoWrongCollectSurvey:
    'Daten werden in die falsche Erhebung importiert. Erwartete URI: {{collectSurveyUri}}',
  invalidType: 'Ungültiger Typ {{type}}',
  jobCanceledOrErrorsFound: 'Auftrag abgebrochen oder Fehler gefunden; Transaktion wird zurückgesetzt',
  jobOrphanedOnRestart: 'Der Auftrag wurde durch einen Serverneustart unterbrochen. Versuchen Sie es erneut.',
  mobileAppVersionNotSupported:
    'Diese Version von Arena Mobile wird vom Server nicht unterstützt. Aktualisieren Sie auf Version {{minVersion}} oder neuer.',
  paramIsRequired: 'Parameter {{param}} ist erforderlich',
  paramMustBeInteger: 'Parameter {{param}} muss eine Ganzzahl sein',
  propUpdateNotAllowed: 'Eigenschaft „{{key}}“ kann nicht aktualisiert werden',
  unableToFindParent: 'Übergeordnetes Element von {{name}} wurde nicht gefunden',
  unableToFindNode: 'Knoten mit dem Namen {{name}} wurde nicht gefunden',
  unableToFindSibling: 'Geschwisterelement mit dem Namen {{name}} wurde nicht gefunden',
  undefinedFunction: `Undefinierte Funktion „{{fnName}}“ oder falsche Parametertypen`,
  invalidSyntax: 'Die Ausdruckssyntax ist ungültig',
  networkError: 'Fehler bei der Kommunikation mit dem Server',
  nodeDefConversionNotAllowed: `„{{name}}“ kann nicht in {{toType}} konvertiert werden`,
  nodeDefTypeInvalid: 'Ungültiger Knotendefinitionstyp: {{type}}',
  record: {
    errorUpdating: 'Fehler beim Aktualisieren des Datensatzes',
    entityNotFound: 'Entität „{{entityName}}“ mit den Schlüsseln „{{keyValues}}“ nicht gefunden',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); error evaluating expression in node {{nodeDefName}}: {{details}}',
  },
  recordPrintableExport: {
    missingEntityParams: 'Der Export der aktuellen Seite erfordert entityDefUuid und entityNodeUuid',
    entityNotFound: 'Entität für den angegebenen Export nicht gefunden',
    missingServerUrl: 'Für den Export mit QR-Code ist eine öffentliche Server-URL erforderlich',
    qrTokenMismatch: 'QR-Code-Export konnte nicht abgeschlossen werden. Versuchen Sie es erneut.',
  },
  sessionExpiredRefreshPage: `Die Sitzung ist möglicherweise abgelaufen.
Versuchen Sie, die Seite zu aktualisieren.`,
  survey: {
    nodeDefNameNotFound: 'Knotendefinition nicht gefunden: {{name}}',
    dataMigrationInProgress: 'Diese Erhebung wird gerade aktualisiert. Versuchen Sie es in Kürze erneut.',
    fileNotFound: 'Datei nicht gefunden',
    languageCodeInvalid: 'Ungültiger Sprachcode: {{lang}}',
    cycleKeysInvalid: 'Zyklen müssen ab 1 fortlaufend nummeriert sein',
    srsCodeInvalid: 'Ungültiger Code des räumlichen Bezugssystems: {{code}}',
  },
  unsupportedFunctionType: 'Nicht unterstützter Funktionstyp: {{exprType}}',
  // AI gateway errors
  aiNotConfigured:
    'KI ist nicht konfiguriert. Legen Sie in den KI-Einstellungen einen persönlichen Anbieter fest oder bitten Sie Ihren Administrator, einen Standard zu konfigurieren.',
  aiFeaturesDisabled: 'KI-Funktionen sind in dieser Bereitstellung deaktiviert.',
  aiFeatureDisabled: 'Die KI-Funktion „{{feature}}“ ist deaktiviert.',
  aiPromptTooLarge: 'Die KI-Eingabe ist zu groß ({{size}} Zeichen; Grenzwert: {{limit}}).',
  aiInputTooLong: 'Das KI-Eingabefeld „{{field}}“ überschreitet den Grenzwert von {{limit}} Zeichen.',
  aiSchemaMissing: 'Für die Funktion „{{feature}}“ fehlt das Schema für strukturierte KI-Ausgaben.',
  aiProviderInvalid: 'Nicht unterstützter KI-Anbieter: {{provider}}.',
  aiModelMissing: 'Eine KI-Modellkennung ist erforderlich.',
  aiApiKeyMissing: 'Für den Anbieter {{provider}} ist ein API-Schlüssel erforderlich.',
  aiBaseUrlMissing: 'Für den OpenAI-kompatiblen Anbieter ist eine Basis-URL erforderlich.',
  aiModelListFailed: 'Modelle konnten nicht vom Anbieter abgerufen werden: {{message}}',
  aiVertexCredentialInvalid:
    'Ungültige Vertex-AI-Anmeldedaten: Fügen Sie den JSON-Schlüssel eines Dienstkontos oder einen Vertex-AI-API-Schlüssel ein.',
  aiExpressionDescriptionMissing: 'Beschreiben Sie den gewünschten Ausdruck in natürlicher Sprache.',
  aiExpressionTypeInvalid: 'Unbekannte Ausdrucksart: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'Ohne ein Zielfeld kann kein Ausdruck erzeugt werden.',
  aiExpressionNodeDefNotFound: 'Das Zielfeld wurde nicht gefunden (UUID {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'Ein leerer Ausdruck kann nicht erklärt werden.',
  aiTranslationSocketMissing: 'WebSocket ist nicht verbunden. Warten Sie einen Moment und versuchen Sie es erneut.',
  aiTranslationSourceLangMissing: 'Für die Übersetzung ist eine Ausgangssprache erforderlich.',
  aiTranslationTargetLangsMissing: 'Für die Übersetzung ist mindestens eine Zielsprache erforderlich.',
  aiTranslationItemsMissing: 'Nichts zu übersetzen.',
  aiTranslationTooManyItems: 'Zu viele Elemente in einem Stapel ({{count}}); der Grenzwert beträgt {{limit}}.',
  aiActivityLogSurveyMissing: 'Zum Zusammenfassen des Aktivitätsprotokolls ist eine Erhebung erforderlich.',
  aiChatbotDisabled: 'Der Dokumentations-Chatbot ist in dieser Bereitstellung deaktiviert.',
  aiChatbotUpstreamError:
    'Der Dokumentations-Chatbot ist vorübergehend nicht verfügbar. Versuchen Sie es gleich erneut.',
  aiChatbotPayloadTooLarge: 'Ihre Unterhaltung ist zu groß. Leeren Sie den Chat und stellen Sie eine kürzere Frage.',
  aiDataQueryDescriptionMissing: 'Beschreiben Sie in natürlicher Sprache, welche Daten Sie anzeigen möchten.',
  aiDataQueryNoEntities: 'Diese Erhebung besitzt keine abfragbaren Entitäten.',
  aiDataQueryInvalid: 'Die KI konnte für diese Anfrage keine gültige Abfrage erzeugen: {{errors}}',
  aiDataQueryEmpty: 'Wählen Sie zunächst eine Entität und einige Attribute (oder Dimensionen und Kennzahlen) aus.',
  aiDataQuerySummaryInvalid:
    'Die KI konnte keinen Namen und keine Beschreibung für diese Abfrage vorschlagen. Versuchen Sie es erneut.',
  userCannotDeleteHasMessages:
    'Dieser Benutzer kann nicht gelöscht werden: Er hat {{count}} Nachricht(en) verfasst. Löschen Sie diese zuerst oder weisen Sie sie neu zu.',
  userCannotDeleteLastSystemAdmin: 'Dieser Benutzer kann nicht gelöscht werden: Er ist der letzte Systemadministrator',
  userCannotDeleteOwnsSurveys:
    'Dieser Benutzer kann nicht gelöscht werden: Er besitzt {{count}} Erhebung(en). Übertragen Sie zuerst die Eigentümerschaft.',
  userCannotDeleteSelf: 'Sie können Ihr eigenes Benutzerkonto nicht löschen',
  userEmailInvalid:
    'Die Einladungs-E-Mail konnte nicht an {{email}} zugestellt werden. Prüfen Sie, ob die Adresse korrekt ist.',
  userHasPendingInvitation:
    'Für den Benutzer mit der E-Mail-Adresse „{{email}}“ liegt bereits eine ausstehende Einladung vor; bis zu deren Annahme kann er nicht zu dieser Erhebung eingeladen werden',
  userHasRole: 'Der angegebene Benutzer besitzt bereits eine Rolle in dieser Erhebung',
  userHasRole_other: 'Die angegebenen Benutzer besitzen bereits eine Rolle in dieser Erhebung',
  userInvalid: 'Ungültiger Benutzer',
  userInvitationLinkNotAvailable:
    'Der Einladungslink dieses Benutzers kann nur von einem Systemadministrator kopiert werden, da der Benutzer Rollen oder Einladungen außerhalb dieser Erhebung besitzt',
  surveyCompareFileTooLarge:
    'Die Erhebungsdatei ist zu groß (max. {{maxSize}} MB): Exportieren Sie die Erhebung ohne Daten; Datensätze und zugehörige Dateien werden für den Vergleich nicht benötigt',
  userIsAdmin: 'Der angegebene Benutzer ist bereits Systemadministrator',
  userNotAllowedToChangePref: 'Der Benutzer darf diese Einstellung nicht ändern',
  userNotAuthorized: 'Benutzer {{userName}} ist nicht autorisiert',
  userNotFound: 'Benutzer nicht gefunden: {{userUuid}}',
  userNotInvitedToSurvey: 'Für diesen Benutzer liegt keine ausstehende Einladung zu dieser Erhebung vor',
  usersBackupImport: {
    invalidFile: 'Die Datei ist keine gültige Arena-Benutzersicherung',
  },
}
