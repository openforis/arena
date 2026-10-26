export default {
  cannotGetChild: `Nije moguće dobiti podređeni čvor '{{childName}}' iz atributa {{name}}`,
  cannotImportFilesExceedingQuota:
    'Nije moguće uvesti fajlove zapisa: kvota za skladištenje fajlova bi bila prekoračena',
  cannotInsertFileExceedingQuota: 'Nije moguće umetnuti fajl: kvota za skladištenje fajlova bi bila prekoračena',
  cannotOverridePublishedTaxa: 'Nije moguće prepisati objavljene taksone',
  cantUpdateStep: `Nije moguće ažurirati korak`,
  chainCannotBeSaved: 'Lanac obrade nije ispravan i ne može se sačuvati',
  csv: {
    emptyHeaderFound: 'Pronađeno je prazno zaglavlje u koloni {{columnPosition}}',
    emptyHeaders: 'Pronađena su prazna zaglavlja',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      'Greška pri izvozu podataka (previše stavki). Pokušajte da izvezete podatke u CSV formatu.',
    noRecordsMatchingSearchCriteria: 'Nema zapisa koji odgovaraju kriterijumima pretrage',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Uvoz podataka iz Arena Mobile nije dozvoljen',
    invalidNodeInRecord:
      'Neispravan čvor u zapisu "{{recordUuid}}", čvor "{{nodeUuid}}" sa definicijom čvora "{{nodeDefName}}" (uuid "{{nodeDefUuid}}"): {{details}}',
    noRecordsFound: 'U fajlu za uvoz nije pronađen nijedan zapis ili je format fajla pogrešan',
    pendingImportFileNotFoundOrExpired:
      'Prethodno otpremljeni fajl više nije moguće pronaći; možda je istekao. Molimo otpremite ga ponovo.',
    recordMergeWithSameKeysNotAllowed:
      'Nije moguće uvesti zapis "{{recordKeyValues}}": drugi zapis sa istim ključevima već postoji, a spajanje zapisa sa istim ključevima nije dozvoljeno u ovom istraživanju',
    recordOwnedByAnotherUser: 'Nije moguće ažurirati zapis "{{recordKeyValues}}" jer je njegov vlasnik drugi korisnik',
  },
  entryDataNotFound: 'Podaci za unos nisu pronađeni: {{entryName}}',
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  functionHasTooFewArguments: 'Funkcija {{fnName}} zahtijeva najmanje {{minArity}} (dobijeno {{numArgs}})',
  functionHasTooManyArguments: 'Funkcija {{fnName}} prihvata najviše {{maxArity}} (dobijeno {{numArgs}})',
  generic: 'Neočekivana greška: {{text}}',
  geoWhispApiError: 'Whisp servis je privremeno nedostupan.',
  geoWhispSamplingPointDataCategoryMissing: 'Kategorija podataka o tačkama uzorka nije pronađena.',
  geoWhispSamplingPointDataLocationsMissing:
    'Nije pronađena nijedna stavka podataka o tačkama uzorka sa ispravnom lokacijom.',
  importingDataIntoWrongCollectSurvey: 'Uvoz podataka u pogrešno istraživanje. Očekivani URI: {{collectSurveyUri}}',
  invalidType: 'Neispravan tip {{type}}',
  jobCanceledOrErrorsFound: 'Zadatak je otkazan ili su pronađene greške; transakcija se poništava',
  jobOrphanedOnRestart: 'Zadatak je prekinut ponovnim pokretanjem servera. Molimo pokušajte ponovo.',
  mobileAppVersionNotSupported:
    'Server ne podržava ovu verziju aplikacije Arena Mobile: ažurirajte je na verziju {{minVersion}} ili noviju',
  paramIsRequired: 'Parametar {{param}} je obavezan',
  unableToFindParent: 'Nije moguće pronaći nadređeni čvor za {{name}}',
  unableToFindNode: 'Nije moguće pronaći čvor sa nazivom {{name}}',
  unableToFindSibling: 'Nije moguće pronaći srodni čvor sa nazivom {{name}}',
  undefinedFunction: `Nedefinisana funkcija '{{fnName}}' ili pogrešni tipovi parametara`,
  invalidSyntax: 'Sintaksa izraza nije ispravna',
  networkError: 'Greška u komunikaciji sa serverom',
  record: {
    errorUpdating: 'Greška pri ažuriranju zapisa',
    entityNotFound: 'Entitet "{{entityName}}" sa ključevima "{{keyValues}}" nije pronađen',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); greška pri izračunavanju izraza u čvoru {{nodeDefName}}: {{details}}',
  },
  recordPrintableExport: {
    missingEntityParams: 'Izvoz trenutne stranice zahtijeva entityDefUuid i entityNodeUuid',
    entityNotFound: 'Entitet nije pronađen za navedeni izvoz',
    missingServerUrl: 'Javni URL servera je obavezan pri izvozu sa QR kodom',
    qrTokenMismatch: 'Nije moguće završiti izvoz sa QR kodom; molimo pokušajte ponovo',
  },
  sessionExpiredRefreshPage: `Sesija je možda istekla.
Pokušajte da osvježite stranicu.`,
  survey: {
    nodeDefNameNotFound: 'Definicija čvora nije pronađena: {{name}}',
    dataMigrationInProgress: 'Ovo istraživanje se nadograđuje, molimo pokušajte ponovo uskoro.',
    fileNotFound: 'Fajl nije pronađen',
  },
  unsupportedFunctionType: 'Nepodržan tip funkcije: {{exprType}}',
  // AI gateway errors
  aiNotConfigured:
    'AI nije konfigurisan. Podesite lični provajder u AI podešavanjima ili zamolite administratora da konfiguriše podrazumijevani.',
  aiFeaturesDisabled: 'AI funkcije su onemogućene na ovoj instalaciji.',
  aiFeatureDisabled: 'AI funkcija "{{feature}}" je onemogućena.',
  aiPromptTooLarge: 'AI upit je prevelik ({{size}} znakova; ograničenje {{limit}}).',
  aiInputTooLong: 'AI polje za unos "{{field}}" premašuje ograničenje od {{limit}} znakova.',
  aiSchemaMissing: 'Nedostaje šema strukturiranog AI izlaza za funkciju "{{feature}}".',
  aiProviderInvalid: 'Nepodržan AI provajder: {{provider}}.',
  aiModelMissing: 'Identifikator AI modela je obavezan.',
  aiApiKeyMissing: 'API ključ je obavezan za provajdera {{provider}}.',
  aiBaseUrlMissing: 'Osnovni URL je obavezan za openai-compatible provajdera.',
  aiModelListFailed: 'Nije moguće dobiti listu modela od provajdera: {{message}}',
  aiExpressionDescriptionMissing: 'Molimo opišite željeni izraz običnim jezikom.',
  aiExpressionTypeInvalid: 'Nepoznata vrsta izraza: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'Nije moguće generisati izraz bez ciljnog polja.',
  aiExpressionNodeDefNotFound: 'Nije moguće pronaći ciljno polje (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'Nije moguće objasniti prazan izraz.',
  aiTranslationSocketMissing: 'WebSocket nije povezan. Molimo sačekajte trenutak i pokušajte ponovo.',
  aiTranslationSourceLangMissing: 'Izvorni jezik je obavezan za prevod.',
  aiTranslationTargetLangsMissing: 'Najmanje jedan ciljni jezik je obavezan za prevod.',
  aiTranslationItemsMissing: 'Nema ničega za prevođenje.',
  aiTranslationTooManyItems: 'Previše stavki u jednoj seriji ({{count}}); ograničenje je {{limit}}.',
  aiActivityLogSurveyMissing: 'Istraživanje je obavezno za sažimanje dnevnika aktivnosti.',
  aiChatbotDisabled: 'Chatbot za dokumentaciju je onemogućen na ovoj instalaciji.',
  aiChatbotUpstreamError: 'Chatbot za dokumentaciju je privremeno nedostupan. Molimo pokušajte ponovo za trenutak.',
  aiChatbotPayloadTooLarge: 'Vaš razgovor je prevelik. Obrišite razgovor i pokušajte sa kraćim pitanjem.',
  aiDataQueryDescriptionMissing: 'Molimo opišite podatke koje želite da vidite običnim jezikom.',
  aiDataQueryNoEntities: 'Ovo istraživanje nema entitete koji se mogu pretraživati.',
  aiDataQueryInvalid: 'AI nije mogao da generiše ispravan upit za ovaj zahtjev: {{errors}}',
  aiDataQueryEmpty: 'Prvo izaberite entitet i neke atribute (ili dimenzije i mjere).',
  aiDataQuerySummaryInvalid: 'AI nije mogao da predloži naziv i opis za ovaj upit. Molimo pokušajte ponovo.',
  userCannotDeleteHasMessages:
    'Ovaj korisnik ne može biti obrisan: autor je poruka ({{count}}); prvo ih obrišite ili ih dodijelite drugom korisniku',
  userCannotDeleteLastSystemAdmin: 'Ovaj korisnik ne može biti obrisan: on je posljednji sistemski administrator',
  userCannotDeleteOwnsSurveys:
    'Ovaj korisnik ne može biti obrisan: vlasnik je istraživanja ({{count}}); prvo prenesite vlasništvo',
  userCannotDeleteSelf: 'Ne možete obrisati sopstveni korisnički nalog',
  userEmailInvalid:
    'E-poruka sa pozivnicom nije mogla biti isporučena na {{email}}; molimo provjerite da li je adresa ispravna',
  userHasPendingInvitation: `Već postoji pozivnica na čekanju za korisnika sa e-mail adresom '{{email}}'; ne može biti pozvan/a u ovo istraživanje dok je ne prihvati`,
  userHasRole: 'Navedeni korisnik već ima ulogu u ovom istraživanju',
  userHasRole_few: 'Navedeni korisnici već imaju ulogu u ovom istraživanju',
  userHasRole_other: 'Navedeni korisnici već imaju ulogu u ovom istraživanju',
  userInvalid: 'Neispravan korisnik',
  surveyCompareFileTooLarge:
    'Fajl istraživanja je prevelik (najviše {{maxSize}} MB): izvezite istraživanje bez podataka, zapisi i njihovi fajlovi nisu potrebni za poređenje istraživanja',
  userIsAdmin: 'Navedeni korisnik je već sistemski administrator',
  userNotAllowedToChangePref: 'Korisniku nije dozvoljeno da mijenja postavku',
  userNotAuthorized: 'Korisnik {{userName}} nije ovlašćen',
  userNotFound: 'Korisnik nije pronađen: {{userUuid}}',
  usersBackupImport: {
    invalidFile: 'Fajl nije ispravna rezervna kopija korisnika Arena',
  },
}
