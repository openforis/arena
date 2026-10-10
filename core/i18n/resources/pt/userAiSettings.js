export default {
  section: 'Recursos de IA',
  enableFeatures: 'Ativar recursos de IA',
  featuresDisabled: 'Os recursos de IA estão desativados nesta implantação.',
  encryptionMissing:
    'A implantação não possui AI_USER_KEY_ENCRYPTION_SECRET; chaves API pessoais não podem ser salvas até que um administrador configure isso.',

  provider: 'Provedor',
  providers: {
    default: 'Padrão do Arena',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatível com OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (endpoint de chat)',
  },
  model: 'Modelo',
  modelOther: 'Outro (digite um id de modelo)...',
  baseUrl: 'URL base',
  apiKey: 'Chave API',
  apiKeyPlaceholder: 'Cole a chave API do seu provedor',
  apiKeyKept: 'Deixe em branco para manter a chave existente.',
  apiKeyUnreadable:
    'A chave de API guardada já não pode ser lida (o segredo de encriptação do servidor mudou). As funcionalidades de IA usam o provedor predefinido até introduzir a chave novamente.',
  vercelAiSdkHint:
    'Um endpoint de chat do Vercel AI SDK é tratado como um agente fixo - seleção de modelo e chave API não se aplicam. A geração de texto livre funciona; recursos de saída estruturada podem não funcionar.',
  modelsFetchFailed: 'Não foi possível buscar modelos: {{message}}',

  savedSuccessfully: 'Configurações de IA salvas.',
  saveFailed: 'Falha ao salvar configurações de IA: {{message}}',

  status: {
    now: 'Agora:',
    ready: 'Pronto',
    notTested: 'Não testado',
    notAvailable: 'Indisponível',
    none: 'Ative o servidor local ou escolha um provedor.',
  },
  where: {
    section: 'Onde a IA é executada',
    order: {
      title: 'Ordem',
      localFirst: 'Usar primeiro o servidor local, com o provedor na nuvem como alternativa',
      cloudFirst: 'Usar primeiro o provedor na nuvem',
      hint: 'A política de IA de cada inventário ainda pode bloquear um motor. Por padrão, os dados dos registros ficam neste dispositivo.',
    },
  },
  localServer: {
    name: 'Servidor de IA local',
    where: 'LM Studio neste computador · salvo neste navegador',
    use: 'Usar',
    baseUrl: 'URL do servidor',
    test: 'Testar',
    answered: 'Respondeu',
    noModels: 'O servidor não lista nenhum modelo. Carregue um modelo no LM Studio.',
    contextTokens: 'Contexto: {{count}} tokens',
    contextUnknown: 'Contexto: desconhecido (8.192 tokens assumidos)',
    model: 'Modelo',
    modelPlaceholder: 'Teste a conexão para listar os modelos',
    help: 'LM Studio: inicie o servidor e ative Enable CORS. Seu navegador pode pedir permissão para acessar dispositivos da rede local.',
    docsLink: 'Documentação do LM Studio',
    httpsHint:
      'O Arena é servido por HTTPS: um servidor em outra máquina da sua rede precisa de HTTPS, ou de um navegador com Local Network Access (Chrome) e sua permissão.',
    cloudWarning:
      'Este endereço não está neste dispositivo nem na lista de servidores da organização: a política de IA do inventário o trata como um serviço na nuvem.',
    notSaved:
      'As configurações do servidor de IA local não puderam ser salvas neste navegador (armazenamento bloqueado ou cheio).',
  },
  cloud: {
    name: 'Provedor na nuvem',
    where: 'salvo com sua conta',
    defaultHint: 'Usa o provedor configurado pelo administrador do Arena.',
    defaultNone: 'Nenhum está configurado neste servidor.',
    localUrlHint:
      'Este endereço está no seu computador ou na sua rede. Para o LM Studio, use o Servidor de IA local acima. O servidor do Arena não consegue acessá-lo.',
    localUrlLink: 'Usar o Servidor de IA local',
    test: 'Testar',
    testOk: 'Respondeu em {{latencyMs}} ms',
    remove: 'Remover meu provedor',
    removed: 'Seu provedor foi removido. Os recursos de IA usam o padrão do Arena.',
  },
  dataClasses: {
    none: 'Sem conteúdo do inventário',
    schema: 'Estrutura do inventário',
    data: 'Dados dos registros',
  },
  features: {
    section: 'Com o que a IA pode ajudar e o que ela vê',
    keyHint:
      'Estrutura do inventário e Dados dos registros correspondem às duas configurações da política de IA de cada inventário.',
    sendsLabel: 'Envia:',
    groupHints: {
      none: 'Qualquer motor.',
      cloud: 'Política padrão do inventário: qualquer motor, incluindo a nuvem.',
      onDevice:
        'Política padrão do inventário: somente este dispositivo. Um motor na nuvem precisa da permissão do administrador do inventário.',
    },
    chat: {
      label: 'Assistente de ajuda',
      sends: 'Sua pergunta e trechos do manual do usuário do Arena.',
    },
    expressions: {
      label: 'Expressões',
      sends: 'O atributo e seus atributos irmãos (nomes, tipos, rótulos), a expressão e sua descrição.',
    },
    translation: {
      label: 'Tradução de rótulos',
      sends: 'Rótulos de atributos, de itens de categorias e nomes comuns de espécies, com os códigos de idioma.',
    },
    assistantDesign: {
      label: 'Assistente de design',
      sends: 'A estrutura do inventário que ele solicita: entidades, atributos, rótulos, categorias e expressões.',
    },
    dataQuery: {
      label: 'Consultas de dados',
      sends:
        'Os nomes, tipos e rótulos dos atributos das entidades do inventário, os nomes das categorias, sua descrição e, para um resumo, a consulta com seu filtro. Nenhum valor dos registros.',
    },
    dataDictionary: {
      label: 'Dicionário de dados',
      sends: 'A estrutura completa do inventário com os rótulos.',
      runs: 'É executado no servidor do Arena, com seu provedor na nuvem ou o padrão do Arena; nunca no seu servidor local.',
    },
    assistantAnalysis: {
      label: 'Assistente de análise',
      sends:
        'A estrutura do inventário e, sempre que executa uma consulta, contagens de registros e resultados da consulta (até 200 grupos ou 50 linhas).',
    },
    assistantCleaning: {
      label: 'Assistente de limpeza',
      sends:
        'Os erros de validação com as chaves e os valores dos registros, e os valores dos registros que ele consulta. Propõe alterações que você revisa.',
    },
    userActivity: {
      label: 'Resumos de atividade',
      sends:
        'O nome do inventário, nomes de usuários, tipos de atividade, contagens e datas do registro de atividades.',
    },
  },
  footerNote: 'Todas as configurações de IA são salvas com o botão Salvar do perfil.',
}
