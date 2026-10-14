export default {
  section: 'Recursos de IA',
  featuresDisabled: 'Os recursos de IA estão desativados nesta implantação.',
  encryptionMissing:
    'A implantação não possui AI_USER_KEY_ENCRYPTION_SECRET; chaves API pessoais não podem ser salvas até que um administrador configure isso.',

  model: 'Modelo',
  modelOther: 'Outro (digite um id de modelo)...',
  baseUrl: 'URL base',
  apiKey: 'Chave API',
  apiKeyPlaceholder: 'Cole a chave API do seu provedor',
  apiKeyKept: 'Deixe em branco para manter a chave existente.',
  apiKeyUnreadable:
    'A chave API salva não pode mais ser lida (o segredo de criptografia do servidor mudou). Digite a chave novamente.',
  vercelAiSdkHint:
    'Um endpoint de chat do Vercel AI SDK é tratado como um agente fixo - seleção de modelo e chave API não se aplicam. A geração de texto livre funciona; recursos de saída estruturada podem não funcionar.',
  modelsFetchFailed: 'Não foi possível buscar modelos: {{message}}',

  savedSuccessfully: 'Configurações de IA salvas.',
  saveFailed: 'Falha ao salvar configurações de IA: {{message}}',

  status: {
    ready: 'Pronto',
    notTested: 'Não testado',
    notAvailable: 'Indisponível',
    notSetUp: 'Não configurado',
  },
  where: {
    onDevice: 'Este computador',
    orgHosted: 'Servidor da organização',
    cloudOwnKey: 'Nuvem · sua chave',
    cloud: 'Nuvem',
  },
  localServer: {
    where: 'Neste computador ou na sua rede',
    baseUrl: 'URL do servidor',
    answered: 'Respondeu',
    noModels: 'O servidor não lista nenhum modelo. Carregue um modelo no seu servidor local.',
    contextTokens: 'Contexto: {{count}} tokens',
    contextUnknown: 'Contexto: desconhecido (8.192 tokens assumidos)',
    model: 'Modelo',
    modelPlaceholder: 'Teste a conexão para listar os modelos',
    help: 'Inicie seu servidor local (por exemplo LM Studio ou Ollama) e permita as solicitações deste site (CORS). Seu navegador pode pedir permissão para acessar dispositivos da rede local.',
    httpsHint:
      'O Arena é servido por HTTPS: um servidor em outra máquina da sua rede precisa de HTTPS, ou de um navegador com Local Network Access (Chrome) e sua permissão.',
    cloudWarning:
      'Este endereço não está neste dispositivo nem na lista de servidores da organização: a política de IA do inventário o trata como um serviço na nuvem.',
    notSaved:
      'As configurações do servidor de IA local não puderam ser salvas neste navegador (armazenamento bloqueado ou cheio).',
  },
  list: {
    section: 'Provedores',
    add: 'Adicionar provedor',
    arenaDefault: 'Padrão do Arena',
    default: 'Padrão',
    defaultMissing:
      'Seu provedor padrão é um servidor local salvo em outro navegador. Torne outro provedor o padrão para usar a IA aqui.',
    footerHint: 'Os provedores são salvos quando você os adiciona. O que a IA pode ver é salvo com Salvar.',
    menu: 'Ações para {{name}}',
    makeDefault: 'Tornar padrão',
    test: 'Testar conexão',
    edit: 'Editar…',
    remove: 'Remover',
    removeConfirm: 'Remover {{name}}? As conversas que o usam passarão a usar seu provedor padrão.',
    removed: '{{name}} foi removido.',
    defaultChanged: '{{name}} agora é seu provedor padrão.',
    testOk: '{{name}} respondeu.',
    testFailed: '{{name}} não respondeu. Edite-o para verificar suas configurações.',
    actionFailed: 'Não foi possível salvar a alteração: {{message}}',
  },
  types: {
    local: 'Servidor local',
    orgServer: 'Servidor da organização',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatível com OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Simulado (servidor de teste)',
  },
  typeHints: {
    orgServer: 'Um servidor compatível com OpenAI da lista da sua organização.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'vercel-ai-sdk': 'Um endpoint de chat criado com o Vercel AI SDK.',
  },
  dialog: {
    addTitle: 'Adicionar um provedor de IA',
    editTitle: 'Editar {{name}}',
    groupLocal: 'No seu computador ou na sua rede',
    groupCloud: 'Na nuvem, com sua chave API',
    back: 'Voltar',
    name: 'Nome (opcional)',
    test: 'Testar',
    testOk: 'Respondeu em {{latencyMs}} ms',
    add: 'Adicionar provedor',
    save: 'Salvar',
    testFirst: 'Teste a conexão antes de salvar.',
    orgServerHint: 'Servidores da lista da sua organização: {{urls}}',
    orgServerNotAllowed: 'Este endereço não está na lista de servidores da sua organização.',
    apiKeyCleared: 'O endereço mudou: digite a chave API novamente.',
    localUrlHint:
      'Este endereço está no seu computador ou na sua rede: o servidor do Arena não consegue acessá-lo. Adicione-o como servidor local.',
    useLocalServer: 'Adicionar um servidor local',
  },
  dataClasses: {
    none: 'Sem conteúdo do inventário',
    schema: 'Estrutura do inventário',
    data: 'Dados dos registros',
  },
  access: {
    section: 'O que a IA pode ver',
    levels: {
      off: 'Desativada',
      help: 'Só ajuda',
      design: '+ Estrutura do inventário',
      data: '+ Dados dos registros',
    },
    classes: {
      help: { title: 'Ajuda do Arena', text: 'Sua pergunta e trechos do manual do usuário do Arena.' },
      design: {
        title: 'Estrutura do inventário',
        text: 'Entidades, atributos, rótulos, categorias e expressões. Sem valores de registros.',
      },
      data: {
        title: 'Dados dos registros',
        text: 'Valores dos registros e resultados de consultas. Por padrão, apenas um servidor neste dispositivo pode recebê-los.',
      },
    },
    count: '{{on}} de {{total}} recursos ativados',
    off: 'Os recursos de IA estão desativados',
    customize: 'Personalizar',
    customizeHint: 'A política de IA de cada inventário ainda pode bloquear um provedor.',
    sendsInfo: 'O que é enviado',
  },
  features: {
    chat: {
      label: 'Assistente de ajuda',
      sends: 'Sua pergunta, trechos do manual do usuário do Arena e onde você está no Arena (o nome do módulo).',
    },
    assistantSuggestions: {
      label: 'Sugestões proativas',
      sends: 'Nada até você clicar em Fazer em uma sugestão. As verificações são feitas no seu navegador.',
    },
    expressions: {
      label: 'Expressões',
      sends:
        'O atributo e seus atributos irmãos (nomes e tipos), a expressão e sua descrição. Se tenta de novo ou explica um erro, também a expressão que falhou e sua mensagem de erro.',
    },
    translation: {
      label: 'Tradução de rótulos',
      sends:
        'O rótulo ou a descrição que você traduz, com os códigos de idioma. «IA: Traduzir rótulos» no designer de formulário envia os rótulos e as descrições de todas as entidades e atributos.',
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
      sends:
        'O nome do inventário e, de cada entidade ou atributo sem descrição, seu nome, tipo e entidades superiores.',
    },
    assistantAnalysis: {
      label: 'Assistente de análise',
      sends:
        'A estrutura do inventário e, sempre que executa uma consulta, contagens de registros e resultados da consulta (até 200 grupos ou 50 linhas).',
    },
    assistantCleaning: {
      label: 'Assistente de limpeza',
      sends:
        'A estrutura do inventário, os erros de validação com as chaves e os valores dos registros, os valores dos registros que ele consulta e, quando executa uma consulta, seus resultados (contagens de registros e até 200 grupos ou 50 linhas). Propõe alterações que você revisa.',
    },
    userActivity: {
      label: 'Resumos de atividade',
      sends:
        'O nome do inventário, nomes de usuários, tipos de atividade, contagens e datas do registro de atividades.',
    },
  },
}
