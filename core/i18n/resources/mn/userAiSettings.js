export default {
  title: 'AI tohirgoo',
  section: 'AI funkcud',
  enableFeatures: 'AI funkcuduig idevhjuuleh',
  categoriesSection: 'AI integraciin tuvshin',
  categories: {
    chat: 'Barimt bichgiin chatbot',
    chatHint:
      'Tany tohiruulsan AI uilchilgee uzuulegcheer ajillah, Arena-iin talaar asuultad hariulah huvugch tuslamjiin tovch.',
    expressions: 'Ilerhiilel uusgeh ba shalgah',
    expressionsHint: 'Sudalgaany batalgaajuulaltyn ilerhiilelliig bichih, tailbarlahad AI tuslamj.',
    translation: 'Shoshgo orchuulga',
    translationHint: 'Olon heltei talbaryn shoshgyg tany AI uilchilgee uzuulegcheer avtomataar orchuulna.',
    analysis: 'Shinjilgee ba tailagnal',
    analysisHint: 'Uil ajillagaany burtgeliin huraangui bolon AI-aar bolovsruulsan ugugdliin toli export.',
  },
  providerSection: 'AI uilchilgee uzuulegch',
  currentlyUsing: 'Odoogoor ashiglaj bui: {{source}} - {{provider}} / {{model}}',
  sourceUser: 'tany huviin uilchilgee uzuulegch',
  'sourceAdmin-default': 'platformyn anhdagch tohirgoo',
  notConfigured:
    'AI ni tany dans esvel ene orchind tohiruulagdaagui baina. Door huviin uilchilgee uzuulegch tohiruulah esvel admintai holbogdono uu.',
  featuresDisabled: 'Ene orchind AI funkcud idevhgui baina.',
  encryptionMissing:
    'Orchind AI_USER_KEY_ENCRYPTION_SECRET alga baina; admin tohirgoo hiih hurtel huviin API tulhuur hadgalah bolomjgui.',

  provider: 'Uilchilgee uzuulegch',
  providers: {
    default: 'Anhdagch',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'OpenAI-tei niitstei (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (chat endpoint)',
  },
  defaultProviderHint: 'Arena adminy tohiruulsan AI uilchilgee uzuulegchiig ashiglana.',
  model: 'Zagvar',
  modelOther: 'Busad (zagvaryn id oruulna uu)...',
  baseUrl: 'Suuri URL',
  apiKey: 'API tulhuur',
  apiKeyPlaceholder: 'Uilchilgee uzuulegchiin API tulhuuree oruulna uu',
  apiKeyKept: 'Odoogiin tulhuuriig hadgalah bol hooson uldeeh uu.',
  vercelAiSdkHint:
    'Vercel AI SDK chat endpoint ni togtmol agent gej uzegdeh - zagvar songolt ba API tulhuur hamaarahgui. Chuluut tekst uusgelt ajillana; butetstei garaltyn funkcud ajillahgui baj bolno.',
  fetchModels: 'Zagvaruud avah',
  fetchingModels: 'Zagvaruudiig avch baina...',
  modelsFetchFailed: 'Zagvaruudiig avch chadsangui: {{message}}',

  save: 'Hadgalah',
  testConnection: 'Holbolt shalgah',
  clear: 'Tseverleh',

  testing: 'Holboltyg shalgaj baina...',
  testOk: 'Holbolt OK ({{latencyMs}} ms).',
  testFailed: 'Holbolt amjiltgui: {{message}}',

  savedSuccessfully: 'AI tohirgoo hadgalagdlaa.',
  saveFailed: 'AI tohirgoo hadgalah ued aldaa garlaa: {{message}}',
  cleared: 'Huviin AI tohirgoog ustgalaa.',
}
