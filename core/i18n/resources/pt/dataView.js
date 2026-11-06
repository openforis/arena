export default {
  charts: {
    downloadToPng: 'Baixar gráfico para PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Selecione uma dimensão e uma medida para mostrar o gráfico',
      selectAtLeast2NumericAttributes: 'Selecione 2 atributos numéricos para mostrar o gráfico',
      tooManyItemsToShowChart: `Muitos itens para mostrar o gráfico;
esperando o máximo de itens {{maxItems}}.
Refine sua consulta (por exemplo, adicionando um filtro) para reduzir o número de itens.`,
      sampleRandomOnly:
        'Exibindo uma amostra aleatória de {{sampleSize}} de {{totalCount}} itens (nenhum valor atípico encontrado).',
      sampleWithOutliers:
        'Exibindo {{sampleSize}} de {{totalCount}} itens: {{outliersCount}} valores atípicos e uma amostra aleatória de {{randomCount}} dos demais itens.',
      sampleOutliersOnly: 'Exibindo os {{sampleSize}} valores atípicos mais extremos de {{totalCount}} itens.',
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
    ai: {
      button: 'Perguntar à IA',
      buttonTitle: 'Gerar uma consulta a partir de uma descrição usando IA',
      title: 'Gerar uma consulta com IA',
      hint: 'Descreva os dados que deseja ver; a IA selecionará a entidade, os atributos (ou dimensões e medidas), o filtro e a ordenação. Depois, você poderá revisar a consulta gerada e salvá-la no gerenciador de consultas.',
      placeholder: 'ex.: número de árvores agrupadas por espécie',
      generate: 'Gerar',
      generating: 'Gerando…',
      replaceQueryConfirmMessage: 'Substituir a consulta atual pela gerada?',
      suggestSummary: 'Sugerir nome e descrição',
      suggestSummaryFailed: 'Não foi possível sugerir o nome e a descrição da consulta: {{message}}',
      suggestSummaryTitle:
        'Usar IA para sugerir o nome, o rótulo e a descrição da consulta com base nas seleções atuais',
      generatedSuccessfully:
        'Consulta gerada: {{explanation}} Verifique o resultado e salve a consulta se quiser mantê-la.',
    },
    deleteConfirmMessage: 'Excluir a consulta "{{name}}"?',
    displayType: {
      chart: 'Gráfico',
      table: 'Tabela',
    },
    manageQueries: 'Gerenciar consultas',
    mode: {
      aggregate: 'Agregado',
      raw: 'Bruto',
      rawEdit: 'Edição bruta',
    },
    replaceQueryConfirmMessage: 'Substituir a consulta atual pela selecionada?',
    showCodes: 'Mostrar códigos',
    showTotalAndPercentage: 'Mostrar total e percentagem',
    sidebar: {
      addFilter: 'Adicionar filtro',
      addSort: 'Adicionar ordenação',
      aggregateFunctionsOf: 'Funções de agregação de {{name}}',
      customAggregateFunctions: 'Funções de agregação personalizadas…',
      remove: 'Remover {{name}}',
      removeFilter: 'Remover filtro',
      toggleSortOrder: 'Ordem: {{order}} (clique para alterar)',
    },
    total: 'Total',
    viewOptions: 'Visualização',
  },
  editSelectedRecord: 'Editar registro selecionado',
  filterAttributeTypes: 'Filtrar tipos de atributo',
  filterAttributes: 'Filtrar atributos',
  filterMessages: 'Filtrar mensagens',
  messageTypeFilter: {
    valueRequired: 'Valor obrigatório',
    valueInvalid: 'Valor inválido',
    uniqueDuplicate: 'Valor duplicado',
    customValidation: 'Validação personalizada',
    entityKeyDuplicate: 'Chave de entidade duplicada',
    recordKeyDuplicate: 'Chave de registro duplicada',
    nodesCount: 'Contagem de nós',
  },
  filterRecords: {
    buttonTitle: 'Filtrar registros',
    expressionEditorHeader: 'Expressão para filtrar registros',
  },
  invalidRecord: 'Registro inválido',
  nodeDefsSelector: {
    hide: 'Ocultar seletor de definições de nó',
    show: 'Mostrar seletor de definições de nó',
    nodeDefFrequency: `{{nodeDefLabel}} (frequência)`,
    searchPlaceholder: 'Pesquisar variável por nome',
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
    exportSelectedRecordsArenaFormat: 'Exportar registros selecionados (formato Arena)',
    exportRecordDocx: 'Exportar registro (Word)',
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
  dataMatrixExport: {
    intro: `Exporte os dados de **{{entity}}** como uma tabela com:

- uma **linha** para cada valor diferente dos atributos de linha (p. ex. cada espécie e estrato);
- uma **coluna** para cada registro, com o nome da sua chave ({{keys}});
- nas células, o valor do atributo de valor (p. ex. cobertura).

Este é o formato usado por ferramentas de análise de vegetação como Turboveg, Juice e Synbiosys.`,
    layout: {
      dataMatrix: 'Matriz de dados',
      info: 'Tabela: linhas e colunas como mostradas no Explorador de dados. Matriz de dados: uma linha por espécie (ou outro atributo) e uma coluna por registro, como exigido por ferramentas de análise de vegetação como o Turboveg.',
      label: 'Exportar como',
      table: 'Tabela',
    },
    preview: 'Pré-visualização',
    previewRecord: '{{keys}} do registro {{number}}',
    recordKeys: 'Atributos-chave usados para nomear as colunas dos registros',
    recordKeysInfo:
      'Cada registro se torna uma coluna, com o nome formado pelos valores dos atributos-chave selecionados (p. ex. apenas o número da parcela). Por padrão, são usados os atributos-chave selecionados no Explorador de dados, ou todos eles se nenhum estiver selecionado. É necessário pelo menos um.',
    recordsAll:
      'São exportados os dados de todos os registros: defina um filtro no Explorador de dados para exportar apenas alguns.',
    recordsFiltered: 'Apenas os dados que correspondem ao filtro atual do Explorador de dados são exportados.',
    rowAttribute: 'Linhas (nome do atributo de táxon, p. ex. espécie)',
    rowAttributeInfo:
      'Cada valor diferente deste atributo torna-se uma linha da tabela. Os atributos de táxon são exportados com o nome científico, porque todos os táxons não listados têm o mesmo código.',
    secondRowAttribute: 'Segundo atributo de linha, opcional (p. ex. estrato)',
    secondRowAttributeInfo:
      'Use-o quando a mesma espécie puder aparecer mais de uma vez num registro (p. ex. em estratos diferentes): cada combinação torna-se uma linha separada.',
    valueAttribute: 'Valores (p. ex. cobertura)',
    valueAttributeInfo:
      'O valor mostrado nas células. Os atributos de código são exportados com o código, não com o rótulo. Se uma linha aparecer mais de uma vez num registro com valores diferentes, a célula contém todos eles.',
  },
  dataVis: {
    errorLoadingData: 'Erro ao carregar dados',
    noData: 'Esta consulta não retornou dados',
    noSelection:
      'Faça sua seleção usando o painel esquerdo ou selecione uma consulta existente em "Gerenciar consultas"',
  },
  viewSelectedRecord: 'Visualizar registro selecionado',
  mapView: {
    layersControl: {
      areasOfInterest: 'Áreas de interesse',
      baseLayers: 'Camadas base',
      inputData: 'Dados de entrada',
      preloadedLayers: 'Camadas pré-carregadas',
      samplingPointData: 'Dados de pontos de amostragem',
    },
    layersPanel: {
      markers: '{{count}} marcadores',
      markers_one: '{{count}} marcador',
      markers_other: '{{count}} marcadores',
    },
  },
}
