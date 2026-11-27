export default {
  // Common
  invalidEmail: 'Ungültige E-Mail-Adresse',
  invalidField: '„{{field}}“ ist ungültig',
  invalidNumber: 'Ungültige Zahl',
  invalidDate: 'Ungültiges Datum',
  minLengthNotRespected: 'Mindestlänge von {{minLength}} Zeichen nicht eingehalten',
  nameDuplicate: 'Name ist doppelt vorhanden',
  nameCannotBeKeyword: `Name „{{value}}“ kann nicht verwendet werden: reserviertes Wort`,
  nameInvalid:
    'Name „{{name}}“ ist ungültig: Er darf höchstens 40 Zeichen lang sein, muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Ziffern, „-“ und „_“ enthalten',
  nameRequired: 'Name ist erforderlich',
  requiredField: '{{field}} ist erforderlich',
  rowsDuplicate: 'Zeile {{row}} ist ein Duplikat von Zeile {{duplicateRow}}',

  aggregateFunction: {
    expressionFunctionNotAllowed: `Funktion „{{name}}“ ist nicht zulässig`,
    expressionInvalid: `„{{text}}“ ist im Ausdruck nicht zulässig`,
    expressionRequired: 'Ausdruck ist erforderlich',
    expressionUnbalancedParentheses: 'Unausgeglichene Klammern',
    expressionUnknownColumn: `„{{name}}“ ist keine Spalte der Entität`,
    expressionUnterminatedQuote: 'Nicht abgeschlossenes Anführungszeichen',
  },

  analysis: {
    labelDefaultLangRequired: 'Bezeichnung in der Standardsprache der Erhebung ist erforderlich',
    analysisNodeDefsRequired: 'Mindestens ein berechnetes Attribut ist erforderlich',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Mindestens ein ungültiges Unterelement',
    codeCannotBeKeyword: `Code „{{value}}“ kann nicht verwendet werden: reserviertes Wort`,
    codeDuplicate: 'Code ist doppelt vorhanden',
    codeRequired: 'Code ist erforderlich',
    itemExtraPropDataTypeRequired: 'Datentyp für $t(extraProp.label) „{{key}}“ erforderlich',
    itemExtraPropNameInvalid: 'Ungültiger Name für $t(extraProp.label) „{{key}}“',
    itemExtraPropInvalidNumber: 'Ungültige Zahl für $t(extraProp.label) „{{key}}“',
    itemExtraPropInvalidGeometryPoint: 'Ungültiger Geometriepunkt für $t(extraProp.label) „{{key}}“',
    itemsInvalid: 'Mindestens ein ungültiges Element',
    itemsEmpty: 'Definieren Sie mindestens ein Element',
    levelDuplicate: 'Ebenenname ist doppelt vorhanden',
    levelsInvalid: 'Mindestens eine ungültige Ebene',
    nameNotSpecified: 'Kategoriename nicht angegeben',
  },

  category: {
    samplingPointDataCategoryAlreadyExists:
      'In dieser Erhebung ist bereits eine Kategorie für Stichprobenpunktdaten vorhanden; es kann nur eine geben.',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Veröffentlichte Kategorieelemente können nicht gelöscht werden. In der Importdatei fehlende Elemente: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Ebenen einer veröffentlichten Kategorie können nicht gelöscht werden. In der Importdatei fehlende Ebenen: {{deletedLevelNames}}',
    codeColumnMissing: 'Mindestens eine Spalte „code“ ist erforderlich',
    codeRequired: '{{columnName}}: Code ist erforderlich',
    codeDuplicate: '{{columnName}}: doppelter Code „{{code}}“',
    columnMissing: 'Fehlende Spalte: {{columnNameMissing}}',
    emptyHeaderFound: 'Die Datei enthält eine leere Spaltenüberschrift',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'Die ZIP-Datei darf nur .csv- oder .xlsx-Dateien enthalten (eine je Kategorie) und keine Verzeichnisse',
    invalidParentItemOrder: 'Element mit den Codes {{parentItemCodes}} muss vor seinen Unterelementen stehen',
    nameDuplicate: 'Eine Kategorie mit demselben Namen ist bereits vorhanden: {{name}}',
    srsNotDefined: 'Räumliches Bezugssystem mit Code {{srs}} ist in der Erhebung nicht definiert',
    uuidDuplicate:
      'Diese Kategorie wurde bereits in diese Erhebung geklont (aktueller Name: „{{name}}“) und kann nicht erneut geklont werden.',
  },

  dataImport: {
    emptyFile: 'Die zu importierende Datei ist leer',
    emptyFileName: 'Leerer Dateiname in Spalte {{headers}}',
    invalidHeaders: 'Ungültige Spalten: {{invalidHeaders}}',
    invalidBoolean: 'Ungültiger boolescher Wert in Spalte {{headers}}: {{value}}',
    invalidCode: `Ungültiger Code für Attribut „{{attributeName}}“: {{code}}`,
    invalidCoordinate: 'Ungültige Koordinate in Spalte {{headers}}: {{value}}',
    invalidDate:
      'Ungültiges Datum in Spalte {{headers}}: {{value}}. Datumswerte müssen als JJJJ-MM-TT oder TT/MM/JJJJ formatiert sein, z. B. 2023-01-15 oder 15/01/2023',
    invalidNumber: 'Ungültige Zahl in Spalte {{headers}}: {{value}}',
    invalidTaxonCode: 'Ungültiger Code in Spalte {{headers}}: {{value}}',
    invalidTime:
      'Ungültige Uhrzeit in Spalte {{headers}}: {{value}}. Uhrzeiten müssen als HH:mm oder HH:mm:ss formatiert sein, z. B. 09:45, 16:30 oder 09:45:30',
    missingRequiredHeaders: 'Fehlende erforderliche Spalten: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Fehler beim Aktualisieren der Werte: {{details}}',
    multipleRecordsMatchingKeys: 'Mehrere Datensätze mit den Schlüsseln „{{keyValues}}“ gefunden',
    recordAlreadyExisting: 'Datensatz mit den Schlüsseln „{{keyValues}}“ ist bereits vorhanden',
    recordInAnalysisStepCannotBeUpdated:
      'Datensatz mit den Schlüsseln „{{keyValues}}“ befindet sich im Analyseschritt und kann nicht aktualisiert werden',
    recordKeyMissingOrInvalid: 'Fehlender oder ungültiger Wert für Schlüsselattribut „{{keyName}}“',
    recordNotEditable:
      'Datensatz mit den Schlüsseln „{{keyValues}}“ kann nicht aktualisiert werden: Sie dürfen ihn nicht bearbeiten',
    recordNotFound: 'Datensatz mit den Schlüsseln „{{keyValues}}“ nicht gefunden',
  },

  expressions: {
    cannotGetChildOfAttribute: 'Unterknoten {{childName}} des Attributs {{parentName}} kann nicht abgerufen werden',
    cannotUseCurrentNode: 'Aktueller Knoten {{name}} kann in diesem Ausdruck nicht verwendet werden',
    circularDependencyError: 'Knoten {{name}} kann nicht referenziert werden, da er auf den aktuellen Knoten verweist',
    expressionInvalid: 'Ungültiger Ausdruck: {{details}}',
    unableToFindNode: 'Knoten nicht gefunden: {{name}}',
    unableToFindNodeChild: 'Unterknoten nicht gefunden: {{name}}',
    unableToFindNodeParent: 'Übergeordneter Knoten nicht gefunden: {{name}}',
    unableToFindNodeSibling: 'Geschwisterknoten nicht gefunden: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Ungültiger Name',
    nameRequired: 'Name erforderlich',
    dataTypeRequired: 'Datentyp erforderlich',
    valueRequired: 'Wert erforderlich',
  },

  message: {
    bodyRequired: 'Nachrichtentext ist erforderlich',
    subjectRequired: 'Betreff ist erforderlich',
    notificationTypeRequired: 'Benachrichtigungsart ist erforderlich',
    targetsRequired: 'Mindestens ein Ziel ist erforderlich',
  },
  nodeValueParser: {
    attributeNotEditable: '„{{attributeName}}“ kann nicht bearbeitet werden (schreibgeschützt oder berechnet).',
    unsupportedType: '„{{attributeName}}“: Werte vom Typ {{type}} können hier nicht gesetzt werden.',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'Entität ist erforderlich',
    applyIfDuplicate: 'Bedingung „$t(nodeDefEdit:expressionsProp.applyIf)“ ist doppelt vorhanden',
    applyIfInvalid: 'Ungültige Bedingung „$t(nodeDefEdit:advancedProps.relevantIf)“',
    columnWidthCannotBeGreaterThan: 'Spaltenbreite darf nicht größer als {{max}} sein',
    columnWidthCannotBeLessThan: 'Spaltenbreite darf nicht kleiner als {{min}} sein',
    countMaxMustBePositiveNumber: 'Höchstanzahl muss eine positive Ganzzahl sein',
    countMinMustBePositiveNumber: 'Mindestanzahl muss eine positive Ganzzahl sein',
    categoryRequired: 'Kategorie ist erforderlich',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: 'Ungültige Standardwerte',
    defaultValuesNotSpecified: 'Standardwert nicht angegeben',
    entitySourceRequired: 'Entitätsquelle erforderlich',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Nur der letzte Ausdruck darf eine leere Bedingung „$t(nodeDefEdit:expressionsProp.applyIf)“ besitzen',
    expressionDuplicate: 'Ausdruck ist doppelt vorhanden',
    expressionRequired: 'Ausdruck ist erforderlich',
    formulaInvalid: 'Formel ist ungültig',
    keysEmpty: 'Definieren Sie mindestens ein Schlüsselattribut',

    keysExceedingMax: 'Maximale Anzahl von Schlüsselattributen überschritten',
    mapMarkerColorInvalid: 'Farbe der Kartenmarkierung muss ein Farbcode wie #ff0000 sein',
    maxFileSizeInvalid: 'Maximale Dateigröße muss größer als 0 und kleiner als {{max}} sein',
    nameInvalid:
      'Name ist ungültig (muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Ziffern und Unterstriche enthalten)',
    taxonomyRequired: 'Taxonomie ist erforderlich',
    validationsInvalid: 'Ungültige Validierungen',
    countMaxInvalid: 'Ungültige Höchstanzahl',
    countMinInvalid: 'Ungültige Mindestanzahl',
    readOnlyCannotHaveEditableIf: 'Ein schreibgeschützter Knoten darf keine Bearbeitbarkeitsbedingung besitzen',
    requiredIfInvalid: 'Ungültige Bedingung „Erforderlich, wenn“',
    requiredIfNotAllowed:
      '„Erforderlich, wenn“ ist nur für Nicht-Schlüsselattribute zulässig, die weder mehrfach noch immer erforderlich sind',
    qualifierCannotHaveApplicableExpression:
      'Ein Qualifikatorattribut darf keine Bedingung „$t(nodeDefEdit:advancedProps.relevantIf)“ besitzen',
    qualifierCannotHaveEditabilityRule:
      'Für ein Qualifikatorattribut dürfen keine Bearbeitbarkeitsregeln definiert sein',
    qualifierCannotHaveDefaultValues: 'Ein Qualifikatorattribut darf keine Standardwerte besitzen',
    qualifierCannotHaveValidations: 'Für ein Qualifikatorattribut dürfen keine Validierungsregeln definiert sein',
  },

  record: {
    keyDuplicate: 'Datensatzschlüssel ist doppelt vorhanden',
    entityKeyDuplicate: 'Schlüssel ist doppelt vorhanden',
    entityKeyValueNotSpecified: 'Schlüsselwert für „{{keyDefName}}“ wurde nicht angegeben',
    missingAncestorForEntity: '„{{ancestorName}}“ mit diesen Schlüsseln wurde nicht gefunden: {{keyValues}}',
    oneOrMoreInvalidValues: 'Mindestens ein Wert ist ungültig',
    uniqueAttributeDuplicate: 'Wert ist doppelt vorhanden',
    valueInvalid: 'Ungültiger Wert',
    valueRequired: 'Wert erforderlich',
  },

  recordClone: {
    differentKeyAttributes: 'Die Schlüsselattribute unterscheiden sich in Zyklus {{cycleFrom}} und Zyklus {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'Sprache ist erforderlich',
    langInvalid: 'Ungültiger Sprachcode: {{lang}}',
    srsInvalid: 'Ungültiger Code des räumlichen Bezugssystems: {{code}}',
    srsRequired: 'Räumliches Bezugssystem ist erforderlich',
    cycleRequired: 'Zyklus ist erforderlich',
    cyclesRequired: 'Mindestens ein Zyklus muss definiert sein',
    cyclesExceedingMax: 'Eine Erhebung darf höchstens 10 Zyklen besitzen',
    cycleKeysInvalid: 'Zyklen müssen ab 1 fortlaufend nummeriert sein',
    cycleDateStartBeforeDateEnd: 'Das Startdatum des Zyklus muss vor dessen Enddatum liegen',
    cycleDateStartAfterPrevDateEnd: 'Das Startdatum des Zyklus muss nach dem Enddatum des vorherigen Zyklus liegen',
    cycleDateStartInvalid: 'Das Startdatum des Zyklus ist ungültig',
    cycleDateStartMandatory: 'Das Startdatum des Zyklus ist erforderlich',
    cycleDateEndInvalid: 'Das Enddatum des Zyklus ist ungültig',
    cycleDateEndMandatoryExceptForLastCycle: 'Das Enddatum ist für alle Zyklen außer dem letzten erforderlich',
    fieldManualLinksInvalid: 'Der Link zum Feldhandbuch ist ungültig',
    areaOfInterestInvalid: 'Das Interessengebiet muss ein Polygon im GeoJSON-Format mit WGS84-Koordinaten sein',
  },

  surveyAreaOfInterest: {
    fileRequired: 'Datei ist erforderlich',
    nameDuplicate: 'Ein anderes Interessengebiet mit demselben Namen ist bereits vorhanden',
    nameRequired: 'Name ist erforderlich',
  },

  surveyPreloadedMapLayer: {
    fileRequired: 'Datei ist erforderlich',
    fileNameDuplicate: 'Eine andere Datei mit demselben Namen ist bereits vorhanden',
    labelsRequired: 'Mindestens eine Bezeichnung ist erforderlich',
  },

  surveyDocImage: {
    documentPlaceRequired: 'Dokumentposition ist erforderlich',
    fileRequired: 'Datei ist erforderlich',
    fileNameDuplicate: 'Eine andere Datei mit demselben Namen ist bereits vorhanden',
    labelsRequired: 'Mindestens eine Bezeichnung ist erforderlich',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Ungültige Spalten: {{invalidHeaders}}',
    cannotFindNodeDef: 'Attribut- oder Entitätsdefinition mit dem Namen „{{name}}“ wurde nicht gefunden',
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: 'Veröffentlichter Code wurde geändert: „{{oldCode}}“ => „{{newCode}}“',
    codeDuplicate: 'Code {{value}} ist doppelt vorhanden; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Code ist erforderlich',
    familyRequired: 'Familie ist erforderlich',
    genusRequired: 'Gattung ist erforderlich',
    scientificNameDuplicate:
      'Wissenschaftlicher Name {{value}} ist doppelt vorhanden; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Wissenschaftlicher Name ist erforderlich',
    taxaEmpty: 'Keine Taxa vorhanden',
    vernacularNamesDuplicate: 'Trivialname „{{name}}“ ist für die Sprache „{{lang}}“ doppelt vorhanden',
  },

  taxonomyImport: {
    nameDuplicate: 'Eine Taxonomie mit demselben Namen ist bereits vorhanden: {{name}}',
    uuidDuplicate:
      'Diese Taxonomie wurde bereits in diese Erhebung geklont (aktueller Name: „{{name}}“). Sie kann nicht erneut geklont werden.',
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Doppelte Spalten für Zusatzeigenschaften: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Ungültiger Name der Zusatzeigenschaftsspalte „{{columnName}}“: Reservierte Wörter sind nicht zulässig',
    missingRequiredColumns: 'Erforderliche Spalte(n) fehlen: {{columns}}',
    reservedScientificName:
      'Der wissenschaftliche Name „{{scientificName}}“ ist reserviert und kann nicht verwendet werden; er wird automatisch in die Taxonomie eingefügt.',
  },

  user: {
    emailDuplicate: 'Ein Benutzer mit derselben E-Mail-Adresse ist bereits vorhanden',
    emailRequired: 'E-Mail-Adresse ist erforderlich',
    emailInvalid: 'E-Mail-Adresse ist ungültig',
    emailNotFound: 'E-Mail-Adresse wurde nicht gefunden',
    groupRequired: 'Gruppe ist erforderlich',
    nameRequired: 'Name ist erforderlich',
    titleRequired: 'Titel ist erforderlich',
    passwordRequired: 'Passwort ist erforderlich',
    passwordInvalid: 'Das Passwort darf keine Leerzeichen enthalten',
    passwordUnsafe:
      'Das Passwort muss mindestens 8 Zeichen lang sein und Kleinbuchstaben, Großbuchstaben und Ziffern enthalten',
    passwordsDoNotMatch: 'Passwörter stimmen nicht überein',

    userNotFound: 'Benutzer nicht gefunden. Prüfen Sie E-Mail-Adresse und Passwort',
    passwordChangeRequired: 'Passwortänderung erforderlich',
    passwordResetNotAllowedWithPendingInvitation:
      'Das Passwort kann nicht zurückgesetzt werden: Der Benutzer wurde zu einer Erhebung eingeladen, hat die Einladung aber noch nicht angenommen',
    twoFactorTokenRequired: 'Bestätigungscode ist erforderlich',
  },

  userAccessRequest: {
    countryRequired: 'Land ist erforderlich',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'Vorname ist erforderlich',
    institutionRequired: 'Institution ist erforderlich',
    lastNameRequired: 'Nachname ist erforderlich',
    purposeRequired: 'Verwendungszweck ist erforderlich',
    surveyNameRequired: 'Name der Erhebung ist erforderlich',
    invalidRequest: 'Ungültige Benutzerzugriffsanfrage',
    userAlreadyExisting: 'Ein Benutzer mit der E-Mail-Adresse {{email}} ist bereits vorhanden',
    requestAlreadySent: 'Die Zugriffsanfrage für den Benutzer mit der E-Mail-Adresse {{email}} wurde bereits gesendet',
    emailNotReachable: 'Die Bestätigungs-E-Mail konnte nicht an {{email}} zugestellt werden; prüfen Sie die Adresse',
    invalidReCaptcha: 'Ungültiges reCAPTCHA',
    surveyNameAlreadyUsed:
      'Eine Erhebung mit dem Namen {{surveyName}} existiert bereits: Bitte schlagen Sie einen anderen Erhebungsnamen vor',
    registrationNotAvailable: 'Die Registrierung ist derzeit nicht verfügbar; bitte versuchen Sie es später erneut',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Benutzerzugriffsanfrage wurde bereits bearbeitet',
    accessRequestNotFound: 'Benutzerzugriffsanfrage wurde nicht gefunden',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Rolle ist erforderlich',
    surveyNameRequired: 'Name der Erhebung ist erforderlich',
  },

  userGroupEdit: {
    nameDuplicate: 'Eine Gruppe mit demselben Namen ist bereits vorhanden: {{name}}',
    qualifiersInvalid: 'Mindestens ein Qualifikator besitzt einen ungültigen oder doppelten Schlüssel',
    qualifierNameDuplicate: 'Ein Qualifikator mit demselben Namen ist in dieser Gruppe bereits vorhanden: {{name}}',
    qualifierNameInvalid: 'Ungültiger Qualifikatorname',
    qualifierNameRequired: 'Qualifikatorname ist erforderlich',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Altes Passwort ist erforderlich',
    oldPasswordWrong: 'Altes Passwort ist falsch',
    newPasswordRequired: 'Neues Passwort ist erforderlich',
    confirmPasswordRequired: 'Passwortbestätigung ist erforderlich',
    confirmedPasswordNotMatching: 'Neues Passwort und Passwortbestätigung stimmen nicht überein',
  },

  userInvite: {
    messageContainsLinks: 'Die Einladungsnachricht darf keine Links enthalten',
    messageTooLong: 'Die Einladungsnachricht ist zu lang (höchstens {{maxLength}} Zeichen)',
  },

  user2FADevice: {
    nameDuplicate: 'Ein Gerät mit demselben Namen ist bereits vorhanden',
    nameRequired: 'Gerätename ist erforderlich',
  },
}
