export default {
  title: 'AI podešavanja',
  section: 'AI funkcije',
  enableFeatures: 'Omogući AI funkcije',
  categoriesSection: 'Nivoi AI integracije',
  categories: {
    chat: 'Chatbot za dokumentaciju',
    chatHint:
      'Plutajuće dugme za pomoć koje odgovara na pitanja o aplikaciji Arena, uz podršku vašeg konfigurisanog AI provajdera.',
    expressions: 'Generisanje i validacija izraza',
    expressionsHint: 'AI pomoć pri pisanju i objašnjavanju izraza za validaciju istraživanja.',
    translation: 'Prevod oznaka',
    translationHint: 'Automatski prevod višejezičnih oznaka polja istraživanja putem vašeg AI provajdera.',
    dataDictionary: 'Rječnik podataka',
    dataDictionaryHint: 'Izvozi rječnika podataka koje priprema AI.',
    userActivity: 'Aktivnost korisnika',
    userActivityHint: 'Sažeci dnevnika aktivnosti koje generiše AI.',
    dataQuery: 'Upiti nad podacima',
    dataQueryHint: 'Generišite upite za Istraživač podataka iz opisa na običnom jeziku.',
  },
  providerSection: 'AI provajder',
  currentlyUsing: 'Trenutno se koristi: {{source}} - {{provider}} / {{model}}',
  sourceUser: 'vaš lični provajder',
  'sourceAdmin-default': 'podrazumijevani provajder platforme',
  notConfigured:
    'AI nije konfigurisan za vaš nalog ili ovu instalaciju. Konfigurišite lični provajder ispod ili kontaktirajte administratora.',
  featuresDisabled: 'AI funkcije su onemogućene na ovoj instalaciji.',
  encryptionMissing:
    'Na ovoj instalaciji nedostaje AI_USER_KEY_ENCRYPTION_SECRET; lični API ključevi ne mogu se sačuvati dok ga administrator ne konfiguriše.',

  provider: 'Provajder',
  providers: {
    default: 'Podrazumijevani',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Kompatibilan sa OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (chat endpoint)',
  },
  defaultProviderHint: 'Koristi AI provajder koji je konfigurisao vaš Arena administrator.',
  model: 'Model',
  modelOther: 'Drugi (unesite id modela)...',
  baseUrl: 'Osnovni URL',
  apiKey: 'API ključ',
  apiKeyPlaceholder: 'Nalijepite API ključ vašeg provajdera',
  apiKeyKept: 'Ostavite prazno da zadržite postojeći ključ.',
  vercelAiSdkHint:
    'Vercel AI SDK chat endpoint se tretira kao fiksni agent - izbor modela i API ključ se ne primjenjuju. Generisanje slobodnog teksta radi; funkcije sa strukturiranim izlazom možda neće raditi.',
  fetchModels: 'Preuzmi modele',
  fetchingModels: 'Preuzimanje modela...',
  modelsFetchFailed: 'Nije moguće preuzeti modele: {{message}}',

  save: 'Sačuvaj',
  testConnection: 'Testiraj vezu',
  clear: 'Obriši',

  testing: 'Testiranje veze...',
  testOk: 'Veza je u redu ({{latencyMs}} ms).',
  testFailed: 'Veza nije uspjela: {{message}}',

  savedSuccessfully: 'AI podešavanja su sačuvana.',
  saveFailed: 'Čuvanje AI podešavanja nije uspjelo: {{message}}',
  cleared: 'Lična AI podešavanja su uklonjena.',
}
