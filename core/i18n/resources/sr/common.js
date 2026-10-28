import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Aktivno',
    add: 'Dodaj',
    advancedFunctions: 'Napredne funkcije',
    and: 'i',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Primijeni',
    aggregateFunction: 'Agregatna funkcija',
    aggregateFunction_few: 'Agregatne funkcije',
    aggregateFunction_other: 'Agregatne funkcije',
    attribute: 'Atribut',
    attribute_few: 'Atributi',
    attribute_other: 'Atributi',
    avg: 'Prosjek',
    ascending: 'Rastuće',
    areaBased: 'zasnovano na površini',
    back: 'Nazad',
    baseUnit: 'Osnovna jedinica',
    cancel: 'Otkaži',
    cancelConfirm: `**Postoje nesačuvane izmjene**.

Da li želite da ih zanemarite?`,
    cantUndoWarning: 'Ova operacija se ne može poništiti',
    cantBeDeletedUsedItem: 'Ovaj element ({{item}}) koriste neke definicije čvorova i ne može se obrisati',
    chain: 'Lanac obrade',
    chain_other: 'Lanci obrade',
    childrenEmpty: 'Definišite barem jednu podređenu stavku',
    clear: 'Očisti',
    clone: 'Kloniraj',
    close: 'Zatvori',
    cloneFrom: 'Kloniraj iz',
    cnt: 'Broj',
    code: 'Šifra',
    collapse: 'Skupi',
    confirm: 'Potvrdi',
    convert: 'Konvertuj',
    copy: 'Kopiraj',
    createdWith: 'Kreirano pomoću',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Ciklus',
    cycle_other: 'Ciklusi',
    dateCreated: 'Datum kreiranja',
    dateLastModified: 'Datum posljednje izmjene',
    delete: 'Obriši',
    deleted: 'Obrisano!',
    descending: 'Opadajuće',
    description: 'Opis',
    description_other: 'Opisi',
    designerNotes: 'Bilješke dizajnera',
    designerNotesInfo: `Bilješke dizajnera biće vidljive samo u dizajneru obrasca istraživanja i neće biti vidljive u obrascu za unos podataka.`,
    details: 'Detalji',
    dimension: 'Dimenzija',
    dimension_few: 'Dimenzije',
    dimension_other: 'Dimenzije',
    done: 'Gotovo',
    download: 'Preuzmi',
    draft: 'Nacrt',
    edit: 'Uredi',
    elapsed: 'Proteklo',
    email: 'E-pošta',
    email_few: 'E-adrese',
    email_other: 'E-adrese',
    emailSentConfirmation: `Poslata je poruka e-pošte na adresu {{email}}.

    Molimo obavijestite osobu da provjeri i fasciklu Spam/Neželjena pošta.`,
    emailSentToSelfConfirmation: `Trebalo bi da ste primili poruku e-pošte na adresu {{email}}.

Molimo provjerite i fasciklu Spam/Neželjena pošta.`,
    empty: 'Prazno',
    entity: 'Entitet',
    error: 'Greška',
    error_other: 'Greške',
    error_few: 'Greške',
    errorFound: 'Pronađena je 1 greška',
    errorFound_few: 'Pronađene su {{count}} greške',
    errorFound_other: 'Pronađeno je {{count}} grešaka',
    errorMessage: 'Poruka o grešci',
    errorMessage_other: 'Poruke o greškama',
    expand: 'Proširi',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Izvezi',
    exportAll: 'Izvezi sve',
    exportToCSV: 'Izvezi u CSV',
    exportToExcel: 'Izvezi u Excel',
    exportToExcelTooManyItems: 'Previše stavki za izvoz u Excel; molimo koristite izvoz u CSV.',
    expression: 'Izraz',
    false: 'Netačno',
    file: 'Fajl',
    file_other: 'Fajlovi',
    formContainsErrors: 'Obrazac sadrži greške',
    formContainsErrorsCannotContinue: 'Obrazac sadrži greške. Molimo ispravite ih prije nego što nastavite.',
    formContainsErrorsCannotSave: 'Obrazac sadrži greške. Molimo ispravite ih prije čuvanja.',
    from: 'Od',
    function: 'Funkcija',
    goToHomePage: 'Idi na početnu stranicu',
    goToSurveys: 'Idi na istraživanja',
    group: 'Grupa',
    help: 'Pomoć',
    hide: 'Sakrij',
    id: 'id',
    import: 'Uvezi',
    importFromExcelOrCSVFile: 'Uvezi iz Excel (.xlsx) ili CSV fajla',
    info: 'Informacija',
    invalid: 'NEVAŽEĆE',
    item: 'Stavka',
    item_other: 'Stavke',
    itemAlreadyAdded: 'Stavka je već dodata',
    label: 'Oznaka',
    label_other: 'Oznake',
    language: 'Jezik',
    language_other: 'Jezici',
    leavePageConfirmMessage: `U obrascu postoje nesačuvane izmjene.

Ako potvrdite, sve izmjene će biti izgubljene.
Da li želite da nastavite?`,
    local: 'Lokalno',
    loading: 'Učitavanje...',
    lock: 'Zaključaj',
    unlock: 'Otključaj',
    max: 'Maksimum',
    med: 'Medijana',
    manage: 'Upravljaj',
    message_other: 'Poruke',
    measure: 'Mjera',
    measure_few: 'Mjere',
    measure_other: 'Mjere',
    measurePrevSteps: 'Mjera prethodnih koraka',
    measurePrevSteps_other: 'Mjere prethodnih koraka',
    measurePrevSteps_few: 'Mjere prethodnih koraka',
    min: 'Minimum',
    moveUp: 'Pomjeri gore',
    moveDown: 'Pomjeri dolje',
    name: 'Naziv',
    new: 'Novi',
    next: 'Sljedeće',
    no: 'Ne',
    noItems: 'Nema stavki',
    notification: 'Obavještenje',
    notification_few: 'Obavještenja',
    notification_other: 'Obavještenja',
    notSpecified: '---Nije navedeno---',
    orderBy: 'Poređaj po',
    of: 'od',
    ok: 'U redu',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Otvori u novom prozoru',
    options: 'Opcije',
    owner: 'Vlasnik',
    path: 'Putanja',
    pause: 'Pauziraj',
    preview: 'Režim pregleda',
    previous: 'Prethodno',
    publish: 'Objavi',
    publishConfirm: `#### Upravo ćete objaviti istraživanje {{survey}} ####

###### Proces objavljivanja će *trajno obrisati* sljedeće informacije ######
- Oznake povezane sa obrisanim jezicima.
- Zapise povezane sa obrisanim ciklusima.
- Podatke povezane sa obrisanim poljima obrasca.

###### Nakon objavljivanja: ######
- Polja obrasca se ne mogu mijenjati iz pojedinačnih u višestruka i obrnuto.
- Šifre stavki kategorija se ne mogu mijenjati.
- Stavke kategorija se ne mogu brisati.
- Šifre taksonomije se ne mogu mijenjati.
- Taksoni se ne mogu brisati.

**Da li ste sigurni da želite da nastavite?**`,
    publishRecordValuesUpdateConfirm: `#### Objavljivanje istraživanja {{survey}} ažuriraće već unesene podatke ####

{{reasons}}

Ova operacija može trajno izmijeniti ili obrisati već unesene podatke.

Da biste umjesto toga objavili bez ažuriranja postojećih podataka, označite „Preskoči ažuriranje podataka“ ispod (ne preporučuje se).`,
    publishRecordValuesUpdateConfirmHeader: 'Postojeći podaci zapisa biće ažurirani',
    publishRecordValuesUpdateConfirmOk: 'Objavi i ažuriraj podatke',
    publishRecordValuesUpdateConfirmInputLabel:
      'Unesite naziv istraživanja „{{strongConfirmRequiredText}}“ da potvrdite',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Sljedeći atributi biće izmijenjeni, a njihove vrijednosti u postojećim zapisima biće automatski ponovo izračunate: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Sljedeći atributi koriste dodatno svojstvo kategorije ili taksonomije koje je izmijenjeno, zbog čega će njihova vrijednost u postojećim zapisima biti ponovo izračunata: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Preskoči ažuriranje podataka',
    publishSkipDataUpdateConfirmOk: 'Preskoči ažuriranje podataka i objavi',
    publishSkipDataUpdateImplications: 'Preskakanje ažuriranja podataka znači:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Postojeći zapisi možda više neće odgovarati novoj definiciji istraživanja',
    publishSkipDataUpdateImplicationStaleValues:
      'Pogođene vrijednosti neće biti ponovo izračunate dok se ručno ponovo ne unesu',
    publishSkipDataUpdateImplicationChains: 'Lanci obrade koji koriste ove atribute mogu dati zastarjele rezultate',
    raiseTicketInSupportForum: `U slučaju problema, molimo otvorite tiket sa oznakom 'arena' na našem <b>forumu podrške</b>: $t(links.supportForum)`,
    record: 'Zapis',
    record_few: 'Zapisi',
    record_other: 'Zapisi',
    remaining: 'Preostalo',
    remote: 'Udaljeno',
    required: 'Obavezno',
    requiredField: 'obavezno polje',
    reset: 'Resetuj',
    refresh: 'Osvježi',
    pressRefreshToReloadPage: 'Pritisnite Osvježi da ponovo učitate stranicu.',
    resume: 'Nastavi',
    retry: 'Pokušaj ponovo',
    role: 'Uloga',
    save: 'Sačuvaj',
    saveAndBack: 'Sačuvaj i nazad',
    saved: 'Sačuvano!',
    samplingPolygon: 'Poligon uzorkovanja',
    show: 'Prikaži',
    select: 'Izaberi',
    selectOne: 'Izaberite jedno...',
    selectAll: 'Izaberi sve',
    selected: 'Izabrano',
    showLabels: 'Prikaži oznake',
    showLabelsAndNames: 'Prikaži oznake i nazive',
    showNames: 'Prikaži nazive',
    sort: 'Sortiraj',
    sortAsc: 'Sortiraj rastuće',
    sortDesc: 'Sortiraj opadajuće',
    sortNone: 'Ukloni sortiranje',
    srs: 'SRS',
    status: 'Status',
    sum: 'Zbir',
    test: 'Test',
    to: 'Do',
    totalItems: 'Ukupno stavki',
    true: 'Tačno',
    trySplittingFileIntoSmallerChunks: 'Pokušajte da podijelite fajl na manje djelove.',
    type: 'Tip',
    undefinedName: 'Nedefinisan naziv',
    unique: 'Jedinstveno',
    upload: 'Otpremi',
    uploadErrorConfirm: {
      message: `Greška prilikom otpremanja fajla: {{error}}.\n
Pokušati ponovo?`,
    },
    uploadFileChangedError: 'Izgleda da je izabrani fajl izmijenjen nakon što je izabran. Molimo izaberite ga ponovo.',
    uploadingFile: 'Otpremanje fajla ({{progressPercent}}%)',
    value: 'Vrijednost',
    view: 'Prikaz',
    warning: 'Upozorenje',
    warning_other: 'Upozorenja',
    yes: 'Da',
    date: {
      aMomentAgo: 'Prije trenutak',
      hour: 'sat',
      hour_few: 'sata',
      hour_other: 'sati',
      day: 'dan',
      day_few: 'dana',
      day_other: 'dana',
      minute: 'minut',
      minute_few: 'minuta',
      minute_other: 'minuta',
      week: 'nedjelja',
      week_few: 'nedjelje',
      week_other: 'nedjelja',
      timeDiff: `prije {{count}} $t(common.date.{{unit}}, { 'count': {{count}} })`,
    },
    paginator: {
      firstPage: 'Prva stranica',
      goToPage: 'Idi na stranicu',
      itemsPerPage: 'Stavki po stranici',
      lastPage: 'Posljednja stranica',
      nextPage: 'Sljedeća stranica',
      page: 'Stranica',
      previousPage: 'Prethodna stranica',
    },
    table: {
      visibleColumns: 'Vidljive kolone',
    },
  },
  confirm: {
    strongConfirmInputLabel: 'Da potvrdite, unesite sljedeći tekst: **{{strongConfirmRequiredText}}**',
  },
  dropzone: {
    acceptedFilesMessage: '(Biće prihvaćeni samo {{acceptedExtensions}} fajlovi maksimalne veličine {{maxSize}})',
    error: {
      fileNotValid: 'Izabrani fajl nije važeći',
      fileTooBig: 'Izabrani fajl je prevelik',
      invalidFileExtension: 'Nevažeća ekstenzija fajla: {{extension}}',
    },
    message: 'Prevucite i otpustite fajl ovdje ili kliknite da ga izaberete',
    selectedFile: 'Izabrani fajl',
    selectedFile_few: 'Izabrani fajlovi',
    selectedFile_other: 'Izabrani fajlovi',
  },
  error: {
    pageNotFound: 'Stranica nije pronađena',
  },
  geo: {
    area: 'Površina',
    vertices: 'Tjemena',
    perimeter: 'Obim',
  },
  files: {
    header: 'Fajlovi',
    missing: ' Nedostajući fajlovi: {{count}}',
    totalSize: 'Ukupna veličina: {{size}}',
    fileName: 'Naziv fajla',
    fileSize: 'Veličina fajla',
  },
  sidebar: {
    logout: 'Odjava',
  },
  header: {
    theme: {
      label: 'Tema',
      light: 'Svijetla',
      dark: 'Tamna',
      system: 'Sistemska podrazumijevana',
    },
    myProfile: 'Moj profil',
    qrCodeLoginDialog: {
      title: 'Prijava u Arena Mobile pomoću QR koda',
      instructions: `1. Pokrenite aplikaciju **Arena Mobile** na mobilnom uređaju
2. Idite u meni **Podešavanja**
3. Izaberite  **Veza sa serverom**
4. Pritisnite **Prijava pomoću QR koda**
5. Skenirajte QR kod prikazan na ovom ekranu`,
      success: 'Prijava uspješna!',
      error: 'Greška pri generisanju QR koda: {{error}}',
    },
  },
  nodeDefsTypes: {
    integer: 'Cijeli broj',
    decimal: 'Decimalni broj',
    text: 'Tekst',
    date: 'Datum',
    time: 'Vrijeme',
    boolean: 'Logička vrijednost',
    code: 'Šifra',
    coordinate: 'Koordinata',
    geo: 'Geoprostorni',
    taxon: 'Takson',
    file: 'Fajl',
    entity: 'Entitet',
  },

  // ====== App modules and views
  appModules: {
    home: 'Početna',
    landing: 'Početna stranica',
    dashboard: 'Kontrolna tabla',
    surveyNew: 'Novo istraživanje',
    surveys: 'Istraživanja',
    templateNew: 'Novi šablon',
    templates: 'Šabloni',
    usersAccessRequest: 'Zahtjevi korisnika za pristup',
    collectImportReport: 'Izvještaj o uvozu iz Collect-a',

    surveyInfo: 'Informacije o istraživanju',
    designer: 'Istraživanje',
    formDesigner: 'Dizajner obrasca',
    surveyHierarchy: 'Hijerarhija',
    surveyDependencyTree: 'Stablo zavisnosti',
    surveyCompare: 'Uporedi / ažuriraj iz fajla',
    category: 'Kategorija',
    categories: 'Kategorije',
    nodeDef: 'Definicija čvora',
    taxonomy: 'Taksonomija',
    taxonomies: 'Taksonomije',

    data: 'Podaci',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Izvještaj o validaciji zapisa',
    explorer: 'Istraživač podataka',
    map: 'Mapa',
    charts: 'Grafikoni',
    export: 'Izvoz podataka',
    import: 'Uvoz podataka',
    validationReport: 'Izvještaj o validaciji',

    users: 'Korisnici',
    user: 'Profil korisnika',
    userPasswordChange: 'Promjena lozinke',
    userInvite: 'Pozovi korisnika',
    userNew: 'Novi korisnik',
    usersSurvey: 'Lista korisnika',
    userGroup: 'Korisnička grupa',
    userGroup_other: 'Korisničke grupe',
    userGroupNew: 'Nova korisnička grupa',
    usersList: 'Lista korisnika (svi)',
    user2FADevice: '2FA uređaj',
    user2FADevice_other: '2FA uređaji',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Analiza',
    chain: 'Lanac obrade',
    chain_other: 'Lanci obrade',
    virtualEntity: 'Virtuelni entitet',
    entities: 'Virtuelni entiteti',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Instance',

    message: 'Poruka',
    message_other: '$t(common.message_other)',

    systemAdmin: 'Administracija sistema',
    jobMonitor: 'Nadzor zadataka',
    systemLogs: 'Sistemski dnevnici',

    help: 'Pomoć',
    about: 'O aplikaciji',
    changelog: 'Dnevnik izmjena',
    whatsNew: 'Šta je novo',
    disclaimer: 'Odricanje od odgovornosti',
    userManual: 'Korisničko uputstvo',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Ovaj odjeljak je dostupan samo kada je istraživanje objavljeno',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Tipovi zavisnosti',
    dependencyTypes: {
      applicable: 'Primjenjivost',
      defaultValues: 'Podrazumijevana vrijednost',
      editable: 'Može se uređivati',
      fileName: 'Naziv fajla',
      itemsFilter: 'Filter stavki',
      maxCount: 'Maks. broj',
      minCount: 'Min. broj',
      parentCode: 'Roditeljska šifra',
      validations: 'Validacije',
      visible: 'Vidljivo',
    },
    selectAtLeastOneDependencyType: 'Izaberite bar jedan tip zavisnosti',
    noDependenciesToDisplay: 'Nema zavisnosti za prikaz',
  },
  designerView: {
    formPreview: 'Pregled obrasca',
  },
  recordView: {
    justDeleted: 'Ovaj zapis je upravo obrisan',
    sessionExpired: 'Sesija zapisa je istekla',
    errorLoadingRecord: 'Greška pri učitavanju zapisa: {{details}}',
    recordEditModalTitle: 'Zapis: {{keyValues}}',
    recordNotFound: 'Zapis nije pronađen',
    keyAttributeEditing: {
      lock: 'Zaključaj uređivanje ključnog atributa',
      unlock: 'Dozvoli uređivanje ključnog atributa',
    },
    qualifierAttributeEditing: {
      lock: 'Zaključaj uređivanje atributa kvalifikatora',
      unlock: 'Dozvoli uređivanje atributa kvalifikatora',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Obrisati ovu prilagođenu agregatnu funkciju?',
      sqlExpression: 'SQL izraz',
    },
    editRecord: 'Uredi zapis',
  },
  mapView: {
    changeMarkerColor: 'Promijeni boju markera',
    createRecord: 'Kreiraj novi zapis',
    editRecord: 'Uredi zapis',
    elevation: 'Nadmorska visina (m)',
    location: 'Lokacija',
    locationEditInfo: 'Dvaput kliknite na mapu ili prevucite marker da biste ažurirali lokaciju',
    locationNotValidOrOutOfRange: 'Lokacija nije važeća ili je van opsega UTM zone',
    locationUpdated: 'Lokacija je ažurirana',
    options: {
      showLocationMarkers: 'Prikaži markere lokacija',
      showMarkersLabels: `Prikaži oznake markera`,
      showSamplingPolygon: `Poligon uzorkovanja`,
      showControlPoints: `Kontrolne tačke`,
      showPlotReferencePoint: `Referentna tačka plohe`,
      showUtmGrid: 'Prikaži UTM mrežu',
    },
    rulerTooltip: `Pritisnite dugme da biste započeli mjerenje udaljenosti.
- kliknite više puta da biste izmjerili putanje
- dvaput kliknite ili pritisnite taster ESC da biste završili mjerenje
- ponovo pritisnite dugme da biste sakrili mjerenja`,
    samplingPointDataLayerName: 'Podaci o tačkama uzorka - nivo {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (učitavanje...)',
    samplingPointItemPopup: {
      title: 'Stavka tačke uzorka',
      levelCode: 'Šifra nivoa {{level}}',
    },
    selectedPeriod: 'Izabrani period',
  },
  samplingPolygonOptions: {
    circle: 'Krug',
    controlPointOffsetEast: 'Pomak referentne tačke ka istoku (m)',
    controlPointOffsetNorth: 'Pomak referentne tačke ka sjeveru (m)',
    lengthLatitude: 'Dužina po geografskoj širini (m)',
    lengthLongitude: 'Dužina po geografskoj dužini (m)',
    numberOfControlPoints: 'Broj kontrolnih tačaka',
    numberOfPointsEast: 'Broj kontrolnih tačaka ka istoku',
    numberOfPointsNorth: 'Broj kontrolnih tačaka ka sjeveru',
    offsetEast: 'Pomak ka istoku (m)',
    offsetNorth: 'Pomak ka sjeveru (m)',
    radius: 'Poluprečnik (m)',
    rectangle: 'Pravougaonik',
    samplingPolygon: 'Poligon uzorkovanja',
    shape: 'Oblik',
  },
  kmlUploader: {
    opacity: 'neprozirnost',
    selectFile: 'Izaberi fajl',
    title: 'Opcije za KML/KMZ/Shapefile',
  },
  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Izaberite period za poređenje',
    falseColor: 'Lažne boje',
  },
  surveysView: {
    chains: 'Lanci',
    confirmUpdateSurveyOwner: `Promijeniti vlasnika istraživanja "{{surveyName}}" u "{{ownerName}}"?`,
    cycles: 'Ciklusi',
    datePublished: 'Datum objavljivanja',
    editUserExtraProps: 'Uredi dodatna svojstva korisnika',
    editUserExtraPropsForSurvey: 'Uredi dodatna svojstva korisnika za istraživanje "{{surveyName}}"',
    filter: 'Filter',
    filterPlaceholder: 'Filtriraj po nazivu, oznaci ili vlasniku',
    languages: 'Jezici',
    nodes: 'Čvorovi',
    noSurveysMatchingFilter: 'Nema istraživanja koja odgovaraju navedenom filteru',
    onlyOwn: 'Samo sopstvena istraživanja',
    records: 'Zapisi',
    recordsCreatedWithMoreApps: 'Zapisi kreirani pomoću više aplikacija:',
    status: {
      published: 'Objavljeno',
      draft: 'Nacrt',
      'published-draft': 'Objavljeno/Nacrt',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Prihvaćeno',
      CREATED: 'Na čekanju',
    },
    acceptRequest: {
      accept: 'Prihvati',
      acceptRequestAndCreateSurvey: 'Prihvati zahtjev i kreiraj istraživanje',
      confirmAcceptRequestAndCreateSurvey:
        'Prihvatiti zahtjev za pristup za **{{email}}** sa ulogom **{{role}}** i kreirati novo istraživanje **{{surveyName}}**?',
      error: 'Greška pri prihvatanju zahtjeva za pristup: {{error}}',
      requestAcceptedSuccessfully: 'Zahtjev za pristup je uspješno prihvaćen. $t(common.emailSentConfirmation)',
      surveyLabel: 'Oznaka istraživanja',
      surveyLabelInitial: '(Po potrebi izmijenite naziv i oznaku istraživanja)',
      surveyName: 'Naziv istraživanja',
      template: 'Šablon',
    },
  },
  userView: {
    scale: 'Razmjera',
    rotate: 'Rotiraj',
    dragAndDrop: 'Otpustite sliku iznad ili',
    upload: 'Otpremi',
    remove: 'Ukloniti profilnu sliku?',
    sendNewInvitation: 'Pošalji novu pozivnicu',
    removeFromSurvey: 'Ukloni iz istraživanja',
    confirmRemove: 'Da li ste sigurni da želite da korisniku {{user}} oduzmete pristup istraživanju {{survey}}?',
    removeUserConfirmation: 'Korisnik {{user}} je uklonjen iz istraživanja {{survey}}',
    maxSurveysUserCanCreate: 'Maksimalan broj istraživanja koje korisnik može kreirati',
    preferredUILanguage: {
      label: 'Željeni jezik interfejsa',
      auto: 'Automatski otkriven ({{detectedLanguage}})',
    },
    newPassword: 'Lozinka',
    confirmPassword: 'Potvrdite lozinku',
    manageTwoFactorDevices: {
      label: 'Upravljaj 2FA',
      title: 'Upravljanje uređajima za dvofaktorsku autentifikaciju',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Promjena lozinke za korisnika: {{user}}',
    oldPassword: 'Stara lozinka',
    newPassword: 'Nova lozinka',
    confirmPassword: 'Potvrdite novu lozinku',
    changePassword: 'Promijeni lozinku',
    passwordChangedSuccessfully: 'Lozinka je uspješno promijenjena!',
    notAuthorizedToChangePasswordOfAnotherUser: 'Niste ovlašćeni da mijenjate lozinku drugog korisnika',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Pozvati korisnika {{email}} kao administratora sistema?',
    confirmInviteSystemAdmin_few: 'Pozvati korisnike {{email}} kao administratore sistema?',
    confirmInviteSystemAdmin_other: 'Pozvati korisnike {{email}} kao administratore sistema?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `Broj preskočenih adresa: {{skppedEmailsCount}} (već su ranije pozvane u ovo istraživanje): {{skippedEmails}}`,
    invalidEmailsWarning: `E-adresa {{emails}} nije dostupna i možda ne postoji. Zadržana je na listi ispod: ispravite je ili uklonite i pokušajte ponovo da pošaljete pozivnicu.`,
    invalidEmailsWarning_few: `E-adrese {{emails}} nisu dostupne i možda ne postoje. Zadržane su na listi ispod: ispravite ih ili uklonite i pokušajte ponovo da pošaljete pozivnice.`,
    invalidEmailsWarning_other: `E-adrese {{emails}} nisu dostupne i možda ne postoje. Zadržane su na listi ispod: ispravite ih ili uklonite i pokušajte ponovo da pošaljete pozivnice.`,
    groupPermissions: {
      label: 'Dozvole',
      systemAdmin: `
        <li>Puna prava pristupa sistemu</li>`,
      surveyManager: `
        <li>Istraživanja:
          <ul>
            <li>kreiranje</li>
            <li>kloniranje</li>
            <li>uređivanje sopstvenih istraživanja</li>
            <li>brisanje sopstvenih istraživanja</li>
          </ul>
        </li>
        <li>Korisnici:
          <ul>
            <li>pozivanje korisnika u sopstvena istraživanja</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Istraživanja:
          <ul>
            <li>kloniranje</li>
            <li>uređivanje sopstvenih istraživanja</li>
            <li>brisanje sopstvenih istraživanja</li>
          </ul>
        </li>
        <li>Korisnici:
          <ul>
            <li>pozivanje korisnika u sopstvena istraživanja</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Istraživanja:
          <ul>
            <li>uređivanje sopstvenih istraživanja</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Podaci:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>pristup alatu Mapa</li>
          </ul>
        </li>
        <li>Analiza:
          <ul>
            <li>puna prava pristupa svim alatima</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Podaci:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>pristup alatima za validaciju podataka</li>
        <li>slanje zapisa u fazu „Analiza“</li>`,
      dataEditor: `
        <li>Podaci:
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>dodavanje novih zapisa (sopstvena istraživanja)</li>
        <li>uređivanje postojećih zapisa (sopstvena istraživanja)</li>
        <li>slanje zapisa u fazu „Čišćenje“</li>`,
    },
    messageOptional: 'Poruka (opciono)',
    messageInfo: `Poruka će se pojaviti u e-poruci poslatoj korisniku.
Može biti običan tekst ili Markdown jezik (https://www.markdownguide.org).`,
    sendInvitation: 'Pošalji pozivnicu',
    surveyNotPublishedWarning: `**Upozorenje**: istraživanje nije objavljeno.
      Korisnici se mogu pozvati samo sa ulogama ***$t(auth:authGroups.systemAdmin.label)*** i ***$t(auth:authGroups.surveyAdmin.label)***.
      Ako želite da pozovete korisnike sa drugim ulogama, prvo morate objaviti istraživanje.`,
    typeEmail: 'Unesite e-adresu, zatim pritisnite dugme Dodaj',
  },
  user: {
    mapApiKeys: {
      title: 'API ključevi za mape',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Ovaj API ključ je važeći',
      keyIsNotCorrect: 'Ovaj API ključ NIJE važeći',
    },
    title: 'Titula',
    titleValues: {
      mr: 'G.',
      ms: 'Gđa',
      preferNotToSay: 'Ne želim da se izjasnim',
    },
  },
  chainView: {
    baseUnit: {
      confirmDelete:
        'Brisanjem osnovne jedinice poništićete sve izbore "promjenljive zasnovane na površini". Nastaviti?',
    },
    downloadSummaryJSON: 'Preuzmi rezime (JSON)',
    mauFile: {
      upload: 'Otpremi MAU.zip',
      download: 'Preuzmi MAU.zip',
      delete: 'Obriši MAU.zip',
      confirmCycleAssociation:
        'Fajl MAU.zip biće povezan sa trenutnim ciklusom ({{cycle}}). Da li želite da nastavite?',
      confirmReplace: 'Fajl MAU.zip je već otpremljen za ovaj lanac obrade. Da li želite da ga zamijenite?',
      confirmDelete: 'Obrisati fajl MAU.zip otpremljen za ovaj lanac obrade?',
      uploadComplete: 'Fajl MAU.zip je uspješno otpremljen',
      deleteComplete: 'Fajl MAU.zip je obrisan',
      invalidFileExtension: 'Molimo izaberite .zip fajl',
    },
    phase1Category: 'Kategorija 1. faze',
    phase1CategoryInfo: 'Izaberite kategoriju koja sadrži uzorke prve faze.',
    phase2JoinEntity: {
      label: 'Entitet za spajanje (2. faza)',
      info: 'Entitet koji se koristi za spajanje osnovne jedinice sa kategorijom 1. faze: sam entitet osnovne jedinice ili jedan od njegovih roditeljskih entiteta.',
    },
    phase2AsSamplingPointData: {
      label: 'Spoji pomoću veze sa podacima o tačkama uzorka',
      info: 'Ključ(evi) entiteta druge faze čitaju se iz tabele podataka o tačkama uzorka, koja je ista tabela koja se koristi za prvu fazu.',
    },
    phase1JoinAttribute: {
      label: 'Atribut za spajanje (1. faza)',
      info: 'Izaberite kolonu tabele $t(chainView.phase1Category) (dodatno svojstvo ili "code") koja se koristi za spajanje sa entitetom za spajanje 2. faze.',
    },
    phase2JoinAttribute: {
      label: 'Atribut za spajanje (2. faza)',
      info: `Izaberite atribut (entiteta 2. faze) za spajanje sa tabelom 1. faze; njegova vrijednost se upoređuje sa prethodnim atributom za spajanje 1. faze.`,
    },
    formLabel: 'Oznaka lanca obrade',
    basic: 'Osnovno',
    records: 'Zapisi',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Pošalji u RStudio samo podatke iz koraka analize',
    submitOnlySelectedRecordsIntoR: 'Pošalji u RStudio samo izabrane zapise',
    includeEntitiesWithoutData: 'Uključi entitete bez podataka',
    cannotStartRStudio: {
      common: 'Nije moguće pokrenuti RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): nema zapisa za slanje',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): prvo objavite istraživanje',
    },
    nonResponseBiasCorrection: 'Korekcija pristrasnosti zbog izostanka odgovora',
    nonResponseBiasCorrectionInfo: `Da biste primijenili metod prilagođavanja težina po klasama (Weighting Class Adjustment), dodajte 'design_psu' i 'design_ssu' u tabelu kategorije stratuma kao dodatna numerička svojstva`,
    pValue: 'P-vrijednost',
    resultsBackFromRStudio: 'Rezultati vraćeni iz RStudio-a',
    resultsBackFromRStudioInfo: `Omogućite ovu opciju ako atribute rezultata izračunate u RStudio-u treba ponovo uvesti na Arena server.
Ovo može biti spor proces.`,
    samplingDesign: 'Dizajn uzorkovanja',
    samplingDesignDetails: 'Detalji dizajna uzorkovanja',
    samplingStrategyLabel: 'Strategija uzorkovanja',
    samplingStrategy: {
      simpleRandom: 'Prosto slučajno uzorkovanje',
      systematic: 'Sistematsko uzorkovanje',
      stratifiedRandom: 'Stratifikovano slučajno uzorkovanje',
      stratifiedSystematic: 'Stratifikovano sistematsko uzorkovanje',
      twoPhase: 'Dvofazno uzorkovanje',
    },
    statisticalAnalysis: {
      header: 'Statistička analiza',
      entityToReport: 'Entitet za izvještaj',
      entityWithoutData: 'Entitet {{name}} nema podataka',
      filter: 'Filter (R skripta)',
      reportingMethod: 'Metod izvještavanja',
      reportingMethods: {
        dimensionsCombined: 'Kombinacija dimenzija',
        dimensionsSeparate: 'Dimenzije odvojeno',
      },
      reportingArea: 'Ukupna površina izvještavanja (ha) (opciono)',
      reportingAreaInfo: `Kod stratifikovanog uzorkovanja, navedite površine stratuma u tabeli kategorije atributa stratuma (naziv kolone 'area')`,
    },
    stratumAttribute: 'Atribut stratuma',
    stratumAttributeInfo: 'Izaberite promjenljivu koja se koristi za stratifikaciju uzorka.',
    stratumAttribute2ndPhaseInfo:
      'Izaberite promjenljivu koja se koristi za podstratifikaciju uzorka prve faze prije izvlačenja konačnog, detaljnog poduzorka. Prikazani su samo atributi čiji se naziv pojavljuje i kao kolona kategorije 1. faze.',
    postStratificationAttribute: 'Atribut poststratifikacije',
    areaWeightingMethod: 'Metod ponderisanja po površini',
    clusteringEntity: 'Entitet klastera',
    clusteringEntityInfo:
      'Entitet koji definiše primarne jedinice uzorkovanja. Napomena: koristi se isključivo za klaster analizu u okviru R paketa survey.',
    clusteringOnlyVariances: 'Klasterovanje samo za varijanse',
    errorNoLabel: 'Lanac obrade treba da ima važeću oznaku',
    dateExecuted: 'Datum izvršavanja',
    deleteChain: 'Obriši lanac obrade',
    deleteConfirm: `Obrisati ovaj lanac obrade?

$t(common.cantUndoWarning)`,
    deleteComplete: 'Lanac obrade je obrisan',
    cloneFromAnotherSurvey: 'Kloniraj iz drugog istraživanja',
    cloneFromAnotherSurveyDialog: {
      title: 'Kloniraj lanac obrade iz drugog istraživanja',
      sourceSurvey: 'Izvorno istraživanje',
      sourceChain: 'Izvorni lanac obrade',
      entityCheck: 'Kompatibilnost entiteta',
      entityMissing: 'nedostaje u ciljnom istraživanju',
      skipMissingEntities: 'Preskoči atribute analize za entitete koji nedostaju u ciljnom istraživanju',
      noAnalysisAttributes: 'Ovaj lanac obrade nema atribute analize',
      cloneComplete: 'Lanac obrade je uspješno kloniran',
      missingEntities: 'Kloniranje nije moguće: sljedeći entiteti ne postoje u ciljnom istraživanju: {{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles: `Definicija čvora "{{label}}" ne može se izabrati jer ne pripada svim ciklusima lanca obrade`,
    cannotSelectCycle: 'Ovaj ciklus se ne može izabrati jer neke definicije čvorova ne pripadaju ovom ciklusu',
    copyRStudioCode: `#### Upravo ćete otvoriti RStudio Server ####

##### Kliknite na dugme OK i ove komande će biti kopirane u vaš međuspremnik. #####

###### RStudio Server će se otvoriti; kada RStudio konzola postane aktivna, nalijepite i pokrenite sljedeće redove da biste uvezli kod lanca obrade: ######

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Lanac obrade u RStudio ####

###### Kliknite na dugme OK i ove komande će biti kopirane u vaš međuspremnik. ######

###### Pokrenite RStudio na svom računaru (treba da imate instaliran paket 'rstudioapi'). ######

###### Kada RStudio konzola postane aktivna, nalijepite i pokrenite sljedeće redove da biste uvezli kod lanca obrade: ######


{{rStudioCode}}

`,
    entities: {
      new: 'Virtuelni entitet',
    },
    reportingDataCategory: 'Naziv tabele kategorije',
    reportingDataAttribute: 'Atribut za {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Tabela podataka za izvještavanje i spajanja sa atributima',
    showSamplingAttributes: 'Prikaži atribute uzorkovanja',
  },
  instancesView: {
    title: 'Instance',
    terminate: 'Zaustavi',
  },
  chain: {
    quantitative: 'Kvantitativni',
    categorical: 'Kategorijski',
    addQuantitative: 'Dodaj kvantitativni atribut',
    addCategorical: 'Dodaj kategorijski atribut',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts: 'entitet i sve povezane promjenljive rezultata biće isključeni iz RStudio skripti',
    entityWithoutData: 'Entitet {{name}} nema podataka; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'Entitet {{name}} nije dostupan u izabranom ciklusu; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Nevažeći ili istekao token',
    },
  },
  itemsTable: {
    unused: 'Nekorišćeno',
    noItemsAdded: 'Nema dodatih stavki',
  },
  expression: {
    functionHasTooFewArguments:
      'Funkcija {{fnName}} zahtijeva najmanje {{minArity}} argumenata (proslijeđeno: {{numArgs}})',
    functionHasTooManyArguments:
      'Funkcija {{fnName}} prihvata najviše {{maxArity}} argumenata (proslijeđeno: {{numArgs}})',
    identifierNotFound: 'Atribut ili entitet "{{name}}" nije pronađen',
    invalid: 'Nevažeći izraz: {{details}}',
    invalidAttributeValuePropertyName: 'Nevažeći naziv svojstva vrijednosti atributa: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Nevažeći naziv dodatnog svojstva: {{propName}}',
    invalidCategotyName: 'Nevažeći naziv kategorije: {{name}}',
    invalidTaxonomyExtraProp: 'Nevažeći naziv dodatnog svojstva taksonomije: {{propName}}',
    invalidTaxonomyName: 'Nevažeći naziv taksonomije: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Nevažeća šifra jezika narodnog naziva taksona: {{vernacularLangCode}}',
    missingFunctionParameters: 'Nedostaju parametri funkcije',
    undefinedFunction: 'Nedefinisana funkcija: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
O aplikaciji
========

$t(common.appNameFull)
--------

 * Razvio: $t(links.openforis)
 * Verzija: {{version}}
 * Veb-sajt: $t(links.openforisArenaWebsite)
 * Video uputstva za Arena na FAO elearning Academy: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Video uputstva za Arena na YouTube-u: $t(links.arenaVideoTutorialsInYouTube)
 * Forum za podršku: $t(links.supportForum)
 * Arena na GitHub-u: $t(links.arenaInGitHub)
 * Arena R skripte na GitHub-u: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Jezik(ci)',
  },
  taxonomy: {
    header: 'Taksonomija',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taksonomija'})`,
    confirmDelete: 'Obrisati taksonomiju {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Kloniraj taksonomiju iz drugog istraživanja',
      sourceSurvey: 'Izvorno istraživanje',
      sourceTaxonomy: 'Izvorna taksonomija',
      loadingSurveys: 'Učitavanje istraživanja...',
      noSurveysAvailable: 'Nema dostupnih istraživanja',
      selectSurveyFirst: 'Prvo izaberite istraživanje',
      loadingTaxonomies: 'Učitavanje taksonomija...',
      noTaxonomiesAvailable: 'U izabranom istraživanju nema dostupnih taksonomija',
    },
    edit: {
      taxonomyListName: 'Naziv liste taksonomije',
      taxaNotImported: 'Taksoni nisu uvezeni',
      family: 'Porodica',
      genus: 'Rod',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Sinonim / latinski',
      extraPropsNotDefined: 'Dodatna svojstva nisu definisana za ovu taksonomiju',
      importMissingPublishedTaxa:
        'Objavljenih taksona koji nisu pronađeni u uvezenom fajlu i ostali su nepromijenjeni: {{count}}. Šifre: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} još)',
    },
    taxaCount: 'Broj taksona',
    vernacularNameLabel: 'Oznaka narodnog naziva',
  },
  categoryList: {
    batchImport: 'Grupni uvoz kategorija (iz ZIP-a)',
    batchImportCompleteSuccessfully: `Uspješno uvezeno kategorija: {{importedCategories}}
Novih: {{insertedCategories}}
Ažuriranih: {{updatedCategories}}`,
    cloneFromAnotherSurvey: {
      title: 'Kloniraj kategoriju iz drugog istraživanja',
      sourceSurvey: 'Izvorno istraživanje',
      sourceCategory: 'Izvorna kategorija',
      loadingSurveys: 'Učitavanje istraživanja...',
      noSurveysAvailable: 'Nema dostupnih istraživanja',
      selectSurveyFirst: 'Prvo izaberite istraživanje',
      loadingCategories: 'Učitavanje kategorija...',
      noCategoriesAvailable: 'U izabranom istraživanju nema dostupnih kategorija',
    },
    itemsCount: 'Broj stavki',
    structure: 'Struktura',
    types: {
      flat: 'Ravna',
      hierarchical: 'Hijerarhijska',
      reportingData: 'Podaci za izvještavanje',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Podaci o tačkama uzorka',
    },
  },
  categoryEdit: {
    header: 'Kategorija',
    addLevel: 'Dodaj nivo',
    categoryName: 'Naziv kategorije',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'kategorija'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'nivo kategorije'})`,
    confirmDelete: 'Obrisati kategoriju {{categoryName}}?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'Kategorija je **prazna** i biće obrisana. Nastaviti?',
    confirmDeleteLevel: `Obrisati nivo kategorije '{{levelName}}' sa svim stavkama?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Obrisati stavku?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Obrisati stavku sa svim podređenim stavkama?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Pretvori u podatke za izvještavanje',
      confirmMessage: `Pretvoriti ovu kategoriju u kategoriju podataka za izvještavanje?

Nivoi će biti preimenovani u level_1, level_2... level_N, a stavkama će biti dodato dodatno svojstvo 'area'.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Pretvoriti ovu kategoriju podataka za izvještavanje u jednostavnu kategoriju?`,
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Pretvori u podatke o tačkama uzorka',
      confirmMessage: `Pretvoriti ovu kategoriju u kategoriju podataka o tačkama uzorka?

Kategorija će biti preimenovana u '${samplingPointDataCategoryName}', a stavkama će biti dodato dodatno svojstvo '${locationItemExtraDefName}'.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Pretvori u GeoPackage kategoriju',
      confirmMessage: `Pretvoriti ovu kategoriju u GeoPackage kategoriju?

Stavkama će biti dodato dodatno svojstvo '${locationItemExtraDefName}'.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Pretvori u jednostavnu kategoriju',
      confirmMessage: `Pretvoriti ovu GeoPackage kategoriju u jednostavnu kategoriju?

Dodatno svojstvo '${locationItemExtraDefName}' biće otključano, pa se može preimenovati, mijenjati mu se tip ili obrisati kao i svako drugo dodatno svojstvo. Njegovi podaci ostaju nepromijenjeni.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Pretvori u jednostavnu kategoriju',
      confirmMessage: `Pretvoriti ovu kategoriju podataka o tačkama uzorka u jednostavnu kategoriju?

Naziv kategorije biće obrisan (moraćete da joj date novi naziv), a dodatno svojstvo '${locationItemExtraDefName}' biće otključano, pa se može preimenovati, mijenjati mu se tip ili obrisati kao i svako drugo dodatno svojstvo. Njegovi podaci ostaju nepromijenjeni.`,
    },
    geoPackageCategory: 'Ova kategorija ima geo mogućnosti',
    geoPackageCategoryInfo: `Ova kategorija ima dodatno svojstvo '${locationItemExtraDefName}', koje omogućava njen izvoz kao GeoPackage fajla.`,
    samplingPointDataCategoryType: 'Ovo je kategorija podataka o tačkama uzorka',
    samplingPointDataCategoryTypeInfo: `Ovo je unaprijed definisana kategorija za podatke o tačkama uzorka. Ima dodatno svojstvo '${locationItemExtraDefName}', koje omogućava njen izvoz kao GeoPackage fajla.`,
    samplingPointDataCategoryLocationMissing: `Nedostaje dodatno svojstvo '${locationItemExtraDefName}'`,
    createCategory: {
      menuLabel: 'Dodaj kategoriju',
      simple: 'Jednostavna kategorija',
      otherTypes: 'Ostali tipovi kategorija',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Kategorija podataka o tačkama uzorka',
      description: 'Unaprijed definisana kategorija za podatke o tačkama uzorka, sa poljem lokacije za svaku stavku.',
      message: `Kreirati novu kategoriju podataka o tačkama uzorka?

Stavkama će biti dodato dodatno svojstvo '${locationItemExtraDefName}'.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Kategorija sa geo mogućnostima',
      description: 'Dodaje stavkama polje lokacije, tako da se kategorija može izvesti kao GeoPackage fajl.',
      message: `Kreirati novu kategoriju sa geo mogućnostima?

Stavkama će biti dodato dodatno svojstvo '${locationItemExtraDefName}'.`,
    },
    deleteItem: 'Obriši stavku',
    level: {
      title: 'Nivo {{levelPosition}}',
      noItemsDefined: 'Nema definisanih stavki',
      selectItemFromPreviousLevel: 'Izaberite stavku iz prethodnog nivoa',
    },

    importSummary: {
      columns: 'Kolona',
      columnTypeSummary: 'Nivo {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Opis ({{language}})',
      columnTypeLabel: 'Oznaka ({{language}})',
      columnType: {
        code: 'šifra',
        description: 'opis',
        label: 'oznaka',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Tip podataka',
      title: 'Rezime uvoza kategorije',
    },
    reportingData: 'Podaci za izvještavanje',
    exportToGeoPackage: 'Izvezi u GeoPackage',
    exportToGeoPackageSkippedItems: 'Preskočeno je stavki bez važeće lokacije: {{count}}.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Generiši Whisp analizu',
      confirmMessage: `Generisati Whisp analizu za sve tačke uzorka?

- svaka tačka uzorka sa lokacijom biće poslata servisu Open Foris Whisp na analizu
- rezultati će biti objedinjeni sa podacima o tačkama uzorka i sačuvani u kategoriji '${samplingPointDataWhispCategoryName}'
- ako kategorija '${samplingPointDataWhispCategoryName}' već postoji, njen sadržaj biće zamijenjen
- analiza se izvršava u pozadini i može trajati nekoliko minuta, u zavisnosti od broja tačaka uzorka`,
    },
    templateFor_samplingPointDataImport_csv: 'Šablon za uvoz podataka o tačkama uzorka (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Šablon za uvoz podataka o tačkama uzorka (Excel)',
  },
  extraProp: {
    label: 'Dodatno svojstvo',
    label_other: 'Dodatna svojstva',
    addExtraProp: 'Dodaj dodatno svojstvo',
    dataTypes: {
      geometryPoint: 'Geometrijska tačka',
      number: 'Broj',
      text: 'Tekst',
    },
    editor: {
      title: 'Uredi $t(extraProp.label_other)',
      confirmDelete: 'Obrisati dodatno svojstvo "{{name}}"?',
      confirmSave: `Sačuvati izmjene definicija dodatnih svojstava?

  **Upozorenja**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Naziv je promijenjen iz {{nameOld}} u {{nameNew}}',
        dataTypeChanged: 'Tip podataka je promijenjen iz {{dataTypeOld}} u {{dataTypeNew}}',
      },
    },
    name: 'Naziv svojstva {{position}}',
    value: 'Vrijednost',
  },
  record: {
    ancestorNotFound: 'Nadređeni čvor nije pronađen u zapisu',
    keyDuplicate: 'Duplikat ključa zapisa',
    oneOrMoreInvalidValues: 'Jedna ili više vrijednosti nisu važeće',
    uniqueAttributeDuplicate: 'Duplikat vrijednosti',

    attribute: {
      customValidation: 'Nevažeća vrijednost',
      uniqueDuplicate: 'Duplikat vrijednosti',
      valueInvalid: 'Nevažeća vrijednost',
      valueRequired: 'Obavezna vrijednost',
    },
    entity: {
      keyDuplicate: 'Duplikat ključa entiteta',
    },
    nodes: {
      count: {
        invalid: 'Broj čvorova {{nodeDefName}} mora biti tačno {{count}}',
        maxExceeded: 'Broj čvorova {{nodeDefName}} mora biti manji ili jednak {{maxCount}}',
        minNotReached: 'Broj čvorova {{nodeDefName}} mora biti veći ili jednak {{minCount}}',
      },
    },
  },

  // ====== Common components
  expressionEditor: {
    and: 'I',
    or: 'ILI',
    group: 'Grupa ()',
    var: 'Promjenljiva',
    const: 'Konstantna vrijednost',
    call: 'Funkcija',
    operator: 'Operator',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Atribut koordinate polazne tačke',
      distanceAttribute: 'Atribut udaljenosti',
      bearingAttribute: 'Atribut azimuta',
    },
    geoDistanceToAOIBoundaryEditor: {
      areaOfInterestNotDefined:
        'Područje od interesa istraživanja još nije definisano: definišite ga u Informacije o istraživanju → Mapa',
    },
    coordinateAttribute: 'Atribut koordinate',
    coordinateAttributeWithPosition: 'Atribut koordinate {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Prvi atribut datuma',
      firstTimeAttribute: 'Prvi atribut vremena',
      secondDateAttribute: 'Drugi atribut datuma',
      secondTimeAttribute: 'Drugi atribut vremena',
    },
    error: {
      selectOneVariable: 'Molimo izaberite jednu promjenljivu',
    },

    header: {
      editingExpressionForNodeDefinition: 'Uređivanje izraza ({{qualifier}}) za "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Uređivanje funkcije "{{functionName}}" za "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'podrazumijevana vrijednost',
      'default-values-apply-if': 'primjena podrazumijevane vrijednosti ako',
      'editable-if': 'može se uređivati ako',
      'max-count': 'maksimalan broj',
      'min-count': 'minimalan broj',
      'relevant-if': 'primjenjivo ako',
      validations: 'pravilo validacije',
      'validations-apply-if': 'primjena pravila validacije ako',
      'visible-if': 'vidljivost',
    },

    selectAFunction: 'Izaberite funkciju',

    valueType: {
      constant: 'Konstanta',
      expression: 'Izraz',
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
    title: 'Generiši izraz iz opisa',
    hint: 'Opišite običnim jezikom šta izraz treba da radi. AI će ga prevesti u Arena sintaksu. Pritisnite Ctrl+Enter za generisanje.',
    placeholder: 'npr. visina stabla mora biti veća od 0 i manja od 200',

    generate: 'Generiši',
    generating: 'Generisanje…',
    use: 'Koristi ovaj izraz',
    useAnyway: 'Ipak koristi',
    tryAgain: 'Pokušajte s drugačijim opisom',
    parseError:
      'Generisani izraz nije ispravno raščlanjen: {{message}}. I dalje ga možete primijeniti i ručno urediti, ili pokušajte da preformulišete opis.',

    explain: {
      title: 'Objasni ovaj izraz',
      thinking: 'Traži se od AI-ja da objasni ovaj izraz…',
      error: 'Preuzimanje objašnjenja nije uspjelo: {{message}}',
      timeout: 'AI je predugo odgovarao. Molimo pokušajte ponovo.',
    },
  },
  aiTranslation: {
    translateButton_one: 'Prevedi na {{count}} drugi jezik',
    translateButton_few: 'Prevedi na {{count}} druga jezika',
    translateButton_other: 'Prevedi na {{count}} drugih jezika',
    translateButton: 'Prevedi na druge jezike',

    success_one: 'Prevedeno na {{count}} jezik. Pregledajte i sačuvajte.',
    success_few: 'Prevedeno na {{count}} jezika. Pregledajte i sačuvajte.',
    success_other: 'Prevedeno na {{count}} jezika. Pregledajte i sačuvajte.',
    success: 'Prevedeno. Pregledajte i sačuvajte.',

    failed: 'Prevođenje nije uspjelo: {{message}}',
    timeout: 'Isteklo je vrijeme za zahtjev za prevod. Molimo pokušajte ponovo.',
  },
  aiActivityLog: {
    title: 'Rezime dnevnika aktivnosti',
    summarizeButton: 'Sažmi',
    thinking: 'Objedinjavanje događaja i slanje AI-ju zahtjeva za sažetak…',
    error: 'Preuzimanje sažetka nije uspjelo: {{message}}',
  },
  aiChatbot: {
    open: 'Pomoć i dokumentacija',
    title: 'Pomoć i dokumentacija',
    empty: 'Pitajte me bilo šta o Open Foris Arena.',
    placeholder: 'Unesite pitanje…',
    send: 'Pošalji',
    stop: 'Zaustavi',
    clear: 'Očisti',
    showReasoning: 'Prikaži obrazloženje',
    error: 'Greška chatbota: {{message}}',
    language: 'Jezik odgovora',
  },
}
