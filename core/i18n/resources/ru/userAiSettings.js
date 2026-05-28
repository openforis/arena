export default {
  title: 'Nastroiki II',
  section: 'Funkcii II',
  enableFeatures: 'Vkljuchit funkcii II',
  categoriesSection: 'Urovni integracii II',
  categories: {
    chat: 'Chat-bot dokumentacii',
    chatHint:
      'Plavajuschaja knopka pomoschi, otvechajuschaja na voprosy ob Arena s pomoschju nastroennogo provajdera II.',
    expressions: 'Generacija i proverka vyrazhenij',
    expressionsHint: 'Pomoshch II pri sostavlenii i objasnenii vyrazhenij validacii ankety.',
    translation: 'Perevod metok',
    translationHint: 'Avtoperevod mnogojazychnyh metok polej cherez vash provajder II.',
    analysis: 'Analitika i otchetnost',
    analysisHint: 'Svodki zhurnala aktivnosti i chernoviki slovarja dannyh, podgotovlennye II.',
  },
  providerSection: 'Provajder II',
  currentlyUsing: 'Sejchas ispolzuetsja: {{source}} - {{provider}} / {{model}}',
  sourceUser: 'vash lichnyj provajder',
  'sourceAdmin-default': 'platformennyj provajder po umolchaniju',
  notConfigured:
    'II ne nastroen dlja vashej uchetnoj zapisi ili etogo razvertyvanija. Nastrojte lichnyj provajder nizhe ili svjazhites s administratorom.',
  featuresDisabled: 'Funkcii II otkljucheny v etom razvertyvanii.',
  encryptionMissing:
    'V razvertyvanii otsutstvuet AI_USER_KEY_ENCRYPTION_SECRET; lichnye API-kljuchi nelzja sohranjat, poka administrator ne vypolnit nastrojku.',

  provider: 'Provajder',
  providers: {
    default: 'Po umolchaniju',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Sovmestim s OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (chat endpoint)',
  },
  defaultProviderHint: 'Ispolzuetsja provajder II, nastroennyj administratorom Arena.',
  model: 'Model',
  modelOther: 'Drugaja (ukazhite identifikator modeli)...',
  baseUrl: 'Bazovyj URL',
  apiKey: 'API-kljuch',
  apiKeyPlaceholder: 'Vstavte API-kljuch vashego provajdera',
  apiKeyKept: 'Ostavte pustym, chtoby sohranit sushchestvujuschij kljuch.',
  vercelAiSdkHint:
    'Chat endpoint Vercel AI SDK rassmatrivaetsja kak fiksirovannyj agent - vybor modeli i API-kljuch ne primenjajutsja. Generacija svobodnogo teksta rabotaet; funkcionalnost strukturirovannogo vyvoda mozhet ne rabotat.',
  fetchModels: 'Poluchit modeli',
  fetchingModels: 'Poluchenie modelej...',
  modelsFetchFailed: 'Ne udalos poluchit modeli: {{message}}',

  save: 'Sohranit',
  testConnection: 'Proverit podkljuchenie',
  clear: 'Ochistit',

  testing: 'Proverka podkljuchenija...',
  testOk: 'Podkljuchenie OK ({{latencyMs}} ms).',
  testFailed: 'Sboj podkljuchenija: {{message}}',

  savedSuccessfully: 'Nastroiki II sohraneny.',
  saveFailed: 'Ne udalos sohranit nastroiki II: {{message}}',
  cleared: 'Lichnye nastroiki II udaleny.',
}
