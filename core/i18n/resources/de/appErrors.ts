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
  cannotGetChild: `Unterknoten „{{childName}}“ kann nicht aus Attribut {{name}} abgerufen werden`,
  cannotImportFilesExceedingQuota:
    'Datensatzdateien können nicht importiert werden: Das Speicherkontingent würde überschritten',
  cannotInsertFileExceedingQuota: 'Datei kann nicht eingefügt werden: Das Speicherkontingent würde überschritten',
  cannotOverridePublishedTaxa: 'Veröffentlichte Taxa können nicht überschrieben werden',
  cantUpdateStep: `Schritt kann nicht aktualisiert werden`,
  categoryItemLabelsInvalid: 'Ungültige Anfrage für Kategoriebezeichnungen ({{reason}}).',
  categoryItemLabelsTooLarge:
    'Diese Kategorie ist zu groß, um fehlende Bezeichnungen zu prüfen; versuchen Sie es später erneut oder verwenden Sie eine kleinere Kategorie.',
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
  forbidden: 'Sie sind dazu nicht berechtigt.',
  functionHasTooFewArguments: 'Funktion {{fnName}} benötigt mindestens {{minArity}} Argumente (erhalten: {{numArgs}})',
  functionHasTooManyArguments:
    'Funktion {{fnName}} akzeptiert höchstens {{maxArity}} Argumente (erhalten: {{numArgs}})',
  generic: 'Unerwarteter Fehler: {{text}}',
  unexpectedServerError: 'Auf dem Server ist ein unerwarteter Fehler aufgetreten.',
  tooManyRequests: 'Zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.',
  geoWhispApiError: 'Der Whisp-Dienst ist vorübergehend nicht verfügbar.',
  geoWhispSamplingPointDataCategoryMissing: 'Kategorie für Stichprobenpunktdaten nicht gefunden.',
  geoWhispSamplingPointDataLocationsMissing: 'Kein Stichprobenpunktdatenelement mit gültigem Standort gefunden.',
  importingDataIntoWrongCollectSurvey:
    'Daten werden in die falsche Erhebung importiert. Erwartete URI: {{collectSurveyUri}}',
  invalidParams: 'Ungültige Anfrageparameter.',
  invalidType: 'Ungültiger Typ {{type}}',
  jobCanceledOrErrorsFound: 'Auftrag abgebrochen oder Fehler gefunden; Transaktion wird zurückgesetzt',
  jobOrphanedOnRestart: 'Der Auftrag wurde durch einen Serverneustart unterbrochen. Versuchen Sie es erneut.',
  mobileAppVersionNotSupported:
    'Diese Version von Arena Mobile wird vom Server nicht unterstützt. Aktualisieren Sie auf Version {{minVersion}} oder neuer.',
  paramIsRequired: 'Parameter {{param}} ist erforderlich',
  paramMustBeInteger: 'Parameter {{param}} muss eine Ganzzahl sein',
  propUpdateNotAllowed: 'Eigenschaft „{{key}}“ kann nicht aktualisiert werden',
  unableToFindParent: 'Übergeordneter Knoten von {{name}} wurde nicht gefunden',
  unableToFindNode: 'Knoten mit dem Namen {{name}} wurde nicht gefunden',
  unableToFindSibling: 'Geschwisterknoten mit dem Namen {{name}} wurde nicht gefunden',
  undefinedFunction: `Undefinierte Funktion „{{fnName}}“ oder falsche Parametertypen`,
  invalidSyntax: 'Die Ausdruckssyntax ist ungültig',
  networkError: 'Fehler bei der Kommunikation mit dem Server',
  nodeDefConversionNotAllowed: `„{{name}}“ kann nicht in {{toType}} konvertiert werden`,
  nodeDefTypeInvalid: 'Ungültiger Knotendefinitionstyp: {{type}}',
  record: {
    errorUpdating: 'Fehler beim Aktualisieren des Datensatzes',
    entityNotFound: 'Entität „{{entityName}}“ mit den Schlüsseln „{{keyValues}}“ nicht gefunden',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); Fehler beim Auswerten des Ausdrucks im Knoten {{nodeDefName}}: {{details}}',
    lockTimeout: 'Der Datensatz ist gerade belegt; versuchen Sie es in einigen Sekunden erneut.',
    nodeNotInRecord: 'Der Knoten gehört nicht zum Datensatz {{recordUuid}}.',
    nodesBatchInvalid: 'Ungültige Anfrage zur Stapelbearbeitung ({{reason}}).',
    nodesBatchBusy: 'Eine andere Stapelbearbeitung läuft noch; versuchen Sie es in einigen Sekunden erneut.',
    nodesBatchInvalidValue: 'Der neue Wert von „{{attributeName}}“ ist für dieses Attribut nicht gültig.',
    nodesBatchWouldClearValues:
      'Diese Änderung würde andere Werte löschen, die nicht mehr relevant sind; bearbeiten Sie diesen Wert im Formular, um dies zu bestätigen.',
    nodesBatchUnexpected:
      'Die Änderung konnte wegen eines unerwarteten Fehlers auf dem Server nicht übernommen werden.',
    nodesBatchRolledBack:
      'Die Änderung wurde nicht übernommen, weil eine andere Änderung desselben Datensatzes fehlgeschlagen ist.',
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
    nodeDefRefLocked: '{{name}} kann keine andere Kategorie oder Taxonomie erhalten: Es ist veröffentlicht.',
    languageCodeInvalid: 'Ungültiger Sprachcode: {{lang}}',
    cycleKeysInvalid: 'Zyklen müssen ab 1 fortlaufend nummeriert sein',
    srsCodeInvalid: 'Ungültiger Code des räumlichen Bezugssystems: {{code}}',
  },
  unsupportedFunctionType: 'Nicht unterstützter Funktionstyp: {{exprType}}',
  aiSessionExpired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  aiNotAuthorized: 'Sie dürfen diese KI-Funktion hier nicht verwenden.',
  // AI gateway errors
  aiNotConfigured:
    'KI ist nicht konfiguriert. Legen Sie in den KI-Einstellungen einen persönlichen Anbieter fest oder bitten Sie Ihren Administrator, einen Standard zu konfigurieren.',
  aiPolicyRefused:
    'Die KI-Richtlinie dieser Erhebung erlaubt nicht, $t(common:aiPolicy.dataClass.{{dataClass}}) an $t(common:aiPolicy.hostingClass.{{hostingClass}}) zu senden.',
  aiPolicyDataAboveSchema:
    'Erfasste Daten dürfen nicht freizügiger geteilt werden als das Erhebungsdesign (Design: „$t(common:aiPolicy.level.{{schema}})“, erfasste Daten: „$t(common:aiPolicy.level.{{data}})“).',
  aiPolicyInvalid:
    'Die KI-Richtlinie ist ungültig: Wählen Sie eine Stufe für das Erhebungsdesign und eine für die erfassten Daten.',
  aiPolicyAboveCeiling:
    '„$t(common:aiPolicy.level.{{level}})“ ist für $t(common:aiPolicy.dataClass.{{dataClass}}) auf dieser Arena-Instanz nicht zulässig (Maximum: „$t(common:aiPolicy.level.{{ceiling}})“).',
  aiFeaturesDisabled: 'KI-Funktionen sind in dieser Bereitstellung deaktiviert.',
  aiFeatureDisabled: 'Die KI-Funktion „{{feature}}“ ist deaktiviert.',
  aiPromptTooLarge: 'Die KI-Eingabe ist zu groß ({{size}} Zeichen; Grenzwert: {{limit}}).',
  aiInputTooLong: 'Das KI-Eingabefeld „{{field}}“ überschreitet den Grenzwert von {{limit}} Zeichen.',
  aiFeatureUnknown: 'Unbekannte KI-Funktion „{{feature}}“.',
  aiCallInvalid: 'Die KI-Anfrage ist ungültig ({{reason}}).',
  aiRateLimited: 'Zu viele KI-Anfragen. Bitte warten Sie eine Minute und versuchen Sie es erneut.',
  aiDailyBudgetExceeded:
    'Sie haben das heutige Limit des Arena-Standard-KI-Anbieters erreicht. Es wird um Mitternacht UTC zurückgesetzt. Mit Ihrem eigenen Anbieter in den KI-Einstellungen können Sie weiterarbeiten.',
  aiRequestTimeout: 'Die Antwort der KI hat zu lange gedauert. Bitte versuchen Sie es erneut.',
  aiToolNotOffered:
    'Die KI hat ein Werkzeug angefordert, das sie nicht verwenden darf; ihre Antwort wurde daher verworfen. Bitte versuchen Sie es erneut.',
  aiProviderAuth:
    'Der KI-Anbieter hat die Anmeldedaten abgelehnt. Prüfen Sie den API-Schlüssel in den KI-Einstellungen oder wenden Sie sich an Ihren Administrator.',
  aiProviderRateLimited: 'Der KI-Anbieter drosselt die Anfragen. Bitte versuchen Sie es gleich erneut.',
  aiProviderRejected: 'Der KI-Anbieter hat die Anfrage abgelehnt (prüfen Sie den Modellnamen in den KI-Einstellungen).',
  aiDataDictionaryInvalid: 'Die KI hat keine verwendbaren Feldbeschreibungen geliefert.',
  aiDescriptionsInvalid: 'Die mit dem Export gesendeten KI-Feldbeschreibungen sind ungültig.',
  aiIncludeAiDescriptionsRemoved: 'Diese Seite ist veraltet. Laden Sie sie neu und exportieren Sie erneut.',
  aiProviderInvalid: 'Nicht unterstützter KI-Anbieter: {{provider}}.',
  aiModelMissing: 'Eine KI-Modellkennung ist erforderlich.',
  aiApiKeyMissing: 'Für den Anbieter {{provider}} ist ein API-Schlüssel erforderlich.',
  aiBaseUrlMissing: 'Für den OpenAI-kompatiblen Anbieter ist eine Basis-URL erforderlich.',
  aiBaseUrlNotAllowed:
    'Diese Basis-URL verweist auf eine interne Adresse, die der Arena-Server nicht aufruft. Verwenden Sie für ein Modell auf Ihrem Computer den lokalen KI-Server. Für einen Server Ihrer Organisation bitten Sie Ihren Administrator, ihn zu den Modellservern der Organisation hinzuzufügen.',
  aiProviderUnavailable: 'Der KI-Anbieter ist nicht erreichbar. Bitte versuchen Sie es später erneut.',
  aiProviderResponseTooLarge:
    'Die Antwort des KI-Anbieters war zu groß und wurde abgeschnitten. Bitte versuchen Sie es erneut oder wählen Sie einen anderen Anbieter.',
  aiSurveyChanged:
    'Die Erhebung hat sich geändert, während der Assistent gearbeitet hat. Fragen Sie erneut, um die aktuelle Erhebung zu verwenden.',
  aiModelListFailed: 'Modelle konnten nicht vom Anbieter abgerufen werden.',
  aiProviderNotFound: 'Dieser KI-Anbieter existiert nicht oder gehört nicht Ihnen. Wählen Sie einen anderen Anbieter.',
  aiProviderNotGateway:
    'Ein in diesem Browser gespeicherter Anbieter wird vom Browser aus aufgerufen, nie über den Arena-Server.',
  aiApiKeyUnreadable:
    'Der gespeicherte API-Schlüssel dieses Anbieters kann nicht mehr gelesen werden (das Verschlüsselungsgeheimnis des Servers wurde geändert). Bearbeiten Sie den Anbieter in Ihren KI-Einstellungen und geben Sie den Schlüssel erneut ein.',
  aiEncryptionMissing:
    'API-Schlüssel können nicht gespeichert werden: Der Server hat kein Verschlüsselungsgeheimnis. Bitten Sie Ihren Administrator, AI_USER_KEY_ENCRYPTION_SECRET festzulegen.',
  aiProviderChanged:
    'Dieser KI-Anbieter wurde während der Prüfung geändert oder entfernt. Laden Sie die KI-Einstellungen neu und versuchen Sie es erneut.',
  aiProviderFieldTooLong:
    'Ein Anbieterwert ist zu lang: $t(appErrors:aiProviderFieldNames.{{field}}) darf höchstens {{max}} Zeichen haben.',
  aiProviderFieldNames: {
    model: 'Modell',
    baseUrl: 'Basis-URL',
    apiKey: 'API-Schlüssel',
  },
  aiProviderLimitReached:
    'Sie können höchstens {{max}} KI-Anbieter speichern. Entfernen Sie einen, um einen weiteren hinzuzufügen.',
  aiExpressionDescriptionMissing: 'Beschreiben Sie den gewünschten Ausdruck in natürlicher Sprache.',
  aiExpressionTypeInvalid: 'Unbekannte Ausdrucksart: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'Ohne ein Zielfeld kann kein Ausdruck erzeugt werden.',
  aiExpressionNodeDefNotFound: 'Das Zielfeld wurde nicht gefunden (UUID {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'Ein leerer Ausdruck kann nicht erklärt werden.',
  aiTranslationSourceLangMissing: 'Für die Übersetzung ist eine Ausgangssprache erforderlich.',
  aiTranslationTargetLangsMissing: 'Für die Übersetzung ist mindestens eine Zielsprache erforderlich.',
  aiTranslationItemsMissing: 'Nichts zu übersetzen.',
  aiTranslationInvalid: 'Die KI hat keine verwendbare Übersetzung geliefert. Bitte versuchen Sie es erneut.',
  aiTranslationTooManyItems: 'Zu viele Elemente in einem Stapel ({{count}}); der Grenzwert beträgt {{limit}}.',
  aiDataQueryDescriptionMissing: 'Beschreiben Sie in natürlicher Sprache, welche Daten Sie anzeigen möchten.',
  aiDataQueryNoEntities: 'Diese Erhebung besitzt keine abfragbaren Entitäten.',
  aiDataQueryInvalid: 'Die KI konnte für diese Anfrage keine gültige Abfrage erzeugen: {{errors}}',
  aiDataQueryEmpty: 'Wählen Sie zunächst eine Entität und einige Attribute (oder Dimensionen und Kennzahlen) aus.',
  aiAssistantNoAnswer:
    'Der Assistent hat ohne Antwort beendet. Versuchen Sie es erneut oder stellen Sie eine engere Frage.',
  aiAssistantContextFull:
    'Der Kontext des Modells war voll, bevor der Assistent antworten konnte. Beginnen Sie eine neue Unterhaltung, stellen Sie eine engere Frage oder verwenden Sie ein Modell mit größerem Kontext.',
  aiAssistantToolCallText:
    'Das Modell hat einen Werkzeugaufruf als Text geschrieben, statt das Werkzeug aufzurufen. Versuchen Sie es erneut oder verwenden Sie ein größeres Modell.',
  aiLocalServerUnreachable:
    'Der KI-Server unter {{baseUrl}} ist nicht erreichbar. Läuft er mit aktiviertem CORS? Hat der Browser den Zugriff auf Geräte im lokalen Netzwerk blockiert?',
  aiLocalServerModelMissing:
    'Das Modell „{{modelId}}“ ist auf dem lokalen KI-Server nicht verfügbar. Laden Sie es in LM Studio oder wählen Sie in Ihren KI-Einstellungen ein anderes Modell.',
  aiLocalServerContextExceeded:
    'Die Anfrage ist für die Kontextgröße des lokalen Modells zu lang. Laden Sie das Modell in LM Studio mit einem größeren Kontext oder kürzen Sie die Anfrage.',
  aiLocalServerError: 'Der lokale KI-Server hat einen Fehler zurückgegeben (HTTP {{status}}).',
  aiNoEngineAvailable: 'Für diese Anfrage kann keine KI-Engine verwendet werden.',
  aiLocalServerConsentCancelled: 'Die Anfrage wurde abgebrochen.',
  aiProviderChooseAnother: 'Die Anfrage wurde nicht gesendet. Wählen Sie einen anderen KI-Anbieter.',
  aiDataQuerySummaryInvalid:
    'Die KI konnte keinen Namen und keine Beschreibung für diese Abfrage vorschlagen. Versuchen Sie es erneut.',
  aiApplyTimeout:
    'Der Server hat nicht rechtzeitig geantwortet. Einige Änderungen wurden möglicherweise übernommen: Laden Sie neu, um dies zu prüfen.',
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
  userPrefsInvalid: 'Die Benutzereinstellungen sind ungültig',
  userNotAuthorized: 'Benutzer {{userName}} ist nicht autorisiert',
  userNotFound: 'Benutzer nicht gefunden: {{userUuid}}',
  userNotInvitedToSurvey: 'Für diesen Benutzer liegt keine ausstehende Einladung zu dieser Erhebung vor',
  usersBackupImport: {
    invalidFile: 'Die Datei ist keine gültige Arena-Benutzersicherung',
  },
}
