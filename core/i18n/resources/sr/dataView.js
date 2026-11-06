export default {
  charts: {
    downloadToPng: 'Preuzmi grafikon kao PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Izaberite jednu dimenziju i jednu mjeru da biste prikazali grafikon',
      selectAtLeast2NumericAttributes: 'Izaberite 2 numerička atributa da biste prikazali grafikon',
      tooManyItemsToShowChart: `Previše stavki za prikaz grafikona;
očekuje se najviše {{maxItems}} stavki.
Precizirajte upit (npr. dodavanjem filtera) da biste smanjili broj stavki.
`,
      sampleRandomOnly:
        'Prikazan je slučajni uzorak od {{sampleSize}} od ukupno {{totalCount}} stavki (nisu pronađene ekstremne vrijednosti).',
      sampleWithOutliers:
        'Prikazano je {{sampleSize}} od ukupno {{totalCount}} stavki: {{outliersCount}} ekstremnih vrijednosti i slučajni uzorak od {{randomCount}} ostalih stavki.',
      sampleOutliersOnly: 'Prikazano je {{sampleSize}} najekstremnijih vrijednosti od ukupno {{totalCount}} stavki.',
    },
    type: {
      area: 'Površinski grafikon',
      bar: 'Stubičasti grafikon',
      line: 'Linijski grafikon',
      pie: 'Kružni grafikon',
      scatter: 'Tačkasti grafikon',
    },
  },
  dataQuery: {
    ai: {
      button: 'Pitaj AI',
      buttonTitle: 'Generiši upit iz opisa pomoću AI',
      title: 'Generiši upit pomoću AI',
      hint: 'Opišite podatke koje želite da vidite; AI će izabrati entitet, atribute (ili dimenzije i mjere), filter i sortiranje. Zatim možete pregledati generisani upit i sačuvati ga u upravljaču upita.',
      placeholder: 'npr. broj stabala grupisanih po vrsti',
      generate: 'Generiši',
      generating: 'Generisanje…',
      replaceQueryConfirmMessage: 'Zamijeniti trenutni upit generisanim?',
      suggestSummary: 'Predloži naziv i opis',
      suggestSummaryFailed: 'Nije moguće predložiti naziv i opis upita: {{message}}',
      suggestSummaryTitle: 'Koristi AI da predloži naziv, oznaku i opis upita na osnovu trenutnih izbora',
      generatedSuccessfully:
        'Upit je generisan: {{explanation}} Provjerite rezultat i sačuvajte upit ako želite da ga zadržite.',
    },
    deleteConfirmMessage: 'Obrisati upit "{{name}}"?',
    displayType: {
      chart: 'Grafikon',
      table: 'Tabela',
    },
    manageQueries: 'Upravljaj upitima',
    mode: {
      label: 'Režim:',
      aggregate: 'Agregirano',
      raw: 'Neobrađeno',
      rawEdit: 'Uređivanje neobrađenih',
    },
    replaceQueryConfirmMessage: 'Zamijeniti trenutni upit izabranim?',
    showCodes: 'Prikaži šifre',
    showTotalAndPercentage: 'Prikaži ukupno i procenat',
    total: 'Ukupno',
  },
  editSelectedRecord: 'Uredi izabrani zapis',
  filterAttributeTypes: 'Filtriraj tipove atributa',
  filterAttributes: 'Filtriraj atribute',
  filterMessages: 'Filtriraj poruke',
  messageTypeFilter: {
    valueRequired: 'Obavezna vrijednost',
    valueInvalid: 'Neispravna vrijednost',
    uniqueDuplicate: 'Duplirana vrijednost',
    customValidation: 'Prilagođena validacija',
    entityKeyDuplicate: 'Duplirani ključ entiteta',
    recordKeyDuplicate: 'Duplirani ključ zapisa',
    nodesCount: 'Broj čvorova',
  },
  filterRecords: {
    buttonTitle: 'Filtriraj zapise',
    expressionEditorHeader: 'Izraz za filtriranje zapisa',
  },
  invalidRecord: 'Neispravan zapis',
  nodeDefsSelector: {
    hide: 'Sakrij birač definicija čvorova',
    show: 'Prikaži birač definicija čvorova',
    nodeDefFrequency: `{{nodeDefLabel}} (učestalost)`,
    searchPlaceholder: 'Pretraži varijablu po nazivu',
  },
  records: {
    clone: 'Kloniraj',
    confirmDeleteRecord: `Obrisati zapis "{{keyValues}}"?`,
    confirmDeleteSelectedRecord_one: `Obrisati izabrani zapis?`,
    confirmDeleteSelectedRecord_few: `Obrisati {{count}} izabrana zapisa?`,
    confirmDeleteSelectedRecord_other: `Obrisati {{count}} izabranih zapisa?`,
    confirmMergeSelectedRecords: `### Spojiti izabrane zapise u jedan?

- zapis "izvor" biće spojen u zapis "cilj":
  - izvor: [{{sourceRecordKeys}}], izmijenjen {{sourceRecordModifiedDate}};
  - cilj: [{{targetRecordKeys}}], izmijenjen {{targetRecordModifiedDate}};

- prije spajanja biće prikazan pregled rezultata;

- kada spajanje bude potvrđeno, **izvorni zapis ĆE BITI OBRISAN**`,
    confirmUpdateRecordsStep: `Premjestiti izabrane zapise ({{count}}) iz koraka {{stepFrom}} u korak {{stepTo}}?`,
    confirmUpdateRecordOwner: `Promijeniti vlasnika izabranog zapisa u {{ownerName}}?`,
    confirmValidateAllRecords: `Ponovo validirati sve zapise?\n\nOvo može potrajati nekoliko minuta.`,
    deleteRecord: 'Obriši zapis',
    demoteAllRecordsFromAnalysis: 'Analiza -> Čišćenje',
    demoteAllRecordsFromCleansing: 'Čišćenje -> Unos',
    editRecord: 'Uredi zapis',
    exportList: 'Izvezi listu',
    exportData: 'Izvezi podatke',
    exportDataSummary: 'Izvezi pregled podataka',
    exportSelectedRecordsArenaFormat: 'Izvezi izabrane zapise (Arena format)',
    exportRecordDocx: 'Izvezi zapis (Word)',
    filterPlaceholder: 'Filtriraj po ključevima ili vlasniku',
    merge: {
      label: 'Spoji',
      confirmLabel: 'Potvrdi spajanje',
      confirmTooManyDifferencesMessage: `**Previše razlika**.
Izgleda da se zapisi međusobno veoma razlikuju.
Mnogi atributi (~{{nodesUpdated}}) biće ažurirani tokom spajanja.
Nastaviti sa pregledom spajanja?`,
      noChangesWillBeApplied: `Na ciljni zapis ne bi bile primijenjene nikakve izmjene.
Spajanje nije moguće izvršiti.`,
      performedSuccessfullyMessage: 'Spajanje zapisa je uspješno izvršeno!',
      previewTitle: 'Pregled spajanja (zapis {{keyValues}})',
    },
    noRecordsAdded: 'Nema dodatih zapisa',
    noRecordsAddedForThisSearch: 'Nije pronađen nijedan zapis',
    noSelectedRecordsInStep: 'Nema izabranih zapisa u koraku {{step}}',
    owner: 'Vlasnik',
    promoteAllRecordsToAnalysis: 'Čišćenje -> Analiza',
    promoteAllRecordsToCleansing: 'Unos -> Čišćenje',
    step: 'Korak',
    updateRecordsStep: 'Ažuriraj korak zapisa',
    validateAll: 'Validiraj sve',
    viewRecord: 'Prikaži zapis',
  },
  recordsClone: {
    title: 'Kloniranje zapisa',
    fromCycle: 'Iz ciklusa',
    toCycle: 'U ciklus',
    confirmClone: `Klonirati zapise iz ciklusa {{cycleFrom}} u ciklus {{cycleTo}}?\n
(Biće klonirani samo zapisi koji već nisu u ciklusu {{cycleTo}})`,
    startCloning: 'Započni kloniranje',
    cloneComplete: 'Kloniranje je završeno. Klonirano zapisa iz {{cycleFrom}} u {{cycleTo}}: {{recordsCloned}}',
    error: {
      cycleToMissing: 'Izaberite "U ciklus"',
      cycleToMustBeDifferentFromCycleFrom: '"U ciklus" mora se razlikovati od "Iz ciklusa"',
    },
    source: {
      label: 'Izvor',
      allRecords: 'Svi zapisi u ciklusu {{cycleFrom}} koji već nisu u ciklusu {{cycleTo}}',
      selectedRecords: 'Samo izabrani zapisi ({{selectedRecordsCount}})',
    },
  },
  recordDeleted_one: `Zapis je uspješno obrisan!`,
  recordDeleted_few: `{{count}} zapisa su uspješno obrisana!`,
  recordDeleted_other: `{{count}} zapisa je uspješno obrisano!`,
  recordsSource: {
    label: 'Izvor',
  },
  recordsUpdated: 'Uspješno ažurirano zapisa: {{count}}',
  rowNum: 'Red br.',
  selectedAttributes: 'Izabrani atributi:',
  selectedDimensions: 'Izabrane dimenzije',
  selectedMeasures: 'Izabrane mjere',
  sortableItemsInfo: 'Prevucite i spustite da ih sortirate',
  showValidationReport: 'Prikaži izvještaj o validaciji',
  sort: 'Sortiraj',
  dataExport: {
    source: {
      label: 'Izvor',
      allRecords: 'Svi zapisi',
      filteredRecords: 'Samo filtrirani zapisi',
      selectedRecord: 'Samo izabrani zapis',
      selectedRecord_few: 'Samo {{count}} izabrana zapisa',
      selectedRecord_other: 'Samo {{count}} izabranih zapisa',
    },
    title: 'Izvezi podatke',
  },
  dataMatrixExport: {
    intro: `Izvezite podatke entiteta **{{entity}}** kao tabelu sa:

- jednim **redom** za svaku različitu vrednost atributa reda (npr. za svaku vrstu i sprat);
- jednom **kolonom** za svaki zapis, nazvanom po njegovom ključu ({{keys}});
- u ćelijama, vrednošću atributa vrednosti (npr. pokrovnost).

Ovo je format koji koriste alati za analizu vegetacije kao što su Turboveg, Juice i Synbiosys.`,
    layout: {
      dataMatrix: 'Matrica podataka',
      info: 'Tabela: redovi i kolone kako su prikazani u Istraživaču podataka. Matrica podataka: jedan red po vrsti (ili drugom atributu) i jedna kolona po zapisu, kako zahtevaju alati za analizu vegetacije kao što je Turboveg.',
      label: 'Izvezi kao',
      table: 'Tabela',
    },
    preview: 'Pregled',
    previewRecord: '{{keys}} zapisa {{number}}',
    recordKeys: 'Ključni atributi za nazive kolona zapisa',
    recordKeysInfo:
      'Svaki zapis postaje kolona, nazvana po vrednostima izabranih ključnih atributa (npr. samo broj parcele). Podrazumevano se koriste ključni atributi izabrani u Istraživaču podataka, ili svi ako nijedan nije izabran. Potreban je bar jedan.',
    recordsAll:
      'Izvoze se podaci svih zapisa: postavite filter u Istraživaču podataka da biste izvezli samo neke od njih.',
    recordsFiltered: 'Izvoze se samo podaci koji odgovaraju trenutnom filteru Istraživača podataka.',
    rowAttribute: 'Redovi (naziv atributa taksona, npr. vrsta)',
    rowAttributeInfo:
      'Svaka različita vrednost ovog atributa postaje red tabele. Atributi taksona se izvoze sa naučnim nazivom, jer svi taksoni koji nisu na listi imaju isti kod.',
    secondRowAttribute: 'Drugi atribut reda, opciono (npr. sprat)',
    secondRowAttributeInfo:
      'Koristite ga kada se ista vrsta može pojaviti više puta u zapisu (npr. u različitim spratovima): svaka kombinacija postaje poseban red.',
    valueAttribute: 'Vrednosti (npr. pokrovnost)',
    valueAttributeInfo:
      'Vrednost prikazana u ćelijama. Atributi koda se izvoze sa kodom, a ne sa oznakom. Ako se red pojavi više puta u zapisu sa različitim vrednostima, ćelija sadrži sve vrednosti.',
  },
  dataVis: {
    errorLoadingData: 'Greška pri učitavanju podataka',
    noData: 'Ovaj upit nije vratio podatke',
    noSelection: 'Napravite izbor pomoću panela sa lijeve strane ili izaberite postojeći upit iz "Upravljaj upitima"',
  },
  viewSelectedRecord: 'Prikaži izabrani zapis',
  mapView: {
    layersControl: {
      areasOfInterest: 'Područja od interesa',
      baseLayers: 'Osnovni slojevi',
      inputData: 'Uneseni podaci',
      preloadedLayers: 'Unaprijed učitani slojevi',
      samplingPointData: 'Podaci o tačkama uzorka',
    },
    layersPanel: {
      markers: '{{count}} markera',
      markers_one: '{{count}} marker',
      markers_few: '{{count}} markera',
      markers_other: '{{count}} markera',
    },
  },
}
