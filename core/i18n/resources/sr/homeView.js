export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Aktivno istraživanje nije izabrano</title>
      <p><label>Izaberite jedno sa liste</label><linkToSurveys>Lista istraživanja</linkToSurveys> ili <linkToNewSurvey>Kreirajte novo</linkToNewSurvey></p>`,
    activeUsers: 'Aktivni korisnici',
    activityLog: {
      title: 'Dnevnik aktivnosti',
      size: '$t(homeView:dashboard.activityLog.title) – veličina: {{size}}',
      loadError: 'Aktivnost nije moguće učitati.',
      empty: 'Još nema aktivnosti.',
    },
    exportWithData: 'Izvoz + podaci (rezervna kopija)',
    exportWithDataNoActivityLog: 'Izvoz + podaci (BEZ dnevnika aktivnosti)',
    exportWithDataNoResultAttributes: 'Izvoz + podaci (BEZ atributa rezultata)',
    surveyPropUpdate: {
      main: `<title>Dobro došli u aplikaciju Arena</title>

        <p>Prvo je potrebno da postavite <strong>naziv</strong> i <strong>oznaku</strong> istraživanja.</p>

        <p>Kliknite ispod na <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>ili na naziv istraživanja:<basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Ako su naziv i oznaka ispravni, kreirajte prvi atribut
        <linkWithIcon>Istraživanje > Dizajner obrasca</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>Kreirajmo prvi atribut istraživanja {{surveyName}} </title>

        <p>Idite na <linkWithIcon>Istraživanje > Dizajner obrasca</linkWithIcon></p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Zauzetost prostora',
      availableSpace: 'Slobodno ({{size}})',
      usedSpace: 'Zauzeto ({{size}})',
      usedSpaceOutOf: `Zauzeto {{percent}}% ({{used}} od {{total}})`,
    },
    storageSummaryDb: {
      title: 'Zauzetost prostora (baza podataka)',
    },
    storageSummaryFiles: {
      title: 'Zauzetost prostora (fajlovi)',
    },
    samplingPointDataCompletion: {
      title: 'Popunjenost podataka o tačkama uzorka',
      totalItems: 'Ukupno stavki: {{totalItems}}',
      remainingItems: 'Preostale stavke',
    },
    kpi: {
      records: 'Zapisi',
      contributors: 'Saradnici',
      storage: 'Prostor',
      expandDetails: 'Prikaži detalje',
      collapseDetails: 'Sakrij detalje',
    },
    recordsCard: {
      total: 'Zapisi dodati u izabranom periodu',
      byStep: 'Po koraku toka rada (cijeli period)',
    },
    contributorsCard: {
      active: 'Aktivni saradnici u izabranom periodu: {{count}}',
    },
    map: {
      title: 'Mapa',
      allOwners: 'Svi vlasnici',
    },
    step: {
      entry: 'Unos podataka',
      cleansing: 'Čišćenje podataka',
      analysis: 'Analiza podataka',
    },
    // records' summary
    recordsByUser: 'Zapisi po korisniku',
    recordsAddedPerUserWithCount: 'Zapisi dodati po korisniku (ukupno {{totalCount}})',
    dailyRecordsByUser: 'Dnevni zapisi po korisniku',
    totalRecords: 'Ukupno zapisa',
    selectUsers: 'Izaberite korisnike...',
    noRecordsAddedInSelectedPeriod: 'Nema zapisa dodatih u izabranom periodu',
  },
  surveyDeleted: 'Istraživanje {{surveyName}} je obrisano',
  landing: {
    openDashboard: 'Otvori kontrolnu tablu',
  },
  surveyInfo: {
    basic: 'Osnovne informacije',
    branding: {
      title: 'Vizuelni identitet',
      primaryColor: 'Primarna boja',
      titleFontSize: 'Veličina fonta naslova',
      descriptionFontSize: 'Veličina fonta opisa',
      fontSizePreset: {
        small: 'Mala',
        default: 'Podrazumijevana',
        large: 'Velika',
      },
      surveyLogo1: 'Logo istraživanja 1',
      surveyLogo2: 'Logo istraživanja 2',
      surveyLogo3: 'Logo istraživanja 3',
      landingBackground: 'Pozadinska slika početne stranice',
      uploadLogo: 'Otpremi sliku',
      logoFileFormatHint: 'PNG, JPEG, WebP ili SVG (najviše {{maxMb}} MB)',
      logoFileTooLarge: 'Slika logoa mora imati {{maxMb}} MB ili manje',
      preview: 'Pregled',
      backgroundFileTooLarge: 'Pozadinska slika mora imati {{maxMb}} MB ili manje',
      invalidPrimaryColor: 'Unesite ispravnu boju u formatu #RRGGBB ili ostavite prazno',
      invalidSaveBlocked: 'Ispravite neispravna polja vizuelnog identiteta prije čuvanja informacija o istraživanju',
      imageLoadError: 'Nije moguće učitati sliku "{{name}}". Obrišite je i otpremite novu.',
      imageLoadErrorReadOnly: 'Nije moguće učitati sliku "{{name}}"',
      downloadImage: 'Kliknite da preuzmete sliku',
    },
    configuration: {
      title: 'Konfiguracija',
      filesTotalSpace: 'Ukupan prostor za fajlove (GB)',
    },
    confirmDeleteCycleHeader: 'Obrisati ovaj ciklus?',
    confirmDeleteCycle: `Da li ste sigurni da želite da obrišete ciklus {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
Ako postoje zapisi povezani sa ovim ciklusom, biće obrisani.`,
    cycleForArenaMobile: 'Ciklus za Arena Mobile',
    keepNonApplicableValues: 'Zadrži vrijednosti atributa koji nisu primjenjivi',
    keepNonApplicableValuesInfo: `Kada nije označeno (podrazumijevano), tokom unosa podataka vrijednosti atributa koji više nisu primjenjivi se brišu (nakon što korisnik to potvrdi).
Kada je označeno, te vrijednosti se zadržavaju u zapisu, čak i ako atributi više nisu primjenjivi.`,
    deleteActivityLog: 'Očisti dnevnik aktivnosti',
    deleteActivityLogConfirm: {
      headerText: 'Obrisati SVE podatke dnevnika aktivnosti za ovo istraživanje?',
      message: `
  - SVI podaci dnevnika aktivnosti za istraživanje **{{surveyName}}** biće obrisani;\n\n
  - prostor koji istraživanje zauzima u bazi podataka biće smanjen;\n\n
  - to neće uticati na unesene podatke istraživanja;\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Unesite naziv ovog istraživanja da potvrdite:',
    },
    fieldManualLink: 'Link ka terenskom priručniku',
    editInfo: 'Uredi informacije',
    map: 'Mapa',
    viewInfo: 'Prikaži informacije',

    areaOfInterest: {
      title: 'Područje od interesa',
      info: 'Poligon (GeoJSON, WGS84 koordinate) koji koristi funkcija izraza geoDistanceToAOIBoundary da proveri da li je lokacija unutar područja, i oflajn u Arena Mobile',
      summary: 'Poligona: {{polygons}}, temena: {{vertices}}',
      invalidFile: 'Datoteka ne sadrži važeći poligon u GeoJSON formatu sa WGS84 koordinatama',
      confirmDelete: 'Da li ste sigurni da želite da obrišete područje od interesa?',
    },

    preloadedMapLayers: {
      enabledMessage: 'Unaprijed učitani slojevi mape su omogućeni',
      title: 'Unaprijed učitani slojevi mape',
      confirmDelete: 'Da li ste sigurni da želite da obrišete ovaj unaprijed učitani sloj mape?',
      editor: {
        title: 'Unaprijed učitani sloj mape',
      },
    },

    surveyDocLayout: {
      tabTitle: 'Raspored dokumenta',
      title: 'Slike dokumenta',
      layoutOptions: {
        title: 'Opcije rasporeda',
        headerOnFirstPageOnly: 'Zaglavlje samo na prvoj stranici',
        pageNumbering: 'Numerisanje stranica',
      },
      documentPlace: 'Mjesto',
      documentPlaceValues: {
        header: 'Zaglavlje',
        footer: 'Podnožje',
      },
      applyIf: 'Primijeni ako je uslov ispunjen',
      confirmDelete: 'Da li ste sigurni da želite da obrišete ovu sliku dokumenta?',
      editor: {
        title: 'Slika dokumenta',
      },
    },

    preferredLanguage: 'Željeni jezik',
    sampleBasedImageInterpretation: 'Interpretacija snimaka zasnovana na uzorku',
    sampleBasedImageInterpretationEnabled: 'Interpretacija snimaka zasnovana na uzorku je omogućena',
    security: {
      title: 'Bezbjednost',
      dataEditorViewNotOwnedRecordsAllowed: 'Unosilac podataka može da vidi zapise čiji nije vlasnik',
      dataAnalystViewNotOwnedRecordsAllowed: 'Analitičar podataka može da vidi zapise čiji nije vlasnik',
      visibleInMobile: 'Vidljivo u Arena Mobile',
      allowRecordsDownloadInMobile: 'Dozvoli preuzimanje zapisa sa servera u Arena Mobile',
      allowRecordsUploadFromMobile: 'Dozvoli otpremanje zapisa iz Arena Mobile na server',
      allowRecordsWithErrorsUploadFromMobile:
        'Dozvoli otpremanje zapisa sa greškama validacije iz Arena Mobile na server',
      allowRecordsMergeWithSameKeys:
        'Dozvoli spajanje zapisa sa istim ključevima (npr. zapisa kreiranih na različitim Arena Mobile uređajima)',
    },
    srsPlaceholder: 'Unesite šifru ili oznaku',
    unpublish: 'Povuci objavljivanje i obriši podatke',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Da li ste sigurni da želite da povučete objavljivanje ovog istraživanja?',
      unpublishWarning: `Povlačenjem objavljivanja istraživanja **{{surveyName}}** biće obrisani svi njegovi podaci.\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Unesite naziv ovog istraživanja da potvrdite:',
    },
    userExtraProps: {
      title: 'Dodatna svojstva korisnika',
      info: `Dodatna svojstva koja se mogu dodijeliti svakom korisniku povezanom sa istraživanjem.
Ta svojstva se mogu koristiti u podrazumijevanim vrijednostima, pravilima validacije i izrazima primjenjivosti.
Npr.: *userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Da li ste sigurni da želite da obrišete ovo istraživanje?',
    deleteWarning: `Brisanjem istraživanja **{{surveyName}}** biće obrisani svi njegovi podaci.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Unesite naziv ovog istraživanja da potvrdite:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Aktiviraj',
  },
  collectImportReport: {
    excludeResolvedItems: 'Isključi riješene stavke',
    expression: 'Izraz',
    resolved: 'Riješeno',
    exprType: {
      applicable: '$t(nodeDefEdit:advancedProps.relevantIf)',
      codeParent: 'Nadređena šifra',
      defaultValue: 'Podrazumijevana vrijednost',
      requiredIf: 'Obavezno ako',
      validationRule: 'Pravilo validacije',
    },
    title: 'Izvještaj o uvozu iz Collect',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Zapisi dodati u posljednjih:',
    fromToPeriod: 'od {{from}} do {{to}}',
    record: '{{count}} zapis',
    record_few: '{{count}} zapisa',
    record_other: '{{count}} zapisa',
    week: '{{count}} sedmica',
    week_few: '{{count}} sedmice',
    week_other: '{{count}} sedmica',
    month: '{{count}} mjesec',
    month_few: '{{count}} mjeseca',
    month_other: '{{count}} mjeseci',
    year: '{{count}} godina',
    year_few: '{{count}} godine',
    year_other: '{{count}} godina',
  },
}
