export default {
  charts: {
    downloadToPng: 'Diagramm als PNG herunterladen',
    warning: {
      selectOneDimensionAndOneMeasure: 'Wählen Sie eine Dimension und eine Kennzahl aus, um das Diagramm anzuzeigen',
      selectAtLeast2NumericAttributes: 'Wählen Sie zwei numerische Attribute aus, um das Diagramm anzuzeigen',
      tooManyItemsToShowChart: `Zu viele Elemente zur Anzeige des Diagramms;
es werden höchstens {{maxItems}} Elemente erwartet.
Verfeinern Sie die Abfrage (z. B. durch einen Filter), um die Anzahl zu verringern.
`,
      sampleRandomOnly:
        'Zufallsstichprobe mit {{sampleSize}} von {{totalCount}} Elementen wird angezeigt (keine Ausreißer gefunden).',
      sampleWithOutliers:
        '{{sampleSize}} von {{totalCount}} Elementen werden angezeigt: {{outliersCount}} Ausreißer und eine Zufallsstichprobe von {{randomCount}} der übrigen Elemente.',
      sampleOutliersOnly: 'Die {{sampleSize}} extremsten Ausreißer von {{totalCount}} Elementen werden angezeigt.',
    },
    type: {
      area: 'Flächendiagramm',
      bar: 'Balkendiagramm',
      line: 'Liniendiagramm',
      pie: 'Kreisdiagramm',
      scatter: 'Streudiagramm',
    },
  },
  dataQuery: {
    aggregateFunctionsOf: 'Aggregatfunktionen von {{name}}',
    ai: {
      button: 'KI fragen',
      buttonTitle: 'Abfrage mithilfe von KI aus einer Beschreibung erzeugen',
      title: 'Abfrage mit KI erzeugen',
      hint: 'Beschreiben Sie die gewünschten Daten. Die KI wählt Entität, Attribute (oder Dimensionen und Kennzahlen), Filter und Sortierung aus. Anschließend können Sie die erzeugte Abfrage prüfen und in der Abfrageverwaltung speichern.',
      placeholder: 'z. B. Anzahl der Bäume nach Art gruppiert',
      generate: 'Erzeugen',
      generating: 'Wird erzeugt …',
      replaceQueryConfirmMessage: 'Aktuelle Abfrage durch die erzeugte Abfrage ersetzen?',
      suggestSummary: 'Name und Beschreibung vorschlagen',
      suggestSummaryFailed: 'Name und Beschreibung der Abfrage konnten nicht vorgeschlagen werden: {{message}}',
      suggestSummaryTitle:
        'KI verwenden, um anhand der aktuellen Auswahl Name, Bezeichnung und Beschreibung der Abfrage vorzuschlagen',
      generatedSuccessfully:
        'Abfrage erzeugt: {{explanation}} Prüfen Sie das Ergebnis und speichern Sie die Abfrage, wenn Sie sie behalten möchten.',
    },
    customAggregateFunctions: 'Benutzerdefinierte Aggregatfunktionen …',
    deleteConfirmMessage: 'Abfrage „{{name}}“ löschen?',
    displayType: {
      chart: 'Diagramm',
      table: 'Tabelle',
    },
    manageQueries: 'Abfragen verwalten',
    mode: {
      aggregate: 'Aggregiert',
      raw: 'Rohdaten',
      rawEdit: 'Rohdaten bearbeiten',
    },
    replaceQueryConfirmMessage: 'Aktuelle Abfrage durch die ausgewählte ersetzen?',
    showCodes: 'Codes anzeigen',
    showTotalAndPercentage: 'Gesamtsumme und Prozentsatz anzeigen',
    total: 'Gesamt',
    viewOptions: 'Ansicht',
  },
  editSelectedRecord: 'Ausgewählten Datensatz bearbeiten',
  filterAttributeTypes: 'Attributtypen filtern',
  filterAttributes: 'Attribute filtern',
  filterMessages: 'Meldungen filtern',
  messageTypeFilter: {
    valueRequired: 'Erforderlicher Wert',
    valueInvalid: 'Ungültiger Wert',
    uniqueDuplicate: 'Doppelter Wert',
    customValidation: 'Benutzerdefinierte Validierung',
    entityKeyDuplicate: 'Doppelter Entitätsschlüssel',
    recordKeyDuplicate: 'Doppelter Datensatzschlüssel',
    nodesCount: 'Knotenanzahl',
  },
  filterRecords: {
    buttonTitle: 'Datensätze filtern',
    expressionEditorHeader: 'Ausdruck zum Filtern von Datensätzen',
  },
  invalidRecord: 'Ungültiger Datensatz',
  nodeDefsSelector: {
    hide: 'Auswahl der Knotendefinitionen ausblenden',
    show: 'Auswahl der Knotendefinitionen anzeigen',
    nodeDefFrequency: `{{nodeDefLabel}} (Häufigkeit)`,
    searchPlaceholder: 'Variable nach Name suchen',
  },
  records: {
    clone: 'Klonen',
    confirmDeleteRecord: `Datensatz „{{keyValues}}“ löschen?`,
    confirmDeleteSelectedRecord_one: `Ausgewählten Datensatz löschen?`,
    confirmDeleteSelectedRecord_other: `Die {{count}} ausgewählten Datensätze löschen?`,
    confirmMergeSelectedRecords: `### Ausgewählte Datensätze zu einem Datensatz zusammenführen?

- Der Quelldatensatz wird mit dem Zieldatensatz zusammengeführt:
  - Quelle: [{{sourceRecordKeys}}], geändert {{sourceRecordModifiedDate}};
  - Ziel: [{{targetRecordKeys}}], geändert {{targetRecordModifiedDate}};

- Vor der Zusammenführung wird eine Vorschau des Ergebnisses angezeigt;

- Nach der Bestätigung wird **DER QUELLDATENSATZ GELÖSCHT**`,
    confirmUpdateRecordsStep: `Die {{count}} ausgewählten Datensätze von {{stepFrom}} nach {{stepTo}} verschieben?`,
    confirmUpdateRecordOwner: `Eigentümer des ausgewählten Datensatzes in {{ownerName}} ändern?`,
    confirmValidateAllRecords: `Alle Datensätze erneut validieren?\n\nDies kann mehrere Minuten dauern.`,
    deleteRecord: 'Datensatz löschen',
    demoteAllRecordsFromAnalysis: 'Analyse -> Bereinigung',
    demoteAllRecordsFromCleansing: 'Bereinigung -> Erfassung',
    editRecord: 'Datensatz bearbeiten',
    exportList: 'Liste exportieren',
    exportData: 'Daten exportieren',
    exportDataSummary: 'Datenzusammenfassung exportieren',
    exportSelectedRecordsArenaFormat: 'Ausgewählte Datensätze exportieren (Arena-Format)',
    exportRecordDocx: 'Datensatz exportieren (Word)',
    filterPlaceholder: 'Nach Schlüsseln oder Eigentümer filtern',
    merge: {
      label: 'Zusammenführen',
      confirmLabel: 'Zusammenführung bestätigen',
      confirmTooManyDifferencesMessage: `**Zu viele Unterschiede**.
Die Datensätze scheinen sich stark zu unterscheiden.
Bei der Zusammenführung werden viele Attribute (~{{nodesUpdated}}) aktualisiert.
Mit der Vorschau fortfahren?`,
      noChangesWillBeApplied: `Auf den Zieldatensatz würden keine Änderungen angewendet.
Die Zusammenführung kann nicht durchgeführt werden.`,
      performedSuccessfullyMessage: 'Datensätze erfolgreich zusammengeführt!',
      previewTitle: 'Vorschau der Zusammenführung (Datensatz {{keyValues}})',
    },
    noRecordsAdded: 'Keine Datensätze hinzugefügt',
    noRecordsAddedForThisSearch: 'Keine Datensätze gefunden',
    noSelectedRecordsInStep: 'Keine ausgewählten Datensätze im Schritt {{step}}',
    owner: 'Eigentümer',
    promoteAllRecordsToAnalysis: 'Bereinigung -> Analyse',
    promoteAllRecordsToCleansing: 'Erfassung -> Bereinigung',
    step: 'Schritt',
    updateRecordsStep: 'Datensatzschritt aktualisieren',
    validateAll: 'Alle validieren',
    formPreview: 'Formularvorschau',
    formPreviewInfo:
      'Vorschau des unveröffentlichten Formularentwurfs; in der Vorschau eingegebene Daten werden nicht gespeichert',
    viewRecord: 'Datensatz anzeigen',
  },
  recordsClone: {
    title: 'Datensätze klonen',
    fromCycle: 'Aus Zyklus',
    toCycle: 'In Zyklus',
    confirmClone: `Datensätze von Zyklus {{cycleFrom}} nach Zyklus {{cycleTo}} klonen?\n
(Es werden nur Datensätze geklont, die noch nicht in Zyklus {{cycleTo}} vorhanden sind.)`,
    startCloning: 'Klonen starten',
    cloneComplete: 'Klonen abgeschlossen. {{recordsCloned}} Datensätze von {{cycleFrom}} nach {{cycleTo}} geklont',
    error: {
      cycleToMissing: 'Wählen Sie „In Zyklus“ aus',
      cycleToMustBeDifferentFromCycleFrom: '„In Zyklus“ muss sich von „Aus Zyklus“ unterscheiden',
    },
    source: {
      label: 'Quelle',
      allRecords: 'Alle Datensätze in Zyklus {{cycleFrom}}, die noch nicht in Zyklus {{cycleTo}} vorhanden sind',
      selectedRecords: 'Nur die {{selectedRecordsCount}} ausgewählten Datensätze',
    },
  },
  recordDeleted_one: `Datensatz erfolgreich gelöscht!`,
  recordDeleted_other: `{{count}} Datensätze erfolgreich gelöscht!`,
  recordsSource: {
    label: 'Quelle',
  },
  recordsUpdated: '{{count}} Datensätze erfolgreich aktualisiert!',
  rowNum: 'Zeilennr.',
  selectedAttributes: 'Ausgewählte Attribute:',
  selectedDimensions: 'Ausgewählte Dimensionen',
  selectedMeasures: 'Ausgewählte Kennzahlen',
  sortableItemsInfo: 'Zum Sortieren per Drag-and-drop verschieben',
  showValidationReport: 'Validierungsbericht anzeigen',
  sort: 'Sortieren',
  dataExport: {
    source: {
      label: 'Quelle',
      allRecords: 'Alle Datensätze',
      filteredRecords: 'Nur gefilterte Datensätze',
      selectedRecord: 'Nur ausgewählter Datensatz',
      selectedRecord_other: 'Nur {{count}} ausgewählte Datensätze',
    },
    title: 'Daten exportieren',
  },
  dataMatrixExport: {
    intro: `Daten von **{{entity}}** als Tabelle exportieren mit:

- einer **Zeile** für jeden unterschiedlichen Wert der Zeilenattribute (z. B. jede Art und Schicht);
- einer **Spalte** für jeden Datensatz, benannt nach seinem Schlüssel ({{keys}});
- dem Wert des Wertattributs in den Zellen (z. B. Deckung).

Dieses Format wird von Vegetationsanalysewerkzeugen wie Turboveg, Juice und Synbiosys verwendet.`,
    layout: {
      dataMatrix: 'Datenmatrix',
      info: 'Tabelle: Zeilen und Spalten wie im Daten-Explorer. Datenmatrix: eine Zeile pro Art (oder anderem Attribut) und eine Spalte pro Datensatz, wie von Vegetationsanalysewerkzeugen wie Turboveg benötigt.',
      label: 'Exportieren als',
      table: 'Tabelle',
    },
    preview: 'Vorschau',
    previewRecord: '{{keys}} von Datensatz {{number}}',
    recordKeys: 'Schlüsselattribute zur Benennung der Datensatzspalten',
    recordKeysInfo:
      'Jeder Datensatz wird zu einer Spalte, die nach den Werten der ausgewählten Schlüsselattribute benannt ist (z. B. nur die Plotnummer). Standardmäßig werden die im Daten-Explorer ausgewählten Schlüsselattribute verwendet; ist keines ausgewählt, werden alle verwendet. Mindestens eines ist erforderlich.',
    recordsAll:
      'Die Daten aller Datensätze werden exportiert. Legen Sie im Daten-Explorer einen Filter fest, um nur einen Teil zu exportieren.',
    recordsFiltered: 'Nur Daten, die dem aktuellen Filter des Daten-Explorers entsprechen, werden exportiert.',
    rowAttribute: 'Zeilen (Name des Taxonattributs, z. B. Art)',
    rowAttributeInfo:
      'Jeder unterschiedliche Wert dieses Attributs wird zu einer Tabellenzeile. Taxonattribute werden mit ihrem wissenschaftlichen Namen exportiert, da nicht aufgeführte Taxa denselben Code besitzen.',
    secondRowAttribute: 'Zweites Zeilenattribut, optional (z. B. Schicht)',
    secondRowAttributeInfo:
      'Verwenden Sie es, wenn dieselbe Art in einem Datensatz mehrfach vorkommen kann (z. B. in verschiedenen Schichten). Jede Kombination wird zu einer eigenen Zeile.',
    valueAttribute: 'Werte (z. B. Deckung)',
    valueAttributeInfo:
      'Der in den Zellen angezeigte Wert. Codeattribute werden mit ihrem Code und nicht mit ihrer Bezeichnung exportiert. Kommt eine Zeile in einem Datensatz mehrfach mit unterschiedlichen Werten vor, enthält die Zelle alle Werte.',
  },
  dataVis: {
    errorLoadingData: 'Fehler beim Laden der Daten',
    noData: 'Diese Abfrage hat keine Daten zurückgegeben',
    noSelection:
      'Treffen Sie Ihre Auswahl im linken Seitenbereich oder wählen Sie unter „Abfragen verwalten“ eine vorhandene Abfrage aus',
  },
  viewSelectedRecord: 'Ausgewählten Datensatz anzeigen',
  mapView: {
    layersControl: {
      areasOfInterest: 'Interessengebiete',
      baseLayers: 'Basiskarten',
      inputData: 'Eingabedaten',
      preloadedLayers: 'Vorgeladene Ebenen',
      samplingPointData: 'Stichprobenpunktdaten',
    },
    layersPanel: {
      markers: '{{count}} Markierungen',
      markers_one: '{{count}} Markierung',
      markers_other: '{{count}} Markierungen',
    },
  },
}
