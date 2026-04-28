export default {
  subPage: 'Subpágina',
  addChildTo: 'Adicionar a {{nodeDefLabel}}',
  addChildToTitle: 'Adicionar novo nó a {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Booleano',
    code: 'Código',
    coordinate: 'Coordenada',
    date: 'Data',
    decimal: 'Número decimal',
    geo: 'Geoespacial',
    entity: 'Tabela ou formulário',
    file: 'Arquivo',
    integer: 'Inteiro',
    taxon: 'Táxon',
    text: 'Texto',
    time: 'Hora',
    // layout elements
    formHeader: 'Cabeçalho do formulário',
  },
  clone: `Clonar '{{nodeDefLabel}}'`,
  compressFormItems: `Comprimir itens do formulário para '{{nodeDefLabel}}'`,
  confirmUpdateDependentEnumeratedEntities: `Se você continuar, algumas entidades enumeradas ({{entityDefs}}) serão reenumeradas,  
apagando os valores existentes inseridos nelas (se houver).  
Continuar?`,
  convert: `Converter '{{nodeDefLabel}}'`,
  delete: `Excluir '{{nodeDefLabel}}'`,
  edit: `Editar '{{nodeDefLabel}}'`,
  schemaSummary_csv: 'Resumo do esquema (CSV)',
  schemaSummary_xlsx: 'Resumo do esquema (Excel)',
  hidePages: 'Ocultar páginas',
  showPages: 'Mostrar páginas',
  move: `Mover '{{nodeDefLabel}}'`,
  movePageUp: 'Mover página para cima',
  movePageDown: 'Mover página para baixo',
  formEditActions: {
    preview: 'Visualizar',
  },
  formEntryActions: {
    confirmDemote: 'Tem certeza de que deseja rebaixar este registro para {{name}}?',
    confirmPromote: `Tem certeza de que deseja **promover este registro para {{name}}**?  
Você não poderá mais editá-lo`,
    confirmPromoteWithErrors: `**Este registro contém erros**.  
$t(surveyForm:formEntryActions.confirmPromote)`,
    confirmDelete: 'Tem certeza de que deseja excluir este registro?\n\n$t(common.cantUndoWarning)',
    closePreview: 'Fechar visualização',
    demoteTo: 'Rebaixar para {{stepPrev}}',
    promoteTo: 'Promover para {{stepNext}}',
    step: 'Etapa {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Colunas',
    confirmConvert: 'Converter o atributo "{{name}}" para "{{toType}}"?',
    confirmDelete:
      'Tem certeza de que deseja excluir permanentemente esta definição de nó: {{ name }}?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: 'Digite código ou rótulo',
    option: 'Opção {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: '$t(common.true)',
        false: '$t(common.false)',
      },
      yesNo: {
        true: '$t(common.yes)',
        false: '$t(common.no)',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Coordenada',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Mostrar no mapa',
    accuracy: 'Precisão',
    altitude: 'Altitude',
    altitudeAccuracy: 'Precisão da altitude',
  },
  nodeDefGeo: {
    confirmDelete: 'Excluir este valor geoespacial?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Arquivo GeoJSON inválido enviado',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Adicionar novo {{name}}',
    confirmDelete: 'Tem certeza de que deseja excluir esta entidade?',
    select: 'Selecione um(a) {{name}}:',
    selectedEntity: '{{name}} selecionado(a):',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Nome científico',
    vernacularName: 'Nome vernacular',
    vernacularNameAlwaysIncludedIfSingle: 'Nome vernacular sempre incluído quando houver apenas um',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Ativado**: se esta opção estiver ativada e um táxon tiver apenas um nome vernacular definido, esse nome vernacular será automaticamente armazenado com os dados quando o táxon for selecionado.  
- **Desativado**: apenas o código do táxon e o nome científico serão armazenados, mesmo que o táxon tenha apenas um nome vernacular.`,
    vernacularNameSelectionKept: 'Seleção do nome vernacular mantida',
    vernacularNameSelectionKeptInfo: `- **Ativado**: quando um táxon é selecionado usando um nome vernacular (comum), o nome vernacular específico usado na busca também será armazenado nos dados.  
- **Desativado**: apenas o código do táxon e o nome científico serão armazenados, independentemente de qual nome vernacular foi usado durante a busca.  
No Arena Mobile:  
- **Ativado**: cada nome vernacular aparece como um item separado na lista de resultados da busca.
- **Desativado**: todos os nomes vernaculares de um táxon são agrupados e exibidos junto ao táxon (combinados em uma única entrada). Como resultado, a lista de autocompletar contém menos itens.`,
    visibleFields: 'Campos visíveis',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Erro ao carregar visualização',
    fileUuid: 'UUID do arquivo',
    fileName: 'Nome do arquivo',
    locationInformationNotFound: 'Informações de localização não encontradas no arquivo',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Todos os nós',
    onlyPages: 'Somente páginas',
  },
  step: {
    entry: 'Entrada',
    cleansing: 'Limpeza',
    analysis: 'Análise',
  },
  confirmNodeDelete: 'Tem certeza de que deseja excluir este(a) {{nodeDefType}} ({{nodeDefLabel}})?',
  exportDocx: 'Exportar levantamento (Word)',
  exportLabels_csv: 'Exportar rótulos (CSV)',
  exportLabels_xlsx: 'Exportar rótulos (Excel)',
  importLabels: 'Importar rótulos de Excel ou CSV',
}
