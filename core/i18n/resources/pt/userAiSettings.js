export default {
  title: 'Configuracoes de IA',
  section: 'Recursos de IA',
  enableFeatures: 'Ativar recursos de IA',
  categoriesSection: 'Niveis de integracao de IA',
  categories: {
    chat: 'Chatbot de documentacao',
    chatHint: 'Botao de ajuda flutuante que responde perguntas sobre o Arena, usando o provedor de IA configurado.',
    expressions: 'Geracao e validacao de expressoes',
    expressionsHint: 'Assistencia de IA para criar e explicar expressoes de validacao de inventario.',
    translation: 'Traducao de rotulos',
    translationHint: 'Traduz automaticamente rotulos de campos multilingues por meio do seu provedor de IA.',
    analysis: 'Analise e relatorios',
    analysisHint: 'Resumos do log de atividades e exportacoes de dicionario de dados redigidas por IA.',
  },
  providerSection: 'Provedor de IA',
  currentlyUsing: 'Usando atualmente: {{source}} - {{provider}} / {{model}}',
  sourceUser: 'seu provedor pessoal',
  'sourceAdmin-default': 'o padrao da plataforma',
  notConfigured:
    'A IA nao esta configurada para sua conta ou para esta implantacao. Configure um provedor pessoal abaixo ou contate seu administrador.',
  featuresDisabled: 'Os recursos de IA estao desativados nesta implantacao.',
  encryptionMissing:
    'A implantacao nao possui AI_USER_KEY_ENCRYPTION_SECRET; chaves API pessoais nao podem ser salvas ate que um administrador configure isso.',

  provider: 'Provedor',
  providers: {
    default: 'Padrao',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compativel com OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (endpoint de chat)',
  },
  defaultProviderHint: 'Usa o provedor de IA configurado pelo administrador do Arena.',
  model: 'Modelo',
  modelOther: 'Outro (digite um id de modelo)...',
  baseUrl: 'URL base',
  apiKey: 'Chave API',
  apiKeyPlaceholder: 'Cole a chave API do seu provedor',
  apiKeyKept: 'Deixe em branco para manter a chave existente.',
  vercelAiSdkHint:
    'Um endpoint de chat do Vercel AI SDK e tratado como um agente fixo - selecao de modelo e chave API nao se aplicam. A geracao de texto livre funciona; recursos de saida estruturada podem nao funcionar.',
  fetchModels: 'Buscar modelos',
  fetchingModels: 'Buscando modelos...',
  modelsFetchFailed: 'Nao foi possivel buscar modelos: {{message}}',

  save: 'Salvar',
  testConnection: 'Testar conexao',
  clear: 'Limpar',

  testing: 'Testando conexao...',
  testOk: 'Conexao OK ({{latencyMs}} ms).',
  testFailed: 'Falha na conexao: {{message}}',

  savedSuccessfully: 'Configuracoes de IA salvas.',
  saveFailed: 'Falha ao salvar configuracoes de IA: {{message}}',
  cleared: 'Configuracoes pessoais de IA removidas.',
}
