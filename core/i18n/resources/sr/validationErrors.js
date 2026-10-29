export default {
  // Common
  invalidEmail: 'Nevažeća e-mail adresa',
  invalidField: '"{{field}}" nije važeće',
  invalidNumber: 'Nevažeći broj',
  invalidDate: 'Nevažeći datum',
  minLengthNotRespected: 'Nije ispoštovana minimalna dužina od {{minLength}} karaktera',
  nameDuplicate: 'Naziv je dupliran',
  nameCannotBeKeyword: `Naziv "{{value}}" se ne može koristiti: to je rezervisana riječ`,
  nameInvalid:
    'Naziv "{{name}}" nije važeći: može imati najviše 40 karaktera, sadržati samo mala slova, brojeve i simbole "-" i "_", i mora počinjati slovom',
  nameRequired: 'Naziv je obavezan',
  requiredField: '{{field}} je obavezno',
  rowsDuplicate: 'red: {{row}} duplirani red: {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: 'Oznaka na podrazumijevanom jeziku istraživanja je obavezna',
    analysisNodeDefsRequired: 'Obavezan je najmanje jedan izračunati atribut',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Najmanje jedna podređena stavka nije važeća',
    codeCannotBeKeyword: `Šifra "{{value}}" se ne može koristiti: to je rezervisana riječ`,
    codeDuplicate: 'Šifra je duplirana',
    codeRequired: 'Šifra je obavezna',
    itemExtraPropDataTypeRequired: 'Tip podataka je obavezan za $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Nevažeći naziv za $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Nevažeći broj za $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Nevažeća geometrijska tačka za $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'Najmanje jedna stavka nije važeća',
    itemsEmpty: 'Definišite najmanje jednu stavku',
    levelDuplicate: 'Naziv nivoa je dupliran',
    levelsInvalid: 'Najmanje jedan nivo nije važeći',
    nameNotSpecified: 'Naziv kategorije nije naveden',
  },

  category: {
    samplingPointDataCategoryAlreadyExists:
      'Kategorija podataka o tačkama uzorka već postoji u ovom istraživanju; može postojati samo jedna.',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Nije moguće obrisati stavke objavljene kategorije. Stavke koje nedostaju u uvezenom fajlu: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Nije moguće obrisati nivoe objavljene kategorije. Nivoi koji nedostaju u uvezenom fajlu: {{deletedLevelNames}}',
    codeColumnMissing: 'Mora postojati najmanje jedna kolona "code"',
    codeRequired: '{{columnName}}: šifra je obavezna',
    codeDuplicate: '{{columnName}}: duplirana šifra "{{code}}"',
    columnMissing: 'Nedostaje kolona: {{columnNameMissing}}',
    emptyHeaderFound: 'Fajl sadrži prazno zaglavlje',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'ZIP fajl mora sadržati samo .csv ili .xlsx fajlove (po jedan za svaku kategoriju), bez ikakvih direktorijuma',
    invalidParentItemOrder: 'Stavka sa šiframa {{parentItemCodes}} mora biti navedena prije svojih podređenih stavki',
    nameDuplicate: 'Kategorija sa istim nazivom već postoji: {{name}}',
    srsNotDefined: 'SRS sa šifrom {{srs}} nije definisan u istraživanju',
    uuidDuplicate:
      'Ova kategorija je već klonirana u ovo istraživanje (trenutni naziv: "{{name}}"). Ne može se ponovo klonirati.',
  },

  dataImport: {
    emptyFile: 'Fajl koji pokušavate da uvezete je prazan',
    invalidHeaders: 'Nevažeće kolone: {{invalidHeaders}}',
    invalidBoolean: 'Nevažeća logička vrijednost u koloni {{headers}}: {{value}}',
    invalidCode: `Nevažeća šifra za atribut '{{attributeName}}': {{code}}`,
    invalidCoordinate: 'Nevažeća koordinata u koloni {{headers}}: {{value}}',
    invalidDate:
      'Nevažeći datum u koloni {{headers}}: {{value}}. Datumi treba da budu u formatu YYYY-MM-DD ili DD/MM/YYYY. Npr. 2023-01-15 ili 15/01/2023',
    invalidNumber: 'Nevažeći broj u koloni {{headers}}: {{value}}',
    invalidTaxonCode: 'Nevažeća šifra u koloni {{headers}}: {{value}}',
    invalidTime:
      'Nevažeće vrijeme u koloni {{headers}}: {{value}}. Vrijeme treba da bude u formatu HH:mm ili HH:mm:ss. Npr. 09:45, 16:30 ili 09:45:30',
    missingRequiredHeaders: 'Nedostaju obavezne kolone: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Greška pri ažuriranju vrijednosti: {{details}}',
    multipleRecordsMatchingKeys: 'Pronađeno je više zapisa koji odgovaraju ključevima "{{keyValues}}"',
    recordAlreadyExisting: 'Zapis sa ključevima "{{keyValues}}" već postoji',
    recordInAnalysisStepCannotBeUpdated:
      'Zapis sa ključevima "{{keyValues}}" je u koraku Analiza i ne može se ažurirati',
    recordKeyMissingOrInvalid: 'Nedostaje ili nije važeća vrijednost ključnog atributa "{{keyName}}"',
    recordNotFound: 'Zapis sa ključevima "{{keyValues}}" nije pronađen',
  },

  expressions: {
    cannotGetChildOfAttribute: 'nije moguće dobiti podređeni čvor {{childName}} atributa {{parentName}}',
    cannotUseCurrentNode: 'nije moguće koristiti trenutni čvor {{name}} u ovom izrazu',
    circularDependencyError: 'nije moguće referencirati čvor {{name}} jer on referencira trenutni čvor',
    expressionInvalid: 'Nevažeći izraz: {{details}}',
    unableToFindNode: 'nije moguće pronaći čvor: {{name}}',
    unableToFindNodeChild: 'nije moguće pronaći podređeni čvor: {{name}}',
    unableToFindNodeParent: 'nije moguće pronaći nadređeni čvor: {{name}}',
    unableToFindNodeSibling: 'nije moguće pronaći srodni čvor: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Nevažeći naziv',
    nameRequired: 'Naziv je obavezan',
    dataTypeRequired: 'Tip podataka je obavezan',
    valueRequired: 'Vrijednost je obavezna',
  },

  message: {
    bodyRequired: 'Tekst poruke je obavezan',
    subjectRequired: 'Naslov je obavezan',
    notificationTypeRequired: 'Tip obavještenja je obavezan',
    targetsRequired: 'Obavezan je najmanje jedan primalac',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'Entitet je obavezan',
    applyIfDuplicate: 'Uslov "$t(nodeDefEdit:expressionsProp.applyIf)" je dupliran',
    applyIfInvalid: 'Nevažeći uslov "$t(nodeDefEdit:advancedProps.relevantIf)"',
    columnWidthCannotBeGreaterThan: 'Širina kolone ne može biti veća od {{max}}',
    columnWidthCannotBeLessThan: 'Širina kolone ne može biti manja od {{min}}',
    countMaxMustBePositiveNumber: 'Maksimalan broj mora biti pozitivan cijeli broj',
    countMinMustBePositiveNumber: 'Minimalan broj mora biti pozitivan cijeli broj',
    categoryRequired: 'Kategorija je obavezna',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: 'Nevažeće "Podrazumijevane vrijednosti"',
    defaultValuesNotSpecified: 'Podrazumijevana vrijednost nije navedena',
    entitySourceRequired: 'Izvorni entitet je obavezan',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Samo posljednji izraz može imati prazan uslov "$t(nodeDefEdit:expressionsProp.applyIf)"',
    expressionDuplicate: 'Izraz je dupliran',
    expressionRequired: 'Izraz je obavezan',
    formulaInvalid: 'Formula nije važeća',
    keysEmpty: 'Definišite najmanje jedan ključni atribut',

    keysExceedingMax: 'Premašen je maksimalan broj ključnih atributa',
    maxFileSizeInvalid: 'Maksimalna veličina fajla mora biti veća od 0 i manja od {{max}}',
    nameInvalid: 'Naziv nije važeći (smije sadržati samo mala slova, brojeve i donje crte, i mora počinjati slovom)',
    taxonomyRequired: 'Taksonomija je obavezna',
    validationsInvalid: 'Nevažeće "Validacije"',
    countMaxInvalid: 'Nevažeći "Maksimalan broj"',
    countMinInvalid: 'Nevažeći "Minimalan broj"',
    readOnlyCannotHaveEditableIf: 'Čvor samo za čitanje ne može imati uslov "Može se uređivati ako"',
    requiredIfInvalid: 'Nevažeći uslov "Obavezno ako"',
    requiredIfNotAllowed:
      'Uslov "Obavezno ako" dozvoljen je samo za pojedinačne atribute koji nisu ključni i nisu uvijek obavezni',
    qualifierCannotHaveApplicableExpression:
      'Atribut kvalifikatora ne može imati uslov "$t(nodeDefEdit:advancedProps.relevantIf)"',
    qualifierCannotHaveEditabilityRule: 'Atribut kvalifikatora ne može imati definisana pravila uređivanja',
    qualifierCannotHaveDefaultValues: 'Atribut kvalifikatora ne može imati podrazumijevane vrijednosti',
    qualifierCannotHaveValidations: 'Atribut kvalifikatora ne može imati definisana pravila validacije',
  },

  record: {
    keyDuplicate: 'Duplirani ključ zapisa',
    entityKeyDuplicate: 'Duplirani ključ',
    entityKeyValueNotSpecified: 'Vrijednost ključa za "{{keyDefName}}" nije navedena',
    missingAncestorForEntity: 'Nije moguće pronaći "{{ancestorName}}" sa ovim ključevima: {{keyValues}}',
    oneOrMoreInvalidValues: 'Jedna ili više vrijednosti nisu važeće',
    uniqueAttributeDuplicate: 'Duplirana vrijednost',
    valueInvalid: 'Nevažeća vrijednost',
    valueRequired: 'Obavezna vrijednost',
  },

  recordClone: {
    differentKeyAttributes: 'Ključni atributi se razlikuju u ciklusu {{cycleFrom}} i ciklusu {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'Jezik je obavezan',
    srsRequired: 'Prostorni referentni sistem je obavezan',
    cycleRequired: 'Ciklus je obavezan',
    cyclesRequired: 'Mora biti definisan najmanje jedan ciklus',
    cyclesExceedingMax: 'Istraživanje može imati najviše 10 ciklusa',
    cycleDateStartBeforeDateEnd: 'Datum početka ciklusa mora biti prije datuma završetka',
    cycleDateStartAfterPrevDateEnd: 'Datum početka ciklusa mora biti poslije datuma završetka prethodnog ciklusa',
    cycleDateStartInvalid: 'Datum početka ciklusa nije važeći',
    cycleDateStartMandatory: 'Datum početka ciklusa je obavezan',
    cycleDateEndInvalid: 'Datum završetka ciklusa nije važeći',
    cycleDateEndMandatoryExceptForLastCycle: 'Datum završetka ciklusa je obavezan za sve cikluse osim posljednjeg',
    fieldManualLinksInvalid: 'Link ka terenskom priručniku nije važeći',
    areaOfInterestInvalid: 'Područje od interesa mora biti poligon u GeoJSON formatu sa WGS84 koordinatama',
  },

  surveyAreaOfInterest: {
    fileRequired: 'Fajl je obavezan',
    nameDuplicate: 'Već postoji drugo područje od interesa sa istim nazivom',
    nameRequired: 'Naziv je obavezan',
  },

  surveyPreloadedMapLayer: {
    fileRequired: 'Fajl je obavezan',
    fileNameDuplicate: 'Već postoji drugi fajl sa istim nazivom',
    labelsRequired: 'Obavezna je najmanje jedna oznaka',
  },

  surveyDocImage: {
    documentPlaceRequired: 'Mjesto u dokumentu je obavezno',
    fileRequired: 'Fajl je obavezan',
    fileNameDuplicate: 'Već postoji drugi fajl sa istim nazivom',
    labelsRequired: 'Obavezna je najmanje jedna oznaka',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Nevažeće kolone: {{invalidHeaders}}',
    cannotFindNodeDef: "Nije moguće pronaći definiciju atributa ili entiteta sa nazivom '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Objavljena šifra je promijenjena: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Duplirana šifra {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Šifra je obavezna',
    familyRequired: 'Porodica je obavezna',
    genusRequired: 'Rod je obavezan',
    scientificNameDuplicate: 'Duplirani naučni naziv {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Naučni naziv je obavezan',
    taxaEmpty: 'Nema taksona',
    vernacularNamesDuplicate: `Duplirani narodni naziv '{{name}}' za jezik '{{lang}}'`,
  },

  taxonomyImport: {
    nameDuplicate: 'Taksonomija sa istim nazivom već postoji: {{name}}',
    uuidDuplicate:
      'Ova taksonomija je već klonirana u ovo istraživanje (trenutni naziv: "{{name}}"). Ne može se ponovo klonirati.',
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Duplirane kolone dodatnih informacija: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Nevažeći naziv kolone dodatnih informacija "{{columnName}}": ne smije biti rezervisana riječ',
    missingRequiredColumns: 'Nedostaju obavezne kolone: {{columns}}',
    reservedScientificName:
      'Naučni naziv "{{scientificName}}" je rezervisan i ne može se koristiti; biće automatski dodat u taksonomiju.',
  },

  user: {
    emailDuplicate: 'Korisnik sa istom e-mail adresom već postoji',
    emailRequired: 'E-mail adresa je obavezna',
    emailInvalid: 'E-mail adresa nije važeća',
    emailNotFound: 'E-mail adresa nije pronađena',
    groupRequired: 'Grupa je obavezna',
    nameRequired: 'Ime je obavezno',
    titleRequired: 'Titula je obavezna',
    passwordRequired: 'Lozinka je obavezna',
    passwordInvalid: 'Lozinka ne smije sadržati razmake',
    passwordUnsafe: 'Lozinka mora imati najmanje 8 karaktera i sadržati mala slova, velika slova i brojeve',
    passwordsDoNotMatch: `Lozinke se ne podudaraju`,

    userNotFound: 'Korisnik nije pronađen. Provjerite da li su e-mail adresa i lozinka ispravni',
    passwordChangeRequired: 'Potrebna je promjena lozinke',
    passwordResetNotAllowedWithPendingInvitation: `Ponovno postavljanje lozinke nije dozvoljeno: korisnik je pozvan u istraživanje, ali pozivnica još nije prihvaćena`,
    twoFactorTokenRequired: 'Verifikacioni kod je obavezan',
  },

  userAccessRequest: {
    countryRequired: 'Država je obavezna',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'Ime je obavezno',
    institutionRequired: 'Institucija je obavezna',
    lastNameRequired: 'Prezime je obavezno',
    purposeRequired: 'Svrha je obavezna',
    surveyNameRequired: 'Naziv istraživanja je obavezan',
    invalidRequest: 'Nevažeći zahtjev za pristup korisnika',
    userAlreadyExisting: 'Korisnik sa e-mail adresom {{email}} već postoji',
    requestAlreadySent: `Zahtjev za pristup za korisnika sa e-mail adresom {{email}} je već poslat`,
    emailNotReachable: 'E-mail za potvrdu nije moguće dostaviti na {{email}}; provjerite da li je adresa ispravna',
    invalidReCaptcha: 'Nevažeća ReCaptcha',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Zahtjev za pristup korisnika je već obrađen',
    accessRequestNotFound: 'Zahtjev za pristup korisnika nije pronađen',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Uloga je obavezna',
    surveyNameRequired: 'Naziv istraživanja je obavezan',
  },

  userGroupEdit: {
    nameDuplicate: 'Grupa sa istim nazivom već postoji: {{name}}',
    qualifiersInvalid: 'Jedan ili više kvalifikatora imaju nevažeći ili duplirani ključ',
    qualifierNameDuplicate: 'Kvalifikator sa istim nazivom već postoji u ovoj grupi: {{name}}',
    qualifierNameInvalid: 'Nevažeći naziv kvalifikatora',
    qualifierNameRequired: 'Naziv kvalifikatora je obavezan',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Stara lozinka je obavezna',
    oldPasswordWrong: 'Stara lozinka nije ispravna',
    newPasswordRequired: 'Nova lozinka je obavezna',
    confirmPasswordRequired: 'Potvrda lozinke je obavezna',
    confirmedPasswordNotMatching: 'Nova lozinka i potvrda lozinke se ne podudaraju',
  },

  userInvite: {
    messageContainsLinks: 'Poruka pozivnice ne smije sadržati linkove',
    messageTooLong: 'Poruka pozivnice je preduga (najviše {{maxLength}} karaktera)',
  },

  user2FADevice: {
    nameDuplicate: 'Uređaj sa istim nazivom već postoji',
    nameRequired: 'Naziv uređaja je obavezan',
  },
}
