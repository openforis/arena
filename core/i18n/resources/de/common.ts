import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Aktiv',
    add: 'Hinzufügen',
    advancedFunctions: 'Erweiterte Funktionen',
    and: 'und',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Anwenden',
    aggregateFunction: 'Aggregatfunktion',
    aggregateFunction_other: 'Aggregatfunktionen',
    attribute: 'Attribut',
    attribute_other: 'Attribute',
    avg: 'Durchschnitt',
    ascending: 'Aufsteigend',
    areaBased: 'flächenbasiert',
    back: 'Zurück',
    baseUnit: 'Basiseinheit',
    cancel: 'Abbrechen',
    cancelConfirm: `**Es gibt nicht gespeicherte Änderungen**.

Möchten Sie sie verwerfen?`,
    cantUndoWarning: 'Dieser Vorgang kann nicht rückgängig gemacht werden',
    cantBeDeletedUsedItem:
      'Dieses Element ({{item}}) wird von Knotendefinitionen verwendet und kann nicht gelöscht werden',
    chain: 'Verarbeitungskette',
    chain_other: 'Verarbeitungsketten',
    childrenEmpty: 'Definieren Sie mindestens ein untergeordnetes Element',
    clear: 'Leeren',
    clone: 'Klonen',
    close: 'Schließen',
    cloneFrom: 'Klonen aus',
    cnt: 'Anzahl',
    code: 'Code',
    collapse: 'Einklappen',
    confirm: 'Bestätigen',
    convert: 'Konvertieren',
    copy: 'Kopieren',
    createdWith: 'Erstellt mit',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Zyklus',
    cycle_other: 'Zyklen',
    dateCreated: 'Erstellt am',
    dateLastModified: 'Zuletzt geändert am',
    delete: 'Löschen',
    deleted: 'Gelöscht!',
    descending: 'Absteigend',
    description: 'Beschreibung',
    description_other: 'Beschreibungen',
    designerNotes: 'Hinweise für Formularersteller',
    designerNotesInfo: 'Diese Hinweise sind nur im Formular-Designer sichtbar, nicht im Dateneingabeformular.',
    details: 'Details',
    dimension: 'Dimension',
    dimension_other: 'Dimensionen',
    done: 'Fertig',
    download: 'Herunterladen',
    draft: 'Entwurf',
    edit: 'Bearbeiten',
    elapsed: 'Verstrichen',
    email: 'E-Mail',
    email_other: 'E-Mails',
    emailSentConfirmation: `Eine E-Mail wurde an {{email}} gesendet.

    Bitten Sie die Person, auch den Spam-Ordner zu prüfen.`,
    logoutServerNotReached:
      'Der Server war nicht erreichbar, daher ist Ihre Sitzung auf dem Server möglicherweise noch aktiv. Schließen Sie den Browser, wenn dies ein gemeinsam genutzter Computer ist.',
    emailSentToSelfConfirmation: `Sie sollten eine E-Mail an {{email}} erhalten haben.

Prüfen Sie auch den Spam-Ordner.`,
    empty: 'Leer',
    entity: 'Entität',
    error: 'Fehler',
    error_other: 'Fehler',
    errorFound: '1 Fehler gefunden',
    errorFound_other: '{{count}} Fehler gefunden',
    errorMessage: 'Fehlermeldung',
    errorMessage_other: 'Fehlermeldungen',
    expand: 'Ausklappen',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Exportieren',
    exportAll: 'Alles exportieren',
    exportToCSV: 'Als CSV exportieren',
    exportToExcel: 'Als Excel exportieren',
    exportToExcelTooManyItems: 'Zu viele Elemente für den Excel-Export; verwenden Sie den CSV-Export.',
    expression: 'Ausdruck',
    false: 'Falsch',
    fetchError: 'Die Daten konnten nicht geladen werden: {{message}}',
    file: 'Datei',
    file_other: 'Dateien',
    formContainsErrors: 'Formular enthält Fehler',
    formContainsErrorsCannotContinue: 'Das Formular enthält Fehler. Beheben Sie diese, bevor Sie fortfahren.',
    formContainsErrorsCannotSave: 'Das Formular enthält Fehler. Beheben Sie diese vor dem Speichern.',
    from: 'Von',
    function: 'Funktion',
    goToHomePage: 'Zur Startseite',
    goToSurveys: 'Zu den Erhebungen',
    group: 'Gruppe',
    help: 'Hilfe',
    hide: 'Ausblenden',
    hideValue: 'Wert ausblenden',
    id: 'id',
    import: 'Import',
    importFromExcelOrCSVFile: 'Aus Excel- (.xlsx) oder CSV-Datei importieren',
    info: 'Info',
    invalid: 'UNGÜLTIG',
    item: 'Element',
    item_other: 'Elemente',
    itemAlreadyAdded: 'Element wurde bereits hinzugefügt',
    label: 'Bezeichnung',
    label_other: 'Bezeichnungen',
    language: 'Sprache',
    language_other: 'Sprachen',
    leavePageConfirmMessage: `Das Formular enthält nicht gespeicherte Änderungen.

Mit der Bestätigung gehen alle Änderungen verloren.
Möchten Sie fortfahren?`,
    local: 'Lokal',
    loading: 'Wird geladen ...',
    lock: 'Sperren',
    showValue: 'Wert anzeigen',
    unlock: 'Entsperren',
    max: 'Maximum',
    med: 'Median',
    manage: 'Verwalten',
    message_other: 'Nachrichten',
    measure: 'Kennzahl',
    measure_other: 'Kennzahlen',
    measurePrevSteps: 'Kennzahl vorheriger Schritte',
    measurePrevSteps_other: 'Kennzahlen vorheriger Schritte',
    min: 'Minimum',
    moveUp: 'Nach oben verschieben',
    moveDown: 'Nach unten verschieben',
    name: 'Name',
    new: 'Neu',
    next: 'Weiter',
    no: 'Nein',
    noItems: `$t(common.no) $t(common.item_other)`,
    notification: 'Benachrichtigung',
    notification_other: 'Benachrichtigungen',
    notSpecified: '---Nicht angegeben---',
    orderBy: 'Sortieren nach',
    of: 'von',
    ok: 'OK',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'In neuem Fenster öffnen',
    options: 'Optionen',
    owner: 'Eigentümer',
    path: 'Pfad',
    pause: 'Pausieren',
    preview: 'Vorschaumodus',
    previous: 'Zurück',
    publish: 'Veröffentlichen',
    publishConfirm: `#### Sie sind dabei, die Erhebung {{survey}} zu veröffentlichen ####

###### Bei der Veröffentlichung werden die folgenden Informationen *dauerhaft gelöscht* ######
- Bezeichnungen gelöschter Sprachen.
- Datensätze gelöschter Zyklen.
- Daten gelöschter Formularfelder.

###### Nach der Veröffentlichung: ######
- Formularfelder können nicht mehr zwischen Einzel- und Mehrfachwert umgestellt werden.
- Codes von Kategorieelementen können nicht geändert werden.
- Kategorieelemente können nicht gelöscht werden.
- Taxonomiecodes können nicht geändert werden.
- Taxa können nicht gelöscht werden.

**Möchten Sie wirklich fortfahren?**`,
    publishRecordValuesUpdateConfirm: `#### Bei der Veröffentlichung von {{survey}} werden vorhandene Daten aktualisiert ####

{{reasons}}

Dieser Vorgang kann bereits eingegebene Daten dauerhaft ändern oder löschen.

Aktivieren Sie unten „Datenaktualisierung überspringen“, um ohne Aktualisierung der vorhandenen Daten zu veröffentlichen (nicht empfohlen).`,
    publishRecordValuesUpdateConfirmHeader: 'Vorhandene Datensatzdaten werden aktualisiert',
    publishRecordValuesUpdateConfirmOk: 'Veröffentlichen und Daten aktualisieren',
    publishRecordValuesUpdateConfirmInputLabel:
      'Geben Sie zur Bestätigung den Erhebungsnamen „{{strongConfirmRequiredText}}“ ein',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Die folgenden Attribute werden geändert und ihre Werte in vorhandenen Datensätzen automatisch neu berechnet: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Die folgenden Attribute verwenden eine geänderte Zusatzeigenschaft einer Kategorie oder Taxonomie. Ihre Werte in vorhandenen Datensätzen werden neu berechnet: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Datenaktualisierung überspringen',
    publishSkipDataUpdateConfirmOk: 'Datenaktualisierung überspringen und veröffentlichen',
    publishSkipDataUpdateImplications: 'Das Überspringen der Datenaktualisierung bedeutet:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Vorhandene Datensätze entsprechen möglicherweise nicht mehr der neuen Erhebungsdefinition',
    publishSkipDataUpdateImplicationStaleValues: 'Betroffene Werte werden erst nach manueller Neueingabe neu berechnet',
    publishSkipDataUpdateImplicationChains:
      'Verarbeitungsketten mit diesen Attributen können veraltete Ergebnisse liefern',
    raiseTicketInSupportForum: `Erstellen Sie bei Problemen bitte ein Ticket mit dem Tag „arena“ in unserem <b>Supportforum</b>: $t(links.supportForum)`,
    record: 'Datensatz',
    record_other: 'Datensätze',
    remaining: 'Verbleibend',
    remote: 'Remote',
    required: 'Erforderlich',
    requiredField: 'Pflichtfeld',
    reset: 'Zurücksetzen',
    refresh: 'Aktualisieren',
    pressRefreshToReloadPage: 'Klicken Sie auf „Aktualisieren“, um die Seite neu zu laden.',
    resume: 'Fortsetzen',
    retry: 'Erneut versuchen',
    role: 'Rolle',
    save: 'Speichern',
    saveAndBack: 'Speichern und zurück',
    saved: 'Gespeichert!',
    samplingPolygon: 'Stichprobenpolygon',
    show: 'Anzeigen',
    select: 'Auswählen',
    selectOne: 'Auswählen ...',
    selectAll: 'Alle auswählen',
    selected: 'Ausgewählt',
    showLabels: 'Bezeichnungen anzeigen',
    showLabelsAndNames: 'Bezeichnungen und Namen anzeigen',
    showNames: 'Namen anzeigen',
    sort: 'Sortieren',
    sortAsc: 'Aufsteigend sortieren',
    sortDesc: 'Absteigend sortieren',
    sortNone: 'Sortierung entfernen',
    srs: 'SRS',
    status: 'Status',
    sum: 'Summe',
    test: 'Testen',
    to: 'Bis',
    totalItems: 'Elemente insgesamt',
    true: 'Wahr',
    trySplittingFileIntoSmallerChunks: 'Versuchen Sie, die Datei in kleinere Teile aufzuteilen.',
    type: 'Typ',
    undefinedName: 'Nicht definierter Name',
    unique: 'Eindeutig',
    upload: 'Hochladen',
    uploadErrorConfirm: {
      message: `Fehler beim Hochladen der Datei: {{error}}.\n
Erneut versuchen?`,
    },
    uploadFileChangedError:
      'Die ausgewählte Datei wurde offenbar nach der Auswahl geändert. Wählen Sie sie erneut aus.',
    uploadingFile: 'Datei wird hochgeladen ({{progressPercent}} %)',
    value: 'Wert',
    view: 'Anzeigen',
    warning: 'Warnung',
    warning_other: 'Warnungen',
    yes: 'Ja',
    date: {
      aMomentAgo: 'Vor einem Augenblick',
      hour: 'Stunde',
      hour_other: 'Stunden',
      day: 'Tag',
      day_other: 'Tagen',
      minute: 'Minute',
      minute_other: 'Minuten',
      week: 'Woche',
      week_other: 'Wochen',
      timeDiff: `vor {{count}} $t(common.date.{{unit}}, { 'count': {{count}} })`,
    },
    paginator: {
      firstPage: 'Erste Seite',
      goToPage: 'Gehe zu Seite',
      itemsPerPage: 'Elemente pro Seite',
      lastPage: 'Letzte Seite',
      nextPage: 'Nächste Seite',
      page: 'Seite',
      previousPage: 'Vorherige Seite',
    },
    table: {
      visibleColumns: 'Sichtbare Spalten',
    },
  },
  confirm: {
    strongConfirmInputLabel: 'Geben Sie zur Bestätigung folgenden Text ein: **{{strongConfirmRequiredText}}**',
  },
  dropzone: {
    acceptedFilesMessage: '(Akzeptiert werden nur {{acceptedExtensions}}-Dateien mit höchstens {{maxSize}})',
    error: {
      fileNotValid: 'Die ausgewählte Datei ist ungültig',
      fileTooBig: 'Die ausgewählte Datei ist zu groß',
      invalidFileExtension: 'Ungültige Dateiendung: {{extension}}',
    },
    message: 'Datei hierher ziehen oder zur Auswahl klicken',
    selectedFile: 'Ausgewählte Datei',
    selectedFile_other: 'Ausgewählte Dateien',
  },
  error: {
    pageNotFound: 'Seite nicht gefunden',
  },
  geo: {
    area: 'Fläche',
    vertices: 'Eckpunkte',
    perimeter: 'Umfang',
  },
  files: {
    header: 'Dateien',
    missing: ' Fehlende Dateien: {{count}}',
    totalSize: 'Gesamtgröße: {{size}}',
    fileName: 'Dateiname',
    fileSize: 'Dateigröße',
  },
  sidebar: {
    logout: 'Abmelden',
  },
  header: {
    theme: {
      label: 'Design',
      light: 'Hell',
      dark: 'Dunkel',
      system: 'Systemeinstellung',
    },
    myProfile: 'Mein Profil',
    qrCodeLoginDialog: {
      title: 'Mit QR-Code bei Arena Mobile anmelden',
      instructions: `1. Starten Sie **Arena Mobile** auf Ihrem Mobilgerät
2. Öffnen Sie das Menü **Einstellungen**
3. Wählen Sie **Verbindung zum Server**
4. Tippen Sie auf **Mit QR-Code anmelden**
5. Scannen Sie den auf diesem Bildschirm angezeigten QR-Code`,
      success: 'Anmeldung erfolgreich!',
      error: 'Fehler beim Erzeugen des QR-Codes: {{error}}',
    },
  },
  nodeDefsTypes: {
    integer: 'Ganzzahl',
    decimal: 'Dezimalzahl',
    text: 'Text',
    date: 'Datum',
    time: 'Uhrzeit',
    boolean: 'Boolesch',
    code: 'Code',
    coordinate: 'Koordinate',
    geo: 'Geodaten',
    taxon: 'Taxon',
    file: 'Datei',
    entity: 'Entität',
  },

  // ====== App modules and views
  appModules: {
    home: 'Startseite',
    landing: 'Einstiegsseite',
    dashboard: 'Dashboard',
    surveyNew: 'Neue Erhebung',
    surveys: 'Erhebungen',
    templateNew: 'Neue Vorlage',
    templates: 'Vorlagen',
    usersAccessRequest: 'Benutzerzugriffsanfragen',
    collectImportReport: 'Collect-Importbericht',

    surveyInfo: 'Erhebungsinformationen',
    designer: 'Erhebung',
    formDesigner: 'Formular-Designer',
    surveyHierarchy: 'Hierarchie',
    surveyDependencyTree: 'Abhängigkeitsbaum',
    surveyCompare: 'Mit Datei vergleichen/aktualisieren',
    category: 'Kategorie',
    categories: 'Kategorien',
    nodeDef: 'Knotendefinition',
    taxonomy: 'Taxonomie',
    taxonomies: 'Taxonomien',

    data: 'Daten',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Datensatz-Validierungsbericht',
    explorer: 'Explorer',
    map: 'Karte',
    charts: 'Diagramme',
    export: 'Datenexport',
    import: 'Datenimport',
    validationReport: 'Validierungsbericht',
    formPreview: 'Formularvorschau',

    users: 'Benutzer',
    user: 'Benutzerprofil',
    userPasswordChange: 'Passwort ändern',
    userInvite: 'Benutzer einladen',
    userNew: 'Neuer Benutzer',
    usersSurvey: 'Benutzerliste',
    userGroup: 'Benutzergruppe',
    userGroup_other: 'Benutzergruppen',
    userGroupNew: 'Neue Benutzergruppe',
    usersList: 'Benutzerliste (alle)',
    user2FADevice: '2FA-Gerät',
    user2FADevice_other: '2FA-Geräte',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Analyse',
    chain: 'Verarbeitungskette',
    chain_other: 'Verarbeitungsketten',
    virtualEntity: 'Virtuelle Entität',
    entities: 'Virtuelle Entitäten',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Instanzen',

    message: 'Nachricht',
    message_other: '$t(common.message_other)',

    systemAdmin: 'Systemverwaltung',
    jobMonitor: 'Auftragsüberwachung',
    systemLogs: 'Systemprotokolle',
    authProviders: 'Anmeldeanbieter',
    authProvider: 'Anmeldeanbieter',

    help: 'Hilfe',
    about: 'Über Arena',
    changelog: 'Änderungsprotokoll',
    whatsNew: 'Neuigkeiten',
    termsOfService: 'Nutzungsbedingungen',
    privacyNotice: 'Datenschutzhinweis',
    userManual: 'Benutzerhandbuch',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Dieser Bereich ist nur für veröffentlichte Erhebungen verfügbar',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Abhängigkeitstypen',
    dependencyTypes: {
      applicable: 'Anwendbarkeit',
      defaultValues: 'Standardwert',
      editable: 'Bearbeitbar',
      fileName: 'Dateiname',
      itemsFilter: 'Elementfilter',
      maxCount: 'Höchstanzahl',
      minCount: 'Mindestanzahl',
      parentCode: 'Übergeordneter Code',
      validations: 'Validierungen',
      visible: 'Sichtbar',
    },
    selectAtLeastOneDependencyType: 'Wählen Sie mindestens einen Abhängigkeitstyp aus',
    noDependenciesToDisplay: 'Keine Abhängigkeiten vorhanden',
  },
  designerView: {
    formPreview: 'Formularvorschau',
  },
  recordView: {
    justDeleted: 'Dieser Datensatz wurde gerade gelöscht',
    sessionExpired: 'Die Datensatzsitzung ist abgelaufen',
    errorLoadingRecord: 'Fehler beim Laden des Datensatzes: {{details}}',
    recordEditModalTitle: 'Datensatz: {{keyValues}}',
    recordNotFound: 'Datensatz nicht gefunden',
    keyAttributeEditing: {
      lock: 'Bearbeitung des Schlüsselattributs sperren',
      unlock: 'Bearbeitung des Schlüsselattributs erlauben',
    },
    qualifierAttributeEditing: {
      lock: 'Bearbeitung des Qualifikatorattributs sperren',
      unlock: 'Bearbeitung des Qualifikatorattributs erlauben',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Diese benutzerdefinierte Aggregatfunktion löschen?',
      sqlExpression: 'SQL-Ausdruck',
    },
    editRecord: 'Datensatz bearbeiten',
  },
  mapView: {
    changeMarkerColor: 'Markierungsfarbe ändern',
    createRecord: 'Neuen Datensatz erstellen',
    editRecord: 'Datensatz bearbeiten',
    elevation: 'Höhe (m)',
    location: 'Position',
    locationEditInfo: 'Doppelklicken Sie auf die Karte oder ziehen Sie die Markierung, um die Position zu ändern',
    locationNotValidOrOutOfRange: 'Position ist ungültig oder liegt außerhalb der UTM-Zone',
    locationUpdated: 'Position aktualisiert',
    samplingPointDataLayerName: 'Stichprobenpunktdaten – Ebene {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (wird geladen ...)',
    samplingPointItemPopup: {
      title: 'Stichprobenpunktelement',
      levelCode: 'Code der Ebene {{level}}',
    },
    selectedPeriod: 'Ausgewählter Zeitraum',
  },

  mapWorkspace: {
    scenes: {
      tab: 'Sentinel-2',
      title: 'Sentinel-2-Szenen',
      menuSearch: 'Aktuelle Sentinel-2-Szenen suchen …',
      intro:
        'Sentinel-2 L2A, 10 m. Suche im Browser über einen statischen STAC-GeoParquet-Index; Darstellung direkt aus dem Cloud-optimierten GeoTIFF jeder Szene. Kein Kachelserver.',
      area: {
        label: 'Gebiet',
        view: 'Kartenausschnitt',
        plot: 'Ausgewählte Probefläche',
        draw: 'Gebiet zeichnen',
        drawAgain: 'Neu zeichnen',
      },
      period: {
        label: 'Zeitraum',
        hint: 'bis zu 6 Monate zurück',
        months_one: '{{count}} Monat',
        months_other: '{{count}} Monate',
      },
      maxCloud: 'Max. Bewölkung',
      minCoverage: 'Min. Abdeckung',
      percent: '{{value}} %',
      chart: {
        title: 'Wolkenarme Szenen pro Monat',
        allMonths: 'Alle Monate',
        bar_one: '{{month}}: {{count}} Szene',
        bar_other: '{{month}}: {{count}} Szenen',
      },
      count_one: '{{count}} Szene',
      count_other: '{{count}} Szenen',
      countInMonth_one: '{{count}} Szene im {{month}}',
      countInMonth_other: '{{count}} Szenen im {{month}}',
      sort: {
        label: 'Sortierung',
        newest: 'Neueste',
        leastCloud: 'Geringste Bewölkung',
        mostCoverage: 'Größte Abdeckung',
      },
      rowDetails: 'Kachel {{tile}} · {{cloud}} Bewölkung · {{coverage}} Abdeckung',
      unknownValue: '–',
      thumbnailAlt: 'Vorschau der Szene vom {{date}}',
      addAsLayer: 'Als Ebene hinzufügen',
      alreadyOnMap: 'Bereits auf der Karte',
      useAsBaseMap: 'Als Basiskarte verwenden',
      loadingScene: 'Szene wird geladen …',
      bands: {
        label: 'Bänder',
        trueColour: 'Echtfarben (schnell, eine Datei)',
        falseColourVegetation: 'Falschfarben, Vegetation (B8, B4, B3)',
        swir: 'Kurzwelliges Infrarot (B12, B8A, B4)',
        note: 'Andere Bandkombinationen lesen drei Dateien pro Szene und laden daher langsamer.',
      },
      bandsShort: {
        trueColour: 'Echtfarben',
        falseColourVegetation: 'Falschfarben',
        swir: 'SWIR',
      },
      layerName: 'Sentinel-2 {{date}} · {{tile}} · {{bands}}',
      baseLayerName: '{{name}} (Basiskarte)',
      messages: {
        drawing: 'Klicken Sie auf zwei gegenüberliegende Ecken der Karte, um das Gebiet zu zeichnen.',
        noPlot: 'Öffnen Sie eine Probeflächenmarkierung auf der Karte, um deren Umgebung zu durchsuchen.',
        noDrawnArea: 'Zeichnen Sie ein Rechteck auf der Karte, um darin zu suchen.',
        tooLarge: 'Das Gebiet ist zu groß. Zoomen Sie hinein, bis es höchstens {{max}} Sentinel-2-Kacheln umfasst.',
        outside: 'Sentinel-2-Kacheln decken nur Breitengrade von 80° S bis 84° N ab.',
        error: 'Der Szenenindex konnte nicht gelesen werden.',
        retry: 'Erneut versuchen',
        searching_one: '{{count}} Kachel wird durchsucht …',
        searching_other: '{{count}} Kacheln werden durchsucht …',
        empty: 'Keine passenden Szenen. Erlauben Sie mehr Bewölkung oder einen längeren Zeitraum.',
        layerError: 'Die Szene konnte nicht dargestellt werden.',
      },
    },
    wms: {
      menuItem: 'WMS-/WMTS-Dienst hinzufügen …',
      title: 'WMS-/WMTS-Dienst hinzufügen',
      serviceUrl: 'Dienst-URL',
      serviceUrlPlaceholder: 'https://example.org/geoserver/wms',
      loadLayers: 'Ebenen laden',
      loading: 'Wird geladen …',
      urlHint: 'WMS-/WMTS-GetCapabilities-URL oder XYZ-Kachelvorlage mit {z}/{x}/{y}',
      insecureUrlHint: 'Dieser Dienst verwendet HTTP; der Browser kann seine Kacheln auf dieser HTTPS-Seite blockieren',
      layersCount: '{{count}} Ebenen',
      layersCount_one: '{{count}} Ebene',
      layersCount_other: '{{count}} Ebenen',
      webMercatorSupported: 'Web Mercator wird unterstützt',
      webMercatorMissing: 'Keine Ebene in Web Mercator',
      truncated: 'nur die ersten {{max}} Ebenen werden aufgeführt',
      xyzSummary: 'XYZ-Kachelvorlage · keine Capabilities erforderlich',
      layersToAdd: 'Hinzuzufügende Ebenen',
      layerNotWebMercator: 'Nicht in Web Mercator verfügbar',
      addAs: 'Hinzufügen als',
      addAsOverlay: 'Überlagerungsebene',
      addAsOverlayDescription: 'Wird über der Basiskarte angezeigt und im Reiter „Ebenen“ aufgeführt',
      addAsBaseMap: 'Basiskarte',
      addAsBaseMapDescription: 'Ersetzt die Basiskarte und wird im Basiskartenmenü aufgeführt',
      displayName: 'Anzeigename',
      displayNameMultiple: 'Jede Ebene behält ihren eigenen Titel',
      imageFormat: 'Bildformat',
      formatPng: 'PNG (transparent)',
      formatJpeg: 'JPEG (kleiner)',
      opacity: 'Deckkraft',
      attribution: 'Quellenangabe',
      whoSeesIt: 'Sichtbarkeit',
      scopeSurvey: 'Alle in dieser Erhebung',
      scopeUser: 'Nur ich',
      submitOverlays: '{{count}} Überlagerungsebenen hinzufügen',
      submitOverlays_one: '{{count}} Überlagerungsebene hinzufügen',
      submitOverlays_other: '{{count}} Überlagerungsebenen hinzufügen',
      submitBaseMaps: '{{count}} Basiskarten hinzufügen',
      submitBaseMaps_one: '{{count}} Basiskarte hinzufügen',
      submitBaseMaps_other: '{{count}} Basiskarten hinzufügen',
      removeSelectedBaseMap: 'Ausgewählte benutzerdefinierte Basiskarte entfernen',
      hiddenForSession:
        'Ebene bis zum erneuten Öffnen der Karte ausgeblendet: Nur Personen mit Bearbeitungsrechten für die Erhebung können Ebenen entfernen, die für alle freigegeben sind',
      errors: {
        fetchLayersFailed: 'Benutzerdefinierte Kartenebenen konnten nicht geladen werden',
        loadFailed: 'Ebenen dieses Dienstes konnten nicht geladen werden',
        saveFailed: 'Ebenen konnten nicht gespeichert werden',
        removeFailed: 'Ebene konnte nicht entfernt werden',
      },
    },
    toolbarLabel: 'Kartenwerkzeuge',
    menus: {
      baseMap: 'Basiskarte',
      addData: 'Daten hinzufügen',
      display: 'Anzeige',
      imagery: 'Bilddaten',
      tools: 'Werkzeuge',
    },
    addData: {
      uploadFile: 'KML-, KMZ- oder Shapefile-Datei hochladen …',
    },
    display: {
      showLocationMarkers: 'Positionsmarkierungen',
      showMarkersLabels: 'Markierungsbezeichnungen',
      showUtmGrid: 'UTM-Gitter',
      imageInterpretation: 'Bildinterpretation',
      showSamplingPolygon: 'Stichprobenpolygon',
      showControlPoints: 'Kontrollpunkte',
      showPlotReferencePoint: 'Referenzpunkt der Probefläche',
    },
    tools: {
      measureDistance: 'Entfernung messen',
    },
    quick: {
      zoomToData: 'Auf Daten zoomen',
      fullScreen: 'Vollbild',
      exitFullScreen: 'Vollbild beenden',
      noDataToZoom: 'Auf der Karte sind keine Daten zum Heranzoomen vorhanden',
    },
    search: {
      label: 'Karte durchsuchen',
      placeholderFull: 'Datensatzschlüssel oder Koordinaten',
      placeholderCompact: 'Koordinaten',
      goTo: 'Gehe zu {{coordinates}}',
      invalidCoordinates: 'Koordinaten außerhalb des gültigen Bereichs',
      noMatch: 'Kein passender Datensatz bzw. keine passenden Koordinaten',
      coordinatesHint: 'Koordinaten eingeben, z. B. 41.9, 12.5',
    },
    rail: {
      label: 'Kartenbereiche',
      close: 'Bereich einklappen',
      resize: 'Bereichsgröße ändern',
      tabs: {
        layers: 'Ebenen',
        records: 'Datensätze',
        legend: 'Legende',
      },
      titles: {
        records: 'Datensätze auf der Karte',
      },
      recordsEmpty: 'Zeigen Sie eine Erhebungsdatenebene an, um deren Datensätze aufzulisten',
    },
    layers: {
      noSurveyData: 'Diese Erhebung enthält keine auf der Karte darstellbaren Daten',
      groups: {
        custom: 'Benutzerdefiniert (WMS/WMTS)',
        scenes: 'Sentinel-2-Szenen',
        uploaded: 'Hochgeladene Dateien',
      },
      opacity: 'Deckkraft von {{name}}',
      remove: '{{name}} entfernen',
    },
    legend: {
      marker: 'Datensatzposition',
      cluster: 'Gruppe nahe beieinanderliegender Datensätze',
      samplingPolygon: 'Stichprobenpolygon',
      utmGrid: 'UTM-Gitter',
      addedLayers: 'Hinzugefügte Ebenen',
    },
    status: {
      changeNotation: 'Klicken, um die Schreibweise zu ändern',
      notations: {
        latLon: 'Lat, Lon',
        dms: 'DMS',
        utm: 'UTM',
      },
      zoom: 'Zoomstufe',
      scale: 'Maßstab',
      recordsInView_one: '{{count}} Datensatz im Ausschnitt',
      recordsInView_other: '{{count}} Datensätze im Ausschnitt',
    },
    upload: {
      unsupported: 'Nicht unterstützte Datei: Wählen Sie eine KML-, KMZ-, gezippte Shapefile- oder GeoJSON-Datei',
      tooLarge: 'Die Datei ist zu groß: höchstens {{maxSize}} MB',
      error: 'Die Datei konnte nicht gelesen werden: {{details}}',
    },
    measure: {
      measureArea: 'Fläche messen',
      barLabel: 'Messen',
      modes: {
        distance: 'Entfernung',
        area: 'Fläche',
      },
      hint: 'Klicken, um Punkte hinzuzufügen; doppelklicken, um abzuschließen',
      units: 'Einheiten',
      unitOptions: {
        auto: 'Automatisch',
        m: 'Meter (m)',
        km: 'Kilometer (km)',
        m2: 'Quadratmeter (m²)',
        ha: 'Hektar (ha)',
        km2: 'Quadratkilometer (km²)',
      },
      unitSymbols: {
        m: 'm',
        km: 'km',
        m2: 'm²',
        ha: 'ha',
        km2: 'km²',
      },
      perimeter: 'Umfang {{value}}',
      done: 'Fertig',
    },
    screenshot: {
      quickButton: 'Bildschirmfoto',
      title: 'Kartenbildschirmfoto',
      capture: 'Aufnehmen',
      captureView: 'Aktueller Ausschnitt',
      capturePlot: 'An Probefläche anpassen',
      include: 'Einbeziehen',
      includeData: 'Markierungen und Messungen',
      includeScale: 'Maßstabsleiste und Nordpfeil',
      includeStamp: 'Probefläche, Datum, Koordinaten, Basiskarte',
      saveTo: 'Speichern in',
      targetRecord: 'An Probeflächendatensatz anhängen',
      targetRecordHint: 'Wird in einem Bildattribut gespeichert',
      targetFile: 'Nur herunterladen',
      targetFileHint: 'PNG-Datei auf diesem Computer',
      plot: 'Probeflächendatensatz',
      attribute: 'Bildattribut',
      fileName: 'Dateiname',
      mobileNote:
        'Es werden nur Bildattribute der Probefläche aufgeführt. Feldteams sehen dieses Bild in Arena Mobile, sobald der Datensatz auf ihr Gerät heruntergeladen wurde.',
      noPlots:
        'Im Kartenausschnitt sind keine Probeflächen vorhanden. Um das Bild an einen Probeflächendatensatz anzuhängen, zeigen Sie eine Positionsebene im Reiter „Ebenen“ an und verschieben Sie die Karte zu einer Probefläche.',
      noImageAttributes:
        'Diese Probefläche besitzt kein bearbeitbares Bildattribut für Bildschirmfotos (aktivieren Sie im Formular-Designer „Speichern von Bildschirmfotos in der Kartenansicht erlauben“).',
      previewLoading: 'Vorschau wird vorbereitet …',
      previewAlt: 'Vorschau des Kartenbildschirmfotos',
      alsoDownload: 'Zusätzlich herunterladen',
      downloadPng: 'PNG herunterladen',
      saving: 'Wird gespeichert …',
      replace: 'Ersetzen',
      keep: 'Aktuelles Bild behalten',
      confirmReplace: 'Dieses Attribut enthält bereits das Bild „{{fileName}}“. Durch das Bildschirmfoto ersetzen?',
      saved:
        'Bildschirmfoto unter {{plot}} › {{attribute}} gespeichert. Feldteams erhalten es beim nächsten Herunterladen der Datensätze.',
      savedPending:
        'Bildschirmfoto an {{plot}} gesendet. Der Datensatz wird noch aktualisiert; prüfen Sie ihn gleich noch einmal.',
      notices: {
        mapHidden:
          'Die Karte ist auf diesem Bildschirm ausgeblendet. Schließen Sie den Seitenbereich oder verbreitern Sie das Fenster und versuchen Sie es erneut.',
        tilesMissing:
          'Ausgelassene Kartenkacheln (der Server erlaubt es nicht oder sie wurden nicht geladen): {{count}}',
        equalEarth:
          'Die Equal-Earth-Basiskarte kann nicht aufgenommen werden. Wählen Sie im Menü „Basiskarte“ eine andere Basiskarte.',
      },
      errors: {
        captureFailed: 'Karte konnte nicht aufgenommen werden: {{details}}',
        cannotEditRecord: 'Sie können diesen Datensatz nicht bearbeiten (oder die Erhebung ist nicht veröffentlicht).',
        fileTooLarge:
          'Das Bild ist {{size}} MB groß und überschreitet die für dieses Attribut zulässigen {{limit}} MB.',
        quotaExceeded: 'In dieser Erhebung ist nicht genügend freier Dateispeicher für das Bild vorhanden.',
        plotNotFound: 'Die Probefläche wurde im Datensatz nicht gefunden. Sie wurde möglicherweise gelöscht.',
        saveFailed: 'Das Bildschirmfoto wurde nicht gespeichert: {{details}}',
        fileNameRequired: 'Geben Sie einen Dateinamen ein.',
        rowNotConfirmed:
          'Die neue Bildzeile wurde nicht rechtzeitig bestätigt; das Bildschirmfoto wurde daher nicht gespeichert. Prüfen Sie den Datensatz vor einem erneuten Versuch.',
        notApplicable:
          'Das Bild kann nicht hinzugefügt werden: Das Attribut ist für diese Probefläche nicht anwendbar.',
        clearsOtherValues:
          'Das Bildschirmfoto wurde nicht gespeichert, da dadurch Werte in anderen Datensatzfeldern gelöscht würden. Fügen Sie es stattdessen im Datensatzeditor hinzu.',
      },
    },
  },

  samplingPolygonOptions: {
    circle: 'Kreis',
    controlPointOffsetEast: 'Versatz des Referenzpunkts nach Osten (m)',
    controlPointOffsetNorth: 'Versatz des Referenzpunkts nach Norden (m)',
    lengthLatitude: 'Länge in Nord-Süd-Richtung (m)',
    lengthLongitude: 'Länge in Ost-West-Richtung (m)',
    numberOfControlPoints: 'Anzahl der Kontrollpunkte',
    numberOfPointsEast: 'Anzahl der Kontrollpunkte nach Osten',
    numberOfPointsNorth: 'Anzahl der Kontrollpunkte nach Norden',
    offsetEast: 'Versatz nach Osten (m)',
    offsetNorth: 'Versatz nach Norden (m)',
    radius: 'Radius (m)',
    rectangle: 'Rechteck',
    samplingPolygon: 'Stichprobenpolygon',
    shape: 'Form',
  },

  surveysView: {
    chains: 'Verarbeitungsketten',
    confirmUpdateSurveyOwner: 'Eigentümer der Erhebung „{{surveyName}}“ in „{{ownerName}}“ ändern?',
    cycles: 'Zyklen',
    datePublished: 'Veröffentlicht am',
    editUserExtraProps: 'Zusätzliche Benutzereigenschaften bearbeiten',
    editUserExtraPropsForSurvey: 'Zusätzliche Benutzereigenschaften für die Erhebung „{{surveyName}}“ bearbeiten',
    filter: 'Filter',
    filterPlaceholder: 'Nach Name, Bezeichnung oder Eigentümer filtern',
    languages: 'Sprachen',
    nodes: 'Knoten',
    noSurveysMatchingFilter: 'Keine Erhebungen entsprechen dem angegebenen Filter',
    onlyOwn: 'Nur eigene Erhebungen',
    records: 'Datensätze',
    recordsCreatedWithMoreApps: 'Mit mehreren Apps erstellte Datensätze:',
    status: {
      published: 'Veröffentlicht',
      draft: 'Entwurf',
      'published-draft': 'Veröffentlicht/Entwurf',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Angenommen',
      CREATED: 'Ausstehend',
    },
    acceptedBy: 'Angenommen von',
    dateAccepted: 'Angenommen am',
    createdSurvey: 'Erstellte Erhebung',
    acceptRequest: {
      accept: 'Annehmen',
      acceptRequestAndCreateSurvey: 'Anfrage annehmen und Erhebung erstellen',
      confirmAcceptRequestAndCreateSurvey:
        'Zugriffsanfrage für **{{email}}** als **{{role}}** annehmen und die neue Erhebung **{{surveyName}}** erstellen?',
      error: 'Fehler beim Annehmen der Zugriffsanfrage: {{error}}',
      requestAcceptedSuccessfully: 'Zugriffsanfrage erfolgreich angenommen. $t(common.emailSentConfirmation)',
      surveyLabelInitial: '(Name und Bezeichnung der Erhebung nach Bedarf ändern)',
      surveyName: 'Name der Erhebung',
      newSurvey: 'Neue Erhebung',
      requestDetails: 'Anfragedetails',
      template: 'Vorlage',
    },
  },
  userView: {
    scale: 'Skalieren',
    rotate: 'Drehen',
    dragAndDrop: 'Bild oben ablegen oder',
    upload: 'Hochladen',
    remove: 'Profilbild entfernen?',
    sendNewInvitation: 'Neue Einladung senden',
    removeFromSurvey: 'Aus Erhebung entfernen',
    confirmRemove: 'Möchten Sie {{user}} wirklich den Zugriff auf die Erhebung {{survey}} entziehen?',
    removeUserConfirmation: 'Benutzer {{user}} wurde aus der Erhebung {{survey}} entfernt',
    maxSurveysUserCanCreate: 'Maximale Anzahl erstellbarer Erhebungen',
    preferredUILanguage: {
      label: 'Bevorzugte Oberflächensprache',
      auto: 'Automatisch erkannt ({{detectedLanguage}})',
    },
    newPassword: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    manageTwoFactorDevices: {
      label: '2FA verwalten',
      title: 'Geräte für Zwei-Faktor-Authentifizierung verwalten',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Passwort für Benutzer {{user}} ändern',
    oldPassword: 'Altes Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Neues Passwort bestätigen',
    changePassword: 'Passwort ändern',
    passwordChangedSuccessfully: 'Passwort erfolgreich geändert!',
    notAuthorizedToChangePasswordOfAnotherUser:
      'Sie sind nicht berechtigt, das Passwort eines anderen Benutzers zu ändern',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Benutzer {{email}} als Systemadministrator einladen?',
    confirmInviteSystemAdmin_other: 'Benutzer {{email}} als Systemadministratoren einladen?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice:
      '{{skppedEmailsCount}} Adressen wurden übersprungen (sie wurden bereits zu dieser Erhebung eingeladen): {{skippedEmails}}',
    invalidEmailsWarning:
      'Die E-Mail-Adresse {{emails}} war nicht erreichbar und existiert möglicherweise nicht. Sie bleibt unten in der Liste; korrigieren oder entfernen Sie sie und versuchen Sie es erneut.',
    invalidEmailsWarning_other:
      'Die E-Mail-Adressen {{emails}} waren nicht erreichbar und existieren möglicherweise nicht. Sie bleiben unten in der Liste; korrigieren oder entfernen Sie sie und versuchen Sie es erneut.',
    groupPermissions: {
      label: 'Berechtigungen',
      systemAdmin: `
        <li>Vollständige Systemzugriffsrechte</li>`,
      surveyManager: `
        <li>Erhebungen:
          <ul>
            <li>erstellen</li>
            <li>klonen</li>
            <li>eigene Erhebungen bearbeiten</li>
            <li>eigene Erhebungen löschen</li>
          </ul>
        </li>
        <li>Benutzer:
          <ul>
            <li>Benutzer zu eigenen Erhebungen einladen</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Erhebungen:
          <ul>
            <li>klonen</li>
            <li>eigene Erhebungen bearbeiten</li>
            <li>eigene Erhebungen löschen</li>
          </ul>
        </li>
        <li>Benutzer:
          <ul>
            <li>Benutzer zu eigenen Erhebungen einladen</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Erhebungen:
          <ul>
            <li>eigene Erhebungen bearbeiten</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Daten:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>auf das Kartenwerkzeug zugreifen</li>
          </ul>
        </li>
        <li>Analyse:
          <ul>
            <li>vollständige Zugriffsrechte auf alle Werkzeuge</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Daten:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>auf Datenvalidierungswerkzeuge zugreifen</li>
        <li>Datensätze an die Phase „Analyse“ übermitteln</li>`,
      dataEditor: `
        <li>Daten:
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>neue Datensätze hinzufügen (eigene Erhebungen)</li>
        <li>vorhandene Datensätze bearbeiten (eigene Erhebungen)</li>
        <li>Datensätze an die Phase „Bereinigung“ übermitteln</li>`,
      surveyGuest: `
        <li>Daten:
          <ul>
            <li>Datensätze eigener Erhebungen ohne Bearbeitungsrecht anzeigen</li>
          </ul>
        </li>`,
    },
    messageOptional: 'Nachricht (optional)',
    messageInfo: `Die Nachricht erscheint in der an den Benutzer gesendeten E-Mail.
Sie kann als einfacher Text oder in Markdown (https://www.markdownguide.org) verfasst werden.`,
    sendInvitation: 'Einladung senden',
    surveyNotPublishedWarning: `**Warnung**: Die Erhebung ist nicht veröffentlicht.
      Benutzer können nur mit den Rollen ***$t(auth:authGroups.systemAdmin.label)*** und ***$t(auth:authGroups.surveyAdmin.label)*** eingeladen werden.
      Veröffentlichen Sie die Erhebung zuerst, wenn Sie Benutzer mit anderen Rollen einladen möchten.`,
    typeEmail: 'E-Mail-Adresse eingeben und anschließend auf „Hinzufügen“ klicken',
  },
  user: {
    mapApiKeys: {
      title: 'Karten-API-Schlüssel',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Dieser API-Schlüssel ist gültig',
      keyIsNotCorrect: 'Dieser API-Schlüssel ist NICHT gültig',
    },
    title: 'Anrede',
    titleValues: {
      mr: 'Herr',
      ms: 'Frau',
      preferNotToSay: 'Keine Angabe',
    },
  },
  chainView: {
    baseUnit: {
      confirmDelete:
        'Beim Löschen der Basiseinheit werden alle Auswahlen „flächenbasierte Variable“ aufgehoben. Fortfahren?',
    },
    downloadSummaryJSON: 'Zusammenfassung herunterladen (JSON)',
    mauFile: {
      upload: 'MAU.zip hochladen',
      download: 'MAU.zip herunterladen',
      delete: 'MAU.zip löschen',
      confirmCycleAssociation:
        'Die Datei MAU.zip wird dem aktuellen Zyklus ({{cycle}}) zugeordnet. Möchten Sie fortfahren?',
      confirmReplace:
        'Für diese Verarbeitungskette wurde bereits eine MAU.zip-Datei hochgeladen. Möchten Sie sie ersetzen?',
      confirmDelete: 'Die für diese Verarbeitungskette hochgeladene MAU.zip-Datei löschen?',
      uploadComplete: 'MAU.zip-Datei erfolgreich hochgeladen',
      deleteComplete: 'MAU.zip-Datei gelöscht',
      invalidFileExtension: 'Wählen Sie eine ZIP-Datei aus',
    },
    phase1Category: 'Kategorie der ersten Phase',
    phase1CategoryInfo: 'Wählen Sie die Kategorie mit den Stichproben der ersten Phase aus.',
    phase2JoinEntity: {
      label: 'Verknüpfungsentität (zweite Phase)',
      info: 'Entität zur Verknüpfung der Basiseinheit mit der Kategorie der ersten Phase: die Basiseinheit selbst oder eine ihrer übergeordneten Entitäten.',
    },
    phase2AsSamplingPointData: {
      label: 'Über die Stichprobenpunktdaten verknüpfen',
      info: 'Die Entitätsschlüssel der zweiten Phase werden aus der Stichprobenpunktdatentabelle gelesen, die auch für die erste Phase verwendet wird.',
    },
    phase1JoinAttribute: {
      label: 'Verknüpfungsattribut (erste Phase)',
      info: 'Wählen Sie die Spalte der Tabelle $t(chainView.phase1Category) (Zusatzeigenschaft oder „code“), über die sie mit der Verknüpfungsentität der zweiten Phase verbunden wird.',
    },
    phase2JoinAttribute: {
      label: 'Verknüpfungsattribut (zweite Phase)',
      info: 'Wählen Sie das Attribut der Entität der zweiten Phase zur Verknüpfung mit der Tabelle der ersten Phase; sein Wert wird mit dem vorherigen Verknüpfungsattribut abgeglichen.',
    },
    formLabel: 'Bezeichnung der Verarbeitungskette',
    basic: 'Allgemein',
    records: 'Datensätze',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Nur Daten des Analyseschritts an RStudio übermitteln',
    submitOnlySelectedRecordsIntoR: 'Nur ausgewählte Datensätze an RStudio übermitteln',
    includeEntitiesWithoutData: 'Entitäten ohne Daten einbeziehen',
    cannotStartRStudio: {
      common: 'RStudio kann nicht gestartet werden',
      noRecords: '$t(chainView.cannotStartRStudio.common): Es sind keine Datensätze zum Übermitteln vorhanden',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): Veröffentlichen Sie zuerst die Erhebung',
    },
    nonResponseBiasCorrection: 'Korrektur der Nichtantwortverzerrung',
    nonResponseBiasCorrectionInfo:
      'Fügen Sie zur Gewichtungsklassenanpassung „design_psu“ und „design_ssu“ als zusätzliche numerische Eigenschaften zur Stratum-Kategorietabelle hinzu',
    pValue: 'p-Wert',
    resultsBackFromRStudio: 'Ergebnisse aus RStudio zurücklesen',
    resultsBackFromRStudioInfo: `Aktivieren Sie diese Option, wenn die in RStudio berechneten Ergebnisattribute wieder in den Arena-Server importiert werden sollen.
Dieser Vorgang kann langsam sein.`,
    samplingDesign: 'Stichprobendesign',
    samplingDesignDetails: 'Details zum Stichprobendesign',
    samplingStrategyLabel: 'Stichprobenstrategie',
    samplingStrategy: {
      simpleRandom: 'Einfache Zufallsstichprobe',
      systematic: 'Systematische Stichprobe',
      stratifiedRandom: 'Geschichtete Zufallsstichprobe',
      stratifiedSystematic: 'Geschichtete systematische Stichprobe',
      twoPhase: 'Zweiphasige Stichprobe',
    },
    statisticalAnalysis: {
      header: 'Statistische Analyse',
      entityToReport: 'Auszuwertende Entität',
      entityWithoutData: 'Die Entität {{name}} enthält keine Daten',
      filter: 'Filter (R-Skript)',
      reportingMethod: 'Auswertungsmethode',
      reportingMethods: {
        dimensionsCombined: 'Kombination der Dimensionen',
        dimensionsSeparate: 'Dimensionen getrennt',
      },
      reportingArea: 'Gesamte Auswertungsfläche (ha, optional)',
      reportingAreaInfo:
        'Geben Sie bei geschichteten Stichproben die Flächen der Schichten in der Kategorietabelle des Stratum-Attributs an (Spaltenname „area“)',
    },
    stratumAttribute: 'Stratum-Attribut',
    stratumAttributeInfo: 'Wählen Sie die Variable zur Schichtung der Stichprobe aus.',
    stratumAttribute2ndPhaseInfo:
      'Wählen Sie die Variable zur Unterschichtung der Stichprobe der ersten Phase vor dem Ziehen der endgültigen Detailstichprobe. Angezeigt werden nur Attribute, deren Name auch als Spalte der Kategorie der ersten Phase vorkommt.',
    postStratificationAttribute: 'Nachschichtungsattribut',
    areaWeightingMethod: 'Flächengewichtungsmethode',
    clusteringEntity: 'Clusterentität',
    clusteringEntityInfo:
      'Die Entität, welche die primären Stichprobeneinheiten definiert. Hinweis: Dies wird ausschließlich für Clusteranalysen im Framework des R-Pakets „survey“ verwendet.',
    clusteringOnlyVariances: 'Clustering nur für Varianzen',
    errorNoLabel: 'Die Verarbeitungskette muss eine gültige Bezeichnung besitzen',
    dateExecuted: 'Ausgeführt am',
    deleteChain: 'Verarbeitungskette löschen',
    deleteConfirm: `Diese Verarbeitungskette löschen?

$t(common.cantUndoWarning)`,
    deleteComplete: 'Verarbeitungskette gelöscht',
    cloneFromAnotherSurvey: 'Aus anderer Erhebung klonen',
    cloneFromAnotherSurveyDialog: {
      title: 'Verarbeitungskette aus anderer Erhebung klonen',
      sourceSurvey: 'Quellerhebung',
      sourceChain: 'Quellverarbeitungskette',
      entityCheck: 'Entitätskompatibilität',
      entityMissing: 'fehlt in der Zielerhebung',
      skipMissingEntities: 'Analyseattribute für Entitäten überspringen, die in der Zielerhebung fehlen',
      noAnalysisAttributes: 'Diese Verarbeitungskette besitzt keine Analyseattribute',
      cloneComplete: 'Verarbeitungskette erfolgreich geklont',
      missingEntities:
        'Klonen nicht möglich: Folgende Entitäten sind in der Zielerhebung nicht vorhanden: {{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles:
      'Die Knotendefinition „{{label}}“ kann nicht ausgewählt werden, da sie nicht zu allen Zyklen der Verarbeitungskette gehört',
    cannotSelectCycle: 'Dieser Zyklus kann nicht ausgewählt werden, da einige Knotendefinitionen nicht zu ihm gehören',
    copyRStudioCode: `#### Sie sind dabei, einen RStudio-Server zu öffnen ####

##### Klicken Sie auf OK, um diese Befehle in die Zwischenablage zu kopieren. #####

###### Der RStudio-Server wird geöffnet. Fügen Sie die folgenden Zeilen in die aktive RStudio-Konsole ein und führen Sie sie aus, um den Code der Verarbeitungskette zu importieren: ######

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Verarbeitungskette an RStudio übergeben ####

###### Klicken Sie auf OK, um diese Befehle in die Zwischenablage zu kopieren. ######

###### Starten Sie RStudio auf Ihrem Computer (das Paket „rstudioapi“ muss installiert sein). ######

###### Fügen Sie die folgenden Zeilen in die aktive RStudio-Konsole ein und führen Sie sie aus, um den Code der Verarbeitungskette zu importieren: ######


{{rStudioCode}}

`,
    entities: {
      new: 'Virtuelle Entität',
    },
    reportingDataCategory: 'Name der Kategorietabelle',
    reportingDataAttribute: 'Attribut für {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Auswertungsdatentabelle und Verknüpfungen mit Attributen',
    showSamplingAttributes: 'Stichprobenattribute anzeigen',
  },
  instancesView: {
    title: 'Instanzen',
    terminate: 'Beenden',
  },
  chain: {
    quantitative: 'Quantitativ',
    categorical: 'Kategorisch',
    addQuantitative: 'Quantitatives Attribut hinzufügen',
    addCategorical: 'Kategorisches Attribut hinzufügen',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'die Entität und alle zugehörigen Ergebnisvariablen werden in den RStudio-Skripten ausgeschlossen',
    entityWithoutData: 'Entität {{name}} enthält keine Daten; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'Entität {{name}} ist im ausgewählten Zyklus nicht verfügbar; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Ungültiges oder abgelaufenes Token',
    },
  },
  itemsTable: {
    unused: 'Nicht verwendet',
    noItemsAdded: 'Keine Elemente hinzugefügt',
    selectedItemsCount: '{{count}} Element ausgewählt',
    selectedItemsCount_other: '{{count}} Elemente ausgewählt',
  },
  expression: {
    areaOfInterestNotFound:
      'Interessengebiet „{{name}}“ nicht gefunden: Definieren Sie es unter Erhebungsinformationen → Karte',
    functionHasTooFewArguments:
      'Funktion {{fnName}} benötigt mindestens {{minArity}} Argumente (angegeben: {{numArgs}})',
    functionHasTooManyArguments:
      'Funktion {{fnName}} akzeptiert höchstens {{maxArity}} Argumente (angegeben: {{numArgs}})',
    identifierNotFound: 'Attribut oder Entität „{{name}}“ nicht gefunden',
    invalid: 'Ungültiger Ausdruck: {{details}}',
    invalidAttributeValuePropertyName: 'Ungültiger Name der Attributwerteigenschaft: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Ungültiger Name der Kategorie-Zusatzeigenschaft: {{propName}}',
    invalidCategotyName: 'Ungültiger Kategoriename: {{name}}',
    invalidTaxonomyExtraProp: 'Ungültiger Name der Taxonomie-Zusatzeigenschaft: {{propName}}',
    invalidTaxonomyName: 'Ungültiger Taxonomiename: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Ungültiger Sprachcode des Trivialnamens: {{vernacularLangCode}}',
    missingFunctionParameters: 'Funktionsparameter fehlen',
    notSupported:
      'Ausdruck wird nicht unterstützt: Prüfen Sie die Syntax (z. B. auf einen fehlenden Operator zwischen zwei Werten)',
    undefinedFunction: 'Nicht definierte Funktion: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
Über Arena
========

$t(common.appNameFull)
--------

 * Entwickelt von: $t(links.openforis)
 * Version: {{version}}
 * Website: $t(links.openforisArenaWebsite)
 * Arena-Videokurse in der FAO eLearning Academy: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Arena-Videokurse auf YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Supportforum: $t(links.supportForum)
 * Arena auf GitHub: $t(links.arenaInGitHub)
 * Arena-R-Skripte auf GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Sprache(n)',
  },
  taxonomy: {
    header: 'Taxonomie',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Taxonomie {{taxonomyName}} löschen?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Taxonomie aus anderer Erhebung klonen',
      sourceSurvey: 'Quellerhebung',
      sourceTaxonomy: 'Quelltaxonomie',
      loadingSurveys: 'Erhebungen werden geladen ...',
      noSurveysAvailable: 'Keine Erhebungen verfügbar',
      selectSurveyFirst: 'Wählen Sie zuerst eine Erhebung aus',
      loadingTaxonomies: 'Taxonomien werden geladen ...',
      noTaxonomiesAvailable: 'In der ausgewählten Erhebung sind keine Taxonomien verfügbar',
    },
    edit: {
      taxonomyListName: 'Name der Taxonomieliste',
      taxaNotImported: 'Nicht importierte Taxa',
      family: 'Familie',
      genus: 'Gattung',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Synonym/lateinisch',
      extraPropsNotDefined: 'Für diese Taxonomie sind keine Zusatzeigenschaften definiert',
      importMissingPublishedTaxa:
        '{{count}} veröffentlichte Taxa wurden in der Importdatei nicht gefunden und unverändert hinter den importierten Taxa belassen. Codes: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} weitere)',
    },
    taxaCount: 'Anzahl der Taxa',
    vernacularNameLabel: 'Bezeichnung des Trivialnamens',
  },
  categoryList: {
    batchImport: 'Kategorien stapelweise importieren (aus ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} Kategorien erfolgreich importiert!
{{insertedCategories}} neu
{{updatedCategories}} aktualisiert`,
    cloneFromAnotherSurvey: {
      title: 'Kategorie aus anderer Erhebung klonen',
      sourceSurvey: 'Quellerhebung',
      sourceCategory: 'Quellkategorie',
      loadingSurveys: 'Erhebungen werden geladen ...',
      noSurveysAvailable: 'Keine Erhebungen verfügbar',
      selectSurveyFirst: 'Wählen Sie zuerst eine Erhebung aus',
      loadingCategories: 'Kategorien werden geladen ...',
      noCategoriesAvailable: 'In der ausgewählten Erhebung sind keine Kategorien verfügbar',
    },
    itemsCount: 'Anzahl der Elemente',
    structure: 'Struktur',
    types: {
      flat: 'Flach',
      hierarchical: 'Hierarchisch',
      reportingData: 'Auswertungsdaten',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Stichprobenpunktdaten',
    },
  },
  categoryEdit: {
    header: 'Kategorie',
    addLevel: 'Ebene hinzufügen',
    categoryName: 'Kategoriename',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    confirmDelete: 'Kategorie {{categoryName}} löschen?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'Die Kategorie ist **leer** und wird gelöscht. Fortfahren?',
    confirmDeleteLevel: 'Kategorieebene „{{levelName}}“ mit allen Elementen löschen?\n$t(common.cantUndoWarning)',
    confirmDeleteItem: `Element löschen?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Element mit allen untergeordneten Elementen löschen?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'In Auswertungsdaten konvertieren',
      confirmMessage: `Diese Kategorie in eine Auswertungsdatenkategorie konvertieren?

Die Ebenen werden in level_1, level_2 ... level_N umbenannt und den Elementen wird die Zusatzeigenschaft „area“ hinzugefügt.`,
    },
    convertToSimpleCategory: {
      confirmMessage: 'Diese Auswertungsdatenkategorie in eine einfache Kategorie konvertieren?',
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: 'In Stichprobenpunktdaten konvertieren',
      confirmMessage: `Diese Kategorie in die Stichprobenpunktdatenkategorie konvertieren?

Die Kategorie wird in „${samplingPointDataCategoryName}“ umbenannt und den Elementen wird die Zusatzeigenschaft „${locationItemExtraDefName}“ hinzugefügt.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'In GeoPackage-Kategorie konvertieren',
      confirmMessage: `Diese Kategorie in eine GeoPackage-Kategorie konvertieren?

Den Elementen wird die Zusatzeigenschaft „${locationItemExtraDefName}“ hinzugefügt.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'In einfache Kategorie konvertieren',
      confirmMessage: `Diese GeoPackage-Kategorie in eine einfache Kategorie konvertieren?

Die Zusatzeigenschaft „${locationItemExtraDefName}“ wird entsperrt und kann wie jede andere Zusatzeigenschaft umbenannt, in ihrem Typ geändert oder gelöscht werden. Ihre Daten bleiben unverändert.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'In einfache Kategorie konvertieren',
      confirmMessage: `Diese Stichprobenpunktdatenkategorie in eine einfache Kategorie konvertieren?

Der Kategoriename wird geleert (Sie müssen einen neuen Namen vergeben), und die Zusatzeigenschaft „${locationItemExtraDefName}“ wird entsperrt. Sie kann dann wie jede andere Zusatzeigenschaft umbenannt, in ihrem Typ geändert oder gelöscht werden. Ihre Daten bleiben unverändert.`,
    },
    geoPackageCategory: 'Diese Kategorie unterstützt Geodaten',
    geoPackageCategoryInfo: `Diese Kategorie besitzt die Zusatzeigenschaft „${locationItemExtraDefName}“, wodurch sie als GeoPackage-Datei exportiert werden kann.`,
    samplingPointDataCategoryType: 'Dies ist die Stichprobenpunktdatenkategorie',
    samplingPointDataCategoryTypeInfo: `Dies ist eine vordefinierte Kategorie für Stichprobenpunktdaten. Sie besitzt die Zusatzeigenschaft „${locationItemExtraDefName}“, wodurch sie als GeoPackage-Datei exportiert werden kann.`,
    samplingPointDataCategoryLocationMissing: `Die Zusatzeigenschaft „${locationItemExtraDefName}“ fehlt`,
    createCategory: {
      menuLabel: 'Kategorie hinzufügen',
      simple: 'Einfache Kategorie',
      otherTypes: 'Weitere Kategorietypen',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Stichprobenpunktdatenkategorie',
      description: 'Vordefinierte Kategorie für Stichprobenpunktdaten mit einem Positionsfeld für jedes Element.',
      message: `Neue Stichprobenpunktdatenkategorie erstellen?

Den Elementen wird die Zusatzeigenschaft „${locationItemExtraDefName}“ hinzugefügt.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Kategorie mit Geodatenunterstützung',
      description:
        'Fügt den Elementen ein Positionsfeld hinzu, damit die Kategorie als GeoPackage-Datei exportiert werden kann.',
      message: `Neue Kategorie mit Geodatenunterstützung erstellen?

Den Elementen wird die Zusatzeigenschaft „${locationItemExtraDefName}“ hinzugefügt.`,
    },
    deleteItem: 'Element löschen',
    level: {
      title: 'Ebene {{levelPosition}}',
      noItemsDefined: 'Keine Elemente definiert',
      selectItemFromPreviousLevel: 'Wählen Sie ein Element der vorherigen Ebene aus',
    },

    importSummary: {
      columns: 'Spalte',
      columnTypeSummary: 'Ebene {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Beschreibung ({{language}})',
      columnTypeLabel: 'Bezeichnung ({{language}})',
      columnType: {
        code: 'Code',
        description: 'Beschreibung',
        label: 'Bezeichnung',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Datentyp',
      title: 'Zusammenfassung des Kategorieimports',
    },
    reportingData: 'Auswertungsdaten',
    exportToGeoPackage: 'Als GeoPackage exportieren',
    exportToGeoPackageSkippedItems: '{{count}} Element(e) ohne gültige Position wurden übersprungen.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Whisp-Analyse erzeugen',
      confirmMessage: `Whisp-Analyse für alle Stichprobenpunkte erzeugen?

- Jeder Stichprobenpunkt mit Positionsangabe wird zur Analyse an Open Foris Whisp gesendet.
- Die Ergebnisse werden mit den Stichprobenpunktdaten kombiniert und in der Kategorie „${samplingPointDataWhispCategoryName}“ gespeichert.
- Falls die Kategorie „${samplingPointDataWhispCategoryName}“ bereits vorhanden ist, wird ihr Inhalt ersetzt.
- Die Analyse läuft im Hintergrund und kann je nach Anzahl der Stichprobenpunkte mehrere Minuten dauern.`,
    },
    templateFor_samplingPointDataImport_csv: 'Vorlage für den Stichprobenpunktdatenimport (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Vorlage für den Stichprobenpunktdatenimport (Excel)',
  },
  extraProp: {
    label: 'Zusatzeigenschaft',
    label_other: 'Zusatzeigenschaften',
    addExtraProp: 'Zusatzeigenschaft hinzufügen',
    dataTypes: {
      geometryPoint: 'Geometriepunkt',
      number: 'Zahl',
      text: 'Text',
    },
    editor: {
      title: '$t(extraProp.label_other) bearbeiten',
      confirmDelete: 'Zusatzeigenschaft „{{name}}“ löschen?',
      confirmSave: `Änderungen an den Definitionen der Zusatzeigenschaften speichern?

  **Warnungen**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Name von {{nameOld}} in {{nameNew}} geändert',
        dataTypeChanged: 'Datentyp von {{dataTypeOld}} in {{dataTypeNew}} geändert',
      },
    },
    name: 'Name der Eigenschaft {{position}}',
    value: 'Wert',
  },
  record: {
    ancestorNotFound: 'Übergeordneter Knoten im Datensatz nicht gefunden',
    keyDuplicate: 'Datensatzschlüssel ist doppelt vorhanden',
    oneOrMoreInvalidValues: 'Mindestens ein Wert ist ungültig',
    uniqueAttributeDuplicate: 'Wert ist doppelt vorhanden',

    attribute: {
      customValidation: 'Ungültiger Wert',
      uniqueDuplicate: 'Wert ist doppelt vorhanden',
      valueInvalid: 'Ungültiger Wert',
      valueRequired: 'Wert erforderlich',
    },
    entity: {
      keyDuplicate: 'Entitätsschlüssel ist doppelt vorhanden',
    },
    nodes: {
      count: {
        invalid: 'Die Anzahl der Knoten {{nodeDefName}} muss genau {{count}} betragen',
        maxExceeded: 'Die Anzahl der Knoten {{nodeDefName}} darf höchstens {{maxCount}} betragen',
        minNotReached: 'Die Anzahl der Knoten {{nodeDefName}} muss mindestens {{minCount}} betragen',
      },
    },
  },

  // ====== Common components
  expressionEditor: {
    and: 'UND',
    or: 'ODER',
    group: 'Gruppe ()',
    var: 'Variable',
    const: 'Konstanter Wert',
    call: 'Funktion',
    operator: 'Operator',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Ursprung des Koordinatenattributs',
      distanceAttribute: 'Entfernungsattribut',
      bearingAttribute: 'Richtungsattribut',
    },
    areaOfInterestEditor: {
      areaOfInterest: 'Interessengebiet',
      areasOfInterestNotDefined:
        'Noch keine Interessengebiete definiert: Definieren Sie diese unter Erhebungsinformationen → Karte',
    },
    coordinateAttribute: 'Koordinatenattribut',
    coordinateAttributeWithPosition: 'Koordinatenattribut {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Erstes Datumsattribut',
      firstTimeAttribute: 'Erstes Uhrzeitattribut',
      secondDateAttribute: 'Zweites Datumsattribut',
      secondTimeAttribute: 'Zweites Uhrzeitattribut',
    },
    error: {
      selectOneVariable: 'Wählen Sie eine Variable aus',
    },

    header: {
      editingExpressionForNodeDefinition: 'Ausdruck „{{qualifier}}“ für „{{nodeDef}}“ bearbeiten',
      editingFunctionForNodeDefinition: 'Funktion „{{functionName}}“ für „{{nodeDef}}“ bearbeiten',
    },

    qualifier: {
      'default-values': 'Standardwert',
      'default-values-apply-if': 'Bedingung für Standardwert',
      'editable-if': 'Bearbeitbarkeitsbedingung',
      'max-count': 'Höchstanzahl',
      'min-count': 'Mindestanzahl',
      'relevant-if': 'Anwendbarkeitsbedingung',
      validations: 'Validierungsregel',
      'validations-apply-if': 'Bedingung der Validierungsregel',
      'visible-if': 'Sichtbarkeit',
    },

    selectAFunction: 'Funktion auswählen',

    valueType: {
      constant: 'Konstante',
      expression: 'Ausdruck',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>`,
    arenaVideoTutorialsInFaoElearningAcademy: `<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>`,
    arenaVideoTutorialsInYouTube: `<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>`,
    arenaInGitHub: `<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>`,
    arenaRScriptsInGitHub: `<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>`,
  },
  aiExpression: {
    title: 'Ausdruck aus Beschreibung erzeugen',
    hint: 'Beschreiben Sie in Alltagssprache, was der Ausdruck bewirken soll. Die KI überträgt dies in die Arena-Syntax. Drücken Sie Strg+Eingabetaste zum Erzeugen.',
    placeholder: 'z. B. Die Baumhöhe muss größer als 0 und kleiner als 200 sein',

    generate: 'Erzeugen',
    generating: 'Wird erzeugt …',
    use: 'Diesen Ausdruck verwenden',
    useAnyway: 'Trotzdem verwenden',
    tryAgain: 'Andere Beschreibung versuchen',
    parseError:
      'Der erzeugte Ausdruck ist syntaktisch nicht fehlerfrei: {{message}}. Sie können ihn trotzdem anwenden und manuell bearbeiten oder die Beschreibung umformulieren.',

    explain: {
      title: 'Diesen Ausdruck erklären',
      thinking: 'Die KI wird um eine Erklärung gebeten …',
      error: 'Erklärung konnte nicht abgerufen werden: {{message}}',
      timeout: 'Die Antwort der KI hat zu lange gedauert. Versuchen Sie es erneut.',
    },
  },
  aiBatch: {
    translateTitle: 'KI: Bezeichnungen übersetzen',
    dataDictionaryTitle: 'KI: Feldbeschreibungen',
    preparing: 'Wird vorbereitet …',
    progress: '{{done}} von {{total}} KI-Anfragen erledigt',
    stop: 'Anhalten',
    stopping: 'Wird angehalten …',
    confirmStop: 'Den KI-Lauf anhalten? Die bisherigen Ergebnisse bleiben erhalten.',
    keepRunning: 'Weiterlaufen lassen',
    stoppedCancelled: 'Nach {{done}} von {{total}} KI-Anfragen angehalten. Die bisherigen Ergebnisse bleiben erhalten.',
    stoppedError:
      'Nach {{done}} von {{total}} KI-Anfragen angehalten ({{message}}). Die bisherigen Ergebnisse bleiben erhalten.',
  },
  aiTranslation: {
    translateButton_one: 'In {{count}} weitere Sprache übersetzen',
    translateButton_other: 'In {{count}} weitere Sprachen übersetzen',
    translateButton: 'In weitere Sprachen übersetzen',

    success_one: 'In {{count}} Sprache übersetzt. Prüfen und speichern Sie die Übersetzung.',
    success_other: 'In {{count}} Sprachen übersetzt. Prüfen und speichern Sie die Übersetzungen.',
    success: 'Übersetzt. Prüfen und speichern Sie die Übersetzung.',

    failed: 'Übersetzung fehlgeschlagen: {{message}}',
    sourceChanged: 'Der Text wurde während der Übersetzung geändert, daher wurde die Übersetzung nicht übernommen.',
  },
  aiActivityLog: {
    title: 'Zusammenfassung des Aktivitätsprotokolls',
    summarizeButton: 'Zusammenfassen',
    thinking: 'Ereignisse werden zusammengeführt und von der KI zusammengefasst …',
    error: 'Zusammenfassung konnte nicht abgerufen werden: {{message}}',
  },
  aiEngine: {
    unavailableTitle: 'Nicht verfügbar',
    unavailable: {
      policyForbids: 'Die KI-Richtlinie der Erhebung erlaubt diesen Anbieter für diese Daten nicht.',
      notAvailable: 'Der ausgewählte KI-Anbieter ist derzeit nicht verfügbar.',
      missingOnThisBrowser: 'Ihr Standardanbieter befindet sich auf einem anderen Computer.',
      notSetUp: 'Es ist kein KI-Anbieter eingerichtet. Fügen Sie einen in Ihren KI-Einstellungen hinzu.',
      invalidAddress:
        'Die Adresse Ihres lokalen KI-Servers ist ungültig (kein Benutzername, kein Passwort, kein ? oder #). Korrigieren Sie sie in Ihren KI-Einstellungen.',
    },
    localAddressInvalid: 'Die Adresse darf keinen Benutzernamen, kein Passwort, kein ? und kein # enthalten.',
    action: {
      retry: 'Erneut versuchen',
      changePolicy: 'KI-Richtlinie der Erhebung ändern',
      openSettings: 'KI-Einstellungen öffnen',
    },
    consent: {
      title: 'Ihren lokalen KI-Server verwenden?',
      destination: 'Anfragen für diese Erhebung werden an {{baseUrl}} ({{location}}) gesendet.',
      destinationNoSurvey: 'Anfragen werden an {{baseUrl}} ({{location}}) gesendet.',
      model: 'Modell: {{modelId}}',
      continue: 'Fortfahren',
      chooseOther: 'Anderen Anbieter wählen',
      sends: 'Gesendet wird: {{what}}.',
      revokeHint: 'Sie haben Arena erlaubt, Anfragen an diesen Server zu senden.',
      revoke: 'Erlaubnis widerrufen',
      revoked: 'Erlaubnis widerrufen. Arena fragt vor der nächsten Anfrage erneut.',
    },
  },
  aiAnalysis: {
    area: 'Analyse',
    empty:
      'Fragen Sie nach den Daten der Erhebung, zum Beispiel „Durchschnittliche Baumhöhe pro Probefläche“. Ich schlage Abfragen vor, die Sie im Explorer öffnen können.',
    mapLayerCard: {
      title: 'Kartenebene {{label}}',
      titleLocation: 'Kartenposition',
      search: 'Suche: {{text}}',
      showOnMap: 'Auf Karte anzeigen',
      missing: 'Diese Ebene ist nicht mehr verfügbar.',
      noPermission: 'Sie können die Karte dieser Erhebung nicht öffnen.',
    },
    queryCard: {
      title: 'Abfrage {{queryId}}',
      columns: 'Spalten',
      filter: 'Filter',
      openInExplorer: 'Im Explorer öffnen',
      showAsChart: 'Als Diagramm anzeigen',
      missing: 'Diese Abfrage ist nicht mehr verfügbar.',
    },
    recordDataNotice: {
      message:
        'Diese Unterhaltung enthält erfasste Daten. Fahren Sie mit einem lokalen KI-Server fort oder beginnen Sie eine neue Unterhaltung.',
      newConversation: 'Neue Unterhaltung',
    },
  },
  aiCleaning: {
    area: 'Bereinigung',
    empty:
      'Fragen Sie mich nach Validierungsfehlern oder verdächtigen Werten. Ich schlage Änderungen an Datensätzen vor; Sie prüfen und übernehmen sie.',
    rowAction: {
      askAssistant: 'Assistenten fragen',
      question: 'Warum ist dieser Wert ungültig, und wie kann ich ihn korrigieren?',
      busy: 'Der Assistent antwortet noch. Warten Sie, bis er fertig ist, oder halten Sie ihn zuerst an.',
    },
    card: {
      empty: '(leer)',
      newErrors: 'Neue Fehler in diesem Datensatz: {{count}}',
      applySelected: 'Ausgewählte übernehmen ({{count}})',
      retryFailed: 'Fehlgeschlagene wiederholen ({{count}})',
      applying: 'Wird übernommen … {{done}} von {{total}}',
      counts: 'Übernommen: {{applied}} · Konflikte: {{conflict}} · Fehlgeschlagen: {{failed}}',
    },
    badge: {
      fixes: 'Behebt den Fehler',
      stillInvalid: 'Weiterhin ungültig',
      noErrors: 'Keine Fehler',
    },
    result: {
      applied: 'Übernommen',
      conflict: 'Nicht übernommen: Der Wert hat sich seit dem Vorschlag geändert',
      failed: 'Fehlgeschlagen: {{message}}',
      skipped: 'Übersprungen',
    },
  },
  aiAssistant: {
    open: 'KI-Assistent',
    title: 'KI-Assistent',
    close: 'Schließen',
    providerChip: {
      answerWith: 'Antworten mit',
      makeDefault: 'Als meinen Standard festlegen',
      manage: 'Anbieter verwalten …',
      none: 'Kein Anbieter · Einen hinzufügen',
      missing: 'Standardanbieter nicht auf diesem Computer',
      removedNotice: 'Der Anbieter dieser Unterhaltung wurde entfernt. Ihr Standardanbieter wird verwendet.',
      chooseAnother: 'Anderen Anbieter wählen',
      defaultFailed: 'Der Standardanbieter konnte nicht geändert werden: {{message}}',
      title: 'KI-Anbieter dieser Unterhaltung: {{name}}',
      isDefault: 'Standard',
    },
    tabs: {
      design: 'Design',
      help: 'Hilfe',
    },
    unavailable: {
      noSurvey: 'Öffnen Sie eine Erhebung, um diesen Bereich zu verwenden.',
      noPermission: 'Sie benötigen die Berechtigung zum Bearbeiten der Erhebung.',
      policy: 'Die KI-Richtlinie der Erhebung erlaubt den konfigurierten KI-Anbieter nicht.',
    },
    menu: {
      label: 'Assistentenmenü',
      newConversation: 'Neue Unterhaltung',
      aiSettings: 'KI-Einstellungen …',
      deleteAll: 'Alle Unterhaltungen löschen …',
    },
    historyTitle: 'Unterhaltungen',
    newConversationTitle: 'Neue Unterhaltung',
    noSuggestions: 'Keine Vorschläge.',
    historyEmpty: 'Keine gespeicherten Unterhaltungen.',
    historyKept:
      'Die letzten {{count}} Unterhaltungen jeder Erhebung bleiben in diesem Browser gespeichert, bis Sie sie löschen.',
    back: 'Zurück',
    deleteAllConfirm:
      'Alle Ihre Unterhaltungen mit dem KI-Assistenten in allen Erhebungen und Bereichen löschen? Dies kann nicht rückgängig gemacht werden.',
    start: {
      suggestions: 'Vorschläge',
      recent: 'Letzte Unterhaltungen',
      seeAll_one: '{{count}} Unterhaltung anzeigen',
      seeAll_other: 'Alle {{count}} Unterhaltungen anzeigen',
      seeAllSuggestions_one: '{{count}} Vorschlag anzeigen',
      seeAllSuggestions_other: 'Alle {{count}} Vorschläge anzeigen',
    },
    searchConversations: 'Unterhaltungen durchsuchen',
    historyNoMatch: 'Keine passende Unterhaltung.',
    deleteConversation: 'Unterhaltung löschen',
    deleteConversationConfirm: 'Diese Unterhaltung löschen? Dies kann nicht rückgängig gemacht werden.',
    discardConfirm: 'Diese vorgeschlagenen Änderungen verwerfen? Sie werden nicht übernommen.',
    deleteConversationFailed: 'Die Unterhaltung konnte nicht gelöscht werden.',
    deleteAllFailed: 'Die Unterhaltungen konnten nicht gelöscht werden.',
    day: {
      today: 'Heute',
      yesterday: 'Gestern',
      earlier: 'Früher',
    },
    sentData: {
      ariaLabel: 'Gesendete Daten: {{label}}',
      questions: {
        label: 'Nur Fragen',
        tooltip: 'Nur Ihre Fragen werden gesendet, mit Auszügen aus dem Arena-Handbuch. Keine Erhebungsinhalte.',
      },
      schema: {
        label: 'Erhebungsdesign',
        tooltip:
          'Das Erhebungsdesign wird gesendet: Entitäten, Attribute, Kategorien und Bezeichnungen. Keine erfassten Daten.',
      },
      data: {
        label: 'Erfasste Daten',
        tooltip: 'Erfasste Daten werden zusammen mit dem Erhebungsdesign gesendet.',
      },
    },
    emptyDesign:
      'Bitten Sie mich, Attribute hinzuzufügen oder Bezeichnungen und Ausdrücke zu schreiben. Ich schlage die Änderungen vor; Sie übernehmen sie.',
    emptyHelp: 'Fragen Sie mich alles zu Open Foris Arena. Ich antworte anhand des Benutzerhandbuchs.',
    placeholder: 'Nachricht eingeben …',
    send: 'Senden',
    stop: 'Anhalten',
    retry: 'Erneut versuchen',
    stopped: 'Angehalten.',
    thinking: 'Überlegung',
    thinkingActive: 'Denkt nach …',
    inMemoryOnly: 'Dieser Browser kann keine Unterhaltungen speichern: Sie gehen beim Neuladen der Seite verloren.',
    context: {
      label: 'Von dieser Unterhaltung genutzter Kontext',
      tokens: '{{used}} Token',
      tokensOfWindow: '{{used}} / {{window}} Token',
      assumed: '(angenommen)',
      nearLimit: 'Nahe am Limit.',
      trimmed: 'Ältere Nachrichten werden nicht mehr an das Modell gesendet.',
    },
    missingTextsBatch: {
      start_one:
        '{{count}} Text fehlt in {{lang}}. Ich übersetze ihn: Sie prüfen die Übersetzung, bevor etwas gespeichert wird.',
      start_other:
        '{{count}} Texte fehlen in {{lang}}. Ich übersetze sie in Stapeln von {{size}}: Das kann einige Minuten dauern. Sie prüfen die Übersetzungen, bevor etwas gespeichert wird.',
      summary: 'Übersetzungen der in {{lang}} fehlenden Texte',
      done_one: '{{count}} Text übersetzt: Prüfen Sie ihn auf der Karte und wenden Sie ihn dann an.',
      done_other: '{{count}} Texte übersetzt: Prüfen Sie sie auf der Karte und wenden Sie sie dann an.',
      failed_one: '{{count}} Text konnte nicht übersetzt werden.',
      failed_other: '{{count}} Texte konnten nicht übersetzt werden.',
      nothing: 'Kein Text zu übersetzen: Die fehlenden Texte sind in keiner anderen Sprache ausgefüllt.',
      categoryStart_one:
        '{{count}} Kategoriebezeichnung fehlt in {{lang}}. Ich übersetze sie: Sie prüfen die Übersetzung, bevor etwas gespeichert wird.',
      categoryStart_other:
        '{{count}} Kategoriebezeichnungen fehlen in {{lang}}. Ich übersetze sie in Stapeln von {{size}}: Das kann einige Minuten dauern. Sie prüfen die Übersetzungen, bevor etwas gespeichert wird.',
      categorySummary: 'Übersetzungen der in {{lang}} fehlenden Kategoriebezeichnungen',
      progressTitle_one: '{{count}} Text wird in {{lang}} übersetzt',
      progressTitle_other: '{{count}} Texte werden in {{lang}} übersetzt',
      categoryProgressTitle_one: '{{count}} Kategoriebezeichnung wird in {{lang}} übersetzt',
      categoryProgressTitle_other: '{{count}} Kategoriebezeichnungen werden in {{lang}} übersetzt',
      minutesLeft: 'noch etwa {{minutes}} Min.',
      lessThanMinuteLeft: 'noch weniger als eine Minute',
    },
    tools: {
      survey_getOverview: 'Erhebungsstruktur gelesen',
      nodeDef_get: '{{name}} nachgeschlagen',
      nodeDef_search: 'Nach „{{text}}“ gesucht',
      survey_getValidation: 'Designfehler geprüft',
      view_getCurrent: 'Aktuelle Ansicht geprüft',
      conversation_setTitle: 'Unterhaltung benannt',
      expression_check: 'Einen Ausdruck geprüft',
      nodeDef_proposeCreate: 'Neue Elemente vorbereitet',
      nodeDef_proposeUpdate: 'Eigenschaftsänderungen vorbereitet',
      labels_proposeSet: 'Bezeichnungen vorbereitet',
      missingTexts_translate: 'Fehlende Texte in {{name}} übersetzt',
      missingTexts_translateRunning: 'Fehlende Texte in {{name}} werden übersetzt',
      categoryItemLabels_translate: 'Fehlende Kategoriebezeichnungen in {{name}} übersetzt',
      categoryItemLabels_translateRunning: 'Fehlende Kategoriebezeichnungen in {{name}} werden übersetzt',
      expressions_proposeSet: 'Ausdrücke vorbereitet',
      survey_listMissingTexts: 'Fehlende Texte aufgelistet',
      categories_list: 'Kategorien aufgelistet',
      taxonomies_list: 'Taxonomien aufgelistet',
      docs_search: 'Im Handbuch nach „{{query}}“ gesucht',
      query_listEntities: 'Entitäten aufgelistet',
      category_findItems: 'Kategorieelemente nachgeschlagen',
      query_propose: 'Eine Abfrage vorbereitet',
      map_proposeLayer: 'Eine Kartenebene vorbereitet',
      query_count: 'Zeilen einer Abfrage gezählt',
      query_run: 'Eine Abfrage ausgeführt',
      records_countByStep: 'Datensätze nach Schritt gezählt',
      records_countOverTime: 'Datensätze im Zeitverlauf gezählt',
      validation_summarize: 'Validierungsfehler zusammengefasst',
      validation_list: 'Validierungsfehler aufgelistet',
      record_getValues: 'Datensatzwerte gelesen',
      records_proposeEdits: 'Änderungen an Datensätzen vorbereitet',
      categoryItems_listMissingLabels: 'Zu übersetzende Kategoriebezeichnungen aufgelistet',
      categoryItemLabels_proposeSet: 'Kategoriebezeichnungen vorbereitet',
      default: 'Ein Werkzeug verwendet',
      failed: 'Fehlgeschlagen',
      interrupted: 'Unterbrochen',
    },
    card: {
      title: 'Vorgeschlagene Änderungen',
      stale: 'Die Erhebung hat sich seit diesem Vorschlag geändert.',
      reason: {
        nodeDefMissing: 'Dieses Attribut oder diese Entität existiert nicht mehr.',
        valueChanged: 'Der aktuelle Wert unterscheidet sich von dem, von dem dieser Vorschlag ausging.',
        parentMissing: 'Die übergeordnete Entität existiert nicht mehr.',
        nameTaken: 'Ein anderes Attribut oder eine andere Entität verwendet diesen Namen bereits.',
        alreadyExists: 'Dieses Attribut oder diese Entität existiert bereits.',
        refMissing: 'Die zuzuweisende Kategorie oder Taxonomie existiert nicht mehr.',
        itemMissing: 'Dieses Kategorieelement existiert nicht mehr.',
        surveyDirty: 'Die Erhebung enthält eine nicht gespeicherte Änderung.',
        surveyChanged: 'Inzwischen wurde eine andere Erhebung geöffnet.',
        dependencyNotApplied: 'Sie hängt von einer Änderung ab, die nicht übernommen wurde.',
        notSupported: 'Diese Art von Änderung kann hier nicht übernommen werden.',
        missingResult: 'Der Server hat für diese Änderung nicht geantwortet.',
      },
      applySelected: 'Ausgewählte übernehmen',
      discard: 'Verwerfen',
      discarded: 'Verworfen.',
      applyFailed: 'Die Änderungen konnten nicht übernommen werden: {{message}}',
      discardFailed: 'Der Vorschlag konnte nicht verworfen werden: {{message}}',
      saveCurrentEditFirst: 'Speichern oder verwerfen Sie zuerst Ihre aktuelle Bearbeitung.',
      empty: '(leer)',
      yes: 'Ja',
      no: 'Nein',
      newItem: 'Neu: {{type}}',
      categoryItem: 'Element {{ref}} ({{level}})',
      replaces: 'Ersetzt',
      kind: {
        label: 'Bezeichnung',
        description: 'Beschreibung',
      },
      changes_one: '{{count}} Änderung',
      changes_other: '{{count}} Änderungen',
      more: '+ {{count}} weitere',
      reviewAll: 'Alle prüfen ({{count}})',
      applyAll: 'Alle übernehmen',
      applySelectedCount: 'Ausgewählte übernehmen ({{count}})',
      confirm: {
        title: '„Alle übernehmen“ bestätigen',
        text: 'Sie haben die Prüfung nicht geöffnet. Zu übernehmende Änderungen: {{count}}',
        review: 'Zuerst prüfen',
        apply: 'Übernehmen ({{count}})',
        cancel: 'Abbrechen',
      },
      behaviourUnselected:
        'Änderungen an Ausdrücken oder Eigenschaften sind erst nach Ihrer Prüfung ausgewählt: {{count}}',
      review: {
        title: 'Vorgeschlagene Änderungen prüfen',
        search: 'Änderungen durchsuchen',
        groupBy: 'Gruppieren nach',
        byEntity: 'Entität',
        byField: 'Änderung',
        show: 'Anzeigen',
        groups: 'Gruppen',
        all: 'Alle ({{count}})',
        selected: 'Ausgewählt ({{count}})',
        conflicts: 'Konflikte ({{count}})',
        allChanges: 'Alle Änderungen',
        item: 'Element',
        change: 'Änderung',
        original: 'Original',
        current: 'Aktuell',
        proposed: 'Vorgeschlagen',
        status: 'Status',
        selectShown: 'Angezeigte Änderungen auswählen',
        selectGroup: '{{name}} auswählen',
        selectedOf: '{{selected}} von {{total}} ausgewählt',
        noMatch: 'Keine passenden Änderungen.',
        close: 'Schließen',
        discardAll: 'Alle verwerfen',
        categoryGroup: 'Kategorie {{name}}',
      },
      label: 'Bezeichnung ({{lang}})',
      description: 'Beschreibung ({{lang}})',
      status: {
        applied: 'Übernommen',
        conflict: 'Konflikt',
        failed: 'Fehlgeschlagen',
        skipped: 'Übersprungen',
      },
      props: {
        name: 'Name',
        key: 'Schlüssel',
        multiple: 'Mehrfach',
        readOnly: 'Schreibgeschützt',
        categoryUuid: 'Kategorie',
        taxonomyUuid: 'Taxonomie',
      },
      expressionProps: {
        defaultValues: 'Standardwerte',
        applicable: 'Relevant, wenn',
        validations: 'Validierungen',
        visibleIf: 'Sichtbar, wenn',
        editableIf: 'Bearbeitbar, wenn',
      },
    },
    issues: {
      typeNotAllowed: 'Der Assistent kann keine Elemente vom Typ {{type}} erstellen.',
      parentNotFound: 'Es gibt keine Entität mit dem Namen {{name}}.',
      parentNotEntity: '{{name}} ist keine Entität.',
      entityUnderTable: 'Zu {{name}} kann keine Entität hinzugefügt werden, da es als Tabelle angezeigt wird.',
      nodeDefNotFound: 'Es gibt kein Element mit dem Namen {{name}}.',
      languageNotInSurvey: 'Die Erhebung hat keine Sprache {{lang}}.',
      entityMultipleChange: 'Ändern Sie „mehrfach“ einer Entität im Formular-Designer.',
      multipleWithDefaultValues: 'Ein Attribut mit Standardwerten kann nicht mehrfach sein.',
      multipleNotAllowed: 'Die Einstellung „mehrfach“ von {{name}} kann für diesen Elementtyp nicht verwendet werden.',
      multipleEditDisabled:
        'Die Einstellung „mehrfach“ von {{name}} kann nicht geändert werden (veröffentlicht, Schlüssel, schreibgeschützt oder in einer Tabelle).',
      keyNotAllowed: '{{name}} kann kein Schlüsselattribut sein.',
      keyEditDisabled:
        '{{name}} kann nicht zum Schlüssel gemacht oder davon entfernt werden (mehrfach, oder die Höchstzahl an Schlüsseln ist erreicht).',
      duplicateOperation: 'Dieselbe Eigenschaft von {{name}} wird zweimal geändert.',
      singleExpressionOnly: 'Diese Eigenschaft akzeptiert nur einen Ausdruck.',
      expressionEmpty: 'Ein Ausdruck ist leer.',
      rootEntity: 'Die Stammentität kann vom Assistenten nicht geändert werden.',
      categoryNotFound: 'Es gibt keine Kategorie {{name}}.',
      refEditDisabled:
        '{{name}} kann keine andere Kategorie oder Taxonomie erhalten (veröffentlicht, oder ein anderes Code-Attribut hängt davon ab).',
      refHasParentCode:
        '{{name}} hängt von einem übergeordneten Code-Attribut ab, daher kann seine Kategorie hier nicht geändert werden. Ändern Sie sie im Designer.',
      nodeDefInvalid: '{{name}} wäre nach diesen Änderungen ungültig, daher wird keine seiner Änderungen übernommen.',
      expressionInvalid: 'Ungültiger Ausdruck: {{text}}',
    },
  },
  aiPolicy: {
    dataClass: {
      schema: 'das Erhebungsdesign',
      data: 'erfasste Daten',
    },
    hostingClass: {
      onDevice: 'dieses Gerät',
      orgHosted: 'den Organisationsserver',
      cloud: 'die Cloud',
      unknown: 'einen unbekannten KI-Dienst',
    },
    level: {
      off: 'Aus',
      onDevice: 'Auf diesem Gerät',
      orgHosted: 'Organisationsserver',
      cloud: 'Cloud',
    },
    blocked: {
      schema: {
        off: 'Die KI-Richtlinie dieser Erhebung erlaubt keine KI für das Erhebungsdesign.',
        onDevice: 'Die KI-Richtlinie dieser Erhebung beschränkt das Erhebungsdesign auf dieses Gerät.',
        orgHosted: 'Die KI-Richtlinie dieser Erhebung beschränkt das Erhebungsdesign auf den Organisationsserver.',
      },
      data: {
        off: 'Die KI-Richtlinie dieser Erhebung erlaubt keine KI für erfasste Daten.',
        onDevice: 'Die KI-Richtlinie dieser Erhebung beschränkt erfasste Daten auf dieses Gerät.',
        orgHosted: 'Die KI-Richtlinie dieser Erhebung beschränkt erfasste Daten auf den Organisationsserver.',
      },
    },
    blockedByInstance: {
      schema: 'Diese Arena-Instanz erlaubt nicht, das Erhebungsdesign an diesen KI-Dienst zu senden.',
      data: 'Diese Arena-Instanz erlaubt nicht, erfasste Daten an diesen KI-Dienst zu senden.',
    },
    openPolicyTab: 'KI-Richtlinie öffnen',
  },
  aiDataLocation: {
    cloud: 'Cloud',
    cloudWithProvider: 'Cloud · {{provider}}',
    orgHosted: 'Organisationsserver',
    onDevice: 'Auf diesem Gerät',
    onDeviceWithEngine: 'Auf diesem Gerät · {{engine}}',
    orgHostedWithEngine: 'Organisationsserver · {{engine}}',
    ariaLabel: 'Daten werden verarbeitet von: {{location}}',
    modelTitle: '{{location}} ({{model}})',
  },
}
