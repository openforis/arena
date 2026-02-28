export default {
  common: {
    active: 'Ativo',
    add: 'Adicionar',
    advancedFunctions: 'Funções avançadas',
    and: 'e',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Aplicar',
    aggregateFunction: 'Função agregada',
    aggregateFunction_other: 'Funções agregadas',
    attribute: 'Atributo',
    attribute_other: 'Atributos',
    avg: 'Média',
    ascending: 'Crescente',
    areaBased: 'baseado em área',
    back: 'Voltar',
    baseUnit: 'Unidade base',
    cancel: 'Cancelar',
    cancelConfirm: `**Existem alterações não salvas**.

Deseja ignorá-las?`,
    cantUndoWarning: 'Esta operação não pode ser desfeita',
    cantBeDeletedUsedItem: 'Este(a) {{item}} é usado(a) por algumas definições de nó e não pode ser excluído(a)',
    chain: 'Cadeia',
    chain_plural: 'Cadeias',
    childrenEmpty: 'Defina pelo menos um item filho',
    clone: 'Clonar',
    close: 'Fechar',
    cloneFrom: 'Clonar de',
    cnt: 'Contagem',
    code: 'Código',
    collapse: 'Recolher',
    confirm: 'Confirmar',
    convert: 'Converter',
    copy: 'Copiar',
    createdWith: 'Criado com',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Ciclo',
    cycle_plural: 'Ciclos',
    dateCreated: 'Data de criação',
    dateLastModified: 'Data da última alteração',
    delete: 'Excluir',
    deleted: 'Excluído!',
    descending: 'Decrescente',
    description: 'Descrição',
    description_plural: 'Descrições',
    designerNotes: 'Notas do designer',
    designerNotesInfo: `As notas do designer ficarão visíveis apenas no designer de formulários do inventário e não ficarão visíveis no formulário de entrada de dados.`,
    details: 'Detalhes',
    dimension: 'Dimensão',
    dimension_other: 'Dimensões',
    done: 'Concluído',
    download: 'Baixar',
    draft: 'Rascunho',
    edit: 'Editar',
    email: 'Email',
    email_other: 'Emails',
    emailSentConfirmation: `Um email para {{email}} foi enviado.

    Informe a pessoa para verificar também a pasta de Spam/Lixo eletrônico.`,
    emailSentToSelfConfirmation: `Você deve ter recebido um email em {{email}}.

  Verifique também a pasta de Spam/Lixo eletrônico.`,
    empty: 'Vazio',
    entity: 'Entidade',
    error: 'Erro',
    error_plural: 'Erros',
    errorFound: '1 erro encontrado',
    errorFound_other: '{{count}} erros encontrados',
    errorMessage: 'Mensagem de erro',
    errorMessage_plural: 'Mensagens de erro',
    expand: 'Expandir',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Exportar',
    exportAll: 'Exportar tudo',
    exportToCSV: 'Exportar para CSV',
    exportToExcel: 'Exportar para Excel',
    exportToExcelTooManyItems: 'Itens demais para exportar no Excel; use exportação CSV.',
    expression: 'Expressão',
    false: 'Falso',
    file: 'Arquivo',
    file_plural: 'Arquivos',
    formContainsErrors: 'O formulário contém erros',
    formContainsErrorsCannotContinue: 'O formulário contém erros. Corrija-os antes de continuar.',
    formContainsErrorsCannotSave: 'O formulário contém erros. Corrija-os antes de salvar.',
    from: 'De',
    function: 'Função',
    goToHomePage: 'Ir para a página inicial',
    group: 'Grupo',
    help: 'Ajuda',
    hide: 'Ocultar',
    id: 'id',
    import: 'Importar',
    importFromExcelOrCSVFile: 'Importar de arquivo Excel (.xlsx) ou CSV',
    info: 'Informações',
    invalid: 'INVÁLIDO',
    item: 'Item',
    item_plural: 'Itens',
    itemAlreadyAdded: 'Item já adicionado',
    label: 'Rótulo',
    label_plural: 'Rótulos',
    language: 'Idioma',
    language_plural: 'Idiomas',
    leavePageConfirmMessage: `Existem alterações não salvas no formulário. 

Ao confirmar, todas as alterações serão perdidas.
Deseja prosseguir?`,
    local: 'Local',
    loading: 'Carregando...',
    max: 'Máximo',
    med: 'Mediana',
    manage: 'Gerenciar',
    message_plural: 'Mensagens',
    measure: 'Medida',
    measure_other: 'Medidas',
    measurePrevSteps: 'Medida das etapas anteriores',
    measurePrevSteps_plural: 'Medidas das etapas anteriores',
    min: 'Mínimo',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    name: 'Nome',
    new: 'Novo',
    next: 'Próximo',
    no: 'Não',
    noItems: `$t(common.no) $t(common.item_plural)`,
    notification: 'Notificação',
    notification_other: 'Notificações',
    notSpecified: '---Não especificado---',
    orderBy: 'Ordenar por',
    of: 'de',
    ok: 'Ok',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Abrir em nova janela',
    options: 'Opções',
    owner: 'Proprietário',
    path: 'Caminho',
    pause: 'Pausar',
    preview: 'Modo de visualização',
    previous: 'Anterior',
    publish: 'Publicar',
    publishConfirm: `#### Você está prestes a publicar o inventário {{survey}} ####

###### O processo de publicação *excluirá permanentemente* as seguintes informações ###### 
- Etiquetas associadas a idiomas excluídos.
- Registros associados a ciclos excluídos.
- Dados associados a campos de formulário excluídos.

###### Após a publicação: ###### 
- Os campos do formulário não podem ser alterados de simples para múltiplos e vice-versa.
- Os códigos dos itens da categoria não podem ser alterados.
- Os itens da categoria não podem ser excluídos.
- Os códigos de taxonomia não podem ser alterados.
- Os táxons não podem ser excluídos.

**Tem certeza de que deseja continuar?**`,
    raiseTicketInSupportForum: `Em caso de problemas, abra um chamado com a tag 'arena' no nosso <b>Fórum de Suporte</b>: $t(links.supportForum)`,
    record: 'Registro',
    record_other: 'Registros',
    remote: 'Remoto',
    required: 'Obrigatório',
    requiredField: 'campo obrigatório',
    reset: 'Redefinir',
    resume: 'Retomar',
    retry: 'Tentar novamente',
    role: 'Função',
    save: 'Salvar',
    saveAndBack: 'Salvar e voltar',
    saved: 'Salvo!',
    samplingPolygon: 'Polígono amostral',
    show: 'Mostrar',
    select: 'Selecionar',
    selectOne: 'Selecione um...',
    selectAll: 'Selecionar todos',
    selected: 'Selecionado',
    showLabels: 'Mostrar rótulos',
    showLabelsAndNames: 'Mostrar rótulos e nomes',
    showNames: 'Mostrar nomes',
    srs: 'SRS',
    status: 'Status',
    sum: 'Soma',
    test: 'Teste',
    to: 'Para',
    totalItems: 'Total de itens',
    true: 'Verdadeiro',
    type: 'Tipo',
    undefinedName: 'Nome indefinido',
    unique: 'Único',
    upload: 'Enviar',
    uploadErrorConfirm: {
      message: `Erro durante o envio do arquivo: {{error}}.\n
    Tentar novamente?`,
    },
    uploadingFile: 'Enviando arquivo ({{progressPercent}}%)',
    value: 'Valor',
    view: 'Visualizar',
    warning: 'Aviso',
    warning_plural: 'Avisos',
    yes: 'Sim',
    date: {
      aMomentAgo: 'Agora há pouco',
      hour: 'hora',
      hour_other: 'horas',
      day: 'dia',
      day_other: 'dias',
      minute: 'minuto',
      minute_other: 'minutos',
      week: 'semana',
      week_other: 'semanas',
      timeDiff: `há {{count}} $t(common.date.{{unit}}, { 'count': {{count}} })`,
    },
    paginator: {
      firstPage: 'Primeira página',
      itemsPerPage: 'Itens por página',
      lastPage: 'Última página',
      nextPage: 'Próxima página',
      previousPage: 'Página anterior',
    },
    table: {
      visibleColumns: 'Colunas visíveis',
    },
  },

  confirm: {
    strongConfirmInputLabel: 'Para confirmar, digite o seguinte texto: **{{strongConfirmRequiredText}}**',
  },

  dropzone: {
    acceptedFilesMessage: '(Somente arquivos {{acceptedExtensions}} com tamanho máximo de {{maxSize}} serão aceitos)',
    error: {
      fileNotValid: 'O arquivo selecionado não é válido',
      fileTooBig: 'O arquivo selecionado é muito grande',
      invalidFileExtension: 'Extensão de arquivo inválida: {{extension}}',
    },
    message: 'Arraste e solte um arquivo aqui ou clique para selecioná-lo',
    selectedFile: 'Arquivo selecionado',
    selectedFile_other: 'Arquivos selecionados',
  },

  error: {
    pageNotFound: 'Página não encontrada',
  },

  geo: {
    area: 'Área',
    vertices: 'Vértices',
    perimeter: 'Perímetro',
  },

  files: {
    header: 'Arquivos',
    missing: ' Arquivos ausentes: {{count}}',
    totalSize: 'Tamanho total: {{size}}',
  },

  sidebar: {
    logout: 'Sair',
  },

  header: {
    myProfile: 'Meu perfil',
    qrCodeLoginDialog: {
      title: 'Faça login no Arena Mobile usando o código QR',
      instructions: `1. Inicie o aplicativo **Arena Mobile** em seu dispositivo móvel
2. Acesse o menu **Configurações**
3. Selecione **Conexão ao servidor**
4. Pressione **Login usando código QR**
5. Digitalize o código QR exibido nesta tela`,
      success: 'Login realizado com sucesso!',
      error: 'Erro ao gerar o código QR: {{error}}',
    },
  },

  nodeDefsTypes: {
    integer: 'Inteiro',
    decimal: 'Decimal',
    text: 'Texto',
    date: 'Data',
    time: 'Hora',
    boolean: 'Booleano',
    code: 'Código',
    coordinate: 'Coordenada',
    geo: 'Geoespacial',
    taxon: 'Taxon',
    file: 'Arquivo',
    entity: 'Entidade',
  },

  // ====== App modules and views

  appModules: {
    home: 'Início',
    dashboard: 'Painel',
    surveyNew: 'Novo inventário',
    surveys: 'Inventários',
    templateNew: 'Novo modelo',
    templates: 'Modelos',
    usersAccessRequest: 'Solicitações de acesso de usuários',
    collectImportReport: 'Coletar relatório de importação',

    surveyInfo: 'Informações do inventário',
    designer: 'Inventário',
    formDesigner: 'Designer de formulário',
    surveyHierarchy: 'Hierarquia',
    surveyDependencyTree: 'Árvore de dependências',
    category: 'Categoria',
    categories: 'Categorias',
    nodeDef: 'Definição de nó',
    taxonomy: 'Taxonomia',
    taxonomies: 'Taxonomias',

    data: 'Dados',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Relatório de validação de registro',
    explorer: 'Explorador',
    map: 'Mapa',
    charts: 'Gráficos',
    export: 'Exportação de dados',
    import: 'Importação de dados',
    validationReport: 'Relatório de validação',

    users: 'Usuários',
    user: 'Perfil de usuário',
    userPasswordChange: 'Alterar senha',
    userInvite: 'Convidar usuário',
    userNew: 'Novo usuário',
    usersSurvey: 'Lista de usuários',
    usersList: 'Lista de usuários (todos)',
    user2FADevice: 'Dispositivo 2FA',
    user2FADevice_plural: 'Dispositivos 2FA',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_plural)',

    analysis: 'Análise',
    chain: 'Cadeia',
    chain_plural: 'Cadeias',
    virtualEntity: 'Entidade virtual',
    entities: 'Entidades virtuais',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'Instâncias',

    message: 'Mensagem',
    message_plural: '$t(common.message_plural)',

    help: 'Ajuda',
    about: 'Sobre',
    disclaimer: 'Aviso legal',
    userManual: 'Manual do usuário',
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'Esta seção está disponível somente quando o inventário é publicado',
  },

  loginView: {
    yourName: 'Seu nome',
    yourEmail: 'Seu email',
    yourPassword: 'Sua senha',
    yourNewPassword: 'Sua nova senha',
    repeatYourPassword: 'Repita sua senha',
    repeatYourNewPassword: 'Repita sua nova senha',
    requestAccess: 'Novo no $t(common.appNameFull)? Solicite acesso',
    resetPassword: 'Redefinir senha',
    login: 'Entrar',
    loginUsingBackupCode: 'Entrar com código de backup 2FA',
    forgotPassword: 'Esqueceu a senha',
    sendPasswordResetEmail: 'Enviar email de redefinição de senha',
    twoFactorBackupCode: 'Código de backup 2FA',
    twoFactorToken: 'Código de verificação',
    twoFactorTokenDescription: `Para manter sua conta segura, verificamos sua identidade.

Insira o código gerado pelo seu aplicativo autenticador.`,
  },

  accessRequestView: {
    error: 'Erro ao solicitar acesso: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Primeiro nome',
        lastName: 'Sobrenome',
        institution: 'Instituição',
        country: 'País',
        purpose: 'Para que você precisa?',
        surveyName: 'Proponha um nome para o inventário',
        templateUuid: 'Começar com um modelo?',
      },
    },
    introduction: `Nossos recursos são limitados, então você deve solicitar acesso à plataforma.
  Também estamos interessados ​​no que você deseja fazer com ela, então informe-nos!
  Você pode começar a partir de um **novo inventário em branco** ou clonar um **modelo** existente, e deverá sugerir um nome para o inventário recém-criado.
  Você receberá a função de ***Administrador do Inventário*** para esse inventário: poderá editá-lo e convidar novos usuários para participar do seu inventário e contribuir com ele.
  Você também será um ***Gerente de Inventários*** e poderá **criar novos inventários** (até 5), se necessário.
Para mais informações, visite nosso site: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Depois de enviar a solicitação, aguarde um e-mail de convite para acessar a Arena.**`,
    reCaptchaNotAnswered: 'ReCaptcha não respondido',
    requestSent: 'Solicitação de acesso enviada com sucesso',
    requestSentMessage: `Por favor, dê-nos alguns dias para processar sua solicitação.
Enviaremos em breve um email para **{{email}}** com as instruções de como acessar $t(common.appName).
Obrigado e aproveite **$t(common.appNameFull)**!`,
    sendRequest: 'Enviar solicitação',
    sendRequestConfirm: 'Solicitar acesso ao $t(common.appNameFull)?',
    templateNotSelected: 'Não selecionado (começar do zero)',
    title: 'Solicitando acesso ao $t(common.appNameFull)',
  },

  resetPasswordView: {
    title: {
      completeRegistration: 'Conclua seu cadastro no Arena',
      setYourNewPassword: 'Defina sua nova senha',
    },
    setNewPassword: 'Definir nova senha',
    forgotPasswordLinkInvalid: 'A página que você tentou acessar não existe ou não é mais válida',
    passwordSuccessfullyReset: 'Sua senha foi redefinida com sucesso',
    passwordStrengthChecksTitle: 'Verificações de força da senha',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Sem espaços em branco',
      atLeast8CharactersLong: 'Pelo menos 8 caracteres',
      containsLowerCaseLetters: 'Contém letras minúsculas',
      containsUpperCaseLetters: 'Contém letras maiúsculas',
      containsNumbers: 'Contém números',
    },
    completeRegistration: 'Concluir cadastro',
  },

  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Tipos de dependência',
    dependencyTypes: {
      applicable: 'Aplicabilidade',
      defaultValues: 'Valor padrão',
      itemsFilter: 'Filtro de itens',
      minCount: 'Contagem mínima',
      maxCount: 'Contagem máxima',
      validations: 'Validações',
    },
    selectAtLeastOneDependencyType: 'Selecione pelo menos um tipo de dependência',
    noDependenciesToDisplay: 'Nenhuma dependência para exibir',
  },

  designerView: {
    formPreview: 'Pré-visualização do formulário',
  },

  recordView: {
    justDeleted: 'Este registro acabou de ser excluído',
    sessionExpired: 'A sessão de gravação expirou',
    errorLoadingRecord: 'Erro ao carregar registro: {{details}}',
    recordEditModalTitle: 'Registro: {{keyValues}}',
    recordNotFound: 'Registro não encontrado',
    lock: 'Bloquear',
    unlock: 'Desbloquear',
  },

  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Excluir esta função agregada personalizada?',
      sqlExpression: 'Expressão SQL',
    },
    editRecord: 'Editar registro',
  },

  dataExportView: {
    error: 'Erro ao exportar dados: {{details}}',
    optionNotCompatibleWithDataImport: 'Não compatível com importação de dados',
    options: {
      header: '$t(common.options)',
      fileFormatLabel: 'Formato de arquivo',
      fileFormat: {
        csv: 'CSV',
        xlsx: 'Excel',
      },
      includeCategoryItemsLabels: 'Incluir rótulos dos itens de categoria',
      includeCategories: 'Incluir categorias',
      expandCategoryItems: 'Expandir itens de categoria',
      exportSingleEntitiesIntoSeparateFiles: 'Exporte entidades únicas para arquivos separados',
      includeAncestorAttributes: 'Incluir atributos ancestrais',
      includeAnalysis: 'Incluir variáveis de resultado',
      includeDataFromAllCycles: 'Incluir dados de todos os ciclos',
      includeDateCreated: 'Incluir data de criação',
      includeFiles: 'Incluir arquivos',
      includeFileAttributeDefs: 'Incluir colunas de atributos de arquivo',
      includeInternalUuids: 'Incluir UUIDs internos',
      recordsModifiedAfter: 'Registros modificados após',
    },
    optionsInfo: {
      expandCategoryItems:
        'adiciona uma coluna booleana para cada item de categoria com valor VERDADEIRO se o item tiver sido selecionado, FALSO caso contrário',
      exportSingleEntitiesIntoSeparateFiles: `exporta entidades únicas em arquivos separados; quando não estiver marcada, os atributos pertencentes a uma única entidade serão incluídos entre os de sua entidade múltipla ancestral mais próxima`,
      includeAnalysis: 'inclui atributos de análise',
      includeAncestorAttributes: 'inclui atributos que pertencem às entidades ancestrais, até a entidade raiz',
      includeCategoryItemsLabels: 'adiciona uma coluna com um rótulo para cada item da categoria',
      includeCategories: `as categorias serão exportadas para uma subpasta chamada "categorias"`,
      includeDataFromAllCycles:
        'serão incluídos dados de todos os ciclos, caso contrário apenas o selecionado será considerado',
      includeDateCreated: 'inclui a data de criação de cada entidade (linha) em uma coluna chamada "data_criada"',
      includeFiles: `exporta os arquivos associados aos registros para uma subpasta chamada "arquivos"`,
      includeFileAttributeDefs: `adiciona colunas de atributos de arquivo: identificador interno do arquivo (file_uuid) e nome (file_name)`,
      includeInternalUuids: 'inclui os identificadores internos (UUIDs) em colunas que terminam com o sufixo "_uuid"',
      recordsModifiedAfter: 'exporta apenas dados de registros modificados após a data especificada',
    },
    startExport: 'Iniciar exportação',
  },

  dataImportView: {
    confirmDeleteAllRecords: 'Excluir todos os registros antes da importação?',
    confirmDeleteAllRecordsInCycle: 'Excluir todos os registros do ciclo {{cycle}} antes da importação?',
    conflictResolutionStrategy: {
      label: 'Estratégia de resolução de conflitos',
      info: 'O que fazer caso o mesmo registro (ou um registro com os mesmos atributos-chave) seja encontrado',
      skipExisting: 'Ignorar se já existir',
      overwriteIfUpdated: 'Sobrescrever se atualizado',
      merge: 'Mesclar registros',
    },
    deleteAllRecordsBeforeImport: 'Exclua todos os registros antes de importar',
    downloadAllTemplates: 'Baixe todos os modelos',
    downloadAllTemplates_csv: 'Baixe todos os modelos (CSV)',
    downloadAllTemplates_xlsx: 'Baixe todos os modelos (Excel)',
    downloadTemplate: 'Baixar modelo',
    downloadTemplate_csv: 'Baixar modelo (CSV)',
    downloadTemplate_xlsx: 'Baixar modelo (Excel)',
    errors: {
      rowNum: 'Linha #',
    },
    fileUploadChunkSize: {
      label: 'Tamanho do bloco de upload de arquivo',
    },
    forceImportFromAnotherSurvey: 'Forçar importação de outro inventário',

    importFromArena: 'Arena/Arena Mobile',
    importFromCollect: 'Collect / Collect Mobile',
    importFromCsvExcel: 'CSV/Excel',
    importFromCsvStepsInfo: `### Importando etapas
1. Selecione a entidade alvo
2. Baixe um modelo
3. Preencha o modelo e salve-o (se estiver em CSV, use UTF-8 como codificação)
4. Verifique as opções
5. Carregue o arquivo CSV/Excel
6. Valide o arquivo
7. Inicie a importação`,
    importIntoCycle: 'Importar para o ciclo',
    importIntoMultipleEntityOrAttribute: 'Importar para múltiplas entidades ou atributos',
    importType: {
      label: 'Tipo de importação',
      insertNewRecords: 'Inserir novos registros',
      updateExistingRecords: 'Atualizar registros existentes',
    },
    jobs: {
      ArenaDataImportJob: {
        importCompleteSuccessfully: `Importação de dados do Arena Mobile concluída:
{{summary}}`,
        importSummaryItem: {
          processed: 'registros processados',
          insertedRecords: 'registros criados',
          updatedRecords: 'registros atualizados',
          skippedRecords: 'registros ignorados',
          missingFiles: 'arquivos faltando',
        },
      },
      CollectDataImportJob: {
        importCompleteSuccessfully: `Coleta de importação de dados concluída:
        - {{insertedRecords}} registros criados`,
      },
      DataImportJob: {
        importCompleteSummary: `- {{processed}} linhas processadas
        - {{insertedRecords}} registros criados
        - Registros {{updatedRecords}} atualizados
        - {{entitiesCreated}} entidades criadas
        - {{entitiesDeleted}} entidades excluídas
        - Valores {{updatedValues}} atualizados`,
        importCompleteSuccessfully: `## Importação concluída:
$t(dataImportView.jobs.DataImportJob.importCompleteSummary)`,
        importWithFilesCompleteSuccessfully: `$t(dataImportView.jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} arquivos inseridos
        - {{updatedFiles}} arquivos atualizados
        - {{deletedFiles}} arquivos excluídos`,
        importCompleteWithErrors: `## Importação concluída (com erros):
        - {{processed}} linhas processadas`,
      },
      DataImportValidationJob: {
        validationCompleteWithErrors: `## Validação concluída ({{errorsFoundMessage}})
        - {{processed}} linhas processadas`,
        validationWithFilesCompleteWithErrors: `$t(dataImportView.jobs.DataImportValidationJob.validationCompleteWithErrors)`,
        validationCompleteSuccessfully: `## Validação concluída sem erros
        - {{processed}} linhas processadas
        - registros {{insertedRecords}} seriam criados
        - Os registros {{updatedRecords}} seriam atualizados
        - Entidades {{entitiesCreated}} seriam criadas
        - Entidades {{entitiesDeleted}} seriam excluídas
        - Os valores {{updatedValues}} seriam atualizados`,
        validationWithFilesCompleteSuccessfully: `$t(dataImportView.jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} arquivos seriam inseridos
        - {{updatedFiles}} arquivos seriam atualizados
        - {{deletedFiles}} arquivos seriam excluídos`,
      },
    },
    options: {
      header: '$t(common.options)',
      abortOnErrors: 'Abortar em caso de erros',
      preventAddingNewEntityData: 'Impedir a adição de novos dados de entidade',
      preventUpdatingRecordsInAnalysis: 'Impedir a atualização de registros na etapa Análise',
      includeFiles: 'Incluir arquivos',
      deleteExistingEntities: `excluir os dados da entidade selecionada em todos os registros`,
    },
    optionsInfo: {
      deleteExistingEntities: `AVISO: todas as entidades "{{nodeDefName}}" 
e todos os seus descendentes em todos os registros  
serão excluídos antes de inserir os novos.`,
    },
    startImport: 'Iniciar importação',
    startImportConfirm: `Ao pressionar 'Ok' você iniciará o processo de importação.  
**Não será possível reverter as alterações.**  
Tem certeza de que deseja continuar?`,
    startImportConfirmWithDeleteExistingEntities: `$t(dataImportView.startImportConfirm)  
**(opção $t(dataImportView.options.deleteExistingEntities) selecionada: entidades existentes serão excluídas antes da criação das novas)**
`,
    steps: {
      selectImportType: 'Selecione o tipo de importação',
      selectCycle: 'Selecione Ciclo',
      selectEntity: 'Selecione Entidade',
      selectFile: 'Selecione o arquivo',
      startImport: 'Iniciar importação',
    },
    validateFile: 'Validar arquivo',
    validateFileInfo:
      'O processo de validação verifica se o arquivo contém dados válidos de acordo com o tipo de dados de cada atributo.',
  },

  dataView: {
    charts: {
      downloadToPng: 'Baixar gráfico para PNG',
      warning: {
        selectOneDimensionAndOneMeasure: 'Selecione uma dimensão e uma medida para mostrar o gráfico',
        selectAtLeast2NumericAttributes: 'Selecione 2 atributos numéricos para mostrar o gráfico',
        tooManyItemsToShowChart: `Muitos itens para mostrar o gráfico;
esperando o máximo de itens {{maxItems}}.
Refine sua consulta (por exemplo, adicionando um filtro) para reduzir o número de itens.`,
      },
      type: {
        area: 'Gráfico de área',
        bar: 'Gráfico de barras',
        line: 'Gráfico de linhas',
        pie: 'Gráfico de pizza',
        scatter: 'Gráfico de dispersão',
      },
    },
    dataQuery: {
      deleteConfirmMessage: 'Excluir a consulta "{{name}}"?',
      displayType: {
        chart: 'Gráfico',
        table: 'Tabela',
      },
      manageQueries: 'Gerenciar consultas',
      mode: {
        label: 'Modo:',
        aggregate: 'Agregado',
        raw: 'Bruto',
        rawEdit: 'Edição bruta',
      },
      replaceQueryConfirmMessage: 'Substituir a consulta atual pela selecionada?',
      showCodes: 'Mostrar códigos',
    },
    editSelectedRecord: 'Editar registro selecionado',
    filterAttributeTypes: 'Filtrar tipos de atributo',
    filterRecords: {
      buttonTitle: 'Filtrar',
      expressionEditorHeader: 'Expressão para filtrar registros',
    },
    invalidRecord: 'Registro inválido',
    nodeDefsSelector: {
      hide: 'Ocultar seletor de definições de nó',
      show: 'Mostrar seletor de definições de nó',
      nodeDefFrequency: `{{nodeDefLabel}} (frequência)`,
    },
    records: {
      clone: 'Clonar',
      confirmDeleteRecord: `Excluir o registro "{{keyValues}}"?`,
      confirmDeleteSelectedRecord_one: `Excluir o registro selecionado?`,
      confirmDeleteSelectedRecord_other: `Excluir os {{count}} registros selecionados?`,
      confirmMergeSelectedRecords: `### Mesclar os registros selecionados em um?

- o registro "origem" será mesclado no registro "destino":
  - origem: [{{sourceRecordKeys}}], modificado em {{sourceRecordModifiedDate}};
  - destino: [{{targetRecordKeys}}], modificado em {{targetRecordModifiedDate}};

- uma pré-visualização do resultado será exibida antes da mesclagem;

- quando a mesclagem for confirmada, **o registro de origem SERÁ EXCLUÍDO**`,
      confirmUpdateRecordsStep: `Mover os {{count}} registro(s) selecionado(s) de {{stepFrom}} para {{stepTo}}?`,
      confirmUpdateRecordOwner: `Alterar o proprietário do registro selecionado para {{ownerName}}?`,
      confirmValidateAllRecords: `Revalidar todos os registros?\n\nIsso pode levar vários minutos.`,
      deleteRecord: 'Excluir registro',
      demoteAllRecordsFromAnalysis: 'Análise -> Limpeza',
      demoteAllRecordsFromCleansing: 'Limpeza -> Entrada',
      editRecord: 'Editar registro',
      exportList: 'Exportar lista',
      exportData: 'Exportar dados',
      exportDataSummary: 'Exportar resumo dos dados',
      filterPlaceholder: 'Filtrar por chaves ou proprietário',
      merge: {
        label: 'Mesclar',
        confirmLabel: 'Confirmar mesclagem',
        confirmTooManyDifferencesMessage: `**Diferenças demais**.  
Parece que os registros são muito diferentes entre si.  
Muitos atributos (~{{nodesUpdated}}) serão atualizados durante a mesclagem.  
Continuar com a pré-visualização da mesclagem?`,
        noChangesWillBeApplied: `Nenhuma alteração seria aplicada ao registro de destino.  
A mesclagem não pode ser realizada.`,
        performedSuccessfullyMessage: 'Mesclagem de registros realizada com sucesso!',
        previewTitle: 'Pré-visualização da mesclagem (registro {{keyValues}})',
      },
      noRecordsAdded: 'Nenhum registro adicionado',
      noRecordsAddedForThisSearch: 'Nenhum registro encontrado',
      noSelectedRecordsInStep: 'Nenhum registro selecionado na etapa {{step}}',
      owner: 'Proprietário',
      promoteAllRecordsToAnalysis: 'Limpeza -> Análise',
      promoteAllRecordsToCleansing: 'Entrada -> Limpeza',
      step: 'Etapa',
      updateRecordsStep: 'Atualizar etapa dos registros',
      validateAll: 'Validar tudo',
      viewRecord: 'Visualizar registro',
    },
    recordsClone: {
      title: 'Clonagem de registros',
      fromCycle: 'Do ciclo',
      toCycle: 'Para o ciclo',
      confirmClone: `Clonar registros do ciclo {{cycleFrom}} para o ciclo {{cycleTo}}?\n
(Somente registros ainda não existentes no ciclo {{cycleTo}} serão clonados)`,
      startCloning: 'Iniciar clonagem',
      cloneComplete: 'Clonagem concluída. {{recordsCloned}} registros clonados de {{cycleFrom}} para {{cycleTo}}',
      error: {
        cycleToMissing: 'Selecione "Para o ciclo"',
        cycleToMustBeDifferentFromCycleFrom: '"Para o ciclo" deve ser diferente de "Do ciclo"',
      },
      source: {
        label: 'Origem',
        allRecords: 'Todos os registros do ciclo {{cycleFrom}} que ainda não estão no ciclo {{cycleTo}}',
        selectedRecords: 'Somente os {{selectedRecordsCount}} registros selecionados',
      },
    },
    recordDeleted_one: `Registro excluído com sucesso!`,
    recordDeleted_other: `{{count}} registros excluídos com sucesso!`,
    recordsSource: {
      label: 'Origem',
    },
    recordsUpdated: '{{count}} registros atualizados com sucesso!',
    rowNum: 'Linha #',
    selectedAttributes: 'Atributos selecionados:',
    selectedDimensions: 'Dimensões selecionadas',
    selectedMeasures: 'Medidas selecionadas',
    sortableItemsInfo: 'Arraste e solte para ordenar',
    showValidationReport: 'Mostrar relatório de validação',
    sort: 'Ordenar',
    dataExport: {
      source: {
        label: 'Origem',
        allRecords: 'Todos os registros',
        filteredRecords: 'Somente registros filtrados',
        selectedRecord: 'Somente registro selecionado',
        selectedRecord_other: 'Somente {{count}} registros selecionados',
      },
      title: 'Exportar dados',
    },
    dataVis: {
      errorLoadingData: 'Erro ao carregar dados',
      noData: 'Esta consulta não retornou dados',
      noSelection:
        'Faça sua seleção usando o painel esquerdo ou selecione uma consulta existente em "Gerenciar consultas"',
    },
    viewSelectedRecord: 'Visualizar registro selecionado',
  },

  mapView: {
    createRecord: 'Criar novo registro',
    editRecord: 'Editar registro',
    elevation: 'Elevação (m)',
    location: 'Localização',
    locationEditInfo: 'Dê duplo clique no mapa ou arraste o marcador para atualizar a localização',
    locationNotValidOrOutOfRange: 'Localização inválida ou fora do alcance da zona UTM',
    locationUpdated: 'Localização atualizada',
    options: {
      showLocationMarkers: 'Mostrar marcadores de localização',
      showMarkersLabels: `Mostrar rótulos dos marcadores`,
      showSamplingPolygon: `Polígono amostral`,
      showControlPoints: `Pontos de controle`,
      showPlotReferencePoint: `Ponto de referência da parcela`,
    },
    rulerTooltip: `Pressione o botão para começar a medir distâncias.
  - clique várias vezes para medir percursos
  - dê duplo clique ou pressione ESC para finalizar a medição
  - pressione o botão novamente para ocultar as medições`,
    samplingPointDataLayerName: 'Dados de ponto amostral - nível {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (carregando...)',
    samplingPointItemPopup: {
      title: 'Item de ponto amostral',
      levelCode: 'Código do nível {{level}}',
    },
    selectedPeriod: 'Período selecionado',
  },

  samplingPolygonOptions: {
    circle: 'Círculo',
    controlPointOffsetEast: 'Deslocamento leste do ponto de referência (m)',
    controlPointOffsetNorth: 'Deslocamento norte do ponto de referência (m)',
    lengthLatitude: 'Comprimento latitude (m)',
    lengthLongitude: 'Comprimento longitude (m)',
    numberOfControlPoints: 'Número de pontos de controle',
    numberOfPointsEast: 'Número de pontos de controle leste',
    numberOfPointsNorth: 'Número de pontos de controle norte',
    offsetEast: 'Deslocamento leste (m)',
    offsetNorth: 'Deslocamento norte (m)',
    radius: 'Raio (m)',
    rectangle: 'Retângulo',
    samplingPolygon: 'Polígono amostral',
    shape: 'Forma',
  },

  kmlUploader: {
    opacity: 'opacidade',
    selectFile: 'Selecionar arquivo',
    title: 'Opções de KML/KMZ/Shapefile',
  },

  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Escolha um período para comparar',
    falseColor: 'Falsa cor',
  },

  surveysView: {
    chains: 'Cadeias',
    confirmUpdateSurveyOwner: `Alterar o proprietário do inventário "{{surveyName}}" para "{{ownerName}}"?`,
    cycles: 'Ciclos',
    datePublished: 'Data de publicação',
    editUserExtraProps: 'Editar propriedades extras do usuário',
    editUserExtraPropsForSurvey: 'Editar propriedades extras do usuário para o inventário "{{surveyName}}"',
    filter: 'Filtro',
    filterPlaceholder: 'Filtrar por nome, rótulo ou proprietário',
    languages: 'Idiomas',
    nodes: 'Nós',
    noSurveysMatchingFilter: 'Nenhum inventário corresponde ao filtro especificado',
    onlyOwn: 'Somente inventários próprios',
    records: 'Registros',
    recordsCreatedWithMoreApps: 'Registros criados com mais aplicativos:',
  },

  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Aceito',
      CREATED: 'Pendente',
    },
    acceptRequest: {
      accept: 'Aceitar',
      acceptRequestAndCreateSurvey: 'Aceitar solicitação e criar inventário',
      confirmAcceptRequestAndCreateSurvey:
        'Aceitar a solicitação de acesso de **{{email}}** como **{{role}}** e criar um novo inventário **{{surveyName}}**?',
      error: 'Erro ao aceitar a solicitação de acesso: {{error}}',
      requestAcceptedSuccessfully: 'Solicitação de acesso aceita com sucesso. $t(common.emailSentConfirmation)',
      surveyLabel: 'Rótulo do inventário',
      surveyLabelInitial: '(Altere nome e rótulo do inventário conforme necessário)',
      surveyName: 'Nome do inventário',
      template: 'Modelo',
    },
  },

  userView: {
    scale: 'Escala',
    rotate: 'Rotacionar',
    dragAndDrop: 'Solte uma imagem acima ou',
    upload: 'Enviar',
    remove: 'Remover foto de perfil?',
    sendNewInvitation: 'Enviar novo convite',
    removeFromSurvey: 'Remover do inventário',
    confirmRemove: 'Tem certeza de que deseja revogar o acesso de {{user}} ao inventário {{survey}}?',
    removeUserConfirmation: 'Usuário {{user}} foi removido do inventário {{survey}}',
    maxSurveysUserCanCreate: 'Máximo de inventários que o usuário pode criar',
    preferredUILanguage: {
      label: 'Idioma preferido da interface',
      auto: 'Detectado automaticamente ({{detectedLanguage}})',
    },
    newPassword: 'Senha',
    confirmPassword: 'Confirmar senha',
    manageTwoFactorDevices: {
      label: 'Gerenciar 2FA',
      title: 'Gerenciar dispositivos de autenticação em dois fatores',
    },
  },

  userPasswordChangeView: {
    changingPasswordForUser: 'Alterando senha do usuário: {{user}}',
    oldPassword: 'Senha antiga',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar nova senha',
    changePassword: 'Alterar senha',
    passwordChangedSuccessfully: 'Senha alterada com sucesso!',
    notAuthorizedToChangePasswordOfAnotherUser: 'Você não tem autorização para alterar a senha de outro usuário',
  },

  userInviteView: {
    confirmInviteSystemAdmin: 'Convidar o usuário {{email}} como Administrador do Sistema?',
    confirmInviteSystemAdmin_other: 'Convidar os usuários {{email}} como Administradores do Sistema?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)
    
    {{skppedEmailsCount}} endereços foram ignorados (já haviam sido convidados para este inventário anteriormente): {{skippedEmails}}`,
    groupPermissions: {
      label: 'Permissões',
      systemAdmin: `
        <li>Acesso completo ao sistema</li>`,
      surveyManager: `
        <li>Inventários: 
          <ul>
            <li>criar</li>
            <li>clonar</li>
            <li>editar inventários próprios</li>
            <li>excluir inventários próprios</li>
          </ul>
        </li>
        <li>Usuários:
          <ul>
            <li>convidar usuários para inventários próprios</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Inventários: 
          <ul>
            <li>clonar</li>
            <li>editar inventários próprios</li>
            <li>excluir inventários próprios</li>
          </ul>
        </li>
        <li>Usuários:
          <ul>
            <li>convidar usuários paro inventários próprios</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Inventários: 
          <ul>
            <li>editar inventários próprios</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Dados: 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>acessar ferramenta de mapa</li>
          </ul>
        </li>
        <li>Análise:
          <ul>
            <li>acesso completo a todas as ferramentas</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Dados: 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>acessar ferramentas de validação de dados</li>
        <li>enviar registros para a fase “Análise”</li>`,
      dataEditor: `
        <li>Dados: 
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>adicionar novos registros (inventários próprios)</li>
        <li>editar registros existentes (inventários próprios)</li>
        <li>enviar registros para a fase “Limpeza”</li>`,
    },
    messageOptional: 'Mensagem (opcional)',
    messageInfo: `A mensagem aparecerá no email enviado ao usuário. 
  Pode ser texto simples ou linguagem Markdown (https://www.markdownguide.org).`,
    sendInvitation: 'Enviar convite',
    surveyNotPublishedWarning: `**Aviso**: o inventário não está publicado.
      Usuários podem ser convidados apenas com os papéis ***$t(auth:authGroups.systemAdmin.label)*** e ***$t(auth:authGroups.surveyAdmin.label)***.
      Se você quiser convidar usuários com outros papéis, publique o inventário primeiro.`,
    typeEmail: 'Digite um endereço de email e pressione o botão Adicionar',
  },

  user: {
    mapApiKeys: {
      title: 'Chaves de API de mapa',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Esta chave de API é válida',
      keyIsNotCorrect: 'Esta chave de API NÃO é válida',
    },
    title: 'Título',
    titleValues: {
      mr: 'Mr',
      ms: 'Ms',
      preferNotToSay: 'Prefiro não informar',
    },
  },

  chainView: {
    baseUnit: {
      confirmDelete:
        'Ao excluir a unidade base, todas as seleções de "variável baseada em área" serão desmarcadas. Continuar?',
    },
    downloadSummaryJSON: 'Baixar resumo (JSON)',
    firstPhaseCategory: 'Categoria da 1ª fase',
    firstPhaseCommonAttribute: {
      label: 'Atributo comum',
      info: `Atributo em comum entre a unidade base e a tabela da 1ª fase 
    (deve ser um atributo de código com o mesmo nome de uma propriedade extra definida para a categoria da 1ª fase)`,
    },
    formLabel: 'Rótulo da cadeia de processamento',
    basic: 'Básico',
    records: 'Registros',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Enviar somente dados da etapa de análise para o RStudio',
    submitOnlySelectedRecordsIntoR: 'Enviar somente registros selecionados para o RStudio',
    includeEntitiesWithoutData: 'Incluir entidades sem dados',
    cannotStartRStudio: {
      common: 'Não foi possível iniciar o RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): não há registros para enviar',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): publique o inventário primeiro',
    },
    nonResponseBiasCorrection: 'Correção de viés de não resposta',
    nonResponseBiasCorrectionTip: `Para implementar este método, adicione 'design_psu' e 'design_ssu' na categoria de estrato como propriedades extras.`,
    pValue: 'Valor-p',
    resultsBackFromRStudio: 'Resultados lidos de volta do RStudio',
    samplingDesign: 'Desenho amostral',
    samplingDesignDetails: 'Detalhes do desenho amostral',
    samplingStrategyLabel: 'Estratégia amostral',
    samplingStrategy: {
      simpleRandom: 'Amostragem aleatória simples',
      systematic: 'Amostragem sistemática',
      stratifiedRandom: 'Amostragem aleatória estratificada',
      stratifiedSystematic: 'Amostragem sistemática estratificada',
      twoPhase: 'Amostragem em duas fases',
    },
    statisticalAnalysis: {
      header: 'Análise estatística',
      entityToReport: 'Entidade para relatar',
      entityWithoutData: 'A entidade {{name}} não possui dados',
      filter: 'Filtro (script R)',
      reportingMethod: 'Método de relatório',
      reportingMethods: {
        dimensionsCombined: 'Combinação de dimensões',
        dimensionsSeparate: 'Dimensões separadamente',
      },
      reportingArea: 'Área total de reporte (ha) (Opcional)',
    },
    stratumAttribute: 'Atributo de estrato',
    postStratificationAttribute: 'Atributo de pós-estratificação',
    areaWeightingMethod: 'Método de ponderação por área',
    clusteringEntity: 'Entidade de agrupamento',
    clusteringOnlyVariances: 'Agrupamento apenas para variâncias',
    errorNoLabel: 'A cadeia deve ter um rótulo válido',
    dateExecuted: 'Data de execução',
    deleteChain: 'Excluir cadeia',
    deleteConfirm: `Excluir esta cadeia de processamento?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Cadeia de processamento excluída',
    cannotSelectNodeDefNotBelongingToCycles: `A definição de nó "{{label}}" não pode ser selecionada porque não pertence a todos os ciclos da cadeia de processamento`,
    cannotSelectCycle: 'Este ciclo não pode ser selecionado porque algumas definições de nó não pertencem a este ciclo',
    copyRStudioCode: `#### Você está prestes a abrir um servidor RStudio ####  

##### Clique no botão OK e estes comandos serão copiados para a sua área de transferência. #####  

###### O servidor RStudio será aberto; quando o console do RStudio estiver ativo, cole e execute as linhas abaixo para importar o código da cadeia: ######  

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Cadeia de processamento para o RStudio ####  

###### Clique no botão OK e estes comandos serão copiados para a sua área de transferência. ######  

###### Inicie o RStudio na sua máquina (você deve ter o pacote 'rstudioapi' instalado). ######  

###### Quando o console do RStudio estiver ativo, cole e execute as linhas abaixo para importar o código da cadeia: ######  


{{rStudioCode}}

`,
    entities: {
      new: 'Entidade virtual',
    },
    reportingDataCategory: 'Nome da tabela de dados de reporte',
    reportingDataAttribute: 'Atributo para {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Tabela de dados de reporte e junções com atributos',
    showSamplingAttributes: 'Mostrar atributos amostrais',
  },

  instancesView: {
    title: 'Instâncias',
    terminate: 'Encerrar',
  },
  chain: {
    quantitative: 'Quantitativo',
    categorical: 'Categórico',
    emptyNodeDefs: '$t(validationErrors.analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'a entidade e todas as variáveis de resultado relacionadas serão excluídas dos scripts do RStudio',
    entityWithoutData: 'A entidade {{name}} não possui dados; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'A entidade {{name}} não está disponível no ciclo selecionado; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Token inválido ou expirado',
    },
  },

  itemsTable: {
    unused: 'Não usado',
    noItemsAdded: 'Nenhum item adicionado',
  },

  expression: {
    functionHasTooFewArguments: 'A função {{fnName}} requer pelo menos {{minArity}} argumentos (recebidos {{numArgs}})',
    functionHasTooManyArguments: 'A função {{fnName}} aceita no máximo {{maxArity}} argumentos (recebidos {{numArgs}})',
    identifierNotFound: 'Atributo ou entidade "{{name}}" não encontrado',
    invalid: 'Expressão inválida: {{details}}',
    invalidAttributeValuePropertyName:
      'Nome de propriedade de valor de atributo inválido: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Nome de propriedade extra inválido: {{propName}}',
    invalidCategotyName: 'Nome de categoria inválido: {{name}}',
    invalidTaxonomyName: 'Nome de taxonomia inválido: {{name}}',
    invalidTaxonVernacularNameLanguageCode:
      'Código de idioma do nome vernacular do táxon inválido: {{vernacularLangCode}}',
    missingFunctionParameters: 'Parâmetros de função ausentes',
    undefinedFunction: 'Função indefinida: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
    Sobre
========

$t(common.appNameFull)
--------
 
 * Desenvolvido por: $t(links.openforis)
 * Versão: {{version}}
 * Fórum de suporte: $t(links.supportForum)
 * Arena in GitHub: <a href="https://github.com/openforis/arena" target="_blank">https://github.com/openforis/arena</a>
 * Arena R Scripts in GitHub: <a href="https://github.com/openforis/arena-r" target="_blank">https://github.com/openforis/arena-r</a>
`,
    },
  },

  // ====== Survey views

  nodeDefEdit: {
    additionalFields: 'Campos adicionais',
    basic: 'Básico',
    advanced: 'Avançado',
    mobileApp: 'Aplicativo móvel',
    validations: 'Validações',
    function: 'Função',
    editingFunction: 'Editando função {{functionName}}',
    editorHelp: {
      json: 'Expressões válidas são um subconjunto de Javascript.',
      sql: 'Somente expressões SQL válidas são permitidas.',
    },
    editorCompletionHelp: '- Mostrar as variáveis e funções disponíveis que podem ser usadas',
    functionDescriptions: {
      categoryItemProp:
        'Retorna o valor da $t(extraProp.label) especificada de um item de categoria com o código informado',
      dateTimeDiff: 'Retorna a diferença (em minutos) entre 2 pares de data e hora',
      distance: 'Retorna a distância (em metros) entre as coordenadas especificadas',
      first: 'Retorna o primeiro valor ou nó do atributo múltiplo ou entidade especificada',
      geoCoordinateAtDistance:
        'Retorna as coordenadas a uma distância e direção especificadas a partir das coordenadas informadas',
      geoDistance: '$t(nodeDefEdit.functionDescriptions.distance)',
      geoPolygon: 'Gera um polígono em GeoJSON a partir de uma lista de coordenadas',
      includes: 'Retorna verdadeiro se o atributo múltiplo especificado inclui o valor informado.',
      index: 'Retorna o índice do nó especificado entre seus irmãos',
      isEmpty: 'Retorna verdadeiro se o argumento não tiver valor definido',
      isNotEmpty: 'Retorna verdadeiro se o argumento tiver algum valor definido',
      last: 'Retorna o último valor ou nó do atributo múltiplo ou entidade especificada',
      ln: 'Retorna o logaritmo natural de X',
      log10: 'Retorna o logaritmo de base 10 de X',
      max: 'Retorna o máximo dos argumentos',
      min: 'Retorna o mínimo dos argumentos',
      now: 'Retorna a data ou hora atual',
      parent: 'Retorna a entidade pai do nó especificado',
      pow: 'Retorna o valor de uma base elevada a uma potência',
      recordCycle: 'Retorna o ciclo do registro atual',
      recordDateCreated:
        'Retorna a data e hora de criação do registro atual como valor datetime. Pode ser usada em atributo de texto, data ou hora',
      recordDateLastModified:
        'Retorna a data e hora da última modificação do registro atual como valor datetime. Pode ser usada em atributo de texto, data ou hora',
      recordOwnerEmail: 'Retorna o email do usuário proprietário do registro',
      recordOwnerName: 'Retorna o nome do usuário proprietário do registro',
      recordOwnerRole: 'Retorna o papel (no inventário atual) do usuário proprietário do registro',
      rowIndex: 'Retorna o índice atual da linha da tabela (ou formulário)',
      taxonProp: 'Retorna o valor da $t(extraProp.label) especificada de um táxon com o código informado',
      taxonVernacularName:
        'Retorna o (primeiro) nome vernacular (ou local) no idioma especificado de um táxon com o código informado',
      userEmail: 'Retorna o email do usuário autenticado',
      userIsRecordOwner:
        'Retorna um valor booleano "true" se o usuário que edita o registro também for seu proprietário, "false" caso contrário',
      userName: 'Retorna o nome do usuário autenticado',
      userProp: 'Retorna o valor da $t(extraProp.label) especificada do usuário autenticado',
      uuid: 'Gera um UUID (identificador universalmente único) que pode ser usado como identificador (ex.: como atributo-chave de uma entidade)',
      // SQL functions
      avg: 'Retorna o valor médio de uma variável numérica',
      count: 'Retorna o número de linhas que atendem a um critério especificado',
      sum: 'Retorna a soma total de uma variável numérica',
    },
    functionName: {
      rowIndex: 'Índice da linha',
    },
    basicProps: {
      analysis: 'Análise',
      autoIncrementalKey: {
        label: 'Auto incremental',
        info: 'O valor será gerado automaticamente',
      },
      displayAs: 'Exibir como',
      displayIn: 'Exibir em',
      entitySource: 'Origem da entidade',
      enumerate: {
        label: 'Enumerar',
        info: `As linhas serão geradas automaticamente usando os itens de categoria associados a um atributo de código marcado como Chave definido dentro da entidade; as linhas não podem ser adicionadas nem excluídas e o atributo de código-chave não será editável`,
      },
      enumerator: {
        label: 'Enumerador',
        info: 'Os itens da categoria serão usados para gerar as linhas da entidade pai',
      },
      form: 'Formulário',
      formula: 'Fórmula',
      includedInClonedData: 'Incluído nos dados clonados',
      includedInRecordsList: {
        label: 'Incluir na lista de registros',
        info: `Se marcado, o atributo ficará visível na lista de registros`,
      },
      key: 'Chave',
      multiple: 'Múltiplo',
      ownPage: 'Página própria',
      parentPage: 'Página pai ({{parentPage}})',
      table: 'Tabela',
    },
    advancedProps: {
      areaBasedEstimate: 'Estimativa baseada em área',
      defaultValues: 'Valores padrão',
      defaultValueEvaluatedOneTime: 'Valor padrão avaliado apenas uma vez',
      defaultValuesNotEditableForAutoIncrementalKey:
        'Valores padrão não editáveis porque a chave auto incremental está definida',
      hidden: 'Ocultar no formulário de entrada',
      hiddenWhenNotRelevant: 'Oculto quando não relevante',
      itemsFilter: 'Filtro de itens',
      itemsFilterInfo: `Expressão usada para filtrar itens selecionáveis.
    Na expressão, a palavra "this" se referirá ao próprio item. 
    Ex.: this.region = region_attribute_name 
    (onde "region" é o nome de uma propriedade extra definida para o item e region_attribute_name é o nome de um atributo no inventário)`,
      readOnly: 'Somente leitura',
      relevantIf: 'Relevante se',
      script: 'Script',
    },
    mobileAppProps: {
      hiddenInMobile: {
        label: 'Oculto no Arena Mobile',
        info: `Se marcado, o atributo não ficará visível no AM`,
      },
      includedInMultipleEntitySummary: {
        label: 'Incluir no resumo da entidade múltipla',
        info: `Se marcado, o atributo ficará visível na tela de resumo da entidade (no Arena Mobile)`,
      },
      includedInPreviousCycleLink: {
        label: 'Incluir no link para ciclo anterior',
        info: `Se marcado, o valor do ciclo anterior será exibido no formulário de entrada de dados (quando o link para o ciclo anterior estiver ativo no app móvel)`,
      },
    },
    decimalProps: {
      maxNumberDecimalDigits: 'Número máximo de casas decimais',
    },
    fileProps: {
      fileNameExpression: 'Expressão do nome do arquivo',
      fileType: 'Tipo de arquivo',
      fileTypes: {
        image: 'Imagem',
        video: 'Vídeo',
        audio: 'Áudio',
        other: 'Outro',
      },
      maxFileSize: 'Tamanho máx. do arquivo (Mb)',
      numberOfFiles: 'Vá para Validações para alterar o número mín. e máx. de arquivos.',
      showGeotagInformation: 'Mostrar informações de geotag',
    },
    mobileProps: {
      title: 'Aplicativo móvel',
    },
    formHeaderProps: {
      headerColorLabel: 'Cor do cabeçalho',
      headerColor: {
        blue: 'Azul',
        green: 'Verde',
        orange: 'Laranja',
        red: 'Vermelho',
        yellow: 'Amarelo',
      },
    },
    textProps: {
      displayAsTypes: {
        hyperlink: 'Hiperlink',
        markdown: 'Markdown',
        text: 'Text',
      },
      textInputType: 'Tipo de entrada de texto',
      textInputTypes: {
        singleLine: 'Uma linha',
        multiLine: 'Múltiplas linhas',
      },
      textTransform: 'Transformação de texto',
      textTransformTypes: {
        none: 'none',
        capitalize: 'capitalize',
        uppercase: 'uppercase',
        lowercase: 'lowercase',
      },
    },
    booleanProps: {
      labelValue: 'Valor do rótulo',
      labelValues: {
        trueFalse: '$t(common.true)/$t(common.false)',
        yesNo: '$t(common.yes)/$t(common.no)',
      },
    },
    codeProps: {
      category: 'Categoria',
      codeShown: 'Mostrar código',
      displayAsTypes: {
        checkbox: 'Caixa de seleção',
        dropdown: 'Lista suspensa',
      },
      parentCode: 'Código pai',
    },
    coordinateProps: {
      allowOnlyDeviceCoordinate: 'Permitir apenas coordenada do dispositivo',
      allowOnlyDeviceCoordinateInfo: `Aplica-se apenas ao Arena Mobile: se marcado, o usuário não poderá modificar os valores X/Y, e somente o GPS do dispositivo poderá ser usado para obtê-los`,
    },
    expressionsProp: {
      expression: 'Expressão',
      applyIf: 'Aplicar se',
      confirmDelete: 'Excluir esta expressão?',
      severity: 'Severidade',
    },
    validationsProps: {
      minCount: 'Contagem mínima',
      maxCount: 'Contagem máxima',
      expressions: 'Expressões',
    },
    cannotChangeIntoMultipleWithDefaultValues:
      'Este nó não pode ser convertido para múltiplo porque possui valores padrão.',
    cannotDeleteNodeDefReferenced: `Não é possível excluir "{{nodeDef}}": ele é referenciado por estas definições de nó: {{nodeDefDependents}}`,
    cloneDialog: {
      confirmButtonLabel: 'Clonar',
      title: 'Clonando definição de nó "{{nodeDefName}}"',
      entitySelectLabel: 'Entidade para clonar:',
    },
    conversion: {
      dialogTitle: 'Converter {{nodeDefName}} para outro tipo',
      fromType: 'Do tipo',
      toType: 'Para o tipo',
    },
    moveDialog: {
      confirmButtonLabel: 'Mover',
      title: 'Movendo definição de nó "{{nodeDefName}}" de "{{parentNodeDefName}}"',
      entitySelectLabel: 'Entidade para mover:',
    },
    movedNodeDefinitionHasErrors: 'A definição de nó "{{nodeDefName}}" que você moveu contém erros; corrija-os.',
    nodeDefintionsHaveErrors: 'Estas definições de nó contêm erros: {{nodeDefNames}}. Corrija-os.',
    filterVariable: 'Variável para filtrar itens',
    filterVariableForLevel: 'Variável para {{levelName}}',
    unique: {
      label: 'Único',
      info: `Quando um atributo é marcado como **Único**, seu valor deve ser único dentro da entidade múltipla mais próxima (um erro será mostrado caso contrário).  

---

Ex.: em uma estrutura como *cluster -> plot -> tree*, se você tiver um atributo *tree_species* marcado como **Único**, poderá ter apenas uma árvore por espécie dentro do mesmo *plot*.`,
    },
  },

  languagesEditor: {
    languages: 'Idioma(s)',
  },

  taxonomy: {
    header: 'Taxonomia',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Excluir a taxonomia {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    edit: {
      taxonomyListName: 'Nome da lista de taxonomia',
      taxaNotImported: 'Táxons não importados',
      family: 'Família',
      genus: 'Gênero',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      extraPropsNotDefined: 'Propriedades extras não definidas para esta taxonomia',
    },
    taxaCount: 'Contagem de táxons',
    vernacularNameLabel: 'Rótulo do nome vernacular',
  },

  categoryList: {
    batchImport: 'Importar categorias em lote (de ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} categorias importadas com sucesso!
  {{insertedCategories}} novas
  {{updatedCategories}} atualizadas`,
    itemsCount: 'Contagem de itens',
    types: {
      flat: 'Plano',
      hierarchical: 'Hierárquico',
      reportingData: 'Dados de reporte',
    },
  },

  categoryEdit: {
    header: 'Categoria',
    addLevel: 'Adicionar nível',
    categoryName: 'Nome da categoria',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    confirmDelete: 'Excluir a categoria {{categoryName}}?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'A categoria está **vazia** e será excluída. Continuar?',
    confirmDeleteLevel: `Excluir o nível de categoria '{{levelName}}' com todos os itens?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Excluir o item?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Excluir o item com todos os filhos?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Converter para dados de reporte',
      confirmMessage: `Converter esta categoria em uma categoria de dados de reporte?

    Os níveis serão renomeados para level_1, level_2... level_N e uma propriedade extra 'area' será adicionada aos itens.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Converter esta categoria de dados de reporte em uma categoria simples?`,
    },
    deleteItem: 'Excluir item',
    level: {
      title: 'Nível {{levelPosition}}',
      noItemsDefined: 'Nenhum item definido',
      selectItemFromPreviousLevel: 'Selecione um item do nível anterior',
    },

    importSummary: {
      columns: 'Coluna',
      columnTypeSummary: 'Nível {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Descrição ({{language}})',
      columnTypeLabel: 'Rótulo ({{language}})',
      columnType: {
        code: 'code',
        description: 'descrição',
        label: 'rótulo',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Tipo de dado',
      title: 'Resumo da importação de categoria',
    },
    reportingData: 'Dados de reporte',
    templateForImport: 'Modelo para importação',
    templateFor_specificDataImport_csv: 'Modelo para importação de dados (CSV)',
    templateFor_specificDataImport_xlsx: 'Modelo para importação de dados (Excel)',
    templateFor_genericDataImport_csv: 'Modelo para importação de dados (genérico, CSV)',
    templateFor_genericDataImport_xlsx: 'Modelo para importação de dados (genérico, Excel)',
    templateFor_samplingPointDataImport_csv: 'Modelo para importação de dados de ponto amostral (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Modelo para importação de dados de ponto amostral (Excel)',
  },

  extraProp: {
    label: 'Propriedade extra',
    label_plural: 'Propriedades extras',
    addExtraProp: 'Adicionar propriedade extra',
    dataTypes: {
      geometryPoint: 'Ponto geométrico',
      number: 'Número',
      text: 'Texto',
    },
    editor: {
      title: 'Editar $t(extraProp.label_plural)',
      confirmDelete: 'Excluir a propriedade extra "{{name}}"?',
      confirmSave: `Salvar as alterações nas definições de propriedades extras?

  **Avisos**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Nome alterado de {{nameOld}} para {{nameNew}}',
        dataTypeChanged: 'Tipo de dado alterado de {{dataTypeOld}} para {{dataTypeNew}}',
      },
    },
    name: 'Nome da propriedade {{position}}',
    value: 'Valor',
  },

  // ===== All validation errors
  validationErrors: {
    // Common
    invalidEmail: 'Email inválido',
    invalidField: '"{{field}}" é inválido',
    invalidNumber: 'Número inválido',
    invalidDate: 'Data inválida',
    minLengthNotRespected: 'Comprimento mínimo de {{minLength}} caracteres não respeitado',
    nameDuplicate: 'Nome duplicado',
    nameCannotBeKeyword: `O nome "{{value}}" não pode ser usado: é uma palavra reservada`,
    nameInvalid:
      'O nome "{{name}}" é inválido: deve ter no máximo 40 caracteres e conter apenas letras minúsculas, números e os símbolos "-" e "_", começando com uma letra',
    nameRequired: 'Nome é obrigatório',
    requiredField: '{{field}} é obrigatório',
    rowsDuplicate: 'linha: {{row}} linha duplicada: {{duplicateRow}}',

    analysis: {
      labelDefaultLangRequired: 'Rótulo no idioma padrão do inventário é obrigatório',
      analysisNodeDefsRequired: 'Pelo menos um atributo calculado é obrigatório',
    },

    categoryEdit: {
      childrenEmpty: '$t(common.childrenEmpty)',
      childrenInvalid: 'Pelo menos um filho inválido',
      codeCannotBeKeyword: `O código "{{value}}" não pode ser usado: é uma palavra reservada`,
      codeDuplicate: 'Código duplicado',
      codeRequired: 'Código obrigatório',
      itemExtraPropDataTypeRequired: 'Tipo de dado obrigatório para $t(extraProp.label) "{{key}}"',
      itemExtraPropNameInvalid: 'Nome inválido para $t(extraProp.label) "{{key}}"',
      itemExtraPropInvalidNumber: 'Número inválido para $t(extraProp.label) "{{key}}"',
      itemExtraPropInvalidGeometryPoint: 'Ponto geométrico inválido para $t(extraProp.label) "{{key}}"',
      itemsInvalid: 'Pelo menos um item inválido',
      itemsEmpty: 'Defina pelo menos um item',
      levelDuplicate: 'Nome de nível duplicado',
      levelsInvalid: 'Pelo menos um nível inválido',
      nameNotSpecified: 'Nome da categoria não especificado',
    },

    categoryImport: {
      cannotDeleteItemsOfPublishedCategory:
        'Não é possível excluir itens de categoria publicados. Itens ausentes no arquivo importado: {{deletedItemCodes}}',
      cannotDeleteLevelsOfPublishedCategory:
        'Não é possível excluir níveis de categoria publicada. Níveis ausentes no arquivo importado: {{deletedLevelNames}}',
      codeColumnMissing: 'Deve haver pelo menos uma coluna "code"',
      codeRequired: '{{columnName}}: um código é obrigatório',
      codeDuplicate: '{{columnName}}: código duplicado "{{code}}"',
      columnMissing: 'Coluna ausente: {{columnNameMissing}}',
      emptyHeaderFound: 'O arquivo contém um cabeçalho vazio',
      emptyFile: '$t(validationErrors.dataImport.emptyFile)',
      invalidImportFile:
        'O arquivo ZIP deve conter apenas arquivos .csv ou .xlsx (um para cada categoria), sem diretórios',
      invalidParentItemOrder: 'O item com códigos {{parentItemCodes}} deve vir antes de seus filhos',
      nameDuplicate: 'Já existe uma categoria com o mesmo nome: {{name}}',
      srsNotDefined: 'SRS com código {{srs}} não definido no inventário',
    },

    dataImport: {
      emptyFile: 'O arquivo que você está tentando importar está vazio',
      invalidHeaders: 'Colunas inválidas: {{invalidHeaders}}',
      invalidBoolean: 'Valor booleano inválido na coluna {{headers}}: {{value}}',
      invalidCode: `Código inválido para o atributo '{{attributeName}}': {{code}}`,
      invalidCoordinate: 'Coordenada inválida na coluna {{headers}}: {{value}}',
      invalidDate:
        'Data inválida na coluna {{headers}}: {{value}}. As datas devem estar no formato YYYY-MM-DD ou DD/MM/YYYY. Ex.: 2023-01-15 ou 15/01/2023',
      invalidNumber: 'Número inválido na coluna {{headers}}: {{value}}',
      invalidTaxonCode: 'Código inválido na coluna {{headers}}: {{value}}',
      invalidTime:
        'Hora inválida na coluna {{headers}}: {{value}}. A hora deve estar no formato HH:mm. Ex.: 09:45 ou 16:30',
      missingRequiredHeaders: 'Colunas obrigatórias ausentes: {{missingRequiredHeaders}}',
      errorUpdatingValues: 'Erro ao atualizar valores: {{details}}',
      multipleRecordsMatchingKeys: 'Vários registros encontrados com as chaves "{{keyValues}}"',
      recordAlreadyExisting: 'Registro com chaves "{{keyValues}}" já existente',
      recordInAnalysisStepCannotBeUpdated:
        'Registro com chaves "{{keyValues}}" está na etapa Análise e não pode ser atualizado',
      recordKeyMissingOrInvalid: 'Valor ausente ou inválido para o atributo-chave "{{keyName}}"',
      recordNotFound: 'Registro com chaves "{{keyValues}}" não encontrado',
    },

    expressions: {
      cannotGetChildOfAttribute: 'não foi possível obter o nó filho {{childName}} do atributo {{parentName}}',
      cannotUseCurrentNode: 'não é possível usar o nó atual {{name}} nesta expressão',
      circularDependencyError: 'não é possível referenciar o nó {{name}} porque ele referencia o nó atual',
      expressionInvalid: 'Expressão inválida: {{details}}',
      unableToFindNode: 'não foi possível encontrar o nó: {{name}}',
      unableToFindNodeChild: 'não foi possível encontrar o nó filho: {{name}}',
      unableToFindNodeParent: 'não foi possível encontrar o nó pai: {{name}}',
      unableToFindNodeSibling: 'não foi possível encontrar o nó irmão: {{name}}',
    },

    extraPropEdit: {
      nameInvalid: 'Nome inválido',
      nameRequired: 'Nome obrigatório',
      dataTypeRequired: 'Tipo de dado obrigatório',
      valueRequired: 'Valor obrigatório',
    },

    nodeDefEdit: {
      analysisParentEntityRequired: 'Entidade obrigatória',
      applyIfDuplicate: 'A condição "$t(nodeDefEdit.expressionsProp.applyIf)" está duplicada',
      applyIfInvalid: 'Condição "$t(nodeDefEdit.advancedProps.relevantIf)" inválida',
      columnWidthCannotBeGreaterThan: 'A largura da coluna não pode ser maior que {{max}}',
      columnWidthCannotBeLessThan: 'A largura da coluna não pode ser menor que {{min}}',
      countMaxMustBePositiveNumber: 'A contagem máxima deve ser um inteiro positivo',
      countMinMustBePositiveNumber: 'A contagem mínima deve ser um inteiro positivo',
      categoryRequired: 'Categoria obrigatória',
      childrenEmpty: '$t(common.childrenEmpty)',
      defaultValuesInvalid: '"Valores padrão" inválidos',
      defaultValuesNotSpecified: 'Valor padrão não especificado',
      entitySourceRequired: 'Origem da entidade obrigatória',
      expressionApplyIfOnlyLastOneCanBeEmpty:
        'Somente a última expressão pode ter a condição "$t(nodeDefEdit.expressionsProp.applyIf)" vazia',
      expressionDuplicate: 'Expressão duplicada',
      expressionRequired: 'Expressão obrigatória',
      formulaInvalid: 'Fórmula inválida',
      keysEmpty: 'Defina pelo menos um atributo-chave',

      keysExceedingMax: 'Excede o número máximo de atributos-chave',
      maxFileSizeInvalid: 'O tamanho máximo do arquivo deve ser maior que 0 e menor que {{max}}',
      nameInvalid:
        'Nome inválido (deve conter apenas letras minúsculas, números e sublinhados, começando com uma letra)',
      taxonomyRequired: 'Taxonomia obrigatória',
      validationsInvalid: '"Validações" inválidas',
      countMaxInvalid: '"Contagem máxima" inválida',
      countMinInvalid: '"Contagem mínima" inválida',
    },

    record: {
      keyDuplicate: 'Chave de registro duplicada',
      entityKeyDuplicate: 'Chave duplicada',
      entityKeyValueNotSpecified: 'Valor da chave para "{{keyDefName}}" não especificado',
      missingAncestorForEntity: 'Não foi possível encontrar "{{ancestorName}}" com estas chaves: {{keyValues}}',
      oneOrMoreInvalidValues: 'Um ou mais valores são inválidos',
      uniqueAttributeDuplicate: 'Valor duplicado',
      valueInvalid: 'Valor inválido',
      valueRequired: 'Valor obrigatório',
    },

    recordClone: {
      differentKeyAttributes: 'Os atributos-chave são diferentes no Ciclo {{cycleFrom}} e no Ciclo {{cycleTo}}',
    },

    surveyInfoEdit: {
      langRequired: 'Idioma obrigatório',
      srsRequired: 'Sistema de Referência Espacial obrigatório',
      cycleRequired: 'Ciclo obrigatório',
      cyclesRequired: 'Pelo menos um ciclo deve ser definido',
      cyclesExceedingMax: 'Um inventário pode ter no máximo 10 ciclos',
      cycleDateStartBeforeDateEnd: 'A data de início do ciclo deve ser anterior à data de término',
      cycleDateStartAfterPrevDateEnd: 'A data de início do ciclo deve ser posterior ao término do ciclo anterior',
      cycleDateStartInvalid: 'Data de início do ciclo inválida',
      cycleDateStartMandatory: 'A data de início do ciclo é obrigatória',
      cycleDateEndInvalid: 'Data de término do ciclo inválida',
      cycleDateEndMandatoryExceptForLastCycle:
        'A data de término do ciclo é obrigatória para todos os ciclos, exceto o último',
      fieldManualLinksInvalid: 'Link do manual de campo inválido',
    },

    surveyLabelsImport: {
      invalidHeaders: 'Colunas inválidas: {{invalidHeaders}}',
      cannotFindNodeDef: "Não foi possível encontrar definição de atributo ou entidade com nome '{{name}}'",
    },

    taxonomyEdit: {
      codeChangedAfterPublishing: `O código publicado foi alterado: '{{oldCode}}' => '{{newCode}}'`,
      codeDuplicate: 'Código duplicado {{value}}; $t(validationErrors.rowsDuplicate)',
      codeRequired: 'Código obrigatório',
      familyRequired: 'Família obrigatória',
      genusRequired: 'Gênero obrigatório',
      scientificNameDuplicate: 'Nome científico duplicado {{value}}; $t(validationErrors.rowsDuplicate)',
      scientificNameRequired: 'Nome científico obrigatório',
      taxaEmpty: 'Táxons vazios',
      vernacularNamesDuplicate: `Nome vernacular duplicado '{{name}}' para o idioma '{{lang}}'`,
    },

    taxonomyImportJob: {
      duplicateExtraPropsColumns: 'Colunas de informação extra duplicadas: {{duplicateColumns}}',
      invalidExtraPropColumn:
        'Nome de coluna de informação extra inválido "{{columnName}}": não pode ser palavra reservada',
      missingRequiredColumns: 'Coluna(s) obrigatória(s) ausente(s): {{columns}}',
    },

    user: {
      emailDuplicate: 'Usuário com o mesmo email já existe',
      emailRequired: 'Email obrigatório',
      emailInvalid: 'Email inválido',
      emailNotFound: 'Email não encontrado',
      groupRequired: 'Grupo obrigatório',
      nameRequired: 'Nome obrigatório',
      titleRequired: 'Título obrigatório',
      passwordRequired: 'Senha obrigatória',
      passwordInvalid: 'A senha não deve conter espaços em branco',
      passwordUnsafe:
        'A senha deve ter pelo menos 8 caracteres e conter letras minúsculas, letras maiúsculas e números',
      passwordsDoNotMatch: `As senhas não coincidem`,

      userNotFound: 'Usuário não encontrado. Verifique se email e senha estão corretos',
      passwordChangeRequired: 'Alteração de senha obrigatória',
      passwordResetNotAllowedWithPendingInvitation: `Redefinição de senha não permitida: o usuário foi convidado para um inventário, mas o convite ainda não foi aceito`,
      twoFactorTokenRequired: 'Código de verificação obrigatório',
    },

    userAccessRequest: {
      countryRequired: 'País obrigatório',
      emailRequired: '$t(validationErrors.user.emailRequired)',
      firstNameRequired: 'Nome obrigatório',
      institutionRequired: 'Instituição obrigatória',
      lastNameRequired: 'Sobrenome obrigatório',
      purposeRequired: 'Finalidade obrigatória',
      surveyNameRequired: 'Nome do inventário obrigatório',
      invalidRequest: 'Solicitação de acesso de usuário inválida',
      userAlreadyExisting: 'Usuário com email {{email}} já existe',
      requestAlreadySent: `Solicitação de acesso para o usuário com email {{email}} já enviada`,
      invalidReCaptcha: 'ReCaptcha inválido',
    },

    userAccessRequestAccept: {
      accessRequestAlreadyProcessed: 'Solicitação de acesso de usuário já processada',
      accessRequestNotFound: 'Solicitação de acesso de usuário não encontrada',
      emailRequired: '$t(validationErrors.user.emailRequired)',
      emailInvalid: '$t(validationErrors.user.emailInvalid)',
      roleRequired: 'Papel obrigatório',
      surveyNameRequired: 'Nome do inventário obrigatório',
    },

    userPasswordChange: {
      oldPasswordRequired: 'Senha antiga obrigatória',
      oldPasswordWrong: 'Senha antiga incorreta',
      newPasswordRequired: 'Nova senha obrigatória',
      confirmPasswordRequired: 'Confirmação de senha obrigatória',
      confirmedPasswordNotMatching: 'Nova senha e confirmação de senha não coincidem',
    },

    userInvite: {
      messageContainsLinks: 'A mensagem de convite não pode conter links',
      messageTooLong: 'A mensagem de convite é muito longa (máximo de {{maxLength}} caracteres)',
    },

    user2FADevice: {
      nameDuplicate: 'Já existe dispositivo com o mesmo nome',
      nameRequired: 'Nome do dispositivo obrigatório',
    },
  },

  record: {
    ancestorNotFound: 'Nó ancestral não encontrado no registro',
    keyDuplicate: 'Chave de registro duplicada',
    oneOrMoreInvalidValues: 'Um ou mais valores são inválidos',
    uniqueAttributeDuplicate: 'Valor duplicado',

    attribute: {
      customValidation: 'Valor inválido',
      uniqueDuplicate: 'Valor duplicado',
      valueInvalid: 'Valor inválido',
      valueRequired: 'Valor obrigatório',
    },
    entity: {
      keyDuplicate: 'Chave de entidade duplicada',
    },
    nodes: {
      count: {
        invalid: 'Nós {{nodeDefName}} devem ser exatamente {{count}}',
        maxExceeded: 'Nós {{nodeDefName}} devem ser menores ou iguais a {{maxCount}}',
        minNotReached: 'Nós {{nodeDefName}} devem ser maiores ou iguais a {{minCount}}',
      },
    },
  },

  // ====== Common components

  expressionEditor: {
    and: 'AND',
    or: 'OR',
    group: 'Grupo ()',
    var: 'Variável',
    const: 'Valor constante',
    call: 'Função',
    operator: 'Operador',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Atributo de coordenada de origem',
      distanceAttribute: 'Atributo de distância',
      bearingAttribute: 'Atributo de azimute',
    },
    coordinateAttributeWithPosition: 'Atributo de coordenada {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Atributo da primeira data',
      firstTimeAttribute: 'Atributo do primeiro horário',
      secondDateAttribute: 'Atributo da segunda data',
      secondTimeAttribute: 'Atributo do segundo horário',
    },
    error: {
      selectOneVariable: 'Selecione uma variável',
    },

    header: {
      editingExpressionForNodeDefinition: 'Editando expressão {{qualifier}} para "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Editando função "{{functionName}}" para "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'valor padrão',
      'default-values-apply-if': 'aplicar valor padrão se',
      'max-count': 'contagem máxima',
      'min-count': 'contagem mínima',
      'relevant-if': 'relevante se',
      validations: 'regra de validação',
      'validations-apply-if': 'aplicar regra de validação se',
    },

    selectAFunction: 'Selecione uma função',

    valueType: {
      constant: 'Constante',
      expression: 'Expressão',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/tools/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank">$t(urls.supportForum)</a>`,
  },
}
