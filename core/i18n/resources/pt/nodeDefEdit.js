export default {
  additionalFields: 'Campos adicionais',
  basic: 'Básico',
  advanced: 'Avançado',
  mobileApp: 'Aplicativo móvel',
  print: 'Impressão',
  printProps: {
    printOrientation: {
      label: 'Orientação da página',
      info: 'Orientação usada quando esta entidade inicia sua própria seção imprimível. Por padrão, herda a orientação do documento escolhida na exportação.',
    },
    orientations: {
      default: 'Padrão (documento)',
      portrait: 'Retrato',
      landscape: 'Paisagem',
    },
  },
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
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
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
    prevCycleNote:
      'Funciona apenas no Arena Mobile quando múltiplos ciclos são definidos e o vínculo ao ciclo anterior está habilitado',
    prevCycleValue:
      'Retorna o valor do mesmo atributo no registro do ciclo anterior. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Retorna os valores dos mesmos atributos no registro do ciclo anterior. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Retorna o ciclo do registro atual',
    recordDateCreated:
      'Retorna a data e hora de criação do registro atual como valor datetime. Pode ser usada em atributo de texto, data ou hora',
    recordDateLastModified:
      'Retorna a data e hora da última modificação do registro atual como valor datetime. Pode ser usada em atributo de texto, data ou hora',
    recordOwnerEmail: 'Retorna o email do usuário proprietário do registro',
    recordOwnerName: 'Retorna o nome do usuário proprietário do registro',
    recordOwnerRole: 'Retorna o papel (no inventário atual) do usuário proprietário do registro',
    rowIndex: 'Retorna o índice atual da linha da tabela (ou formulário)',
    taxonProp:
      "Retorna o valor da propriedade especificada de um táxon com o código informado: code, family, genus, scientificName, um nome vernacular (usando o código do idioma como nome da propriedade, ex. 'swa') ou uma $t(extraProp.label)",
    taxonVernacularName:
      'Retorna o (primeiro) nome vernacular (ou local) no idioma especificado de um táxon com o código informado',
    unique: 'Retorna os valores únicos de um atributo múltiplo ou entidade',
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
    autoCreateMinCountItems: {
      label: 'Criar mínimo de itens automaticamente',
      info: 'Quando a entidade se torna relevante ou sua entidade pai é criada, um número de entidades igual ao mínimo será gerado automaticamente.',
    },
    displayAs: 'Exibir como',
    displayIn: 'Exibir em',
    entitySource: 'Origem da entidade',
    enumerate: {
      label: 'Enumerar',
      info: `As linhas serão geradas automaticamente usando os itens de categoria associados a um atributo de código marcado como Chave definido dentro da entidade; as linhas não podem ser adicionadas nem excluídas e o atributo de código-chave não será editável`,
    },
    enumeratingItemsExpression: {
      label: 'Expressão dos itens de enumeração',
      info: 'Expressão opcional que filtra quais itens da categoria são enumerados (ex.: unique(table_source.source_type)). Quando vazia, todos os itens da categoria são usados.',
    },
    enumerator: {
      label: 'Enumerador',
      info: 'Os itens da categoria serão usados para gerar as linhas da entidade pai',
    },
    form: 'Formulário',
    formula: 'Fórmula',
    includedInClonedData: 'Incluído nos dados clonados',
    includedInMultipleEntitySummary: {
      label: 'Incluir no resumo da entidade múltipla',
      info: `Se marcado, o valor do atributo ficará visível no seletor de entidades e na tela de resumo da entidade`,
    },
    includedInRecordsList: {
      label: 'Incluir na lista de registros',
      info: `Se marcado, o atributo ficará visível na lista de registros`,
    },
    key: 'Chave',
    maxKeysCountReached: 'Número máximo de chaves atingido ({{maxKeysCount}})',
    multiple: 'Múltiplo',
    ownPage: 'Página própria',
    parentPage: 'Página pai ({{parentPage}})',
    qualifier: {
      label: 'Qualificador',
      info: `Quando um novo registro é criado por um usuário pertencente a um grupo, este atributo será automaticamente preenchido com o valor especificado para ele nos qualificadores do grupo do usuário. Os usuários só poderão ver e modificar registros pertencentes ao seu próprio grupo, se pertencerem a um.`,
    },
    table: 'Tabela',
  },
  advancedProps: {
    defaultValuesNotSpecified: 'Valores padrão não especificados',
    defaultValuesSpecified: 'Valores padrão especificados',
    editableAlways: 'Sempre editável',
    editableIfConditionIsMet: 'Editável quando a condição é atendida',
    relevantIfRadioNone: 'Sempre relevante',
    relevantIfRadioDefined: 'Relevante quando a condição é atendida',
    visibleAlways: 'Sempre visível',
    visibleIfConditionIsMet: 'Visível quando a condição é atendida',
    areaBasedEstimate: 'Estimativa baseada em área',
    defaultValues: 'Valores padrão',
    defaultValuesInfo: `Isto permite preencher automaticamente uma resposta com base em regras específicas.
    Se você configurar várias regras, o sistema irá verificá-las em ordem, de cima para baixo.
    Ele aplicará a primeira regra que atender às condições e usará esse resultado como resposta.`,
    defaultValueEvaluatedOneTime: 'Valor padrão avaliado apenas uma vez',
    defaultValueEvaluatedOneTimeInfo: `O valor padrão será avaliado apenas uma vez, quando o atributo for criado.
    Se não estiver marcado, o valor padrão será reavaliado toda vez que o registro for atualizado.
    Deve ser marcado ao usar expressões como now() ou uuid(), que devem ser avaliadas apenas uma vez, quando o valor do atributo for gerado pela primeira vez.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Valores padrão não editáveis porque a chave auto incremental está definida',
    editableIf: 'Editável se',
    editableIfInfo: `Por padrão, um usuário sempre pode acessar um campo relevante.
Aqui podemos definir uma regra para indicar se o usuário pode digitar ou alterar este campo.
Isto define se um usuário pode digitar ou alterar este campo.
Se as condições definidas forem atendidas, o campo pode ser editado. Caso contrário, ele fica somente leitura (bloqueado).`,
    hidden: 'Sempre oculto',
    hiddenInReport: 'Ocultar no Painel Analítico',
    hiddenInReportInfo: `Se marcado, o atributo não ficará visível no Painel Analítico`,
    hiddenWhenNotRelevant: 'Oculto quando não relevante',
    itemsFilter: 'Filtro de itens',
    itemsFilterInfo: `Expressão usada para filtrar itens selecionáveis.
    Na expressão, a palavra "this" se referirá ao próprio item. 
    Ex.: this.region = region_attribute_name 
    (onde "region" é o nome de uma propriedade extra definida para o item e region_attribute_name é o nome de um atributo no inventário)`,
    readOnly: 'Somente leitura',
    relevantIf: 'Relevante se',
    relevantIfInfo: `Por padrão, todos os campos ficam ativos.
    Se você definir uma regra de relevância e ela não for atendida, o campo ficará cinza ou será ocultado por completo,
    e respostas automáticas serão ignoradas.
    Use isso para mostrar ou ocultar partes do formulário dinamicamente; por exemplo, mostrar "Especifique" apenas quando o usuário selecionar "Outro".`,
    script: 'Script',
    visibleIf: 'Visível se',
    visibleIfInfo: `Por padrão, um campo é sempre visível.
    Se você definir uma regra, ele só será visível quando essa regra for atendida; caso contrário, ficará oculto.
    Observação: diferente de ocultar um campo "não relevante", um campo oculto ainda pode salvar uma resposta automática.
    Isso é útil para ocultar seções inteiras do formulário com base em quem está logado (por exemplo, por função).`,
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Oculto no Arena Mobile',
      info: `Se marcado, o atributo não ficará visível no AM`,
    },
    includedInPreviousCycleLink: {
      label: 'Incluir no link para ciclo anterior',
      info: `Se marcado, o valor do ciclo anterior será exibido no formulário de entrada de dados (quando o link para o ciclo anterior estiver ativo no app móvel)`,
    },
  },
  numericProps: {
    unit: 'Unidade',
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
  timeProps: {
    includeSeconds: 'Incluir segundos',
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
      text: 'Texto',
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
    mapMarkerColor: 'Cor do marcador no mapa',
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
    expressions: 'Expressões de validação',
    attributeAlwaysValid: 'Atributo sempre válido',
    attributeValidWhenConditionIsMet: 'Atributo válido quando a condição é atendida',
    notRequired: 'Não obrigatório',
    alwaysRequired: 'Sempre obrigatório',
    requiredWhenConditionIsMet: 'Obrigatório quando a condição é atendida',
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
  nodeDefClonedSuccessfully: 'Definição de nó "{{nodeDefName}}" clonada com sucesso em "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: 'As seguintes categorias também foram clonadas do inventário de origem: {{names}}',
  taxonomiesClonedFromSurvey: 'As seguintes taxonomias também foram clonadas do inventário de origem: {{names}}',
}
