export default {
  section: 'AI funkcije',
  featuresDisabled: 'AI funkcije su onemogućene na ovoj instalaciji.',
  encryptionMissing:
    'Na ovoj instalaciji nedostaje AI_USER_KEY_ENCRYPTION_SECRET; lični API ključevi ne mogu se sačuvati dok ga administrator ne konfiguriše.',

  model: 'Model',
  modelOther: 'Drugi (unesite id modela)...',
  baseUrl: 'Osnovni URL',
  apiKey: 'API ključ',
  apiKeyPlaceholder: 'Nalijepite API ključ vašeg provajdera',
  apiKeySaved: 'Ključ je sačuvan',
  unknownError: 'Nepoznata greška',
  apiKeyKept: 'Ostavite prazno da zadržite postojeći ključ.',
  apiKeyUnreadable:
    'Sačuvani API ključ se više ne može pročitati (promijenjena je tajna za šifrovanje na serveru). Unesite ključ ponovo.',
  vercelAiSdkHint:
    'Krajnja tačka za chat Vercel AI SDK-a se tretira kao fiksni agent - izbor modela i API ključ se ne primjenjuju. Generisanje slobodnog teksta radi; funkcije sa strukturiranim izlazom možda neće raditi.',
  modelsFetchFailed: 'Nije moguće preuzeti modele: {{message}}',

  savedSuccessfully: 'AI podešavanja su sačuvana.',
  saveFailed: 'Čuvanje AI podešavanja nije uspjelo: {{message}}',

  status: {
    ready: 'Spremno',
    notTested: 'Nije testirano',
    notAvailable: 'Nije dostupno',
    notSetUp: 'Nije podešeno',
  },
  where: {
    onDevice: 'Ovaj računar',
    orgHosted: 'Server organizacije',
    cloudOwnKey: 'Oblak · vaš ključ',
    cloud: 'Oblak',
  },
  localServer: {
    where: 'Na ovom računaru ili u vašoj mreži',
    baseUrl: 'URL servera',
    answered: 'Odgovorio je',
    noModels: 'Server ne navodi nijedan model. Učitajte model na vašem lokalnom serveru.',
    contextTokens_one: 'Kontekst: {{count}} token',
    contextTokens_few: 'Kontekst: {{count}} tokena',
    contextTokens_other: 'Kontekst: {{count}} tokena',
    contextUnknown: 'Kontekst: nepoznat (pretpostavlja se 8.192 tokena)',
    model: 'Model',
    modelPlaceholder: 'Testirajte vezu da biste dobili listu modela',
    help: 'Pokrenite vaš lokalni server (na primjer LM Studio ili Ollama) i dozvolite zahtjeve sa ovog sajta (CORS). Vaš pregledač može zatražiti dozvolu za pristup uređajima u lokalnoj mreži.',
    httpsHint:
      'Arena se isporučuje preko HTTPS-a: serveru na drugom računaru u vašoj mreži potreban je HTTPS, ili pregledač sa funkcijom Local Network Access (Chrome) i vaša dozvola.',
    cloudWarning:
      'Ova adresa nije ni na ovom uređaju ni na listi servera organizacije: AI politika istraživanja je tretira kao servis u oblaku.',
    notSaved:
      'Podešavanja lokalnog AI servera nisu mogla biti sačuvana u ovom pregledaču (skladište je blokirano ili puno).',
  },
  list: {
    section: 'Provajderi',
    add: 'Dodaj provajdera',
    arenaDefault: 'Podrazumijevani provajder Arene',
    default: 'Podrazumijevani',
    defaultMissing:
      'Vaš podrazumijevani provajder je Lokalni server sačuvan u drugom pregledaču. Postavite drugog provajdera kao podrazumijevanog da biste ovdje koristili AI.',
    footerHint: 'Provajderi se čuvaju čim ih dodate. Ono što AI može da vidi čuva se dugmetom Sačuvaj.',
    menu: 'Radnje za {{name}}',
    makeDefault: 'Postavi kao podrazumijevani',
    test: 'Testiraj vezu',
    edit: 'Uredi…',
    remove: 'Ukloni',
    removeConfirm: 'Ukloniti {{name}}? Razgovori koji ga koriste koristiće vaš podrazumijevani provajder.',
    removed: '{{name}}: provajder je uklonjen.',
    defaultChanged: '{{name}} je sada vaš podrazumijevani provajder.',
    testOk: '{{name}}: provajder je odgovorio.',
    testFailed: '{{name}}: provajder nije odgovorio. Uredite ga da provjerite njegova podešavanja.',
    actionFailed: 'Izmjena nije mogla biti sačuvana: {{message}}',
  },
  types: {
    local: 'Lokalni server',
    orgServer: 'Server organizacije',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Kompatibilan sa OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock (testni server)',
  },
  defaultName: {
    local: 'Lokalni server',
    orgServer: 'Server organizacije',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    'openai-compatible': 'Kompatibilan sa OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock',
  },
  typeHints: {
    orgServer: 'Server kompatibilan sa OpenAI sa liste vaše organizacije.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'vercel-ai-sdk': 'Krajnja tačka za chat napravljena pomoću Vercel AI SDK-a.',
  },
  dialog: {
    addTitle: 'Dodaj AI provajdera',
    editTitle: 'Uredi {{name}}',
    groupLocal: 'Na vašem računaru ili u mreži',
    groupCloud: 'Oblak, sa vašim API ključem',
    back: 'Nazad',
    name: 'Naziv (opciono)',
    test: 'Testiraj',
    testOk: 'Odgovor za {{latencyMs}} ms',
    add: 'Dodaj provajdera',
    save: 'Sačuvaj',
    testFirst: 'Testirajte vezu prije čuvanja.',
    orgServerHint: 'Serveri na listi vaše organizacije: {{urls}}',
    orgServerNotAllowed: 'Ova adresa nije na listi servera vaše organizacije.',
    apiKeyCleared: 'Adresa je promijenjena: unesite API ključ ponovo.',
    removeKey: 'Ukloni ključ',
    keepKey: 'Zadrži ključ',
    apiKeyRemoved: 'Sačuvani ključ će biti uklonjen. Testirajte vezu, a zatim sačuvajte.',
    localUrlHint:
      'Ova adresa je na vašem računaru ili u vašoj mreži: Arena server ne može da joj pristupi. Dodajte je kao Lokalni server.',
    useLocalServer: 'Dodaj Lokalni server',
  },
  dataClasses: {
    none: 'Bez sadržaja istraživanja',
    schema: 'Dizajn istraživanja',
    data: 'Podaci zapisa',
  },
  access: {
    section: 'Šta AI može da vidi',
    levels: {
      off: 'Isključeno',
      help: 'Samo pomoć',
      design: '+ Dizajn istraživanja',
      data: '+ Podaci zapisa',
    },
    classes: {
      help: { title: 'Arena pomoć', text: 'Vaše pitanje i odlomci iz korisničkog uputstva za Arenu.' },
      design: {
        title: 'Dizajn istraživanja',
        text: 'Entiteti, atributi, oznake, kategorije i izrazi. Bez vrijednosti iz zapisa.',
      },
      data: {
        title: 'Podaci zapisa',
        text: 'Vrijednosti iz zapisa i rezultati upita. Podrazumijevano ih može primiti samo server na ovom uređaju.',
      },
    },
    count: 'Uključeno funkcija: {{on}} od {{total}}',
    off: 'AI funkcije su isključene',
    customize: 'Prilagodi',
    customizeHint: 'AI politika svakog istraživanja i dalje može blokirati provajdera.',
    sendsInfo: 'Šta šalje',
  },
  features: {
    chat: {
      label: 'Asistent za pomoć',
      sends: 'Vaše pitanje, odlomke iz korisničkog uputstva za Arenu i gdje se nalazite u Areni (naziv modula).',
    },
    assistantSuggestions: {
      label: 'Proaktivni prijedlozi',
      sends: 'Ništa dok ne kliknete na Uradi na nekom prijedlogu. Provjere se izvršavaju u vašem pregledaču.',
    },
    expressions: {
      label: 'Izrazi',
      sends:
        'Atribut i njemu srodne atribute (nazive i tipove), izraz i vaš opis. Ako ponovo pokušava ili objašnjava grešku, i neuspjeli izraz i njegovu poruku o grešci.',
    },
    translation: {
      label: 'Prevod oznaka',
      sends:
        "Oznaku ili opis koji prevodite, sa kodovima jezika. 'AI: Prevedi oznake' u Dizajneru obrasca šalje oznake i opise svih entiteta i atributa.",
    },
    assistantDesign: {
      label: 'Asistent za dizajn',
      sends: 'Strukturu istraživanja koju zatraži: entitete, atribute, oznake, kategorije i izraze.',
    },
    dataQuery: {
      label: 'Upiti nad podacima',
      sends:
        'Nazive, tipove i oznake atributa entiteta istraživanja, nazive kategorija, vaš opis i, za sažetak, upit sa njegovim filterom. Bez vrijednosti iz zapisa.',
    },
    dataDictionary: {
      label: 'Rječnik podataka',
      sends: 'Naziv istraživanja i, za svaki entitet ili atribut bez opisa, njegov naziv, tip i nadređene entitete.',
    },
    assistantAnalysis: {
      label: 'Asistent za analizu',
      sends:
        'Strukturu istraživanja, a zatim broj zapisa i rezultate upita (do 200 grupa ili 50 redova) svaki put kada pokrene upit.',
    },
    assistantCleaning: {
      label: 'Asistent za čišćenje',
      sends:
        'Strukturu istraživanja, greške validacije sa ključevima i vrijednostima njihovih zapisa, vrijednosti zapisa koje pregleda i, kada pokrene upit, njegove rezultate (broj zapisa i do 200 grupa ili 50 redova). Predlaže izmjene koje vi pregledate.',
    },
    userActivity: {
      label: 'Sažeci aktivnosti',
      sends: 'Naziv istraživanja, korisnička imena, tipove aktivnosti, brojeve i datume iz dnevnika aktivnosti.',
    },
  },
}
