export default {
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
}
