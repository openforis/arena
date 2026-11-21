export default {
  completion: '{{percent}} % abgeschlossen',
  pagesValidationProgress: '{{valid}}/{{total}} Seiten gültig ({{percent}} %)',
  pageComplete: 'Abgeschlossen',
  copyPath: 'Pfad kopieren',
  pathCopiedToClipboard: 'Pfad in die Zwischenablage kopiert',
  subPage: 'Unterseite',
  addChildTo: 'Zu {{nodeDefLabel}} hinzufügen',
  addChildToTitle: 'Neuen Knoten zu {{nodeDefLabel}} hinzufügen',
  addChildToTypes: {
    boolean: 'Boolesch',
    code: 'Code',
    coordinate: 'Koordinate',
    date: 'Datum',
    decimal: 'Dezimalzahl',
    geo: 'Geodaten',
    entity: 'Tabelle oder Formular',
    file: 'Datei',
    integer: 'Ganzzahl',
    taxon: 'Taxon',
    text: 'Text',
    time: 'Uhrzeit',
    // layout elments
    formHeader: 'Formularüberschrift',
  },
  clone: `„{{nodeDefLabel}}“ klonen`,
  compressFormItems: `Formularelemente für „{{nodeDefLabel}}“ komprimieren`,
  confirmClearNonApplicableValues: `Die folgenden Felder sind nicht mehr relevant und ihre Werte werden gelöscht:

{{nodeDefLabels}}

Fortfahren?`,
  confirmUpdateDependentEnumeratedEntities: `Wenn Sie fortfahren, werden einige aufgezählte Entitäten ({{entityDefs}}) neu aufgezählt.  
Dabei werden vorhandene darin eingetragene Werte gelöscht.  
Fortfahren?`,
  convert: `„{{nodeDefLabel}}“ konvertieren`,
  delete: `„{{nodeDefLabel}}“ löschen`,
  edit: `„{{nodeDefLabel}}“ bearbeiten`,
  schemaSummary_csv: 'Schemazusammenfassung (CSV)',
  schemaSummary_xlsx: 'Schemazusammenfassung (Excel)',
  schemaSummaryAiDescriptions_csv: 'Schemazusammenfassung + KI-Beschreibungen (CSV)',
  schemaSummaryAiDescriptions_xlsx: 'Schemazusammenfassung + KI-Beschreibungen (Excel)',
  schemaSummaryAiDescriptionsFailed_one:
    'Für {{count}} Feld konnte keine KI-Beschreibung erzeugt werden; es bleibt leer.',
  schemaSummaryAiDescriptionsFailed_other:
    'Für {{count}} Felder konnten keine KI-Beschreibungen erzeugt werden; sie bleiben leer.',
  schemaSummaryAiDescriptionsNotDone_one:
    'Für {{count}} Feld wurde keine KI-Beschreibung erzeugt, weil der Lauf angehalten wurde; es bleibt leer.',
  schemaSummaryAiDescriptionsNotDone_other:
    'Für {{count}} Felder wurden keine KI-Beschreibungen erzeugt, weil der Lauf angehalten wurde; sie bleiben leer.',
  hidePages: 'Seiten ausblenden',
  showPages: 'Seiten anzeigen',
  move: `„{{nodeDefLabel}}“ verschieben`,
  movePageUp: 'Seite nach oben verschieben',
  movePageDown: 'Seite nach unten verschieben',
  formEditActions: {
    preview: 'Vorschau',
    previewDesktop: 'Vorschau (Desktop)',
    previewMobile: 'Vorschau (Mobilgerät)',
    previewOptions: 'Vorschauoptionen',
  },
  mobilePreview: {
    device: {
      phone: 'Smartphone',
      tablet: 'Tablet',
    },
    error: 'Fehler beim Laden der Mobilvorschau: {{error}}',
    differences: `**Unterschiede zu Arena Mobile auf einem echten Gerät**
- **Datum und Uhrzeit**: Eingabe in ein Textfeld (TT/MM/JJJJ, HH:mm) anstelle der Datum-/Uhrzeitauswahl des Geräts
- **Karten**: nicht verfügbar (Kartenschaltflächen zeigen einen Platzhalter; keine Offline- oder PDF-Karten)
- **Standort**: wird vom Browser ermittelt (meist ungenauer als das Geräte-GPS); keine externen GPS-Empfänger
- **Fotos und Dateien**: Auswahl vom Computer; Kameraaufnahme und Fotostandort (EXIF) nicht verfügbar
- **Tastatur und Gesten**: physische Tastatur und Maus anstelle von Bildschirmtastatur und Wischgesten
- **Daten**: nur im Arbeitsspeicher; gehen beim Neuladen verloren; keine Datensatzliste, Synchronisierung oder Exportfunktion`,
    note: 'Annäherung an Arena Mobile im Browser mit dem Erhebungsentwurf.',
    orientation: {
      landscape: 'Querformat',
      portrait: 'Hochformat',
    },
    reload: 'Neu laden',
    title: 'Mobilvorschau',
  },
  formEntryActions: {
    confirmDemote: 'Möchten Sie diesen Datensatz wirklich auf {{name}} zurückstufen?',
    confirmPromote: `Möchten Sie diesen Datensatz wirklich **auf {{name}} hochstufen**?  
Sie können ihn anschließend nicht mehr bearbeiten.`,
    confirmPromoteWithErrors: `**Dieser Datensatz enthält Fehler**.  
$t(surveyForm:formEntryActions.confirmPromote)`,
    confirmDelete: 'Möchten Sie diesen Datensatz wirklich löschen?\n\n$t(common.cantUndoWarning)',
    closePreview: 'Vorschau schließen',
    demoteTo: 'Auf {{stepPrev}} zurückstufen',
    promoteTo: 'Auf {{stepNext}} hochstufen',
    step: 'Schritt {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Spalten',
    confirmConvert: 'Attribut „{{name}}“ in „{{toType}}“ konvertieren?',
    confirmDelete: 'Möchten Sie diese Knotendefinition dauerhaft löschen: {{ name }}?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: 'Code oder Bezeichnung eingeben',
    option: 'Option {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: '$t(common.true)',
        false: '$t(common.false)',
      },
      yesNo: {
        true: '$t(common.yes)',
        false: '$t(common.no)',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Koordinate',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Auf Karte anzeigen',
    accuracy: 'Genauigkeit',
    altitude: 'Höhe',
    altitudeAccuracy: 'Höhengenauigkeit',
  },
  nodeDefGeo: {
    confirmDelete: 'Diesen Geodatenwert löschen?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Ungültige GeoJSON-Datei hochgeladen',
  },
  nodeDefEntityForm: {
    addNewEntity: '{{name}} hinzufügen',
    confirmDelete: 'Möchten Sie diese Entität wirklich löschen?',
    select: '{{name}} auswählen:',
    selectedEntity: 'Ausgewählte Entität „{{name}}“:',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Wissenschaftlicher Name',
    vernacularName: 'Trivialname',
    vernacularNameAlwaysIncludedIfSingle: 'Einzigen Trivialnamen immer einbeziehen',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Aktiviert**: Ist für ein Taxon nur ein Trivialname definiert, wird dieser bei Auswahl des Taxons automatisch mit den Daten gespeichert.  
- **Deaktiviert**: Es werden nur Taxoncode und wissenschaftlicher Name gespeichert, auch wenn das Taxon nur einen Trivialnamen besitzt.`,
    vernacularNameSelectionKept: 'Auswahl des Trivialnamens beibehalten',
    vernacularNameSelectionKeptInfo: `- **Aktiviert**: Wird ein Taxon über einen Trivialnamen ausgewählt, wird der konkret für die Suche verwendete Trivialname ebenfalls gespeichert.  
- **Deaktiviert**: Es werden nur Taxoncode und wissenschaftlicher Name gespeichert, unabhängig vom verwendeten Trivialnamen.  
In Arena Mobile:  
- **Aktiviert**: Jeder Trivialname erscheint als eigenes Element in den Suchergebnissen.
- **Deaktiviert**: Alle Trivialnamen eines Taxons werden gruppiert und zusammen mit dem Taxon in einem Eintrag angezeigt. Dadurch enthält die Autovervollständigung weniger Elemente.`,
    visibleFields: 'Sichtbare Felder',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Fehler beim Laden der Vorschau',
    fileUuid: 'Datei-UUID',
    fileName: 'Dateiname',
    locationInformationNotFound: 'Keine Standortinformationen in der Datei gefunden',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Alle Knoten',
    onlyPages: 'Nur Seiten',
  },
  step: {
    entry: 'Erfassung',
    cleansing: 'Bereinigung',
    analysis: 'Analyse',
  },
  cloneFromAnotherSurvey: {
    title: 'Knoten aus einer anderen Erhebung klonen',
    expandToLoadNodes: 'Aufklappen, um Knoten zu laden',
    loadingSurveyNodes: 'Erhebungsknoten werden geladen ...',
    errorLoadingSurveyNodes: 'Fehler beim Laden der Erhebungsknoten',
    noNodesAvailable: 'Keine Knoten verfügbar',
    loadingSurveys: 'Erhebungen werden geladen ...',
    noSurveysAvailable: 'Keine Erhebungen verfügbar',
    sourceNode: 'Quellknoten',
    targetEntityCurrentSurvey: 'Zielentität (aktuelle Erhebung)',
  },
  confirmNodeDelete: 'Möchten Sie „{{nodeDefLabel}}“ ({{nodeDefType}}) wirklich löschen?',
  downloadPrintableDocument: 'Druckbares Dokument herunterladen (Word)',
  downloadPrintableDocumentPdf: 'Druckbares Dokument herunterladen (PDF)',
  printableExport: {
    title: 'Druckbares Dokument exportieren',
    exportDocument: 'Dokument exportieren',
    format: 'Format',
    formats: {
      pdf: 'PDF',
      docx: 'Word',
    },
    scope: 'Inhalt',
    scopes: {
      full: 'Gesamte Erhebung',
      currentPage: 'Nur aktuelle Seite ({{entityLabel}})',
    },
    currentPageUnavailable:
      'Die aktuelle Seiteninstanz konnte nicht bestimmt werden. Navigieren Sie zu einer bestimmten Seite oder exportieren Sie die gesamte Erhebung.',
    includeQrCode: 'QR-Code einbeziehen',
    includeQrCodeInfo:
      'Fügt auf der ersten Seite einen QR-Code mit einem Link zu einer schreibgeschützten PDF-Kopie der Entität dieser Seite hinzu (ein Jahr gültig).',
    orientation: 'Seitenausrichtung',
    orientations: {
      portrait: 'Hochformat',
      landscape: 'Querformat',
    },
    download: 'Herunterladen',
  },
  exportLabels_csv: 'Bezeichnungen exportieren (CSV)',
  exportLabels_xlsx: 'Bezeichnungen exportieren (Excel)',
  importLabels: 'Bezeichnungen aus Excel oder CSV importieren',
  aiTranslateLabels: 'KI: Bezeichnungen übersetzen',
  nodeDefsTranslation: {
    apply: 'Übersetzungen anwenden',
    applySuccess: 'Übersetzungen erfolgreich angewendet',
    aiSuggestion: 'KI',
    current: 'Aktuell',
    custom: 'Benutzerdefiniert',
    defaultDescription: 'Standardbeschreibung',
    defaultLabel: 'Standardbezeichnung',
    failed_one: 'Die KI konnte {{count}} Übersetzung nicht erstellen; sie hat keinen KI-Vorschlag.',
    failed_other: 'Die KI konnte {{count}} Übersetzungen nicht erstellen; sie haben keinen KI-Vorschlag.',
    notDone_one:
      'Der Lauf wurde angehalten, bevor {{count}} Übersetzung angefordert wurde; sie hat keinen KI-Vorschlag.',
    notDone_other:
      'Der Lauf wurde angehalten, bevor {{count}} Übersetzungen angefordert wurden; sie haben keinen KI-Vorschlag.',
    path: 'Pfad',
    showDescriptions: 'Beschreibungen anzeigen',
    title: 'Bezeichnungen der Knotendefinitionen übersetzen',
  },
}
