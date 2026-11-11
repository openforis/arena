export default {
  mapCustomLayers: {
    urlInvalid: 'URL servisa nije važeći',
    urlNotAllowed: 'Mogu se koristiti samo javne http i https adrese',
    hostNotFound: 'Host nije pronađen: {{host}}',
    redirectNotFollowed: 'Servis preusmjerava na {{location}}: umjesto toga koristite taj URL',
    responseTooLarge: 'Odgovor servisa je veći od {{limitMb}} MB',
    timeout: 'Servis nije odgovorio u roku od {{seconds}} sekundi',
    fetchFailed: 'Servis je odgovorio HTTP statusom {{status}}',
    unreachable: 'Servis nije dostupan',
    notCapabilities: 'Na ovom URL-u nisu pronađene WMS ili WMTS mogućnosti (capabilities)',
    noLayers: 'Servis nema nijedan sloj koji se može prikazati',
    invalidLayers: 'Slojevi mape nisu važeći',
    tooManyLayers: 'Može se dodati najviše {{max}} prilagođenih slojeva mape',
    busy: 'Server je zauzet učitavanjem drugih servisa: pokušajte ponovo za trenutak',
  },
  aggregateFunctionInvalid: `Prilagođena agregatna funkcija "{{name}}" nije važeća: izmenite je da biste je ispravili`,
  cannotGetChild: `Nije moguće dobiti podređeni čvor '{{childName}}' iz atributa {{name}}`,
  cannotImportFilesExceedingQuota:
    'Nije moguće uvesti fajlove zapisa: kvota za skladištenje fajlova bi bila prekoračena',
  cannotInsertFileExceedingQuota: 'Nije moguće umetnuti fajl: kvota za skladištenje fajlova bi bila prekoračena',
  cannotOverridePublishedTaxa: 'Nije moguće prepisati objavljene taksone',
  cantUpdateStep: `Nije moguće ažurirati korak`,
  categoryItemLabelsInvalid: 'Neispravan zahtjev za oznake kategorije ({{reason}}).',
  categoryItemLabelsTooLarge:
    'Ova kategorija je prevelika za provjeru oznaka koje nedostaju; pokušajte ponovo kasnije ili koristite manju kategoriju.',
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
    recordOfAnotherUserGroup: 'Nije moguće ažurirati zapis "{{recordKeyValues}}" jer pripada drugoj grupi korisnika',
    recordOwnedByAnotherUser: 'Nije moguće ažurirati zapis "{{recordKeyValues}}" jer je njegov vlasnik drugi korisnik',
  },
  entryDataNotFound: 'Podaci za unos nisu pronađeni: {{entryName}}',
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  forbidden: 'Nije vam dozvoljeno da ovo uradite.',
  functionHasTooFewArguments: 'Funkcija {{fnName}} zahtijeva najmanje {{minArity}} (dobijeno {{numArgs}})',
  functionHasTooManyArguments: 'Funkcija {{fnName}} prihvata najviše {{maxArity}} (dobijeno {{numArgs}})',
  generic: 'Neočekivana greška: {{text}}',
  unexpectedServerError: 'Došlo je do neočekivane greške na serveru.',
  geoWhispApiError: 'Whisp servis je privremeno nedostupan.',
  geoWhispSamplingPointDataCategoryMissing: 'Kategorija podataka o tačkama uzorka nije pronađena.',
  geoWhispSamplingPointDataLocationsMissing:
    'Nije pronađena nijedna stavka podataka o tačkama uzorka sa ispravnom lokacijom.',
  importingDataIntoWrongCollectSurvey: 'Uvoz podataka u pogrešno istraživanje. Očekivani URI: {{collectSurveyUri}}',
  invalidParams: 'Neispravni parametri zahtjeva.',
  invalidType: 'Neispravan tip {{type}}',
  jobCanceledOrErrorsFound: 'Zadatak je otkazan ili su pronađene greške; transakcija se poništava',
  jobOrphanedOnRestart: 'Zadatak je prekinut ponovnim pokretanjem servera. Molimo pokušajte ponovo.',
  mobileAppVersionNotSupported:
    'Server ne podržava ovu verziju aplikacije Arena Mobile: ažurirajte je na verziju {{minVersion}} ili noviju',
  paramIsRequired: 'Parametar {{param}} je obavezan',
  paramMustBeInteger: 'Parametar {{param}} mora biti ceo broj',
  propUpdateNotAllowed: 'Svojstvo "{{key}}" ne može da se ažurira',
  unableToFindParent: 'Nije moguće pronaći nadređeni čvor za {{name}}',
  unableToFindNode: 'Nije moguće pronaći čvor sa nazivom {{name}}',
  unableToFindSibling: 'Nije moguće pronaći srodni čvor sa nazivom {{name}}',
  undefinedFunction: `Nedefinisana funkcija '{{fnName}}' ili pogrešni tipovi parametara`,
  invalidSyntax: 'Sintaksa izraza nije ispravna',
  networkError: 'Greška u komunikaciji sa serverom',
  nodeDefConversionNotAllowed: `'{{name}}' ne može da se konvertuje u {{toType}}`,
  nodeDefTypeInvalid: 'Nevažeći tip definicije čvora: {{type}}',
  record: {
    errorUpdating: 'Greška pri ažuriranju zapisa',
    entityNotFound: 'Entitet "{{entityName}}" sa ključevima "{{keyValues}}" nije pronađen',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); greška pri izračunavanju izraza u čvoru {{nodeDefName}}: {{details}}',
    lockTimeout: 'Zapis je zauzet; pokušajte ponovo za nekoliko sekundi.',
    nodeNotInRecord: 'Čvor ne pripada zapisu {{recordUuid}}.',
    nodesBatchInvalid: 'Neispravan zahtjev za grupnu izmjenu ({{reason}}).',
    nodesBatchBusy: 'Druga grupna izmjena je još u toku; pokušajte ponovo za nekoliko sekundi.',
    nodesBatchInvalidValue: 'Nova vrijednost za "{{attributeName}}" nije važeća za ovaj atribut.',
    nodesBatchUnexpected: 'Izmjena nije mogla biti primijenjena zbog neočekivane greške na serveru.',
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
    nodeDefRefLocked: '{{name}} ne može dobiti drugu kategoriju ili taksonomiju: objavljeno je.',
    languageCodeInvalid: 'Kod jezika nije važeći: {{lang}}',
    cycleKeysInvalid: 'Ciklusi moraju biti numerisani redom, počevši od 1',
    srsCodeInvalid: 'Kod prostornog referentnog sistema nije važeći: {{code}}',
  },
  unsupportedFunctionType: 'Nepodržan tip funkcije: {{exprType}}',
  // AI gateway errors
  aiSessionExpired: 'Vaša sesija je istekla. Molimo prijavite se ponovo.',
  aiNotAuthorized: 'Nije vam dozvoljeno da ovdje koristite ovu AI funkciju.',
  aiNotConfigured:
    'AI nije konfigurisan. Podesite lični provajder u AI podešavanjima ili zamolite administratora da konfiguriše podrazumijevani.',
  aiPolicyRefused:
    'AI politika ovog istraživanja ne dozvoljava da šaljete $t(common:aiPolicy.dataClass.{{dataClass}}) $t(common:aiPolicy.hostingClass.{{hostingClass}}).',
  aiPolicyDataAboveSchema:
    "Podaci zapisa ne mogu imati slobodniju politiku od dizajna istraživanja (dizajn: '$t(common:aiPolicy.level.{{schema}})', podaci zapisa: '$t(common:aiPolicy.level.{{data}})').",
  aiPolicyInvalid: 'AI politika nije važeća: izaberite nivo za dizajn istraživanja i nivo za podatke zapisa.',
  aiPolicyAboveCeiling:
    "Nivo '$t(common:aiPolicy.level.{{level}})' nije dozvoljen za $t(common:aiPolicy.dataClass.{{dataClass}}) na ovoj Arena instanci (maksimum: '$t(common:aiPolicy.level.{{ceiling}})').",
  aiFeaturesDisabled: 'AI funkcije su onemogućene na ovoj instalaciji.',
  aiFeatureDisabled: 'AI funkcija "{{feature}}" je onemogućena.',
  aiPromptTooLarge: 'AI upit je prevelik ({{size}} znakova; ograničenje {{limit}}).',
  aiInputTooLong: 'AI polje za unos "{{field}}" premašuje ograničenje od {{limit}} znakova.',
  aiFeatureUnknown: 'Nepoznata AI funkcija "{{feature}}".',
  aiCallInvalid: 'AI zahtjev nije važeći ({{reason}}).',
  aiRateLimited: 'Previše AI zahtjeva. Molimo sačekajte minut i pokušajte ponovo.',
  aiDailyBudgetExceeded:
    'Dostigli ste današnje ograničenje za podrazumijevanog AI provajdera Arene. Ograničenje se poništava u ponoć po UTC vremenu. Možete nastaviti rad sa sopstvenim provajderom u AI podešavanjima.',
  aiRequestTimeout: 'AI je predugo odgovarao. Molimo pokušajte ponovo.',
  aiToolNotOffered:
    'AI je zatražio alat koji nije smio da koristi, pa je njegov odgovor odbačen. Molimo pokušajte ponovo.',
  aiProviderAuth:
    'AI provajder je odbio pristupne podatke. Provjerite API ključ u AI podešavanjima ili se obratite administratoru.',
  aiProviderRateLimited: 'AI provajder ograničava broj zahtjeva. Molimo pokušajte ponovo za trenutak.',
  aiProviderRejected: 'AI provajder je odbio zahtjev (provjerite naziv modela u AI podešavanjima).',
  aiDataDictionaryInvalid: 'AI nije vratio upotrebljive opise polja.',
  aiDescriptionsInvalid: 'AI opisi polja poslati uz izvoz nisu važeći.',
  aiIncludeAiDescriptionsRemoved: 'Ova stranica je zastarjela. Učitajte je ponovo i ponovite izvoz.',
  aiProviderInvalid: 'Nepodržan AI provajder: {{provider}}.',
  aiModelMissing: 'Identifikator AI modela je obavezan.',
  aiApiKeyMissing: 'API ključ je obavezan za provajdera {{provider}}.',
  aiBaseUrlMissing: 'Osnovni URL je obavezan za openai-compatible provajdera.',
  aiBaseUrlNotAllowed:
    'Ovaj osnovni URL upućuje na internu adresu, koju Arena server ne poziva. Za model na vašem računaru koristite Lokalni AI server. Za server vaše organizacije zamolite administratora da ga doda među servere modela organizacije.',
  aiProviderUnavailable: 'Nije moguće pristupiti AI provajderu. Molimo pokušajte ponovo kasnije.',
  aiProviderResponseTooLarge:
    'AI provajder je poslao prevelik odgovor, pa je odgovor skraćen. Molimo pokušajte ponovo ili izaberite drugog provajdera.',
  aiSurveyChanged:
    'Istraživanje se promijenilo dok je asistent radio. Pitajte ponovo da bi se koristilo trenutno istraživanje.',
  aiModelListFailed: 'Nije moguće dobiti listu modela od provajdera.',
  aiProviderNotFound: 'Ovaj AI provajder ne postoji ili nije vaš. Izaberite drugog provajdera.',
  aiProviderNotGateway: 'Provajder sačuvan u ovom pregledaču poziva se iz pregledača, nikada preko Arena servera.',
  aiApiKeyUnreadable:
    'Sačuvani API ključ ovog provajdera se više ne može pročitati (promijenjena je tajna za šifrovanje na serveru). Uredite provajdera u AI podešavanjima i unesite ključ ponovo.',
  aiEncryptionMissing:
    'API ključevi se ne mogu sačuvati: server nema tajnu za šifrovanje. Zamolite administratora da podesi AI_USER_KEY_ENCRYPTION_SECRET.',
  aiProviderChanged:
    'Ovaj AI provajder je izmijenjen ili uklonjen dok je trajala provjera. Ponovo učitajte AI podešavanja i pokušajte ponovo.',
  aiProviderFieldTooLong:
    'Vrijednost provajdera je predugačka: polje "$t(appErrors:aiProviderFieldNames.{{field}})" može imati najviše {{max}} znakova.',
  aiProviderFieldNames: { model: 'Model', baseUrl: 'Osnovni URL', apiKey: 'API ključ' },
  aiProviderLimitReached: 'Možete sačuvati najviše {{max}} AI provajdera. Uklonite jednog da biste dodali drugog.',
  aiExpressionDescriptionMissing: 'Molimo opišite željeni izraz običnim jezikom.',
  aiExpressionTypeInvalid: 'Nepoznata vrsta izraza: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'Nije moguće generisati izraz bez ciljnog polja.',
  aiExpressionNodeDefNotFound: 'Nije moguće pronaći ciljno polje (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'Nije moguće objasniti prazan izraz.',
  aiTranslationSourceLangMissing: 'Izvorni jezik je obavezan za prevod.',
  aiTranslationTargetLangsMissing: 'Najmanje jedan ciljni jezik je obavezan za prevod.',
  aiTranslationItemsMissing: 'Nema ničega za prevođenje.',
  aiTranslationInvalid: 'AI nije vratio upotrebljiv prevod. Molimo pokušajte ponovo.',
  aiTranslationTooManyItems: 'Previše stavki u jednoj seriji ({{count}}); ograničenje je {{limit}}.',
  aiDataQueryDescriptionMissing: 'Molimo opišite podatke koje želite da vidite običnim jezikom.',
  aiDataQueryNoEntities: 'Ovo istraživanje nema entitete koji se mogu pretraživati.',
  aiDataQueryInvalid: 'AI nije mogao da generiše ispravan upit za ovaj zahtjev: {{errors}}',
  aiDataQueryEmpty: 'Prvo izaberite entitet i neke atribute (ili dimenzije i mjere).',
  aiLocalServerUnreachable:
    'Nije moguće pristupiti AI serveru na adresi {{baseUrl}}. Da li je pokrenut i da li je CORS omogućen? Da li je pregledač blokirao pristup uređajima u lokalnoj mreži?',
  aiLocalServerModelMissing:
    'Model "{{modelId}}" nije dostupan na lokalnom AI serveru. Učitajte ga u LM Studio ili izaberite drugi model u AI podešavanjima.',
  aiLocalServerContextExceeded:
    'Zahtjev je predugačak za veličinu konteksta lokalnog modela. Učitajte model sa većim kontekstom u LM Studio ili skratite zahtjev.',
  aiLocalServerError: 'Lokalni AI server je vratio grešku (HTTP {{status}}).',
  aiNoEngineAvailable: 'Nijedan AI motor ne može se koristiti za ovaj zahtjev.',
  aiLocalServerConsentCancelled: 'Zahtjev je otkazan.',
  aiProviderChooseAnother: 'Zahtjev nije poslat. Izaberite drugog AI provajdera.',
  aiDataQuerySummaryInvalid: 'AI nije mogao da predloži naziv i opis za ovaj upit. Molimo pokušajte ponovo.',
  aiApplyTimeout:
    'Server nije odgovorio na vrijeme. Neke izmjene su možda primijenjene: učitajte stranicu ponovo da provjerite.',
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
  userInvitationLinkNotAvailable:
    'Samo sistemski administrator može kopirati link pozivnice ovog korisnika, jer korisnik ima uloge ili pozivnice izvan ovog istraživanja',
  surveyCompareFileTooLarge:
    'Fajl istraživanja je prevelik (najviše {{maxSize}} MB): izvezite istraživanje bez podataka, zapisi i njihovi fajlovi nisu potrebni za poređenje istraživanja',
  userIsAdmin: 'Navedeni korisnik je već sistemski administrator',
  userNotAllowedToChangePref: 'Korisniku nije dozvoljeno da mijenja postavku',
  userPrefsInvalid: 'Korisničke postavke nisu važeće',
  userNotAuthorized: 'Korisnik {{userName}} nije ovlašćen',
  userNotFound: 'Korisnik nije pronađen: {{userUuid}}',
  userNotInvitedToSurvey: 'Korisnik nema pozivnicu na čekanju za ovo istraživanje',
  usersBackupImport: {
    invalidFile: 'Fajl nije ispravna rezervna kopija korisnika Arena',
  },
}
