export default {
  completion: '{{percent}}% završeno',
  pagesValidationProgress: '{{valid}}/{{total}} ispravnih stranica ({{percent}}%)',
  pageComplete: 'Završeno',
  copyPath: 'Kopiraj putanju',
  pathCopiedToClipboard: 'Putanja je kopirana u međuspremnik',
  subPage: 'Podstranica',
  addChildTo: 'Dodaj u {{nodeDefLabel}}',
  addChildToTitle: 'Dodaj novi čvor u {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Logički',
    code: 'Šifra',
    coordinate: 'Koordinata',
    date: 'Datum',
    decimal: 'Decimalni',
    geo: 'Geoprostorni',
    entity: 'Tabela ili obrazac',
    file: 'Fajl',
    integer: 'Cijeli broj',
    taxon: 'Takson',
    text: 'Tekst',
    time: 'Vrijeme',
    // layout elments
    formHeader: 'Zaglavlje obrasca',
  },
  clone: `Kloniraj '{{nodeDefLabel}}'`,
  compressFormItems: `Sažmi stavke obrasca za '{{nodeDefLabel}}'`,
  confirmClearNonApplicableValues: `Sljedeća polja više neće biti primjenjiva i njihove vrijednosti će biti obrisane:

{{nodeDefLabels}}

Nastaviti?`,
  confirmUpdateDependentEnumeratedEntities: `Ako nastavite, neki nabrojani entiteti ({{entityDefs}}) biće ponovo nabrojani,
čime će se obrisati postojeće vrijednosti unesene u njih (ako ih ima).
Nastaviti?`,
  convert: `Konvertuj '{{nodeDefLabel}}'`,
  delete: `Obriši '{{nodeDefLabel}}'`,
  edit: `Uredi '{{nodeDefLabel}}'`,
  schemaSummary_csv: 'Pregled šeme (CSV)',
  schemaSummary_xlsx: 'Pregled šeme (Excel)',
  schemaSummaryAiDescriptions_csv: 'Pregled šeme + AI opisi (CSV)',
  schemaSummaryAiDescriptions_xlsx: 'Pregled šeme + AI opisi (Excel)',
  hidePages: 'Sakrij stranice',
  showPages: 'Prikaži stranice',
  move: `Premjesti '{{nodeDefLabel}}'`,
  movePageUp: 'Pomjeri stranicu gore',
  movePageDown: 'Pomjeri stranicu dolje',
  formEditActions: {
    preview: 'Pregled',
    previewDesktop: 'Pregled (računar)',
    previewMobile: 'Pregled (mobilni)',
    previewOptions: 'Opcije pregleda',
  },
  mobilePreview: {
    device: {
      phone: 'Telefon',
      tablet: 'Tablet',
    },
    error: 'Greška pri učitavanju mobilnog pregleda: {{error}}',
    differences: `**Razlike u odnosu na Arena Mobile na stvarnom uređaju**
- **Datum i vrijeme**: unose se u tekstualno polje (DD/MM/YYYY, HH:mm) umjesto birača datuma/vremena na uređaju
- **Mape**: nisu dostupne (dugmad za mapu prikazuju čuvar mjesta, nema mapa van mreže ni PDF mapa)
- **Lokacija**: preuzima se iz pregledača (obično manje precizno od GPS-a uređaja); nema spoljnih GPS prijemnika
- **Fotografije i fajlovi**: biraju se sa računara; snimanje kamerom i lokacija fotografije (EXIF) nisu dostupni
- **Tastatura i pokreti**: fizička tastatura i miš umjesto tastature na ekranu i prevlačenja
- **Podaci**: čuvaju se samo u memoriji i gube se pri ponovnom učitavanju; nema liste zapisa, sinhronizacije ni izvoza`,
    note: 'Približan prikaz aplikacije Arena Mobile pokrenute u pregledaču sa nacrtom istraživanja.',
    orientation: {
      landscape: 'Položeno',
      portrait: 'Uspravno',
    },
    reload: 'Ponovo učitaj',
    title: 'Mobilni pregled',
  },
  formEntryActions: {
    confirmDemote: 'Da li ste sigurni da želite da vratite ovaj zapis na {{name}}?',
    confirmPromote: `Da li ste sigurni da želite da **unaprijedite ovaj zapis na {{name}}**?
Više nećete moći da ga uređujete`,
    confirmPromoteWithErrors: `**Ovaj zapis sadrži greške**.
$t(surveyForm:formEntryActions.confirmPromote)`,
    confirmDelete: 'Da li ste sigurni da želite da obrišete ovaj zapis?\n\n$t(common.cantUndoWarning)',
    closePreview: 'Zatvori pregled',
    demoteTo: 'Vrati na {{stepPrev}}',
    promoteTo: 'Unaprijedi na {{stepNext}}',
    step: 'Korak {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Kolone',
    confirmConvert: 'Konvertovati atribut "{{name}}" u "{{toType}}"?',
    confirmDelete:
      'Da li ste sigurni da želite trajno da obrišete ovu definiciju čvora: {{ name }}?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: 'Unesite šifru ili oznaku',
    option: 'Opcija {{value}}',
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
    coordinate: 'Koordinata',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Prikaži na mapi',
    accuracy: 'Tačnost',
    altitude: 'Nadmorska visina',
    altitudeAccuracy: 'Tačnost nadmorske visine',
  },
  nodeDefGeo: {
    confirmDelete: 'Obrisati ovu geoprostornu vrijednost?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Otpremljen je neispravan GeoJSON fajl',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Dodaj novi: {{name}}',
    confirmDelete: 'Da li ste sigurni da želite da obrišete ovaj entitet?',
    select: 'Izaberite: {{name}}',
    selectedEntity: 'Izabrano: {{name}}',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Naučni naziv',
    vernacularName: 'Narodni naziv',
    vernacularNameAlwaysIncludedIfSingle: 'Narodni naziv se uvijek uključuje ako postoji samo jedan',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Omogućeno**: ako je ova opcija omogućena i takson ima definisan samo jedan narodni naziv, taj narodni naziv će se automatski sačuvati sa podacima kada se takson izabere.
- **Onemogućeno**: čuvaće se samo šifra taksona i naučni naziv, čak i ako takson ima jedan narodni naziv.`,
    vernacularNameSelectionKept: 'Izbor narodnog naziva se zadržava',
    vernacularNameSelectionKeptInfo: `- **Omogućeno**: kada se takson izabere pomoću narodnog (uobičajenog) naziva, konkretni narodni naziv korišćen u pretrazi takođe će biti sačuvan u podacima.
- **Onemogućeno**: čuvaće se samo šifra taksona i naučni naziv, bez obzira na to koji je narodni naziv korišćen tokom pretrage.
U aplikaciji Arena Mobile:
- **Omogućeno**: svaki narodni naziv pojavljuje se kao posebna stavka u listi rezultata pretrage.
- **Onemogućeno**: svi narodni nazivi taksona grupišu se i prikazuju uz takson (objedinjeni u jednoj stavci). Zbog toga lista automatskog dovršavanja sadrži manje stavki.`,
    visibleFields: 'Vidljiva polja',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Greška pri učitavanju pregleda',
    fileUuid: 'UUID fajla',
    fileName: 'Naziv fajla',
    locationInformationNotFound: 'Informacije o lokaciji nisu pronađene u fajlu',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Svi čvorovi',
    onlyPages: 'Samo stranice',
  },
  step: {
    entry: 'Unos',
    cleansing: 'Čišćenje',
    analysis: 'Analiza',
  },
  cloneFromAnotherSurvey: {
    title: 'Kloniraj čvor iz drugog istraživanja',
    expandToLoadNodes: 'Proširite da učitate čvorove',
    loadingSurveyNodes: 'Učitavanje čvorova istraživanja...',
    errorLoadingSurveyNodes: 'Greška pri učitavanju čvorova istraživanja',
    noNodesAvailable: 'Nema dostupnih čvorova',
    loadingSurveys: 'Učitavanje istraživanja...',
    noSurveysAvailable: 'Nema dostupnih istraživanja',
    sourceNode: 'Izvorni čvor',
    targetEntityCurrentSurvey: 'Ciljni entitet (trenutno istraživanje)',
  },
  confirmNodeDelete: 'Da li ste sigurni da želite da obrišete ovaj {{nodeDefType}} ({{nodeDefLabel}})?',
  downloadPrintableDocument: 'Preuzmi dokument za štampu (Word)',
  downloadPrintableDocumentPdf: 'Preuzmi dokument za štampu (PDF)',
  printableExport: {
    title: 'Izvezi dokument za štampu',
    exportDocument: 'Izvezi dokument',
    format: 'Format',
    formats: {
      pdf: 'PDF',
      docx: 'Word',
    },
    scope: 'Sadržaj',
    scopes: {
      full: 'Cijelo istraživanje',
      currentPage: 'Samo trenutna stranica ({{entityLabel}})',
    },
    currentPageUnavailable:
      'Nije moguće odrediti instancu trenutne stranice. Idite na određenu stranicu ili izvezite cijelo istraživanje.',
    includeQrCode: 'Uključi QR kod',
    includeQrCodeInfo:
      'Dodaje QR kod na prvu stranicu sa linkom ka kopiji PDF-a entiteta ove stranice samo za čitanje (važi 1 godinu).',
    orientation: 'Orijentacija stranice',
    orientations: {
      portrait: 'Uspravno',
      landscape: 'Položeno',
    },
    download: 'Preuzmi',
  },
  exportLabels_csv: 'Izvezi oznake (CSV)',
  exportLabels_xlsx: 'Izvezi oznake (Excel)',
  importLabels: 'Uvezi oznake iz Excel ili CSV fajla',
  aiTranslateLabels: 'AI: Prevedi oznake',
  nodeDefsTranslation: {
    apply: 'Primijeni prevode',
    applySuccess: 'Prevodi su uspješno primijenjeni',
    aiSuggestion: 'AI',
    current: 'Trenutno',
    custom: 'Prilagođeno',
    defaultDescription: 'Podrazumijevani opis',
    defaultLabel: 'Podrazumijevana oznaka',
    path: 'Putanja',
    showDescriptions: 'Prikaži opise',
    title: 'Prevedi oznake definicija čvorova',
  },
}
