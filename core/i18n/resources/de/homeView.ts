export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Keine aktive Erhebung ausgewählt</title>
      <p><label>Wählen Sie eine Erhebung aus der</label><linkToSurveys>Erhebungsliste</linkToSurveys> aus oder <linkToNewSurvey>erstellen Sie eine neue</linkToNewSurvey></p>`,
    activeUsers: 'Aktive Benutzer',
    activityLog: {
      title: 'Aktivitätsprotokoll',
      size: 'Größe des $t(homeView:dashboard.activityLog.title): {{size}}',
      loadError: 'Aktivitäten konnten nicht geladen werden.',
      empty: 'Noch keine Aktivitäten.',
    },
    exportWithData: 'Export + Daten (Sicherung)',
    exportWithDataNoActivityLog: 'Export + Daten (OHNE Aktivitätsprotokoll)',
    exportWithDataNoResultAttributes: 'Export + Daten (OHNE Ergebnisattribute)',
    surveyPropUpdate: {
      main: `<title>Willkommen bei Arena</title>

        <p>Legen Sie zuerst den <strong>Namen</strong> und die <strong>Bezeichnung</strong> der Erhebung fest.</p>

        <p>Klicken Sie unten auf <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon> oder auf den Erhebungsnamen: <basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Wenn Name und Bezeichnung stimmen, erstellen Sie das erste Attribut unter
        <linkWithIcon>Erhebung \u003E Formulardesigner</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>Erstellen Sie das erste Attribut von {{surveyName}}</title>

        <p>Öffnen Sie <linkWithIcon>Erhebung \u003E Formulardesigner</linkWithIcon></p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Speichernutzung',
      availableSpace: 'Verfügbar ({{size}})',
      usedSpace: 'Verwendet ({{size}})',
      usedSpaceOutOf: `{{percent}} % verwendet ({{used}} von {{total}})`,
    },
    storageSummaryDb: {
      title: 'Speichernutzung (Datenbank)',
    },
    storageSummaryFiles: {
      title: 'Speichernutzung (Dateien)',
    },
    samplingPointDataCompletion: {
      title: 'Vollständigkeit der Stichprobenpunktdaten',
      totalItems: 'Elemente insgesamt: {{totalItems}}',
      remainingItems: 'Verbleibende Elemente',
    },
    kpi: {
      records: 'Datensätze',
      contributors: 'Mitwirkende',
      storage: 'Speicher',
      expandDetails: 'Details anzeigen',
      collapseDetails: 'Details ausblenden',
    },
    recordsCard: {
      total: 'Im ausgewählten Zeitraum hinzugefügte Datensätze',
      byStep: 'Nach Arbeitsschritt (gesamter Zeitraum)',
    },
    contributorsCard: {
      active: 'Aktive Mitwirkende im ausgewählten Zeitraum: {{count}}',
    },
    map: {
      title: 'Karte',
      allOwners: 'Alle Eigentümer',
    },
    step: {
      entry: 'Datenerfassung',
      cleansing: 'Datenbereinigung',
      analysis: 'Datenanalyse',
    },
    // records' summary
    recordsByUser: 'Datensätze nach Benutzer',
    recordsAddedPerUserWithCount: 'Hinzugefügte Datensätze pro Benutzer (insgesamt {{totalCount}})',
    dailyRecordsByUser: 'Tägliche Datensätze nach Benutzer',
    totalRecords: 'Datensätze insgesamt',
    selectUsers: 'Benutzer auswählen ...',
    noRecordsAddedInSelectedPeriod: 'Im ausgewählten Zeitraum wurden keine Datensätze hinzugefügt',
  },
  surveyDeleted: 'Erhebung {{surveyName}} wurde gelöscht',
  landing: {
    openDashboard: 'Dashboard öffnen',
  },
  surveyInfo: {
    basic: 'Grundinformationen',
    branding: {
      title: 'Erscheinungsbild',
      primaryColor: 'Primärfarbe',
      titleFontSize: 'Schriftgröße des Titels',
      descriptionFontSize: 'Schriftgröße der Beschreibung',
      fontSizePreset: {
        small: 'Klein',
        default: 'Standard',
        large: 'Groß',
      },
      surveyLogo1: 'Erhebungslogo 1',
      surveyLogo2: 'Erhebungslogo 2',
      surveyLogo3: 'Erhebungslogo 3',
      landingBackground: 'Hintergrundbild der Startseite',
      uploadLogo: 'Bild hochladen',
      logoFileFormatHint: 'PNG, JPEG, WebP oder SVG (max. {{maxMb}} MB)',
      logoFileTooLarge: 'Das Logobild darf höchstens {{maxMb}} MB groß sein',
      preview: 'Vorschau',
      backgroundFileTooLarge: 'Das Hintergrundbild darf höchstens {{maxMb}} MB groß sein',
      invalidPrimaryColor: 'Gültige Farbe im Format #RRGGBB eingeben oder leer lassen',
      invalidSaveBlocked:
        'Beheben Sie ungültige Felder des Erscheinungsbilds, bevor Sie die Erhebungsinformationen speichern',
      imageLoadError: 'Bild „{{name}}“ konnte nicht geladen werden. Löschen Sie es und laden Sie ein neues hoch.',
      imageLoadErrorReadOnly: 'Bild „{{name}}“ konnte nicht geladen werden',
      downloadImage: 'Zum Herunterladen des Bildes klicken',
    },
    configuration: {
      title: 'Konfiguration',
      filesTotalSpace: 'Gesamtspeicher für Dateien (GB)',
    },
    confirmDeleteCycleHeader: 'Diesen Zyklus löschen?',
    confirmDeleteCycle: `Möchten Sie Zyklus {{cycle}} wirklich löschen?\n\n$t(common.cantUndoWarning)\n\n
Mit diesem Zyklus verknüpfte Datensätze werden gelöscht.`,
    cycleForArenaMobile: 'Zyklus für Arena Mobile',
    keepNonApplicableValues: 'Werte nicht relevanter Attribute beibehalten',
    keepNonApplicableValuesInfo: `Wenn die Option deaktiviert ist (Standard), werden bei der Datenerfassung die Werte nicht mehr relevanter Attribute nach Bestätigung durch den Benutzer gelöscht.
Wenn die Option aktiviert ist, bleiben diese Werte im Datensatz erhalten, auch wenn die Attribute nicht mehr relevant sind.`,
    deleteActivityLog: 'Aktivitätsprotokoll leeren',
    deleteActivityLogConfirm: {
      headerText: 'ALLE Aktivitätsprotokolldaten dieser Erhebung löschen?',
      message: `
  - ALLE Aktivitätsprotokolldaten der Erhebung **{{surveyName}}** werden gelöscht;\n\n
  - der von der Erhebung belegte Datenbankspeicher wird reduziert;\n\n
  - die Eingabedaten der Erhebung bleiben unverändert;\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Geben Sie zur Bestätigung den Namen dieser Erhebung ein:',
    },
    fieldManualLink: 'Link zum Feldhandbuch',
    editInfo: 'Informationen bearbeiten',
    map: 'Karte',
    viewInfo: 'Informationen anzeigen',

    areasOfInterest: {
      title: 'Interessengebiete',
      info: 'Polygone (GeoJSON, WGS84-Koordinaten), die von den Ausdrucksfunktionen geoDistanceToAOIBoundary (Abstand zur Gebietsgrenze) und geoAOIContaining (Gebiet, das einen Standort enthält) verwendet werden, auch offline in Arena Mobile. In den Ausdrücken wird der Name des Gebiets verwendet.',
      name: 'Name',
      polygons: 'Polygone',
      vertices: 'Stützpunkte',
      invalidFile: 'Die Datei enthält kein gültiges Polygon im GeoJSON-Format mit WGS84-Koordinaten',
      confirmDelete: 'Möchten Sie dieses Interessengebiet wirklich löschen?',
      showAllOnMap: 'Alle auf der Karte anzeigen',
      editor: {
        title: 'Interessengebiet',
      },
    },

    preloadedMapLayers: {
      enabledMessage: 'Vorgeladene Kartenebenen aktiviert',
      title: 'Vorgeladene Kartenebenen',
      confirmDelete: 'Möchten Sie diese vorgeladene Kartenebene wirklich löschen?',
      editor: {
        title: 'Vorgeladene Kartenebene',
      },
    },

    surveyDocLayout: {
      tabTitle: 'Dokumentlayout',
      title: 'Dokumentbilder',
      layoutOptions: {
        title: 'Layoutoptionen',
        headerOnFirstPageOnly: 'Kopfzeile nur auf der ersten Seite',
        pageNumbering: 'Seitennummerierung',
      },
      documentPlace: 'Position',
      documentPlaceValues: {
        header: 'Kopfzeile',
        footer: 'Fußzeile',
      },
      applyIf: 'Anwenden, wenn Bedingung erfüllt ist',
      confirmDelete: 'Möchten Sie dieses Dokumentbild wirklich löschen?',
      editor: {
        title: 'Dokumentbild',
      },
    },

    preferredLanguage: 'Bevorzugte Sprache',
    sampleBasedImageInterpretation: 'Stichprobenbasierte Bildinterpretation',
    sampleBasedImageInterpretationEnabled: 'Stichprobenbasierte Bildinterpretation aktiviert',
    security: {
      title: 'Sicherheit',
      publishToApply: 'Änderungen an diesen Optionen werden mit der Veröffentlichung der Erhebung wirksam.',
      dataEditorViewNotOwnedRecordsAllowed: 'Datenerfasser dürfen fremde Datensätze anzeigen',
      dataAnalystViewNotOwnedRecordsAllowed: 'Datenanalysten dürfen fremde Datensätze anzeigen',
      visibleInMobile: 'In Arena Mobile sichtbar',
      allowRecordsDownloadInMobile: 'Herunterladen von Datensätzen vom Server in Arena Mobile zulassen',
      allowRecordsUploadFromMobile: 'Hochladen von Datensätzen aus Arena Mobile auf den Server zulassen',
      allowRecordsWithErrorsUploadFromMobile:
        'Hochladen von Datensätzen mit Validierungsfehlern aus Arena Mobile auf den Server zulassen',
      notifyAdminsOnRecordsUploadFromMobile:
        'Erhebungsadministratoren per E-Mail benachrichtigen, wenn Datensätze aus Arena Mobile hochgeladen werden',
      notifyAdminsOnRecordsUploadFromMobileInfo:
        'Wenn aktiviert, erhält jeder Erhebungsadministrator eine E-Mail mit den aus Arena Mobile hochgeladenen Datensätzen (Schlüsselwerte, Ersteller, Datumsangaben, Validierung und UUID).',
      formPreviewForDataEntryUsers: 'Datenerfassern die Vorschau des unveröffentlichten Formularentwurfs erlauben',
      formPreviewForDataEntryUsersInfo:
        'Benutzer, die Daten erfassen, aber die Erhebung nicht bearbeiten dürfen, sehen in der Datensatzliste eine Schaltfläche zur Formularvorschau. Damit können sie das Formular mit den neuesten unveröffentlichten Änderungen testen (z. B. für Abnahmetests). In der Vorschau eingegebene Daten werden nicht gespeichert.',
      allowRecordsMergeWithSameKeys:
        'Zusammenführen von Datensätzen mit denselben Schlüsseln zulassen (z. B. auf verschiedenen Arena-Mobile-Geräten erstellte Datensätze)',
    },
    srsPlaceholder: 'Code oder Bezeichnung eingeben',
    unpublish: 'Veröffentlichung aufheben und Daten löschen',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Möchten Sie die Veröffentlichung dieser Erhebung wirklich aufheben?',
      unpublishWarning: `Beim Aufheben der Veröffentlichung von **{{surveyName}}** werden alle zugehörigen Daten gelöscht.\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Geben Sie zur Bestätigung den Namen dieser Erhebung ein:',
    },
    userExtraProps: {
      title: 'Zusätzliche Benutzereigenschaften',
      info: `Zusätzliche Eigenschaften, die jedem mit der Erhebung verknüpften Benutzer zugewiesen werden können.
Diese Eigenschaften können in Standardwerten, Validierungsregeln und Relevanzausdrücken verwendet werden.
Beispiel: *userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Möchten Sie diese Erhebung wirklich löschen?',
    deleteWarning: `Beim Löschen der Erhebung **{{surveyName}}** werden alle zugehörigen Daten gelöscht.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Geben Sie zur Bestätigung den Namen dieser Erhebung ein:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Aktivieren',
  },
  collectImportReport: {
    excludeResolvedItems: 'Gelöste Elemente ausschließen',
    expression: 'Ausdruck',
    resolved: 'Gelöst',
    exprType: {
      applicable: '$t(nodeDefEdit:advancedProps.relevantIf)',
      codeParent: 'Übergeordneter Code',
      defaultValue: 'Standardwert',
      requiredIf: 'Erforderlich, wenn',
      validationRule: 'Validierungsregel',
    },
    title: 'Collect-Importbericht',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Hinzugefügte Datensätze in den letzten:',
    fromToPeriod: 'von {{from}} bis {{to}}',
    record: '{{count}} Datensatz',
    record_other: '{{count}} Datensätze',
    week: '{{count}} Woche',
    week_other: '{{count}} Wochen',
    month: '{{count}} Monat',
    month_other: '{{count}} Monate',
    year: '{{count}} Jahr',
    year_other: '{{count}} Jahre',
  },
}
