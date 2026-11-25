export default {
  additionalFields: 'Zusätzliche Felder',
  basic: 'Allgemein',
  advanced: 'Erweitert',
  mobileApp: 'Mobile-App',
  print: 'Drucken',
  printProps: {
    printOrientation: {
      label: 'Seitenausrichtung',
      info: 'Ausrichtung, wenn diese Entität einen eigenen druckbaren Abschnitt beginnt. „Standard“ übernimmt die beim Export gewählte Dokumentausrichtung.',
    },
    orientations: {
      default: 'Standard (Dokument)',
      portrait: 'Hochformat',
      landscape: 'Querformat',
    },
  },
  validations: 'Validierungen',
  function: 'Funktion',
  editingFunction: 'Funktion {{functionName}} bearbeiten',
  editorHelp: {
    json: 'Gültige Ausdrücke bilden eine Teilmenge von JavaScript.',
    sql: 'Nur gültige SQL-Ausdrücke sind zulässig.',
  },
  editorCompletionHelp: '- Verfügbare Variablen und Funktionen anzeigen',
  editorTextSearchHelp:
    "Textwerte mit text_attr.includes('abc'), text_attr.startsWith('abc') oder text_attr.endsWith('abc') durchsuchen; zum Ignorieren der Groß-/Kleinschreibung vorher .toLowerCase() ergänzen, z. B. text_attr.toLowerCase().includes('abc')",
  functionDescriptions: {
    appId:
      'Gibt die Kennung der App zurück, die den Datensatz bearbeitet: "arena" (Arena) oder "am" (Arena Mobile). $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appIdLabel:
      'Gibt den Namen der App zurück, die den Datensatz bearbeitet: "Arena" oder "Arena Mobile". $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appInfoNote:
      'Wird beim Erstellen des Datensatzes ausgewertet und erneut, wenn er mit einer anderen App, Plattform oder App-Version bearbeitet wird',
    appPlatform:
      'Gibt die Plattform der App zurück, die den Datensatz bearbeitet: "web", "android" oder "ios". $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appVersion:
      'Gibt die Version der App zurück, die den Datensatz bearbeitet. $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    categoryItemProp:
      'Gibt den Wert der angegebenen $t(extraProp.label) eines Kategorieelements mit dem angegebenen Code zurück',
    dateTimeDiff: 'Gibt die Differenz (in Minuten) zwischen zwei Datum-Uhrzeit-Paaren zurück',
    distance: 'Gibt den Abstand (in Metern) zwischen den angegebenen Koordinaten zurück',
    first: 'Gibt den ersten Wert oder Knoten des angegebenen Mehrfachattributs bzw. der Entität zurück',
    geoCoordinateAtDistance:
      'Gibt die Koordinaten in der angegebenen Entfernung und Peilung von den Ausgangskoordinaten zurück',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoAOIContaining:
      'Gibt den Namen des ersten Interessengebiets der Erhebung zurück, das die Koordinate enthält (Reihenfolge unter Erhebungsinformationen → Karte), oder nichts, wenn kein Gebiet sie enthält',
    geoDistanceToAOIBoundary:
      'Gibt den Abstand (in Metern) zwischen einer Koordinate und der Grenze des angegebenen Interessengebiets zurück: negativ innerhalb, positiv außerhalb',
    geoPolygon: 'Erzeugt aus einer Koordinatenliste ein GeoJSON-Polygon',
    includes: 'Gibt true zurück, wenn das angegebene Mehrfachattribut den angegebenen Wert enthält.',
    index: 'Gibt den Index des angegebenen Knotens unter seinen Geschwisterknoten zurück',
    isEmpty: 'Gibt true zurück, wenn für das Argument kein Wert angegeben ist',
    isNotEmpty: 'Gibt true zurück, wenn für das Argument ein Wert angegeben ist',
    last: 'Gibt den letzten Wert oder Knoten des angegebenen Mehrfachattributs bzw. der Entität zurück',
    ln: 'Gibt den natürlichen Logarithmus von X zurück',
    log10: 'Gibt den Logarithmus von X zur Basis 10 zurück',
    max: 'Gibt das Maximum der Argumente zurück',
    min: 'Gibt das Minimum der Argumente zurück',
    nodeDateCreated:
      'Gibt Datum und Uhrzeit der Erstellung des angegebenen Knotens (Attribut oder Entität) als Datum-Uhrzeit-Wert zurück, z. B. nodeDateCreated(parent(this))',
    nodeDateModified:
      'Gibt Datum und Uhrzeit der letzten Änderung des angegebenen Knotens als Datum-Uhrzeit-Wert zurück; bei einer Entität den Zeitpunkt der letzten Änderung der Entität oder eines ihrer Nachkommen, z. B. nodeDateModified(parent(this))',
    now: 'Gibt das aktuelle Datum bzw. die aktuelle Uhrzeit zurück',
    parent: 'Gibt die übergeordnete Entität des angegebenen Knotens zurück',
    pow: 'Gibt den Wert einer potenzierten Basis zurück',
    prevCycleNote:
      'Funktioniert nur in Arena Mobile, wenn mehrere Zyklen definiert sind und der Link zum vorherigen Zyklus aktiviert ist',
    prevCycleValue:
      'Gibt den Wert desselben Attributs im Datensatz des vorherigen Zyklus zurück. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Gibt die Werte derselben Attribute im Datensatz des vorherigen Zyklus zurück. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Gibt den Zyklus des aktuellen Datensatzes zurück',
    recordDateCreated:
      'Gibt Erstellungsdatum und -uhrzeit des aktuellen Datensatzes als datetime-Wert zurück. Kann in Text-, Datums- oder Uhrzeitattributen verwendet werden',
    recordDateLastModified:
      'Gibt Datum und Uhrzeit der letzten Änderung des aktuellen Datensatzes als datetime-Wert zurück. Kann in Text-, Datums- oder Uhrzeitattributen verwendet werden',
    recordOwnerEmail: 'Gibt die E-Mail-Adresse des Datensatzeigentümers zurück',
    recordOwnerName: 'Gibt den Namen des Datensatzeigentümers zurück',
    recordOwnerRole: 'Gibt die Rolle des Datensatzeigentümers in der aktuellen Erhebung zurück',
    rowIndex: 'Gibt den aktuellen Index der Tabellenzeile bzw. des Formulars zurück',
    taxonProp: 'Gibt den Wert der angegebenen $t(extraProp.label) eines Taxons mit dem angegebenen Code zurück',
    taxonVernacularName:
      'Gibt den ersten Trivial- bzw. lokalen Namen in der angegebenen Sprache eines Taxons mit dem angegebenen Code zurück',
    unique: 'Gibt die eindeutigen Werte eines Mehrfachattributs oder einer Entität zurück',
    userEmail: 'Gibt die E-Mail-Adresse des angemeldeten Benutzers zurück',
    userIsRecordOwner:
      'Gibt den booleschen Wert true zurück, wenn der bearbeitende Benutzer auch Eigentümer des Datensatzes ist, andernfalls false',
    userName: 'Gibt den Namen des angemeldeten Benutzers zurück',
    userProp: 'Gibt den Wert der angegebenen $t(extraProp.label) des angemeldeten Benutzers zurück',
    uuid: 'Erzeugt eine UUID (universell eindeutige Kennung), die als Kennung verwendet werden kann (z. B. als Schlüsselattribut einer Entität)',
    // SQL functions
    avg: 'Gibt den Mittelwert einer numerischen Variablen zurück',
    count: 'Gibt die Anzahl der Zeilen zurück, die einem Kriterium entsprechen',
    sum: 'Gibt die Gesamtsumme einer numerischen Variablen zurück',
  },
  functionName: {
    rowIndex: 'Zeilenindex',
  },
  basicProps: {
    analysis: 'Analyse',
    autoIncrementalKey: {
      label: 'Automatisch fortlaufend',
      info: 'Der Wert wird automatisch erzeugt',
    },
    autoCreateMinCountItems: {
      label: 'Mindestanzahl automatisch erstellen',
      info: 'Wenn die Entität relevant wird oder ihre übergeordnete Entität erstellt wird, wird automatisch die Mindestanzahl an Entitäten erzeugt.',
    },
    displayAs: 'Anzeigen als',
    displayIn: 'Anzeigen in',
    entitySource: 'Entitätsquelle',
    enumerate: {
      label: 'Aufzählen',
      info: `Die Zeilen werden automatisch anhand der Kategorieelemente erzeugt, die einem innerhalb der Entität als Schlüssel markierten Codeattribut zugeordnet sind. Zeilen können nicht hinzugefügt oder gelöscht werden und das Schlüssel-Codeattribut ist nicht bearbeitbar.`,
    },
    enumeratingItemsExpression: {
      label: 'Ausdruck für aufzuzählende Elemente',
      info: 'Optionaler Ausdruck zum Filtern der aufzuzählenden Kategorieelemente (z. B. unique(table_source.source_type)). Ist er leer, werden alle Kategorieelemente verwendet.',
    },
    enumerator: {
      label: 'Aufzähler',
      info: 'Die Kategorieelemente werden zum Erzeugen der Zeilen der übergeordneten Entität verwendet',
    },
    form: 'Formular',
    formula: 'Formel',
    includedInClonedData: 'In geklonten Daten enthalten',
    includedInMultipleEntitySummary: {
      label: 'In Zusammenfassung der Mehrfachentität einbeziehen',
      info: `Wenn aktiviert, ist der Attributwert in der Entitätsauswahl (Arena) und in der Entitätszusammenfassung (Arena Mobile) sichtbar`,
    },
    includedInRecordsList: {
      label: 'In Datensatzliste einbeziehen',
      info: `Wenn aktiviert, ist das Attribut in der Datensatzliste sichtbar`,
    },
    key: 'Schlüssel',
    maxKeysCountReached: 'Maximale Anzahl von Schlüsseln erreicht ({{maxKeysCount}})',
    multiple: 'Mehrfach',
    ownPage: 'Eigene Seite',
    parentPage: 'Übergeordnete Seite ({{parentPage}})',
    qualifier: {
      label: 'Qualifikator',
      info: `Wenn ein Benutzer, der einer Gruppe angehört, einen neuen Datensatz erstellt, wird dieses Attribut automatisch mit dem in den Qualifikatoren seiner Gruppe festgelegten Wert ausgefüllt. Benutzer können nur Datensätze ihrer eigenen Gruppe anzeigen und bearbeiten, sofern sie einer Gruppe angehören.`,
    },
    table: 'Tabelle',
  },
  advancedProps: {
    areaBasedEstimate: 'Flächenbasierte Schätzung',
    defaultValues: 'Standardwerte',
    defaultValuesInfo: `Hiermit kann eine Antwort anhand bestimmter Regeln automatisch ausgefüllt werden.
Bei mehreren Regeln prüft das System sie von oben nach unten.
Die erste Regel, deren Bedingungen erfüllt sind, wird als Antwort verwendet.`,
    defaultValueEvaluatedOneTime: 'Standardwert nur einmal auswerten',
    defaultValueEvaluatedOneTimeInfo: `Der Standardwert wird nur einmal beim Erstellen des Attributs ausgewertet.
Wenn die Option nicht aktiviert ist, wird er bei jeder Aktualisierung des Datensatzes erneut ausgewertet.
Sie sollte bei Ausdrücken wie now() oder uuid() aktiviert werden, die nur beim erstmaligen Erzeugen des Attributwerts ausgewertet werden sollen.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Standardwerte sind wegen des automatisch fortlaufenden Schlüssels nicht bearbeitbar',
    defaultValuesNotSpecified: 'Keine Standardwerte angegeben',
    defaultValuesSpecified: 'Standardwerte angegeben',
    editableIf: 'Bearbeitbarkeit',
    editableIfInfo: `Standardmäßig kann ein Benutzer immer auf ein relevantes Feld zugreifen.
Hier lässt sich festlegen, ob ein Benutzer dieses Feld ausfüllen oder ändern darf.
Sind die Bedingungen erfüllt, ist das Feld bearbeitbar; andernfalls ist es schreibgeschützt.`,
    editableAlways: 'Immer bearbeitbar',
    editableIfConditionIsMet: 'Bearbeitbar, wenn Bedingung erfüllt ist',
    hidden: 'Immer ausgeblendet',
    hiddenInReport: 'Im Analyse-Dashboard ausgeblendet',
    hiddenInReportInfo: `Wenn aktiviert, ist das Attribut im Analyse-Dashboard nicht sichtbar`,
    hiddenWhenNotRelevant: 'Ausblenden, wenn nicht relevant',
    itemsFilter: 'Elementfilter',
    itemsFilterInfo: `Ausdruck zum Filtern auswählbarer Elemente.
Im Ausdruck bezeichnet „this“ das Element selbst.
Beispiel: this.region = region_attribute_name
(„region“ ist eine für das Element definierte zusätzliche Eigenschaft und region_attribute_name der Name eines Erhebungsattributs)`,
    readOnly: 'Schreibgeschützt',
    relevantIf: 'Relevanz',
    relevantIfInfo: `Standardmäßig sind alle Felder immer aktiv.
Ist eine Relevanzregel nicht erfüllt, wird das Feld ausgegraut oder vollständig ausgeblendet;
automatische Antworten werden ignoriert.
Damit können Teile der Erhebung dynamisch angezeigt oder ausgeblendet werden, etwa ein Feld „Bitte angeben“, wenn zuvor „Sonstiges“ gewählt wurde.`,
    relevantIfRadioNone: 'Immer relevant',
    relevantIfRadioDefined: 'Relevant, wenn Bedingung erfüllt ist',
    script: 'Skript',
    visibleIf: 'Sichtbarkeit',
    visibleIfInfo: `Standardmäßig ist ein Feld immer sichtbar.
Bei einer Regel ist es nur sichtbar, wenn diese erfüllt ist; andernfalls wird es ausgeblendet.
Anders als ein inaktives (nicht relevantes) Feld kann ein ausgeblendetes Feld weiterhin einen automatisch gespeicherten Wert besitzen.
Damit lassen sich ganze Bereiche abhängig vom angemeldeten Benutzer, etwa seiner Rolle, ausblenden.`,
    visibleAlways: 'Immer sichtbar',
    visibleIfConditionIsMet: 'Sichtbar, wenn Bedingung erfüllt ist',
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'In Arena Mobile ausgeblendet',
      info: `Wenn aktiviert, ist das Attribut in Arena Mobile nicht sichtbar`,
    },
    includedInPreviousCycleLink: {
      label: 'In Link zum vorherigen Zyklus einbeziehen',
      info: `Wenn aktiviert, wird der Wert aus dem vorherigen Zyklus im Datenerfassungsformular angezeigt, sofern der Link zum vorherigen Zyklus in der mobilen App aktiv ist`,
    },
  },
  numericProps: {
    unit: 'Einheit',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Maximale Anzahl Dezimalstellen',
  },
  fileProps: {
    fileNameExpression: 'Ausdruck für den Dateinamen',
    fileType: 'Dateityp',
    fileTypes: {
      image: 'Bild',
      video: 'Video',
      audio: 'Audio',
      other: 'Sonstiges',
    },
    maxFileSize: 'Maximale Dateigröße (MB)',
    numberOfFiles: 'Unter Validierungen kann die minimale und maximale Dateianzahl geändert werden.',
    showGeotagInformation: 'Geotag-Informationen anzeigen',
    allowScreenCaptureInMap: 'Speichern von Bildschirmfotos in der Kartenansicht erlauben',
  },
  mobileProps: {
    title: 'Mobile-App',
  },
  timeProps: {
    includeSeconds: 'Sekunden einbeziehen',
  },
  geoProps: {
    positionTracking: 'Positionsverfolgung',
    positionTrackingInfo: `Gilt nur für Arena Mobile: Wenn aktiviert, entspricht der Wert dem während der Datenerfassung zurückgelegten Weg, der durch Verfolgung der Geräteposition aufgezeichnet wird, und kann nicht manuell bearbeitet werden`,
  },
  formHeaderProps: {
    headerColorLabel: 'Farbe der Überschrift',
    headerColor: {
      blue: 'Blau',
      green: 'Grün',
      orange: 'Orange',
      red: 'Rot',
      yellow: 'Gelb',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hyperlink',
      markdown: 'Markdown',
      text: 'Text',
    },
    textInputType: 'Texteingabetyp',
    textInputTypes: {
      singleLine: 'Einzeilig',
      multiLine: 'Mehrzeilig',
    },
    textTransform: 'Textumwandlung',
    textTransformTypes: {
      none: 'keine',
      capitalize: 'Wortanfänge groß',
      uppercase: 'Großbuchstaben',
      lowercase: 'Kleinbuchstaben',
    },
  },
  booleanProps: {
    labelValue: 'Bezeichnungswert',
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Kategorie',
    codeShown: 'Code anzeigen',
    displayAsTypes: {
      checkbox: 'Kontrollkästchen',
      dropdown: 'Auswahlliste',
    },
    parentCode: 'Übergeordneter Code',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: 'Nur Gerätekoordinate zulassen',
    allowOnlyDeviceCoordinateInfo: `Gilt nur für Arena Mobile: Wenn aktiviert, kann der Benutzer die X-/Y-Werte nicht ändern; sie können nur über das Geräte-GPS ermittelt werden`,
    mapMarkerColor: 'Farbe der Kartenmarkierung',
  },
  expressionsProp: {
    expression: 'Ausdruck',
    applyIf: 'Anwenden, wenn',
    confirmDelete: 'Diesen Ausdruck löschen?',
    severity: 'Schweregrad',
  },
  validationsProps: {
    minCount: 'Mindestanzahl',
    maxCount: 'Höchstanzahl',
    expressions: 'Validierungsausdrücke',
    attributeAlwaysValid: 'Attribut immer gültig',
    attributeValidWhenConditionIsMet: 'Attribut gültig, wenn Bedingung erfüllt ist',
    notRequired: 'Nicht erforderlich',
    alwaysRequired: 'Immer erforderlich',
    requiredWhenConditionIsMet: 'Erforderlich, wenn Bedingung erfüllt ist',
  },
  cannotChangeIntoMultipleWithDefaultValues:
    'Dieser Knoten kann nicht in „Mehrfach“ konvertiert werden, da er Standardwerte besitzt.',
  cannotDeleteNodeDefReferenced: `„{{nodeDef}}“ kann nicht gelöscht werden, da folgende Knotendefinitionen darauf verweisen: {{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: 'Klonen',
    title: 'Knotendefinition „{{nodeDefName}}“ klonen',
    entitySelectLabel: 'Zielentität für den Klon:',
  },
  conversion: {
    dialogTitle: '{{nodeDefName}} in einen anderen Typ konvertieren',
    fromType: 'Ausgangstyp',
    toType: 'Zieltyp',
  },
  moveDialog: {
    confirmButtonLabel: 'Verschieben',
    title: 'Knotendefinition „{{nodeDefName}}“ aus „{{parentNodeDefName}}“ verschieben',
    entitySelectLabel: 'Zielentität:',
  },
  movedNodeDefinitionHasErrors: 'Die verschobene Knotendefinition „{{nodeDefName}}“ enthält Fehler. Beheben Sie diese.',
  nodeDefintionsHaveErrors: 'Folgende Knotendefinitionen enthalten Fehler: {{nodeDefNames}}. Beheben Sie diese.',
  filterVariable: 'Variable zum Filtern von Elementen',
  filterVariableForLevel: 'Variable für {{levelName}}',
  unique: {
    label: 'Eindeutig',
    info: `Wenn ein Attribut als **Eindeutig** markiert ist, muss sein Wert innerhalb der nächstgelegenen Mehrfachentität eindeutig sein; andernfalls wird ein Fehler angezeigt.

---

Beispiel: Ist in einer Struktur wie *Cluster -> Probefläche -> Baum* das Attribut *tree_species* als **Eindeutig** markiert, darf es innerhalb derselben *Probefläche* nur einen Baum je Art geben.`,
  },
  nodeDefClonedSuccessfully:
    'Knotendefinition „{{nodeDefName}}“ erfolgreich nach „{{targetParentNodeDefName}}“ geklont',
  categoriesClonedFromSurvey: 'Folgende Kategorien wurden ebenfalls aus der Quellerhebung geklont: {{names}}',
  taxonomiesClonedFromSurvey: 'Folgende Taxonomien wurden ebenfalls aus der Quellerhebung geklont: {{names}}',
}
