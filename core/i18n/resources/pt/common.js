import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

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
    chain_other: 'Cadeias',
    childrenEmpty: 'Defina pelo menos um item filho',
    clear: 'Limpar',
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
    cycle_other: 'Ciclos',
    dateCreated: 'Data de criação',
    dateLastModified: 'Data da última alteração',
    delete: 'Excluir',
    deleted: 'Excluído!',
    descending: 'Decrescente',
    description: 'Descrição',
    description_other: 'Descrições',
    designerNotes: 'Notas do designer',
    designerNotesInfo: `As notas do designer ficarão visíveis apenas no designer de formulários do inventário e não ficarão visíveis no formulário de entrada de dados.`,
    details: 'Detalhes',
    dimension: 'Dimensão',
    dimension_other: 'Dimensões',
    done: 'Concluído',
    download: 'Baixar',
    draft: 'Rascunho',
    edit: 'Editar',
    elapsed: 'Decorrido',
    email: 'Email',
    email_other: 'Emails',
    emailSentConfirmation: `Um email para {{email}} foi enviado.

    Informe a pessoa para verificar também a pasta de Spam/Lixo eletrônico.`,
    emailSentToSelfConfirmation: `Você deve ter recebido um email em {{email}}.

  Verifique também a pasta de Spam/Lixo eletrônico.`,
    empty: 'Vazio',
    entity: 'Entidade',
    error: 'Erro',
    error_other: 'Erros',
    errorFound: '1 erro encontrado',
    errorFound_other: '{{count}} erros encontrados',
    errorMessage: 'Mensagem de erro',
    errorMessage_other: 'Mensagens de erro',
    expand: 'Expandir',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Exportar',
    exportAll: 'Exportar tudo',
    exportToCSV: 'Exportar para CSV',
    exportToExcel: 'Exportar para Excel',
    exportToExcelTooManyItems: 'Itens demais para exportar no Excel; use exportação CSV.',
    expression: 'Expressão',
    false: 'Falso',
    fetchError: 'Não foi possível carregar os dados: {{message}}',
    file: 'Arquivo',
    file_other: 'Arquivos',
    formContainsErrors: 'O formulário contém erros',
    formContainsErrorsCannotContinue: 'O formulário contém erros. Corrija-os antes de continuar.',
    formContainsErrorsCannotSave: 'O formulário contém erros. Corrija-os antes de salvar.',
    from: 'De',
    function: 'Função',
    goToHomePage: 'Ir para a página inicial',
    goToSurveys: 'Ir para inventários',
    group: 'Grupo',
    help: 'Ajuda',
    hide: 'Ocultar',
    hideValue: 'Ocultar o valor',
    id: 'id',
    import: 'Importar',
    importFromExcelOrCSVFile: 'Importar de arquivo Excel (.xlsx) ou CSV',
    info: 'Informações',
    invalid: 'INVÁLIDO',
    item: 'Item',
    item_other: 'Itens',
    itemAlreadyAdded: 'Item já adicionado',
    label: 'Rótulo',
    label_other: 'Rótulos',
    language: 'Idioma',
    language_other: 'Idiomas',
    leavePageConfirmMessage: `Existem alterações não salvas no formulário. 

Ao confirmar, todas as alterações serão perdidas.
Deseja prosseguir?`,
    local: 'Local',
    loading: 'Carregando...',
    lock: 'Bloquear',
    showValue: 'Mostrar o valor',
    unlock: 'Desbloquear',
    max: 'Máximo',
    med: 'Mediana',
    manage: 'Gerenciar',
    message_other: 'Mensagens',
    measure: 'Medida',
    measure_other: 'Medidas',
    measurePrevSteps: 'Medida das etapas anteriores',
    measurePrevSteps_other: 'Medidas das etapas anteriores',
    min: 'Mínimo',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    name: 'Nome',
    new: 'Novo',
    next: 'Próximo',
    no: 'Não',
    noItems: `$t(common.no) $t(common.item_other)`,
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
    publishRecordValuesUpdateConfirm: `#### Publicar {{survey}} irá atualizar dados já registrados ####

{{reasons}}

Esta operação pode alterar ou apagar permanentemente dados já inseridos.

Para publicar sem atualizar os dados existentes, marque "Pular atualização de dados" abaixo (não recomendado).`,
    publishRecordValuesUpdateConfirmHeader: 'Os dados de registros existentes serão atualizados',
    publishRecordValuesUpdateConfirmOk: 'Publicar e atualizar dados',
    publishRecordValuesUpdateConfirmInputLabel:
      'Digite o nome da pesquisa "{{strongConfirmRequiredText}}" para confirmar',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Os seguintes atributos serão modificados, e seus valores nos registros existentes serão recalculados automaticamente: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Os seguintes atributos usam uma propriedade extra de uma categoria ou taxonomia que foi alterada, o que fará com que seu valor seja recalculado nos registros existentes: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Pular atualização de dados',
    publishSkipDataUpdateConfirmOk: 'Pular atualização de dados e publicar',
    publishSkipDataUpdateImplications: 'Pular a atualização de dados significa que:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Os registros existentes podem não corresponder mais à nova definição da pesquisa',
    publishSkipDataUpdateImplicationStaleValues:
      'Os valores afetados não serão recalculados até serem reinseridos manualmente',
    publishSkipDataUpdateImplicationChains:
      'As cadeias de processamento que usam esses atributos podem produzir resultados desatualizados',
    raiseTicketInSupportForum: `Em caso de problemas, abra um chamado com a tag 'arena' no nosso <b>Fórum de Suporte</b>: $t(links.supportForum)`,
    record: 'Registro',
    record_other: 'Registros',
    remaining: 'Restante',
    remote: 'Remoto',
    required: 'Obrigatório',
    requiredField: 'campo obrigatório',
    reset: 'Redefinir',
    refresh: 'Atualizar',
    pressRefreshToReloadPage: 'Pressione Atualizar para recarregar a página.',
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
    sort: 'Ordenar',
    sortAsc: 'Ordenar ascendente',
    sortDesc: 'Ordenar descendente',
    sortNone: 'Remover ordem',
    srs: 'SRS',
    status: 'Status',
    sum: 'Soma',
    test: 'Teste',
    to: 'Para',
    totalItems: 'Total de itens',
    true: 'Verdadeiro',
    trySplittingFileIntoSmallerChunks: 'Tente dividir o arquivo em partes menores.',
    type: 'Tipo',
    undefinedName: 'Nome indefinido',
    unique: 'Único',
    upload: 'Enviar',
    uploadErrorConfirm: {
      message: `Erro durante o envio do arquivo: {{error}}.\n
    Tentar novamente?`,
    },
    uploadFileChangedError:
      'O arquivo selecionado parece ter sido modificado desde que foi selecionado. Selecione-o novamente.',
    uploadingFile: 'Enviando arquivo ({{progressPercent}}%)',
    value: 'Valor',
    view: 'Visualizar',
    warning: 'Aviso',
    warning_other: 'Avisos',
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
      goToPage: 'Ir para a página',
      itemsPerPage: 'Itens por página',
      lastPage: 'Última página',
      nextPage: 'Próxima página',
      page: 'Página',
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
    fileName: 'Nome do arquivo',
    fileSize: 'Tamanho do arquivo',
  },
  sidebar: {
    logout: 'Sair',
  },
  header: {
    theme: {
      label: 'Tema',
      light: 'Claro',
      dark: 'Escuro',
      system: 'Padrão do sistema',
    },
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
    landing: 'Boas-vindas',
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
    surveyCompare: 'Comparar / atualizar a partir de arquivo',
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
    userGroup: 'Grupo de usuários',
    userGroup_other: 'Grupos de usuários',
    userGroupNew: 'Novo grupo de usuários',
    usersList: 'Lista de usuários (todos)',
    user2FADevice: 'Dispositivo 2FA',
    user2FADevice_other: 'Dispositivos 2FA',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Análise',
    chain: 'Cadeia',
    chain_other: 'Cadeias',
    virtualEntity: 'Entidade virtual',
    entities: 'Entidades virtuais',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Instâncias',

    message: 'Mensagem',
    message_other: '$t(common.message_other)',

    systemAdmin: 'Administração do sistema',
    jobMonitor: 'Monitor de tarefas',
    systemLogs: 'Registos do sistema',

    help: 'Ajuda',
    about: 'Sobre',
    changelog: 'Registo de alterações',
    whatsNew: 'Novidades',
    disclaimer: 'Aviso legal',
    userManual: 'Manual do usuário',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Esta seção está disponível somente quando o inventário é publicado',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Tipos de dependência',
    dependencyTypes: {
      applicable: 'Aplicabilidade',
      defaultValues: 'Valor padrão',
      editable: 'Editável',
      fileName: 'Nome do arquivo',
      itemsFilter: 'Filtro de itens',
      maxCount: 'Contagem máxima',
      minCount: 'Contagem mínima',
      parentCode: 'Código do pai',
      validations: 'Validações',
      visible: 'Visível',
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
    keyAttributeEditing: {
      lock: 'Bloquear edição do atributo-chave',
      unlock: 'Permitir editar o atributo-chave',
    },
    qualifierAttributeEditing: {
      lock: 'Bloquear edição do atributo qualificador',
      unlock: 'Permitir editar o atributo qualificador',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Excluir esta função agregada personalizada?',
      sqlExpression: 'Expressão SQL',
    },
    editRecord: 'Editar registro',
  },
  mapView: {
    changeMarkerColor: 'Alterar cor do marcador',
    createRecord: 'Criar novo registro',
    editRecord: 'Editar registro',
    elevation: 'Elevação (m)',
    location: 'Localização',
    locationEditInfo: 'Dê duplo clique no mapa ou arraste o marcador para atualizar a localização',
    locationNotValidOrOutOfRange: 'Localização inválida ou fora do alcance da zona UTM',
    locationUpdated: 'Localização atualizada',
    samplingPointDataLayerName: 'Dados de ponto amostral - nível {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (carregando...)',
    samplingPointItemPopup: {
      title: 'Item de ponto amostral',
      levelCode: 'Código do nível {{level}}',
    },
    selectedPeriod: 'Período selecionado',
  },

  mapWorkspace: {
    scenes: {
      tab: 'Sentinel-2',
      title: 'Cenas do Sentinel-2',
      menuSearch: 'Pesquisar cenas recentes do Sentinel-2…',
      intro:
        'Sentinel-2 L2A, 10 m. Pesquisadas no navegador a partir de um índice STAC GeoParquet estático e desenhadas diretamente do GeoTIFF otimizado para a nuvem de cada cena. Sem servidor de blocos.',
      area: {
        label: 'Área',
        view: 'Vista do mapa',
        plot: 'Parcela selecionada',
        draw: 'Desenhar área',
        drawAgain: 'Desenhar novamente',
      },
      period: {
        label: 'Período',
        hint: 'até 6 meses atrás',
        months_one: '{{count}} mês',
        months_other: '{{count}} meses',
      },
      maxCloud: 'Nuvens máx.',
      minCoverage: 'Cobertura mín.',
      percent: '{{value}} %',
      chart: {
        title: 'Cenas limpas por mês',
        allMonths: 'Todos os meses',
        bar_one: '{{month}}: {{count}} cena',
        bar_other: '{{month}}: {{count}} cenas',
      },
      count_one: '{{count}} cena',
      count_other: '{{count}} cenas',
      countInMonth_one: '{{count}} cena em {{month}}',
      countInMonth_other: '{{count}} cenas em {{month}}',
      sort: {
        label: 'Ordenar',
        newest: 'Mais recentes',
        leastCloud: 'Menos nuvens',
        mostCoverage: 'Maior cobertura',
      },
      rowDetails: 'Bloco {{tile}} · {{cloud}} de nuvens · {{coverage}} de cobertura',
      unknownValue: '–',
      thumbnailAlt: 'Pré-visualização da cena de {{date}}',
      addAsLayer: 'Adicionar como camada',
      alreadyOnMap: 'Já está no mapa',
      useAsBaseMap: 'Usar como mapa base',
      loadingScene: 'Carregando a cena…',
      bands: {
        label: 'Bandas',
        trueColour: 'Cor verdadeira (rápido, um arquivo)',
        falseColourVegetation: 'Falsa cor, vegetação (B8, B4, B3)',
        swir: 'Infravermelho de ondas curtas (B12, B8A, B4)',
        note: 'As outras combinações de bandas leem três arquivos por cena, por isso carregam mais devagar.',
      },
      bandsShort: {
        trueColour: 'cor verdadeira',
        falseColourVegetation: 'falsa cor',
        swir: 'SWIR',
      },
      layerName: 'Sentinel-2 {{date}} · {{tile}} · {{bands}}',
      baseLayerName: '{{name}} (mapa base)',
      messages: {
        drawing: 'Clique em dois cantos opostos no mapa para desenhar a área.',
        noPlot: 'Abra o marcador de uma parcela no mapa para pesquisar ao redor.',
        noDrawnArea: 'Desenhe um retângulo no mapa para pesquisar dentro dele.',
        tooLarge: 'A área é grande demais: aproxime o mapa até que cubra no máximo {{max}} blocos do Sentinel-2.',
        outside: 'Os blocos do Sentinel-2 cobrem apenas as latitudes de 80° S a 84° N.',
        error: 'Não foi possível ler o índice de cenas.',
        retry: 'Tentar novamente',
        searching_one: 'Pesquisando em {{count}} bloco…',
        searching_other: 'Pesquisando em {{count}} blocos…',
        empty: 'Nenhuma cena corresponde. Permita mais nuvens ou um período mais longo.',
        layerError: 'Não foi possível exibir a cena.',
      },
    },
    wms: {
      menuItem: 'Adicionar um serviço WMS / WMTS…',
      title: 'Adicionar um serviço WMS / WMTS',
      serviceUrl: 'URL do serviço',
      serviceUrlPlaceholder: 'https://example.org/geoserver/wms',
      loadLayers: 'Carregar camadas',
      loading: 'Carregando…',
      urlHint: 'URL GetCapabilities de um WMS ou WMTS, ou um modelo de blocos XYZ com {z}/{x}/{y}',
      insecureUrlHint: 'Este serviço usa http: o navegador pode bloquear seus blocos nesta página https',
      layersCount: '{{count}} camadas',
      layersCount_one: '{{count}} camada',
      layersCount_other: '{{count}} camadas',
      webMercatorSupported: 'Web Mercator disponível',
      webMercatorMissing: 'Nenhuma camada em Web Mercator',
      truncated: 'apenas as primeiras {{max}} camadas são listadas',
      xyzSummary: 'Modelo de blocos XYZ · não precisa de capabilities',
      layersToAdd: 'Camadas a adicionar',
      layerNotWebMercator: 'Não disponível em Web Mercator',
      addAs: 'Adicionar como',
      addAsOverlay: 'Camada sobreposta',
      addAsOverlayDescription: 'Exibida sobre o mapa base, na aba Camadas',
      addAsBaseMap: 'Mapa base',
      addAsBaseMapDescription: 'Substitui o mapa base, no menu Mapa base',
      displayName: 'Nome exibido',
      displayNameMultiple: 'Cada camada mantém seu próprio título',
      imageFormat: 'Formato de imagem',
      formatPng: 'PNG (transparente)',
      formatJpeg: 'JPEG (mais leve)',
      opacity: 'Opacidade',
      attribution: 'Atribuição',
      whoSeesIt: 'Quem vê',
      scopeSurvey: 'Todos neste inventário',
      scopeUser: 'Somente eu',
      submitOverlays: 'Adicionar {{count}} camadas sobrepostas',
      submitOverlays_one: 'Adicionar {{count}} camada sobreposta',
      submitOverlays_other: 'Adicionar {{count}} camadas sobrepostas',
      submitBaseMaps: 'Adicionar {{count}} mapas base',
      submitBaseMaps_one: 'Adicionar {{count}} mapa base',
      submitBaseMaps_other: 'Adicionar {{count}} mapas base',
      removeSelectedBaseMap: 'Remover o mapa base personalizado selecionado',
      hiddenForSession:
        'Camada oculta até o mapa ser reaberto: somente quem pode editar o inventário pode remover camadas compartilhadas com todos',
      errors: {
        fetchLayersFailed: 'Não foi possível carregar as camadas de mapa personalizadas',
        loadFailed: 'Não foi possível carregar as camadas deste serviço',
        saveFailed: 'Não foi possível salvar as camadas',
        removeFailed: 'Não foi possível remover a camada',
      },
    },
    toolbarLabel: 'Ferramentas do mapa',
    menus: {
      baseMap: 'Mapa base',
      addData: 'Adicionar dados',
      display: 'Exibição',
      imagery: 'Imagens',
      tools: 'Ferramentas',
    },
    addData: {
      uploadFile: 'Carregar KML, KMZ ou Shapefile…',
    },
    display: {
      showLocationMarkers: 'Marcadores de localização',
      showMarkersLabels: 'Rótulos dos marcadores',
      showUtmGrid: 'Grade UTM',
      imageInterpretation: 'Interpretação de imagens',
      showSamplingPolygon: 'Polígono amostral',
      showControlPoints: 'Pontos de controle',
      showPlotReferencePoint: 'Ponto de referência da parcela',
    },
    tools: {
      measureDistance: 'Medir distância',
    },
    quick: {
      zoomToData: 'Ajustar aos dados',
      fullScreen: 'Tela cheia',
      exitFullScreen: 'Sair da tela cheia',
      noDataToZoom: 'Não há dados no mapa para ajustar o zoom',
    },
    search: {
      label: 'Pesquisar no mapa',
      placeholderFull: 'Chave do registro ou coordenadas',
      placeholderCompact: 'Coordenadas',
      goTo: 'Ir para {{coordinates}}',
      invalidCoordinates: 'Coordenadas fora do intervalo',
      noMatch: 'Nenhum registro ou coordenada corresponde',
      coordinatesHint: 'Digite coordenadas, p. ex. 41.9, 12.5',
    },
    rail: {
      label: 'Painéis do mapa',
      close: 'Recolher painel',
      tabs: {
        layers: 'Camadas',
        records: 'Registros',
        legend: 'Legenda',
      },
      titles: {
        records: 'Registros no mapa',
      },
      recordsEmpty: 'Mostre uma camada de dados do inventário para listar seus registros',
    },
    layers: {
      noSurveyData: 'Este inventário não tem dados para mostrar no mapa',
      groups: {
        custom: 'Personalizadas (WMS / WMTS)',
        scenes: 'Cenas Sentinel-2',
        uploaded: 'Arquivos carregados',
      },
      opacity: 'Opacidade de {{name}}',
      remove: 'Remover {{name}}',
    },
    legend: {
      marker: 'Localização do registro',
      cluster: 'Grupo de registros próximos',
      samplingPolygon: 'Polígono amostral',
      utmGrid: 'Grade UTM',
      addedLayers: 'Camadas adicionadas',
    },
    status: {
      changeNotation: 'Clique para mudar a notação',
      notations: {
        latLon: 'Lat, Lon',
        dms: 'GMS',
        utm: 'UTM',
      },
      zoom: 'Zoom',
      scale: 'Escala',
      recordsInView_one: '{{count}} registro visível',
      recordsInView_other: '{{count}} registros visíveis',
    },
    upload: {
      unsupported: 'Arquivo não suportado: escolha um arquivo KML, KMZ, Shapefile compactado (zip) ou GeoJSON',
      tooLarge: 'O arquivo é grande demais: máximo de {{maxSize}} MB',
      error: 'Não foi possível ler o arquivo: {{details}}',
    },
    measure: {
      measureArea: 'Medir área',
      barLabel: 'Medição',
      modes: {
        distance: 'Distância',
        area: 'Área',
      },
      hint: 'Clique para adicionar pontos e clique duas vezes para terminar',
      units: 'Unidades',
      unitOptions: {
        auto: 'Automática',
        m: 'Metros (m)',
        km: 'Quilômetros (km)',
        m2: 'Metros quadrados (m²)',
        ha: 'Hectares (ha)',
        km2: 'Quilômetros quadrados (km²)',
      },
      unitSymbols: {
        m: 'm',
        km: 'km',
        m2: 'm²',
        ha: 'ha',
        km2: 'km²',
      },
      perimeter: 'Perímetro {{value}}',
      done: 'Concluído',
    },
    screenshot: {
      quickButton: 'Captura de tela',
      title: 'Captura do mapa',
      capture: 'Capturar',
      captureView: 'Vista atual',
      capturePlot: 'Ajustar à parcela',
      include: 'Incluir',
      includeData: 'Marcadores e medições',
      includeScale: 'Barra de escala e seta norte',
      includeStamp: 'Parcela, data, coordenadas, mapa base',
      saveTo: 'Salvar em',
      targetRecord: 'Anexar a um registro de parcela',
      targetRecordHint: 'Salva em um atributo de imagem',
      targetFile: 'Apenas baixar',
      targetFileHint: 'Arquivo PNG neste computador',
      plot: 'Registro de parcela',
      attribute: 'Atributo de imagem',
      fileName: 'Nome do arquivo',
      mobileNote:
        'Apenas os atributos de imagem da parcela são listados. As equipes de campo veem esta imagem no Arena Mobile depois de baixar o registro no dispositivo.',
      noPlots:
        'Nenhuma parcela no mapa. Mostre uma camada de localização na aba Camadas para anexar a imagem a um registro de parcela.',
      noImageAttributes: 'Esta parcela não tem nenhum atributo de imagem editável.',
      previewLoading: 'Preparando a pré-visualização…',
      previewAlt: 'Pré-visualização da captura do mapa',
      alsoDownload: 'Baixar também',
      downloadPng: 'Baixar PNG',
      saving: 'Salvando…',
      replace: 'Substituir',
      keep: 'Manter a imagem atual',
      confirmReplace: 'Este atributo já contém a imagem "{{fileName}}". Substituí-la pela captura?',
      saved:
        'Captura salva em {{plot}} › {{attribute}}. As equipes de campo a recebem no próximo download de registros.',
      savedPending: 'Captura enviada para {{plot}}. O registro ainda está sendo atualizado: verifique-o em instantes.',
      notices: {
        mapHidden: 'O mapa está oculto nesta tela. Feche o painel lateral ou amplie a janela e tente novamente.',
        tilesMissing: 'Blocos do mapa omitidos (o servidor deles não permite ou não carregaram): {{count}}',
        equalEarth: 'O mapa base Equal Earth não pode ser capturado. Escolha outro mapa base no menu Mapa base.',
      },
      errors: {
        captureFailed: 'Não foi possível capturar o mapa: {{details}}',
        cannotEditRecord: 'Você não pode editar este registro (ou o inventário não está publicado).',
        fileTooLarge: 'A imagem tem {{size}} MB, acima dos {{limit}} MB permitidos para este atributo.',
        quotaExceeded: 'Não há espaço livre suficiente para arquivos neste inventário.',
        plotNotFound: 'A parcela não foi encontrada no registro. Ela pode ter sido excluída.',
        saveFailed: 'A captura não foi salva: {{details}}',
        fileNameRequired: 'Informe um nome de arquivo.',
        rowNotConfirmed:
          'A nova linha para a imagem não foi confirmada a tempo, então a captura não foi salva. Verifique o registro antes de tentar novamente.',
        notApplicable: 'Não é possível adicionar a imagem: o atributo não é aplicável nesta parcela.',
        clearsOtherValues:
          'A captura não foi salva: adicioná-la apagaria valores de outros campos do registro. Adicione-a pelo editor de registros.',
      },
    },
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
    status: {
      published: 'Publicado',
      draft: 'Rascunho',
      'published-draft': 'Publicado/Rascunho',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Aceito',
      CREATED: 'Pendente',
    },
    acceptedBy: 'Aceito por',
    dateAccepted: 'Data de aceitação',
    createdSurvey: 'Inventário criado',
    acceptRequest: {
      accept: 'Aceitar',
      acceptRequestAndCreateSurvey: 'Aceitar solicitação e criar inventário',
      confirmAcceptRequestAndCreateSurvey:
        'Aceitar a solicitação de acesso de **{{email}}** como **{{role}}** e criar um novo inventário **{{surveyName}}**?',
      error: 'Erro ao aceitar a solicitação de acesso: {{error}}',
      requestAcceptedSuccessfully: 'Solicitação de acesso aceita com sucesso. $t(common.emailSentConfirmation)',
      surveyLabelInitial: '(Altere nome e rótulo do inventário conforme necessário)',
      surveyName: 'Nome do inventário',
      newSurvey: 'Novo inventário',
      requestDetails: 'Detalhes do pedido',
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

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}} endereços foram ignorados (já haviam sido convidados para este inventário anteriormente): {{skippedEmails}}`,
    invalidEmailsWarning:
      'O endereço de email {{emails}} não pôde ser alcançado e pode não existir. Ele foi mantido na lista abaixo: corrija-o ou remova-o e tente convidar novamente.',
    invalidEmailsWarning_other:
      'Os endereços de email {{emails}} não puderam ser alcançados e podem não existir. Eles foram mantidos na lista abaixo: corrija-os ou remova-os e tente convidar novamente.',
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
            <li>convidar usuários para inventários próprios</li>
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
      surveyGuest: `
        <li>Dados: 
          <ul>
            <li>visualizar os registros (inventários próprios), sem editá-los</li>
          </ul>
        </li>`,
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
    mauFile: {
      upload: 'Enviar MAU.zip',
      download: 'Baixar MAU.zip',
      delete: 'Excluir MAU.zip',
      confirmCycleAssociation: 'O arquivo MAU.zip será associado ao ciclo atual ({{cycle}}). Deseja continuar?',
      confirmReplace: 'Já foi enviado um arquivo MAU.zip para esta cadeia. Deseja substituí-lo?',
      confirmDelete: 'Excluir o arquivo MAU.zip enviado para esta cadeia?',
      uploadComplete: 'Arquivo MAU.zip enviado com sucesso',
      deleteComplete: 'Arquivo MAU.zip excluído',
      invalidFileExtension: 'Selecione um arquivo .zip',
    },
    phase1Category: 'Categoria da 1ª fase',
    phase1CategoryInfo: 'Selecione a categoria que contém as amostras da 1ª fase.',
    phase2JoinEntity: {
      label: 'Entidade de junção (2ª fase)',
      info: 'Entidade usada para unir a unidade base à categoria da 1ª fase: a própria entidade da unidade base, ou uma das suas entidades superiores.',
    },
    phase2AsSamplingPointData: {
      label: 'Unir usando a ligação de Sampling Point Data',
      info: 'A(s) chave(s) da entidade da 2ª fase são lidas da tabela Sampling Point Data, que é a mesma tabela usada para a 1ª fase.',
    },
    phase1JoinAttribute: {
      label: 'Atributo de junção (1ª fase)',
      info: 'Selecione a coluna da tabela $t(chainView.phase1Category) (uma propriedade extra, ou "code") usada para a unir à entidade de junção da 2ª fase.',
    },
    phase2JoinAttribute: {
      label: 'Atributo de junção (2ª fase)',
      info: 'Selecione o atributo (da entidade da 2ª fase) para unir com a tabela da 1ª fase; o seu valor é comparado com o atributo de junção da 1ª fase anterior.',
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
    nonResponseBiasCorrectionInfo: `Para implementar o método de ajuste por classes de ponderação, adicione 'design_psu' e 'design_ssu' à tabela de categorias do estrato como propriedades numéricas extras.`,
    pValue: 'Valor-p',
    resultsBackFromRStudio: 'Resultados lidos de volta do RStudio',
    resultsBackFromRStudioInfo: `Ative esta opção se os atributos de resultado calculados no RStudio devem ser importados de volta para o servidor Arena.
Este processo pode ser lento.`,
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
      reportingAreaInfo: `Com amostragem estratificada, forneça as áreas dos estratos na tabela de categorias do atributo de estrato (nome da coluna 'area')`,
    },
    stratumAttribute: 'Atributo de estrato',
    stratumAttributeInfo: 'Selecione a variável usada para estratificar a amostra.',
    stratumAttribute2ndPhaseInfo: `Selecione a variável usada para subestratificar a amostra da 1ª fase antes de extrair a subamostra final e detalhada. Apenas são apresentados os atributos cujo nome também aparece como coluna da categoria da 1ª fase.`,
    postStratificationAttribute: 'Atributo de pós-estratificação',
    areaWeightingMethod: 'Método de ponderação por área',
    clusteringEntity: 'Entidade de agrupamento',
    clusteringEntityInfo: `A entidade que define as unidades amostrais primárias. Nota: usada exclusivamente para análise de conglomerados no âmbito do pacote R survey.`,
    clusteringOnlyVariances: 'Agrupamento apenas para variâncias',
    errorNoLabel: 'A cadeia deve ter um rótulo válido',
    dateExecuted: 'Data de execução',
    deleteChain: 'Excluir cadeia',
    deleteConfirm: `Excluir esta cadeia de processamento?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Cadeia de processamento excluída',
    cloneFromAnotherSurvey: 'Clonar de outro estudo',
    cloneFromAnotherSurveyDialog: {
      title: 'Clonar cadeia de outro estudo',
      sourceSurvey: 'Estudo de origem',
      sourceChain: 'Cadeia de origem',
      entityCheck: 'Compatibilidade de entidades',
      entityMissing: 'ausente no estudo destino',
      skipMissingEntities: 'Ignorar atributos de análise de entidades ausentes no estudo destino',
      noAnalysisAttributes: 'Esta cadeia não tem atributos de análise',
      cloneComplete: 'Cadeia clonada com sucesso',
      missingEntities: 'Não é possível clonar: as seguintes entidades não existem no estudo destino: {{entities}}',
    },
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
    addQuantitative: 'Adicionar atributo quantitativo',
    addCategorical: 'Adicionar atributo categórico',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
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
    selectedItemsCount: '{{count}} item selecionado',
    selectedItemsCount_other: '{{count}} itens selecionados',
  },
  expression: {
    areaOfInterestNotFound: 'Área de interesse "{{name}}" não encontrada: defina-a em Informações do inquérito → Mapa',
    functionHasTooFewArguments: 'A função {{fnName}} requer pelo menos {{minArity}} argumentos (recebidos {{numArgs}})',
    functionHasTooManyArguments: 'A função {{fnName}} aceita no máximo {{maxArity}} argumentos (recebidos {{numArgs}})',
    identifierNotFound: 'Atributo ou entidade "{{name}}" não encontrado',
    invalid: 'Expressão inválida: {{details}}',
    invalidAttributeValuePropertyName:
      'Nome de propriedade de valor de atributo inválido: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Nome de propriedade extra inválido: {{propName}}',
    invalidCategotyName: 'Nome de categoria inválido: {{name}}',
    invalidTaxonomyExtraProp: 'Nome de propriedade extra de taxonomia inválido: {{propName}}',
    invalidTaxonomyName: 'Nome de taxonomia inválido: {{name}}',
    invalidTaxonVernacularNameLanguageCode:
      'Código de idioma do nome vernacular do táxon inválido: {{vernacularLangCode}}',
    missingFunctionParameters: 'Parâmetros de função ausentes',
    notSupported:
      'Expressão não suportada: verifique sua sintaxe (por exemplo, um operador ausente entre dois valores)',
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
 * Website: $t(links.openforisArenaWebsite)
 * Tutoriais em vídeo do Arena na Academia de Aprendizagem Online da FAO: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Tutoriais em vídeo do Arena no YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Fórum de suporte: $t(links.supportForum)
 * Arena no GitHub: $t(links.arenaInGitHub)
 * Scripts R do Arena no GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Idioma(s)',
  },
  taxonomy: {
    header: 'Taxonomia',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomia'})`,
    confirmDelete: 'Excluir a taxonomia {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Clonar taxonomia de outro inquérito',
      sourceSurvey: 'Inquérito de origem',
      sourceTaxonomy: 'Taxonomia de origem',
      loadingSurveys: 'A carregar inquéritos...',
      noSurveysAvailable: 'Nenhum inquérito disponível',
      selectSurveyFirst: 'Selecione primeiro um inquérito',
      loadingTaxonomies: 'A carregar taxonomias...',
      noTaxonomiesAvailable: 'Nenhuma taxonomia disponível no inquérito selecionado',
    },
    edit: {
      taxonomyListName: 'Nome da lista de taxonomia',
      taxaNotImported: 'Táxons não importados',
      family: 'Família',
      genus: 'Gênero',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Sinônimo / Latim',
      extraPropsNotDefined: 'Propriedades extras não definidas para esta taxonomia',
      importMissingPublishedTaxa:
        '{{count}} táxon/taxa publicado(s) não encontrado(s) no arquivo importado: mantido(s) sem alterações, depois dos importados. Códigos: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} mais)',
    },
    taxaCount: 'Contagem de táxons',
    vernacularNameLabel: 'Rótulo do nome vernacular',
  },
  categoryList: {
    batchImport: 'Importar categorias em lote (de ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} categorias importadas com sucesso!
  {{insertedCategories}} novas
  {{updatedCategories}} atualizadas`,
    cloneFromAnotherSurvey: {
      title: 'Clonar categoria de outro inquérito',
      sourceSurvey: 'Inquérito de origem',
      sourceCategory: 'Categoria de origem',
      loadingSurveys: 'A carregar inquéritos...',
      noSurveysAvailable: 'Nenhum inquérito disponível',
      selectSurveyFirst: 'Selecione primeiro um inquérito',
      loadingCategories: 'A carregar categorias...',
      noCategoriesAvailable: 'Nenhuma categoria disponível no inquérito selecionado',
    },
    itemsCount: 'Contagem de itens',
    structure: 'Estrutura',
    types: {
      flat: 'Plano',
      hierarchical: 'Hierárquico',
      reportingData: 'Dados de reporte',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Dados de Ponto Amostral',
    },
  },
  categoryEdit: {
    header: 'Categoria',
    addLevel: 'Adicionar nível',
    categoryName: 'Nome da categoria',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'categoria'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'nível de categoria'})`,
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
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Converter para Dados de Ponto Amostral',
      confirmMessage: `Converter esta categoria na categoria de Dados de Ponto Amostral?

A categoria será renomeada para '${samplingPointDataCategoryName}' e uma propriedade extra '${locationItemExtraDefName}' será adicionada aos itens.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Converter para categoria GeoPackage',
      confirmMessage: `Converter esta categoria em uma categoria GeoPackage?

Uma propriedade extra '${locationItemExtraDefName}' será adicionada aos itens.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Converter para categoria simples',
      confirmMessage: `Converter esta categoria GeoPackage em uma categoria simples?

A propriedade extra '${locationItemExtraDefName}' será desbloqueada, podendo ser renomeada, ter seu tipo alterado ou ser excluída como qualquer outra propriedade extra. Os dados não serão afetados.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Converter para categoria simples',
      confirmMessage: `Converter esta categoria de Dados de Ponto Amostral em uma categoria simples?

O nome da categoria será apagado (você precisará dar um novo nome a ela), e a propriedade extra '${locationItemExtraDefName}' será desbloqueada, podendo ser renomeada, ter seu tipo alterado ou ser excluída como qualquer outra propriedade extra. Os dados não serão afetados.`,
    },
    geoPackageCategory: 'Esta categoria tem capacidades geográficas',
    geoPackageCategoryInfo: `Esta categoria possui uma propriedade extra chamada '${locationItemExtraDefName}', que permite exportá-la como um arquivo GeoPackage.`,
    samplingPointDataCategoryType: 'Esta é a categoria de Dados de Ponto Amostral',
    samplingPointDataCategoryTypeInfo: `Esta é uma categoria predefinida para dados de ponto amostral. Ela possui uma propriedade extra chamada '${locationItemExtraDefName}', que permite exportá-la como um arquivo GeoPackage.`,
    samplingPointDataCategoryLocationMissing: `A propriedade extra '${locationItemExtraDefName}' está ausente`,
    createCategory: {
      menuLabel: 'Adicionar categoria',
      simple: 'Categoria simples',
      otherTypes: 'Mais tipos de categoria',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Categoria de Dados de Ponto Amostral',
      description:
        'Categoria predefinida para dados de ponto amostral, incluindo um campo de localização para cada item.',
      message: `Criar uma nova categoria de Dados de Ponto Amostral?

Uma propriedade extra '${locationItemExtraDefName}' será adicionada aos itens.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Categoria com capacidades geográficas',
      description:
        'Adiciona um campo de localização aos itens, para que a categoria possa ser exportada como um arquivo GeoPackage.',
      message: `Criar uma nova categoria com capacidades geográficas?

Uma propriedade extra '${locationItemExtraDefName}' será adicionada aos itens.`,
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
    exportToGeoPackage: 'Exportar para GeoPackage',
    exportToGeoPackageSkippedItems: '{{count}} item(ns) sem localização válida foram ignorados.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Gerar análise Whisp',
      confirmMessage: `Gerar a análise Whisp para todos os pontos amostrais?

- cada ponto amostral com uma localização será enviado ao Open Foris Whisp para a análise
- os resultados serão combinados com os dados dos pontos amostrais e armazenados na categoria '${samplingPointDataWhispCategoryName}'
- se a categoria '${samplingPointDataWhispCategoryName}' já existir, o seu conteúdo será substituído
- a análise é executada em segundo plano e pode levar vários minutos, dependendo do número de pontos amostrais`,
    },
    templateFor_samplingPointDataImport_csv: 'Modelo para importação de dados de ponto amostral (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Modelo para importação de dados de ponto amostral (Excel)',
  },
  extraProp: {
    label: 'Propriedade extra',
    label_other: 'Propriedades extras',
    addExtraProp: 'Adicionar propriedade extra',
    dataTypes: {
      geometryPoint: 'Ponto geométrico',
      number: 'Número',
      text: 'Texto',
    },
    editor: {
      title: 'Editar $t(extraProp.label_other)',
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
    areaOfInterestEditor: {
      areaOfInterest: 'Área de interesse',
      areasOfInterestNotDefined:
        'Ainda não há áreas de interesse definidas: defina-as em Informações do inquérito → Mapa',
    },
    coordinateAttribute: 'Atributo de coordenadas',
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
      'editable-if': 'editável se',
      'max-count': 'contagem máxima',
      'min-count': 'contagem mínima',
      'relevant-if': 'relevante se',
      validations: 'regra de validação',
      'validations-apply-if': 'aplicar regra de validação se',
      'visible-if': 'visível se',
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
    arenaVideoTutorialsInFaoElearningAcademy:
      '<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>',
    arenaVideoTutorialsInYouTube:
      '<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>',
    arenaInGitHub:
      '<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>',
    arenaRScriptsInGitHub:
      '<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>',
  },
  aiExpression: {
    title: 'Gerar expressão a partir de uma descrição',
    hint: 'Descreva em linguagem simples o que a expressão deve fazer. A IA irá traduzi-la para a sintaxe do Arena. Pressione Ctrl+Enter para gerar.',
    placeholder: 'ex.: a altura da árvore deve ser maior que 0 e menor que 200',
    generate: 'Gerar',
    generating: 'Gerando…',
    use: 'Usar esta expressão',
    useAnyway: 'Usar mesmo assim',
    tryAgain: 'Tentar uma descrição diferente',
    parseError:
      'A expressão gerada não pôde ser analisada corretamente: {{message}}. Você ainda pode aplicá-la e editá-la manualmente, ou tentar reformular.',
    explain: {
      title: 'Explicar esta expressão',
      thinking: 'Pedindo à IA para explicar esta expressão…',
      error: 'Falha ao obter a explicação: {{message}}',
      timeout: 'A IA demorou demais para responder. Tente novamente.',
    },
  },

  aiBatch: {
    translateTitle: 'IA: Traduzir rótulos',
    dataDictionaryTitle: 'IA: Descrições dos campos',
    preparing: 'Preparando…',
    progress: '{{done}} de {{total}} pedidos à IA concluídos',
    stop: 'Parar',
    stopping: 'Parando…',
    confirmStop: 'Parar a execução da IA? Os resultados obtidos até agora são mantidos.',
    keepRunning: 'Continuar',
    stoppedCancelled:
      'Interrompido após {{done}} de {{total}} pedidos à IA. Os resultados obtidos até agora são mantidos.',
    stoppedError:
      'Interrompido após {{done}} de {{total}} pedidos à IA ({{message}}). Os resultados obtidos até agora são mantidos.',
  },

  aiTranslation: {
    translateButton_one: 'Traduzir para {{count}} outro idioma',
    translateButton_other: 'Traduzir para {{count}} outros idiomas',
    translateButton: 'Traduzir para outros idiomas',
    success_one: 'Traduzido para {{count}} idioma. Revise e salve.',
    success_other: 'Traduzido para {{count}} idiomas. Revise e salve.',
    success: 'Traduzido. Revise e salve.',
    failed: 'Falha na tradução: {{message}}',
  },
  aiActivityLog: {
    title: 'Resumo do log de atividades',
    summarizeButton: 'Resumir',
    thinking: 'Agregando eventos e pedindo à IA para resumir…',
    error: 'Falha ao obter o resumo: {{message}}',
  },

  aiEngine: {
    unavailableTitle: 'Indisponível',
    unavailable: {
      policyForbids: 'A política de IA da pesquisa não permite este provedor para estes dados.',
      notAvailable: 'O provedor de IA escolhido não está disponível no momento.',
      missingOnThisBrowser: 'Seu provedor padrão está em outro computador.',
      notSetUp: 'Nenhum provedor de IA está configurado. Adicione um nas configurações de IA.',
      invalidAddress:
        'O endereço do seu servidor de IA local não é válido (sem usuário, senha, ? ou #). Corrija-o nas suas configurações de IA.',
    },
    localAddressInvalid: 'O endereço não pode conter usuário, senha, ? ou #.',
    action: {
      retry: 'Tentar novamente',
      changePolicy: 'Alterar a política de IA da pesquisa',
      openSettings: 'Abrir as configurações de IA',
    },
    consent: {
      title: 'Usar seu servidor de IA local?',
      destination: 'As solicitações desta pesquisa irão para {{baseUrl}} ({{location}}).',
      destinationNoSurvey: 'As solicitações irão para {{baseUrl}} ({{location}}).',
      model: 'Modelo: {{modelId}}',
      continue: 'Continuar',
      chooseOther: 'Escolher outro provedor',
      sends: 'Isso enviará {{what}}.',
      revokeHint: 'Você permitiu que o Arena envie solicitações a este servidor.',
      revoke: 'Revogar permissão',
      revoked: 'Permissão revogada. O Arena perguntará novamente antes da próxima solicitação.',
    },
  },

  aiAnalysis: {
    area: 'Análise',
    empty:
      'Pergunte sobre os dados do levantamento: por exemplo, "Altura média das árvores por parcela". Proponho consultas que pode abrir no Explorador.',
    queryCard: {
      title: 'Consulta {{queryId}}',
      columns: 'Colunas',
      filter: 'Filtro',
      openInExplorer: 'Abrir no Explorador',
      showAsChart: 'Mostrar como gráfico',
      missing: 'Esta consulta já não está disponível.',
    },
    recordDataNotice: {
      message:
        'Esta conversa contém dados de registros. Continue com um servidor de IA local ou inicie uma nova conversa.',
      newConversation: 'Nova conversa',
    },
  },

  aiCleaning: {
    area: 'Limpeza',
    empty:
      'Pergunte-me sobre erros de validação ou valores suspeitos. Eu proponho edições de registros; você as revisa e aplica.',
    rowAction: {
      askAssistant: 'Perguntar ao assistente',
      question: 'Por que este valor é inválido e como posso corrigi-lo?',
    },
    card: {
      empty: '(vazio)',
      newErrors: 'Novos erros neste registro: {{count}}',
      applySelected: 'Aplicar selecionados ({{count}})',
      retryFailed: 'Tentar novamente os que falharam ({{count}})',
      applying: 'Aplicando… {{done}} de {{total}}',
      counts: 'Aplicados: {{applied}} · Conflitos: {{conflict}} · Falhas: {{failed}}',
    },
    badge: {
      fixes: 'Corrige o erro',
      stillInvalid: 'Continua inválido',
      noErrors: 'Sem erros',
    },
    result: {
      applied: 'Aplicado',
      conflict: 'Não aplicado: o valor mudou desde a proposta',
      failed: 'Falhou: {{message}}',
      skipped: 'Ignorado',
    },
  },
  aiAssistant: {
    open: 'Assistente de IA',
    title: 'Assistente de IA',
    close: 'Fechar',
    providerChip: {
      answerWith: 'Responder com',
      makeDefault: 'Tornar meu padrão',
      manage: 'Gerenciar provedores…',
      none: 'Nenhum provedor · Adicionar um',
      missing: 'O provedor padrão não está neste computador',
      removedNotice: 'O provedor desta conversa foi removido. Usando o seu padrão.',
      chooseAnother: 'Escolher outro provedor',
      defaultFailed: 'Não foi possível alterar o provedor padrão: {{message}}',
      title: 'Provedor de IA desta conversa: {{name}}',
      isDefault: 'padrão',
    },
    tabs: {
      design: 'Design',
      help: 'Ajuda',
    },
    unavailable: {
      noSurvey: 'Abra um inventário para usar esta área.',
      noPermission: 'Você precisa de permissão para editar o inventário.',
      policy: 'A política de IA do inventário não permite o provedor de IA configurado.',
    },
    menu: {
      label: 'Menu do assistente',
      newConversation: 'Nova conversa',
      aiSettings: 'Configurações de IA…',
      deleteAll: 'Excluir todas as conversas…',
    },
    historyTitle: 'Conversas',
    newConversationTitle: 'Nova conversa',
    noSuggestions: 'Não há sugestões.',
    historyEmpty: 'Nenhuma conversa salva.',
    historyKept:
      'As últimas {{count}} conversas de cada inventário ficam salvas neste navegador até que você as exclua.',
    back: 'Voltar',
    deleteAllConfirm:
      'Excluir todas as suas conversas com o assistente de IA, em todos os inventários e todas as áreas? Não é possível desfazer.',
    start: {
      suggestions: 'Sugestões',
      recent: 'Conversas recentes',
      seeAll_one: 'Ver {{count}} conversa',
      seeAll_many: 'Ver as {{count}} conversas',
      seeAll_other: 'Ver as {{count}} conversas',
      seeAllSuggestions_one: 'Ver {{count}} sugestão',
      seeAllSuggestions_many: 'Ver as {{count}} sugestões',
      seeAllSuggestions_other: 'Ver as {{count}} sugestões',
    },
    conversations: 'Conversas',
    searchConversations: 'Pesquisar conversas',
    historyNoMatch: 'Nenhuma conversa corresponde.',
    deleteConversation: 'Excluir conversa',
    day: {
      today: 'Hoje',
      yesterday: 'Ontem',
      earlier: 'Anteriores',
    },
    sentData: {
      ariaLabel: 'Dados enviados: {{label}}',
      questions: {
        label: 'Somente perguntas',
        tooltip: 'Somente suas perguntas são enviadas, com trechos do manual do Arena. Nenhum conteúdo do inventário.',
      },
      schema: {
        label: 'Estrutura do inventário',
        tooltip:
          'A estrutura do inventário é enviada: entidades, atributos, categorias e rótulos. Nenhum dado dos registros.',
      },
      data: {
        label: 'Dados dos registros',
        tooltip: 'Dados dos registros são enviados, junto com a estrutura do inventário.',
      },
    },
    emptyDesign:
      'Peça-me para adicionar atributos ou escrever rótulos ou expressões. Eu proponho as alterações; você as aplica.',
    emptyHelp: 'Pergunte-me qualquer coisa sobre o Open Foris Arena. Respondo com base no manual do usuário.',
    placeholder: 'Digite sua mensagem…',
    send: 'Enviar',
    stop: 'Parar',
    retry: 'Tentar novamente',
    stopped: 'Interrompido.',
    thinking: 'Raciocínio',
    thinkingActive: 'Pensando…',
    inMemoryOnly: 'Este navegador não pode armazenar conversas: elas são perdidas ao recarregar a página.',
    context: {
      label: 'Contexto usado por esta conversa',
      tokens: '{{used}} tokens',
      tokensOfWindow: '{{used}} / {{window}} tokens',
      assumed: '(presumido)',
      nearLimit: 'Perto do limite.',
      trimmed: 'As mensagens mais antigas não são mais enviadas ao modelo.',
    },
    tools: {
      survey_getOverview: 'Leu a estrutura do inventário',
      nodeDef_get: 'Consultou {{name}}',
      nodeDef_search: 'Pesquisou "{{text}}"',
      survey_getValidation: 'Verificou os erros de design',
      view_getCurrent: 'Verificou a visualização atual',
      conversation_setTitle: 'Deu um título à conversa',
      expression_check: 'Verificou uma expressão',
      nodeDef_proposeCreate: 'Preparou novos itens',
      nodeDef_proposeUpdate: 'Preparou alterações de propriedades',
      labels_proposeSet: 'Preparou rótulos',
      expressions_proposeSet: 'Preparou expressões',
      survey_listMissingTexts: 'Listou os textos em falta',
      categories_list: 'Listou as categorias',
      taxonomies_list: 'Listou as taxonomias',
      docs_search: 'Pesquisou "{{query}}" no manual',
      query_listEntities: 'Listou as entidades',
      category_findItems: 'Pesquisou itens de categoria',
      query_propose: 'Preparou uma consulta',
      query_count: 'Contou as linhas de uma consulta',
      query_run: 'Executou uma consulta',
      records_countByStep: 'Contou os registros por etapa',
      records_countOverTime: 'Contou os registros ao longo do tempo',
      validation_summarize: 'Resumiu os erros de validação',
      validation_list: 'Listou erros de validação',
      record_getValues: 'Leu valores do registro',
      records_proposeEdits: 'Preparou edições de registros',
      categoryItems_listMissingLabels: 'Listou rótulos de categorias a traduzir',
      categoryItemLabels_proposeSet: 'Preparou rótulos de categorias',
      default: 'Usou uma ferramenta',
      failed: 'Falhou',
      interrupted: 'Interrompido',
    },
    card: {
      title: 'Alterações propostas',
      stale: 'O inventário mudou desde esta proposta.',
      applySelected: 'Aplicar selecionadas',
      discard: 'Descartar',
      discarded: 'Descartado.',
      saveCurrentEditFirst: 'Primeiro salve ou cancele sua edição atual.',
      selectOperation: 'Aplicar esta alteração',
      empty: '(vazio)',
      added: 'Adicionado',
      removed: 'Removido',
      yes: 'Sim',
      no: 'Não',
      newItem: 'Novo: {{type}}',
      categoryItem: 'Item {{ref}} ({{level}})',
      changes_one: '{{count}} alteração',
      changes_many: '{{count}} alterações',
      changes_other: '{{count}} alterações',
      more: '+ {{count}} mais',
      reviewAll: 'Rever tudo ({{count}})',
      applyAll: 'Aplicar tudo',
      applySelectedCount: 'Aplicar selecionados ({{count}})',
      review: {
        title: 'Rever as alterações propostas',
        search: 'Pesquisar alterações',
        groupBy: 'Agrupar por',
        byEntity: 'Entidade',
        byField: 'Alteração',
        show: 'Mostrar',
        groups: 'Grupos',
        all: 'Todas ({{count}})',
        selected: 'Selecionadas ({{count}})',
        conflicts: 'Conflitos ({{count}})',
        allChanges: 'Todas as alterações',
        item: 'Item',
        change: 'Alteração',
        current: 'Atual',
        proposed: 'Proposto',
        status: 'Estado',
        selectShown: 'Selecionar as alterações mostradas',
        selectGroup: 'Selecionar {{name}}',
        selectedOf: '{{selected}} de {{total}} selecionadas',
        noMatch: 'Nenhuma alteração corresponde.',
        close: 'Fechar',
        discardAll: 'Descartar tudo',
        categoryGroup: 'Categoria {{name}}',
      },
      label: 'Rótulo ({{lang}})',
      description: 'Descrição ({{lang}})',
      status: {
        applied: 'Aplicado',
        conflict: 'Conflito',
        failed: 'Falhou',
        skipped: 'Ignorado',
      },
      props: {
        name: 'Nome',
        key: 'Chave',
        multiple: 'Múltiplo',
        readOnly: 'Somente leitura',
        categoryUuid: 'Categoria',
        taxonomyUuid: 'Taxonomia',
      },
      expressionProps: {
        defaultValues: 'Valores padrão',
        applicable: 'Relevante se',
        validations: 'Validações',
        visibleIf: 'Visível se',
        editableIf: 'Editável se',
      },
    },
    issues: {
      typeNotAllowed: 'O assistente não pode criar itens do tipo {{type}}.',
      parentNotFound: 'Não há nenhuma entidade chamada {{name}}.',
      parentNotEntity: '{{name}} não é uma entidade.',
      entityUnderTable: 'Não é possível adicionar uma entidade a {{name}}, que é exibida como tabela.',
      nodeDefNotFound: 'Não há nenhum item chamado {{name}}.',
      languageNotInSurvey: 'O inventário não tem o idioma {{lang}}.',
      entityMultipleChange: 'Altere "múltiplo" de uma entidade no designer de formulários.',
      multipleWithDefaultValues: 'Um atributo com valores padrão não pode ser múltiplo.',
      multipleNotAllowed: 'A definição «múltiplo» de {{name}} não pode ser usada neste tipo de item.',
      multipleEditDisabled:
        'A definição «múltiplo» de {{name}} não pode ser alterada (está publicado, é chave, é só de leitura ou está numa tabela).',
      keyNotAllowed: '{{name}} não pode ser um atributo chave.',
      keyEditDisabled:
        '{{name}} não pode passar a chave nem deixar de ser (é múltiplo, ou o limite de chaves foi atingido).',
      duplicateOperation: 'A mesma propriedade de {{name}} é alterada duas vezes.',
      singleExpressionOnly: 'Esta propriedade aceita apenas uma expressão.',
      expressionEmpty: 'Uma expressão está vazia.',
      rootEntity: 'O assistente não pode alterar a entidade raiz.',
      categoryNotFound: 'Não existe a categoria {{name}}.',
      refEditDisabled:
        '{{name}} não pode mudar de categoria ou taxonomia (está publicado, ou outro atributo código depende dele).',
      refHasParentCode:
        '{{name}} depende de um atributo código pai, por isso a sua categoria não pode ser alterada aqui. Altere-a no designer.',
      nodeDefInvalid:
        '{{name}} deixaria de ser válido com estas alterações, por isso nenhuma das suas alterações é aplicada.',
      expressionInvalid: 'Expressão inválida: {{text}}',
    },
  },

  aiPolicy: {
    dataClass: {
      schema: 'a estrutura do inventário',
      data: 'os dados dos registros',
    },
    hostingClass: {
      onDevice: 'este dispositivo',
      orgHosted: 'um servidor da organização',
      cloud: 'a nuvem',
      unknown: 'um serviço de IA desconhecido',
    },
    level: {
      off: 'Desativado',
      onDevice: 'Neste dispositivo',
      orgHosted: 'Servidor da organização',
      cloud: 'Nuvem',
    },
    blocked: {
      schema: {
        off: 'A política de IA deste inventário não permite usar IA na estrutura do inventário.',
        onDevice: 'A política de IA deste inventário mantém a estrutura do inventário neste dispositivo.',
        orgHosted: 'A política de IA deste inventário mantém a estrutura do inventário no servidor da organização.',
      },
      data: {
        off: 'A política de IA deste inventário não permite usar IA nos dados dos registros.',
        onDevice: 'A política de IA deste inventário mantém os dados dos registros neste dispositivo.',
        orgHosted: 'A política de IA deste inventário mantém os dados dos registros no servidor da organização.',
      },
    },
    blockedByInstance: {
      schema: 'Esta instância do Arena não permite enviar a estrutura do inventário para este serviço de IA.',
      data: 'Esta instância do Arena não permite enviar os dados dos registros para este serviço de IA.',
    },
    openPolicyTab: 'Abrir a política de IA',
  },

  aiDataLocation: {
    cloud: 'Nuvem',
    cloudWithProvider: 'Nuvem · {{provider}}',
    orgHosted: 'Servidor da organização',
    onDevice: 'Neste dispositivo',
    onDeviceWithEngine: 'Neste dispositivo · {{engine}}',
    orgHostedWithEngine: 'Servidor da organização · {{engine}}',
    ariaLabel: 'Os dados são processados em: {{location}}',
    modelTitle: '{{location}} ({{model}})',
  },
}
