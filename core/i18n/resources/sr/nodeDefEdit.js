export default {
  additionalFields: 'Dodatna polja',
  basic: 'Osnovno',
  advanced: 'Napredno',
  mobileApp: 'Mobilna aplikacija',
  print: 'Štampa',
  printProps: {
    printOrientation: {
      label: 'Orijentacija stranice',
      info: 'Orijentacija koja se koristi kada ovaj entitet započinje sopstveni odjeljak za štampu. Podrazumijevana preuzima orijentaciju dokumenta izabranu pri izvozu.',
    },
    orientations: {
      default: 'Podrazumijevana (dokument)',
      portrait: 'Uspravno',
      landscape: 'Položeno',
    },
  },
  validations: 'Validacije',
  function: 'Funkcija',
  editingFunction: 'Uređivanje funkcije {{functionName}}',
  editorHelp: {
    json: 'Važeći izrazi su podskup Javascript-a.',
    sql: 'Dozvoljeni su samo važeći SQL izrazi.',
  },
  editorCompletionHelp: '- Prikaži dostupne promjenljive i funkcije koje se mogu koristiti',
  functionDescriptions: {
    categoryItemProp:
      'Vraća vrijednost navedenog svojstva $t(extraProp.label) stavke kategorije koja ima navedenu šifru',
    dateTimeDiff: 'Vraća razliku (u minutima) između 2 para datum-vrijeme',
    distance: 'Vraća udaljenost (u metrima) između navedenih koordinata',
    first: 'Vraća prvu vrijednost ili čvor navedenog višestrukog atributa ili entiteta',
    geoCoordinateAtDistance: 'Vraća koordinate na navedenoj udaljenosti i azimutu od navedenih koordinata',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoDistanceToAOIBoundary:
      'Vraća udaljenost (u metrima) između koordinate i granice područja od interesa istraživanja: negativna unutar područja, pozitivna van njega',
    geoPolygon: 'Generiše poligon u GeoJSON formatu iz liste koordinata',
    includes: 'Vraća true ako navedeni višestruki atribut sadrži navedenu vrijednost.',
    index: 'Vraća indeks navedenog čvora među njegovim srodnim čvorovima',
    isEmpty: 'Vraća true ako argument nema navedenu vrijednost',
    isNotEmpty: 'Vraća true ako argument ima neku navedenu vrijednost',
    last: 'Vraća posljednju vrijednost ili čvor navedenog višestrukog atributa ili entiteta',
    ln: 'Vraća prirodni logaritam od X',
    log10: 'Vraća logaritam od X sa osnovom 10',
    max: 'Vraća maksimum argumenata',
    min: 'Vraća minimum argumenata',
    now: 'Vraća trenutni datum ili vrijeme',
    parent: 'Vraća roditeljski entitet navedenog čvora',
    pow: 'Vraća vrijednost osnove podignute na stepen',
    prevCycleNote:
      'Radi samo u aplikaciji Arena Mobile kada je definisano više ciklusa i kada je omogućena veza sa prethodnim ciklusom',
    prevCycleValue:
      'Vraća vrijednost istog atributa u zapisu prethodnog ciklusa. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Vraća vrijednosti istih atributa u zapisu prethodnog ciklusa. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Vraća ciklus trenutnog zapisa',
    recordDateCreated:
      'Vraća datum i vrijeme kreiranja trenutnog zapisa kao vrijednost datuma i vremena. Može se koristiti u tekstualnom atributu, atributu datuma ili vremena',
    recordDateLastModified:
      'Vraća datum i vrijeme posljednje izmjene trenutnog zapisa kao vrijednost datuma i vremena. Može se koristiti u tekstualnom atributu, atributu datuma ili vremena',
    recordOwnerEmail: 'Vraća e-mail korisnika koji je vlasnik zapisa',
    recordOwnerName: 'Vraća ime korisnika koji je vlasnik zapisa',
    recordOwnerRole: 'Vraća ulogu (u trenutnom istraživanju) korisnika koji je vlasnik zapisa',
    rowIndex: 'Vraća indeks trenutnog reda tabele (ili obrasca)',
    taxonProp: 'Vraća vrijednost navedenog svojstva $t(extraProp.label) taksona koji ima navedenu šifru',
    taxonVernacularName: 'Vraća (prvi) narodni (ili lokalni) naziv na navedenom jeziku taksona koji ima navedenu šifru',
    unique: 'Vraća jedinstvene vrijednosti višestrukog atributa ili entiteta',
    userEmail: 'Vraća e-mail prijavljenog korisnika',
    userIsRecordOwner:
      'Vraća logičku vrijednost "true" ako je korisnik koji uređuje zapis ujedno i njegov vlasnik, a "false" u suprotnom',
    userName: 'Vraća ime prijavljenog korisnika',
    userProp: 'Vraća vrijednost navedenog svojstva $t(extraProp.label) prijavljenog korisnika',
    uuid: 'Generiše UUID (univerzalno jedinstveni identifikator) koji se može koristiti kao identifikator (npr. kao ključni atribut entiteta)',
    // SQL functions
    avg: 'Vraća prosječnu vrijednost numeričke promjenljive',
    count: 'Vraća broj redova koji ispunjavaju navedeni kriterijum',
    sum: 'Vraća ukupan zbir numeričke promjenljive',
  },
  functionName: {
    rowIndex: 'Indeks reda',
  },
  basicProps: {
    analysis: 'Analiza',
    autoIncrementalKey: {
      label: 'Automatski uvećavan',
      info: 'Vrijednost će biti automatski generisana',
    },
    autoCreateMinCountItems: {
      label: 'Automatski kreiraj minimalan broj stavki',
      info: 'Kada entitet postane relevantan ili kada se kreira njegov roditeljski entitet, automatski će se generisati broj entiteta jednak minimalnom broju.',
    },
    displayAs: 'Prikaži kao',
    displayIn: 'Prikaži u',
    entitySource: 'Izvor entiteta',
    enumerate: {
      label: 'Nabroj',
      info: `Redovi će biti automatski generisani korišćenjem stavki kategorije povezanih sa atributom šifre označenim kao Ključ, definisanim unutar entiteta; redovi se ne mogu dodavati ni brisati, a ključni atribut šifre neće se moći uređivati`,
    },
    enumeratingItemsExpression: {
      label: 'Izraz za stavke nabrajanja',
      info: 'Opcioni izraz koji filtrira koje stavke kategorije se nabrajaju (npr. unique(table_source.source_type)). Ako je prazan, koriste se sve stavke kategorije.',
    },
    enumerator: {
      label: 'Nabrajač',
      info: 'Stavke u kategoriji će se koristiti za generisanje redova roditeljskog entiteta',
    },
    form: 'Obrazac',
    formula: 'Formula',
    includedInClonedData: 'Uključeno u klonirane podatke',
    includedInMultipleEntitySummary: {
      label: 'Uključi u pregled višestrukog entiteta',
      info: `Ako je označeno, vrijednost atributa biće vidljiva u biraču entiteta (u aplikaciji Arena) i u pregledu entiteta (u aplikaciji Arena Mobile)`,
    },
    includedInRecordsList: {
      label: 'Uključi u listu zapisa',
      info: `Ako je označeno, atribut će biti vidljiv u listi zapisa`,
    },
    key: 'Ključ',
    maxKeysCountReached: 'Dostignut je maksimalan broj ključeva ({{maxKeysCount}})',
    multiple: 'Višestruko',
    ownPage: 'Sopstvena stranica',
    parentPage: 'Roditeljska stranica ({{parentPage}})',
    qualifier: {
      label: 'Kvalifikator',
      info: `Kada korisnik koji pripada nekoj grupi kreira novi zapis, ovaj atribut će biti automatski popunjen vrijednošću navedenom za njega u kvalifikatorima korisnikove grupe. Korisnici će moći da vide i mijenjaju samo zapise koji pripadaju njihovoj grupi, ako pripadaju nekoj.`,
    },
    table: 'Tabela',
  },
  advancedProps: {
    areaBasedEstimate: 'Procjena na osnovu površine',
    defaultValues: 'Podrazumijevane vrijednosti',
    defaultValuesInfo: `Ovo vam omogućava da automatski popunite odgovor na osnovu određenih pravila.
Ako postavite više pravila, sistem će ih provjeravati redom, odozgo nadolje.
Primijeniće prvo pravilo koje ispunjava vaše uslove i koristiti ga kao odgovor.`,
    defaultValueEvaluatedOneTime: 'Podrazumijevana vrijednost se izračunava samo jednom',
    defaultValueEvaluatedOneTimeInfo: `Podrazumijevana vrijednost biće izračunata samo jednom, kada se atribut kreira.
Ako nije označeno, podrazumijevana vrijednost biće ponovo izračunata pri svakom ažuriranju zapisa.
Treba je označiti kada se koriste izrazi kao što su now() ili uuid() koji treba da se izračunaju samo jednom, kada se vrijednost atributa generiše prvi put.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Podrazumijevane vrijednosti se ne mogu uređivati jer je postavljen automatski uvećavan ključ',
    defaultValuesNotSpecified: 'Podrazumijevane vrijednosti nisu navedene',
    defaultValuesSpecified: 'Podrazumijevane vrijednosti su navedene',
    editableIf: 'Mogućnost uređivanja',
    editableIfInfo: `Podrazumijevano, korisnik uvijek može pristupiti relevantnom polju.
Ovdje možete postaviti pravilo da li korisnik može da unosi ili mijenja ovo polje.
Ako su postavljeni uslovi ispunjeni, polje se može uređivati. U suprotnom, postaje "samo za čitanje" (zaključano).`,
    editableAlways: 'Uvijek se može uređivati',
    editableIfConditionIsMet: 'Može se uređivati ako je uslov ispunjen',
    hidden: 'Uvijek skriveno',
    hiddenInReport: 'Skriveno u analitičkoj kontrolnoj tabli',
    hiddenInReportInfo: `Ako je označeno, atribut neće biti vidljiv u analitičkoj kontrolnoj tabli`,
    hiddenWhenNotRelevant: 'Skriveno kada nije relevantno',
    itemsFilter: 'Filter stavki',
    itemsFilterInfo: `Izraz koji se koristi za filtriranje stavki koje se mogu izabrati.
U izrazu, riječ "this" odnosi se na samu stavku.
Npr. this.region = region_attribute_name
(gdje je "region" naziv dodatnog svojstva definisanog za stavku, a region_attribute_name naziv atributa u istraživanju)`,
    readOnly: 'Samo za čitanje',
    relevantIf: 'Relevantnost',
    relevantIfInfo: `Podrazumijevano, sva polja su uvijek aktivna.
Ako postavite pravilo relevantnosti i ono nije ispunjeno, polje će postati sivo ili će biti potpuno skriveno,
a svi automatski odgovori biće zanemareni.
Koristite ovo za dinamičko prikazivanje ili skrivanje djelova istraživanja; npr. prikazivanje tekstualnog polja "Navedite" samo ako korisnik u prethodnom pitanju izabere "Ostalo".`,
    relevantIfRadioNone: 'Uvijek relevantno',
    relevantIfRadioDefined: 'Relevantno ako je uslov ispunjen',
    script: 'Skripta',
    visibleIf: 'Vidljivost',
    visibleIfInfo: `Podrazumijevano, polje je uvijek vidljivo.
Ako postavite pravilo, polje će biti vidljivo samo kada je to pravilo ispunjeno; u suprotnom, biće skriveno.
Napomena: za razliku od "neaktivnog" (nerelevantnog) polja, skriveno polje i dalje može imati automatski odgovor sačuvan u pozadini.
Ovo je idealno za skrivanje cijelih djelova istraživanja u zavisnosti od toga ko je prijavljen (npr. prema korisničkim ulogama).`,
    visibleAlways: 'Uvijek vidljivo',
    visibleIfConditionIsMet: 'Vidljivo ako je uslov ispunjen',
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Skriveno u aplikaciji Arena Mobile',
      info: `Ako je označeno, atribut neće biti vidljiv u AM`,
    },
    includedInPreviousCycleLink: {
      label: 'Uključi u vezu sa prethodnim ciklusom',
      info: `Ako je označeno, vrijednost iz prethodnog ciklusa biće prikazana na obrascu za unos podataka (kada je veza sa prethodnim ciklusom aktivirana u mobilnoj aplikaciji)`,
    },
  },
  numericProps: {
    unit: 'Jedinica',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Maks. broj decimalnih mjesta',
  },
  fileProps: {
    fileNameExpression: 'Izraz za naziv fajla',
    fileType: 'Tip fajla',
    fileTypes: {
      image: 'Slika',
      video: 'Video',
      audio: 'Audio',
      other: 'Ostalo',
    },
    maxFileSize: 'Maks. veličina fajla (Mb)',
    numberOfFiles: 'Idite na Validacije da biste promijenili min. i maks. broj fajlova.',
    showGeotagInformation: 'Prikaži informacije o geooznaci',
  },
  mobileProps: {
    title: 'Mobilna aplikacija',
  },
  timeProps: {
    includeSeconds: 'Uključi sekunde',
  },
  geoProps: {
    positionTracking: 'Praćenje položaja',
    positionTrackingInfo: `Odnosi se samo na Arena Mobile: ako je označeno, vrijednost je putanja koju je korisnik prešao tokom popunjavanja zapisa (zabilježena praćenjem položaja uređaja) i ne može se ručno uređivati`,
  },
  formHeaderProps: {
    headerColorLabel: 'Boja zaglavlja',
    headerColor: {
      blue: 'Plava',
      green: 'Zelena',
      orange: 'Narandžasta',
      red: 'Crvena',
      yellow: 'Žuta',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hiperveza',
      markdown: 'Markdown',
      text: 'Tekst',
    },
    textInputType: 'Tip unosa teksta',
    textInputTypes: {
      singleLine: 'Jedan red',
      multiLine: 'Više redova',
    },
    textTransform: 'Transformacija teksta',
    textTransformTypes: {
      none: 'bez',
      capitalize: 'početno veliko slovo',
      uppercase: 'velika slova',
      lowercase: 'mala slova',
    },
  },
  booleanProps: {
    labelValue: 'Vrijednost oznake',
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Kategorija',
    codeShown: 'Prikaži šifru',
    displayAsTypes: {
      checkbox: 'Polje za potvrdu',
      dropdown: 'Padajuća lista',
    },
    parentCode: 'Roditeljska šifra',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: 'Dozvoli samo koordinatu uređaja',
    allowOnlyDeviceCoordinateInfo: `Odnosi se samo na Arena Mobile: ako je označeno, korisnik neće moći da mijenja X/Y vrijednosti, već se one mogu dobiti samo pomoću GPS-a uređaja`,
    mapMarkerColor: 'Boja markera na mapi',
  },
  expressionsProp: {
    expression: 'Izraz',
    applyIf: 'Primijeni ako',
    confirmDelete: 'Obrisati ovaj izraz?',
    severity: 'Ozbiljnost',
  },
  validationsProps: {
    minCount: 'Min. broj',
    maxCount: 'Maks. broj',
    expressions: 'Izrazi validacije',
    attributeAlwaysValid: 'Atribut uvijek važeći',
    attributeValidWhenConditionIsMet: 'Atribut važeći kada je uslov ispunjen',
    notRequired: 'Nije obavezno',
    alwaysRequired: 'Uvijek obavezno',
    requiredWhenConditionIsMet: 'Obavezno kada je uslov ispunjen',
  },
  cannotChangeIntoMultipleWithDefaultValues:
    'Ovaj čvor se ne može pretvoriti u višestruki jer ima podrazumijevane vrijednosti.',
  cannotDeleteNodeDefReferenced: `Nije moguće obrisati "{{nodeDef}}": na njega upućuju sljedeće definicije čvorova: {{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: 'Kloniraj',
    title: 'Kloniranje definicije čvora "{{nodeDefName}}"',
    entitySelectLabel: 'Entitet u koji se klonira:',
  },
  conversion: {
    dialogTitle: 'Pretvori {{nodeDefName}} u drugi tip',
    fromType: 'Iz tipa',
    toType: 'U tip',
  },
  moveDialog: {
    confirmButtonLabel: 'Premjesti',
    title: 'Premještanje definicije čvora "{{nodeDefName}}" iz "{{parentNodeDefName}}"',
    entitySelectLabel: 'Entitet u koji se premješta:',
  },
  movedNodeDefinitionHasErrors:
    'Definicija čvora "{{nodeDefName}}" koju ste premjestili ima greške; molimo ispravite ih.',
  nodeDefintionsHaveErrors: 'Sljedeće definicije čvorova imaju greške: {{nodeDefNames}}. Molimo ispravite ih.',
  filterVariable: 'Promjenljiva za filtriranje stavki',
  filterVariableForLevel: 'Promjenljiva za {{levelName}}',
  unique: {
    label: 'Jedinstveno',
    info: `Kada je atribut označen kao **Jedinstveno**, njegova vrijednost mora biti jedinstvena unutar najbližeg višestrukog entiteta (u suprotnom će biti prikazana greška).

---

Npr. u strukturi kao što je *klaster -> ploha -> stablo*, ako imate atribut *tree_species* označen kao **Jedinstveno**, možete imati samo jedno stablo po vrsti unutar iste *plohe*.`,
  },
  nodeDefClonedSuccessfully: 'Definicija čvora "{{nodeDefName}}" je uspješno klonirana u "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: 'Sljedeće kategorije su takođe klonirane iz izvornog istraživanja: {{names}}',
  taxonomiesClonedFromSurvey: 'Sljedeće taksonomije su takođe klonirane iz izvornog istraživanja: {{names}}',
}
